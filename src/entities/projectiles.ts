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
  friendly: boolean;
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
  history: { x: number; y: number }[];
  // For Zenith boomerang blade arcs
  targetX?: number;
  targetY?: number;
  arcOffset?: number;
}

const ZENITH_COLORS = [
  ['#34e864', '#b8ffd0'], // Terra Blade
  ['#ff73d0', '#73fff8'], // Meowmere
  ['#ff771c', '#ffee55'], // Solar / Star Wrath
  ['#9138eb', '#e08cff'], // Night's Edge
  ['#ffd747', '#75e6ff'], // Excalibur
  ['#3be8d1', '#ffffff']  // Influx Waver
];

export class ProjectileManager {
  projectiles: Projectile[] = [];

  spawn(
    opts: Partial<Projectile> & {
      x: number;
      y: number;
      vx: number;
      vy: number;
      type: string;
      damage: number;
      friendly: boolean;
    }
  ): Projectile {
    const p: Projectile = {
      x: opts.x,
      y: opts.y,
      vx: opts.vx,
      vy: opts.vy,
      radius: opts.radius ?? 6,
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
      hitIds: new Set(),
      history: [],
      targetX: opts.targetX,
      targetY: opts.targetY,
      arcOffset: opts.arcOffset
    };

    switch (p.type) {
      case 'zenith_arc': {
        const pal = ZENITH_COLORS[Math.floor(Math.random() * ZENITH_COLORS.length)];
        p.color = pal[0];
        p.accentColor = pal[1];
        p.pierce = 99;
        p.tileCollide = false;
        p.radius = 22;
        p.life = 0.48;
        p.maxLife = 0.48;
        p.arcOffset = (Math.random() - 0.5) * 190;
        break;
      }
      case 'arrow':
        p.gravity = 180;
        p.color = '#c99b68';
        p.accentColor = '#e6edf5';
        break;
      case 'fire_arrow':
        p.gravity = 160;
        p.color = '#ff661c';
        p.accentColor = '#ffee55';
        break;
      case 'holy_arrow':
        p.gravity = 140;
        p.color = '#5ce1ff';
        p.accentColor = '#ff70d9';
        break;
      case 'bullet':
        p.radius = 4;
        p.color = '#ffeb75';
        break;
      case 'homing_bullet':
        p.radius = 5;
        p.homing = true;
        p.color = '#59e62e';
        p.accentColor = '#d2ffb8';
        break;
      case 'spark_bolt':
        p.gravity = 100;
        p.color = '#ff7722';
        p.accentColor = '#ffee55';
        break;
      case 'water_bolt':
        p.bounces = 6;
        p.pierce = 5;
        p.radius = 7;
        p.color = '#2b7fff';
        p.accentColor = '#8cd4ff';
        p.life = 5.0;
        break;
      case 'demon_scythe':
        p.pierce = 6;
        p.radius = 14;
        p.color = '#8538ff';
        p.accentColor = '#d1a8ff';
        break;
      case 'crystal_shard':
        p.bounces = 4;
        p.radius = 5.5;
        p.color = '#ff66d9';
        p.accentColor = '#66e3ff';
        break;
      case 'ichor_stream':
        p.gravity = 130;
        p.pierce = 5;
        p.radius = 6.5;
        p.color = '#ffcf24';
        p.accentColor = '#fff599';
        break;
      case 'typhoon':
        p.homing = true;
        p.bounces = 8;
        p.pierce = 10;
        p.radius = 16;
        p.life = 4.5;
        p.color = '#1cb3ff';
        p.accentColor = '#9cebff';
        break;
      case 'nebula_bolt':
        p.homing = true;
        p.pierce = 3;
        p.radius = 10;
        p.color = '#e838ff';
        p.accentColor = '#75e6ff';
        break;
      case 'prism_beam':
        p.pierce = 16;
        p.tileCollide = false;
        p.radius = 12;
        p.life = 1.2;
        p.color = `hsl(${Math.floor(Math.random() * 360)}, 100%, 68%)`;
        p.accentColor = '#ffffff';
        break;
      case 'shadow_slash':
        p.pierce = 3;
        p.radius = 10;
        p.life = 0.75;
        p.color = '#7b5cff';
        break;
      case 'leaf_blade':
        p.pierce = 3;
        p.radius = 8;
        p.life = 1.3;
        p.color = '#50c938';
        break;
      case 'fire_wave':
        p.pierce = 4;
        p.radius = 13;
        p.life = 0.95;
        p.color = '#ff6624';
        break;
      case 'night_arc':
        p.pierce = 5;
        p.radius = 15;
        p.life = 1.2;
        p.color = '#9138eb';
        p.accentColor = '#e08cff';
        break;
      case 'holy_beam':
        p.pierce = 4;
        p.radius = 13;
        p.life = 1.4;
        p.color = '#ffd747';
        p.accentColor = '#75e6ff';
        break;
      case 'terra_beam':
        p.pierce = 6;
        p.tileCollide = false;
        p.radius = 11;
        p.life = 1.8;
        p.color = '#34e864';
        p.accentColor = '#b0ffc4';
        break;
      case 'solar_spear':
        p.pierce = 12;
        p.tileCollide = false;
        p.radius = 12;
        p.life = 0.9;
        p.color = '#ff771c';
        p.accentColor = '#ffee55';
        break;
      case 'rainbow_cat':
        p.bounces = 6;
        p.pierce = 7;
        p.gravity = 130;
        p.radius = 11;
        p.life = 3.5;
        p.color = '#ff73d0';
        p.accentColor = '#73fff8';
        break;
      case 'falling_star':
        p.pierce = 4;
        p.tileCollide = false;
        p.radius = 12;
        p.life = 1.5;
        p.color = '#ffe038';
        p.accentColor = '#ff70d9';
        break;
      // Enemy / Boss Projectiles
      case 'stinger':
        p.radius = 5.5;
        p.tileCollide = false;
        p.color = '#7cd938';
        p.accentColor = '#d4ff80';
        break;
      case 'eye_laser':
      case 'death_laser':
        p.radius = 6;
        p.tileCollide = false;
        p.color = '#ff2942';
        p.accentColor = '#ff99a6';
        break;
      case 'cursed_flame':
        p.radius = 8.5;
        p.tileCollide = false;
        p.color = '#59ff26';
        p.accentColor = '#ccff99';
        break;
      case 'plantera_seed':
        p.radius = 6.5;
        p.tileCollide = false;
        p.color = '#ff59b8';
        p.accentColor = '#76db46';
        break;
      case 'spiky_ball':
        p.radius = 9;
        p.gravity = 240;
        p.bounces = 8;
        p.life = 5.0;
        p.color = '#d938a3';
        p.accentColor = '#ff99de';
        break;
      case 'golem_fireball':
        p.radius = 9;
        p.bounces = 4;
        p.color = '#ff771c';
        p.accentColor = '#ffee55';
        break;
      case 'golem_beam':
        p.radius = 7;
        p.tileCollide = false;
        p.color = '#ffe038';
        p.accentColor = '#ffffff';
        break;
      case 'sharknado_bolt':
        p.radius = 10;
        p.tileCollide = false;
        p.color = '#1cb3ff';
        p.accentColor = '#9cebff';
        break;
      case 'cultist_fire':
        p.radius = 9;
        p.homing = true;
        p.tileCollide = false;
        p.color = '#ff551c';
        p.accentColor = '#ffee66';
        break;
      case 'cultist_ice':
        p.radius = 11;
        p.tileCollide = false;
        p.color = '#66d9ff';
        p.accentColor = '#ffffff';
        break;
      case 'phantasmal_bolt':
        p.radius = 7;
        p.tileCollide = false;
        p.color = '#3be8d1';
        p.accentColor = '#ffffff';
        break;
      case 'phantasmal_sphere':
        p.radius = 15;
        p.tileCollide = false;
        p.color = '#2be6b8';
        p.accentColor = '#d4fff5';
        break;
      // Calamity Mod Projectiles
      case 'cosmic_blade':
        p.pierce = 8;
        p.tileCollide = false;
        p.radius = 11;
        p.life = 1.6;
        p.color = '#ff29c6';
        p.accentColor = '#3be8d1';
        break;
      case 'yharon_fireball':
        p.pierce = 6;
        p.homing = p.friendly;
        p.tileCollide = false;
        p.radius = 10;
        p.life = 2.4;
        p.color = '#ffaa00';
        p.accentColor = '#ff2942';
        break;
      case 'cosmos_ark':
        p.pierce = 14;
        p.homing = true;
        p.tileCollide = false;
        p.radius = 12;
        p.life = 1.8;
        p.color = '#ff1938';
        p.accentColor = '#00ffd5';
        break;
      case 'brimstone_hellblast':
        p.pierce = 6;
        p.homing = p.friendly;
        p.tileCollide = false;
        p.radius = 10;
        p.life = 2.8;
        p.color = '#ff1938';
        p.accentColor = '#ffaa00';
        break;
      case 'profaned_spear':
        p.pierce = 5;
        p.tileCollide = false;
        p.radius = 9;
        p.life = 2.8;
        p.color = '#ffd747';
        p.accentColor = '#2bff6e';
        break;
      case 'holy_collider_flame':
        p.pierce = 10;
        p.tileCollide = false;
        p.radius = 11;
        p.life = 1.1;
        p.color = '#ffd747';
        p.accentColor = '#ff771c';
        break;
      case 'galactus_comet':
        p.pierce = 12;
        p.tileCollide = false;
        p.radius = 11;
        p.life = 1.5;
        p.color = '#ff47b8';
        p.accentColor = '#3be8d1';
        break;
      case 'death_scythe':
        p.pierce = 12;
        p.homing = true;
        p.tileCollide = false;
        p.radius = 12;
        p.life = 2.1;
        p.color = '#a638ff';
        p.accentColor = '#ff29c6';
        break;
      case 'earth_meteor': {
        const earthPal = [
          ['#ff551c', '#ffee55'], // Blazing Magma Meteor
          ['#2bff6e', '#b8ffd0'], // Emerald Gaia Meteor
          ['#3be8d1', '#ffd747']  // Frost/Starlight Meteor
        ][Math.floor(Math.random() * 3)];
        p.pierce = 14;
        p.tileCollide = false;
        p.radius = 11;
        p.life = 1.6;
        p.color = earthPal[0];
        p.accentColor = earthPal[1];
        break;
      }
      case 'yoyo_air':
      case 'yoyo_pandemic':
      case 'yoyo_terrarian':
      case 'yoyo_revelation':
      case 'yoyo_obliterator':
      case 'yoyo_azathoth': {
        p.pierce = 999;
        p.tileCollide = false;
        p.radius = 8;
        p.life = 1.35;
        p.maxLife = 1.35;
        if (p.type === 'yoyo_air') {
          p.color = '#3be8d1';
          p.accentColor = '#ffd747';
        } else if (p.type === 'yoyo_pandemic') {
          p.color = '#59e62e';
          p.accentColor = '#ff4252';
        } else if (p.type === 'yoyo_terrarian') {
          p.color = '#2be6b8';
          p.accentColor = '#96ff0a';
        } else if (p.type === 'yoyo_revelation') {
          p.color = '#ffd747';
          p.accentColor = '#2bff6e';
        } else if (p.type === 'yoyo_obliterator') {
          p.color = '#ff29c6';
          p.accentColor = '#3be8d1';
        } else {
          p.color = '#ff1938';
          p.accentColor = '#ffaa00';
          p.radius = 9.5;
        }
        break;
      }
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

      // Record ribbon trail history
      p.history.push({ x: p.x, y: p.y });
      if (p.history.length > (p.type === 'zenith_arc' ? 12 : 7)) {
        p.history.shift();
      }

      // Special Zenith boomerang elliptical sword arc from player -> cursor -> player
      if (p.type === 'zenith_arc' && p.targetX !== undefined && p.targetY !== undefined) {
        const prog = 1 - p.life / p.maxLife; // 0..1
        const theta = prog * Math.PI * 2;
        const midX = (playerPos.x + p.targetX) * 0.5;
        const midY = (playerPos.y + p.targetY) * 0.5;
        const dx = p.targetX - playerPos.x;
        const dy = p.targetY - playerPos.y;
        const angle = Math.atan2(dy, dx);
        const halfA = Math.max(60, Math.hypot(dx, dy) * 0.55);
        const halfB = p.arcOffset || 85;

        const lx = -Math.cos(theta) * halfA;
        const ly = Math.sin(theta) * halfB;
        const nx = midX + lx * Math.cos(angle) - ly * Math.sin(angle);
        const ny = midY + lx * Math.sin(angle) + ly * Math.cos(angle);
        p.vx = (nx - p.x) / Math.max(0.001, dt);
        p.vy = (ny - p.y) / Math.max(0.001, dt);
        p.x = nx;
        p.y = ny;
        if (Math.random() < 0.7) {
          particles.spawn(p.x, p.y, p.color, 1, 50, 3, 0, true);
        }
        continue;
      }

      // Special Tethered Yoyo behavior: tracks cursor, tethered to player, multi-hits & spawns sub-orbs!
      if (p.type.startsWith('yoyo_')) {
        const tx = p.targetX ?? playerPos.x + 120;
        const ty = p.targetY ?? playerPos.y;
        const maxRange = p.arcOffset || 360;
        let dx = tx - playerPos.x;
        let dy = ty - playerPos.y;
        const dFromPlayer = Math.hypot(dx, dy);
        if (dFromPlayer > maxRange) {
          dx = (dx / dFromPlayer) * maxRange;
          dy = (dy / dFromPlayer) * maxRange;
        }
        const goalX = playerPos.x + dx;
        const goalY = playerPos.y + dy;

        // Smooth high-speed yoyo tracking with small orbital buzz around target
        const buzzAngle = p.life * 28;
        const orbitR = 12;
        const destX = goalX + Math.cos(buzzAngle) * orbitR;
        const destY = goalY + Math.sin(buzzAngle) * orbitR;
        p.vx = (destX - p.x) * 18;
        p.vy = (destY - p.y) * 18;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Reset hitIds every 0.12s so spinning yoyo deals continuous multi-hit damage!
        if (Math.floor((p.life + dt) / 0.12) !== Math.floor(p.life / 0.12)) {
          p.hitIds.clear();
        }

        // Emit secondary Calamity / Terrarian yoyo sub-projectiles every 0.24s!
        if (Math.floor((p.life + dt) / 0.24) !== Math.floor(p.life / 0.24)) {
          const subAngle = Math.random() * Math.PI * 2;
          const subType =
            p.type === 'yoyo_air'
              ? 'leaf_blade'
              : p.type === 'yoyo_pandemic'
              ? 'homing_bullet'
              : p.type === 'yoyo_terrarian'
              ? 'terra_beam'
              : p.type === 'yoyo_revelation'
              ? 'holy_collider_flame'
              : p.type === 'yoyo_obliterator'
              ? 'cosmic_blade'
              : 'cosmos_ark';
          this.spawn({
            x: p.x,
            y: p.y,
            vx: Math.cos(subAngle) * 620,
            vy: Math.sin(subAngle) * 620,
            type: subType,
            damage: Math.round(p.damage * 0.65),
            knockback: 3,
            friendly: true,
            homing: true
          });
        }

        if (Math.random() < 0.75) {
          particles.spawn(p.x, p.y, p.color, 1, 55, 3, 0, true);
        }
        continue;
      }

      if (p.gravity !== 0) {
        p.vy += p.gravity * dt;
      }

      // Homing steering
      if (p.homing) {
        if (p.friendly && targets.length > 0) {
          let best: { x: number; y: number } | null = null;
          let bestDist = 560;
          for (const t of targets) {
            if (!t.alive) continue;
            const d = dist(p.x, p.y, t.x, t.y);
            if (d < bestDist) {
              bestDist = d;
              best = t;
            }
          }
          if (best) {
            const spd = Math.hypot(p.vx, p.vy) || 560;
            const desiredAngle = Math.atan2(best.y - p.y, best.x - p.x);
            const curAngle = Math.atan2(p.vy, p.vx);
            let diff = desiredAngle - curAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            const newAngle = curAngle + diff * Math.min(1, dt * 10);
            p.vx = Math.cos(newAngle) * spd;
            p.vy = Math.sin(newAngle) * spd;
          }
        } else if (!p.friendly) {
          const spd = Math.hypot(p.vx, p.vy) || 350;
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
            if (prevTx !== tx) p.vx = -p.vx * 0.88;
            else p.vy = -p.vy * 0.88;
            particles.spawn(p.x, p.y, p.color, 4, 70, 3);
          } else {
            particles.spawn(p.x, p.y, p.color, 6, 90, 3.5);
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

      if (Math.random() < 0.5) {
        particles.spawn(p.x, p.y, p.color, 1, 30, 2.8, 0, true);
      }
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    playerPos?: { x: number; y: number }
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.projectiles) {
      const sx = p.x - camX;
      const sy = p.y - camY;
      const angle = Math.atan2(p.vy, p.vx);

      // Draw glowing Yoyo String from Player to Yoyo disc!
      if (p.type.startsWith('yoyo_') && playerPos) {
        ctx.save();
        ctx.strokeStyle = p.accentColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.78;
        ctx.beginPath();
        const px = playerPos.x - camX;
        const py = playerPos.y - camY;
        const midX = (px + sx) * 0.5;
        const midY = (py + sy) * 0.5 + 10;
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(midX, midY, sx, sy);
        ctx.stroke();
        ctx.restore();
      }

      // 1. Draw glowing motion ribbon trail
      if (p.history.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.history[0].x - camX, p.history[0].y - camY);
        for (let k = 1; k < p.history.length; k++) {
          ctx.lineTo(p.history[k].x - camX, p.history[k].y - camY);
        }
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.type === 'zenith_arc' ? 10 : Math.max(2.5, p.radius * 0.85);
        ctx.globalAlpha = 0.45;
        ctx.stroke();

        ctx.strokeStyle = p.accentColor;
        ctx.lineWidth = p.type === 'zenith_arc' ? 4 : Math.max(1, p.radius * 0.35);
        ctx.globalAlpha = 0.8;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle);

      if (p.type === 'zenith_arc') {
        // Spinning glowing legendary sword silhouette
        ctx.fillStyle = p.color;
        ctx.fillRect(-16, -4, 32, 8);
        ctx.fillStyle = p.accentColor;
        ctx.fillRect(-12, -2, 26, 4);
      } else if (
        p.type === 'arrow' ||
        p.type === 'fire_arrow' ||
        p.type === 'holy_arrow' ||
        p.type === 'stinger'
      ) {
        ctx.fillStyle = p.color;
        ctx.fillRect(-9, -2, 18, 4);
        ctx.fillStyle = p.accentColor;
        ctx.fillRect(5, -3.5, 5, 7);
      } else if (
        p.type === 'eye_laser' ||
        p.type === 'death_laser' ||
        p.type === 'golem_beam' ||
        p.type === 'phantasmal_bolt' ||
        p.type === 'prism_beam' ||
        p.type === 'profaned_spear'
      ) {
        ctx.fillStyle = p.color;
        ctx.fillRect(-14, -3.5, 28, 7);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-10, -1.5, 20, 3);
      } else if (p.type.startsWith('yoyo_')) {
        // Crisp compact spinning Yoyo disc with axle hub
        ctx.rotate(p.life * 26);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = p.accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.72, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (
        p.type === 'demon_scythe' ||
        p.type === 'typhoon' ||
        p.type === 'night_arc' ||
        p.type === 'terra_beam' ||
        p.type === 'holy_beam' ||
        p.type === 'cosmic_blade' ||
        p.type === 'cosmos_ark' ||
        p.type === 'death_scythe' ||
        p.type === 'holy_collider_flame'
      ) {
        ctx.rotate(p.life * 20);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 1.65);
        ctx.stroke();
        ctx.fillStyle = p.accentColor;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 1.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }
}
