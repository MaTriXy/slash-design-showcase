import * as THREE from 'three';
import { WEAPONS } from './config.js';
import { rand, clamp, damp, lerp } from './utils.js';
import { flashTexture, gunmetalMaps, stencilTexture } from './textures.js';

const HIP_POS = new THREE.Vector3(0.26, -0.255, -0.48);
// ADS: gun tucks low-right, screen center stays clear for the crosshair
const ADS_POS = new THREE.Vector3(0.16, -0.36, -0.42);

// ============ View-model builders ============
function gunMats() {
  const gm = gunmetalMaps(5);
  return {
    steel: new THREE.MeshStandardMaterial({ map: gm.map, roughnessMap: gm.roughnessMap, roughness: 1, metalness: 0.88, envMapIntensity: 1.2 }),
    dark: new THREE.MeshStandardMaterial({ map: gm.map, roughnessMap: gm.roughnessMap, color: 0x7d838a, roughness: 1, metalness: 0.8, envMapIntensity: 1 }),
    poly: new THREE.MeshStandardMaterial({ color: 0x1d2126, roughness: 0.85, metalness: 0.15 }),
    fde: new THREE.MeshStandardMaterial({ color: 0x4a3f32, roughness: 0.82, metalness: 0.12 }),
    glove: new THREE.MeshStandardMaterial({ color: 0x2a251c, roughness: 0.95, metalness: 0.05 }),
    accent: new THREE.MeshStandardMaterial({ color: 0x101216, emissive: 0xffd23f, emissiveIntensity: 1.8, roughness: 0.5 }),
    lens: new THREE.MeshStandardMaterial({ color: 0x0a0f12, emissive: 0x66d9ff, emissiveIntensity: 1.4, roughness: 0.2, metalness: 0.8 }),
  };
}

// stencil decal on the gun's left face
function decal(tex, w, h, x, y, z) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 })
  );
  m.position.set(x, y, z);
  m.rotation.y = -Math.PI / 2;
  return m;
}
function box(mat, w, h, d, x, y, z, rx = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (rx) m.rotation.x = rx;
  return m;
}
function tube(mat, r, len, x, y, z, seg = 14) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
  m.rotation.x = Math.PI / 2;
  m.position.set(x, y, z);
  return m;
}
function ring(mat, r, len, x, y, z) {
  return tube(mat, r, len, x, y, z, 14);
}

// gloved hand: sphere palm + capsule fingers
function hand(M, x, y, z, rx = 0, s = 1) {
  const h = new THREE.Group();
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.032 * s, 10, 8), M.glove);
  palm.scale.set(0.9, 0.72, 1.5);
  h.add(palm);
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.008 * s, 0.03 * s, 3, 6), M.glove);
    f.position.set(-0.02 * s + i * 0.02 * s, -0.022 * s, 0.03 * s);
    f.rotation.x = -0.9;
    h.add(f);
  }
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.009 * s, 0.026 * s, 3, 6), M.glove);
  thumb.position.set(0.034 * s, -0.005 * s, 0.01 * s);
  thumb.rotation.x = -0.5; thumb.rotation.z = -0.6;
  h.add(thumb);
  h.position.set(x, y, z);
  h.rotation.x = rx;
  return h;
}

function buildPistol(M) {
  const g = new THREE.Group();
  const ud = g.userData;
  g.add(box(M.steel, 0.052, 0.062, 0.23, 0, 0.022, -0.05));        // slide
  ud.slide = g.children[g.children.length - 1];
  ud.slideZ = ud.slide.position.z;
  g.add(box(M.dark, 0.046, 0.04, 0.19, 0, -0.022, -0.03));         // frame
  g.add(tube(M.steel, 0.014, 0.05, 0, 0.026, -0.175));             // barrel tip
  g.add(box(M.fde, 0.044, 0.115, 0.062, 0, -0.095, 0.038, 0.2));   // grip
  const mag = box(M.dark, 0.04, 0.05, 0.05, 0, -0.15, 0.045, 0.2); // mag base
  g.add(mag);
  ud.mag = mag; ud.magY = mag.position.y;
  g.add(box(M.dark, 0.006, 0.03, 0.05, 0, -0.045, -0.085));        // trigger guard
  g.add(box(M.accent, 0.01, 0.016, 0.01, 0, 0.062, -0.15));        // front sight
  g.add(box(M.dark, 0.05, 0.014, 0.02, 0, 0.06, 0.05));            // rear sight
  g.add(decal(stencilTexture('P9', '#d8d2c0', '9MM'), 0.07, 0.018, -0.027, 0.022, -0.02));
  g.add(hand(M, 0, -0.105, 0.045, 0.3, 1.05));
  ud.muzzle = new THREE.Vector3(0, 0.026, -0.21);
  ud.ads = new THREE.Vector3(0.14, -0.33, -0.4);
  return g;
}

