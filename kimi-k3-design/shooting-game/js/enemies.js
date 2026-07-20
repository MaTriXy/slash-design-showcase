import * as THREE from 'three';
import { ENEMIES, SCORING } from './config.js';
import { rand, clamp, damp } from './utils.js';

// ============ Mech builders (capsules / spheres / cylinders — no box men) ============
function mechMats(def) {
  const hull = new THREE.MeshStandardMaterial({
    color: def.color, roughness: 0.38, metalness: 0.78, envMapIntensity: 1,
  });
  hull.emissive = new THREE.Color(def.color);
  hull.emissiveIntensity = 0.22;
  return {
    hull,
    joint: new THREE.MeshStandardMaterial({ color: 0x1c2024, roughness: 0.5, metalness: 0.85, envMapIntensity: 0.9 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x101215, roughness: 0.7, metalness: 0.4 }),
    eye: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: def.eye, emissiveIntensity: 3 }),
    core: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: def.eye, emissiveIntensity: 2 }),
  };
}

function capsule(mat, r, len, x, y, z, rx = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), mat);
  m.position.set(x, y, z);
  m.rotation.x = rx; m.rotation.z = rz;
  return m;
}
function sphere(mat, r, x, y, z, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}
function cyl(mat, r0, r1, len, x, y, z, rx = 0, rz = 0, seg = 10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, len, seg), mat);
  m.position.set(x, y, z);
  m.rotation.x = rx; m.rotation.z = rz;
  return m;
}
function ebox(mat, w, h, d, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

// hit proxy: not drawn, but raycastable (r168 raycast skips visible=false objects)
const PROXY_MAT = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
PROXY_MAT.visible = false;
function hitProxy(geo, x, y, z) {
  const m = new THREE.Mesh(geo, PROXY_MAT);
  m.position.set(x, y, z);
  return m;
}

// --- CHASER: low quad-ravager ---
function buildChaser(M, s) {
  const g = new THREE.Group();
  const parts = { arms: [], legs: [] };

  const body = capsule(M.hull, 0.3 * s, 0.5 * s, 0, 0.92 * s, 0, Math.PI / 2);
  body.castShadow = true;
  g.add(body);
  // back spikes
  [-0.12, 0.12].forEach((x) => {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05 * s, 0.3 * s, 6), M.joint);
    spike.position.set(x * s, 1.2 * s, -0.15 * s);
    spike.rotation.x = -0.5;
    g.add(spike);
  });
  // head with single eye slit
  const head = sphere(M.hull, 0.21 * s, 0, 0.98 * s, 0.42 * s);
  head.castShadow = true;
  g.add(head);
  const eye = ebox(M.eye, 0.2 * s, 0.045 * s, 0.02, 0, 1.0 * s, 0.62 * s);
  g.add(eye);
  const jaw = ebox(M.joint, 0.16 * s, 0.05 * s, 0.1 * s, 0, 0.86 * s, 0.5 * s);
  g.add(jaw);
  // glowing chest core
  const core = sphere(M.core, 0.07 * s, 0, 0.86 * s, 0.32 * s);
  g.add(core);
  // 4 piston legs
  const hipX = 0.26 * s, hipZ = 0.18 * s, legR = 0.045 * s, legL = 0.62 * s;
  [[-hipX, hipZ], [hipX, hipZ], [-hipX, -hipZ], [hipX, -hipZ]].forEach(([hx, hz]) => {
    const leg = cyl(M.joint, legR, legR * 0.7, legL, hx, 0.62 * s, hz);
    leg.geometry.translate(0, -legL / 2, 0);
    leg.position.y = 0.62 * s;
    leg.castShadow = true;
    g.add(leg);
    parts.legs.push(leg);
  });
  parts.body = body; parts.head = head;
  parts.coreMesh = core;
  // hit proxies: full-mass body capsule + head sphere
  parts.bodyProxy = hitProxy(new THREE.CapsuleGeometry(0.4 * s, 0.5 * s, 4, 8), 0, 0.86 * s, -0.02 * s);
  parts.bodyProxy.rotation.x = Math.PI / 2;
  parts.headProxy = hitProxy(new THREE.SphereGeometry(0.26 * s, 8, 8), 0, 0.98 * s, 0.42 * s);
  g.add(parts.bodyProxy, parts.headProxy);
  return { group: g, ...parts, eyeMat: M.eye, coreMat: M.core, bodyMat: M.hull };
}

