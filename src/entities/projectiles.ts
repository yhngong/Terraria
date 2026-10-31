import { TILE_SIZE, dist } from '../core/math';
import { World } from '../world/world';
import { ParticleSystem } from '../core/particles';

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: string;
  damage: number;
  knockback: number;
  friendly: boolean; // true = hurts enemies/bosses, false = hurts player
  pierce: number;
  bounces: number;
  tileCollide: boolean;
  gravity: number;
  homing: boolean;
  life: number;
  maxLife: number;
  color: string;
  accentColor: string;
  hitIds: Set<number>;
}

export class ProjectileManager {
  projectiles: Projectile[] = [];

  spawn(opts: Partial<Projectile> & { x: number; y: number; vx: number; vy: number; type: string; damage: number; friendly: boolean }): Projectile {
    const p: Projectile = {
      x: opts.x,
      y: opts.y,
      vx: opts.vx,
      vy: opts.vy,
      radius: opts.radius ?? 5,
      type: opts.type,
      damage: opts.damage,
      knockback: opts.knockback ?? 3,
      friendly: opts.friendly,
      pierce: opts.pierce ?? 1,
      bounces: opts.bounces ?? 0,
      tileCollide: opts.tileCollide ?? true,
      gravity: opts.gravity ?? 0,
      homing: opts.homing ?? false,
      life: opts.life ?? 3.0,
      maxLife: opts.life ?? 3.0,
      color: opts.color ?? '#ffdd44',
      accentColor: opts.accentColor ?? '#ffffff',
      hitIds: new Set()
    };

    // Configure defaults per projectile type
    switch (p.type) {
      case 'arrow':
        p.gravity = 190;
        p.color = '#c99b68';
        p.accentColor = '#e6edf5';
        break;
      case 'fire_arrow':
        p.gravity = 180;
        p.color = '#ff661c';
        p.accentColor = '#ffee55';
        break;
      case 'holy_arrow':
        p.gravity = 160;
        p.color = '#5ce1ff';
        p.accentColor = '#ff70d9';
        break;
      case 'bullet':
        p.radius = 3.5;
        p.color = '#ffeb75';
        break;
      case 'homing_bullet':
        p.radius = 4;
        p.homing = true;
        p.color = '#59e62e';
        p.accentColor = '#d2ffb8';
        break;
      case 'spark_bolt':
        p.gravity = 120;
        p.color = '#ff7722';
        p.accentColor = '#ffee55';
        break;
      case 'water_bolt':
        p.bounces = 5;
        p.pierce = 4;
        p.radius = 6;
        p.color = '#2b7fff';
        p.accentColor = '#8cd4ff';
        p.life = 5.0;
        break;
      case 'demon_scythe':
        p.pierce = 5;
        p.radius = 11;
        p.color = '#8538ff';
        p.accentColor = '#d1a8ff';
        break;
      case 'crystal_shard':
        p.bounces = 3;
        p.radius = 4.5;
        p.color = '#ff66d9';
        p.accentColor = '#66e3ff';
        break;
      case 'ichor_stream':
        p.gravity = 140;
        p.pierce = 4;
        p.radius = 5.5;
        p.color = '#ffcf24';
        p.accentColor = '#fff599';
        break;
      case 'typhoon':
        p.homing = true;
        p.bounces = 6;
        p.pierce = 8;
        p.radius = 13;
        p.life = 4.5;
        p.color = '#1cb3ff';
        p.accentColor = '#9cebff';
        break;
      case 'nebula_bolt':
        p.homing = true;
        p.pierce = 2;
        p.radius = 8;
        p.color = '#e838ff';
        p.accentColor = '#75e6ff';
        break;
      case 'prism_beam':
        p.pierce = 12;
        p.tileCollide = false;
        p.radius = 9;
        p.life = 1.2;
        p.color = `hsl(${Math.floor(Math.random() * 360)}, 100%, 68%)`;
        p.accentColor = '#ffffff';
        break;
      case 'shadow_slash':
        p.pierce = 2;
        p.radius = 8;
        p.life = 0.65;
        p.color = '#7b5cff';
        break;
      case 'leaf_blade':
        p.pierce = 2;
        p.radius = 6;
        p.life = 1.2;
        p.color = '#50c938';
        break;
      case 'fire_wave':
        p.pierce = 3;
        p.radius = 10;
        p.life = 0.85;
        p.color = '#ff6624';
        break;
      case 'night_arc':
        p.pierce = 4;
        p.radius = 12;
        p.life = 1.1;
        p.color = '#9138eb';
        p.accentColor = '#e08cff';
        break;
      case 'holy_beam':
        p.pierce = 3;
        p.radius = 10;
        p.life = 1.3;
        p.color = '#ffd747';
        p.accentColor = '#75e6ff';
        break;
      case 'terra_beam':
        p.pierce = 5;
        p.radius = 12;
        p.life = 1.8;
        p.color = '#34e864';
        p.accentColor = '#b0ffc4';
        break;
      case 'solar_spear':
        p.pierce = 10;
        p.tileCollide = false;
        p.radius = 13;
        p.life = 0.85;
        p.color = '#ff771c';
        p.accentColor = '#ffee55';
        break;
      case 'rainbow_cat':
        p.bounces = 5;
        p.pierce = 5;
        p.gravity = 150;
        p.radius = 9;
        p.life = 3.5;
        p.color = '#ff73d0';
        p.accentColor = '#73fff8';
        break;
      case 'falling_star':
        p.pierce = 3;
        p.tileCollide = false;
        p.radius = 9;
        p.life = 1.5;
        p.color = '#ffe038';
        p.accentColor = '#ff70d9';
        break;
      // Enemy / Boss Projectiles
      case 'stinger':
        p.radius = 4.5;
        p.color = '#7cd938';
        break;
      case 'eye_laser':
      case 'death_laser':
        p.radius = 5;
        p.tileCollide = false;
        p.color = '#ff2942';
        p.accentColor = '#ff99a6';
        break;
      case 'cursed_flame':
        p.radius = 7;
        p.color = '#59ff26';
        p.accentColor = '#ccff99';
        break;
      case 'plantera_seed':
        p.radius = 5.5;
        p.tileCollide = false;
        p.color = '#ff59b8';
        p.accentColor = '#76db46';
        break;
      case 'spiky_ball':
        p.radius = 8;
        p.gravity = 240;
        p.bounces = 8;
        p.life = 5.0;
        p.color = '#d938a3';
        break;
      case 'golem_fireball':
        p.radius = 8;
        p.bounces = 4;
        p.color = '#ff771c';
        p.accentColor = '#ffee55';
        break;
      case 'golem_beam':
        p.radius = 6;
        p.tileCollide = false;
        p.color = '#ffe038';
        p.accentColor = '#ffffff';
        break;
      case 'sharknado_bolt':
        p.radius = 8;
        p.tileCollide = false;
        p.color = '#1cb3ff';
        p.accentColor = '#9cebff';
        break;
      case 'cultist_fire':
        p.radius = 8;
        p.homing = true;
        p.tileCollide = false;
        p.color = '#ff551c';
        break;
      case 'cultist_ice':
        p.radius = 10;
        p.tileCollide = false;
        p.color = '#66d9ff';
        break;
      case 'phantasmal_bolt':
        p.radius = 6;
        p.tileCollide = false;
        p.color = '#3be8d1';
        p.accentColor = '#ffffff';
        break;
      case 'phantasmal_sphere':
        p.radius = 13;
        p.tileCollide = false;
        p.color = '#2be6b8';
        p.accentColor = '#d4fff5';
        break;
    }

    this.projectiles.push(p);
    return p;
  }

