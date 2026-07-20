import * as THREE from 'three';
import { ARENA } from './config.js';
import { rand, mulberry32 } from './utils.js';
import { concreteMaps, metalMaps, hazardTexture, skyTexture, scorchTexture, lightConeTexture } from './textures.js';

// ============ Pickup: health / ammo ============
class Pickup {
  constructor(scene, type, pos, permanent = false) {
    this.type = type;
    this.permanent = permanent;
    this.dead = false;
    this.respawnTimer = 0;
    this.t = rand(0, Math.PI * 2);

    const group = new THREE.Group();
    if (type === 'health') {
      const mat = new THREE.MeshStandardMaterial({ color: 0xf2f5ef, emissive: 0x2aff7a, emissiveIntensity: 1.1, roughness: 0.4 });
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.16), mat);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), mat);
      const casing = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.62, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x23282c, roughness: 0.5, metalness: 0.6 })
      );
      casing.position.z = -0.1;
      group.add(a, b, casing);
    } else {
      const mat = new THREE.MeshStandardMaterial({ color: 0x2a2416, emissive: 0xffd23f, emissiveIntensity: 0.9, roughness: 0.4, metalness: 0.5 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.32, 0.32), mat);
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.09, 0.34),
        new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffd23f, emissiveIntensity: 1.4 })
      );
      group.add(box, stripe);
    }
    group.position.copy(pos);
    scene.add(group);
    this.mesh = group;
    this.baseY = pos.y;
  }

  update(dt) {
    if (this.dead) {
      if (this.permanent) {
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) { this.dead = false; this.mesh.visible = true; }
      }
      return;
    }
    this.t += dt * 2.2;
    this.mesh.position.y = this.baseY + Math.sin(this.t) * 0.12;
    this.mesh.rotation.y += dt * 1.6;
  }

  collect() {
    this.dead = true;
    this.respawnTimer = 18;
    this.mesh.visible = false;
  }

  dispose(scene) { scene.remove(this.mesh); }
}