// --- RUNNER: hover drone ---
function buildRunner(M, s) {
  const g = new THREE.Group();
  const parts = { arms: [], legs: [] };
  const body = sphere(M.hull, 0.3 * s, 0, 1.0 * s, 0, 1, 0.72, 1.15);
  body.castShadow = true;
  g.add(body);
  // face plate + eye
  const face = sphere(M.joint, 0.18 * s, 0, 1.0 * s, 0.26 * s, 1, 0.8, 0.6);
  g.add(face);
  const eye = ebox(M.eye, 0.16 * s, 0.05 * s, 0.02, 0, 1.02 * s, 0.38 * s);
  g.add(eye);
  // thruster pods with glow rings
  [-1, 1].forEach((side) => {
    const pod = cyl(M.joint, 0.08 * s, 0.1 * s, 0.22 * s, side * 0.34 * s, 0.95 * s, -0.05 * s, Math.PI / 2);
    g.add(pod);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075 * s, 0.018 * s, 6, 14), M.core);
    ring.position.set(side * 0.34 * s, 0.95 * s, -0.18 * s);
    g.add(ring);
  });
  // antenna
  const ant = cyl(M.joint, 0.012 * s, 0.012 * s, 0.3 * s, 0.1 * s, 1.3 * s, -0.1 * s, 0, -0.3);
  g.add(ant);
  g.add(sphere(M.core, 0.025 * s, 0.14 * s, 1.44 * s, -0.12 * s));
  const core = sphere(M.core, 0.06 * s, 0, 0.82 * s, 0.18 * s);
  g.add(core);
  parts.body = body; parts.head = face; parts.coreMesh = core;
  parts.bodyProxy = hitProxy(new THREE.SphereGeometry(0.44 * s, 10, 8), 0, 1.0 * s, 0);
  parts.headProxy = hitProxy(new THREE.SphereGeometry(0.24 * s, 8, 8), 0, 1.0 * s, 0.28 * s);
  g.add(parts.bodyProxy, parts.headProxy);
  return { group: g, ...parts, eyeMat: M.eye, coreMat: M.core, bodyMat: M.hull };
}

// --- GUNNER: biped warden ---
function buildGunner(M, s) {
  const g = new THREE.Group();
  const parts = { arms: [], legs: [] };
  const torso = capsule(M.hull, 0.28 * s, 0.5 * s, 0, 1.2 * s, 0);
  torso.castShadow = true;
  g.add(torso);
  const pelvis = sphere(M.joint, 0.2 * s, 0, 0.82 * s, 0);
  g.add(pelvis);
  // head sphere + visor band
  const head = sphere(M.hull, 0.19 * s, 0, 1.68 * s, 0.02 * s);
  head.castShadow = true;
  g.add(head);
  const visor = ebox(M.eye, 0.24 * s, 0.05 * s, 0.02, 0, 1.7 * s, 0.19 * s);
  g.add(visor);
  // crest antenna
  g.add(cyl(M.joint, 0.015 * s, 0.015 * s, 0.24 * s, 0, 1.88 * s, -0.04 * s, 0.3));
  // chest core
  const core = sphere(M.core, 0.07 * s, 0, 1.28 * s, 0.24 * s);
  g.add(core);
  // backpack
  const pack = ebox(M.joint, 0.34 * s, 0.44 * s, 0.16 * s, 0, 1.24 * s, -0.3 * s);
  g.add(pack);
  // right arm = gun barrel; left arm = capsule
  const shoulderR = sphere(M.joint, 0.09 * s, 0.32 * s, 1.44 * s, 0);
  g.add(shoulderR);
  const barrel = cyl(M.dark, 0.05 * s, 0.06 * s, 0.62 * s, 0.32 * s, 1.34 * s, 0.3 * s, Math.PI / 2);
  barrel.castShadow = true;
  g.add(barrel);
  const muzzle = cyl(M.eye, 0.055 * s, 0.055 * s, 0.06 * s, 0.32 * s, 1.34 * s, 0.6 * s, Math.PI / 2);
  g.add(muzzle);
  parts.arms.push(barrel);
  const armL = capsule(M.hull, 0.06 * s, 0.34 * s, -0.34 * s, 1.24 * s, 0.04 * s, 0, 0.25);
  g.add(armL);
  // digitigrade legs
  [-1, 1].forEach((side) => {
    const thigh = capsule(M.joint, 0.07 * s, 0.34 * s, side * 0.16 * s, 0.62 * s, 0.02 * s, 0.35);
    thigh.geometry.translate(0, -0.15 * s, 0);
    thigh.position.y = 0.72 * s;
    g.add(thigh);
    const shin = capsule(M.hull, 0.055 * s, 0.34 * s, side * 0.16 * s, 0.3 * s, 0.06 * s, -0.3);
    shin.geometry.translate(0, -0.15 * s, 0);
    shin.position.y = 0.38 * s;
    g.add(shin);
    const foot = ebox(M.dark, 0.12 * s, 0.05 * s, 0.2 * s, side * 0.16 * s, 0.03 * s, 0.08 * s);
    g.add(foot);
    parts.legs.push(thigh, shin);
  });
  parts.body = torso; parts.head = head; parts.coreMesh = core;
  parts.bodyProxy = hitProxy(new THREE.CapsuleGeometry(0.38 * s, 0.7 * s, 4, 8), 0, 1.1 * s, 0);
  parts.headProxy = hitProxy(new THREE.SphereGeometry(0.24 * s, 8, 8), 0, 1.68 * s, 0.02 * s);
  g.add(parts.bodyProxy, parts.headProxy);
  return { group: g, ...parts, eyeMat: M.eye, coreMat: M.core, bodyMat: M.hull };
}

