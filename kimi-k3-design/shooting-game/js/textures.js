import * as THREE from 'three';
import { rand, mulberry32 } from './utils.js';

// ============ Procedural texture factory (albedo + roughness + bump) ============

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')];
}

function toTex(c, repeat = 1, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function speckle(ctx, s, n, alpha, rng, light = false) {
  for (let i = 0; i < n; i++) {
    const v = Math.floor(rng() * 90) + (light ? 140 : 10);
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha * (0.4 + rng() * 0.6)})`;
    ctx.fillRect(rng() * s, rng() * s, 1 + rng() * 2, 1 + rng() * 2);
  }
}

function stains(ctx, s, n, maxR, color, alpha, rng) {
  for (let i = 0; i < n; i++) {
    const x = rng() * s, y = rng() * s, r = maxR * (0.3 + rng() * 0.7);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color.replace('A', String(alpha * (0.5 + rng() * 0.5))));
    g.addColorStop(1, color.replace('A', '0'));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

function cracks(ctx, s, n, rng, color = 'rgba(18,20,22,0.5)') {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    let x = rng() * s, y = rng() * s;
    ctx.beginPath(); ctx.moveTo(x, y);
    const steps = 4 + Math.floor(rng() * 6);
    let a = rng() * Math.PI * 2;
    for (let k = 0; k < steps; k++) {
      a += (rng() - 0.5) * 1.4;
      x += Math.cos(a) * (6 + rng() * 18);
      y += Math.sin(a) * (6 + rng() * 18);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

// ---- Concrete / asphalt: returns {map, roughnessMap, bumpMap} ----
export function concreteMaps(base = '#565d63', seed = 1, repeat = 8) {
  const rng = mulberry32(seed * 991 + 13);
  const S = 512;
  const [c, ctx] = canvas(S);
  ctx.fillStyle = base; ctx.fillRect(0, 0, S, S);

  // large tonal variation
  stains(ctx, S, 10, 190, 'rgba(0,0,0,A)', 0.16, rng);
  stains(ctx, S, 6, 150, 'rgba(255,255,255,A)', 0.05, rng);
  speckle(ctx, S, 5200, 0.16, rng);
  speckle(ctx, S, 1600, 0.1, rng, true);
  cracks(ctx, S, 14, rng);

  // expansion-joint grid
  ctx.strokeStyle = 'rgba(14,16,18,0.85)'; ctx.lineWidth = 4;
  for (let i = 0; i <= 2; i++) {
    const p = i * (S / 2);
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(S, p); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 2; i++) {
    const p = i * (S / 2) + 3;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(S, p); ctx.stroke();
  }

  // roughness: noisy mid-gray, stains read as polished/wet (darker = smoother)
  const [rc, rctx] = canvas(S);
  rctx.fillStyle = '#d8d8d8'; rctx.fillRect(0, 0, S, S);
  speckle(rctx, S, 2600, 0.25, rng);
  stains(rctx, S, 8, 160, 'rgba(70,70,70,A)', 0.5, rng);

  return { map: toTex(c, repeat), roughnessMap: toTex(rc, repeat, false), bumpMap: toTex(rc, repeat, false) };
}

// ---- Riveted metal panels: returns {map, roughnessMap, bumpMap} ----
export function metalMaps(base = '#4a5157', seed = 2, repeat = 2, rustAmt = 0.4) {
  const rng = mulberry32(seed * 733 + 91);
  const S = 512;
  const [c, ctx] = canvas(S);
  ctx.fillStyle = base; ctx.fillRect(0, 0, S, S);

  // brushed metal streaks
  for (let i = 0; i < 900; i++) {
    const y = rng() * S;
    const v = Math.floor(rng() * 60);
    ctx.fillStyle = `rgba(${140 + v},${145 + v},${150 + v},${0.05 + rng() * 0.08})`;
    ctx.fillRect(rng() * S, y, 20 + rng() * 90, 1);
  }
  stains(ctx, S, 7, 150, 'rgba(0,0,0,A)', 0.2, rng);

  // rust streaks running down
  for (let i = 0; i < 26 * rustAmt; i++) {
    const x = rng() * S, y0 = rng() * S * 0.7, len = 30 + rng() * 140;
    const g = ctx.createLinearGradient(x, y0, x, y0 + len);
    g.addColorStop(0, `rgba(122,68,32,${0.12 + rng() * 0.2})`);
    g.addColorStop(1, 'rgba(122,68,32,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y0, 2 + rng() * 5, len);
  }

  // panel seams + rivets
  const panels = 2;
  ctx.strokeStyle = 'rgba(10,11,13,0.9)'; ctx.lineWidth = 3;
  for (let i = 0; i <= panels; i++) {
    const p = i * (S / panels);
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(S, p); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(20,22,25,0.9)';
  for (let i = 0; i <= panels; i++) {
    for (let k = 0; k < 8; k++) {
      const p = i * (S / panels), q = (k + 0.5) * (S / 8);
      ctx.beginPath(); ctx.arc(p, q, 3, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(q, p, 3, 0, 7); ctx.fill();
    }
  }
  speckle(ctx, S, 1500, 0.12, rng);

  const [rc, rctx] = canvas(S);
  rctx.fillStyle = '#9a9a9a'; rctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 700; i++) {
    const y = rng() * S;
    rctx.fillStyle = `rgba(200,200,200,${0.06 + rng() * 0.1})`;
    rctx.fillRect(rng() * S, y, 30 + rng() * 80, 1);
  }
  stains(rctx, S, 6, 140, 'rgba(60,60,60,A)', 0.4, rng);

  return { map: toTex(c, repeat), roughnessMap: toTex(rc, repeat, false), bumpMap: toTex(rc, repeat, false) };
}

// ---- Hazard stripe band ----
export function hazardTexture(repeat = 6) {
  const S = 128;
  const [c, ctx] = canvas(S);
  ctx.fillStyle = '#c9a227'; ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = '#15161a';
  for (let i = -2; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 32, 0); ctx.lineTo(i * 32 + 32, 0);
    ctx.lineTo(i * 32 + 32 - S, S); ctx.lineTo(i * 32 - S, S);
    ctx.fill();
  }
  // grime
  const rng = mulberry32(42);
  stains(ctx, S, 5, 60, 'rgba(0,0,0,A)', 0.35, rng);
  const t = toTex(c, repeat);
  t.repeat.set(repeat, 1);
  return t;
}

// ---- Sky dome: vertical gradient + optional stars ----
export function skyTexture(top, horizon, stars = false) {
  const [c, ctx] = canvas(512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, top);
  g.addColorStop(0.62, top);
  g.addColorStop(0.78, horizon);
  g.addColorStop(1, horizon);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  if (stars) {
    const rng = mulberry32(7);
    for (let i = 0; i < 240; i++) {
      const y = rng() * 300;
      const a = (1 - y / 320) * (0.3 + rng() * 0.7);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      const r = rng() < 0.12 ? 2 : 1;
      ctx.fillRect(rng() * 512, y, r, r);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---- Blued gunmetal with wear: {map, roughnessMap} ----
export function gunmetalMaps(seed = 5) {
  const rng = mulberry32(seed * 331 + 7);
  const S = 256;
  const [c, ctx] = canvas(S);
  ctx.fillStyle = '#2b3138'; ctx.fillRect(0, 0, S, S);
  // brushing
  for (let i = 0; i < 500; i++) {
    const y = rng() * S;
    const v = 40 + rng() * 40;
    ctx.fillStyle = `rgba(${v + 20},${v + 26},${v + 34},${0.05 + rng() * 0.09})`;
    ctx.fillRect(rng() * S, y, 30 + rng() * 120, 1);
  }
  // wear nicks (bright) and grime (dark)
  for (let i = 0; i < 90; i++) {
    const v = 130 + rng() * 90;
    ctx.fillStyle = `rgba(${v},${v},${v},${0.15 + rng() * 0.25})`;
    ctx.fillRect(rng() * S, rng() * S, 1 + rng() * 3, 1);
  }
  stains(ctx, S, 5, 70, 'rgba(0,0,0,A)', 0.25, rng);
  const [rc, rctx] = canvas(S);
  rctx.fillStyle = '#7a7a7a'; rctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 300; i++) {
    const y = rng() * S;
    rctx.fillStyle = `rgba(170,170,170,${0.06 + rng() * 0.12})`;
    rctx.fillRect(rng() * S, y, 40 + rng() * 90, 1);
  }
  stains(rctx, S, 4, 60, 'rgba(50,50,50,A)', 0.4, rng);
  return { map: toTex(c, 1), roughnessMap: toTex(rc, 1, false) };
}

// ---- Stencil marking decal (transparent bg) ----
export function stencilTexture(text, color = '#cfcaba', sub = '') {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 64);
  ctx.fillStyle = color;
  ctx.font = '700 34px "Arial Narrow", Impact, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = 0.9;
  ctx.fillText(text, 8, 26);
  if (sub) {
    ctx.font = '700 16px "Arial Narrow", sans-serif';
    ctx.globalAlpha = 0.65;
    ctx.fillText(sub, 9, 51);
  }
  // chevrons
  ctx.globalAlpha = 0.8;
  for (let i = 0; i < 3; i++) {
    const x = 218 + i * 12;
    ctx.beginPath();
    ctx.moveTo(x, 18); ctx.lineTo(x + 8, 32); ctx.lineTo(x, 46); ctx.lineTo(x + 4, 46); ctx.lineTo(x + 12, 32); ctx.lineTo(x + 4, 18);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---- Scorch decal ----
export function scorchTexture() {
  const S = 128;
  const [c, ctx] = canvas(S);
  const rng = mulberry32(11);
  const g = ctx.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(8,8,9,0.85)');
  g.addColorStop(0.55, 'rgba(10,10,11,0.5)');
  g.addColorStop(1, 'rgba(10,10,11,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 40; i++) {
    const a = rng() * Math.PI * 2, r0 = S * 0.18, r1 = S * (0.3 + rng() * 0.24);
    ctx.strokeStyle = `rgba(6,6,7,${0.2 + rng() * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(S / 2 + Math.cos(a) * r0, S / 2 + Math.sin(a) * r0);
    ctx.lineTo(S / 2 + Math.cos(a) * r1, S / 2 + Math.sin(a) * r1);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

// ---- Star-shaped muzzle flash ----
export function flashTexture() {
  const S = 128;
  const [c, ctx] = canvas(S);
  const cx = S / 2;
  const spikes = [[1, 0.16], [0.45, 0.1], [0.7, 0.05]];
  // core
  let g = ctx.createRadialGradient(cx, cx, 0, cx, cx, S * 0.16);
  g.addColorStop(0, 'rgba(255,252,238,1)');
  g.addColorStop(1, 'rgba(255,190,80,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  // spikes
  for (let k = 0; k < 4; k++) {
    ctx.save();
    ctx.translate(cx, cx);
    ctx.rotate((k * Math.PI) / 2 + 0.3);
    const len = S * 0.48;
    const gr = ctx.createLinearGradient(0, 0, len, 0);
    gr.addColorStop(0, 'rgba(255,240,190,0.95)');
    gr.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(0, -S * 0.045);
    ctx.lineTo(len, 0);
    ctx.lineTo(0, S * 0.045);
    ctx.fill();
    ctx.restore();
  }
  return new THREE.CanvasTexture(c);
}

// ---- Fake volumetric light cone gradient ----
export function lightConeTexture() {
  const [c, ctx] = canvas(256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, 'rgba(255,255,255,0.34)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  return t;
}
