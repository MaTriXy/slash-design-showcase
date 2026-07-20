import * as THREE from 'three';
import { LEVELS, SCORING, STORAGE_KEY, ARENA } from './config.js';
import { Input } from './input.js';
import { AudioSys } from './audio.js';
import { HUD } from './hud.js';
import { Effects } from './effects.js';
import { World } from './world.js';
import { Player } from './player.js';
import { WeaponSystem } from './weapons.js';
import { EnemyManager } from './enemies.js';

class Game {
  constructor() {
    // --- renderer ---
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.26;
    document.getElementById('game-container').appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.08, 300);
    this.scene.add(this.camera);

    // --- modules ---
    this.input = new Input(this.renderer.domElement);
    this.audio = new AudioSys();
    this.hud = new HUD();
    this.effects = new Effects(this.scene, this.camera);
    this.world = new World(this.scene, this.renderer);
    this.player = new Player(this.camera);
    this.weapons = new WeaponSystem(this.camera, this.effects, this.audio, this.hud);
    this.enemies = new EnemyManager(this.scene, this.world, this.effects, this.audio);

    // --- state ---
    this.state = 'menu';           // menu | playing | paused | gameover | win
    this.score = 0;
    this.hiscore = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    this.levelIdx = 0;
    this.stats = { shots: 0, hits: 0, kills: 0, headshots: 0 };
    this.startTime = 0;
    this.levelEnding = 0;
    this.deathTimer = 0;
    this.menuOrbit = 0;

    this.weapons.hooks.onKill = (enemy, head, point) => this._onKill(enemy, head, point);

    this._wireUI();
    this._wireInput();