// --- BRUTE: juggernaut ---
function buildBrute(M, s) {
  const g = new THREE.Group();
  const parts = { arms: [], legs: [] };
  const hull = capsule(M.hull, 0.42 * s, 0.55 * s, 0, 1.35 * s, 0);
  hull.castShadow = true;
  g.add(hull);
  // dome head sunk into hull + eye strip
  const head = sphere(M.joint, 0.24 * s, 0, 1.86 * s, 0.1 * s, 1, 0.8, 1);
  g.add(head);
  const eye = ebox(M.eye, 0.26 * s, 0.04 * s, 0.02, 0, 1.88 * s, 0.3 * s);
  g.add(eye);
  // big chest core + vents
  const core = sphere(M.core, 0.11 * s, 0, 1.42 * s, 0.38 * s);
  g.add(core);
  [-0.14, 0.14].forEach((x) => {
    g.add(ebox(M.core, 0.05 * s, 0.16 * s, 0.02, x * s, 1.2 * s, 0.4 * s));
  });
  // shoulder domes
  [-1, 1].forEach((side) => {
    const dome = sphere(M.joint, 0.2 * s, side * 0.48 * s, 1.62 * s, 0, 1, 0.75, 1);
    dome.castShadow = true;
    g.add(dome);
  });
  // piston arms
  [-1, 1].forEach((side) => {
    const arm = cyl(M.joint, 0.11 * s, 0.13 * s, 0.7 * s, side * 0.5 * s, 1.1 * s, 0);
    arm.geometry.translate(0, -0.35 * s, 0);
    arm.position.y = 1.5 * s;
    arm.castShadow = true;
    g.add(arm);
    const fist = sphere(M.dark, 0.14 * s, 0, -0.72 * s, 0);
    arm.add(fist);
    parts.arms.push(arm);
  });
  // column legs
  [-1, 1].forEach((side) => {
    const leg = cyl(M.hull, 0.13 * s, 0.16 * s, 0.6 * s, side * 0.22 * s, 0.3 * s, 0);
    leg.geometry.translate(0, -0.3 * s, 0);
    leg.position.y = 0.62 * s;
    leg.castShadow = true;
    g.add(leg);
    const foot = ebox(M.dark, 0.24 * s, 0.08 * s, 0.32 * s, side * 0.22 * s, 0.04 * s, 0.04 * s);
    g.add(foot);
    parts.legs.push(leg);
  });
  parts.body = hull; parts.head = head; parts.coreMesh = core;
  parts.bodyProxy = hitProxy(new THREE.CapsuleGeometry(0.56 * s, 0.72 * s, 4, 8), 0, 1.3 * s, 0);
  parts.headProxy = hitProxy(new THREE.SphereGeometry(0.3 * s, 8, 8), 0, 1.86 * s, 0.1 * s);
  g.add(parts.bodyProxy, parts.headProxy);
  return { group: g, ...parts, eyeMat: M.eye, coreMat: M.core, bodyMat: M.hull };
}

function buildEnemyMesh(type, def) {
  const M = mechMats(def);
  const s = def.scale;
  switch (type) {
    case 'runner': return buildRunner(M, s);
    case 'gunner': return buildGunner(M, s);
    case 'brute': return buildBrute(M, s);
    default: return buildChaser(M, s);
  }
}

