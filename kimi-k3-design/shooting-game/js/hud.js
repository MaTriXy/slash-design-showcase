// ============ HUD: DOM overlay control ============

const $ = (id) => document.getElementById(id);

export class HUD {
  constructor() {
    this.el = {
      hud: $('hud'),
      crosshair: $('crosshair'),
      hitmarker: $('hitmarker'),
      scope: $('scope-overlay'),
      healthBar: $('health-bar'),
      healthGhost: $('health-ghost'),
      healthValue: $('health-value'),
      lowhp: $('lowhp-vignette'),
      ammoMag: $('ammo-mag'),
      ammoReserve: $('ammo-reserve'),
      weaponName: $('weapon-name'),
      reloadWrap: $('reload-bar-wrap'),
      reloadBar: $('reload-bar'),
      slots: Array.from(document.querySelectorAll('#weapon-slots .slot')),
      score: $('score-value'),
      hiscore: $('hiscore-hud'),
      levelName: $('level-name'),
      hostiles: $('hostiles-count'),
      banner: $('banner'),
      bannerTitle: $('banner-title'),
      bannerSub: $('banner-sub'),
    };
    this._lastHp = 1;
    this._screens = ['menu-screen', 'pause-screen', 'gameover-screen', 'win-screen'].map($);
  }

  show() { this.el.hud.classList.remove('hidden'); }
  hide() { this.el.hud.classList.add('hidden'); }

  showScreen(id) {
    this._screens.forEach((s) => s.classList.toggle('hidden', s.id !== id));
    if (id) this.hide(); else this.show();
  }

  setHealth(hp, max) {
    const f = Math.max(0, hp / max);
    this.el.healthBar.style.transform = `scaleX(${f})`;
    // ghost bar trails behind to show recent damage
    if (f < this._lastHp) {
      this.el.healthGhost.style.transition = 'none';
      this.el.healthGhost.style.transform = `scaleX(${this._lastHp})`;
      requestAnimationFrame(() => {
        this.el.healthGhost.style.transition = '';
        this.el.healthGhost.style.transform = `scaleX(${f})`;
      });
    } else {
      this.el.healthGhost.style.transform = `scaleX(${f})`;
    }
    this._lastHp = f;
    this.el.healthValue.textContent = Math.ceil(hp);
    const low = f <= 0.32;
    this.el.healthValue.classList.toggle('low', low);
    this.el.healthBar.classList.toggle('low', low);
    this.el.lowhp.classList.toggle('active', low && hp > 0);
  }

  setAmmo(mag, reserve, name) {
    this.el.ammoMag.textContent = mag;
    this.el.ammoReserve.textContent = `/ ${reserve}`;
    this.el.weaponName.textContent = name;
    this.el.ammoMag.classList.toggle('empty', mag === 0);
  }

  setSlots(ammoArr, active) {
    this.el.slots.forEach((s, i) => {
      s.classList.toggle('active', i === active);
      s.classList.toggle('owned-empty', ammoArr[i] === 0);
    });
  }

  setReloadProgress(p) {
    if (p < 0) { this.el.reloadWrap.classList.add('hidden'); return; }
    this.el.reloadWrap.classList.remove('hidden');
    this.el.reloadBar.style.width = `${Math.round(p * 100)}%`;
  }

  setScore(n) { this.el.score.textContent = n.toLocaleString(); }
  setHiscore(n) { this.el.hiscore.textContent = n.toLocaleString(); }

  setLevel(name) { this.el.levelName.textContent = name; }
  setHostiles(n) { this.el.hostiles.textContent = n; }

  setCrosshairSpread(spread, ads) {
    const px = 7 + spread * 420;
    this.el.crosshair.style.setProperty('--gap', `${px.toFixed(1)}px`);
    this.el.crosshair.style.opacity = ads ? '0.85' : '1';
  }

  setCrosshairVisible(v) { this.el.crosshair.style.display = v ? '' : 'none'; }

  setScope(on) {
    this.el.scope.classList.toggle('hidden', !on);
    this.setCrosshairVisible(!on);
  }

  hitmarker(kill, head) {
    const h = this.el.hitmarker;
    h.classList.remove('show', 'kill');
    void h.offsetWidth; // restart animation
    if (kill || head) h.classList.add('kill');
    h.classList.add('show');
  }

  banner(title, sub) {
    const b = this.el.banner;
    this.el.bannerTitle.textContent = title;
    this.el.bannerSub.textContent = sub;
    b.classList.remove('hidden');
    b.style.animation = 'none';
    void b.offsetWidth;
    b.style.animation = '';
    clearTimeout(this._bannerT);
    this._bannerT = setTimeout(() => b.classList.add('hidden'), 2450);
  }
}
