import { TILE_SIZE } from './math';

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

  constructor(private canvas: HTMLCanvasElement) {
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
    this.wheelDelta = 0;
  }
}