// ============ Enemy ============
class Enemy {
  constructor(scene, type, pos) {
    this.type = type;
    this.def = ENEMIES[type];
    this.hp = this.def.hp;
    this.dead = false;
    this.dying = 0;
    this.spawning = 0.55;
    this.attackCd = rand(0.4, 1.2);
    this.telegraph = 0;
    this.flash = 0;
    this.walkT = rand(0, 6);
    this.knock = new THREE.Vector3();
    this.lungeT = 0;
    this.hoverT = rand(0, 6);

    // AI state
    this.aiState = 'seek';           // chaser/runner: seek/flank; gunner: cover/hold/peek/strafe
    this.flankDir = Math.random() < 0.5 ? 1 : -1;
    this.serpPhase = rand(0, Math.PI * 2);
    this.cover = null;
    this.peek = null;
    this.peekSide = 1;
    this.aiT = rand(0.4, 1);
    this.repathT = 0;

    const built = buildEnemyMesh(type, this.def);
    this.mesh = built.group;
    this.parts = built;
    this.mesh.position.copy(pos);
    this.mesh.scale.setScalar(0.01);
    scene.add(this.mesh);

    this.parts.bodyProxy.userData = { enemy: this, part: 'body' };
    this.parts.headProxy.userData = { enemy: this, part: 'head' };
    this.hitMeshes = [this.parts.bodyProxy, this.parts.headProxy];
  }

  get pos() { return this.mesh.position; }

  eyePos() {
    const p = this.pos.clone();
    p.y = this.def.height * 0.85;
    return p;
  }

  update(dt, player, world, audio, onPlayerDamage) {
    const def = this.def;

    // --- death ---
    if (this.dead) {
      this.dying += dt;
      const p = Math.min(this.dying / 0.45, 1);
      this.mesh.rotation.z = p * (Math.PI / 2) * (this._fallDir || 1);
      this.mesh.position.y = -p * 0.3 - Math.max(0, this.dying - 0.5) * 1.6;
      return this.dying < 1.1;
    }

    // --- spawn-in ---
    if (this.spawning > 0) {
      this.spawning -= dt;
      const p = 1 - Math.max(this.spawning, 0) / 0.55;
      this.mesh.scale.setScalar(Math.max(p, 0.01));
      return true;
    }
    this.mesh.scale.setScalar(1);

    // --- hit flash ---
    if (this.flash > 0) {
      this.flash -= dt;
      if (this.flash <= 0) {
        this.parts.bodyMat.emissive.setHex(this.def.color);
        this.parts.bodyMat.emissiveIntensity = 0.22;
      }
    }

    const toPlayer = new THREE.Vector3().subVectors(player.pos, this.pos);
    toPlayer.y = 0;
    const dist = toPlayer.length();
    const dir = dist > 0.001 ? toPlayer.clone().divideScalar(dist) : new THREE.Vector3(1, 0, 0);

    // face player (except drone which spins freely)
    const targetYaw = Math.atan2(dir.x, dir.z);
    let dy = targetYaw - this.mesh.rotation.y;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    this.mesh.rotation.y += dy * Math.min(1, dt * (this.type === 'runner' ? 4 : 8));

    this.attackCd -= dt;
    this.lungeT = Math.max(0, this.lungeT - dt);
    const vel = new THREE.Vector3();

    if (this.type === 'gunner') {
      this._gunnerAI(dt, player, world, audio, vel, dist, dir);
    } else if (this.type === 'runner') {
      this._runnerAI(dt, player, vel, dist, dir, onPlayerDamage);
    } else {
      this._meleeAI(dt, player, vel, dist, dir, onPlayerDamage);
    }

    // knockback
    vel.add(this.knock);
    this.knock.multiplyScalar(Math.max(0, 1 - dt * 6));

    this.pos.x += vel.x * dt;
    this.pos.z += vel.z * dt;
    world.collide(this.pos, def.radius);

    // ---- animation ----
    const spd = clamp(vel.length() / def.speed, 0, 1.5);
    this.walkT += dt * (4 + spd * 6);
    this.hoverT += dt;
    const P = this.parts;

    if (this.type === 'runner') {
      // hover bob + tilt into motion
      P.body.position.y = this.def.height * 0.62 + Math.sin(this.hoverT * 3.1) * 0.09;
      this.mesh.rotation.z = damp(this.mesh.rotation.z, clamp(-vel.x * 0.03, -0.3, 0.3), 6, dt);
      this.mesh.rotation.x = damp(this.mesh.rotation.x, clamp(vel.length() * 0.03, 0, 0.3), 6, dt);
      P.coreMesh.scale.setScalar(1 + Math.sin(this.hoverT * 6) * 0.15);
    } else if (this.type === 'chaser') {
      // quad legs alternate pairs
      P.legs[0].rotation.x = Math.sin(this.walkT) * 0.6 * spd;
      P.legs[3].rotation.x = Math.sin(this.walkT) * 0.6 * spd;
      P.legs[1].rotation.x = -Math.sin(this.walkT) * 0.6 * spd;
      P.legs[2].rotation.x = -Math.sin(this.walkT) * 0.6 * spd;
      P.body.position.y = this.def.height * 0.51 + Math.abs(Math.sin(this.walkT * 2)) * 0.03 * spd;
      // pounce pitch when lunging
      P.body.rotation.x = Math.PI / 2 + (this.lungeT > 0 ? -0.45 * (this.lungeT / 0.25) : 0);
    } else if (this.type === 'gunner') {
      P.legs[0].rotation.x = 0.35 + Math.sin(this.walkT) * 0.5 * spd;
      P.legs[1].rotation.x = -0.3 - Math.sin(this.walkT) * 0.5 * spd;
      P.legs[2].rotation.x = 0.35 - Math.sin(this.walkT) * 0.5 * spd;
      P.legs[3].rotation.x = -0.3 + Math.sin(this.walkT) * 0.5 * spd;
      P.body.position.y = 1.2 * def.scale + Math.abs(Math.sin(this.walkT)) * 0.035 * spd;
    } else if (this.type === 'brute') {
      P.legs[0].rotation.x = Math.sin(this.walkT * 0.8) * 0.4 * spd;
      P.legs[1].rotation.x = -Math.sin(this.walkT * 0.8) * 0.4 * spd;
      this.mesh.rotation.z = Math.sin(this.walkT * 0.4) * 0.04;
      // piston arms: idle low, raise to slam on attack
      const target = this.lungeT > 0 ? -2.3 : -0.25;
      P.arms.forEach((a) => { a.rotation.x = damp(a.rotation.x, target, 10, dt); });
    }

    // core pulse
    if (P.coreMat) P.coreMat.emissiveIntensity = 1.6 + Math.sin(this.hoverT * 4) * 0.7;

    return true;
  }

