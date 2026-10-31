import { TILE_SIZE } from './math';

export interface MobileControlLayout {
  joyX: number;
  joyY: number;
  joyRadius: number;
  atkX: number;
  atkY: number;
  atkRadius: number;
  invX: number;
  invY: number;
  invRadius: number;
  dashX: number;
  dashY: number;
  dashRadius: number;
}

export class InputManager {
  keys: Set<string> = new Set();
  justPressedKeys: Set<string> = new Set();

  mouseX = 0;
  mouseY = 0;
  worldMouseX = 0;
  worldMouseY = 0;
  tileMouseX = 0;
  tileMouseY = 0;

  mouseLeft = false;
  mouseRight = false;
  mouseLeftJustPressed = false;
  mouseRightJustPressed = false;
  wheelDelta = 0;

  smartCursor = false;

  // Mobile Touch Controls State (only shown on mobile/touch devices)
  isMobile = false;
  controlsEnabled = false; // True only during gameplay (not main menu)

  joyActive = false;
  joyX = 0; // Normalized -1..1
  joyY = 0; // Normalized -1..1
  private joyTouchId: number | null = null;

  mobileAttackHeld = false;
  mobileAttackJustPressed = false;
  attackAimActive = false;
  attackAimAngle = 0;
  private attackTouchId: number | null = null;
  private uiTouchId: number | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    // Detect mobile device strictly so desktop never shows mobile buttons
    const uaMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const coarseTouch =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(pointer: coarse)').matches &&
      navigator.maxTouchPoints > 0;
    this.isMobile = uaMobile || coarseTouch;

    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (!this.keys.has(code)) {
        this.justPressedKeys.add(code);
      }
      this.keys.add(code);
      if (code === 'ControlLeft' || code === 'ControlRight') {
        this.smartCursor = !this.smartCursor;
      }
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouseLeft = false;
      this.mouseRight = false;
      this.resetTouches();
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        if (!this.mouseLeft) this.mouseLeftJustPressed = true;
        this.mouseLeft = true;
      } else if (e.button === 2) {
        if (!this.mouseRight) this.mouseRightJustPressed = true;
        this.mouseRight = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseLeft = false;
      if (e.button === 2) this.mouseRight = false;
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.wheelDelta += Math.sign(e.deltaY);
      },
      { passive: false }
    );

    // Touch Listeners for Mobile Devices
    canvas.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        this.isMobile = true;
        const rect = canvas.getBoundingClientRect();
        const layout = this.getMobileLayout();

        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          const tx = t.clientX - rect.left;
          const ty = t.clientY - rect.top;

          if (this.controlsEnabled) {
            // 1. Check Virtual Joystick (bottom-left)
            const distJoy = Math.hypot(tx - layout.joyX, ty - layout.joyY);
            if (this.joyTouchId === null && distJoy <= layout.joyRadius * 1.45) {
              this.joyTouchId = t.identifier;
              this.joyActive = true;
              this.updateJoystickFromPoint(tx, ty, layout);
              continue;
            }

            // 2. Check Attack Button (bottom-right)
            const distAtk = Math.hypot(tx - layout.atkX, ty - layout.atkY);
            if (this.attackTouchId === null && distAtk <= layout.atkRadius * 1.35) {
              this.attackTouchId = t.identifier;
              if (!this.mobileAttackHeld) this.mobileAttackJustPressed = true;
              this.mobileAttackHeld = true;
              this.attackAimActive = false;
              continue;
            }

            // 3. Check Inventory Button
            const distInv = Math.hypot(tx - layout.invX, ty - layout.invY);
            if (distInv <= layout.invRadius * 1.25) {
              this.justPressedKeys.add('KeyI');
              continue;
            }

            // 4. Check Dash Button
            const distDash = Math.hypot(tx - layout.dashX, ty - layout.dashY);
            if (distDash <= layout.dashRadius * 1.25) {
              this.justPressedKeys.add('ShiftLeft');
              continue;
            }
          }

          // Otherwise treat as UI / World tap
          this.uiTouchId = t.identifier;
          this.mouseX = tx;
          this.mouseY = ty;
          if (!this.mouseLeft) this.mouseLeftJustPressed = true;
          this.mouseLeft = true;
        }
      },
      { passive: false }
    );

    canvas.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const layout = this.getMobileLayout();

        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          const tx = t.clientX - rect.left;
          const ty = t.clientY - rect.top;

          if (t.identifier === this.joyTouchId) {
            this.updateJoystickFromPoint(tx, ty, layout);
          } else if (t.identifier === this.attackTouchId) {
            const dx = tx - layout.atkX;
            const dy = ty - layout.atkY;
            if (Math.hypot(dx, dy) > 14) {
              this.attackAimActive = true;
              this.attackAimAngle = Math.atan2(dy, dx);
            }
          } else if (t.identifier === this.uiTouchId) {
            this.mouseX = tx;
            this.mouseY = ty;
          }
        }
      },
      { passive: false }
    );

    const endTouch = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === this.joyTouchId) {
          this.joyTouchId = null;
          this.joyActive = false;
          this.joyX = 0;
          this.joyY = 0;
        } else if (t.identifier === this.attackTouchId) {
          this.attackTouchId = null;
          this.mobileAttackHeld = false;
          this.attackAimActive = false;
        } else if (t.identifier === this.uiTouchId) {
          this.uiTouchId = null;
          this.mouseLeft = false;
        }
      }
    };

    canvas.addEventListener('touchend', endTouch, { passive: false });
    canvas.addEventListener('touchcancel', endTouch, { passive: false });
  }

  getMobileLayout(): MobileControlLayout {
    const w = this.canvas.width;
    const h = this.canvas.height;
    return {
      joyX: 105,
      joyY: h - 105,
      joyRadius: 62,
      atkX: w - 100,
      atkY: h - 100,
      atkRadius: 50,
      invX: w - 195,
      invY: h - 75,
      invRadius: 32,
      dashX: w - 85,
      dashY: h - 195,
      dashRadius: 30
    };
  }

  private updateJoystickFromPoint(tx: number, ty: number, layout: MobileControlLayout): void {
    const dx = tx - layout.joyX;
    const dy = ty - layout.joyY;
    const dist = Math.hypot(dx, dy);
    const maxR = layout.joyRadius;
    if (dist < 6) {
      this.joyX = 0;
      this.joyY = 0;
    } else {
      const clamped = Math.min(dist, maxR) / maxR;
      this.joyX = (dx / dist) * clamped;
      this.joyY = (dy / dist) * clamped;
    }
  }

  private resetTouches(): void {
    this.joyTouchId = null;
    this.joyActive = false;
    this.joyX = 0;
    this.joyY = 0;
    this.attackTouchId = null;
    this.mobileAttackHeld = false;
    this.attackAimActive = false;
    this.uiTouchId = null;
  }

  updateWorldMouse(camX: number, camY: number, zoom: number): void {
    this.worldMouseX = camX + this.mouseX / zoom;
    this.worldMouseY = camY + this.mouseY / zoom;
    this.tileMouseX = Math.floor(this.worldMouseX / TILE_SIZE);
    this.tileMouseY = Math.floor(this.worldMouseY / TILE_SIZE);
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  wasPressed(code: string): boolean {
    return this.justPressedKeys.has(code);
  }

  endFrame(): void {
    this.justPressedKeys.clear();
    this.mouseLeftJustPressed = false;
    this.mouseRightJustPressed = false;
    this.mobileAttackJustPressed = false;
    this.wheelDelta = 0;
  }
}
