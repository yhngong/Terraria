import { dist, clamp, rectOverlap, Rect } from '../core/math';
import { World } from '../world/world';
import { Player } from './player';
import { ProjectileManager } from './projectiles';
import { EnemyManager } from './enemies';
import { AudioManager } from '../core/audio';
import { ParticleSystem } from '../core/particles';

export interface BossPart {
  id: number;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  defense: number;
  contactDamage: number;
  invulnerable?: boolean;
  role: string;
  parentIndex?: number;
  phase?: number;
  aiTimer?: number;
}

export interface BossInstance {
  type: string;
  title: string;
  subtitle: string;
  tier: number; // 1..14 progression order
  isHardmode: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  timer: number;
  subTimer: number;
  chargeCount: number;
  parts: BossPart[];
  // Sweeping deathray state for Moon Lord / Retinazer
  deathray: {
    active: boolean;
    originX: number;
    originY: number;
    angle: number;
    angularVel: number;
    timer: number;
    color: string;
  };
}

export interface BossCatalogEntry {
  id: string;
  name: string;
  tier: number;
  hardmode: boolean;
  summonItem: string;
  biomeHint: string;
  dropsSummary: string;
}

export const BOSS_CATALOG: BossCatalogEntry[] = [
  {
    id: 'king_slime',
    name: 'King Slime',
    tier: 1,
    hardmode: false,
    summonItem: 'slime_crown',
    biomeHint: 'Forest / Any Surface',
    dropsSummary: 'Gold Bars, Hermes Boots, Grappling Hook, Healing Potions'
  },
  {
    id: 'eye_of_cthulhu',
    name: 'Eye of Cthulhu',
    tier: 2,
    hardmode: false,
    summonItem: 'suspicious_looking_eye',
    biomeHint: 'Nighttime Surface',
    dropsSummary: 'Demonite Ore, Demonite Bars, Worm Food'
  },
  {
    id: 'eater_of_worlds',
    name: 'Eater of Worlds',
    tier: 3,
    hardmode: false,
    summonItem: 'worm_food',
    biomeHint: 'The Corruption',
    dropsSummary: 'Demonite Ore, Shadow Scales (Crafts Nightmare Pickaxe & Shadow Armor)'
  },
  {
    id: 'queen_bee',
    name: 'Queen Bee',
    tier: 4,
    hardmode: false,
    summonItem: 'abeemination',
    biomeHint: 'Jungle',
    dropsSummary: "The Bee's Knees Bow, Stingers, Jungle Spores"
  },
  {
    id: 'skeletron',
    name: 'Skeletron',
    tier: 5,
    hardmode: false,
    summonItem: 'old_mans_curse',
    biomeHint: 'Dungeon Entrance (West)',
    dropsSummary: 'Muramasa, Cobalt Shield, Water Bolt, Bones'
  },
  {
    id: 'wall_of_flesh',
    name: 'Wall of Flesh',
    tier: 6,
    hardmode: false,
    summonItem: 'guide_voodoo_doll',
    biomeHint: 'The Underworld (Unlocks Hardmode!)',
    dropsSummary: 'Pwnhammer, Cobalt Ore, Triggers Hardmode & Hallow!'
  },
  {
    id: 'the_twins',
    name: 'The Twins (Retinazer & Spazmatism)',
    tier: 7,
    hardmode: true,
    summonItem: 'mechanical_eye',
    biomeHint: 'Hardmode Night',
    dropsSummary: 'Hallowed Bars, Souls of Sight'
  },
  {
    id: 'the_destroyer',
    name: 'The Destroyer',
    tier: 8,
    hardmode: true,
    summonItem: 'mechanical_worm',
    biomeHint: 'Hardmode Night',
    dropsSummary: 'Hallowed Bars, Souls of Might (Crafts Megashark & Pickaxe Axe)'
  },
  {
    id: 'skeletron_prime',
    name: 'Skeletron Prime',
    tier: 9,
    hardmode: true,
    summonItem: 'mechanical_skull',
    biomeHint: 'Hardmode Night',
    dropsSummary: 'Hallowed Bars, Souls of Fright (Crafts Excalibur & Pickaxe Axe)'
  },
  {
    id: 'plantera',
    name: 'Plantera',
    tier: 10,
    hardmode: true,
    summonItem: 'plantera_seed',
    biomeHint: 'Underground Jungle (Break Plantera Bulb)',
    dropsSummary: 'Chlorophyte Bars, Lihzahrd Power Cell, Terra Blade Materials'
  },
  {
    id: 'golem',
    name: 'Golem',
    tier: 11,
    hardmode: true,
    summonItem: 'lihzahrd_power_cell',
    biomeHint: 'Jungle Lihzahrd Temple Altar',
    dropsSummary: 'Picksaw, Celestial Shell, Solar Fragments'
  },
  {
    id: 'duke_fishron',
    name: 'Duke Fishron',
    tier: 12,
    hardmode: true,
    summonItem: 'truffle_worm',
    biomeHint: 'Ocean Edges',
    dropsSummary: 'Tsunami Bow, Razorblade Typhoon'
  },
  {
    id: 'lunatic_cultist',
    name: 'Lunatic Cultist',
    tier: 13,
    hardmode: true,
    summonItem: 'cultist_medallion',
    biomeHint: 'Dungeon Entrance',
    dropsSummary: 'Ancient Manipulator, Solar Fragments, Celestial Sigil'
  },
  {
    id: 'moon_lord',
    name: 'Moon Lord',
    tier: 14,
    hardmode: true,
    summonItem: 'celestial_sigil',
    biomeHint: 'Endgame Celestial Event',
    dropsSummary: 'Meowmere, S.D.M.G., Last Prism, Luminite Bars'
  }
];

let nextPartId = 10000;

export class BossManager {
  activeBoss: BossInstance | null = null;

  // 14-Boss Rush Mode State
  bossRushActive = false;
  bossRushWave = 0; // 1..14
  bossRushCountdown = 0;
  bossRushTimer = 0;
  bossRushCompleted = false;

  startBossRush(
    player: Player,
    audio: AudioManager,
    onChat: (msg: string, color?: string) => void
  ): void {
    this.bossRushActive = true;
    this.bossRushCompleted = false;
    this.bossRushWave = 1;
    this.bossRushTimer = 0;
    this.bossRushCountdown = 0;
    player.mounted = true;
    player.hp = player.maxHp;
    player.mana = player.maxMana;
    player.potionCooldown = 0;
    onChat('=== 14-BOSS RUSH STARTED! Wave 1/14: King Slime ===', '#ffd747');
    this.summon(BOSS_CATALOG[0].id, player, audio, onChat);
  }

  advanceBossRushNow(
    player: Player,
    audio: AudioManager,
    onChat: (msg: string, color?: string) => void
  ): void {
    if (!this.bossRushActive) {
      this.startBossRush(player, audio, onChat);
      return;
    }
    if (this.activeBoss) {
      this.bossRushWave = Math.min(14, this.bossRushWave + 1);
    }
    this.bossRushCountdown = 0;
    const entry = BOSS_CATALOG[this.bossRushWave - 1];
    if (entry) {
      player.hp = player.maxHp;
      player.mana = player.maxMana;
      player.potionCooldown = 0;
      const upg = player.upgradeForBossRushWave(this.bossRushWave);
      if (upg) onChat(upg, '#05c8ff');
      onChat(`=== BOSS RUSH WAVE ${this.bossRushWave}/14: ${entry.name} ===`, '#ffd747');
      this.summon(entry.id, player, audio, onChat);
    }
  }