  // --- melee (chaser / brute): serpentine approach, lunge in range ---
  _meleeAI(dt, player, vel, dist, dir, onPlayerDamage) {
    const def = this.def;
    if (dist > def.attackRange) {
      // serpentine: weave as we close in (brute barely weaves)
      const weave = this.type === 'brute' ? 0.15 : 0.55;
      const perp = new THREE.Vector3(-dir.z, 0, dir.x);
      const sway = Math.sin(this.hoverT * 2.6 + this.serpPhase) * weave * clamp(dist / 8, 0.2, 1);
      vel.addScaledVector(dir, def.speed);
      vel.addScaledVector(perp, sway * def.speed);
      if (vel.length() > def.speed) vel.setLength(def.speed);
    } else if (this.attackCd <= 0 && player.alive) {
      this.attackCd = def.attackCooldown;
      this.lungeT = 0.25;
      this.knock.addScaledVector(dir, 3.5); // pounce impulse
      onPlayerDamage(def.damage, this.pos);
    }
  }

  // --- runner: flanking arcs, then dart in ---
  _runnerAI(dt, player, vel, dist, dir, onPlayerDamage) {
    const def = this.def;
    if (dist > def.attackRange) {
      const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(this.flankDir);
      // wide arc while far, tighten as we close
      const arc = clamp(dist / 10, 0.25, 1);
      vel.addScaledVector(dir, def.speed * (1 - arc * 0.45));
      vel.addScaledVector(perp, def.speed * arc);
      if (Math.random() < dt * 0.25) this.flankDir *= -1; // occasional flip
    } else if (this.attackCd <= 0 && player.alive) {
      this.attackCd = def.attackCooldown;
      this.lungeT = 0.25;
      this.knock.addScaledVector(dir, 5);
      onPlayerDamage(def.damage, this.pos);
    }
  }

