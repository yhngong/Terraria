import { TILE_SIZE, dist, rectOverlap, Rect } from '../core/math';
import { World, BiomeType } from '../world/world';
import { Player } from './player';
import { ProjectileManager } from './projectiles';
import { AudioManager } from '../core/audio';
import { ParticleSystem } from '../core/particles';

export interface Enemy {
  id: number;
  type: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  damage: number;
  defense: number;
  color: string;
  accentColor: string;
  ai: 'slime' | 'fighter' | 'flier' | 'shooter' | 'wyvern';
  noTileCollide: boolean;
  aiTimer: number;
  coins: number;
  drops: { id: string; chance: number; min: number; max: number }[];
}

let nextEnemyId = 1;

export class EnemyManager {
  enemies: Enemy[] = [];
  allowNaturalSpawns = false;
  private spawnTimer = 2.0;

  spawnEnemy(type: string, x: number, y: number): Enemy {
    const id = nextEnemyId++;
    let e: Enemy = {
      id,
      type,
      name: 'Green Slime',
      x,
      y,
      vx: 0,
      vy: 0,
      width: 18,
      height: 14,
      hp: 25,
      maxHp: 25,
      damage: 8,
      defense: 1,
      color: '#2ecc40',
      accentColor: '#76ff7a',
      ai: 'slime',
      noTileCollide: false,
      aiTimer: 0,
      coins: 25,
      drops: [{ id: 'gel', chance: 1, min: 1, max: 3 }]
    };

    switch (type) {
      case 'blue_slime':
        e = {
          ...e,
          name: 'Blue Slime',
          hp: 38,
          maxHp: 38,
          damage: 11,
          defense: 2,
          color: '#2b82ff',
          accentColor: '#85baff',
          coins: 45,
          drops: [{ id: 'gel', chance: 1, min: 2, max: 4 }]
        };
        break;
      case 'zombie':
        e = {
          ...e,
          name: 'Zombie',
          width: 14,
          height: 26,
          hp: 55,
          maxHp: 55,
          damage: 15,
          defense: 4,
          color: '#52805c',
          accentColor: '#82403b',
          ai: 'fighter',
          coins: 80,
          drops: [{ id: 'lesser_healing_potion', chance: 0.2, min: 1, max: 1 }]
        };
        break;
      case 'demon_eye':
        e = {
          ...e,
          name: 'Demon Eye',
          width: 16,
          height: 16,
          hp: 60,
          maxHp: 60,
          damage: 18,
          defense: 2,
          color: '#ebebf2',
          accentColor: '#d92b3a',
          ai: 'flier',
          coins: 90,
          drops: [
            { id: 'lens', chance: 0.65, min: 1, max: 2 },
            { id: 'suspicious_looking_eye', chance: 0.08, min: 1, max: 1 }
          ]
        };
        break;
      case 'eater_of_souls':
        e = {
          ...e,
          name: 'Eater of Souls',
          width: 20,
          height: 18,
          hp: 65,
          maxHp: 65,
          damage: 22,
          defense: 6,
          color: '#6b479e',
          accentColor: '#9ccf46',
          ai: 'flier',
          coins: 120,
          drops: [
            { id: 'rotten_chunk', chance: 0.75, min: 1, max: 2 },
            { id: 'worm_food', chance: 0.08, min: 1, max: 1 }
          ]
        };
        break;
      case 'hornet':
        e = {
          ...e,
          name: 'Moss Hornet',
          width: 20,
          height: 18,
          hp: 85,
          maxHp: 85,
          damage: 26,
          defense: 8,
          color: '#e8b923',
          accentColor: '#2e261b',
          ai: 'shooter',
          coins: 160,
          drops: [
            { id: 'stinger', chance: 0.85, min: 1, max: 2 },
            { id: 'jungle_spores', chance: 0.6, min: 1, max: 2 }
          ]
        };
        break;
      case 'skeleton':
        e = {
          ...e,
          name: 'Angry Bones',
          width: 14,
          height: 26,
          hp: 95,
          maxHp: 95,
          damage: 26,
          defense: 8,
          color: '#ded8c3',
          accentColor: '#5c5749',
          ai: 'fighter',
          coins: 150,
          drops: [
            { id: 'bone', chance: 0.9, min: 2, max: 5 },
            { id: 'cobalt_shield', chance: 0.08, min: 1, max: 1 }
          ]
        };
        break;
      case 'voodoo_demon':
        e = {
          ...e,
          name: 'Voodoo Demon',
          width: 24,
          height: 24,
          hp: 140,
          maxHp: 140,
          damage: 34,
          defense: 10,
          color: '#b82c3a',
          accentColor: '#ff7722',
          ai: 'shooter',
          coins: 350,
          drops: [
            { id: 'guide_voodoo_doll', chance: 0.55, min: 1, max: 1 },
            { id: 'demon_scythe', chance: 0.12, min: 1, max: 1 }
          ]
        };
        break;
      case 'pixie':
        e = {
          ...e,
          name: 'Pixie',
          width: 16,
          height: 16,
          hp: 180,
          maxHp: 180,
          damage: 45,
          defense: 14,
          color: '#ffe866',
          accentColor: '#75e6ff',
          ai: 'flier',
          coins: 450,
          drops: [
            { id: 'soul_of_light', chance: 0.85, min: 1, max: 3 },
            { id: 'greater_healing_potion', chance: 0.25, min: 1, max: 1 }
          ]
        };
        break;
      case 'corruptor':
        e = {
          ...e,
          name: 'Corruptor',
          width: 24,
          height: 22,
          hp: 240,
          maxHp: 240,
          damage: 52,
          defense: 16,
          color: '#5a3db8',
          accentColor: '#78ff38',
          ai: 'shooter',
          coins: 500,
          drops: [{ id: 'soul_of_night', chance: 0.85, min: 1, max: 3 }]
        };
        break;
      case 'wyvern':
        e = {
          ...e,
          name: 'Arch Wyvern',
          width: 36,
          height: 20,
          hp: 450,
          maxHp: 450,
          damage: 58,
          defense: 18,
          color: '#e8f5ff',
          accentColor: '#2ec4b6',
          ai: 'wyvern',
          noTileCollide: true,
          coins: 1500,
          drops: [{ id: 'soul_of_flight', chance: 1.0, min: 8, max: 14 }]
        };
        break;
      case 'lihzahrd':
        e = {
          ...e,
          name: 'Lihzahrd Warrior',
          width: 18,
          height: 26,
          hp: 360,
          maxHp: 360,
          damage: 64,
          defense: 24,
          color: '#76b82a',
          accentColor: '#b8631d',
          ai: 'fighter',
          coins: 800,
          drops: [
            { id: 'lihzahrd_power_cell', chance: 0.35, min: 1, max: 1 },
            { id: 'solar_fragment', chance: 0.4, min: 1, max: 3 }
          ]
        };
        break;
    }

    this.enemies.push(e);
    return e;
  }

