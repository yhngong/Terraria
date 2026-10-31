export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  gravity: number;
  glow: boolean;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export class ParticleSystem {
  particles: Particle[] = [];
  texts: FloatingText[] = [];

  spawn(
    x: number,
    y: number,
    color: string,
    count = 6,
    speed = 90,
    size = 3,
    gravity = 260,
    glow = false
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.85) * speed;
      const life = 0.25 + Math.random() * 0.45;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 25,
        color,
        size: Math.max(1.5, size + (Math.random() - 0.5) * 1.5),
        life,
        maxLife: life,
        gravity,
        glow
      });
    }
    if (this.particles.length > 900) {
      this.particles.splice(0, this.particles.length - 900);
    }
  }

  addText(x: number, y: number, text: string, color = '#ffeb57', scale = 1): void {
    this.texts.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y - 8,
      vy: -38,
      text,
      color,
      life: 0.95,
      maxLife: 0.95,
      scale
    });
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y += t.vy * dt;
      t.vy *= 0.94;
      t.life -= dt;
      if (t.life <= 0) {
        this.texts.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const sx = Math.floor(p.x - camX - p.size * 0.5);
      const sy = Math.floor(p.y - camY - p.size * 0.5);
      ctx.fillRect(sx, sy, Math.ceil(p.size), Math.ceil(p.size));
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    for (const t of this.texts) {
      const alpha = Math.min(1, (t.life / t.maxLife) * 1.4);
      ctx.globalAlpha = alpha;
      const px = Math.round(11 * t.scale);
      ctx.font = `bold ${px}px monospace`;
      const sx = Math.floor(t.x - camX);
      const sy = Math.floor(t.y - camY);
      ctx.fillStyle = '#000';
      ctx.fillText(t.text, sx + 1, sy + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, sx, sy);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
}