  // --- gunner: take cover, peek, fire, relocate ---
  _gunnerAI(dt, player, world, audio, vel, dist, dir) {
    const def = this.def;
    const eye = this.eyePos();
    const playerEye = player.eyePos;
    const los = world.hasLineOfSight(eye, playerEye);
    this.aiT -= dt;

    // muzzle world position for firing
    switch (this.aiState) {
      case 'cover': {
        if (!this.cover || this._coverExposed(world, player)) this._pickCover(world, player);
        if (!this.cover) { this.aiState = 'strafe'; break; }
        const toCover = new THREE.Vector3(this.cover.x - this.pos.x, 0, this.cover.z - this.pos.z);
        const d = toCover.length();
        if (d < 0.7) {
          this.aiState = 'hold';
          this.aiT = rand(0.35, 0.8);
        } else {
          toCover.divideScalar(d);
          vel.addScaledVector(toCover, def.speed * 1.25);
        }
        break;
      }
      case 'hold': {
        // hidden behind cover; relocate if player flanked us
        if (this._coverExposed(world, player)) {
          this.cover = null;
          this.aiState = 'cover';
          break;
        }
        if (this.aiT <= 0) {
          this._pickPeek(world, player);
          if (this.peek) {
            this.aiState = 'peek';
          } else {
            this.peekFails = (this.peekFails || 0) + 1;
            this.aiT = 0.5;
            if (this.peekFails > 2) { this.aiState = 'strafe'; this.strafeT = 0; }
          }
        }
        break;
      }
      case 'peek': {
        if (!this.peek) { this.aiState = 'hold'; this.aiT = 0.3; break; }
        const toPeek = new THREE.Vector3(this.peek.x - this.pos.x, 0, this.peek.z - this.pos.z);
        const d = toPeek.length();
        if (d > 0.4) {
          toPeek.divideScalar(d);
          vel.addScaledVector(toPeek, def.speed);
        }
        // out of range even from the peek spot — advance on the player
        if (los && dist > def.attackRange - 2) {
          vel.addScaledVector(dir, def.speed * 0.7);
        }
        // clear shot?
        if (los && dist < def.attackRange && player.alive) {
          if (this.attackCd <= 0) {
            this.telegraph += dt;
            this.parts.eyeMat.emissiveIntensity = 3 + Math.sin(this.telegraph * 30) * 2.2 + this.telegraph * 4;
            if (this.telegraph >= 0.45) {
              this.telegraph = 0;
              this.attackCd = def.attackCooldown * rand(0.85, 1.15);
              this.parts.eyeMat.emissiveIntensity = 3;
              this._fireProjectile(player, audio);
              // duck back after firing
              this.aiState = 'cover';
              this.aiT = 0;
            }
          }
        } else if (d < 0.4 && this.aiT < -1.2) {
          // peek spot has no shot — fall back and rethink
          this.cover = null;
          this.aiState = 'cover';
        }
        break;
      }
      default: { // 'strafe' fallback when no cover exists
        this.strafeT = (this.strafeT || 0) - dt;
        if (dist < def.keepDistance - 3) vel.addScaledVector(dir, -def.speed);
        else if (dist > def.attackRange || !los) vel.addScaledVector(dir, def.speed);
        else {
          if (this.strafeT <= 0) { this.flankDir *= -1; this.strafeT = rand(1.2, 2.4); }
          vel.addScaledVector(new THREE.Vector3(-dir.z, 0, dir.x), def.speed * 0.6 * this.flankDir);
        }
        if (los && dist < def.attackRange && player.alive && this.attackCd <= 0) {
          this.telegraph += dt;
          this.parts.eyeMat.emissiveIntensity = 3 + this.telegraph * 5;
          if (this.telegraph >= 0.45) {
            this.telegraph = 0;
            this.attackCd = def.attackCooldown * rand(0.85, 1.15);
            this.parts.eyeMat.emissiveIntensity = 3;
            this._fireProjectile(player, audio);
          }
        } else if (this.telegraph > 0) {
          this.telegraph = 0;
          this.parts.eyeMat.emissiveIntensity = 3;
        }
        // periodically try to find cover again
        if (this.aiT <= 0) { this.aiState = 'cover'; this.aiT = 3; }
      }
    }
  }

  _coverExposed(world, player) {
    if (!this.cover) return true;
    const p = this.cover.clone();
    p.y = 1.4;
    return world.hasLineOfSight(p, player.eyePos);
  }

