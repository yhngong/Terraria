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

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
  lineWidth: number;
}

export interface Afterimage {
  x: number;
  y: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  x: number;
  y: number;
  vx: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export class ParticleSystem {
  particles: Particle[] = [];
  shockwaves: Shockwave[] = [];
  afterimages: Afterimage[] = [];
  texts: FloatingText[] = [];

  shakeIntensity = 0;
  shakeTimer = 0;
  flashAlpha = 0;
  flashColor = '#ffffff';

  triggerShake(intensity = 10, duration = 0.35): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  triggerFlash(color = '#ffffff', alpha = 0.35): void {
    this.flashColor = color;
    this.flashAlpha = Math.max(this.flashAlpha, alpha);
  }

  spawnShockwave(
    x: number,
    y: number,
    color = '#3be8d1',
    maxRadius = 180,
    duration = 0.45,
    lineWidth = 5
  ): void {
    this.shockwaves.push({
      x,
      y,
      radius: 8,
      maxRadius,
      color,
      life: duration,
      maxLife: duration,
      lineWidth
    });
  }

  spawnAfterimage(x: number, y: number, radius: number, color: string, duration = 0.22): void {
    this.afterimages.push({
      x,
      y,
      radius,
      color,
      life: duration,
      maxLife: duration
    });
    if (this.afterimages.length > 180) {
      this.afterimages.splice(0, this.afterimages.length - 180);
    }
  }

  spawn(
    x: number,
    y: number,
    color: string,
    count = 6,
    speed = 90,
    size = 3,
    gravity = 220,
    glow = true
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.25 + Math.random() * 0.95) * speed;
      const life = 0.25 + Math.random() * 0.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 20,
        color,
        size: Math.max(1.8, size + (Math.random() - 0.5) * 2),
        life,
        maxLife: life,
        gravity,
        glow
      });
    }
    if (this.particles.length > 1400) {
      this.particles.splice(0, this.particles.length - 1400);
    }
  }

  addText(x: number, y: number, text: string, color = '#ffeb57', scale = 1): void {
    this.texts.push({
      x: x + (Math.random() - 0.5) * 18,
      y: y - 10,
      vx: (Math.random() - 0.5) * 45,
      vy: -65,
      text,
      color,
      life: 0.9,
      maxLife: 0.9,
      scale
    });
    if (this.texts.length > 120) {
      this.texts.splice(0, this.texts.length - 120);
    }
  }

  update(dt: number): void {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) this.shakeIntensity = 0;
      else this.shakeIntensity *= Math.pow(0.05, dt);
    }
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 1.4);
    }

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

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.life -= dt;
      const prog = 1 - Math.max(0, s.life / s.maxLife);
      s.radius = 8 + (s.maxRadius - 8) * (1 - Math.pow(1 - prog, 3));
      if (s.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      const a = this.afterimages[i];
      a.life -= dt;
      if (a.life <= 0) {
        this.afterimages.splice(i, 1);
      }
    }

    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.vx *= 0.92;
      t.vy *= 0.92;
      t.life -= dt;
      if (t.life <= 0) {
        this.texts.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    ctx.save();

    // 1. Afterimage Ghost Trails
    for (const a of this.afterimages) {
      const alpha = (a.life / a.maxLife) * 0.38;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.arc(a.x - camX, a.y - camY, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Additive Glow Particles & Shockwaves
    ctx.globalCompositeOperation = 'lighter';

    for (const s of this.shockwaves) {
      const alpha = Math.max(0, s.life / s.maxLife);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.lineWidth * alpha;
      ctx.beginPath();
      ctx.arc(s.x - camX, s.y - camY, s.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const sx = p.x - camX - p.size * 0.5;
      const sy = p.y - camY - p.size * 0.5;
      ctx.fillRect(sx, sy, p.size, p.size);
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    // 3. Crisp Floating Combat Numbers
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      const alpha = Math.min(1, (t.life / t.maxLife) * 1.5);
      ctx.globalAlpha = alpha;
      const px = Math.round(12 * t.scale);
      ctx.font = `bold ${px}px monospace`;
      const sx = Math.floor(t.x - camX);
      const sy = Math.floor(t.y - camY);
      ctx.fillStyle = '#000000';
      ctx.fillText(t.text, sx + 1.5, sy + 1.5);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, sx, sy);
    }

    ctx.restore();
  }
}
