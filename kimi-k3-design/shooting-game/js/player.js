import * as THREE from 'three';
import { PLAYER } from './config.js';
import { clamp, damp, lerp } from './utils.js';

// ============ Player: FPS movement, camera rig, health ============
export class Player {
  constructor(camera) {
    this.camera = camera;
    this.pos = new THREE.Vector3(0, 0, 14);   // feet
    this.vel = new THREE.Vector3();
    this.yaw = Math.PI;                        // face arena center
    this.pitch = 0;
    this.onGround = true;
    this.maxHp = PLAYER.maxHp;
    this.hp = this.maxHp;
    this.alive = true;

    this.bobPhase = 0;
    this.bobAmp = 0;
    this.stepTimer = 0;
    this.landDip = 0;
    this.speedFrac = 0;      // 0..1 of sprint speed, drives crosshair/bob
    this.sprinting = false;
    this.baseFov = 75;
    this.fovMult = 1;        // sprint kick / ads zoom multiply from outside
  }

  reset() {
    this.pos.set(10, 0, 18);
    this.vel.set(0, 0, 0);
    this.yaw = 0.507; // face arena center from spawn
    this.pitch = 0;
    this.hp = this.maxHp;
    this.alive = true;
    this.landDip = 0;
  }

  look(dx, dy) {
    if (!this.alive) return;
    this.yaw -= dx;
    this.pitch = clamp(this.pitch - dy, -1.45, 1.45);
  }

  update(dt, input, world, audio, effects) {
    if (!this.alive) return;

    // --- wish direction ---
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const wish = new THREE.Vector3();
    if (input.down('KeyW')) wish.add(fwd);
    if (input.down('KeyS')) wish.sub(fwd);
    if (input.down('KeyD')) wish.add(right);
    if (input.down('KeyA')) wish.sub(right);
    const moving = wish.lengthSq() > 0;
    if (moving) wish.normalize();

    this.sprinting = input.down('ShiftLeft') && input.down('KeyW') && this.onGround;
    const maxSpeed = this.sprinting ? PLAYER.sprintSpeed : PLAYER.walkSpeed;

    // --- acceleration & friction ---
    const accel = this.onGround ? PLAYER.accel : PLAYER.airAccel;
    if (moving) {
      this.vel.x += wish.x * accel * dt;
      this.vel.z += wish.z * accel * dt;
    }
    if (this.onGround) {
      const f = Math.max(0, 1 - PLAYER.friction * dt * (moving ? 0.35 : 1));
      this.vel.x *= f;
      this.vel.z *= f;
    }
    const hSpeed = Math.hypot(this.vel.x, this.vel.z);
    if (hSpeed > maxSpeed) {
      const s = maxSpeed / hSpeed;
      this.vel.x *= s;
      this.vel.z *= s;
    }

    // --- gravity & jump ---
    this.vel.y -= PLAYER.gravity * dt;
    if (input.down('Space') && this.onGround) {
      this.vel.y = PLAYER.jumpVel;
      this.onGround = false;
      audio.jump();
    }

    // --- integrate & collide ---
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    world.collide(this.pos, PLAYER.radius);
    this.pos.y += this.vel.y * dt;
    if (this.pos.y <= 0) {
      if (!this.onGround && this.vel.y < -9) {
        audio.land();
        effects.shake(0.12);
        this.landDip = Math.min(0.16, -this.vel.y * 0.011);
      }
      this.pos.y = 0;
      this.vel.y = 0;
      this.onGround = true;
    }

    // --- head bob & steps ---
    this.speedFrac = clamp(hSpeed / PLAYER.sprintSpeed, 0, 1);
    if (this.onGround && hSpeed > 0.8) {
      this.bobPhase += dt * (6 + this.speedFrac * 7);
      this.bobAmp = damp(this.bobAmp, 0.038 + this.speedFrac * 0.03, 8, dt);
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        audio.step();
        this.stepTimer = lerp(0.42, 0.27, this.speedFrac);
      }
    } else {
      this.bobAmp = damp(this.bobAmp, 0, 10, dt);
    }
    this.landDip = damp(this.landDip, 0, 9, dt);

    // --- camera ---
    const bobY = Math.abs(Math.sin(this.bobPhase)) * this.bobAmp;
    const bobX = Math.cos(this.bobPhase * 0.5) * this.bobAmp * 0.6;
    this.camera.position.set(
      this.pos.x + bobX * Math.cos(this.yaw),
      this.pos.y + PLAYER.height + bobY - this.landDip,
      this.pos.z - bobX * Math.sin(this.yaw)
    );
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');

    // sprint FOV kick (ads zoom handled by weapons via fovMult)
    const targetFov = this.baseFov * this.fovMult + (this.sprinting ? 6 : 0);
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = damp(this.camera.fov, targetFov, 10, dt);
      this.camera.updateProjectionMatrix();
    }
  }

  takeDamage(n, audio, effects) {
    if (!this.alive) return false;
    this.hp -= n;
    audio.hurt();
    effects.shake(clamp(0.25 + n * 0.012, 0, 0.6));
    effects.damageFlash(clamp(0.35 + n * 0.02, 0, 0.85));
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return true; // died
    }
    return false;
  }

  heal(n) {
    if (!this.alive || this.hp >= this.maxHp) return false;
    this.hp = Math.min(this.maxHp, this.hp + n);
    return true;
  }

  get eyePos() {
    return new THREE.Vector3(this.pos.x, this.pos.y + PLAYER.height, this.pos.z);
  }
}