// ============ World ============
export class World {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this._envCache = {};
    this.levelGroup = null;
    this.colliders = [];
    this.obstacleColliders = []; // subset used by AI for cover
    this.raycastTargets = [];
    this.spawnPoints = [];
    this.pickups = [];
    this.half = ARENA.size / 2;
    this.time = 0;
    this.dust = null;
    this.flickerLamp = null;
  }

  buildLevel(def) {
    this._clear();
    const theme = def.theme;
    const g = new THREE.Group();
    this.levelGroup = g;
    const rng = mulberry32(def.layout * 1000 + 77);

    // ---- atmosphere ----
    this.scene.fog = new THREE.FogExp2(theme.fog, theme.fogDensity || 0.018);
    this.scene.background = new THREE.Color(theme.fog);

    // sky dome
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(190, 24, 14),
      new THREE.MeshBasicMaterial({ map: skyTexture(theme.skyTop, theme.skyHorizon, theme.stars), side: THREE.BackSide, fog: false })
    );
    g.add(sky);

    // environment reflections
    this.scene.environment = this._envFor(theme);
    if ('environmentIntensity' in this.scene) this.scene.environmentIntensity = 0.35;

    // ---- lights ----
    const hemi = new THREE.HemisphereLight(theme.hemi[0], theme.hemi[1], theme.hemi[2]);
    g.add(hemi);
    const key = new THREE.DirectionalLight(theme.key[0], theme.key[1]);
    key.position.set(24, 38, 14);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -45; key.shadow.camera.right = 45;
    key.shadow.camera.top = 45; key.shadow.camera.bottom = -45;
    key.shadow.camera.far = 120;
    key.shadow.bias = -0.0004;
    g.add(key);

    // ---- shared materials ----
    const conc = concreteMaps(theme.concrete, def.layout, 7);
    const groundMat = new THREE.MeshStandardMaterial({
      map: conc.map, roughnessMap: conc.roughnessMap, bumpMap: conc.bumpMap, bumpScale: 0.5,
      roughness: 1, metalness: 0.02, envMapIntensity: 0.15,
    });
    const wallMaps = metalMaps(theme.metal, def.layout + 10, 6, theme.rust ?? 0.4);
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallMaps.map, roughnessMap: wallMaps.roughnessMap, bumpMap: wallMaps.bumpMap, bumpScale: 0.3,
      roughness: 1, metalness: 0.4, envMapIntensity: 0.45,
    });
    const crateMaps = metalMaps(theme.metal, def.layout + 30, 1, theme.rust ?? 0.4);
    const crateMat = new THREE.MeshStandardMaterial({
      map: crateMaps.map, roughnessMap: crateMaps.roughnessMap, bumpMap: crateMaps.bumpMap, bumpScale: 0.25,
      roughness: 1, metalness: 0.5, envMapIntensity: 0.65,
    });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x22262b, roughness: 0.6, metalness: 0.7, envMapIntensity: 0.8 });
    const stripMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: theme.accent, emissiveIntensity: 2.4 });
    const hazardMat = new THREE.MeshStandardMaterial({ map: hazardTexture(10), roughness: 0.85, metalness: 0.15 });

    // ---- ground ----
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(ARENA.size, ARENA.size), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    g.add(ground);
    this.raycastTargets.push(ground);

    // puddles (env-reflective discs)
    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x0c1114, roughness: 0.04, metalness: 0.9,
      envMapIntensity: 1.8, transparent: true, opacity: 0.88,
    });
    for (let i = 0; i < 7; i++) {
      const r = rand(0.8, 2.4);
      const p = new THREE.Mesh(new THREE.CircleGeometry(r, 20), puddleMat);
      p.rotation.x = -Math.PI / 2;
      p.position.set(rand(-this.half + 6, this.half - 6), 0.015, rand(-this.half + 6, this.half - 6));
      p.receiveShadow = true;
      g.add(p);
    }

    // scorch decals
    const scorch = scorchTexture();
    const scorchMat = new THREE.MeshBasicMaterial({ map: scorch, transparent: true, depthWrite: false });
    for (let i = 0; i < 6; i++) {
      const s = rand(1.6, 3.4);
      const d = new THREE.Mesh(new THREE.PlaneGeometry(s, s), scorchMat);
      d.rotation.x = -Math.PI / 2;
      d.rotation.z = rand(0, Math.PI * 2);
      d.position.set(rand(-this.half + 6, this.half - 6), 0.025, rand(-this.half + 6, this.half - 6));
      g.add(d);
    }

    // scattered debris
    for (let i = 0; i < 16; i++) {
      const w = rand(0.15, 0.55);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, w * rand(0.4, 0.9), w * rand(0.6, 1.4)), i % 3 === 0 ? darkMetal : crateMat);
      m.position.set(rand(-this.half + 3, this.half - 3), w * 0.3, rand(-this.half + 3, this.half - 3));
      m.rotation.set(rand(-0.3, 0.3), rand(0, Math.PI * 2), rand(-0.25, 0.25));
      m.castShadow = m.receiveShadow = true;
      g.add(m);
    }

    // ---- walls: metal panels + hazard base + pillars + glow strip ----
    const H = ARENA.wallHeight, T = 1.2, S = ARENA.size;
    const wallDefs = [
      [0, -this.half, S + T * 2, T], [0, this.half, S + T * 2, T],
      [-this.half, 0, T, S], [this.half, 0, T, S],
    ];
    wallDefs.forEach(([x, z, w, d]) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), wallMat);
      wall.position.set(x, H / 2, z);
      wall.castShadow = wall.receiveShadow = true;
      g.add(wall);
      this.raycastTargets.push(wall);
      this.colliders.push(new THREE.Box3(
        new THREE.Vector3(x - w / 2, 0, z - d / 2),
        new THREE.Vector3(x + w / 2, H, z + d / 2)
      ));
      // hazard stripe at base
      const hz = new THREE.Mesh(new THREE.BoxGeometry(w === T ? T + 0.06 : w, 0.5, d === T ? T + 0.06 : d), hazardMat);
      hz.position.set(x, 0.55, z);
      g.add(hz);
      // glow strip on top
      const strip = new THREE.Mesh(new THREE.BoxGeometry(w === T ? T * 1.15 : w, 0.22, d === T ? T * 1.15 : d), stripMat);
      strip.position.set(x, H + 0.11, z);
      g.add(strip);
      // wall pillars for rhythm
      const along = w === T ? 'z' : 'x';
      for (let i = -2; i <= 2; i++) {
        const off = i * (S / 5.2);
        const pil = new THREE.Mesh(new THREE.BoxGeometry(1.5, H + 1.2, 1.5), wallMat);
        pil.position.set(along === 'x' ? off : x, (H + 1.2) / 2, along === 'x' ? z : off);
        pil.castShadow = true;
        g.add(pil);
      }
    });

    // corner towers
    const c = this.half;
    [[-c, -c], [c, -c], [-c, c], [c, c]].forEach(([x, z]) => {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(3, H + 3.4, 3), wallMat);
      tower.position.set(x, (H + 3.4) / 2, z);
      tower.castShadow = true;
      g.add(tower);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.3, 3.3), darkMetal);
      cap.position.set(x, H + 3.55, z);
      g.add(cap);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.14, 3.15), stripMat);
      edge.position.set(x, H + 3.3, z);
      g.add(edge);
    });

    // ---- lamp towers (motivated light + fake volumetrics) ----
    const coneTex = lightConeTexture();
    const lampR = this.half - 8;
    const lampSpots = [[-lampR, -lampR], [lampR, -lampR], [-lampR, lampR], [lampR, lampR]];
    this.flickerLamp = null;
    lampSpots.forEach(([x, z], li) => {
      // pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 6.4, 8), darkMetal);
      pole.position.set(x, 3.2, z);
      pole.castShadow = true;
      g.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.12), darkMetal);
      const inward = Math.sign(-x) || 1;
      arm.position.set(x + inward * 0.5, 6.35, z);
      g.add(arm);
      // head + lens
      const headX = x + inward * 1.0;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.34), darkMetal);
      head.position.set(headX, 6.3, z);
      g.add(head);
      const lens = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, 0.26),
        new THREE.MeshStandardMaterial({ color: 0x111111, emissive: theme.lamp, emissiveIntensity: 3.4 })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(headX, 6.18, z);
      g.add(lens);
      // light
      const pl = new THREE.PointLight(theme.lamp, 44, 32, 1.9);
      pl.position.set(headX, 6.0, z);
      g.add(pl);
      if (li === 2) this.flickerLamp = { light: pl, lens, base: 44, seed: rand(0, 10) };
      // volumetric cone
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(3.4, 6.2, 20, 1, true),
        new THREE.MeshBasicMaterial({
          map: coneTex, color: theme.lamp, transparent: true, opacity: 0.2,
          blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false, fog: false,
        })
      );
      cone.position.set(headX, 3.1, z);
      g.add(cone);
      // light pool on ground
      const pool = new THREE.Mesh(
        new THREE.CircleGeometry(3.2, 20),
        new THREE.MeshBasicMaterial({ color: theme.lamp, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(headX, 0.03, z);
      g.add(pool);
    });

    // ---- obstacles ----
    const boxes = this._layout(def.layout, rng);
    boxes.forEach(([x, z, w, h, d]) => {
      if (Math.max(w, d) <= 2.6 && h <= 2.2) {
        this._barrelCluster(g, x, z, w, h, crateMat, darkMetal, rng);
      } else {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), crateMat);
        m.position.set(x, h / 2, z);
        m.castShadow = m.receiveShadow = true;
        g.add(m);
        this.raycastTargets.push(m);
        // edge trim
        const trimT = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.1, d + 0.06), darkMetal);
        trimT.position.set(x, h - 0.05, z);
        g.add(trimT);
        const trimB = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.12, d + 0.06), darkMetal);
        trimB.position.set(x, 0.06, z);
        g.add(trimB);
        // small emissive marker
        const edge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.08), stripMat);
        edge.position.set(x, h + 0.03, z + d / 2 + 0.02);
        g.add(edge);
      }
      const box3 = new THREE.Box3(
        new THREE.Vector3(x - w / 2, 0, z - d / 2),
        new THREE.Vector3(x + w / 2, h, z + d / 2)
      );
      this.colliders.push(box3);
      this.obstacleColliders.push(box3);
    });

    // ---- dust motes ----
    this._buildDust(g, theme);

    // ---- spawn points ----
    this.spawnPoints = [];
    const sp = this.half - 5;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.spawnPoints.push(new THREE.Vector3(Math.cos(a) * sp, 0, Math.sin(a) * sp));
    }

    // ---- pickup pads (guaranteed clear of obstacles) ----
    const padSpots = [
      [0, 0], [-this.half + 9, 0], [this.half - 9, 0], [0, -this.half + 9], [0, this.half - 9],
    ];
    padSpots.forEach(([px, pz], i) => {
      const type = i % 2 === 0 ? 'health' : 'ammo';
      const spot = this._findClearSpot(px, pz);
      // pad platform
      const padBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.05, 0.1, 18), darkMetal);
      padBase.position.set(spot.x, 0.05, spot.z);
      padBase.receiveShadow = true;
      g.add(padBase);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.72, 0.035, 8, 28),
        new THREE.MeshStandardMaterial({
          color: 0x111111,
          emissive: type === 'health' ? 0x2aff7a : 0xffd23f, emissiveIntensity: 2,
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(spot.x, 0.11, spot.z);
      g.add(ring);
      this.pickups.push(new Pickup(this.scene, type, new THREE.Vector3(spot.x, 0.7, spot.z), true));
    });

    this.scene.add(g);
  }

  _barrelCluster(g, x, z, w, h, crateMat, darkMetal, rng) {
    const n = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < n; i++) {
      const r = Math.min(w, h) * rand(0.26, 0.34);
      const bh = h * rand(0.75, 1);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, bh, 14), crateMat);
      b.position.set(x + rand(-w / 4, w / 4), bh / 2, z + rand(-w / 4, w / 4));
      b.castShadow = b.receiveShadow = true;
      g.add(b);
      this.raycastTargets.push(b);
      // ribs
      [-0.28, 0.05, 0.34].forEach((oy) => {
        const rib = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.02, r + 0.02, 0.05, 14), darkMetal);
        rib.position.set(b.position.x, bh / 2 + oy * bh, b.position.z);
        g.add(rib);
      });
    }
  }

  _buildDust(g, theme) {
    const N = 260;
    const pos = new Float32Array(N * 3);
    const base = new Float32Array(N * 3);
    const phase = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      base[i * 3] = rand(-this.half, this.half);
      base[i * 3 + 1] = rand(0.3, 6.5);
      base[i * 3 + 2] = rand(-this.half, this.half);
      phase[i] = rand(0, Math.PI * 2);
    }
    pos.set(base);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 200);
    const mat = new THREE.PointsMaterial({
      size: 0.055, color: theme.dust, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    g.add(pts);
    this.dust = { pts, base, phase, n: N };
  }

  _envFor(theme) {
    const key = theme.skyTop + theme.accent;
    if (this._envCache[key]) return this._envCache[key];
    const s = new THREE.Scene();
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(50, 16, 12),
      new THREE.MeshBasicMaterial({ map: skyTexture(theme.skyTop, theme.skyHorizon, false), side: THREE.BackSide })
    );
    s.add(sky);
    const gnd = new THREE.Mesh(new THREE.CircleGeometry(50, 16), new THREE.MeshBasicMaterial({ color: 0x0b0d0f }));
    gnd.rotation.x = -Math.PI / 2;
    gnd.position.y = -2;
    s.add(gnd);
    // bright strips => specular highlights on metals
    for (let i = 0; i < 3; i++) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(26, 2.4), new THREE.MeshBasicMaterial({ color: theme.lamp }));
      const a = (i / 3) * Math.PI * 2;
      strip.position.set(Math.cos(a) * 30, 9, Math.sin(a) * 30);
      strip.lookAt(0, 0, 0);
      s.add(strip);
    }
    const rt = this.pmrem.fromScene(s, 0.02);
    s.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
    });
    this._envCache[key] = rt.texture;
    return this._envCache[key];
  }

  _findClearSpot(x, z) {
    for (let r = 0; r < 12; r++) {
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        const p = new THREE.Vector3(x + Math.cos(ang) * r * 1.2, 0, z + Math.sin(ang) * r * 1.2);
        if (Math.abs(p.x) < this.half - 3 && Math.abs(p.z) < this.half - 3 && !this._insideObstacle(p, 1.6)) return p;
      }
    }
    return new THREE.Vector3(x, 0, z);
  }

  // Obstacle layouts: [x, z, w, h, d]
  _layout(idx, rng) {
    const r = () => rand(0, 1);
    const j = (v) => v + (r() - 0.5) * 3;
    switch (idx) {
      case 0:
        return [
          [0, 0, 4, 2.2, 4], [j(4.5), j(1), 2.2, 1.4, 2.2], [j(-4.5), j(-1), 2.2, 1.4, 2.2],
          [-18, -18, 3, 4.2, 3], [18, -18, 3, 4.2, 3], [-18, 18, 3, 4.2, 3], [18, 18, 3, 4.2, 3],
          [j(-14), j(8), 5, 1.3, 1.4], [j(14), j(-8), 5, 1.3, 1.4],
          [j(8), j(-16), 1.4, 1.3, 5], [j(-8), j(16), 1.4, 1.3, 5],
          [j(-22), j(-10), 1.6, 1.1, 1.6], [j(22), j(12), 1.6, 1.1, 1.6],
        ];
      case 1:
        return [
          [0, -10, 8, 1.4, 1.6], [0, 10, 8, 1.4, 1.6], [-10, 0, 1.6, 1.4, 8], [10, 0, 1.6, 1.4, 8],
          [-7, -7, 3, 2.4, 3], [7, -7, 3, 2.4, 3], [-7, 7, 3, 2.4, 3], [7, 7, 3, 2.4, 3],
          [j(-20), j(-6), 2.4, 1.8, 2.4], [j(20), j(6), 2.4, 1.8, 2.4],
          [j(-6), j(20), 2.4, 1.8, 2.4], [j(6), j(-20), 2.4, 1.8, 2.4],
          [j(-20), j(20), 4, 1.2, 1.6], [j(20), j(-20), 4, 1.2, 1.6],
          [j(-16), j(2), 1.5, 1.2, 1.5], [j(16), j(-2), 1.5, 1.2, 1.5],
        ];
      case 2:
        return [
          [-12, -12, 2.2, 5, 2.2], [12, -12, 2.2, 5, 2.2], [-12, 12, 2.2, 5, 2.2], [12, 12, 2.2, 5, 2.2],
          [0, -16, 6, 1.5, 1.6], [0, 16, 6, 1.5, 1.6], [-16, 0, 1.6, 1.5, 6], [16, 0, 1.6, 1.5, 6],
          [j(0), j(0), 5, 2.6, 5],
          [j(-22), j(-22), 3, 1.6, 3], [j(22), j(22), 3, 1.6, 3],
          [j(-22), j(22), 3, 1.6, 3], [j(22), j(-22), 3, 1.6, 3],
          [j(-6), j(-6), 1.7, 1.3, 1.7], [j(6), j(6), 1.7, 1.3, 1.7],
        ];
      default:
        return [
          [0, 0, 7, 3.4, 7],
          [-14, -6, 1.8, 2, 9], [14, 6, 1.8, 2, 9], [-6, 14, 9, 2, 1.8], [6, -14, 9, 2, 1.8],
          [-20, -20, 4, 2.8, 4], [20, 20, 4, 2.8, 4], [-20, 20, 4, 2.8, 4], [20, -20, 4, 2.8, 4],
          [j(-24), j(0), 3, 1.4, 3], [j(24), j(0), 3, 1.4, 3],
          [j(0), j(-24), 3, 1.4, 3], [j(0), j(24), 3, 1.4, 3],
          [j(-10), j(18), 1.6, 1.2, 1.6], [j(10), j(-18), 1.6, 1.2, 1.6],
        ];
    }
  }

  _insideObstacle(p, pad = 0) {
    return this.colliders.some((b) =>
      p.x > b.min.x - pad && p.x < b.max.x + pad &&
      p.z > b.min.z - pad && p.z < b.max.z + pad);
  }

  collide(pos, radius) {
    for (const b of this.colliders) {
      const cx = Math.max(b.min.x, Math.min(pos.x, b.max.x));
      const cz = Math.max(b.min.z, Math.min(pos.z, b.max.z));
      const dx = pos.x - cx, dz = pos.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < radius * radius) {
        if (d2 > 1e-8) {
          const d = Math.sqrt(d2);
          pos.x = cx + (dx / d) * radius;
          pos.z = cz + (dz / d) * radius;
        } else {
          const pushL = pos.x - (b.min.x - radius), pushR = (b.max.x + radius) - pos.x;
          const pushB = pos.z - (b.min.z - radius), pushF = (b.max.z + radius) - pos.z;
          const m = Math.min(pushL, pushR, pushB, pushF);
          if (m === pushL) pos.x = b.min.x - radius;
          else if (m === pushR) pos.x = b.max.x + radius;
          else if (m === pushB) pos.z = b.min.z - radius;
          else pos.z = b.max.z + radius;
        }
      }
    }
    const lim = this.half - 1.5;
    pos.x = Math.max(-lim, Math.min(lim, pos.x));
    pos.z = Math.max(-lim, Math.min(lim, pos.z));
  }

  hasLineOfSight(a, b) {
    const dir = b.clone().sub(a);
    const dist = dir.length();
    dir.normalize();
    this._losRay.set(a, dir);
    this._losRay.far = dist;
    const hits = this._losRay.intersectObjects(this.raycastTargets, false);
    return hits.length === 0;
  }
  _losRay = new THREE.Raycaster();

  spawnPickup(type, pos) {
    const p = pos.clone();
    p.y = 0.7;
    this.pickups.push(new Pickup(this.scene, type, p, false));
  }

  update(dt, playerPos, onCollect) {
    this.time += dt;

    // dust drift
    if (this.dust) {
      const arr = this.dust.pts.geometry.attributes.position.array;
      const { base, phase, n } = this.dust;
      const t = this.time;
      for (let i = 0; i < n; i++) {
        arr[i * 3] = base[i * 3] + Math.sin(t * 0.24 + phase[i]) * 0.9;
        arr[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.4 + phase[i] * 1.7) * 0.55;
        arr[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.19 + phase[i]) * 0.9;
      }
      this.dust.pts.geometry.attributes.position.needsUpdate = true;
    }

    // one faulty lamp flickers
    if (this.flickerLamp) {
      const f = this.flickerLamp;
      const t = this.time * 11 + f.seed;
      const drop = (Math.sin(t * 1.7) > 0.92 || Math.sin(t * 3.3) > 0.96) ? 0.25 : 1;
      f.light.intensity = f.base * (0.9 + 0.1 * Math.sin(t)) * drop;
      f.lens.material.emissiveIntensity = 3.4 * drop;
    }

    // pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.update(dt);
      if (!p.dead && playerPos.distanceTo(p.mesh.position) < 1.35) {
        const consumed = onCollect(p.type, p.mesh.position);
        if (consumed) {
          p.collect();
          if (!p.permanent) {
            p.dispose(this.scene);
            this.pickups.splice(i, 1);
          }
        }
      }
    }
  }

  _clear() {
    if (this.levelGroup) {
      this.scene.remove(this.levelGroup);
      this.levelGroup.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (o.material.map) o.material.map.dispose();
          if (o.material.roughnessMap) o.material.roughnessMap.dispose();
          if (o.material.bumpMap) o.material.bumpMap.dispose();
          o.material.dispose();
        }
      });
    }
    this.levelGroup = null;
    this.colliders = [];
    this.obstacleColliders = [];
    this.raycastTargets = [];
    this.dust = null;
    this.flickerLamp = null;
    this.pickups.forEach((p) => p.dispose(this.scene));
    this.pickups = [];
  }
}