  _pickCover(world, player) {
    let best = null, bestScore = Infinity, bestInfo = null;
    for (const b of world.obstacleColliders) {
      const h = b.max.y - b.min.y;
      if (h < 1.1) continue;
      const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
      const hw = (b.max.x - b.min.x) / 2, hd = (b.max.z - b.min.z) / 2;
      // [normalX, normalZ, alongHalfExtent]
      const sides = [
        [1, 0, hd, cx + hw + 1.1, cz], [-1, 0, hd, cx - hw - 1.1, cz],
        [0, 1, hw, cx, cz + hd + 1.1], [0, -1, hw, cx, cz - hd - 1.1],
      ];
      for (const [nx, nz, alongHalf, px, pz] of sides) {
        const p = new THREE.Vector3(px, 0, pz);
        if (Math.abs(px) > world.half - 2.5 || Math.abs(pz) > world.half - 2.5) continue;
        if (world._insideObstacle(p, 0.7)) continue;
        const toPlayer = new THREE.Vector3(player.pos.x - px, 0, player.pos.z - pz);
        const pd = toPlayer.length();
        if (pd < 7 || pd > 22) continue; // stay inside engagement range
        // side must face away-ish from player, and spot must block line to player
        const eye = p.clone(); eye.y = 1.4;
        if (world.hasLineOfSight(eye, player.eyePos)) continue;
        const score = p.distanceTo(this.pos) + pd * 0.1 + rand(0, 4);
        if (score < bestScore) {
          bestScore = score;
          best = p;
          bestInfo = { normal: new THREE.Vector3(nx, 0, nz), alongHalf };
        }
      }
    }
    this.cover = best;
    this.coverInfo = bestInfo;
    this.peekFails = 0;
  }

  _pickPeek(world, player) {
    this.peek = null;
    if (!this.cover || !this.coverInfo) return;
    // step out around the obstacle corner, along the face tangent
    const n = this.coverInfo.normal;
    const tangent = new THREE.Vector3(-n.z, 0, n.x);
    const reach = this.coverInfo.alongHalf + 1.0;
    for (const side of [this.peekSide, -this.peekSide]) {
      const p = this.cover.clone().addScaledVector(tangent, side * reach);
      if (Math.abs(p.x) > world.half - 2 || Math.abs(p.z) > world.half - 2) continue;
      if (world._insideObstacle(p, 0.5)) continue;
      const eye = p.clone(); eye.y = 1.4;
      if (world.hasLineOfSight(eye, player.eyePos)) {
        this.peek = p;
        this.peekSide = side;
        return;
      }
    }
  }

  _fireProjectile(player, audio) {
    const from = this.pos.clone();
    from.y = this.def.height * 0.72;
    from.addScaledVector(new THREE.Vector3(Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y)), 0.55);
    const target = player.pos.clone();
    target.y += 1.15;
    target.addScaledVector(player.vel, 0.1);
    const dir = target.sub(from).normalize();
    // slight inaccuracy
    dir.x += rand(-0.02, 0.02);
    dir.y += rand(-0.015, 0.015);
    dir.z += rand(-0.02, 0.02);
    dir.normalize();
    const vel = dir.multiplyScalar(this.def.projectileSpeed);
    this.mgr.spawnProjectile(from, vel, this.def.damage);
    audio.enemyShoot();
  }

  takeDamage(dmg, head, dir) {
    if (this.dead) return false;
    this.hp -= dmg;
    this.parts.bodyMat.emissive.setHex(0xffffff);
    this.parts.bodyMat.emissiveIntensity = 0.9;
    this.flash = 0.07;
    if (dir) this.knock.addScaledVector(dir, head ? 1.6 : 1.0);
    if (this.hp <= 0) {
      this.dead = true;
      this._fallDir = Math.random() < 0.5 ? 1 : -1;
      return true;
    }
    return false;
  }
}

// ============ EnemyManager ============
export class EnemyManager {
  constructor(scene, world, effects, audio) {
    this.scene = scene;
    this.world = world;
    this.effects = effects;
    this.audio = audio;
    this.enemies = [];
    this.queue = [];
    this.spawnTimer = 0;
    this.batchSize = 4;
    this.spawnInterval = 3;
    this.maxAlive = 8;

    this.projectiles = [];
    this.projPool = [];
    this.projGeo = new THREE.SphereGeometry(0.11, 10, 10);
    this.projMat = new THREE.MeshStandardMaterial({ color: 0x2a0a44, emissive: 0xc76bff, emissiveIntensity: 4 });
    this._trailT = 0;
  }

  get aliveCount() { return this.enemies.filter((e) => !e.dead).length; }
  get remaining() { return this.aliveCount + this.queue.length; }

  get hitMeshes() {
    const out = [];
    for (const e of this.enemies) {
      if (!e.dead && e.spawning <= 0) out.push(...e.hitMeshes);
    }
    return out;
  }

