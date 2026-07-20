// ============ Input: pointer lock, keyboard, mouse ============

export class Input {
  constructor(domElement) {
    this.dom = domElement;
    this.keys = new Set();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.lmb = false;
    this.rmb = false;
    this.locked = false;
    this.sensitivity = 1;
    this.wheelDelta = 0;

    // Discrete action callbacks, wired by main.js
    this.onAction = () => {};       // (action: 'reload'|'weapon1..4'|'pause'|'mute')
    this.onAnyGesture = () => {};   // first click/keypress (audio unlock)

    document.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.onAnyGesture();
      const map = {
        KeyR: 'reload',
        Digit1: 'weapon1', Digit2: 'weapon2', Digit3: 'weapon3', Digit4: 'weapon4',
        KeyP: 'pause', KeyM: 'mute',
      };
      if (map[e.code]) this.onAction(map[e.code]);
    });
    document.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    });
    document.addEventListener('mousedown', (e) => {
      this.onAnyGesture();
      if (!this.locked) return;
      if (e.button === 0) this.lmb = true;
      if (e.button === 2) this.rmb = true;
    });
    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.lmb = false;
      if (e.button === 2) this.rmb = false;
    });
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('wheel', (e) => { this.wheelDelta += Math.sign(e.deltaY); }, { passive: true });

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.dom;
      this.lmb = this.rmb = false;
      if (this.onLockChange) this.onLockChange(this.locked);
    });
    document.addEventListener('pointerlockerror', () => {
      this.locked = false;
    });
  }

  requestLock() {
    if (this.locked) return;
    try {
      const p = this.dom.requestPointerLock({ unadjustedMovement: true });
      if (p && p.catch) p.catch(() => { try { this.dom.requestPointerLock(); } catch (_) {} });
    } catch (_) {
      try { this.dom.requestPointerLock(); } catch (_) {}
    }
  }

  releaseLock() {
    if (this.locked) document.exitPointerLock();
  }

  // Consume accumulated mouse deltas (call once per frame)
  consumeMouse() {
    const dx = this.mouseDX * 0.0021 * this.sensitivity;
    const dy = this.mouseDY * 0.0021 * this.sensitivity;
    this.mouseDX = 0; this.mouseDY = 0;
    return { dx, dy };
  }

  consumeWheel() {
    const d = this.wheelDelta;
    this.wheelDelta = 0;
    return d;
  }

  down(code) { return this.keys.has(code); }
}