  update(
    dt: number,
    world: World,
    particles: ParticleSystem,
    targets: { x: number; y: number; alive: boolean }[],
    playerPos: { x: number; y: number }
  ): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.gravity !== 0) {
        p.vy += p.gravity * dt;
      }

      // Homing steering
      if (p.homing) {
        if (p.friendly && targets.length > 0) {
          let best: { x: number; y: number } | null = null;
          let bestDist = 420;
          for (const t of targets) {
            if (!t.alive) continue;
            const d = dist(p.x, p.y, t.x, t.y);
            if (d < bestDist) {
              bestDist = d;
              best = t;
            }
          }
          if (best) {
            const spd = Math.hypot(p.vx, p.vy) || 500;
            const desiredAngle = Math.atan2(best.y - p.y, best.x - p.x);
            const curAngle = Math.atan2(p.vy, p.vx);
            let diff = desiredAngle - curAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            const newAngle = curAngle + diff * Math.min(1, dt * 8);
            p.vx = Math.cos(newAngle) * spd;
            p.vy = Math.sin(newAngle) * spd;
          }
        } else if (!p.friendly) {
          const spd = Math.hypot(p.vx, p.vy) || 340;
          const desiredAngle = Math.atan2(playerPos.y - p.y, playerPos.x - p.x);
          const curAngle = Math.atan2(p.vy, p.vx);
          let diff = desiredAngle - curAngle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const newAngle = curAngle + diff * Math.min(1, dt * 3.5);
          p.vx = Math.cos(newAngle) * spd;
          p.vy = Math.sin(newAngle) * spd;
        }
      }

      const nextX = p.x + p.vx * dt;
      const nextY = p.y + p.vy * dt;

      if (p.tileCollide) {
        const tx = Math.floor(nextX / TILE_SIZE);
        const ty = Math.floor(nextY / TILE_SIZE);
        if (world.isSolid(tx, ty)) {
          if (p.bounces > 0) {
            p.bounces--;
            const prevTx = Math.floor(p.x / TILE_SIZE);
            if (prevTx !== tx) p.vx = -p.vx * 0.85;
            else p.vy = -p.vy * 0.85;
            particles.spawn(p.x, p.y, p.color, 3, 60, 2.5);
          } else {
            particles.spawn(p.x, p.y, p.color, 5, 80, 3);
            this.projectiles.splice(i, 1);
            continue;
          }
        } else {
          p.x = nextX;
          p.y = nextY;
        }
      } else {
        p.x = nextX;
        p.y = nextY;
      }

      // Trail dust
      if (Math.random() < 0.45) {
        particles.spawn(p.x, p.y, p.color, 1, 25, 2.5, 0, true);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    for (const p of this.projectiles) {
      const sx = p.x - camX;
      const sy = p.y - camY;
      const angle = Math.atan2(p.vy, p.vx);

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle);

      if (
        p.type === 'arrow' ||
        p.type === 'fire_arrow' ||
        p.type === 'holy_arrow' ||
        p.type === 'stinger'
      ) {
        ctx.fillStyle = p.color;
        ctx.fillRect(-7, -1.5, 14, 3);
        ctx.fillStyle = p.accentColor;
        ctx.fillRect(4, -3, 4, 6);
      } else if (
        p.type === 'eye_laser' ||
        p.type === 'death_laser' ||
        p.type === 'golem_beam' ||
        p.type === 'phantasmal_bolt' ||
        p.type === 'prism_beam'
      ) {
        ctx.fillStyle = p.color;
        ctx.fillRect(-10, -2.5, 20, 5);
        ctx.fillStyle = p.accentColor;
        ctx.fillRect(-8, -1, 16, 2);
      } else if (
        p.type === 'demon_scythe' ||
        p.type === 'typhoon' ||
        p.type === 'night_arc' ||
        p.type === 'terra_beam' ||
        p.type === 'holy_beam'
      ) {
        ctx.rotate(p.life * 16);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.fillStyle = p.accentColor;
        ctx.fillRect(-3, -3, 6, 6);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.accentColor;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