  summon(
    type: string,
    player: Player,
    audio: AudioManager,
    onChat: (msg: string, color?: string) => void,
    spawnX?: number,
    spawnY?: number
  ): void {
    const sx = spawnX ?? player.x + (player.facing * 260 || 260);
    const sy = spawnY ?? player.y - 160;

    const boss: BossInstance = {
      type,
      title: 'Boss',
      subtitle: '',
      tier: 1,
      isHardmode: false,
      x: sx,
      y: sy,
      vx: 0,
      vy: 0,
      phase: 1,
      timer: 0,
      subTimer: 0,
      chargeCount: 0,
      parts: [],
      deathray: {
        active: false,
        originX: 0,
        originY: 0,
        angle: 0,
        angularVel: 0,
        timer: 0,
        color: '#3be8d1'
      }
    };

    switch (type) {
      case 'king_slime': {
        boss.title = 'King Slime';
        boss.subtitle = 'Lord of All Slimes';
        boss.tier = 1;
        boss.parts.push({
          id: nextPartId++,
          name: 'King Slime',
          x: sx,
          y: sy,
          vx: 0,
          vy: 0,
          radius: 42,
          hp: 1600,
          maxHp: 1600,
          defense: 8,
          contactDamage: 28,
          role: 'body'
        });
        break;
      }
      case 'eye_of_cthulhu': {
        boss.title = 'Eye of Cthulhu';
        boss.subtitle = 'The Suspicious Watcher';
        boss.tier = 2;
        boss.parts.push({
          id: nextPartId++,
          name: 'Eye of Cthulhu',
          x: sx,
          y: sy,
          vx: 0,
          vy: 0,
          radius: 34,
          hp: 2400,
          maxHp: 2400,
          defense: 10,
          contactDamage: 24,
          role: 'body'
        });
        break;
      }
      case 'eater_of_worlds': {
        boss.title = 'Eater of Worlds';
        boss.subtitle = 'Scourge of the Corruption';
        boss.tier = 3;
        const segCount = 18;
        for (let i = 0; i < segCount; i++) {
          boss.parts.push({
            id: nextPartId++,
            name: i === 0 ? 'Eater Head' : i === segCount - 1 ? 'Eater Tail' : 'Eater Body',
            x: sx - i * 22,
            y: sy + i * 6,
            vx: 0,
            vy: 0,
            radius: 15,
            hp: 260,
            maxHp: 260,
            defense: i === 0 ? 4 : 8,
            contactDamage: i === 0 ? 32 : 18,
            role: i === 0 ? 'head' : i === segCount - 1 ? 'tail' : 'segment',
            parentIndex: i === 0 ? -1 : i - 1
          });
        }
        break;
      }
      case 'queen_bee': {
        boss.title = 'Queen Bee';
        boss.subtitle = 'Matriarch of the Jungle Hive';
        boss.tier = 4;
        boss.parts.push({
          id: nextPartId++,
          name: 'Queen Bee',
          x: sx,
          y: sy,
          vx: 0,
          vy: 0,
          radius: 36,
          hp: 3200,
          maxHp: 3200,
          defense: 12,
          contactDamage: 32,
          role: 'body'
        });
        break;
      }
      case 'skeletron': {
        boss.title = 'Skeletron';
        boss.subtitle = 'Cursed Guardian of the Dungeon';
        boss.tier = 5;
        boss.parts.push(
          {
            id: nextPartId++,
            name: 'Skeletron Head',
            x: sx,
            y: sy,
            vx: 0,
            vy: 0,
            radius: 32,
            hp: 4200,
            maxHp: 4200,
            defense: 12,
            contactDamage: 36,
            role: 'head'
          },
          {
            id: nextPartId++,
            name: 'Skeletron Left Hand',
            x: sx - 75,
            y: sy + 30,
            vx: 0,
            vy: 0,
            radius: 18,
            hp: 900,
            maxHp: 900,
            defense: 12,
            contactDamage: 28,
            role: 'left_hand',
            aiTimer: 0
          },
          {
            id: nextPartId++,
            name: 'Skeletron Right Hand',
            x: sx + 75,
            y: sy + 30,
            vx: 0,
            vy: 0,
            radius: 18,
            hp: 900,
            maxHp: 900,
            defense: 12,
            contactDamage: 28,
            role: 'right_hand',
            aiTimer: 1.2
          }
        );
        break;
      }
      case 'wall_of_flesh': {
        boss.title = 'Wall of Flesh';
        boss.subtitle = 'Master and Core of the World';
        boss.tier = 6;
        const wallX = player.x - 320;
        const wallY = player.y;
        boss.x = wallX;
        boss.y = wallY;
        boss.parts.push(
          {
            id: nextPartId++,
            name: 'Wall of Flesh Mouth',
            x: wallX,
            y: wallY,
            vx: 0,
            vy: 0,
            radius: 30,
            hp: 7500,
            maxHp: 7500,
            defense: 14,
            contactDamage: 48,
            role: 'mouth'
          },
          {
            id: nextPartId++,
            name: 'Wall of Flesh Top Eye',
            x: wallX,
            y: wallY - 85,
            vx: 0,
            vy: 0,
            radius: 24,
            hp: 7500,
            maxHp: 7500,
            defense: 8,
            contactDamage: 42,
            role: 'top_eye'
          },
          {
            id: nextPartId++,
            name: 'Wall of Flesh Bottom Eye',
            x: wallX,
            y: wallY + 85,
            vx: 0,
            vy: 0,
            radius: 24,
            hp: 7500,
            maxHp: 7500,
            defense: 8,
            contactDamage: 42,
            role: 'bottom_eye'
          }
        );
        // Add 3 attached "The Hungry"
        for (let h = -1; h <= 1; h++) {
          boss.parts.push({
            id: nextPartId++,
            name: 'The Hungry',
            x: wallX + 90,
            y: wallY + h * 55,
            vx: 0,
            vy: 0,
            radius: 15,
            hp: 450,
            maxHp: 450,
            defense: 10,
            contactDamage: 34,
            role: 'hungry',
            aiTimer: h * 1.1
          });
        }
        break;
      }
      case 'the_twins': {
        boss.title = 'The Twins';
        boss.subtitle = 'Retinazer & Spazmatism';
        boss.tier = 7;
        boss.isHardmode = true;
        boss.parts.push(
          {
            id: nextPartId++,
            name: 'Retinazer',
            x: sx - 90,
            y: sy - 40,
            vx: 0,
            vy: 0,
            radius: 32,
            hp: 9500,
            maxHp: 9500,
            defense: 16,
            contactDamage: 45,
            role: 'retinazer',
            phase: 1,
            aiTimer: 0
          },
          {
            id: nextPartId++,
            name: 'Spazmatism',
            x: sx + 90,
            y: sy + 40,
            vx: 0,
            vy: 0,
            radius: 32,
            hp: 10500,
            maxHp: 10500,
            defense: 18,
            contactDamage: 54,
            role: 'spazmatism',
            phase: 1,
            aiTimer: 0
          }
        );
        break;
      }
      case 'the_destroyer': {
        boss.title = 'The Destroyer';
        boss.subtitle = 'Mechanical Spine of Cthulhu';
        boss.tier = 8;
        boss.isHardmode = true;
        const segs = 26;
        for (let i = 0; i < segs; i++) {
          boss.parts.push({
            id: nextPartId++,
            name: 'The Destroyer',
            x: sx - i * 24,
            y: sy + i * 8,
            vx: 0,
            vy: 0,
            radius: 19,
            hp: 18000, // Shared pool updated on hit
            maxHp: 18000,
            defense: i === 0 ? 8 : 22,
            contactDamage: i === 0 ? 68 : 44,
            role: i === 0 ? 'head' : i === segs - 1 ? 'tail' : 'segment',
            parentIndex: i - 1
          });
        }
        break;
      }
      case 'skeletron_prime': {
        boss.title = 'Skeletron Prime';
        boss.subtitle = 'Mechanical Terror of the Night';
        boss.tier = 9;
        boss.isHardmode = true;
        boss.parts.push(
          {
            id: nextPartId++,
            name: 'Skeletron Prime',
            x: sx,
            y: sy,
            vx: 0,
            vy: 0,
            radius: 34,
            hp: 15000,
            maxHp: 15000,
            defense: 22,
            contactDamage: 58,
            role: 'head'
          },
          {
            id: nextPartId++,
            name: 'Prime Laser',
            x: sx - 85,
            y: sy - 35,
            vx: 0,
            vy: 0,
            radius: 17,
            hp: 3200,
            maxHp: 3200,
            defense: 18,
            contactDamage: 42,
            role: 'prime_laser',
            aiTimer: 0
          },
          {
            id: nextPartId++,
            name: 'Prime Cannon',
            x: sx + 85,
            y: sy - 35,
            vx: 0,
            vy: 0,
            radius: 17,
            hp: 3200,
            maxHp: 3200,
            defense: 18,
            contactDamage: 42,
            role: 'prime_cannon',
            aiTimer: 0.7
          },
          {
            id: nextPartId++,
            name: 'Prime Saw',
            x: sx - 75,
            y: sy + 55,
            vx: 0,
            vy: 0,
            radius: 18,
            hp: 4000,
            maxHp: 4000,
            defense: 20,
            contactDamage: 56,
            role: 'prime_saw',
            aiTimer: 0.3
          },
          {
            id: nextPartId++,
            name: 'Prime Vice',
            x: sx + 75,
            y: sy + 55,
            vx: 0,
            vy: 0,
            radius: 18,
            hp: 4000,
            maxHp: 4000,
            defense: 20,
            contactDamage: 54,
            role: 'prime_vice',
            aiTimer: 1.1
          }
        );
        break;
      }
      case 'plantera': {
        boss.title = 'Plantera';
        boss.subtitle = 'Awakened Guardian of the Jungle';
        boss.tier = 10;
        boss.isHardmode = true;
        boss.parts.push({
          id: nextPartId++,
          name: 'Plantera',
          x: sx,
          y: sy,
          vx: 0,
          vy: 0,
          radius: 36,
          hp: 22000,
          maxHp: 22000,
          defense: 24,
          contactDamage: 62,
          role: 'body'
        });
        break;
      }
      case 'golem': {
        boss.title = 'Golem';
        boss.subtitle = 'Ancient Idol of the Lihzahrd Clan';
        boss.tier = 11;
        boss.isHardmode = true;
        boss.parts.push(
          {
            id: nextPartId++,
            name: 'Golem Body',
            x: sx,
            y: sy,
            vx: 0,
            vy: 0,
            radius: 36,
            hp: 26000,
            maxHp: 26000,
            defense: 26,
            contactDamage: 66,
            role: 'body'
          },
          {
            id: nextPartId++,
            name: 'Golem Head',
            x: sx,
            y: sy - 42,
            vx: 0,
            vy: 0,
            radius: 26,
            hp: 10000,
            maxHp: 10000,
            defense: 20,
            contactDamage: 56,
            role: 'head',
            aiTimer: 0
          },
          {
            id: nextPartId++,
            name: 'Golem Left Fist',
            x: sx - 55,
            y: sy,
            vx: 0,
            vy: 0,
            radius: 18,
            hp: 5000,
            maxHp: 5000,
            defense: 22,
            contactDamage: 58,
            role: 'left_fist',
            aiTimer: 0
          },
          {
            id: nextPartId++,
            name: 'Golem Right Fist',
            x: sx + 55,
            y: sy,
            vx: 0,
            vy: 0,
            radius: 18,
            hp: 5000,
            maxHp: 5000,
            defense: 22,
            contactDamage: 58,
            role: 'right_fist',
            aiTimer: 0.9
          }
        );
        break;
      }
      case 'duke_fishron': {
        boss.title = 'Duke Fishron';
        boss.subtitle = 'Mutant Terror of the Sea';
        boss.tier = 12;
        boss.isHardmode = true;
        boss.parts.push({
          id: nextPartId++,
          name: 'Duke Fishron',
          x: sx,
          y: sy,
          vx: 0,
          vy: 0,
          radius: 36,
          hp: 32000,
          maxHp: 32000,
          defense: 28,
          contactDamage: 76,
          role: 'body'
        });
        break;
      }
      case 'lunatic_cultist': {
        boss.title = 'Lunatic Cultist';
        boss.subtitle = 'Herald of the Celestial Pillars';
        boss.tier = 13;
        boss.isHardmode = true;
        boss.parts.push({
          id: nextPartId++,
          name: 'Lunatic Cultist',
          x: sx,
          y: sy,
          vx: 0,
          vy: 0,
          radius: 22,
          hp: 28000,
          maxHp: 28000,
          defense: 26,
          contactDamage: 60,
          role: 'body'
        });
        break;
      }
      case 'moon_lord': {
        boss.title = 'Moon Lord';
        boss.subtitle = 'Lord of the Cosmos';
        boss.tier = 14;
        boss.isHardmode = true;
        boss.parts.push(
          {
            id: nextPartId++,
            name: 'True Eye of Cthulhu (Left Hand)',
            x: sx - 135,
            y: sy + 20,
            vx: 0,
            vy: 0,
            radius: 26,
            hp: 14000,
            maxHp: 14000,
            defense: 28,
            contactDamage: 68,
            role: 'left_hand',
            aiTimer: 0
          },
          {
            id: nextPartId++,
            name: 'True Eye of Cthulhu (Right Hand)',
            x: sx + 135,
            y: sy + 20,
            vx: 0,
            vy: 0,
            radius: 26,
            hp: 14000,
            maxHp: 14000,
            defense: 28,
            contactDamage: 68,
            role: 'right_hand',
            aiTimer: 1.2
          },
          {
            id: nextPartId++,
            name: 'Moon Lord Head Eye',
            x: sx,
            y: sy - 95,
            vx: 0,
            vy: 0,
            radius: 28,
            hp: 18000,
            maxHp: 18000,
            defense: 30,
            contactDamage: 74,
            role: 'head_eye',
            aiTimer: 0
          },
          {
            id: nextPartId++,
            name: "Moon Lord's Core",
            x: sx,
            y: sy + 35,
            vx: 0,
            vy: 0,
            radius: 34,
            hp: 32000,
            maxHp: 32000,
            defense: 32,
            contactDamage: 75,
            invulnerable: true, // Opens once hands & head are defeated!
            role: 'core'
          }
        );
        break;
      }
    }

    this.activeBoss = boss;
    audio.play('roar');
    onChat(`${boss.title} has awoken!`, '#af4bff');
  }