    // menu backdrop: build sector 1 and orbit it
    this.world.buildLevel(LEVELS[0]);
    this.hud.setHiscore(this.hiscore);
    document.getElementById('menu-hiscore').textContent = this.hiscore.toLocaleString();

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this._frame());
  }

  // ============ UI wiring ============
  _wireUI() {
    const $ = (id) => document.getElementById(id);
    $('btn-start').addEventListener('click', () => { this.audio.uiClick(); this.startRun(); });
    $('btn-resume').addEventListener('click', () => { this.audio.uiClick(); this.resume(); });
    $('btn-restart-pause').addEventListener('click', () => { this.audio.uiClick(); this.startRun(); });
    $('btn-quit-pause').addEventListener('click', () => { this.audio.uiClick(); this.toMenu(); });
    $('btn-retry').addEventListener('click', () => { this.audio.uiClick(); this.startRun(); });
    $('btn-quit-go').addEventListener('click', () => { this.audio.uiClick(); this.toMenu(); });
    $('btn-again').addEventListener('click', () => { this.audio.uiClick(); this.startRun(); });
    $('btn-quit-win').addEventListener('click', () => { this.audio.uiClick(); this.toMenu(); });
    $('opt-sens').addEventListener('input', (e) => { this.input.sensitivity = parseFloat(e.target.value); });
    $('opt-volume').addEventListener('input', (e) => this.audio.setVolume(parseFloat(e.target.value)));
  }

  _wireInput() {
    this.input.onAnyGesture = () => { this.audio.init(); this.audio.resume(); };
    this.input.onLockChange = (locked) => {
      if (!locked && this.state === 'playing') this.pause();
    };
    this.input.onAction = (a) => {
      if (a === 'mute') { this.audio.init(); this.audio.toggleMute(); return; }
      if (a === 'pause') {
        if (this.state === 'playing') this.pause();
        else if (this.state === 'paused') this.resume();
        return;
      }
      if (this.state !== 'playing') return;
      if (a === 'reload') this.weapons.tryReload();
      else if (a.startsWith('weapon')) this.weapons.switchTo(parseInt(a.slice(6), 10) - 1);
    };
    // re-lock when clicking the canvas mid-game (e.g. after alt-tab)
    this.renderer.domElement.addEventListener('click', () => {
      if (this.state === 'playing' && !this.input.locked) this.input.requestLock();
    });
  }

  // ============ state transitions ============
  startRun() {
    this.audio.init();
    this.audio.resume();
    this.audio.startMusic();
    this.score = 0;
    this.stats = { shots: 0, hits: 0, kills: 0, headshots: 0 };
    this.startTime = performance.now();
    this.player.reset();
    this.weapons.reset();
    this.hud.setScore(0);
    this.hud.setHealth(this.player.hp, this.player.maxHp);
    this._loadLevel(0);
    this.hud.showScreen(null);
    this.state = 'playing';
    this.input.requestLock();
  }

  _loadLevel(idx) {
    this.levelIdx = idx;
    const def = LEVELS[idx];
    this.world.buildLevel(def);
    this.enemies.loadLevel(def);
    this.player.pos.set(10, 0, 18);
    this.player.vel.set(0, 0, 0);
    this.player.yaw = 0.507;
    this.levelEnding = 0;
    this.hud.setLevel(def.name);
    this.hud.banner(def.name, idx === 0 ? 'CLEAR ALL HOSTILES' : 'SECTOR BREACHED — CLEAR IT');
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.input.releaseLock();
    this.hud.showScreen('pause-screen');
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.hud.showScreen(null);
    this.input.requestLock();
  }

  toMenu() {
    this.state = 'menu';
    this.input.releaseLock();
    this.enemies.clear();
    this.world.buildLevel(LEVELS[0]);
    this.hud.showScreen('menu-screen');
    document.getElementById('menu-hiscore').textContent = this.hiscore.toLocaleString();
  }

  _finishRun(win) {
    const newBest = this.score > this.hiscore;
    if (newBest) {
      this.hiscore = this.score;
      localStorage.setItem(STORAGE_KEY, String(this.hiscore));
      this.hud.setHiscore(this.hiscore);
    }
    const acc = this.stats.shots > 0 ? Math.round((this.stats.hits / this.stats.shots) * 100) : 0;
    const prefix = win ? 'win' : 'go';
    document.getElementById(`${prefix}-score`).textContent = this.score.toLocaleString();
    document.getElementById(`${prefix}-kills`).textContent = this.stats.kills;
    document.getElementById(`${prefix}-accuracy`).textContent = `${acc}%`;
    document.getElementById(`${prefix}-newbest`).classList.toggle('hidden', !newBest);
    if (win) {
      const secs = Math.floor((performance.now() - this.startTime) / 1000);
      document.getElementById('win-time').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    } else {
      document.getElementById('go-level').textContent = String(this.levelIdx + 1);
    }
    this.input.releaseLock();
    this.hud.showScreen(win ? 'win-screen' : 'gameover-screen');
    this.state = win ? 'win' : 'gameover';
  }

  // ============ combat callbacks ============
  _onKill(enemy, head, point) {
    const pts = enemy.def.score + (head ? SCORING.headshotBonus : 0);
    this.score += pts;
    this.hud.setScore(this.score);
    this.effects.popup(point, `+${pts}${head ? ' HEADSHOT' : ''}`, head ? 'headshot' : '');
  }

  _onPlayerDamage = (dmg, fromPos) => {
    if (this.state !== 'playing' || !this.player.alive) return;
    const died = this.player.takeDamage(dmg, this.audio, this.effects);
    this.hud.setHealth(this.player.hp, this.player.maxHp);
    if (died) {
      this.audio.gameOver();
      this.deathTimer = 1.1;
    }
  };

  _onPickup = (type, pos) => {
    if (type === 'health') {
      if (!this.player.heal(ARENA.healthAmount)) return false;
      this.audio.pickup('health');
      this.effects.healFlash();
      this.effects.healBurst(pos);
      this.effects.popup(pos, `+${ARENA.healthAmount} HP`, 'pickup-pop');
      this.hud.setHealth(this.player.hp, this.player.maxHp);
      return true;
    }
    if (!this.weapons.addAmmo(0.5)) return false;
    this.audio.pickup('ammo');
    this.effects.popup(pos, 'AMMO RESTOCKED', 'pickup-pop');
    return true;
  };

  // ============ frame ============
  _frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);

    if (this.state === 'menu') {
      // slow orbit backdrop
      this.menuOrbit += dt * 0.07;
      const r = 27;
      this.camera.position.set(Math.cos(this.menuOrbit) * r, 13, Math.sin(this.menuOrbit) * r);
      this.camera.lookAt(0, 1.5, 0);
      if (this.camera.fov !== 60) { this.camera.fov = 60; this.camera.updateProjectionMatrix(); }
      this.world.update(dt, this.camera.position, () => false);
      this.effects.update(dt);
    } else if (this.state === 'playing' || this.state === 'paused') {
      const active = this.state === 'playing' && this.input.locked;

      let lookDelta = { dx: 0, dy: 0 };
      if (this.state === 'playing') {
        lookDelta = this.input.consumeMouse();
        if (active) this.player.look(lookDelta.dx, lookDelta.dy);

        const wheel = this.input.consumeWheel();
        if (active && wheel !== 0) this.weapons.cycle(wheel > 0 ? 1 : -1);

        this.player.update(dt, active ? this.input : { down: () => false }, this.world, this.audio, this.effects);
        this.enemies.update(dt, this.player, this._onPlayerDamage);
        this.world.update(dt, this.player.pos, this._onPickup);

        // death → game over screen after beat
        if (!this.player.alive && this.deathTimer > 0) {
          this.deathTimer -= dt;
          if (this.deathTimer <= 0) this._finishRun(false);
        }

        // level clear
        if (this.player.alive && this.enemies.remaining === 0) {
          if (this.levelEnding === 0) {
            this.levelEnding = 2.4;
            const bonus = SCORING.levelClearBase * (this.levelIdx + 1);
            this.score += bonus;
            this.hud.setScore(this.score);
            this.audio.levelClear();
            this.hud.banner('SECTOR CLEAR', `+${bonus} BONUS`);
          } else {
            this.levelEnding -= dt;
            if (this.levelEnding <= 0) {
              if (this.levelIdx + 1 >= LEVELS.length) {
                this.score += SCORING.winBonus;
                this.hud.setScore(this.score);
                this._finishRun(true);
              } else {
                this._loadLevel(this.levelIdx + 1);
              }
            }
          }
        }

        this.hud.setHostiles(this.enemies.remaining);
      }

      this.weapons.update(dt, {
        input: this.input,
        player: this.player,
        world: this.world,
        enemies: this.enemies,
        stats: this.stats,
        active,
        lookDelta,
      });
      this.effects.update(dt);
    } else {
      // gameover / win: keep rendering world gently
      this.effects.update(dt);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

const game = new Game();
window.__game = game; // debug/testing hook
