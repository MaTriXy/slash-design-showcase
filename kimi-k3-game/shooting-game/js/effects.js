import * as THREE from 'three';
import { rand, clamp } from './utils.js';

const MAX_PARTICLES = 1600;
const MAX_TRACERS = 24;

// ============ Effects: particles, tracers, screen shake, popups ============
export class Effects {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.trauma = 0;
    this.shakeT = 0;

    // ---- particle pool ----
    this.pCount = MAX_PARTICLES;
    this.pAlive = 0;
    this.pPos = new Float32Array(this.pCount * 3);
    this.pCol = new Float32Array(this.pCount * 3);
    this.pVel = new Float32Array(this.pCount * 3);
    this.pLife = new Float32Array(this.pCount);
    this.pMaxLife = new Float32Array(this.pCount);
    this.pGrav = new Float32Array(this.pCount);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.pCol, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 500); // skip recompute
    const mat = new THREE.PointsMaterial({
      size: 0.13, vertexColors: true, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);

    // ---- tracer pool ----
    this.tracers = [];
    const tGeo = new THREE.BoxGeometry(0.025, 0.025, 1);
    for (let i = 0; i < MAX_TRACERS; i++) {
      const m = new THREE.Mesh(tGeo, new THREE.MeshBasicMaterial({
        color: 0xffe9a3, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      m.visible = false;
      scene.add(m);
      this.tracers.push({ mesh: m, life: 0 });
    }

    // vignette elements
    this.dmgEl = document.getElementById('damage-vignette');
    this.healEl = document.getElementById('heal-flash');
    this.popupLayer = document.getElementById('popup-layer');
    this._dmg = 0;
    this._heal = 0;
    this._v3 = new THREE.Vector3();
  }

  // ---- particles ----
  _spawn(x, y, z, vx, vy, vz, r, g, b, life, grav) {
    if (this.pAlive >= this.pCount) return;
    const i = this.pAlive++;
    this.pPos[i * 3] = x; this.pPos[i * 3 + 1] = y; this.pPos[i * 3 + 2] = z;
    this.pVel[i * 3] = vx; this.pVel[i * 3 + 1] = vy; this.pVel[i * 3 + 2] = vz;
    this.pCol[i * 3] = r; this.pCol[i * 3 + 1] = g; this.pCol[i * 3 + 2] = b;
    this.pLife[i] = this.pMaxLife[i] = life;
    this.pGrav[i] = grav;
  }

  _burst(pos, { count, color, color2 = null, speed = 5, life = 0.6, up = 2, grav = 9, spreadDir = null }) {
    const c1 = new THREE.Color(color);
    const c2 = color2 ? new THREE.Color(color2) : c1;
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const r = c1.r + (c2.r - c1.r) * t, g = c1.g + (c2.g - c1.g) * t, b = c1.b + (c2.b - c1.b) * t;
      const a = rand(0, Math.PI * 2), e = rand(-0.5, 1);
      const sp = rand(0.3, 1) * speed;
      let vx = Math.cos(a) * sp;
      let vy = rand(0.2, 1) * up;
      let vz = Math.sin(a) * sp;
      if (spreadDir) { vx += spreadDir.x * sp; vy += spreadDir.y * sp; vz += spreadDir.z * sp; }
      this._spawn(pos.x, pos.y, pos.z, vx, vy, vz, r, g, b, rand(0.5, 1) * life, grav);
    }
  }

  impact(pos, normal, color = 0xffc46b) {
    this._burst(pos, { count: 10, color, color2: 0xfff6dc, speed: 4, life: 0.35, up: 1.6, grav: 12 });
  }

  blood(pos, head = false) {
    this._burst(pos, {
      count: head ? 22 : 12, color: 0xd8242c, color2: 0xff7a3c,
      speed: head ? 6 : 4, life: 0.5, up: 2.4, grav: 11,
    });
  }

  deathBurst(pos, color) {
    this._burst(pos, { count: 34, color, color2: 0xffe9a3, speed: 7, life: 0.8, up: 4.5, grav: 10 });
    this._burst(pos, { count: 14, color: 0x2a2a2a, color2: 0x555555, speed: 3, life: 1.0, up: 2.5, grav: 4 });
  }

  spawnRing(pos, color) {
    const p = pos.clone(); p.y = 0.35;
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const c = new THREE.Color(color);
      this._spawn(
        p.x + Math.cos(a) * 0.8, p.y, p.z + Math.sin(a) * 0.8,
        Math.cos(a) * 3.2, rand(2.5, 4.5), Math.sin(a) * 3.2,
        c.r, c.g, c.b, 0.55, 7
      );
    }
  }

  healBurst(pos) {
    this._burst(pos, { count: 16, color: 0x2aff7a, color2: 0xd6ffe6, speed: 2.4, life: 0.7, up: 3.4, grav: 2 });
  }

  // single faint particle for projectile trails
  boltTrail(pos) {
    this._spawn(
      pos.x + rand(-0.04, 0.04), pos.y + rand(-0.04, 0.04), pos.z + rand(-0.04, 0.04),
      0, 0, 0, 0.75, 0.35, 1.0, 0.28, 0
    );
  }

  // ---- tracers ----
  tracer(from, to, color = 0xffe9a3) {
    let best = this.tracers[0];
    for (const t of this.tracers) { if (t.life <= 0) { best = t; break; } if (t.life < best.life) best = t; }
    const m = best.mesh;
    const len = from.distanceTo(to);
    if (len < 0.5) return;
    m.position.copy(from).lerp(to, 0.5);
    m.lookAt(to);
    m.scale.set(1, 1, len);
    m.material.color.setHex(color);
    m.material.opacity = 0.85;
    m.visible = true;
    best.life = 0.07;
  }

  // ---- screen shake ----
  shake(amount) { this.trauma = clamp(this.trauma + amount, 0, 1); }

  // ---- DOM effects ----
  damageFlash(s) { this._dmg = Math.max(this._dmg, s); }
  healFlash() { this._heal = 0.8; }

  popup(worldPos, text, cls = '') {
    this._v3.copy(worldPos).project(this.camera);
    if (this._v3.z > 1) return;
    const x = (this._v3.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-this._v3.y * 0.5 + 0.5) * window.innerHeight;
    const el = document.createElement('div');
    el.className = `score-popup ${cls}`;
    el.textContent = text;
    el.style.left = `${x + rand(-14, 14)}px`;
    el.style.top = `${y - 10}px`;
    this.popupLayer.appendChild(el);
    setTimeout(() => el.remove(), 850);
  }

  // ---- frame update ----
  update(dt) {
    // particles
    let i = 0;
    while (i < this.pAlive) {
      this.pLife[i] -= dt;
      if (this.pLife[i] <= 0) {
        // swap-remove
        const last = --this.pAlive;
        if (i !== last) {
          for (let k = 0; k < 3; k++) {
            this.pPos[i * 3 + k] = this.pPos[last * 3 + k];
            this.pVel[i * 3 + k] = this.pVel[last * 3 + k];
            this.pCol[i * 3 + k] = this.pCol[last * 3 + k];
          }
          this.pLife[i] = this.pLife[last];
          this.pMaxLife[i] = this.pMaxLife[last];
          this.pGrav[i] = this.pGrav[last];
        }
        continue;
      }
      this.pVel[i * 3 + 1] -= this.pGrav[i] * dt;
      this.pPos[i * 3] += this.pVel[i * 3] * dt;
      this.pPos[i * 3 + 1] += this.pVel[i * 3 + 1] * dt;
      this.pPos[i * 3 + 2] += this.pVel[i * 3 + 2] * dt;
      if (this.pPos[i * 3 + 1] < 0.03) { this.pPos[i * 3 + 1] = 0.03; this.pVel[i * 3 + 1] *= -0.4; }
      // fade toward black (additive blending => fade out)
      const f = this.pLife[i] / this.pMaxLife[i];
      const dim = f * f * 0.98;
      const i3 = i * 3;
      const col = this.points.geometry.attributes.color.array;
      col[i3] *= dim; col[i3 + 1] *= dim; col[i3 + 2] *= dim;
      i++;
    }
    this.points.geometry.setDrawRange(0, this.pAlive);
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;

    // tracers
    for (const t of this.tracers) {
      if (t.life > 0) {
        t.life -= dt;
        t.mesh.material.opacity = Math.max(0, t.life / 0.07) * 0.85;
        if (t.life <= 0) t.mesh.visible = false;
      }
    }

    // shake
    this.trauma = Math.max(0, this.trauma - dt * 1.7);
    if (this.trauma > 0.001) {
      this.shakeT += dt * 34;
      const s = this.trauma * this.trauma * 0.045;
      this.camera.rotation.x += Math.sin(this.shakeT * 1.1) * s;
      this.camera.rotation.y += Math.cos(this.shakeT * 0.9) * s;
      this.camera.rotation.z += Math.sin(this.shakeT * 1.7) * s * 0.6;
    }

    // vignettes
    if (this._dmg > 0.001) {
      this._dmg = Math.max(0, this._dmg - dt * 1.4);
      this.dmgEl.style.opacity = this._dmg.toFixed(3);
    } else if (this.dmgEl.style.opacity !== '0') {
      this.dmgEl.style.opacity = '0';
    }
    if (this._heal > 0.001) {
      this._heal = Math.max(0, this._heal - dt * 1.6);
      this.healEl.style.opacity = this._heal.toFixed(3);
    } else if (this.healEl.style.opacity !== '0') {
      this.healEl.style.opacity = '0';
    }
  }
}