  getBossHealthSummary(): { name: string; hp: number; maxHp: number; phase: number } | null {
    const b = this.activeBoss;
    if (!b) return null;

    if (b.type === 'wall_of_flesh' || b.type === 'the_destroyer') {
      const main = b.parts[0];
      return {
        name: b.title,
        hp: Math.max(0, main?.hp || 0),
        maxHp: main?.maxHp || 1,
        phase: b.phase
      };
    }

    if (b.type === 'skeletron' || b.type === 'skeletron_prime') {
      const head = b.parts.find((p) => p.role === 'head') || b.parts[0];
      return {
        name: b.title,
        hp: Math.max(0, head?.hp || 0),
        maxHp: head?.maxHp || 1,
        phase: b.phase
      };
    }

    let totalHp = 0;
    let totalMax = 0;
    for (const p of b.parts) {
      totalHp += Math.max(0, p.hp);
      totalMax += p.maxHp;
    }
    return {
      name: b.title,
      hp: totalHp,
      maxHp: Math.max(1, totalMax),
      phase: b.phase
    };
  }

  update(
    dt: number,
    world: World,
    player: Player,
    projectiles: ProjectileManager,
    enemies: EnemyManager,
    audio: AudioManager,
    particles: ParticleSystem,
    onChat: (msg: string, color?: string) => void
  ): void {
    if (this.bossRushActive && !this.bossRushCompleted) {
      this.bossRushTimer += dt;
      if (!this.activeBoss && !player.dead && this.bossRushCountdown > 0) {
        this.bossRushCountdown -= dt;
        if (this.bossRushCountdown <= 0) {
          const entry = BOSS_CATALOG[this.bossRushWave - 1];
          if (entry) {
            onChat(`=== BOSS RUSH WAVE ${this.bossRushWave}/14: ${entry.name} ===`, '#ffd747');
            this.summon(entry.id, player, audio, onChat);
          }
        }
      }
    }

    const b = this.activeBoss;
    if (!b) return;

    if (player.dead) {
      // Boss despawns if player dies; in Boss Rush, queue same wave after respawn!
      this.activeBoss = null;
      if (this.bossRushActive) {
        this.bossRushCountdown = 2.0;
        onChat(`Wave ${this.bossRushWave} will restart as soon as you respawn!`, '#ff9696');
      }
      return;
    }

    b.timer += dt;
    b.subTimer += dt;

    // Update AI per boss type
    switch (b.type) {
      case 'king_slime':
        this.updateKingSlime(b, dt, world, player, enemies, audio, particles);
        break;
      case 'eye_of_cthulhu':
        this.updateEyeOfCthulhu(b, dt, player, enemies, audio, particles);
        break;
      case 'eater_of_worlds':
        this.updateEaterOfWorlds(b, dt, player);
        break;
      case 'queen_bee':
        this.updateQueenBee(b, dt, player, projectiles, enemies, audio);
        break;
      case 'skeletron':
        this.updateSkeletron(b, dt, player, audio);
        break;
      case 'wall_of_flesh':
        this.updateWallOfFlesh(b, dt, player, projectiles);
        break;
      case 'the_twins':
        this.updateTheTwins(b, dt, player, projectiles, audio);
        break;
      case 'the_destroyer':
        this.updateTheDestroyer(b, dt, player, projectiles);
        break;
      case 'skeletron_prime':
        this.updateSkeletronPrime(b, dt, player, projectiles, audio);
        break;
      case 'plantera':
        this.updatePlantera(b, dt, player, projectiles, audio);
        break;
      case 'golem':
        this.updateGolem(b, dt, world, player, projectiles, audio);
        break;
      case 'duke_fishron':
        this.updateDukeFishron(b, dt, player, projectiles, audio, particles);
        break;
      case 'lunatic_cultist':
        this.updateLunaticCultist(b, dt, player, projectiles, audio, particles);
        break;
      case 'moon_lord':
        this.updateMoonLord(b, dt, player, projectiles, audio);
        break;
    }

    // Sweeping Deathray collision
    if (b.deathray.active) {
      b.deathray.timer -= dt;
      b.deathray.angle += b.deathray.angularVel * dt;
      if (b.deathray.timer <= 0) {
        b.deathray.active = false;
      } else {
        // Line-circle distance from origin along ray to player
        const rayLen = 900;
        const rx = Math.cos(b.deathray.angle);
        const ry = Math.sin(b.deathray.angle);
        const dx = player.x - b.deathray.originX;
        const dy = player.y - b.deathray.originY;
        const proj = clamp(dx * rx + dy * ry, 0, rayLen);
        const closestX = b.deathray.originX + rx * proj;
        const closestY = b.deathray.originY + ry * proj;
        if (dist(player.x, player.y, closestX, closestY) < 22) {
          player.takeDamage(95, Math.sign(dx) || 1, audio, particles, world);
        }
      }
    }

    // Combat Collisions against Boss Parts
    const meleeBox = player.getMeleeHitbox();
    const held = player.getHeldItem();
    const meleeDmg = Math.round((held?.damage || 10) * player.getDamageMultiplier());

    for (let i = b.parts.length - 1; i >= 0; i--) {
      const part = b.parts[i];
      if (part.hp <= 0) continue;

      const partRect: Rect = {
        x: part.x - part.radius,
        y: part.y - part.radius,
        w: part.radius * 2,
        h: part.radius * 2
      };

      // Player Melee Hit
      if (
        !part.invulnerable &&
        meleeBox &&
        !player.swingHitIds.has(part.id) &&
        rectOverlap(meleeBox, partRect)
      ) {
        player.swingHitIds.add(part.id);
        this.damagePart(b, part, meleeDmg, world, audio, particles, projectiles);
      }

      // Friendly Projectiles Hit
      if (!part.invulnerable) {
        for (let j = projectiles.projectiles.length - 1; j >= 0; j--) {
          const p = projectiles.projectiles[j];
          if (!p.friendly || p.hitIds.has(part.id)) continue;
          if (dist(p.x, p.y, part.x, part.y) <= p.radius + part.radius) {
            p.hitIds.add(part.id);
            p.pierce--;
            this.damagePart(b, part, p.damage, world, audio, particles, projectiles);
            if (p.type === 'holy_arrow') {
              projectiles.spawn({
                x: part.x + (Math.random() - 0.5) * 90,
                y: part.y - 260,
                vx: 0,
                vy: 560,
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
      }

      // Boss Part Contact Damage to Player
      if (rectOverlap(partRect, player.getBounds())) {
        player.takeDamage(
          part.contactDamage,
          Math.sign(player.x - part.x) || 1,
          audio,
          particles,
          world
        );
      }
    }

    // Check Boss Defeat Conditions
    this.checkBossCompletion(b, world, player, audio, particles, onChat);
  }

  private damagePart(
    b: BossInstance,
    part: BossPart,
    rawDmg: number,
    world: World,
    audio: AudioManager,
    particles: ParticleSystem,
    projectiles: ProjectileManager
  ): void {
    const crit = Math.random() < 0.14;
    const base = Math.max(1, Math.round(rawDmg - part.defense * 0.5));
    const dmg = crit ? base * 2 : base;

    if (b.type === 'wall_of_flesh' && part.role !== 'hungry') {
      // Shared HP between Mouth and Eyes
      for (const p of b.parts) {
        if (p.role !== 'hungry') p.hp -= dmg;
      }
    } else if (b.type === 'the_destroyer') {
      for (const p of b.parts) {
        p.hp -= dmg;
      }
    } else {
      part.hp -= dmg;
    }

    particles.addText(
      part.x,
      part.y - part.radius,
      `${dmg}${crit ? '!' : ''}`,
      crit ? '#ff7b24' : '#ffeb57',
      crit ? 1.3 : 1.05
    );
    particles.spawn(part.x, part.y, '#ff425b', 5, 85, 3);
    audio.play('hit');

    // Eater of Worlds Segment Split!
    if (b.type === 'eater_of_worlds' && part.hp <= 0) {
      world.spawnDrop(part.x, part.y, 'demonite_ore', 3);
      world.spawnDrop(part.x, part.y, 'shadow_scale', 2);
      const idx = b.parts.indexOf(part);
      if (idx >= 0) {
        // Any child pointing to idx becomes a new independent head!
        for (let k = 0; k < b.parts.length; k++) {
          if (b.parts[k].parentIndex === idx) {
            b.parts[k].parentIndex = -1;
            b.parts[k].role = 'head';
          }
        }
      }
    }

    void projectiles;
  }

  private checkBossCompletion(
    b: BossInstance,
    world: World,
    player: Player,
    audio: AudioManager,
    particles: ParticleSystem,
    onChat: (msg: string, color?: string) => void
  ): void {
    let defeated = false;
    if (b.type === 'skeletron' || b.type === 'skeletron_prime') {
      const head = b.parts.find((p) => p.role === 'head');
      defeated = !head || head.hp <= 0;
    } else if (b.type === 'wall_of_flesh') {
      const mouth = b.parts.find((p) => p.role === 'mouth');
      defeated = !mouth || mouth.hp <= 0;
    } else if (b.type === 'golem') {
      const body = b.parts.find((p) => p.role === 'body');
      defeated = !body || body.hp <= 0;
    } else if (b.type === 'moon_lord') {
      const core = b.parts.find((p) => p.role === 'core');
      defeated = !core || core.hp <= 0;
    } else {
      defeated = b.parts.every((p) => p.hp <= 0);
    }

    if (!defeated) return;

    const dropX = b.parts[0]?.x || player.x;
    const dropY = b.parts[0]?.y || player.y;

    audio.play('explosion');
    particles.spawn(dropX, dropY, '#ffdd44', 45, 220, 4.5, 180, true);
    world.defeatedBosses.add(b.type);
    onChat(`${b.title} has been defeated!`, '#66ff8c');
    player.coins += b.tier * 2500;

    // Boss-specific Loot Drops!
    switch (b.type) {
      case 'king_slime':
        world.spawnDrop(dropX, dropY, 'gold_bar', 12);
        world.spawnDrop(dropX, dropY, 'healing_potion', 8);
        world.spawnDrop(dropX, dropY, 'hermes_boots', 1);
        world.spawnDrop(dropX, dropY, 'grappling_hook', 1);
        break;
      case 'eye_of_cthulhu':
        world.spawnDrop(dropX, dropY, 'demonite_ore', 45);
        world.spawnDrop(dropX, dropY, 'demonite_bar', 12);
        world.spawnDrop(dropX, dropY, 'healing_potion', 10);
        world.spawnDrop(dropX, dropY, 'worm_food', 1);
        break;
      case 'eater_of_worlds':
        world.spawnDrop(dropX, dropY, 'demonite_bar', 18);
        world.spawnDrop(dropX, dropY, 'shadow_scale', 25);
        world.spawnDrop(dropX, dropY, 'healing_potion', 12);
        break;
      case 'queen_bee':
        world.spawnDrop(dropX, dropY, 'bees_knees', 1);
        world.spawnDrop(dropX, dropY, 'jungle_spores', 15);
        world.spawnDrop(dropX, dropY, 'stinger', 15);
        world.spawnDrop(dropX, dropY, 'healing_potion', 12);
        break;
      case 'skeletron':
        world.spawnDrop(dropX, dropY, 'muramasa', 1);
        world.spawnDrop(dropX, dropY, 'cobalt_shield', 1);
        world.spawnDrop(dropX, dropY, 'water_bolt', 1);
        world.spawnDrop(dropX, dropY, 'bone', 35);
        break;
      case 'wall_of_flesh': {
        world.spawnDrop(dropX, dropY, 'pwnhammer', 1);
        world.spawnDrop(dropX, dropY, 'greater_healing_potion', 12);
        world.spawnDrop(dropX, dropY, 'cobalt_bar', 15);
        const msgs = world.triggerHardmode();
        for (const m of msgs) {
          onChat(m, '#ff96ff');
        }
        break;
      }
      case 'the_twins':
        world.spawnDrop(dropX, dropY, 'hallowed_bar', 24);
        world.spawnDrop(dropX, dropY, 'soul_of_sight', 22);
        world.spawnDrop(dropX, dropY, 'greater_healing_potion', 12);
        break;
      case 'the_destroyer':
        world.spawnDrop(dropX, dropY, 'hallowed_bar', 28);
        world.spawnDrop(dropX, dropY, 'soul_of_might', 25);
        world.spawnDrop(dropX, dropY, 'greater_healing_potion', 12);
        break;
      case 'skeletron_prime':
        world.spawnDrop(dropX, dropY, 'hallowed_bar', 28);
        world.spawnDrop(dropX, dropY, 'soul_of_fright', 25);
        world.spawnDrop(dropX, dropY, 'greater_healing_potion', 12);
        break;
      case 'plantera':
        world.spawnDrop(dropX, dropY, 'chlorophyte_bar', 25);
        world.spawnDrop(dropX, dropY, 'lihzahrd_power_cell', 2);
        world.spawnDrop(dropX, dropY, 'greater_healing_potion', 15);
        break;
      case 'golem':
        world.spawnDrop(dropX, dropY, 'picksaw', 1);
        world.spawnDrop(dropX, dropY, 'celestial_shell', 1);
        world.spawnDrop(dropX, dropY, 'solar_fragment', 15);
        world.spawnDrop(dropX, dropY, 'super_healing_potion', 12);
        break;
      case 'duke_fishron':
        world.spawnDrop(dropX, dropY, 'tsunami', 1);
        world.spawnDrop(dropX, dropY, 'razorblade_typhoon', 1);
        world.spawnDrop(dropX, dropY, 'super_healing_potion', 15);
        break;
      case 'lunatic_cultist':
        world.spawnDrop(dropX, dropY, 'ancient_manipulator', 1);
        world.spawnDrop(dropX, dropY, 'solar_fragment', 30);
        world.spawnDrop(dropX, dropY, 'celestial_sigil', 1);
        break;
      case 'moon_lord':
        world.spawnDrop(dropX, dropY, 'meowmere', 1);
        world.spawnDrop(dropX, dropY, 'sdmg', 1);
        world.spawnDrop(dropX, dropY, 'last_prism', 1);
        world.spawnDrop(dropX, dropY, 'luminite_bar', 45);
        world.spawnDrop(dropX, dropY, 'solar_fragment', 45);
        world.spawnDrop(dropX, dropY, 'super_healing_potion', 25);
        onChat('Victory! You have conquered the Moon Lord, Master of the Cosmos!', '#05c8ff');
        break;
    }

    this.activeBoss = null;

    if (this.bossRushActive) {
      player.hp = player.maxHp;
      player.mana = player.maxMana;
      player.potionCooldown = 0;

      if (this.bossRushWave < 14) {
        this.bossRushWave++;
        this.bossRushCountdown = 3.5;
        const upg = player.upgradeForBossRushWave(this.bossRushWave);
        if (upg) {
          onChat(upg, '#05c8ff');
        }
        const nextEntry = BOSS_CATALOG[this.bossRushWave - 1];
        onChat(
          `Full HP/Mana Restored! Next Up in 3.5s -> Wave ${this.bossRushWave}/14: ${nextEntry?.name}!`,
          '#ffd747'
        );
      } else {
        this.bossRushCompleted = true;
        this.bossRushActive = false;
        const mins = Math.floor(this.bossRushTimer / 60);
        const secs = (this.bossRushTimer % 60).toFixed(1);
        onChat(
          `CHAMPION! All 14 Bosses Conquered! Final Boss Rush Time: ${mins}m ${secs}s!`,
          '#05c8ff'
        );
      }
    }
  }

  // =========================================================
  // INDIVIDUAL BOSS AI BEHAVIORS
  // =========================================================

  private updateKingSlime(
    b: BossInstance,
    dt: number,
    world: World,
    player: Player,
    enemies: EnemyManager,
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    const p = b.parts[0];
    if (!p) return;

    const hpRatio = clamp(p.hp / p.maxHp, 0.35, 1);
    p.radius = Math.round(24 + hpRatio * 22);

    p.vy = Math.min(480, p.vy + 780 * dt);
    const footTy = Math.floor((p.y + p.radius) / 16);
    const tx = Math.floor(p.x / 16);
    const grounded = p.vy >= 0 && world.isSolid(tx, footTy);

    if (grounded) {
      p.y = footTy * 16 - p.radius;
      p.vy = 0;
      p.vx *= 0.8;

      if (b.subTimer >= 1.15) {
        b.subTimer = 0;
        b.chargeCount++;
        const dir = Math.sign(player.x - p.x) || 1;
        if (b.chargeCount % 4 === 0) {
          // Mega slam jump
          p.vy = -490;
          p.vx = dir * 240;
          audio.play('roar');
        } else {
          p.vy = -340;
          p.vx = dir * 185;
          audio.play('jump');
        }

        if (enemies.enemies.length < 6 && Math.random() < 0.45) {
          enemies.spawnEnemy('blue_slime', p.x, p.y);
        }
      }
    }

    // Teleport if too far or every 9 seconds
    if (b.timer > 8.5 || dist(p.x, p.y, player.x, player.y) > 650) {
      b.timer = 0;
      particles.spawn(p.x, p.y, '#2b82ff', 22, 160, 4);
      p.x = player.x + (Math.random() < 0.5 ? -140 : 140);
      p.y = player.y - 160;
      p.vy = 0;
      particles.spawn(p.x, p.y, '#2b82ff', 22, 160, 4);
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  private updateEyeOfCthulhu(
    b: BossInstance,
    dt: number,
    player: Player,
    enemies: EnemyManager,
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    const p = b.parts[0];
    if (!p) return;

    if (b.phase === 1 && p.hp <= p.maxHp * 0.5) {
      b.phase = 2;
      b.subTimer = 0;
      p.defense = 4;
      p.contactDamage = 34;
      audio.play('roar');
      particles.spawn(p.x, p.y, '#d92b3a', 30, 180, 4);
    }

    const cycle = b.phase === 1 ? 5.5 : 3.8;
    const t = b.subTimer % cycle;

    if (t < cycle * 0.52) {
      // Hover above player
      const tx = player.x + Math.cos(b.timer * 2) * 140;
      const ty = player.y - 150 + Math.sin(b.timer * 3) * 35;
      p.vx += ((tx - p.x) * 3.5 - p.vx) * dt * 4;
      p.vy += ((ty - p.y) * 3.5 - p.vy) * dt * 4;

      if (b.phase === 1 && Math.random() < dt * 0.6 && enemies.enemies.length < 5) {
        enemies.spawnEnemy('demon_eye', p.x, p.y);
      }
    } else {
      // Chain charges!
      const chargeInterval = b.phase === 1 ? 0.85 : 0.52;
      if (Math.floor((b.subTimer - dt) / chargeInterval) !== Math.floor(b.subTimer / chargeInterval)) {
        const angle = Math.atan2(player.y - p.y, player.x - p.x);
        const spd = b.phase === 1 ? 370 : 490;
        p.vx = Math.cos(angle) * spd;
        p.vy = Math.sin(angle) * spd;
        if (b.phase === 2) audio.play('roar');
      }
      p.vx *= 0.985;
      p.vy *= 0.985;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  private updateEaterOfWorlds(b: BossInstance, dt: number, player: Player): void {
    const segDist = 22;
    for (let i = 0; i < b.parts.length; i++) {
      const seg = b.parts[i];
      if (seg.hp <= 0) continue;

      if (seg.parentIndex === undefined || seg.parentIndex < 0 || b.parts[seg.parentIndex]?.hp <= 0) {
        // Head steering toward player in sine wave arcs
        const desiredAngle =
          Math.atan2(player.y - seg.y, player.x - seg.x) + Math.sin(b.timer * 3 + i) * 0.35;
        const spd = 235;
        seg.vx += (Math.cos(desiredAngle) * spd - seg.vx) * Math.min(1, dt * 3.2);
        seg.vy += (Math.sin(desiredAngle) * spd - seg.vy) * Math.min(1, dt * 3.2);
        seg.x += seg.vx * dt;
        seg.y += seg.vy * dt;
      } else {
        // Follow parent segment
        const parent = b.parts[seg.parentIndex];
        const dx = parent.x - seg.x;
        const dy = parent.y - seg.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > segDist) {
          seg.x = parent.x - (dx / d) * segDist;
          seg.y = parent.y - (dy / d) * segDist;
        }
      }
    }
  }

  private updateQueenBee(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    enemies: EnemyManager,
    audio: AudioManager
  ): void {
    const p = b.parts[0];
    if (!p) return;

    const cycle = 7.0;
    const t = b.subTimer % cycle;

    if (t < 3.4) {
      // Horizontal dash charges aligned with player Y
      const interval = 0.85;
      if (Math.floor((b.subTimer - dt) / interval) !== Math.floor(b.subTimer / interval)) {
        const dir = player.x >= p.x ? 1 : -1;
        p.y = player.y + (Math.random() - 0.5) * 24;
        p.vx = dir * 480;
        p.vy = 0;
        audio.play('swing');
      }
      p.vx *= 0.985;
    } else {
      // Hover above and rain stingers
      const tx = player.x + Math.sin(b.timer * 3.2) * 150;
      const ty = player.y - 145;
      p.vx += ((tx - p.x) * 4 - p.vx) * dt * 5;
      p.vy += ((ty - p.y) * 4 - p.vy) * dt * 5;

      const shootInt = 0.5;
      if (Math.floor((b.subTimer - dt) / shootInt) !== Math.floor(b.subTimer / shootInt)) {
        const angle = Math.atan2(player.y - p.y, player.x - p.x);
        projectiles.spawn({
          x: p.x,
          y: p.y,
          vx: Math.cos(angle) * 340,
          vy: Math.sin(angle) * 340,
          type: 'stinger',
          damage: 24,
          friendly: false
        });
        if (enemies.enemies.length < 4 && Math.random() < 0.3) {
          enemies.spawnEnemy('hornet', p.x, p.y);
        }
      }
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  private updateSkeletron(b: BossInstance, dt: number, player: Player, audio: AudioManager): void {
    const head = b.parts.find((p) => p.role === 'head');
    if (!head) return;

    const cycle = 7.5;
    const t = b.subTimer % cycle;
    const spinning = t > 4.5;
    b.phase = spinning ? 2 : 1;

    if (!spinning) {
      const tx = player.x + Math.sin(b.timer * 1.8) * 60;
      const ty = player.y - 140;
      head.vx += ((tx - head.x) * 3.5 - head.vx) * dt * 4;
      head.vy += ((ty - head.y) * 3.5 - head.vy) * dt * 4;
    } else {
      if (Math.floor((b.subTimer - dt) / cycle) !== Math.floor(b.subTimer / cycle)) {
        audio.play('roar');
      }
      const angle = Math.atan2(player.y - head.y, player.x - head.x);
      head.vx = Math.cos(angle) * 245;
      head.vy = Math.sin(angle) * 245;
    }

    head.x += head.vx * dt;
    head.y += head.vy * dt;

    // Hands swipe at player
    for (const part of b.parts) {
      if (part.role === 'left_hand' || part.role === 'right_hand') {
        if (part.hp <= 0) continue;
        part.aiTimer = (part.aiTimer || 0) + dt;
        const side = part.role === 'left_hand' ? -1 : 1;
        const swipe = Math.sin(part.aiTimer * 3.2) > 0.65;
        const tx = swipe ? player.x : head.x + side * 95;
        const ty = swipe ? player.y : head.y + 35 + Math.cos(part.aiTimer * 2.5) * 25;
        part.vx += ((tx - part.x) * 5 - part.vx) * dt * 5;
        part.vy += ((ty - part.y) * 5 - part.vy) * dt * 5;
        part.x += part.vx * dt;
        part.y += part.vy * dt;
      }
    }
  }

  private updateWallOfFlesh(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager
  ): void {
    const mouth = b.parts.find((p) => p.role === 'mouth');
    if (!mouth) return;

    const hpRatio = clamp(mouth.hp / mouth.maxHp, 0.1, 1);
    const sweepSpeed = 62 + (1 - hpRatio) * 65;

    // Keep advancing toward player from the left (or catch up if far behind)
    if (player.x - b.x > 480) {
      b.x = player.x - 480;
    }
    b.x += sweepSpeed * dt;
    b.y += (player.y - b.y) * dt * 2.5;

    for (const part of b.parts) {
      if (part.hp <= 0) continue;
      if (part.role === 'mouth') {
        part.x = b.x;
        part.y = b.y;
      } else if (part.role === 'top_eye') {
        part.x = b.x;
        part.y = b.y - 85;
      } else if (part.role === 'bottom_eye') {
        part.x = b.x;
        part.y = b.y + 85;
      } else if (part.role === 'hungry') {
        part.aiTimer = (part.aiTimer || 0) + dt;
        const tx = b.x + 105 + Math.sin(part.aiTimer * 3.5) * 45;
        const ty = b.y + Math.cos(part.aiTimer * 2.2) * 85;
        part.x += (tx - part.x) * dt * 5;
        part.y += (ty - part.y) * dt * 5;
      }
    }

    // Eye Laser Barrages
    const laserInterval = 0.65 + hpRatio * 0.75;
    if (Math.floor((b.subTimer - dt) / laserInterval) !== Math.floor(b.subTimer / laserInterval)) {
      for (const part of b.parts) {
        if ((part.role === 'top_eye' || part.role === 'bottom_eye') && part.hp > 0) {
          const angle = Math.atan2(player.y - part.y, player.x - part.x);
          projectiles.spawn({
            x: part.x,
            y: part.y,
            vx: Math.cos(angle) * 410,
            vy: Math.sin(angle) * 410,
            type: 'eye_laser',
            damage: 28,
            friendly: false
          });
        }
      }
    }
  }

  private updateTheTwins(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    audio: AudioManager
  ): void {
    for (const part of b.parts) {
      if (part.hp <= 0) continue;
      part.aiTimer = (part.aiTimer || 0) + dt;

      if (part.phase === 1 && part.hp <= part.maxHp * 0.5) {
        part.phase = 2;
        part.defense += 8;
        audio.play('roar');
      }

      if (part.role === 'retinazer') {
        const tx = player.x - 190 * Math.sign(player.x - part.x || 1);
        const ty = player.y - 130 + Math.sin(part.aiTimer * 2.5) * 45;
        part.vx += ((tx - part.x) * 4 - part.vx) * dt * 4;
        part.vy += ((ty - part.y) * 4 - part.vy) * dt * 4;
        part.x += part.vx * dt;
        part.y += part.vy * dt;

        const fireInt = part.phase === 1 ? 0.95 : 0.38;
        if (Math.floor((part.aiTimer - dt) / fireInt) !== Math.floor(part.aiTimer / fireInt)) {
          const a = Math.atan2(player.y - part.y, player.x - part.x);
          projectiles.spawn({
            x: part.x,
            y: part.y,
            vx: Math.cos(a) * 480,
            vy: Math.sin(a) * 480,
            type: 'death_laser',
            damage: part.phase === 1 ? 36 : 46,
            friendly: false
          });
        }
      } else if (part.role === 'spazmatism') {
        const cycle = part.aiTimer % 5.0;
        if (cycle < 2.8) {
          // Hover & spit cursed flames
          const tx = player.x + 170;
          const ty = player.y - 30 + Math.cos(part.aiTimer * 3) * 55;
          part.vx += ((tx - part.x) * 4 - part.vx) * dt * 4;
          part.vy += ((ty - part.y) * 4 - part.vy) * dt * 4;

          const flameInt = part.phase === 1 ? 0.75 : 0.25;
          if (Math.floor((part.aiTimer - dt) / flameInt) !== Math.floor(part.aiTimer / flameInt)) {
            const a = Math.atan2(player.y - part.y, player.x - part.x);
            projectiles.spawn({
              x: part.x,
              y: part.y,
              vx: Math.cos(a) * (part.phase === 1 ? 390 : 320),
              vy: Math.sin(a) * (part.phase === 1 ? 390 : 320),
              type: 'cursed_flame',
              damage: 42,
              friendly: false
            });
          }
        } else {
          // Aggressive charge dashes
          const dashInt = 0.65;
          if (Math.floor((part.aiTimer - dt) / dashInt) !== Math.floor(part.aiTimer / dashInt)) {
            const a = Math.atan2(player.y - part.y, player.x - part.x);
            part.vx = Math.cos(a) * 520;
            part.vy = Math.sin(a) * 520;
          }
          part.vx *= 0.98;
          part.vy *= 0.98;
        }
        part.x += part.vx * dt;
        part.y += part.vy * dt;
      }
    }
  }

  private updateTheDestroyer(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager
  ): void {
    const head = b.parts[0];
    if (!head) return;

    const targetX = player.x + Math.cos(b.timer * 1.4) * 180;
    const targetY = player.y + Math.sin(b.timer * 2.1) * 160;
    const desiredAngle = Math.atan2(targetY - head.y, targetX - head.x);
    const spd = 330;
    head.vx += (Math.cos(desiredAngle) * spd - head.vx) * Math.min(1, dt * 3.2);
    head.vy += (Math.sin(desiredAngle) * spd - head.vy) * Math.min(1, dt * 3.2);
    head.x += head.vx * dt;
    head.y += head.vy * dt;

    const segDist = 24;
    for (let i = 1; i < b.parts.length; i++) {
      const seg = b.parts[i];
      const prev = b.parts[i - 1];
      const dx = prev.x - seg.x;
      const dy = prev.y - seg.y;
      const d = Math.hypot(dx, dy) || 1;
      seg.x = prev.x - (dx / d) * segDist;
      seg.y = prev.y - (dy / d) * segDist;
    }

    // Body segments fire red lasers periodically
    const laserInt = 0.55;
    if (Math.floor((b.subTimer - dt) / laserInt) !== Math.floor(b.subTimer / laserInt)) {
      const randomSeg = b.parts[Math.floor(Math.random() * b.parts.length)];
      if (randomSeg) {
        const a = Math.atan2(player.y - randomSeg.y, player.x - randomSeg.x);
        projectiles.spawn({
          x: randomSeg.x,
          y: randomSeg.y,
          vx: Math.cos(a) * 380,
          vy: Math.sin(a) * 380,
          type: 'death_laser',
          damage: 38,
          friendly: false
        });
      }
    }
  }

  private updateSkeletronPrime(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    audio: AudioManager
  ): void {
    const head = b.parts.find((p) => p.role === 'head');
    if (!head) return;

    const spinning = (b.subTimer % 8.0) > 5.0;
    b.phase = spinning ? 2 : 1;

    if (!spinning) {
      const tx = player.x + Math.sin(b.timer * 2) * 70;
      const ty = player.y - 155;
      head.vx += ((tx - head.x) * 4 - head.vx) * dt * 4;
      head.vy += ((ty - head.y) * 4 - head.vy) * dt * 4;
    } else {
      if (Math.floor((b.subTimer - dt) / 8.0) !== Math.floor(b.subTimer / 8.0)) {
        audio.play('roar');
      }
      const a = Math.atan2(player.y - head.y, player.x - head.x);
      head.vx = Math.cos(a) * 285;
      head.vy = Math.sin(a) * 285;
    }
    head.x += head.vx * dt;
    head.y += head.vy * dt;

    for (const part of b.parts) {
      if (part.role === 'head' || part.hp <= 0) continue;
      part.aiTimer = (part.aiTimer || 0) + dt;

      let ox = 0;
      let oy = 0;
      if (part.role === 'prime_laser') {
        ox = -95;
        oy = -40;
        if (Math.floor((part.aiTimer - dt) / 1.1) !== Math.floor(part.aiTimer / 1.1)) {
          const a = Math.atan2(player.y - part.y, player.x - part.x);
          projectiles.spawn({
            x: part.x,
            y: part.y,
            vx: Math.cos(a) * 450,
            vy: Math.sin(a) * 450,
            type: 'death_laser',
            damage: 42,
            friendly: false
          });
        }
      } else if (part.role === 'prime_cannon') {
        ox = 95;
        oy = -40;
        if (Math.floor((part.aiTimer - dt) / 1.4) !== Math.floor(part.aiTimer / 1.4)) {
          const a = Math.atan2(player.y - part.y, player.x - part.x);
          projectiles.spawn({
            x: part.x,
            y: part.y,
            vx: Math.cos(a) * 340,
            vy: Math.sin(a) * 340 - 80,
            type: 'spiky_ball',
            damage: 46,
            friendly: false
          });
        }
      } else if (part.role === 'prime_saw' || part.role === 'prime_vice') {
        const side = part.role === 'prime_saw' ? -85 : 85;
        const lunge = Math.sin(part.aiTimer * 3.4) > 0.6;
        ox = lunge ? player.x - head.x : side;
        oy = lunge ? player.y - head.y : 55;
      }

      const tx = head.x + ox;
      const ty = head.y + oy;
      part.x += (tx - part.x) * dt * 6;
      part.y += (ty - part.y) * dt * 6;
    }
  }

  private updatePlantera(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    audio: AudioManager
  ): void {
    const p = b.parts[0];
    if (!p) return;

    if (b.phase === 1 && p.hp <= p.maxHp * 0.5) {
      b.phase = 2;
      p.defense = 14;
      p.contactDamage = 76;
      audio.play('roar');
    }

    const angle = Math.atan2(player.y - p.y, player.x - p.x);
    const spd = b.phase === 1 ? 155 : 275;
    p.vx += (Math.cos(angle) * spd - p.vx) * dt * 3.5;
    p.vy += (Math.sin(angle) * spd - p.vy) * dt * 3.5;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    const shootInt = b.phase === 1 ? 0.55 : 0.85;
    if (Math.floor((b.subTimer - dt) / shootInt) !== Math.floor(b.subTimer / shootInt)) {
      projectiles.spawn({
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * 430,
        vy: Math.sin(angle) * 430,
        type: 'plantera_seed',
        damage: 48,
        friendly: false
      });
      if (Math.random() < 0.35) {
        projectiles.spawn({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 220,
          vy: -140,
          type: 'spiky_ball',
          damage: 54,
          friendly: false
        });
      }
    }
  }

  private updateGolem(
    b: BossInstance,
    dt: number,
    world: World,
    player: Player,
    projectiles: ProjectileManager,
    audio: AudioManager
  ): void {
    const body = b.parts.find((p) => p.role === 'body');
    const head = b.parts.find((p) => p.role === 'head');
    if (!body) return;

    // Ground physics for Golem body
    body.vy = Math.min(480, body.vy + 780 * dt);
    const footTy = Math.floor((body.y + body.radius) / 16);
    const tx = Math.floor(body.x / 16);
    if (body.vy >= 0 && world.isSolid(tx, footTy)) {
      body.y = footTy * 16 - body.radius;
      body.vy = 0;
      body.vx *= 0.75;
      if (b.subTimer >= 1.6) {
        b.subTimer = 0;
        body.vy = -390;
        body.vx = Math.sign(player.x - body.x) * 230;
        audio.play('explosion');
      }
    }
    body.x += body.vx * dt;
    body.y += body.vy * dt;

    // Golem Head detaches when damaged below 30% or body < 50%
    if (head) {
      head.aiTimer = (head.aiTimer || 0) + dt;
      if (head.hp <= 2500 || body.hp <= body.maxHp * 0.55) {
        head.invulnerable = true;
        b.phase = 2;
        const htx = player.x + Math.cos(head.aiTimer * 2) * 140;
        const hty = player.y - 150 + Math.sin(head.aiTimer * 3) * 40;
        head.x += (htx - head.x) * dt * 4;
        head.y += (hty - head.y) * dt * 4;
      } else {
        head.x = body.x;
        head.y = body.y - 44;
      }

      if (Math.floor((head.aiTimer - dt) / 0.85) !== Math.floor(head.aiTimer / 0.85)) {
        const a = Math.atan2(player.y - head.y, player.x - head.x);
        projectiles.spawn({
          x: head.x,
          y: head.y,
          vx: Math.cos(a) * 480,
          vy: Math.sin(a) * 480,
          type: b.phase === 2 ? 'golem_beam' : 'golem_fireball',
          damage: 54,
          friendly: false
        });
      }
    }

    // Fists punch out on chains
    for (const fist of b.parts) {
      if ((fist.role === 'left_fist' || fist.role === 'right_fist') && fist.hp > 0) {
        fist.aiTimer = (fist.aiTimer || 0) + dt;
        const side = fist.role === 'left_fist' ? -1 : 1;
        const punching = Math.sin(fist.aiTimer * 4) > 0.55;
        const ftx = punching ? player.x : body.x + side * 52;
        const fty = punching ? player.y : body.y;
        fist.x += (ftx - fist.x) * dt * 9;
        fist.y += (fty - fist.y) * dt * 9;
      }
    }
  }

  private updateDukeFishron(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    const p = b.parts[0];
    if (!p) return;

    if (b.phase === 1 && p.hp <= p.maxHp * 0.55) {
      b.phase = 2;
      audio.play('roar');
    } else if (b.phase === 2 && p.hp <= p.maxHp * 0.22) {
      b.phase = 3;
      audio.play('roar');
    }

    const dashInt = b.phase === 1 ? 0.72 : b.phase === 2 ? 0.56 : 0.44;
    if (Math.floor((b.subTimer - dt) / dashInt) !== Math.floor(b.subTimer / dashInt)) {
      b.chargeCount++;
      if (b.phase === 3 && b.chargeCount % 4 === 0) {
        // Phase 3 teleport behind player!
        particles.spawn(p.x, p.y, '#1cb3ff', 25, 180, 4);
        p.x = player.x - player.facing * 180;
        p.y = player.y - 40;
        particles.spawn(p.x, p.y, '#1cb3ff', 25, 180, 4);
      }

      const a = Math.atan2(player.y - p.y, player.x - p.x);
      const spd = b.phase === 1 ? 520 : b.phase === 2 ? 600 : 660;
      p.vx = Math.cos(a) * spd;
      p.vy = Math.sin(a) * spd;

      if (b.chargeCount % 3 === 0) {
        for (let k = -1; k <= 1; k++) {
          projectiles.spawn({
            x: p.x,
            y: p.y,
            vx: Math.cos(a + k * 0.22) * 420,
            vy: Math.sin(a + k * 0.22) * 420,
            type: 'sharknado_bolt',
            damage: 62,
            friendly: false
          });
        }
      }
    }

    p.vx *= 0.975;
    p.vy *= 0.975;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  private updateLunaticCultist(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    const p = b.parts[0];
    if (!p) return;

    // Teleport to a new position around player every 2.6 seconds
    const tpInt = 2.6;
    if (Math.floor((b.subTimer - dt) / tpInt) !== Math.floor(b.subTimer / tpInt)) {
      particles.spawn(p.x, p.y, '#ffd747', 20, 140, 3.5, 0, true);
      const angle = (Math.random() - 0.5) * Math.PI * 0.8 - Math.PI * 0.5;
      p.x = player.x + Math.cos(angle) * 210;
      p.y = player.y + Math.sin(angle) * 180;
      particles.spawn(p.x, p.y, '#ffd747', 20, 140, 3.5, 0, true);
      audio.play('magic');

      b.chargeCount++;
      const aim = Math.atan2(player.y - p.y, player.x - p.x);
      if (b.chargeCount % 2 === 0) {
        // Homing Fireball volley
        for (let i = -1; i <= 1; i++) {
          projectiles.spawn({
            x: p.x,
            y: p.y,
            vx: Math.cos(aim + i * 0.25) * 380,
            vy: Math.sin(aim + i * 0.25) * 380,
            type: 'cultist_fire',
            damage: 58,
            friendly: false
          });
        }
      } else {
        // Radial Ice Mist burst
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          projectiles.spawn({
            x: p.x,
            y: p.y,
            vx: Math.cos(a) * 340,
            vy: Math.sin(a) * 340,
            type: 'cultist_ice',
            damage: 56,
            friendly: false
          });
        }
      }
    }
  }

  private updateMoonLord(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    audio: AudioManager
  ): void {
    // Smoothly track player position
    b.x += (player.x - b.x) * dt * 2.2;
    b.y += (player.y - 40 - b.y) * dt * 2.2;

    const leftHand = b.parts.find((p) => p.role === 'left_hand');
    const rightHand = b.parts.find((p) => p.role === 'right_hand');
    const headEye = b.parts.find((p) => p.role === 'head_eye');
    const core = b.parts.find((p) => p.role === 'core');

    if (leftHand) {
      leftHand.x = b.x - 155 + Math.cos(b.timer * 2) * 30;
      leftHand.y = b.y + 10 + Math.sin(b.timer * 2.5) * 35;
    }
    if (rightHand) {
      rightHand.x = b.x + 155 - Math.cos(b.timer * 2) * 30;
      rightHand.y = b.y + 10 + Math.cos(b.timer * 2.5) * 35;
    }
    if (headEye) {
      headEye.x = b.x;
      headEye.y = b.y - 105 + Math.sin(b.timer * 1.8) * 15;
    }
    if (core) {
      core.x = b.x;
      core.y = b.y + 30;
      const eyesAlive =
        (leftHand && leftHand.hp > 0) ||
        (rightHand && rightHand.hp > 0) ||
        (headEye && headEye.hp > 0);
      if (!eyesAlive && core.invulnerable) {
        core.invulnerable = false;
        b.phase = 2;
        audio.play('roar');
      }
    }

    // Phantasmal Bolts & Spheres from Hands/Core
    const boltInt = 1.15;
    if (Math.floor((b.subTimer - dt) / boltInt) !== Math.floor(b.subTimer / boltInt)) {
      for (const eye of [leftHand, rightHand, headEye, core]) {
        if (!eye || eye.hp <= 0 || eye.invulnerable) continue;
        const a = Math.atan2(player.y - eye.y, player.x - eye.x);
        projectiles.spawn({
          x: eye.x,
          y: eye.y,
          vx: Math.cos(a) * 480,
          vy: Math.sin(a) * 480,
          type: eye.role === 'core' ? 'phantasmal_sphere' : 'phantasmal_bolt',
          damage: 66,
          friendly: false
        });
      }
    }

    // Sweeping Phantasmal Deathray every 7.5 seconds!
    const rayCycle = 7.5;
    if (Math.floor((b.subTimer - dt) / rayCycle) !== Math.floor(b.subTimer / rayCycle)) {
      const origin = headEye && headEye.hp > 0 ? headEye : core;
      if (origin) {
        const baseA = Math.atan2(player.y - origin.y, player.x - origin.x);
        b.deathray = {
          active: true,
          originX: origin.x,
          originY: origin.y,
          angle: baseA - 0.65,
          angularVel: 0.72,
          timer: 1.8,
          color: '#3be8d1'
        };
        audio.play('laser');
      }
    }
    if (b.deathray.active) {
      const origin = headEye && headEye.hp > 0 ? headEye : core;
      if (origin) {
        b.deathray.originX = origin.x;
        b.deathray.originY = origin.y;
      }
    }
  }

  // =========================================================
  // PROCEDURAL PIXEL-ART BOSS RENDERER
  // =========================================================
  render(ctx: CanvasRenderingContext2D, camX: number, camY: number, player: Player): void {
    const b = this.activeBoss;
    if (!b) return;

    ctx.save();

    // 1. Background connectors (Wall of Flesh wall, Twins cord, Skeletron arms, Golem chains, Plantera vines, Moon Lord torso)
    if (b.type === 'wall_of_flesh') {
      const wx = Math.floor(b.x - camX);
      ctx.fillStyle = '#7a1c24';
      ctx.fillRect(wx - 45, 0, 50, ctx.canvas.height);
      ctx.fillStyle = '#a82835';
      for (let y = 0; y < ctx.canvas.height; y += 28) {
        ctx.fillRect(wx - 12, y, 18, 18);
      }
      // Tendrils to The Hungry
      ctx.strokeStyle = '#9e2a3b';
      ctx.lineWidth = 3;
      for (const p of b.parts) {
        if (p.role === 'hungry' && p.hp > 0) {
          ctx.beginPath();
          ctx.moveTo(wx, b.y - camY);
          ctx.lineTo(p.x - camX, p.y - camY);
          ctx.stroke();
        }
      }
    } else if (b.type === 'the_twins' && b.parts.length === 2) {
      const [p1, p2] = b.parts;
      if (p1.hp > 0 && p2.hp > 0) {
        ctx.strokeStyle = '#a82835';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(p1.x - camX, p1.y - camY);
        ctx.lineTo(p2.x - camX, p2.y - camY);
        ctx.stroke();
      }
    } else if (b.type === 'skeletron' || b.type === 'skeletron_prime') {
      const head = b.parts.find((p) => p.role === 'head');
      if (head) {
        ctx.strokeStyle = b.type === 'skeletron' ? '#c9c2ab' : '#8a95a6';
        ctx.lineWidth = 5;
        for (const p of b.parts) {
          if (p !== head && p.hp > 0) {
            ctx.beginPath();
            ctx.moveTo(head.x - camX, head.y - camY);
            ctx.lineTo(p.x - camX, p.y - camY);
            ctx.stroke();
          }
        }
      }
    } else if (b.type === 'golem') {
      const body = b.parts.find((p) => p.role === 'body');
      if (body) {
        ctx.strokeStyle = '#ff9922';
        ctx.lineWidth = 4;
        for (const p of b.parts) {
          if ((p.role === 'left_fist' || p.role === 'right_fist') && p.hp > 0) {
            ctx.beginPath();
            ctx.moveTo(body.x - camX, body.y - camY);
            ctx.lineTo(p.x - camX, p.y - camY);
            ctx.stroke();
          }
        }
      }
    } else if (b.type === 'plantera') {
      const p = b.parts[0];
      if (p) {
        ctx.strokeStyle = '#48a828';
        ctx.lineWidth = 4;
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2 + 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x - camX, p.y - camY);
          ctx.lineTo(p.x - camX + Math.cos(a) * 130, p.y - camY + Math.sin(a) * 130);
          ctx.stroke();
        }
      }
    } else if (b.type === 'moon_lord') {
      // Giant Moon Lord Celestial Torso & Shoulders
      const mx = Math.floor(b.x - camX);
      const my = Math.floor(b.y - camY);
      ctx.fillStyle = 'rgba(26, 68, 66, 0.78)';
      ctx.fillRect(mx - 85, my - 70, 170, 150);
      ctx.fillStyle = 'rgba(46, 128, 118, 0.85)';
      ctx.fillRect(mx - 65, my - 50, 130, 110);
      // Ribcage bars
      ctx.fillStyle = '#a8cfc7';
      for (let r = -20; r <= 40; r += 20) {
        ctx.fillRect(mx - 50, my + r, 100, 6);
      }
    }

    // 2. Render each Boss Part
    for (const part of b.parts) {
      if (part.hp <= 0) continue;
      const sx = Math.floor(part.x - camX);
      const sy = Math.floor(part.y - camY);
      const r = part.radius;

      if (b.type === 'king_slime') {
        // Ninja silhouette inside slime
        ctx.fillStyle = '#1b1e26';
        ctx.fillRect(sx - 5, sy - 6, 10, 16);
        // Translucent royal blue body
        ctx.fillStyle = 'rgba(43, 134, 255, 0.78)';
        ctx.beginPath();
        ctx.arc(sx, sy + 4, r, Math.PI, 0, false);
        ctx.lineTo(sx + r, sy + r * 0.7);
        ctx.lineTo(sx - r, sy + r * 0.7);
        ctx.closePath();
        ctx.fill();
        // Golden Crown with Ruby
        ctx.fillStyle = '#ffd747';
        ctx.fillRect(sx - 18, sy - r - 8, 36, 12);
        ctx.fillRect(sx - 18, sy - r - 15, 7, 8);
        ctx.fillRect(sx - 4, sy - r - 17, 8, 10);
        ctx.fillRect(sx + 11, sy - r - 15, 7, 8);
        ctx.fillStyle = '#ff2942';
        ctx.fillRect(sx - 3, sy - r - 6, 6, 6);
      } else if (b.type === 'eye_of_cthulhu' || b.type === 'the_twins') {
        const angle = Math.atan2(player.y - part.y, player.x - part.x);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle);
        // Trailing optic nerve tendrils
        ctx.fillStyle = '#d92b3a';
        ctx.fillRect(-r - 16, -8, 18, 4);
        ctx.fillRect(-r - 20, 0, 22, 4);
        ctx.fillRect(-r - 16, 8, 18, 4);

        const isPhase2 = (part.phase || b.phase) === 2;
        ctx.fillStyle = isPhase2 && b.type === 'the_twins' ? '#9aa6b8' : '#f0f0f7';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        if (isPhase2) {
          // Fanged Mouth / Mechanical Turret
          ctx.fillStyle = '#7a1622';
          ctx.beginPath();
          ctx.arc(r * 0.3, 0, r * 0.65, -1.1, 1.1);
          ctx.lineTo(0, 0);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          for (let t = -12; t <= 12; t += 8) {
            ctx.fillRect(r * 0.35, t - 2, 6, 4);
          }
        } else {
          // Iris
          ctx.fillStyle =
            part.role === 'spazmatism' ? '#38eb5c' : part.role === 'retinazer' ? '#ff2942' : '#2b6eff';
          ctx.beginPath();
          ctx.arc(r * 0.42, 0, r * 0.42, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#111';
          ctx.beginPath();
          ctx.arc(r * 0.5, 0, r * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (b.type === 'eater_of_worlds' || b.type === 'the_destroyer') {
        const isMech = b.type === 'the_destroyer';
        ctx.fillStyle = isMech ? '#7c8799' : '#6b479e';
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isMech ? '#ff2942' : '#a4cf55';
        ctx.beginPath();
        ctx.arc(sx, sy, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.type === 'queen_bee') {
        // Flapping wings
        const flap = Math.sin(performance.now() * 0.04) * 10;
        ctx.fillStyle = 'rgba(210, 240, 255, 0.75)';
        ctx.fillRect(sx - 18, sy - r - 12 + flap, 36, 18);
        // Striped abdomen
        ctx.fillStyle = '#f5b922';
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#241e16';
        ctx.fillRect(sx - r + 6, sy - 10, r * 2 - 12, 7);
        ctx.fillRect(sx - r + 6, sy + 4, r * 2 - 12, 7);
      } else if (b.type === 'skeletron' || b.type === 'skeletron_prime') {
        const isPrime = b.type === 'skeletron_prime';
        ctx.save();
        ctx.translate(sx, sy);
        if (part.role === 'head' && b.phase === 2) {
          ctx.rotate(b.timer * 14);
        }
        ctx.fillStyle = isPrime ? '#a6b2c4' : '#e0dac3';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        if (part.role === 'head') {
          ctx.fillStyle = isPrime ? '#ff2942' : '#111111';
          ctx.fillRect(-14, -8, 9, 9);
          ctx.fillRect(5, -8, 9, 9);
          ctx.fillRect(-10, 10, 20, 6);
        }
        ctx.restore();
      } else if (b.type === 'plantera') {
        ctx.fillStyle = b.phase === 1 ? '#ff59b8' : '#55c934';
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = b.phase === 1 ? '#76db46' : '#8f2436';
        ctx.beginPath();
        ctx.arc(sx, sy, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.type === 'golem') {
        ctx.fillStyle = '#9c521c';
        ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
        ctx.fillStyle = '#ffcf24';
        ctx.fillRect(sx - r * 0.45, sy - r * 0.45, r * 0.9, r * 0.9);
      } else if (b.type === 'duke_fishron') {
        ctx.fillStyle = b.phase === 3 ? '#1a428a' : '#1cb89c';
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = b.phase >= 2 ? '#ffee38' : '#ff59b8';
        ctx.fillRect(sx - 10, sy - 8, 8, 8);
        ctx.fillRect(sx + 4, sy - 8, 8, 8);
      } else if (b.type === 'lunatic_cultist') {
        ctx.fillStyle = '#1f3b82';
        ctx.fillRect(sx - 12, sy - 18, 24, 36);
        ctx.fillStyle = '#f2ede4';
        ctx.fillRect(sx - 9, sy - 16, 18, 12);
        ctx.fillStyle = '#ffd747';
        ctx.fillRect(sx - 12, sy - 2, 24, 4);
      } else if (b.type === 'moon_lord') {
        ctx.fillStyle = part.invulnerable ? '#284a47' : '#d8f5ef';
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        if (!part.invulnerable) {
          ctx.fillStyle = '#2be6b8';
          ctx.beginPath();
          ctx.arc(sx, sy, r * 0.52, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = '#d9384a';
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Sweeping Phantasmal Deathray Beam!
    if (b.deathray.active) {
      const ox = b.deathray.originX - camX;
      const oy = b.deathray.originY - camY;
      const ex = ox + Math.cos(b.deathray.angle) * 1000;
      const ey = oy + Math.sin(b.deathray.angle) * 1000;

      ctx.strokeStyle = 'rgba(59, 232, 209, 0.42)';
      ctx.lineWidth = 34;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }

    ctx.restore();
  }
}