  loadLevel(def) {
    this.clear();
    this.batchSize = def.batch;
    this.spawnInterval = def.spawnInterval;
    this.queue = [];
    Object.entries(def.roster).forEach(([type, n]) => {
      for (let i = 0; i < n; i++) this.queue.push(type);
    });
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
    this.spawnTimer = 0.8;
  }

  clear() {
    this.enemies.forEach((e) => this.scene.remove(e.mesh));
    this.enemies = [];
    this.queue = [];
    this.projectiles.forEach((p) => this.scene.remove(p.mesh));
    this.projectiles = [];
  }

  _spawnOne(type, playerPos) {
    const points = this.world.spawnPoints
      .slice()
      .sort((a, b) => b.distanceTo(playerPos) - a.distanceTo(playerPos));
    const p = points[Math.floor(rand(0, Math.min(3, points.length - 0.01)))];
    const e = new Enemy(this.scene, type, p.clone());
    e.mgr = this;
    this.enemies.push(e);
    this.effects.spawnRing(p, ENEMIES[type].color);
  }

  spawnProjectile(from, vel, damage) {
    let mesh = this.projPool.pop();
    if (!mesh) mesh = new THREE.Mesh(this.projGeo, this.projMat);
    mesh.position.copy(from);
    mesh.scale.set(1, 1, 3.6); // stretched bolt
    this.scene.add(mesh);
    this.projectiles.push({ mesh, vel: vel.clone(), damage, life: 4 });
  }

  damage(enemy, dmg, head, dir) {
    const killed = enemy.takeDamage(dmg, head, dir);
    if (killed) {
      this.audio.enemyDie();
      const burstPos = enemy.pos.clone();
      burstPos.y = enemy.def.height * 0.55;
      this.effects.deathBurst(burstPos, enemy.def.color);
      const roll = Math.random();
      if (roll < SCORING.dropChanceAmmo) this.world.spawnPickup('ammo', enemy.pos);
      else if (roll < SCORING.dropChanceAmmo + SCORING.dropChanceHealth) this.world.spawnPickup('health', enemy.pos);
    }
    return killed;
  }

  update(dt, player, onPlayerDamage) {
    // spawn director
    if (this.queue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.aliveCount < this.maxAlive) {
        const n = Math.min(this.batchSize, this.queue.length, this.maxAlive - this.aliveCount);
        for (let i = 0; i < n; i++) this._spawnOne(this.queue.pop(), player.pos);
        this.spawnTimer = this.spawnInterval;
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const keep = e.update(dt, player, this.world, this.audio, onPlayerDamage);
      if (!keep) {
        this.scene.remove(e.mesh);
        this.enemies.splice(i, 1);
      }
    }

    // separation
    const list = this.enemies;
    for (let i = 0; i < list.length; i++) {
      if (list[i].dead) continue;
      for (let j = i + 1; j < list.length; j++) {
        if (list[j].dead) continue;
        const a = list[i], b = list[j];
        const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
        const minD = a.def.radius + b.def.radius + 0.15;
        const d2 = dx * dx + dz * dz;
        if (d2 < minD * minD && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          const push = (minD - d) * 0.5 / d;
          a.pos.x -= dx * push; a.pos.z -= dz * push;
          b.pos.x += dx * push; b.pos.z += dz * push;
        }
      }
    }

    // projectiles
    this._trailT -= dt;
    const doTrail = this._trailT <= 0;
    if (doTrail) this._trailT = 0.03;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      const mp = p.mesh.position;
      p.mesh.lookAt(mp.clone().add(p.vel));
      if (doTrail) this.effects.boltTrail(mp);
      let kill = p.life <= 0 || mp.y < 0 || mp.y > 8;

      if (!kill) {
        for (const b of this.world.colliders) {
          if (mp.x > b.min.x && mp.x < b.max.x && mp.y > b.min.y && mp.y < b.max.y && mp.z > b.min.z && mp.z < b.max.z) {
            kill = true;
            break;
          }
        }
      }
      if (!kill && player.alive) {
        const dx = mp.x - player.pos.x, dz = mp.z - player.pos.z;
        const dy = mp.y - (player.pos.y + 1.1);
        if (dx * dx + dz * dz < 0.55 && Math.abs(dy) < 1.1) {
          onPlayerDamage(p.damage, mp);
          kill = true;
        }
      }
      if (kill) {
        this.effects.impact(mp, null, 0xc76bff);
        this.scene.remove(p.mesh);
        this.projPool.push(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }
}
