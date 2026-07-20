// ============ Game configuration: weapons, enemies, levels ============

export const PLAYER = {
  height: 1.7,
  radius: 0.45,
  walkSpeed: 6.2,
  sprintSpeed: 9.4,
  accel: 55,
  airAccel: 12,
  friction: 10,
  gravity: 24,
  jumpVel: 8.5,
  maxHp: 100,
  regenDelay: 0, // no regen — pickups only
};

export const WEAPONS = [
  {
    id: 'pistol', name: 'P9 SIDEARM', slot: 1,
    damage: 34, headMult: 2.2, pellets: 1,
    auto: false, rpm: 320,
    mag: 12, reserve: 72, reserveMax: 120, reloadTime: 0.95,
    spread: 0.006, bloomPerShot: 0.010, bloomMax: 0.030,
    recoil: { pitch: 0.028, yaw: 0.006, kick: 0.09 },
    range: 120, falloffStart: 40, falloffEnd: 90, falloffMin: 0.6,
    zoomFov: 68, adsSpreadMult: 0.5,
    tracer: 0xffe9a3, sfx: 'pistol',
  },
  {
    id: 'rifle', name: 'VK-7 CARBINE', slot: 2,
    damage: 22, headMult: 1.8, pellets: 1,
    auto: true, rpm: 560,
    mag: 30, reserve: 120, reserveMax: 240, reloadTime: 1.6,
    spread: 0.011, bloomPerShot: 0.006, bloomMax: 0.045,
    recoil: { pitch: 0.017, yaw: 0.008, kick: 0.055 },
    range: 140, falloffStart: 45, falloffEnd: 100, falloffMin: 0.65,
    zoomFov: 66, adsSpreadMult: 0.55,
    tracer: 0xfff3c4, sfx: 'rifle',
  },
  {
    id: 'shotgun', name: 'M8 BREACHER', slot: 3,
    damage: 13, headMult: 1.5, pellets: 9,
    auto: false, rpm: 78,
    mag: 6, reserve: 30, reserveMax: 60, reloadTime: 2.1,
    spread: 0.052, bloomPerShot: 0.02, bloomMax: 0.07,
    recoil: { pitch: 0.075, yaw: 0.014, kick: 0.22 },
    range: 60, falloffStart: 9, falloffEnd: 26, falloffMin: 0.25,
    zoomFov: 70, adsSpreadMult: 0.8,
    tracer: 0xffc46b, sfx: 'shotgun',
  },
  {
    id: 'sniper', name: 'LR-50 LONGSHOT', slot: 4,
    damage: 165, headMult: 2.0, pellets: 1,
    auto: false, rpm: 46,
    mag: 5, reserve: 20, reserveMax: 40, reloadTime: 2.4,
    spread: 0.05, bloomPerShot: 0, bloomMax: 0.05, // hipfire is wild; scoped is laser
    recoil: { pitch: 0.11, yaw: 0.02, kick: 0.34 },
    range: 300, falloffStart: 300, falloffEnd: 400, falloffMin: 1,
    zoomFov: 18, adsSpreadMult: 0.001, scoped: true,
    tracer: 0xd8f4ff, sfx: 'sniper',
  },
];

export const ENEMIES = {
  chaser: {
    name: 'chaser', hp: 62, speed: 4.6, radius: 0.5, height: 1.8,
    damage: 10, attackRange: 1.7, attackCooldown: 1.05,
    score: 100, color: 0xd8402c, eye: 0xffd23f, scale: 1,
  },
  runner: {
    name: 'runner', hp: 30, speed: 7.2, radius: 0.42, height: 1.5,
    damage: 7, attackRange: 1.5, attackCooldown: 0.7,
    score: 120, color: 0xff7a1a, eye: 0xfff1b8, scale: 0.82,
  },
  gunner: {
    name: 'gunner', hp: 48, speed: 3.4, radius: 0.5, height: 1.9,
    damage: 11, attackRange: 26, attackCooldown: 2.0, keepDistance: 13,
    projectileSpeed: 27,
    score: 150, color: 0x8e3fd8, eye: 0x35f0d0, scale: 1.05,
  },
  brute: {
    name: 'brute', hp: 260, speed: 2.4, radius: 0.85, height: 2.6,
    damage: 30, attackRange: 2.4, attackCooldown: 1.5,
    score: 350, color: 0x6e1410, eye: 0xff453a, scale: 1.55,
  },
};

export const LEVELS = [
  {
    name: 'SECTOR 1 — BREACH',
    theme: {
      fog: 0x0b181e, fogDensity: 0.019,
      skyTop: '#020a10', skyHorizon: '#0d2e36', stars: true,
      concrete: '#37474e', metal: '#33454d', rust: 0.35,
      hemi: [0x4d8b96, 0x141d20, 0.65], key: [0xc4ecf5, 1.25],
      accent: 0x35f0d0, lamp: 0xa8f0e2, dust: 0x86c8c0,
    },
    layout: 0,
    roster: { chaser: 7, runner: 2, gunner: 2, brute: 0 },
    batch: 4, spawnInterval: 3.2,
  },
  {
    name: 'SECTOR 2 — FURNACE',
    theme: {
      fog: 0x1e0f07, fogDensity: 0.02,
      skyTop: '#0d0402', skyHorizon: '#3c1a08', stars: false,
      concrete: '#453423', metal: '#453016', rust: 0.7,
      hemi: [0xa86a34, 0x1c1008, 0.7], key: [0xffcf96, 1.25],
      accent: 0xff8a2a, lamp: 0xffc27a, dust: 0xd89a5e,
    },
    layout: 1,
    roster: { chaser: 8, runner: 4, gunner: 4, brute: 0 },
    batch: 5, spawnInterval: 2.8,
  },
  {
    name: 'SECTOR 3 — TOXIN',
    theme: {
      fog: 0x101f0c, fogDensity: 0.022,
      skyTop: '#041002', skyHorizon: '#23420f', stars: false,
      concrete: '#39452c', metal: '#354222', rust: 0.5,
      hemi: [0x6da344, 0x141c0d, 0.7], key: [0xd8f7ae, 1.2],
      accent: 0x9dff2a, lamp: 0xd0f79a, dust: 0xa8d078,
    },
    layout: 2,
    roster: { chaser: 9, runner: 5, gunner: 5, brute: 1 },
    batch: 5, spawnInterval: 2.5,
  },
  {
    name: 'SECTOR 4 — VOID',
    theme: {
      fog: 0x150c22, fogDensity: 0.019,
      skyTop: '#050310', skyHorizon: '#2a1546', stars: true,
      concrete: '#342c48', metal: '#312842', rust: 0.3,
      hemi: [0x7c56b3, 0x161020, 0.7], key: [0xdfc6ff, 1.3],
      accent: 0xc44dff, lamp: 0xd6a8ff, dust: 0xb394e0,
    },
    layout: 3,
    roster: { chaser: 10, runner: 6, gunner: 6, brute: 3 },
    batch: 6, spawnInterval: 2.1,
  },
];

export const ARENA = {
  size: 62,          // square arena, wall to wall
  wallHeight: 7,
  pickupPads: 5,     // fixed pickup pads per arena
  healthAmount: 35,
  ammoFraction: 0.5, // refill 50% of reserve max for current weapon... (flat per weapon)
};

export const SCORING = {
  headshotBonus: 50,
  levelClearBase: 500,
  winBonus: 2500,
  dropChanceAmmo: 0.18,
  dropChanceHealth: 0.14,
};

export const STORAGE_KEY = 'overrun_highscore';