function buildRifle(M) {
  const g = new THREE.Group();
  const ud = g.userData;
  g.add(box(M.steel, 0.05, 0.075, 0.3, 0, 0.005, 0.02));           // receiver
  // octagonal handguard
  const hg = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.34, 8), M.fde);
  hg.rotation.x = Math.PI / 2;
  hg.position.set(0, 0.008, -0.3);
  g.add(hg);
  g.add(tube(M.steel, 0.013, 0.2, 0, 0.01, -0.55));                // barrel
  g.add(ring(M.dark, 0.02, 0.05, 0, 0.01, -0.63));                 // flash hider
  g.add(box(M.fde, 0.04, 0.05, 0.15, 0, -0.025, 0.21));            // stock
  g.add(box(M.fde, 0.042, 0.11, 0.055, 0, -0.095, 0.06, 0.16));    // grip
  const mag = box(M.poly, 0.042, 0.13, 0.05, 0, -0.105, -0.05, -0.14);
  g.add(mag);
  ud.mag = mag; ud.magY = mag.position.y;
  // red dot sight: open ring + glowing reticle dot
  const sightRing = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.0035, 8, 18), M.dark);
  sightRing.position.set(0, 0.062, -0.05);
  g.add(sightRing);
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.004, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff2a1a })
  );
  dot.position.set(0, 0.062, -0.048);
  g.add(dot);
  g.add(box(M.dark, 0.012, 0.03, 0.03, 0, 0.03, -0.05));           // sight mount
  g.add(box(M.accent, 0.012, 0.026, 0.012, 0, 0.055, -0.44));      // front post
  g.add(decal(stencilTexture('VK-7', '#d8d2c0', '5.56'), 0.09, 0.022, -0.026, 0.005, 0.02));
  g.add(hand(M, 0, -0.105, 0.06, 0.25, 1.05));
  g.add(hand(M, 0.012, -0.05, -0.28, -0.2, 1));
  ud.muzzle = new THREE.Vector3(0, 0.01, -0.66);
  ud.ads = new THREE.Vector3(0.15, -0.35, -0.44);
  return g;
}

function buildShotgun(M) {
  const g = new THREE.Group();
  const ud = g.userData;
  g.add(box(M.steel, 0.06, 0.075, 0.26, 0, 0.005, 0.08));          // receiver
  g.add(tube(M.steel, 0.021, 0.56, 0, 0.018, -0.32));              // barrel
  g.add(tube(M.dark, 0.017, 0.42, 0, -0.028, -0.22));              // mag tube
  // ribbed pump
  const pump = new THREE.Group();
  const pumpBody = tube(M.poly, 0.026, 0.11, 0, 0, 0);
  pump.add(pumpBody);
  for (let i = 0; i < 3; i++) pump.add(ring(M.dark, 0.028, 0.012, 0, 0, -0.04 + i * 0.04));
  pump.position.set(0, -0.028, -0.36);
  g.add(pump);
  ud.pump = pump; ud.pumpZ = pump.position.z;
  g.add(box(M.fde, 0.044, 0.07, 0.17, 0, -0.03, 0.24));            // stock
  g.add(box(M.fde, 0.042, 0.1, 0.055, 0, -0.085, 0.1, 0.2));       // grip
  g.add(box(M.accent, 0.012, 0.02, 0.012, 0, 0.062, -0.58));       // bead
  g.add(ring(M.dark, 0.026, 0.02, 0, 0.018, -0.6));                // muzzle ring
  g.add(decal(stencilTexture('M8', '#d8d2c0', '12GA'), 0.08, 0.02, -0.031, 0.005, 0.08));
  g.add(hand(M, 0, -0.095, 0.12, 0.3, 1.05));
  g.add(hand(M, 0.004, -0.062, -0.36, -0.1, 1));
  ud.muzzle = new THREE.Vector3(0, 0.018, -0.62);
  ud.ads = new THREE.Vector3(0.15, -0.35, -0.44);
  return g;
}

