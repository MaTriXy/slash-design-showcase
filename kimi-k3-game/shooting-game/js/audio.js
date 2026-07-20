// ============ Audio: fully synthesized SFX + procedural music (WebAudio) ============

export class AudioSys {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.volume = 0.8;
    this.muted = false;
    this._noise = null;
    this._musicTimer = null;
    this._musicStep = 0;
    this._nextNote = 0;
  }

  init() {
    if (this.ctx) { this.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.14;
    this.musicGain.connect(this.master);

    // Shared white-noise buffer
    const len = this.ctx.sampleRate;
    this._noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this._noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  setVolume(v) {
    this.volume = v;
    if (this.master && !this.muted) this.master.gain.value = v;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
    return this.muted;
  }

  // ---- primitives ----
  _env(gain, t0, peak, decay) {
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
  }

  _noiseHit({ t0, dur, peak, filterType = 'lowpass', freq = 2000, freqEnd = null, q = 0.8, rate = 1 }) {
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise;
    src.playbackRate.value = rate;
    const f = this.ctx.createBiquadFilter();
    f.type = filterType; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), t0 + dur);
    const g = this.ctx.createGain();
    this._env(g, t0, peak, dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }

  _tone({ t0, dur, peak, type = 'sine', freq = 440, freqEnd = null, dest = null }) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + dur);
    const g = this.ctx.createGain();
    this._env(g, t0, peak, dur);
    o.connect(g).connect(dest || this.master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  _ready() { return !!this.ctx && !this.muted; }

  // ---- SFX ----
  shoot(kind) {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;
    const v = 1 + (Math.random() - 0.5) * 0.14;
    switch (kind) {
      case 'pistol':
        this._noiseHit({ t0: t, dur: 0.1, peak: 0.5, freq: 3200, freqEnd: 500, rate: v });
        this._tone({ t0: t, dur: 0.07, peak: 0.4, type: 'triangle', freq: 160, freqEnd: 70 });
        break;
      case 'rifle':
        this._noiseHit({ t0: t, dur: 0.075, peak: 0.42, freq: 3600, freqEnd: 550, rate: v });
        this._tone({ t0: t, dur: 0.055, peak: 0.34, type: 'triangle', freq: 145, freqEnd: 65 });
        break;
      case 'shotgun':
        this._noiseHit({ t0: t, dur: 0.24, peak: 0.7, freq: 1700, freqEnd: 160, rate: v });
        this._tone({ t0: t, dur: 0.22, peak: 0.55, type: 'sine', freq: 95, freqEnd: 42 });
        // pump rack
        this._noiseHit({ t0: t + 0.16, dur: 0.045, peak: 0.3, filterType: 'bandpass', freq: 1500, q: 3 });
        this._noiseHit({ t0: t + 0.27, dur: 0.05, peak: 0.34, filterType: 'bandpass', freq: 2200, q: 3 });
        break;
      case 'sniper':
        this._noiseHit({ t0: t, dur: 0.05, peak: 0.6, filterType: 'highpass', freq: 1800, rate: v });
        this._noiseHit({ t0: t, dur: 0.4, peak: 0.55, freq: 1200, freqEnd: 90, rate: 1 });
        this._tone({ t0: t, dur: 0.3, peak: 0.5, type: 'sine', freq: 110, freqEnd: 38 });
        // bolt cycle
        this._noiseHit({ t0: t + 0.2, dur: 0.04, peak: 0.26, filterType: 'bandpass', freq: 2000, q: 4 });
        this._noiseHit({ t0: t + 0.34, dur: 0.045, peak: 0.3, filterType: 'bandpass', freq: 1600, q: 4 });
        break;
    }
  }

  reload() {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;
    this._noiseHit({ t0: t, dur: 0.04, peak: 0.25, filterType: 'bandpass', freq: 2400, q: 3 });
    this._noiseHit({ t0: t + 0.22, dur: 0.05, peak: 0.3, filterType: 'bandpass', freq: 1700, q: 3 });
    this._noiseHit({ t0: t + 0.5, dur: 0.06, peak: 0.34, filterType: 'bandpass', freq: 3000, q: 3 });
  }

  dryFire() {
    if (!this._ready()) return;
    this._noiseHit({ t0: this.ctx.currentTime, dur: 0.035, peak: 0.2, filterType: 'bandpass', freq: 2600, q: 4 });
  }

  hit(kill = false) {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;
    this._tone({ t0: t, dur: 0.035, peak: 0.22, type: 'square', freq: 2300 });
    if (kill) this._tone({ t0: t + 0.02, dur: 0.13, peak: 0.3, type: 'square', freq: 620, freqEnd: 240 });
  }

  headshot() {
    if (!this._ready()) return;
    this._tone({ t0: this.ctx.currentTime, dur: 0.09, peak: 0.3, type: 'square', freq: 3100, freqEnd: 1900 });
  }

  hurt() {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;
    this._tone({ t0: t, dur: 0.2, peak: 0.55, type: 'sine', freq: 85, freqEnd: 40 });
    this._noiseHit({ t0: t, dur: 0.16, peak: 0.3, freq: 500, freqEnd: 120 });
  }

  enemyDie() {
    if (!this._ready()) return;
    this._noiseHit({ t0: this.ctx.currentTime, dur: 0.32, peak: 0.3, freq: 900, freqEnd: 90, rate: 0.7 });
  }

  pickup(kind = 'health') {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;
    const [a, b] = kind === 'health' ? [520, 780] : [340, 510];
    this._tone({ t0: t, dur: 0.09, peak: 0.25, type: 'sine', freq: a });
    this._tone({ t0: t + 0.09, dur: 0.14, peak: 0.28, type: 'sine', freq: b });
  }

  jump() {
    if (!this._ready()) return;
    this._noiseHit({ t0: this.ctx.currentTime, dur: 0.08, peak: 0.1, freq: 600, freqEnd: 250 });
  }

  land() {
    if (!this._ready()) return;
    this._tone({ t0: this.ctx.currentTime, dur: 0.1, peak: 0.22, type: 'sine', freq: 75, freqEnd: 40 });
  }

  step() {
    if (!this._ready()) return;
    this._noiseHit({ t0: this.ctx.currentTime, dur: 0.045, peak: 0.07, freq: 480, freqEnd: 200, rate: 0.9 + Math.random() * 0.2 });
  }

  enemyShoot() {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;
    this._tone({ t0: t, dur: 0.14, peak: 0.2, type: 'sawtooth', freq: 700, freqEnd: 240 });
  }

  levelClear() {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;
    [440, 523.25, 659.25, 880].forEach((f, i) =>
      this._tone({ t0: t + i * 0.1, dur: 0.24, peak: 0.22, type: 'square', freq: f }));
  }

  gameOver() {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;
    [330, 262, 196, 131].forEach((f, i) =>
      this._tone({ t0: t + i * 0.16, dur: 0.34, peak: 0.24, type: 'triangle', freq: f }));
  }

  uiClick() {
    if (!this._ready()) return;
    this._tone({ t0: this.ctx.currentTime, dur: 0.05, peak: 0.2, type: 'square', freq: 900 });
  }

  // ---- Music: dark pulse loop in A minor, 92 BPM ----
  startMusic() {
    if (!this.ctx || this._musicTimer) return;
    this._musicStep = 0;
    this._nextNote = this.ctx.currentTime + 0.1;
    this._musicTimer = setInterval(() => this._schedule(), 180);
  }

  stopMusic() {
    if (this._musicTimer) { clearInterval(this._musicTimer); this._musicTimer = null; }
  }

  _schedule() {
    if (!this.ctx) return;
    const eighth = 60 / 92 / 2;
    while (this._nextNote < this.ctx.currentTime + 0.55) {
      this._playStep(this._musicStep, this._nextNote, eighth);
      this._nextNote += eighth;
      this._musicStep = (this._musicStep + 1) % 64;
    }
  }

  _playStep(step, t, eighth) {
    const g = this.musicGain;
    // Bass: driving 8ths, root movement Am / F / G
    const roots = [55, 55, 43.65, 49];                    // A1 A1 F1 G1
    const bar = Math.floor(step / 16) % 4;
    const root = roots[bar];
    if (step % 2 === 0) {
      this._tone({ t0: t, dur: eighth * 0.9, peak: 0.5, type: 'sawtooth', freq: root * 2, dest: g });
    }
    // Kick on beats
    if (step % 4 === 0) {
      this._tone({ t0: t, dur: 0.12, peak: 0.9, type: 'sine', freq: 120, freqEnd: 45, dest: g });
    }
    // Hats on offbeats
    if (step % 4 === 2) {
      const src = this.ctx.createBufferSource();
      src.buffer = this._noise;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 8000;
      const hg = this.ctx.createGain();
      this._env(hg, t, 0.12, 0.03);
      src.connect(f).connect(hg).connect(g);
      src.start(t); src.stop(t + 0.06);
    }
    // Pad chord at bar start: Am / F / G voicings
    if (step % 16 === 0) {
      const chords = [[220, 261.6, 329.6], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]];
      chords[bar].forEach((f0) => {
        this._tone({ t0: t, dur: eighth * 15, peak: 0.06, type: 'sawtooth', freq: f0, dest: g });
        this._tone({ t0: t, dur: eighth * 15, peak: 0.05, type: 'sawtooth', freq: f0 * 1.006, dest: g });
      });
    }
  }
}