  update(
    dt: number,
    world: World,
    player: Player,
    projectiles: ProjectileManager,
    audio: AudioManager,
    particles: ParticleSystem,
    biome: BiomeType,
    bossActive: boolean
  ): void {
    // Natural biome enemy spawning (disabled in Boss Rush Arena so only bosses & boss minions appear)
    if (this.allowNaturalSpawns) {
      this.spawnTimer -= dt;
      const maxEnemies = bossActive ? 3 : 10;
      if (this.spawnTimer <= 0 && this.enemies.length < maxEnemies && !player.dead) {
        this.spawnTimer = world.hardmode ? 2.4 : 3.2;
        this.trySpawnNatural(world, player, biome);
      }
    }

    const meleeBox = player.getMeleeHitbox();
    const held = player.getHeldItem();
    const meleeDmg = Math.round(((held?.damage || 8) * player.getDamageMultiplier()));

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (dist(e.x, e.y, player.x, player.y) > 1350) {
        this.enemies.splice(i, 1);
        continue;
      }

      e.aiTimer += dt;
      const dirX = Math.sign(player.x - e.x) || 1;

      if (e.ai === 'slime') {
        e.vy = Math.min(420, e.vy + 720 * dt);
        if (this.isOnGround(e, world)) {
          e.vx *= 0.82;
          if (e.aiTimer >= 1.35) {
            e.aiTimer = 0;
            e.vy = -255 - Math.random() * 55;
            e.vx = dirX * (115 + Math.random() * 45);
          }
        }
      } else if (e.ai === 'fighter') {
        e.vy = Math.min(420, e.vy + 720 * dt);
        const spd = e.type === 'lihzahrd' ? 120 : 78;
        e.vx = dirX * spd;
        const frontTx = Math.floor((e.x + dirX * (e.width * 0.5 + 4)) / TILE_SIZE);
        const footTy = Math.floor((e.y + e.height * 0.5 - 2) / TILE_SIZE);
        if (world.isSolid(frontTx, footTy) && this.isOnGround(e, world)) {
          e.vy = -275;
        }
      } else if (e.ai === 'flier' || e.ai === 'wyvern') {
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        const spd = e.ai === 'wyvern' ? 235 : 135;
        e.vx += (Math.cos(angle) * spd - e.vx) * Math.min(1, dt * 3.2);
        e.vy += (Math.sin(angle) * spd - e.vy) * Math.min(1, dt * 3.2);
      } else if (e.ai === 'shooter') {
        const targetY = player.y - 45 + Math.sin(e.aiTimer * 2.5) * 30;
        const angle = Math.atan2(targetY - e.y, player.x - e.x);
        e.vx += (Math.cos(angle) * 110 - e.vx) * Math.min(1, dt * 3);
        e.vy += (Math.sin(angle) * 110 - e.vy) * Math.min(1, dt * 3);

        if (e.aiTimer >= 2.2) {
          e.aiTimer = 0;
          const aim = Math.atan2(player.y - e.y, player.x - e.x);
          projectiles.spawn({
            x: e.x,
            y: e.y,
            vx: Math.cos(aim) * 290,
            vy: Math.sin(aim) * 290,
            type: e.type === 'hornet' ? 'stinger' : e.type === 'corruptor' ? 'cursed_flame' : 'eye_laser',
            damage: Math.round(e.damage * 0.85),
            friendly: false
          });
        }
      }

      // Move & collide
      if (e.noTileCollide) {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      } else {
        this.moveEnemyWithCollision(e, dt, world);
      }

      const eRect: Rect = {
        x: e.x - e.width * 0.5,
        y: e.y - e.height * 0.5,
        w: e.width,
        h: e.height
      };

      // Player melee collision
      if (meleeBox && !player.swingHitIds.has(e.id) && rectOverlap(meleeBox, eRect)) {
        player.swingHitIds.add(e.id);
        this.damageEnemy(e, meleeDmg, player.facing * (held?.knockback || 4), world, audio, particles);
      }

      // Friendly projectile collision
      for (let j = projectiles.projectiles.length - 1; j >= 0; j--) {
        const p = projectiles.projectiles[j];
        if (!p.friendly || p.hitIds.has(e.id)) continue;
        if (
          p.x + p.radius > eRect.x &&
          p.x - p.radius < eRect.x + eRect.w &&
          p.y + p.radius > eRect.y &&
          p.y - p.radius < eRect.y + eRect.h
        ) {
          p.hitIds.add(e.id);
          p.pierce--;
          const kbDir = Math.sign(p.vx) || 1;
          this.damageEnemy(e, p.damage, kbDir * p.knockback, world, audio, particles);

          if (p.type === 'holy_arrow') {
            projectiles.spawn({
              x: e.x + (Math.random() - 0.5) * 80,
              y: e.y - 240,
              vx: (Math.random() - 0.5) * 40,
              vy: 520,
              type: 'falling_star',
              damage: Math.round(p.damage * 0.75),
              friendly: true
            });
          }

          if (p.pierce <= 0) {
            projectiles.projectiles.splice(j, 1);
          }
        }
      }

      if (e.hp <= 0) {
        this.onEnemyKilled(e, player, world, audio, particles);
        this.enemies.splice(i, 1);
        continue;
      }

      // Touch damage to player
      if (!player.dead && rectOverlap(eRect, player.getBounds())) {
        player.takeDamage(e.damage, Math.sign(player.x - e.x) || 1, audio, particles, world);
      }
    }
  }

  private damageEnemy(
    e: Enemy,
    rawDmg: number,
    kb: number,
    world: World,
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    const crit = Math.random() < 0.12;
    const base = Math.max(1, Math.round(rawDmg - e.defense * 0.5));
    const dmg = crit ? base * 2 : base;
    e.hp -= dmg;
    e.vx += kb * 34;
    if (!e.noTileCollide) e.vy = -95;
    particles.addText(e.x, e.y - 10, `${dmg}${crit ? '!' : ''}`, crit ? '#ff7b24' : '#ffeb57', crit ? 1.25 : 1.0);
    particles.spawn(e.x, e.y, e.color, 5, 75, 2.5);
    audio.play('hit');
    void world;
  }

  private onEnemyKilled(
    e: Enemy,
    player: Player,
    world: World,
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    audio.play('kill');
    particles.spawn(e.x, e.y, e.color, 14, 120, 3.5);
    player.coins += e.coins;
    for (const drop of e.drops) {
      if (Math.random() <= drop.chance) {
        const count = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
        world.spawnDrop(e.x, e.y, drop.id, count);
      }
    }
  }

  private trySpawnNatural(world: World, player: Player, biome: BiomeType): void {
    const side = Math.random() < 0.5 ? -1 : 1;
    const sx = player.x + side * (360 + Math.random() * 180);
    let sy = player.y + (Math.random() - 0.5) * 160;
    const tx = Math.floor(sx / TILE_SIZE);
    let ty = Math.floor(sy / TILE_SIZE);
    if (!world.inBounds(tx, ty)) return;

    // Find open space above ground
    for (let step = 0; step < 18 && world.isSolid(tx, ty); step++) {
      ty--;
    }
    if (world.isSolid(tx, ty)) return;
    sy = ty * TILE_SIZE;

    let type = 'green_slime';
    if (biome === 'sky' && world.hardmode) {
      type = 'wyvern';
    } else if (biome === 'underworld') {
      type = 'voodoo_demon';
    } else if (biome === 'corruption') {
      type = world.hardmode && Math.random() < 0.5 ? 'corruptor' : 'eater_of_souls';
    } else if (biome === 'hallow') {
      type = 'pixie';
    } else if (biome === 'jungle') {
      type = world.hardmode && ty > 150 && Math.random() < 0.45 ? 'lihzahrd' : 'hornet';
    } else if (biome === 'dungeon' || biome === 'underground') {
      type = Math.random() < 0.6 ? 'skeleton' : 'blue_slime';
    } else if (!world.isDaytime()) {
      type = Math.random() < 0.5 ? 'zombie' : 'demon_eye';
    } else {
      type = Math.random() < 0.65 ? 'green_slime' : 'blue_slime';
    }

    this.spawnEnemy(type, sx, sy);
  }

  private isOnGround(e: Enemy, world: World): boolean {
    const tx = Math.floor(e.x / TILE_SIZE);
    const ty = Math.floor((e.y + e.height * 0.5 + 2) / TILE_SIZE);
    return world.isSolid(tx, ty) || world.isPlatform(tx, ty);
  }

  private moveEnemyWithCollision(e: Enemy, dt: number, world: World): void {
    const hw = e.width * 0.5;
    const hh = e.height * 0.5;

    const nextX = e.x + e.vx * dt;
    const checkX = Math.floor((nextX + Math.sign(e.vx) * hw) / TILE_SIZE);
    const midY = Math.floor(e.y / TILE_SIZE);
    if (!world.isSolid(checkX, midY)) {
      e.x = nextX;
    } else {
      e.vx = -e.vx * 0.5;
    }

    const nextY = e.y + e.vy * dt;
    const footY = Math.floor((nextY + hh) / TILE_SIZE);
    const tx = Math.floor(e.x / TILE_SIZE);
    if (e.vy >= 0 && (world.isSolid(tx, footY) || world.isPlatform(tx, footY))) {
      e.y = footY * TILE_SIZE - hh - 0.01;
      e.vy = 0;
    } else if (e.vy < 0 && world.isSolid(tx, Math.floor((nextY - hh) / TILE_SIZE))) {
      e.vy = 0;
    } else {
      e.y = nextY;
    }
  }

  render(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    for (const e of this.enemies) {
      const sx = Math.floor(e.x - camX);
      const sy = Math.floor(e.y - camY);
      const hw = Math.floor(e.width * 0.5);
      const hh = Math.floor(e.height * 0.5);

      if (e.ai === 'slime') {
        ctx.fillStyle = e.color;
        ctx.fillRect(sx - hw, sy - hh + 3, e.width, e.height - 3);
        ctx.fillRect(sx - hw + 2, sy - hh, e.width - 4, 4);
        ctx.fillStyle = e.accentColor;
        ctx.fillRect(sx - hw + 3, sy - hh + 2, 4, 3);
      } else if (e.type === 'demon_eye') {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(sx, sy, hw, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = e.accentColor;
        ctx.beginPath();
        ctx.arc(sx + Math.sign(e.vx) * 3, sy, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.ai === 'wyvern') {
        for (let seg = 5; seg >= 0; seg--) {
          const ox = -Math.sign(e.vx || 1) * seg * 10;
          const oy = Math.sin(e.aiTimer * 8 + seg * 0.8) * 5;
          ctx.fillStyle = seg === 0 ? e.accentColor : e.color;
          ctx.fillRect(sx + ox - 8, sy + oy - 7, 16, 14);
        }
      } else {
        ctx.fillStyle = e.color;
        ctx.fillRect(sx - hw, sy - hh, e.width, e.height);
        ctx.fillStyle = e.accentColor;
        ctx.fillRect(sx - hw + 3, sy - hh + 4, e.width - 6, 6);
      }

      // Mini health bar if damaged
      if (e.hp < e.maxHp) {
        const bw = 22;
        const ratio = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(sx - bw / 2, sy - hh - 7, bw, 4);
        ctx.fillStyle = '#38eb5c';
        ctx.fillRect(sx - bw / 2 + 1, sy - hh - 6, (bw - 2) * ratio, 2);
      }
    }
  }
}