function buildSniper(M) {
  const g = new THREE.Group();
  const ud = g.userData;
  g.add(box(M.steel, 0.048, 0.065, 0.42, 0, 0, 0.02));             // receiver/chassis
  g.add(tube(M.steel, 0.012, 0.62, 0, 0.008, -0.55));              // long barrel
  g.add(ring(M.dark, 0.022, 0.06, 0, 0.008, -0.84));               // muzzle brake
  g.add(ring(M.dark, 0.017, 0.02, 0, 0.008, -0.78));
  g.add(tube(M.poly, 0.03, 0.3, 0, -0.012, -0.3));                 // handguard tube
  // scope
  g.add(tube(M.dark, 0.024, 0.2, 0, 0.075, -0.02));
  g.add(ring(M.steel, 0.027, 0.02, 0, 0.075, -0.11));
  g.add(ring(M.steel, 0.027, 0.02, 0, 0.075, 0.07));
  g.add(ring(M.lens, 0.02, 0.004, 0, 0.075, -0.122));              // lens
  g.add(box(M.dark, 0.012, 0.03, 0.04, 0, 0.04, -0.02));           // scope mount
  // bolt handle
  const bolt = new THREE.Group();
  bolt.add(tube(M.steel, 0.008, 0.05, 0, 0, 0));
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), M.dark);
  knob.position.set(0, 0, 0.03);
  bolt.add(knob);
  bolt.rotation.z = Math.PI / 2;
  bolt.position.set(0.04, 0.02, 0.1);
  g.add(bolt);
  ud.bolt = bolt;
  const mag = box(M.poly, 0.042, 0.09, 0.05, 0, -0.08, -0.05, -0.06);
  g.add(mag);
  ud.mag = mag; ud.magY = mag.position.y;
  g.add(box(M.fde, 0.046, 0.1, 0.055, 0, -0.085, 0.1, 0.16));      // grip
  g.add(box(M.fde, 0.044, 0.06, 0.2, 0, -0.02, 0.28));             // stock
  g.add(box(M.fde, 0.046, 0.035, 0.08, 0, 0.032, 0.3));            // cheek rest
  g.add(decal(stencilTexture('LR-50', '#d8d2c0', '.338'), 0.1, 0.025, -0.025, 0, 0.02));
  g.add(hand(M, 0, -0.095, 0.1, 0.25, 1.05));
  g.add(hand(M, 0.01, -0.055, -0.28, -0.15, 1));
  ud.muzzle = new THREE.Vector3(0, 0.008, -0.88);
  ud.ads = new THREE.Vector3(0.15, -0.35, -0.44); // only seen during scope-in transition
  return g;
}

// ============ WeaponSystem ============
export class WeaponSystem {
  constructor(camera, effects, audio, hud) {
    this.camera = camera;
    this.effects = effects;
    this.audio = audio;
    this.hud = hud;

    this.rig = new THREE.Group();
    camera.add(this.rig);

    const fill = new THREE.PointLight(0xfff2dd, 0.75, 2.4, 1.6);
    fill.position.set(0.1, 0.1, 0.1);
    camera.add(fill);

    const M = gunMats();
    const builders = [buildPistol, buildRifle, buildShotgun, buildSniper];
    this.state = WEAPONS.map((def, i) => {
      const vm = builders[i](M);
      vm.visible = false;
      this.rig.add(vm);
      return {
        def, vm,
        mag: def.mag, reserve: def.reserve,
        cooldown: 0, bloom: 0,
      };
    });
    this.current = 0;
    this.state[0].vm.visible = true;

    this.ads = 0;
    this.reloading = 0;
    this.reloadTotal = 1;
    this.switching = 0;
    this.pendingSwitch = -1;
    this.recoilVis = 0;
    this.recoilYaw = 0;
    this.kickZ = 0;
    this.swayX = 0; this.swayY = 0;
    this.prevLmb = false;
    // mechanical action timers
    this.slideT = 0;
    this.pumpT = 0;
    this.boltT = 0;
    this._ray = new THREE.Raycaster();
    this._muzzleWorld = new THREE.Vector3();

    this.flash = new THREE.Sprite(new THREE.SpriteMaterial({
      map: flashTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
    }));
    this.flash.scale.set(0.34, 0.34, 0.34);
    this.flash.visible = false;
    camera.add(this.flash);
    this.flashLight = new THREE.PointLight(0xffb347, 0, 9, 2);
    camera.add(this.flashLight);
    this.flashTimer = 0;

    this.hooks = { onKill: () => {}, onAmmoChange: () => {} };
    this._syncHud();
  }

  get cur() { return this.state[this.current]; }
  get isBusy() { return this.reloading > 0 || this.switching > 0; }
  get scoped() { return this.cur.def.scoped && this.ads > 0.7; }

  reset() {
    this.state.forEach((s) => {
      s.mag = s.def.mag;
      s.reserve = s.def.reserve;
      s.cooldown = 0; s.bloom = 0;
      s.vm.visible = false;
    });
    this.current = 0;
    this.state[0].vm.visible = true;
    this.reloading = 0; this.switching = 0; this.ads = 0;
    this.recoilVis = 0; this.recoilYaw = 0; this.kickZ = 0;
    this.slideT = 0; this.pumpT = 0; this.boltT = 0;
    this._syncHud();
  }

  switchTo(i) {
    if (i === this.current || this.isBusy || i < 0 || i >= this.state.length) return;
    this.pendingSwitch = i;
    this.switching = 0.34;
    this.reloading = 0;
    this._restoreParts();
    this.audio.uiClick();
  }

  cycle(dir) {
    this.switchTo((this.current + dir + this.state.length) % this.state.length);
  }

  tryReload() {
    const s = this.cur;
    if (this.isBusy || s.mag >= s.def.mag || s.reserve <= 0) return;
    this.reloading = s.def.reloadTime;
    this.reloadTotal = s.def.reloadTime;
    this.audio.reload();
  }

  addAmmo(fraction = 0.5) {
    let added = false;
    for (const s of this.state) {
      const give = Math.ceil(s.def.reserveMax * fraction);
      if (s.reserve < s.def.reserveMax) { s.reserve = Math.min(s.def.reserveMax, s.reserve + give); added = true; }
    }
    if (added) this._syncHud();
    return added;
  }

  _restoreParts() {
    const ud = this.cur.vm.userData;
    if (ud.mag) { ud.mag.visible = true; ud.mag.position.y = ud.magY; }
    if (ud.slide) ud.slide.position.z = ud.slideZ;
    if (ud.pump) ud.pump.position.z = ud.pumpZ;
    if (ud.bolt) { ud.bolt.rotation.x = 0; ud.bolt.position.z = 0.1; }
  }

  update(dt, ctx) {
    const { input, player, world, enemies, stats, active, lookDelta } = ctx;
    const s = this.cur;
    const def = s.def;
    const ud = s.vm.userData;

    // --- ADS ---
    const wantAds = active && input.rmb && this.switching <= 0 && this.reloading <= 0;
    this.ads = damp(this.ads, wantAds ? 1 : 0, 14, dt);
    player.fovMult = lerp(1, def.zoomFov / player.baseFov, this.ads);
    this.hud.setScope(this.scoped);
    this.cur.vm.visible = !this.scoped;

    // --- switching ---
    if (this.switching > 0) {
      this.switching -= dt;
      if (this.pendingSwitch >= 0 && this.switching <= 0.17) {
        s.vm.visible = false;
        this._restoreParts();
        this.current = this.pendingSwitch;
        this.pendingSwitch = -1;
        this.cur.vm.visible = !this.scoped;
        this._syncHud();
      }
      if (this.switching < 0) this.switching = 0;
    }

    // --- reload ---
    if (this.reloading > 0) {
      this.reloading -= dt;
      this.hud.setReloadProgress(1 - this.reloading / this.reloadTotal);
      if (this.reloading <= 0) {
        const need = def.mag - s.mag;
        const take = Math.min(need, s.reserve);
        s.mag += take;
        s.reserve -= take;
        this.hud.setReloadProgress(-1);
        this._syncHud();
      }
    }

    // --- cooldowns / recovery ---
    s.cooldown -= dt;
    s.bloom = damp(s.bloom, 0, 4, dt);
    this.recoilVis = damp(this.recoilVis, 0, 9, dt);
    this.recoilYaw = damp(this.recoilYaw, 0, 9, dt);
    this.kickZ = damp(this.kickZ, 0, 11, dt);

    // --- firing ---
    const triggered = def.auto ? input.lmb : (input.lmb && !this.prevLmb);
    this.prevLmb = input.lmb;
    if (active && triggered && !this.isBusy && s.cooldown <= 0 && player.alive) {
      if (s.mag <= 0) {
        this.audio.dryFire();
        s.cooldown = 0.25;
        this.tryReload();
      } else {
        this._fire(ctx);
        s.cooldown = 60 / def.rpm;
      }
    }

    // --- mechanical action animations ---
    if (this.slideT > 0) {
      this.slideT -= dt;
      const p = 1 - Math.max(this.slideT, 0) / 0.09;
      if (ud.slide) ud.slide.position.z = ud.slideZ + Math.sin(Math.min(p, 1) * Math.PI) * 0.028;
    }
    if (this.pumpT > 0) {
      this.pumpT -= dt;
      const p = 1 - Math.max(this.pumpT, 0) / 0.26;
      if (ud.pump) ud.pump.position.z = ud.pumpZ + Math.sin(Math.min(p, 1) * Math.PI) * 0.07;
    }
    if (this.boltT > 0) {
      this.boltT -= dt;
      const p = 1 - Math.max(this.boltT, 0) / 0.4;
      if (ud.bolt) {
        ud.bolt.rotation.x = Math.sin(p * Math.PI) * 0.9;
        ud.bolt.position.z = 0.1 + Math.sin(p * Math.PI) * 0.04;
      }
    }

    // --- view-model motion ---
    this.swayX = damp(this.swayX, clamp(-lookDelta.dx * 2.4, -0.06, 0.06), 8, dt);
    this.swayY = damp(this.swayY, clamp(lookDelta.dy * 2.4, -0.05, 0.05), 8, dt);
    const bobA = player.bobAmp * (1 - this.ads * 0.8);
    const bobX = Math.cos(player.bobPhase * 0.5) * bobA * 0.8;
    const bobY = Math.abs(Math.sin(player.bobPhase)) * bobA;

    const pos = HIP_POS.clone().lerp(ud.ads || ADS_POS, this.ads);
    pos.x += bobX + this.swayX;
    pos.y += bobY + this.swayY;
    pos.z += this.kickZ;

    let rotX = this.recoilVis * 1.6 + this.swayY * 1.2;
    let rotY = this.swayX * 1.4;
    let rotZ = this.swayX * 0.6;

    // reload: roll in, mag swap, rack out
    if (this.reloading > 0) {
      const p = 1 - this.reloading / this.reloadTotal;
      const env = Math.sin(Math.min(p * 1.12, 1) * Math.PI);
      pos.y -= env * 0.15;
      rotZ += env * 0.5;
      rotX -= env * 0.28;
      if (ud.mag) {
        if (p < 0.28) {
          ud.mag.position.y = ud.magY - (p / 0.28) * 0.13;
        } else if (p < 0.5) {
          ud.mag.visible = p < 0.42; // old mag away, brief empty
        } else {
          ud.mag.visible = true;
          const q = Math.min((p - 0.5) / 0.3, 1);
          ud.mag.position.y = ud.magY - (1 - q) * 0.13;
        }
      }
    } else if (ud.mag && !ud.mag.visible) {
      ud.mag.visible = true;
      ud.mag.position.y = ud.magY;
    }

    // switch lower/raise
    if (this.switching > 0) {
      const p = this.switching / 0.34;
      const down = p > 0.5 ? (p - 0.5) * 2 : 0;
      const up = p <= 0.5 ? 1 - p * 2 : 0;
      pos.y -= (down + up) * 0.3;
      rotX -= (down + up) * 0.7;
    }
    this.rig.position.copy(pos);
    this.rig.rotation.set(rotX, rotY, rotZ);

    this.camera.rotation.x += this.recoilVis;
    this.camera.rotation.y += this.recoilYaw;

    // muzzle flash decay
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.flash.visible = false;
        this.flashLight.intensity = 0;
      } else {
        this.flashLight.intensity *= 0.75;
      }
    }

    const spread = this._currentSpread(player);
    this.hud.setCrosshairSpread(spread, this.ads > 0.5 || this.scoped);
  }

  _currentSpread(player) {
    const def = this.cur.def;
    let sp = def.spread + this.cur.bloom;
    sp += player.speedFrac * 0.018;
    if (!player.onGround) sp += 0.02;
    sp *= lerp(1, def.adsSpreadMult, this.ads * this.ads); // accuracy ramps fast into ADS
    return sp;
  }

  _fire(ctx) {
    const { player, world, enemies, stats } = ctx;
    const s = this.cur;
    const def = s.def;
    s.mag--;
    stats.shots++;

    player.pitch += def.recoil.pitch * 0.55;
    player.yaw += rand(-def.recoil.yaw, def.recoil.yaw) * 0.5;
    this.recoilVis += def.recoil.pitch * 0.75;
    this.recoilYaw += rand(-def.recoil.yaw, def.recoil.yaw);
    this.kickZ += def.recoil.kick;
    s.bloom = Math.min(def.bloomMax, s.bloom + def.bloomPerShot);

    // mechanical action
    if (def.id === 'pistol') this.slideT = 0.09;
    else if (def.id === 'shotgun') this.pumpT = 0.26;
    else if (def.id === 'sniper') this.boltT = 0.4;

    this.audio.shoot(def.sfx);
    this.effects.shake(def.recoil.kick * 0.9);

    const muzzleLocal = s.vm.userData.muzzle.clone();
    const muzzleWorld = s.vm.localToWorld(muzzleLocal.clone());
    this._muzzleWorld.copy(muzzleWorld);
    this.flash.position.copy(this.camera.worldToLocal(muzzleWorld.clone()));
    this.flash.material.rotation = rand(0, Math.PI * 2);
    const fs = rand(0.26, 0.42);
    this.flash.scale.set(fs, fs, fs);
    this.flash.visible = true;
    this.flashLight.position.copy(this.flash.position);
    this.flashLight.intensity = 26;
    this.flashTimer = 0.05;

    const spread = this._currentSpread(player);
    const enemyMeshes = enemies.hitMeshes;
    const targets = enemyMeshes.concat(world.raycastTargets);
    const origin = new THREE.Vector3();
    this.camera.getWorldPosition(origin);
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);

    let anyHit = false, anyKill = false, anyHead = false;

    for (let p = 0; p < def.pellets; p++) {
      const dir = camDir.clone();
      dir.x += rand(-spread, spread);
      dir.y += rand(-spread, spread);
      dir.z += rand(-spread, spread);
      dir.normalize();
      this._ray.set(origin, dir);
      this._ray.far = def.range;
      const hits = this._ray.intersectObjects(targets, false);
      const hit = hits[0];
      const end = hit ? hit.point : origin.clone().addScaledVector(dir, def.range);
      this.effects.tracer(muzzleWorld, end, def.tracer);

      if (!hit) continue;
      const ud2 = hit.object.userData;
      if (ud2 && ud2.enemy && !ud2.enemy.dead) {
        const dist = hit.distance;
        let falloff = 1;
        if (dist > def.falloffStart) {
          falloff = lerp(1, def.falloffMin, clamp((dist - def.falloffStart) / (def.falloffEnd - def.falloffStart), 0, 1));
        }
        // headshot if the ray also clipped the head proxy near the impact point
        const headHit = hits.find((h) =>
          h.object.userData.part === 'head' &&
          h.object.userData.enemy === ud2.enemy &&
          h.distance - hit.distance < 0.35);
        const head = ud2.part === 'head' || !!headHit;
        const dmg = Math.round(def.damage * falloff * (head ? def.headMult : 1));
        const killed = enemies.damage(ud2.enemy, dmg, head, dir);
        this.effects.blood(headHit ? headHit.point : hit.point, head);
        if (head) stats.headshots++;
        anyHit = true; anyHead = anyHead || head;
        if (killed) {
          anyKill = true;
          stats.kills++;
          this.hooks.onKill(ud2.enemy, head, hit.point);
        }
      } else {
        this.effects.impact(hit.point, hit.face ? hit.face.normal : null);
      }
    }

    if (anyHit) {
      stats.hits++;
      this.hud.hitmarker(anyKill, anyHead);
      this.audio.hit(anyKill);
      if (anyHead && !anyKill) this.audio.headshot();
    }
    this._syncHud();
  }

  _syncHud() {
    const s = this.cur;
    this.hud.setAmmo(s.mag, s.reserve, s.def.name);
    this.hud.setSlots(this.state.map((x) => x.reserve + x.mag), this.current);
  }
}
