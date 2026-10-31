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
    dropsSummary: 'Zenith, Meowmere, S.D.M.G., Last Prism, Luminite Bars'
  },
  // =========================================================
  // CALAMITY MOD POST-MOON LORD BOSSES (Tiers 15..18)
  // =========================================================
  {
    id: 'providence',
    name: 'Providence, the Profaned Goddess [Calamity]',
    tier: 15,
    hardmode: true,
    summonItem: 'profaned_core',
    biomeHint: 'The Hallow / The Underworld (Post-Moon Lord)',
    dropsSummary: 'Unholy Essence, Blossom Pickaxe, Tarragon Armor, Omega Healing Potions'
  },
  {
    id: 'devourer_of_gods',
    name: 'The Devourer of Gods [Calamity]',
    tier: 16,
    hardmode: true,
    summonItem: 'cosmic_worm',
    biomeHint: 'Cosmic Skies (Post-Providence)',
    dropsSummary: 'Cosmilite Bars, Excelsus, Genesis Pickaxe, God Slayer Armor'
  },
  {
    id: 'yharon',
    name: 'Yharon, Dragon of Rebirth [Calamity]',
    tier: 17,
    hardmode: true,
    summonItem: 'blessed_phoenix_egg',
    biomeHint: 'The Jungle / Arena Skies (Post-DoG)',
    dropsSummary: "Auric Bars, Yharon Soul Fragments, Dragon's Rage, Drataliornus, Auric Tesla Armor"
  },
  {
    id: 'supreme_calamitas',
    name: 'Supreme Witch, Calamitas [Calamity]',
    tier: 18,
    hardmode: true,
    summonItem: 'altar_of_accursed',
    biomeHint: 'Brimstone Arena (Calamity Finale!)',
    dropsSummary: 'Shadowspec Bars, Ark of the Cosmos, Crystyl Crusher, Soma Prime, Vehemence, Demonshade Armor'
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
    onChat(`=== ${BOSS_CATALOG.length}-BOSS RUSH STARTED! Wave 1/${BOSS_CATALOG.length}: King Slime ===`, '#ffd747');
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
      this.bossRushWave = Math.min(BOSS_CATALOG.length, this.bossRushWave + 1);
    }
    this.bossRushCountdown = 0;
    const entry = BOSS_CATALOG[this.bossRushWave - 1];
    if (entry) {
      player.hp = player.maxHp;
      player.mana = player.maxMana;
      player.potionCooldown = 0;
      const upg = player.upgradeForBossRushWave(this.bossRushWave);
      if (upg) onChat(upg, '#05c8ff');
      onChat(`=== BOSS RUSH WAVE ${this.bossRushWave}/${BOSS_CATALOG.length}: ${entry.name} ===`, '#ffd747');
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
      case 'providence': {
        boss.title = 'Providence, the Profaned Goddess';
        boss.subtitle = 'The Profaned Flame [Calamity]';
        boss.tier = 15;
        boss.isHardmode = true;
        boss.parts.push({
          id: nextPartId++,
          name: 'Providence, the Profaned Goddess',
          x: sx,
          y: sy,
          vx: 0,
          vy: 0,
          radius: 44,
          hp: 58000,
          maxHp: 58000,
          defense: 36,
          contactDamage: 82,
          role: 'body'
        });
        break;
      }
      case 'devourer_of_gods': {
        boss.title = 'The Devourer of Gods';
        boss.subtitle = 'Scourge of the Cosmos [Calamity]';
        boss.tier = 16;
        boss.isHardmode = true;
        const segCount = 26;
        const sharedHp = 75000;
        for (let i = 0; i < segCount; i++) {
          boss.parts.push({
            id: nextPartId++,
            name: i === 0 ? 'Devourer of Gods Head' : i === segCount - 1 ? 'Devourer of Gods Tail' : 'Devourer Body',
            x: sx - i * 24,
            y: sy,
            vx: 0,
            vy: 0,
            radius: i === 0 ? 28 : 22,
            hp: sharedHp,
            maxHp: sharedHp,
            defense: i === 0 ? 28 : i === segCount - 1 ? 24 : 44,
            contactDamage: i === 0 ? 98 : i === segCount - 1 ? 66 : 74,
            role: i === 0 ? 'head' : i === segCount - 1 ? 'tail' : 'body',
            parentIndex: i - 1
          });
        }
        break;
      }
      case 'yharon': {
        boss.title = 'Yharon, Dragon of Rebirth';
        boss.subtitle = 'Jungle Dragon [Calamity]';
        boss.tier = 17;
        boss.isHardmode = true;
        boss.parts.push({
          id: nextPartId++,
          name: 'Yharon, Dragon of Rebirth',
          x: sx,
          y: sy,
          vx: 0,
          vy: 0,
          radius: 46,
          hp: 92000,
          maxHp: 92000,
          defense: 40,
          contactDamage: 92,
          role: 'body'
        });
        break;
      }
      case 'supreme_calamitas': {
        boss.title = 'Supreme Witch, Calamitas';
        boss.subtitle = 'The Brimstone Witch [Calamity]';
        boss.tier = 18;
        boss.isHardmode = true;
        boss.parts.push({
          id: nextPartId++,
          name: 'Supreme Witch, Calamitas',
          x: sx,
          y: sy,
          vx: 0,
          vy: 0,
          radius: 34,
          hp: 110000,
          maxHp: 110000,
          defense: 44,
          contactDamage: 96,
          role: 'body'
        });
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

    if (b.type === 'wall_of_flesh' || b.type === 'the_destroyer' || b.type === 'devourer_of_gods') {
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
            onChat(`=== BOSS RUSH WAVE ${this.bossRushWave}/${BOSS_CATALOG.length}: ${entry.name} ===`, '#ffd747');
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
        this.updateKingSlime(b, dt, world, player, projectiles, enemies, audio, particles);
        break;
      case 'eye_of_cthulhu':
        this.updateEyeOfCthulhu(b, dt, player, projectiles, enemies, audio, particles);
        break;
      case 'eater_of_worlds':
        this.updateEaterOfWorlds(b, dt, player, projectiles, audio, particles);
        break;
      case 'queen_bee':
        this.updateQueenBee(b, dt, player, projectiles, enemies, audio, particles);
        break;
      case 'skeletron':
        this.updateSkeletron(b, dt, player, projectiles, audio, particles);
        break;
      case 'wall_of_flesh':
        this.updateWallOfFlesh(b, dt, player, projectiles, audio, particles);
        break;
      case 'the_twins':
        this.updateTheTwins(b, dt, player, projectiles, audio, particles);
        break;
      case 'the_destroyer':
        this.updateTheDestroyer(b, dt, player, projectiles, audio, particles);
        break;
      case 'skeletron_prime':
        this.updateSkeletronPrime(b, dt, player, projectiles, audio, particles);
        break;
      case 'plantera':
        this.updatePlantera(b, dt, player, projectiles, audio, particles);
        break;
      case 'golem':
        this.updateGolem(b, dt, world, player, projectiles, audio, particles);
        break;
      case 'duke_fishron':
        this.updateDukeFishron(b, dt, player, projectiles, audio, particles);
        break;
      case 'lunatic_cultist':
        this.updateLunaticCultist(b, dt, player, projectiles, audio, particles);
        break;
      case 'moon_lord':
        this.updateMoonLord(b, dt, player, projectiles, audio, particles);
        break;
      case 'providence':
        this.updateProvidence(b, dt, player, projectiles, audio, particles);
        break;
      case 'devourer_of_gods':
        this.updateDevourerOfGods(b, dt, player, projectiles, audio, particles, onChat);
        break;
      case 'yharon':
        this.updateYharon(b, dt, player, projectiles, audio, particles, onChat);
        break;
      case 'supreme_calamitas':
        this.updateSupremeCalamitas(b, dt, player, projectiles, audio, particles);
        break;
    }

    // Spawn afterimages for fast-moving boss parts
    for (const part of b.parts) {
      if (part.hp > 0 && Math.hypot(part.vx, part.vy) > 260) {
        const trailCol =
          b.type === 'yharon'
            ? '#ffaa00'
            : b.type === 'devourer_of_gods'
            ? '#ff29c6'
            : b.type === 'providence'
            ? '#ffd747'
            : b.type === 'supreme_calamitas'
            ? '#ff1938'
            : b.type === 'duke_fishron'
            ? '#1cb3ff'
            : b.type === 'queen_bee'
            ? '#ffd747'
            : b.type === 'plantera'
            ? '#ff59b8'
            : '#ff2942';
        particles.spawnAfterimage(part.x, part.y, part.radius * 0.88, trailCol, 0.22);
      }
    }

    // Sweeping Deathray collision
    if (b.deathray.active) {
      particles.triggerShake(4, 0.1);
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
          const rayDmg =
            b.type === 'supreme_calamitas'
              ? 105
              : b.type === 'providence'
              ? 92
              : 95;
          const rayPierce = b.tier >= 15 ? 0.85 : 0;
          player.takeDamage(rayDmg, Math.sign(dx) || 1, audio, particles, world, rayPierce);
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
            if (p.type === 'holy_arrow' && Math.random() < 0.45) {
              projectiles.spawn({
                x: part.x + (Math.random() - 0.5) * 90,
                y: part.y - 260,
                vx: 0,
                vy: 560,
                type: 'falling_star',
                damage: Math.round(p.damage * 0.55),
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
        const contactPierce = b.tier >= 15 ? 0.85 : 0;
        player.takeDamage(
          part.contactDamage,
          Math.sign(player.x - part.x) || 1,
          audio,
          particles,
          world,
          contactPierce
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
    } else if (b.type === 'the_destroyer' || b.type === 'devourer_of_gods') {
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
    particles.triggerShake(18, 0.65);
    particles.triggerFlash('#ffffff', 0.45);
    particles.spawnShockwave(dropX, dropY, '#ffd747', 280, 0.6, 8);
    particles.spawnShockwave(dropX, dropY, '#ff2957', 190, 0.45, 6);
    particles.spawn(dropX, dropY, '#ffdd44', 65, 260, 5, 180, true);
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
        world.spawnDrop(dropX, dropY, 'air_spinner', 1);
        break;
      case 'eye_of_cthulhu':
        world.spawnDrop(dropX, dropY, 'demonite_ore', 45);
        world.spawnDrop(dropX, dropY, 'demonite_bar', 12);
        world.spawnDrop(dropX, dropY, 'reefshark_pickaxe', 1);
        world.spawnDrop(dropX, dropY, 'healing_potion', 10);
        world.spawnDrop(dropX, dropY, 'worm_food', 1);
        break;
      case 'eater_of_worlds':
        world.spawnDrop(dropX, dropY, 'demonite_bar', 18);
        world.spawnDrop(dropX, dropY, 'shadow_scale', 25);
        world.spawnDrop(dropX, dropY, 'biome_blade', 1);
        world.spawnDrop(dropX, dropY, 'healing_potion', 12);
        break;
      case 'queen_bee':
        world.spawnDrop(dropX, dropY, 'bees_knees', 1);
        world.spawnDrop(dropX, dropY, 'minishark', 1);
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
        world.spawnDrop(dropX, dropY, 'pandemic', 1);
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
        world.spawnDrop(dropX, dropY, 'zenith', 1);
        world.spawnDrop(dropX, dropY, 'terrarian_yoyo', 1);
        world.spawnDrop(dropX, dropY, 'meowmere', 1);
        world.spawnDrop(dropX, dropY, 'sdmg', 1);
        world.spawnDrop(dropX, dropY, 'last_prism', 1);
        world.spawnDrop(dropX, dropY, 'luminite_bar', 45);
        world.spawnDrop(dropX, dropY, 'solar_fragment', 45);
        world.spawnDrop(dropX, dropY, 'profaned_core', 1);
        world.spawnDrop(dropX, dropY, 'super_healing_potion', 25);
        onChat('Victory! You have conquered the Moon Lord and unlocked THE ZENITH & Terrarian Yoyo!', '#05c8ff');
        break;
      case 'providence':
        world.spawnDrop(dropX, dropY, 'unholy_essence', 35);
        world.spawnDrop(dropX, dropY, 'holy_collider', 1);
        world.spawnDrop(dropX, dropY, 'burning_revelation', 1);
        world.spawnDrop(dropX, dropY, 'blossom_pickaxe', 1);
        world.spawnDrop(dropX, dropY, 'tarragon_helmet', 1);
        world.spawnDrop(dropX, dropY, 'tarragon_breastplate', 1);
        world.spawnDrop(dropX, dropY, 'tarragon_leggings', 1);
        world.spawnDrop(dropX, dropY, 'cosmic_worm', 1);
        world.spawnDrop(dropX, dropY, 'omega_healing_potion', 20);
        onChat('Providence’s profaned flames subside... Holy Collider, Burning Revelation Yoyo & Tarragon Armor dropped!', '#2bff6e');
        break;
      case 'devourer_of_gods':
        world.spawnDrop(dropX, dropY, 'cosmilite_bar', 40);
        world.spawnDrop(dropX, dropY, 'excelsus', 1);
        world.spawnDrop(dropX, dropY, 'deaths_ascension', 1);
        world.spawnDrop(dropX, dropY, 'galactus_blade', 1);
        world.spawnDrop(dropX, dropY, 'the_obliterator', 1);
        world.spawnDrop(dropX, dropY, 'genesis_pickaxe', 1);
        world.spawnDrop(dropX, dropY, 'god_slayer_helmet', 1);
        world.spawnDrop(dropX, dropY, 'god_slayer_breastplate', 1);
        world.spawnDrop(dropX, dropY, 'god_slayer_leggings', 1);
        world.spawnDrop(dropX, dropY, 'blessed_phoenix_egg', 1);
        world.spawnDrop(dropX, dropY, 'omega_healing_potion', 25);
        onChat("The Devourer of Gods slain! Death's Ascension, Galactus Blade, The Obliterator Yoyo & God Slayer Armor dropped!", '#ff29c6');
        break;
      case 'yharon':
        world.spawnDrop(dropX, dropY, 'auric_bar', 45);
        world.spawnDrop(dropX, dropY, 'yharon_soul_fragment', 25);
        world.spawnDrop(dropX, dropY, 'dragon_rage', 1);
        world.spawnDrop(dropX, dropY, 'phoenix_flame_blaster', 1);
        world.spawnDrop(dropX, dropY, 'celestial_tracers', 1);
        world.spawnDrop(dropX, dropY, 'auric_tesla_helmet', 1);
        world.spawnDrop(dropX, dropY, 'auric_tesla_breastplate', 1);
        world.spawnDrop(dropX, dropY, 'auric_tesla_leggings', 1);
        world.spawnDrop(dropX, dropY, 'altar_of_accursed', 1);
        world.spawnDrop(dropX, dropY, 'omega_healing_potion', 30);
        onChat("Yharon, Dragon of Rebirth defeated! Dragon's Rage, Drataliornus & Auric Tesla Armor dropped!", '#ffaa00');
        break;
      case 'supreme_calamitas':
        world.spawnDrop(dropX, dropY, 'shadowspec_bar', 50);
        world.spawnDrop(dropX, dropY, 'earth', 1);
        world.spawnDrop(dropX, dropY, 'ark_of_the_cosmos', 1);
        world.spawnDrop(dropX, dropY, 'azathoth', 1);
        world.spawnDrop(dropX, dropY, 'crystyl_crusher', 1);
        world.spawnDrop(dropX, dropY, 'soma_prime', 1);
        world.spawnDrop(dropX, dropY, 'vehemence', 1);
        world.spawnDrop(dropX, dropY, 'demonshade_helmet', 1);
        world.spawnDrop(dropX, dropY, 'demonshade_breastplate', 1);
        world.spawnDrop(dropX, dropY, 'demonshade_leggings', 1);
        world.spawnDrop(dropX, dropY, 'omega_healing_potion', 40);
        onChat('SUPREME VICTORY! Supreme Witch, Calamitas conquered! Earth, Ark of the Cosmos, Azathoth Yoyo & Demonshade Armor unlocked!', '#ff1938');
        break;
    }

    this.activeBoss = null;

    if (this.bossRushActive) {
      player.hp = player.maxHp;
      player.mana = player.maxMana;
      player.potionCooldown = 0;

      if (this.bossRushWave < BOSS_CATALOG.length) {
        this.bossRushWave++;
        this.bossRushCountdown = 3.5;
        const upg = player.upgradeForBossRushWave(this.bossRushWave);
        if (upg) {
          onChat(upg, '#05c8ff');
        }
        const nextEntry = BOSS_CATALOG[this.bossRushWave - 1];
        onChat(
          `Full HP/Mana Restored! Next Up in 3.5s -> Wave ${this.bossRushWave}/${BOSS_CATALOG.length}: ${nextEntry?.name}!`,
          '#ffd747'
        );
      } else {
        this.bossRushCompleted = true;
        this.bossRushActive = false;
        const mins = Math.floor(this.bossRushTimer / 60);
        const secs = (this.bossRushTimer % 60).toFixed(1);
        onChat(
          `CALAMITY GODSLAYER! All ${BOSS_CATALOG.length} Bosses Conquered! Final Boss Rush Time: ${mins}m ${secs}s!`,
          '#05c8ff'
        );
      }
    }
  }

  // =========================================================
  // INDIVIDUAL BOSS AI BEHAVIORS (MULTI-ATTACK EDITION)
  // =========================================================

  private updateKingSlime(
    b: BossInstance,
    dt: number,
    world: World,
    player: Player,
    projectiles: ProjectileManager,
    enemies: EnemyManager,
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    const p = b.parts[0];
    if (!p) return;

    const hpRatio = clamp(p.hp / p.maxHp, 0.35, 1);
    p.radius = Math.round(24 + hpRatio * 22);

    const wasFallingFast = p.vy > 320;
    p.vy = Math.min(540, p.vy + 780 * dt);
    const footTy = Math.floor((p.y + p.radius) / 16);
    const tx = Math.floor(p.x / 16);
    const grounded = p.vy >= 0 && world.isSolid(tx, footTy);

    if (grounded) {
      p.y = footTy * 16 - p.radius;
      // Attack 1: Royal Slam Impact Shockwave + 8-Way Gel Spike Burst!
      if (wasFallingFast) {
        particles.spawnShockwave(p.x, p.y, '#2b82ff', 140, 0.35, 5);
        particles.triggerShake(6, 0.2);
        const count = hpRatio < 0.6 ? 8 : 5;
        for (let k = 0; k < count; k++) {
          const ang = -Math.PI + (k / (count - 1)) * Math.PI;
          projectiles.spawn({
            x: p.x,
            y: p.y - 8,
            vx: Math.cos(ang) * 320,
            vy: Math.sin(ang) * 320 - 60,
            type: 'water_bolt',
            damage: 20,
            friendly: false
          });
        }
      }
      p.vy = 0;
      p.vx *= 0.8;

      if (b.subTimer >= 1.05 * hpRatio + 0.3) {
        b.subTimer = 0;
        b.chargeCount++;
        const dir = Math.sign(player.x - p.x) || 1;
        if (b.chargeCount % 4 === 0) {
          // Attack 2: Mega Sky-Slam Jump + Aimed Crown Ruby Volley
          p.vy = -520;
          p.vx = dir * 270;
          audio.play('roar');
          const aim = Math.atan2(player.y - p.y, player.x - p.x);
          for (let s = -1; s <= 1; s++) {
            projectiles.spawn({
              x: p.x,
              y: p.y - p.radius,
              vx: Math.cos(aim + s * 0.22) * 360,
              vy: Math.sin(aim + s * 0.22) * 360,
              type: 'eye_laser',
              damage: 22,
              friendly: false
            });
          }
        } else {
          p.vy = -350;
          p.vx = dir * 205;
          audio.play('jump');
        }

        if (enemies.enemies.length < 5 && Math.random() < 0.4) {
          enemies.spawnEnemy('blue_slime', p.x, p.y);
        }
      }
    }

    // Attack 3: Royal Teleport Ambush above player + Radial Slime Nova
    if (b.timer > 7.2 || dist(p.x, p.y, player.x, player.y) > 650) {
      b.timer = 0;
      particles.spawnShockwave(p.x, p.y, '#2b82ff', 120, 0.3, 4);
      particles.spawn(p.x, p.y, '#2b82ff', 22, 160, 4);
      p.x = player.x + (Math.random() < 0.5 ? -90 : 90);
      p.y = player.y - 190;
      p.vy = 360;
      particles.spawn(p.x, p.y, '#ffd747', 24, 170, 4, 0, true);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        projectiles.spawn({
          x: p.x,
          y: p.y,
          vx: Math.cos(a) * 280,
          vy: Math.sin(a) * 280,
          type: 'water_bolt',
          damage: 20,
          friendly: false
        });
      }
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  private updateEyeOfCthulhu(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    enemies: EnemyManager,
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    const p = b.parts[0];
    if (!p) return;

    if (b.phase === 1 && p.hp <= p.maxHp * 0.55) {
      b.phase = 2;
      b.subTimer = 0;
      p.defense = 4;
      p.contactDamage = 34;
      audio.play('roar');
      particles.spawnShockwave(p.x, p.y, '#ff2942', 190, 0.45, 6);
      particles.triggerShake(10, 0.35);
      particles.spawn(p.x, p.y, '#d92b3a', 35, 200, 4.5, 0, true);
    }

    const cycle = b.phase === 1 ? 5.6 : 4.2;
    const t = b.subTimer % cycle;

    if (t < cycle * 0.5) {
      // Hover above player & fire Optic Blood Fans
      const tx = player.x + Math.cos(b.timer * 2.2) * 150;
      const ty = player.y - 155 + Math.sin(b.timer * 3.2) * 35;
      p.vx += ((tx - p.x) * 3.5 - p.vx) * dt * 4;
      p.vy += ((ty - p.y) * 3.5 - p.vy) * dt * 4;

      const shotInt = b.phase === 1 ? 1.1 : 0.65;
      if (Math.floor((b.subTimer - dt) / shotInt) !== Math.floor(b.subTimer / shotInt)) {
        const aim = Math.atan2(player.y - p.y, player.x - p.x);
        const count = b.phase === 1 ? 2 : 3;
        for (let i = 0; i < count; i++) {
          const off = (i - (count - 1) * 0.5) * 0.22;
          projectiles.spawn({
            x: p.x,
            y: p.y,
            vx: Math.cos(aim + off) * 350,
            vy: Math.sin(aim + off) * 350,
            type: 'eye_laser',
            damage: b.phase === 1 ? 20 : 26,
            friendly: false
          });
        }
      }

      if (b.phase === 1 && Math.random() < dt * 0.5 && enemies.enemies.length < 4) {
        enemies.spawnEnemy('demon_eye', p.x, p.y);
      }
    } else {
      // Chain charges + Phase 2 Crimson Ring Burst!
      const chargeInterval = b.phase === 1 ? 0.8 : 0.48;
      if (Math.floor((b.subTimer - dt) / chargeInterval) !== Math.floor(b.subTimer / chargeInterval)) {
        b.chargeCount++;
        const angle = Math.atan2(player.y - p.y, player.x - p.x);
        const spd = b.phase === 1 ? 390 : 520;
        p.vx = Math.cos(angle) * spd;
        p.vy = Math.sin(angle) * spd;
        if (b.phase === 2) {
          audio.play('roar');
          particles.spawnShockwave(p.x, p.y, '#ff2942', 85, 0.22, 3);
          if (b.chargeCount % 3 === 0) {
            for (let k = 0; k < 6; k++) {
              const a = (k / 6) * Math.PI * 2;
              projectiles.spawn({
                x: p.x,
                y: p.y,
                vx: Math.cos(a) * 300,
                vy: Math.sin(a) * 300,
                type: 'eye_laser',
                damage: 24,
                friendly: false
              });
            }
          }
        }
      }
      p.vx *= 0.985;
      p.vy *= 0.985;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  private updateEaterOfWorlds(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    const segDist = 22;
    for (let i = 0; i < b.parts.length; i++) {
      const seg = b.parts[i];
      if (seg.hp <= 0) continue;

      if (seg.parentIndex === undefined || seg.parentIndex < 0 || b.parts[seg.parentIndex]?.hp <= 0) {
        // Head steering toward player in sine wave arcs + periodic toxic lunge
        const isLunging = (b.subTimer % 5.0) > 3.8;
        const desiredAngle =
          Math.atan2(player.y - seg.y, player.x - seg.x) +
          (isLunging ? 0 : Math.sin(b.timer * 3 + i) * 0.4);
        const spd = isLunging ? 340 : 240;
        seg.vx += (Math.cos(desiredAngle) * spd - seg.vx) * Math.min(1, dt * 3.6);
        seg.vy += (Math.sin(desiredAngle) * spd - seg.vy) * Math.min(1, dt * 3.6);
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

    // Attack 2: Body segments spit Vile Cursed Orbs at player
    const spitInt = 0.75;
    if (Math.floor((b.subTimer - dt) / spitInt) !== Math.floor(b.subTimer / spitInt)) {
      const aliveSegs = b.parts.filter((s) => s.hp > 0);
      if (aliveSegs.length > 0) {
        const shooter = aliveSegs[Math.floor(Math.random() * aliveSegs.length)];
        const aim = Math.atan2(player.y - shooter.y, player.x - shooter.x);
        projectiles.spawn({
          x: shooter.x,
          y: shooter.y,
          vx: Math.cos(aim) * 310,
          vy: Math.sin(aim) * 310,
          type: 'cursed_flame',
          damage: 24,
          friendly: false
        });
      }
    }

    // Attack 3: Head 5-way Corruption Fan Burst every 4.5s
    if (Math.floor((b.subTimer - dt) / 4.5) !== Math.floor(b.subTimer / 4.5)) {
      const head = b.parts.find((s) => s.hp > 0);
      if (head) {
        audio.play('roar');
        particles.spawnShockwave(head.x, head.y, '#9ccf46', 110, 0.3, 4);
        const aim = Math.atan2(player.y - head.y, player.x - head.x);
        for (let k = -2; k <= 2; k++) {
          projectiles.spawn({
            x: head.x,
            y: head.y,
            vx: Math.cos(aim + k * 0.2) * 340,
            vy: Math.sin(aim + k * 0.2) * 340,
            type: 'cursed_flame',
            damage: 26,
            friendly: false
          });
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
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    const p = b.parts[0];
    if (!p) return;

    const hpRatio = clamp(p.hp / p.maxHp, 0.2, 1);
    const cycle = 8.5;
    const t = b.subTimer % cycle;

    if (t < 3.4) {
      // Attack 1: High-speed Horizontal Stinger Dashes + Perpendicular Stinger Drop
      const interval = 0.65 + hpRatio * 0.25;
      if (Math.floor((b.subTimer - dt) / interval) !== Math.floor(b.subTimer / interval)) {
        const dir = player.x >= p.x ? 1 : -1;
        p.y = player.y + (Math.random() - 0.5) * 24;
        p.vx = dir * (500 + (1 - hpRatio) * 120);
        p.vy = 0;
        audio.play('swing');
        particles.spawnShockwave(p.x, p.y, '#ffd747', 95, 0.25, 3);
      }
      if (Math.abs(p.vx) > 260 && Math.random() < dt * 7) {
        projectiles.spawn({
          x: p.x,
          y: p.y,
          vx: 0,
          vy: player.y >= p.y ? 290 : -290,
          type: 'stinger',
          damage: 24,
          friendly: false
        });
      }
      p.vx *= 0.985;
    } else if (t < 6.4) {
      // Attack 2: Hover above & fire 3-way Fan Stinger Volleys
      const tx = player.x + Math.sin(b.timer * 3.4) * 160;
      const ty = player.y - 150;
      p.vx += ((tx - p.x) * 4 - p.vx) * dt * 5;
      p.vy += ((ty - p.y) * 4 - p.vy) * dt * 5;

      const shootInt = 0.52;
      if (Math.floor((b.subTimer - dt) / shootInt) !== Math.floor(b.subTimer / shootInt)) {
        const angle = Math.atan2(player.y - p.y, player.x - p.x);
        for (let k = -1; k <= 1; k++) {
          projectiles.spawn({
            x: p.x,
            y: p.y,
            vx: Math.cos(angle + k * 0.18) * 360,
            vy: Math.sin(angle + k * 0.18) * 360,
            type: 'stinger',
            damage: 25,
            friendly: false
          });
        }
        if (enemies.enemies.length < 3 && Math.random() < 0.25) {
          enemies.spawnEnemy('hornet', p.x, p.y);
        }
      }
    } else {
      // Attack 3: Royal Hive 360° Spiral Stinger Barrage!
      const tx = player.x;
      const ty = player.y - 130;
      p.vx += ((tx - p.x) * 4 - p.vx) * dt * 5;
      p.vy += ((ty - p.y) * 4 - p.vy) * dt * 5;

      const spiralInt = 0.16;
      if (Math.floor((b.subTimer - dt) / spiralInt) !== Math.floor(b.subTimer / spiralInt)) {
        const a = b.timer * 7.5;
        for (let arm = 0; arm < 2; arm++) {
          const ang = a + arm * Math.PI;
          projectiles.spawn({
            x: p.x,
            y: p.y,
            vx: Math.cos(ang) * 330,
            vy: Math.sin(ang) * 330,
            type: 'stinger',
            damage: 24,
            friendly: false
          });
        }
      }
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  private updateSkeletron(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    const head = b.parts.find((p) => p.role === 'head');
    if (!head) return;

    const cycle = 7.5;
    const t = b.subTimer % cycle;
    const spinning = t > 4.4;
    b.phase = spinning ? 2 : 1;

    if (!spinning) {
      const tx = player.x + Math.sin(b.timer * 1.8) * 70;
      const ty = player.y - 145;
      head.vx += ((tx - head.x) * 3.5 - head.vx) * dt * 4;
      head.vy += ((ty - head.y) * 3.5 - head.vy) * dt * 4;

      // Attack 1: Cast Homing Cursed Skull Fireballs in Phase 1
      const skullInt = 1.15;
      if (Math.floor((b.subTimer - dt) / skullInt) !== Math.floor(b.subTimer / skullInt)) {
        const aim = Math.atan2(player.y - head.y, player.x - head.x);
        for (let k = -1; k <= 1; k += 2) {
          projectiles.spawn({
            x: head.x,
            y: head.y,
            vx: Math.cos(aim + k * 0.25) * 320,
            vy: Math.sin(aim + k * 0.25) * 320,
            type: 'cultist_fire',
            damage: 28,
            friendly: false
          });
        }
      }
    } else {
      // Attack 2: Spinning Skull Pursuit + 4-Way Rotating Bone/Shadow Spiral!
      if (Math.floor((b.subTimer - dt) / cycle) !== Math.floor(b.subTimer / cycle)) {
        audio.play('roar');
        particles.spawnShockwave(head.x, head.y, '#ded8c3', 140, 0.35, 5);
      }
      const angle = Math.atan2(player.y - head.y, player.x - head.x);
      head.vx = Math.cos(angle) * 265;
      head.vy = Math.sin(angle) * 265;

      const spinShotInt = 0.32;
      if (Math.floor((b.subTimer - dt) / spinShotInt) !== Math.floor(b.subTimer / spinShotInt)) {
        for (let arm = 0; arm < 4; arm++) {
          const a = b.timer * 5 + (arm * Math.PI) / 2;
          projectiles.spawn({
            x: head.x,
            y: head.y,
            vx: Math.cos(a) * 310,
            vy: Math.sin(a) * 310,
            type: 'eye_laser',
            damage: 26,
            friendly: false
          });
        }
      }
    }

    head.x += head.vx * dt;
    head.y += head.vy * dt;

    // Attack 3: Hands perform alternating high-speed cross-swipes & slams
    for (const part of b.parts) {
      if (part.role === 'left_hand' || part.role === 'right_hand') {
        if (part.hp <= 0) continue;
        part.aiTimer = (part.aiTimer || 0) + dt;
        const side = part.role === 'left_hand' ? -1 : 1;
        const phaseOffset = part.role === 'left_hand' ? 0 : Math.PI;
        const swipe = Math.sin(part.aiTimer * 3.4 + phaseOffset) > 0.55;
        const tx = swipe ? player.x - side * 30 : head.x + side * 95;
        const ty = swipe ? player.y : head.y + 35 + Math.cos(part.aiTimer * 2.5) * 25;
        part.vx += ((tx - part.x) * 6 - part.vx) * dt * 6;
        part.vy += ((ty - part.y) * 6 - part.vy) * dt * 6;
        part.x += part.vx * dt;
        part.y += part.vy * dt;
      }
    }
  }

  private updateWallOfFlesh(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    const mouth = b.parts.find((p) => p.role === 'mouth');
    if (!mouth) return;

    const hpRatio = clamp(mouth.hp / mouth.maxHp, 0.1, 1);
    const sweepSpeed = 62 + (1 - hpRatio) * 65;

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
        const lunge = Math.sin(part.aiTimer * 2.8) > 0.6;
        const tx = lunge ? player.x : b.x + 105 + Math.sin(part.aiTimer * 3.5) * 45;
        const ty = lunge ? player.y : b.y + Math.cos(part.aiTimer * 2.2) * 85;
        part.x += (tx - part.x) * dt * 5.5;
        part.y += (ty - part.y) * dt * 5.5;
      }
    }

    // Attack 1: Eye Laser Spreads from Top & Bottom Eyes
    const laserInterval = 0.55 + hpRatio * 0.65;
    if (Math.floor((b.subTimer - dt) / laserInterval) !== Math.floor(b.subTimer / laserInterval)) {
      b.chargeCount++;
      for (const part of b.parts) {
        if ((part.role === 'top_eye' || part.role === 'bottom_eye') && part.hp > 0) {
          const angle = Math.atan2(player.y - part.y, player.x - part.x);
          const fan = b.chargeCount % 3 === 0 ? [-0.2, 0, 0.2] : [0];
          for (const off of fan) {
            projectiles.spawn({
              x: part.x,
              y: part.y,
              vx: Math.cos(angle + off) * 420,
              vy: Math.sin(angle + off) * 420,
              type: 'eye_laser',
              damage: 28,
              friendly: false
            });
          }
        }
      }
    }

    // Attack 2: Mouth belches Hellfire Fireballs & Bouncing Magma Spheres
    const fireInt = 1.8;
    if (Math.floor((b.subTimer - dt) / fireInt) !== Math.floor(b.subTimer / fireInt)) {
      const aim = Math.atan2(player.y - mouth.y, player.x - mouth.x);
      for (let k = -1; k <= 1; k++) {
        projectiles.spawn({
          x: mouth.x,
          y: mouth.y,
          vx: Math.cos(aim + k * 0.24) * 360,
          vy: Math.sin(aim + k * 0.24) * 360,
          type: 'golem_fireball',
          damage: 32,
          friendly: false
        });
      }
    }

    // Attack 3: Sweeping Hellfire Deathray every 7.5s!
    if (Math.floor((b.subTimer - dt) / 7.5) !== Math.floor(b.subTimer / 7.5)) {
      const aim = Math.atan2(player.y - mouth.y, player.x - mouth.x);
      b.deathray = {
        active: true,
        originX: mouth.x,
        originY: mouth.y,
        angle: aim - 0.5,
        angularVel: 0.65,
        timer: 1.5,
        color: '#ff384c'
      };
      audio.play('laser');
      particles.spawnShockwave(mouth.x, mouth.y, '#ff384c', 160, 0.35, 5);
    }
    if (b.deathray.active) {
      b.deathray.originX = mouth.x;
      b.deathray.originY = mouth.y;
    }
  }

  private updateTheTwins(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    for (const part of b.parts) {
      if (part.hp <= 0) continue;
      part.aiTimer = (part.aiTimer || 0) + dt;

      if (part.phase === 1 && part.hp <= part.maxHp * 0.55) {
        part.phase = 2;
        part.defense += 8;
        audio.play('roar');
        particles.spawnShockwave(part.x, part.y, part.role === 'retinazer' ? '#ff2942' : '#78ff38', 180, 0.4, 6);
        particles.triggerShake(10, 0.3);
      }

      if (part.role === 'retinazer') {
        const tx = player.x - 195 * Math.sign(player.x - part.x || 1);
        const ty = player.y - 135 + Math.sin(part.aiTimer * 2.5) * 50;
        part.vx += ((tx - part.x) * 4 - part.vx) * dt * 4;
        part.vy += ((ty - part.y) * 4 - part.vy) * dt * 4;
        part.x += part.vx * dt;
        part.y += part.vy * dt;

        // Retinazer Attack 1: Rapid Death Lasers + 3-Way Laser Fan every 3rd burst
        const fireInt = part.phase === 1 ? 0.85 : 0.34;
        if (Math.floor((part.aiTimer - dt) / fireInt) !== Math.floor(part.aiTimer / fireInt)) {
          const a = Math.atan2(player.y - part.y, player.x - part.x);
          const spreadCount = part.phase === 2 && Math.floor(part.aiTimer / fireInt) % 3 === 0 ? 3 : 1;
          for (let s = 0; s < spreadCount; s++) {
            const off = (s - (spreadCount - 1) * 0.5) * 0.2;
            projectiles.spawn({
              x: part.x,
              y: part.y,
              vx: Math.cos(a + off) * 500,
              vy: Math.sin(a + off) * 500,
              type: 'death_laser',
              damage: part.phase === 1 ? 36 : 44,
              friendly: false
            });
          }
        }

        // Retinazer Attack 2 (Phase 2): Sweeping Red Orbital Deathray every 6.5s
        if (part.phase === 2 && Math.floor((part.aiTimer - dt) / 6.5) !== Math.floor(part.aiTimer / 6.5)) {
          const a = Math.atan2(player.y - part.y, player.x - part.x);
          b.deathray = {
            active: true,
            originX: part.x,
            originY: part.y,
            angle: a - 0.55,
            angularVel: 0.75,
            timer: 1.4,
            color: '#ff2942'
          };
          audio.play('laser');
        }
        if (b.deathray.active) {
          b.deathray.originX = part.x;
          b.deathray.originY = part.y;
        }
      } else if (part.role === 'spazmatism') {
        const cycle = part.aiTimer % 5.4;
        if (cycle < 3.0) {
          // Spazmatism Attack 1: Hover & Cursed Flamethrower Cone
          const tx = player.x + 175;
          const ty = player.y - 30 + Math.cos(part.aiTimer * 3) * 60;
          part.vx += ((tx - part.x) * 4 - part.vx) * dt * 4;
          part.vy += ((ty - part.y) * 4 - part.vy) * dt * 4;

          const flameInt = part.phase === 1 ? 0.68 : 0.24;
          if (Math.floor((part.aiTimer - dt) / flameInt) !== Math.floor(part.aiTimer / flameInt)) {
            const a = Math.atan2(player.y - part.y, player.x - part.x);
            const count = part.phase === 2 ? 2 : 1;
            for (let c = 0; c < count; c++) {
              const off = (Math.random() - 0.5) * (part.phase === 2 ? 0.28 : 0.08);
              projectiles.spawn({
                x: part.x,
                y: part.y,
                vx: Math.cos(a + off) * (part.phase === 1 ? 400 : 350),
                vy: Math.sin(a + off) * (part.phase === 1 ? 400 : 350),
                type: 'cursed_flame',
                damage: 40,
                friendly: false
              });
            }
          }
        } else {
          // Spazmatism Attack 2: Aggressive Berserk Dash Chain + Cursed Ring Nova
          const dashInt = part.phase === 1 ? 0.65 : 0.45;
          if (Math.floor((part.aiTimer - dt) / dashInt) !== Math.floor(part.aiTimer / dashInt)) {
            const a = Math.atan2(player.y - part.y, player.x - part.x);
            part.vx = Math.cos(a) * (part.phase === 1 ? 510 : 600);
            part.vy = Math.sin(a) * (part.phase === 1 ? 510 : 600);
            particles.spawnShockwave(part.x, part.y, '#78ff38', 90, 0.22, 3);
            if (part.phase === 2) {
              for (let k = 0; k < 6; k++) {
                const ang = (k / 6) * Math.PI * 2;
                projectiles.spawn({
                  x: part.x,
                  y: part.y,
                  vx: Math.cos(ang) * 290,
                  vy: Math.sin(ang) * 290,
                  type: 'cursed_flame',
                  damage: 38,
                  friendly: false
                });
              }
            }
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
    projectiles: ProjectileManager,
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    const head = b.parts[0];
    if (!head) return;

    const charging = (b.subTimer % 6.5) > 4.8;
    const targetX = charging ? player.x : player.x + Math.cos(b.timer * 1.4) * 190;
    const targetY = charging ? player.y : player.y + Math.sin(b.timer * 2.1) * 170;
    const desiredAngle = Math.atan2(targetY - head.y, targetX - head.x);
    const spd = charging ? 450 : 330;
    head.vx += (Math.cos(desiredAngle) * spd - head.vx) * Math.min(1, dt * (charging ? 5.0 : 3.2));
    head.vy += (Math.sin(desiredAngle) * spd - head.vy) * Math.min(1, dt * (charging ? 5.0 : 3.2));
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

    // Attack 1: Body segments fire synchronized Red Probe Lasers
    const laserInt = 0.45;
    if (Math.floor((b.subTimer - dt) / laserInt) !== Math.floor(b.subTimer / laserInt)) {
      for (let s = 0; s < 2; s++) {
        const randomSeg = b.parts[Math.floor(Math.random() * b.parts.length)];
        if (randomSeg) {
          const a = Math.atan2(player.y - randomSeg.y, player.x - randomSeg.x);
          projectiles.spawn({
            x: randomSeg.x,
            y: randomSeg.y,
            vx: Math.cos(a) * 390,
            vy: Math.sin(a) * 390,
            type: 'death_laser',
            damage: 38,
            friendly: false
          });
        }
      }
    }

    // Attack 2: Head 8-Way Radial Laser Nova + Plasma Mine Drop every 4.2s
    if (Math.floor((b.subTimer - dt) / 4.2) !== Math.floor(b.subTimer / 4.2)) {
      audio.play('laser');
      particles.spawnShockwave(head.x, head.y, '#ff2942', 140, 0.35, 5);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        projectiles.spawn({
          x: head.x,
          y: head.y,
          vx: Math.cos(a) * 360,
          vy: Math.sin(a) * 360,
          type: 'death_laser',
          damage: 38,
          friendly: false
        });
      }
      const tail = b.parts[b.parts.length - 1];
      if (tail) {
        projectiles.spawn({
          x: tail.x,
          y: tail.y,
          vx: (Math.random() - 0.5) * 180,
          vy: -160,
          type: 'spiky_ball',
          damage: 42,
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
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    const head = b.parts.find((p) => p.role === 'head');
    if (!head) return;

    const spinning = (b.subTimer % 8.0) > 4.8;
    b.phase = spinning ? 2 : 1;

    if (!spinning) {
      const tx = player.x + Math.sin(b.timer * 2) * 75;
      const ty = player.y - 155;
      head.vx += ((tx - head.x) * 4 - head.vx) * dt * 4;
      head.vy += ((ty - head.y) * 4 - head.vy) * dt * 4;
    } else {
      if (Math.floor((b.subTimer - dt) / 8.0) !== Math.floor(b.subTimer / 8.0)) {
        audio.play('roar');
        particles.spawnShockwave(head.x, head.y, '#ff2942', 165, 0.4, 5);
      }
      const a = Math.atan2(player.y - head.y, player.x - head.x);
      head.vx = Math.cos(a) * 295;
      head.vy = Math.sin(a) * 295;

      // Head Spin Attack: 6-way Rotating Death Laser Ring!
      if (Math.floor((b.subTimer - dt) / 0.45) !== Math.floor(b.subTimer / 0.45)) {
        for (let k = 0; k < 6; k++) {
          const ang = b.timer * 4 + (k * Math.PI * 2) / 6;
          projectiles.spawn({
            x: head.x,
            y: head.y,
            vx: Math.cos(ang) * 370,
            vy: Math.sin(ang) * 370,
            type: 'death_laser',
            damage: 40,
            friendly: false
          });
        }
      }
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
        if (Math.floor((part.aiTimer - dt) / 0.95) !== Math.floor(part.aiTimer / 0.95)) {
          const a = Math.atan2(player.y - part.y, player.x - part.x);
          for (let s = -1; s <= 1; s++) {
            projectiles.spawn({
              x: part.x,
              y: part.y,
              vx: Math.cos(a + s * 0.16) * 460,
              vy: Math.sin(a + s * 0.16) * 460,
              type: 'death_laser',
              damage: 42,
              friendly: false
            });
          }
        }
      } else if (part.role === 'prime_cannon') {
        ox = 95;
        oy = -40;
        if (Math.floor((part.aiTimer - dt) / 1.25) !== Math.floor(part.aiTimer / 1.25)) {
          const a = Math.atan2(player.y - part.y, player.x - part.x);
          for (let g = -1; g <= 1; g += 2) {
            projectiles.spawn({
              x: part.x,
              y: part.y,
              vx: Math.cos(a + g * 0.2) * 350,
              vy: Math.sin(a + g * 0.2) * 350 - 90,
              type: 'spiky_ball',
              damage: 46,
              friendly: false
            });
          }
        }
      } else if (part.role === 'prime_saw' || part.role === 'prime_vice') {
        const side = part.role === 'prime_saw' ? -85 : 85;
        const lunge = Math.sin(part.aiTimer * 3.8 + (part.role === 'prime_saw' ? 0 : Math.PI)) > 0.5;
        ox = lunge ? player.x - head.x : side;
        oy = lunge ? player.y - head.y : 55;
      }

      const tx = head.x + ox;
      const ty = head.y + oy;
      part.x += (tx - part.x) * dt * 6.5;
      part.y += (ty - part.y) * dt * 6.5;
    }
  }

  private updatePlantera(
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
      p.defense = 14;
      p.contactDamage = 76;
      audio.play('roar');
      particles.spawnShockwave(p.x, p.y, '#ff59b8', 210, 0.45, 7);
      particles.triggerShake(12, 0.35);
    }

    const angle = Math.atan2(player.y - p.y, player.x - p.x);
    const isLunging = b.phase === 2 && (b.subTimer % 3.6) > 2.6;
    const spd = isLunging ? 420 : b.phase === 1 ? 165 : 280;
    p.vx += (Math.cos(angle) * spd - p.vx) * dt * (isLunging ? 6 : 3.5);
    p.vy += (Math.sin(angle) * spd - p.vy) * dt * (isLunging ? 6 : 3.5);
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Attack 1: Poison Seed Fan Volleys + Bouncing Thorn Balls
    const shootInt = b.phase === 1 ? 0.52 : 0.42;
    if (Math.floor((b.subTimer - dt) / shootInt) !== Math.floor(b.subTimer / shootInt)) {
      b.chargeCount++;
      const count = b.chargeCount % 3 === 0 ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const off = (i - (count - 1) * 0.5) * 0.22;
        projectiles.spawn({
          x: p.x,
          y: p.y,
          vx: Math.cos(angle + off) * 440,
          vy: Math.sin(angle + off) * 440,
          type: 'plantera_seed',
          damage: 48,
          friendly: false
        });
      }
      if (b.chargeCount % 2 === 0) {
        projectiles.spawn({
          x: p.x,
          y: p.y,
          vx: Math.cos(angle) * 280 + (Math.random() - 0.5) * 140,
          vy: -180,
          type: 'spiky_ball',
          damage: 54,
          friendly: false
        });
      }
    }

    // Attack 2: 8-Way Jungle Spore Ring Burst every 3.8s!
    if (Math.floor((b.subTimer - dt) / 3.8) !== Math.floor(b.subTimer / 3.8)) {
      particles.spawnShockwave(p.x, p.y, '#65d938', 130, 0.32, 4);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + b.timer;
        projectiles.spawn({
          x: p.x,
          y: p.y,
          vx: Math.cos(a) * 330,
          vy: Math.sin(a) * 330,
          type: 'plantera_seed',
          damage: 46,
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
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    const body = b.parts.find((p) => p.role === 'body');
    const head = b.parts.find((p) => p.role === 'head');
    if (!body) return;

    const wasFallingFast = body.vy > 300;
    body.vy = Math.min(520, body.vy + 780 * dt);
    const footTy = Math.floor((body.y + body.radius) / 16);
    const tx = Math.floor(body.x / 16);
    if (body.vy >= 0 && world.isSolid(tx, footTy)) {
      body.y = footTy * 16 - body.radius;
      // Attack 1: Earthquake Ground Slam + 6-Way Solar Fireball Eruption!
      if (wasFallingFast) {
        particles.spawnShockwave(body.x, body.y, '#ff8c1a', 190, 0.4, 6);
        particles.triggerShake(10, 0.3);
        for (let k = 0; k < 6; k++) {
          const ang = -Math.PI + (k / 5) * Math.PI;
          projectiles.spawn({
            x: body.x,
            y: body.y - 10,
            vx: Math.cos(ang) * 380,
            vy: Math.sin(ang) * 380,
            type: 'golem_fireball',
            damage: 54,
            friendly: false
          });
        }
      }
      body.vy = 0;
      body.vx *= 0.75;
      if (b.subTimer >= 1.45) {
        b.subTimer = 0;
        body.vy = -420;
        body.vx = Math.sign(player.x - body.x) * 260;
        audio.play('explosion');
      }
    }
    body.x += body.vx * dt;
    body.y += body.vy * dt;

    // Attack 2: Golem Head detaches when damaged & fires 3-Way Solar Laser Fans
    if (head) {
      head.aiTimer = (head.aiTimer || 0) + dt;
      if (head.hp <= 2500 || body.hp <= body.maxHp * 0.55) {
        head.invulnerable = true;
        b.phase = 2;
        const htx = player.x + Math.cos(head.aiTimer * 2) * 150;
        const hty = player.y - 155 + Math.sin(head.aiTimer * 3) * 40;
        head.x += (htx - head.x) * dt * 4.5;
        head.y += (hty - head.y) * dt * 4.5;
      } else {
        head.x = body.x;
        head.y = body.y - 44;
      }

      const beamInt = b.phase === 2 ? 0.65 : 0.85;
      if (Math.floor((head.aiTimer - dt) / beamInt) !== Math.floor(head.aiTimer / beamInt)) {
        const a = Math.atan2(player.y - head.y, player.x - head.x);
        const count = b.phase === 2 ? 3 : 2;
        for (let c = 0; c < count; c++) {
          const off = (c - (count - 1) * 0.5) * 0.2;
          projectiles.spawn({
            x: head.x,
            y: head.y,
            vx: Math.cos(a + off) * 490,
            vy: Math.sin(a + off) * 490,
            type: b.phase === 2 ? 'golem_beam' : 'golem_fireball',
            damage: 54,
            friendly: false
          });
        }
      }
    }

    // Attack 3: Fists punch out on chains + Phase 2 Sweeping Sun Beam
    for (const fist of b.parts) {
      if ((fist.role === 'left_fist' || fist.role === 'right_fist') && fist.hp > 0) {
        fist.aiTimer = (fist.aiTimer || 0) + dt;
        const side = fist.role === 'left_fist' ? -1 : 1;
        const punching = Math.sin(fist.aiTimer * 4.2 + (side < 0 ? 0 : Math.PI)) > 0.45;
        const ftx = punching ? player.x : body.x + side * 52;
        const fty = punching ? player.y : body.y;
        fist.x += (ftx - fist.x) * dt * 10;
        fist.y += (fty - fist.y) * dt * 10;
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

    if (b.phase === 1 && p.hp <= p.maxHp * 0.6) {
      b.phase = 2;
      audio.play('roar');
      particles.spawnShockwave(p.x, p.y, '#1cb3ff', 200, 0.45, 6);
      particles.triggerShake(10, 0.3);
    } else if (b.phase === 2 && p.hp <= p.maxHp * 0.28) {
      b.phase = 3;
      audio.play('roar');
      particles.spawnShockwave(p.x, p.y, '#00ffcc', 240, 0.5, 8);
      particles.triggerFlash('#1cb3ff', 0.3);
    }

    const dashInt = b.phase === 1 ? 0.68 : b.phase === 2 ? 0.52 : 0.4;
    if (Math.floor((b.subTimer - dt) / dashInt) !== Math.floor(b.subTimer / dashInt)) {
      b.chargeCount++;
      if (b.phase === 3 && b.chargeCount % 3 === 0) {
        // Phase 3 Attack: Teleport Ambush Behind Player + Oceanic Ring!
        particles.spawnShockwave(p.x, p.y, '#1cb3ff', 140, 0.3, 4);
        p.x = player.x - player.facing * 175;
        p.y = player.y - 35;
        particles.spawnShockwave(p.x, p.y, '#00ffcc', 140, 0.3, 4);
      }

      const a = Math.atan2(player.y - p.y, player.x - p.x);
      const spd = b.phase === 1 ? 530 : b.phase === 2 ? 610 : 680;
      p.vx = Math.cos(a) * spd;
      p.vy = Math.sin(a) * spd;

      // Attack 2: Detonating Bubble Fan on every 2nd dash
      if (b.chargeCount % 2 === 0) {
        const count = b.phase >= 2 ? 5 : 3;
        for (let k = 0; k < count; k++) {
          const off = (k - (count - 1) * 0.5) * 0.2;
          projectiles.spawn({
            x: p.x,
            y: p.y,
            vx: Math.cos(a + off) * 440,
            vy: Math.sin(a + off) * 440,
            type: 'sharknado_bolt',
            damage: 58,
            friendly: false
          });
        }
      }

      // Attack 3: Cthulhunado 10-Bolt Vortex Nova every 5th dash!
      if (b.chargeCount % 5 === 0) {
        audio.play('magic');
        particles.spawnShockwave(p.x, p.y, '#1cb3ff', 170, 0.4, 5);
        for (let v = 0; v < 10; v++) {
          const ang = (v / 10) * Math.PI * 2;
          projectiles.spawn({
            x: p.x,
            y: p.y,
            vx: Math.cos(ang) * 390,
            vy: Math.sin(ang) * 390,
            type: 'sharknado_bolt',
            damage: 60,
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

    // Teleport around player every 2.2 seconds and cycle through 4 Ancient Ritual Spells!
    const tpInt = 2.2;
    if (Math.floor((b.subTimer - dt) / tpInt) !== Math.floor(b.subTimer / tpInt)) {
      particles.spawnShockwave(p.x, p.y, '#ffd747', 110, 0.28, 4);
      particles.spawn(p.x, p.y, '#ffd747', 20, 140, 3.5, 0, true);
      const angle = (Math.random() - 0.5) * Math.PI * 0.9 - Math.PI * 0.5;
      p.x = player.x + Math.cos(angle) * 210;
      p.y = player.y + Math.sin(angle) * 175;
      particles.spawnShockwave(p.x, p.y, '#ffd747', 130, 0.32, 4);
      particles.spawn(p.x, p.y, '#ffd747', 20, 140, 3.5, 0, true);
      audio.play('magic');

      b.chargeCount++;
      const spell = b.chargeCount % 4;
      const aim = Math.atan2(player.y - p.y, player.x - p.x);

      if (spell === 0) {
        // Spell 1: 5-Orb Homing Fireball Barrage
        for (let i = -2; i <= 2; i++) {
          projectiles.spawn({
            x: p.x,
            y: p.y,
            vx: Math.cos(aim + i * 0.2) * 390,
            vy: Math.sin(aim + i * 0.2) * 390,
            type: 'cultist_fire',
            damage: 58,
            friendly: false
          });
        }
      } else if (spell === 1) {
        // Spell 2: 8-Way Rotating Ice Mist Nova
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + b.timer;
          projectiles.spawn({
            x: p.x,
            y: p.y,
            vx: Math.cos(a) * 350,
            vy: Math.sin(a) * 350,
            type: 'cultist_ice',
            damage: 56,
            friendly: false
          });
        }
      } else if (spell === 2) {
        // Spell 3: Ancient Lightning Spear Volley
        audio.play('laser');
        for (let i = -2; i <= 2; i++) {
          projectiles.spawn({
            x: p.x,
            y: p.y,
            vx: Math.cos(aim + i * 0.1) * 540,
            vy: Math.sin(aim + i * 0.1) * 540,
            type: 'golem_beam',
            damage: 60,
            friendly: false
          });
        }
      } else {
        // Spell 4: Ancient Starlight Ring + Sweeping Ritual Beam
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          projectiles.spawn({
            x: p.x,
            y: p.y,
            vx: Math.cos(a) * 410,
            vy: Math.sin(a) * 410,
            type: 'phantasmal_bolt',
            damage: 58,
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
    audio: AudioManager,
    particles: ParticleSystem
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
        particles.spawnShockwave(core.x, core.y, '#3be8d1', 260, 0.55, 8);
        particles.triggerFlash('#3be8d1', 0.35);
      }
    }

    // Attack 1: Phantasmal Bolt Fans & Spheres from Hands/Core
    const boltInt = 1.05;
    if (Math.floor((b.subTimer - dt) / boltInt) !== Math.floor(b.subTimer / boltInt)) {
      b.chargeCount++;
      for (const eye of [leftHand, rightHand, headEye, core]) {
        if (!eye || eye.hp <= 0 || eye.invulnerable) continue;
        const a = Math.atan2(player.y - eye.y, player.x - eye.x);
        const fan = b.chargeCount % 2 === 0 ? [-0.18, 0, 0.18] : [0];
        for (const off of fan) {
          projectiles.spawn({
            x: eye.x,
            y: eye.y,
            vx: Math.cos(a + off) * 490,
            vy: Math.sin(a + off) * 490,
            type: eye.role === 'core' ? 'phantasmal_sphere' : 'phantasmal_bolt',
            damage: 64,
            friendly: false
          });
        }
      }
    }

    // Attack 2: 12-Bolt Cosmic Phantasmal Ring Burst every 4.2 seconds!
    if (Math.floor((b.subTimer - dt) / 4.2) !== Math.floor(b.subTimer / 4.2)) {
      const origin = core && !core.invulnerable ? core : headEye;
      if (origin) {
        particles.spawnShockwave(origin.x, origin.y, '#3be8d1', 180, 0.4, 5);
        for (let k = 0; k < 12; k++) {
          const ang = (k / 12) * Math.PI * 2 + b.timer;
          projectiles.spawn({
            x: origin.x,
            y: origin.y,
            vx: Math.cos(ang) * 400,
            vy: Math.sin(ang) * 400,
            type: k % 2 === 0 ? 'phantasmal_sphere' : 'phantasmal_bolt',
            damage: 64,
            friendly: false
          });
        }
      }
    }

    // Attack 3: Sweeping Phantasmal Deathray every 6.5 seconds!
    const rayCycle = b.phase === 2 ? 5.2 : 6.5;
    if (Math.floor((b.subTimer - dt) / rayCycle) !== Math.floor(b.subTimer / rayCycle)) {
      const origin = headEye && headEye.hp > 0 ? headEye : core;
      if (origin) {
        const baseA = Math.atan2(player.y - origin.y, player.x - origin.x);
        b.deathray = {
          active: true,
          originX: origin.x,
          originY: origin.y,
          angle: baseA - 0.65,
          angularVel: b.phase === 2 ? 0.85 : 0.72,
          timer: 1.85,
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
  // CALAMITY MOD BOSS AI BEHAVIORS (Tiers 15..18)
  // =========================================================

  private updateProvidence(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    const p = b.parts[0];
    if (!p) return;

    if (b.phase === 1 && p.hp < p.maxHp * 0.5) {
      b.phase = 2;
      audio.play('roar');
      particles.spawnShockwave(p.x, p.y, '#ffd747', 260, 0.55, 7);
    }

    // Hover above player in a sweeping figure-8 profaned flight pattern
    const tx = player.x + Math.sin(b.timer * 1.6) * 240;
    const ty = player.y - 165 + Math.cos(b.timer * 3.2) * 55;
    p.vx += (tx - p.x) * 4.5 * dt;
    p.vy += (ty - p.y) * 4.5 * dt;
    p.vx *= 0.91;
    p.vy *= 0.91;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Attack 1: Profaned Spear Fan every 1.2s
    const spearCycle = b.phase === 2 ? 0.95 : 1.25;
    if (Math.floor((b.timer - dt) / spearCycle) !== Math.floor(b.timer / spearCycle)) {
      const baseA = Math.atan2(player.y - p.y, player.x - p.x);
      for (const off of [-0.32, -0.16, 0, 0.16, 0.32]) {
        projectiles.spawn({
          x: p.x,
          y: p.y,
          vx: Math.cos(baseA + off) * 540,
          vy: Math.sin(baseA + off) * 540,
          type: 'profaned_spear',
          damage: 72,
          friendly: false
        });
      }
      audio.play('magic');
    }

    // Attack 2: Cocoon 14-Star Radial Eruption every 3.6s
    if (Math.floor((b.subTimer - dt) / 3.6) !== Math.floor(b.subTimer / 3.6)) {
      particles.spawnShockwave(p.x, p.y, '#2bff6e', 200, 0.4, 5);
      for (let k = 0; k < 14; k++) {
        const ang = (k / 14) * Math.PI * 2 + b.timer;
        projectiles.spawn({
          x: p.x,
          y: p.y,
          vx: Math.cos(ang) * 420,
          vy: Math.sin(ang) * 420,
          type: k % 2 === 0 ? 'profaned_spear' : 'golem_fireball',
          damage: 68,
          friendly: false
        });
      }
    }

    // Attack 3: Sweeping Holy Ray of Day/Night every 5.8s
    if (Math.floor((b.subTimer - dt) / 5.8) !== Math.floor(b.subTimer / 5.8)) {
      const baseA = Math.atan2(player.y - p.y, player.x - p.x);
      b.deathray = {
        active: true,
        originX: p.x,
        originY: p.y,
        angle: baseA - 0.7,
        angularVel: 0.9,
        timer: 1.7,
        color: '#ffd747'
      };
      audio.play('laser');
    }
    if (b.deathray.active) {
      b.deathray.originX = p.x;
      b.deathray.originY = p.y;
    }
  }

  private updateDevourerOfGods(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    audio: AudioManager,
    particles: ParticleSystem,
    onChat: (msg: string, color?: string) => void
  ): void {
    const head = b.parts[0];
    if (!head) return;

    if (b.phase === 1 && head.hp < head.maxHp * 0.55) {
      b.phase = 2;
      audio.play('roar');
      particles.spawnShockwave(head.x, head.y, '#ff29c6', 300, 0.6, 8);
      onChat("The Devourer of Gods: \"IT'S NOT OVER YET, KID!\"", '#ff29c6');
    }

    // High-speed Cosmic Worm Predatory Chase
    const a = Math.atan2(player.y - head.y, player.x - head.x);
    const targetSpeed = b.phase === 2 ? 560 : 470;
    head.vx += Math.cos(a) * 1150 * dt;
    head.vy += Math.sin(a) * 1150 * dt;
    const spd = Math.hypot(head.vx, head.vy);
    if (spd > targetSpeed) {
      head.vx = (head.vx / spd) * targetSpeed;
      head.vy = (head.vy / spd) * targetSpeed;
    }
    head.x += head.vx * dt;
    head.y += head.vy * dt;

    // Follow-the-leader chain kinematics for all 26 segments
    for (let i = 1; i < b.parts.length; i++) {
      const seg = b.parts[i];
      const prev = b.parts[i - 1];
      const dx = prev.x - seg.x;
      const dy = prev.y - seg.y;
      const d = Math.hypot(dx, dy) || 1;
      const spacing = 24;
      if (d > spacing) {
        seg.x = prev.x - (dx / d) * spacing;
        seg.y = prev.y - (dy / d) * spacing;
      }
      seg.vx = dx * 10;
      seg.vy = dy * 10;
    }

    // Attack 1: Body Segment Cosmic Laser Barrage every 1.4s
    if (Math.floor((b.timer - dt) / 1.4) !== Math.floor(b.timer / 1.4)) {
      const idx = 2 + Math.floor(Math.random() * (b.parts.length - 4));
      const seg = b.parts[idx];
      if (seg) {
        const la = Math.atan2(player.y - seg.y, player.x - seg.x);
        for (const off of [-0.15, 0, 0.15]) {
          projectiles.spawn({
            x: seg.x,
            y: seg.y,
            vx: Math.cos(la + off) * 520,
            vy: Math.sin(la + off) * 520,
            type: 'cosmic_blade',
            damage: 76,
            friendly: false
          });
        }
        audio.play('laser');
      }
    }

    // Attack 2: Dimensional Laser Wall Grid every 4.2s!
    if (Math.floor((b.subTimer - dt) / 4.2) !== Math.floor(b.subTimer / 4.2)) {
      particles.spawnShockwave(player.x, player.y, '#3be8d1', 220, 0.4, 5);
      for (let k = -2; k <= 2; k++) {
        // Horizontal laser line
        projectiles.spawn({
          x: player.x - 480,
          y: player.y + k * 115,
          vx: 560,
          vy: 0,
          type: 'phantasmal_bolt',
          damage: 74,
          friendly: false
        });
        // Vertical laser line
        projectiles.spawn({
          x: player.x + k * 130,
          y: player.y - 440,
          vx: 0,
          vy: 560,
          type: 'death_laser',
          damage: 74,
          friendly: false
        });
      }
      audio.play('laser');
    }

    // Attack 3 (Phase 2): Cosmic Rift Warp Dash + God Slayer Fireball Burst every 5.0s!
    if (b.phase === 2 && Math.floor((b.subTimer - dt) / 5.0) !== Math.floor(b.subTimer / 5.0)) {
      const side = Math.random() < 0.5 ? -1 : 1;
      head.x = player.x + side * 320;
      head.y = player.y - 80;
      const chargeA = Math.atan2(player.y - head.y, player.x - head.x);
      head.vx = Math.cos(chargeA) * 760;
      head.vy = Math.sin(chargeA) * 760;
      particles.spawnShockwave(head.x, head.y, '#ff29c6', 240, 0.45, 6);
      audio.play('roar');
    }
  }

  private updateYharon(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    audio: AudioManager,
    particles: ParticleSystem,
    onChat: (msg: string, color?: string) => void
  ): void {
    const p = b.parts[0];
    if (!p) return;

    // Phase 2 Rebirth at 45% HP!
    if (b.phase === 1 && p.hp < p.maxHp * 0.45) {
      b.phase = 2;
      p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.2)); // Rebirth heal!
      audio.play('roar');
      particles.triggerShake(16, 0.5);
      particles.spawnShockwave(p.x, p.y, '#ffaa00', 320, 0.65, 9);
      onChat('The enemy ascended beyond your control! YHARON REBORN!', '#ffaa00');
    }

    // Attack 1: High-Speed Phoenix Dragon Charges + Tracking Hover
    if (b.subTimer > (b.phase === 2 ? 1.05 : 1.35)) {
      b.subTimer = 0;
      b.chargeCount++;
      const a = Math.atan2(player.y - p.y, player.x - p.x);

      if (b.chargeCount % 3 !== 0) {
        // Blazing Phoenix Charge!
        const spd = b.phase === 2 ? 780 : 650;
        p.vx = Math.cos(a) * spd;
        p.vy = Math.sin(a) * spd;
        audio.play('roar');
        particles.spawn(p.x, p.y, '#ffaa00', 18, 180, 4.5, 0, true);
      } else {
        // Attack 2: Flarenado 14-Fireball Ring Eruption!
        particles.spawnShockwave(p.x, p.y, '#ff551c', 220, 0.45, 6);
        const ringCount = b.phase === 2 ? 16 : 12;
        for (let k = 0; k < ringCount; k++) {
          const ang = (k / ringCount) * Math.PI * 2 + b.timer;
          projectiles.spawn({
            x: p.x,
            y: p.y,
            vx: Math.cos(ang) * 480,
            vy: Math.sin(ang) * 480,
            type: 'yharon_fireball',
            damage: 82,
            friendly: false
          });
        }
        audio.play('explosion');
      }
    }

    // Attack 3: Dragon Fireball Fan Volley every 1.8s
    if (Math.floor((b.timer - dt) / 1.8) !== Math.floor(b.timer / 1.8)) {
      const baseA = Math.atan2(player.y - p.y, player.x - p.x);
      for (const off of [-0.28, -0.14, 0, 0.14, 0.28]) {
        projectiles.spawn({
          x: p.x,
          y: p.y,
          vx: Math.cos(baseA + off) * 580,
          vy: Math.sin(baseA + off) * 580,
          type: 'yharon_fireball',
          damage: 78,
          friendly: false
        });
      }
    }

    p.vx *= 0.96;
    p.vy *= 0.96;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  private updateSupremeCalamitas(
    b: BossInstance,
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    const p = b.parts[0];
    if (!p) return;

    if (b.phase === 1 && p.hp < p.maxHp * 0.5) {
      b.phase = 2;
      audio.play('roar');
      particles.triggerShake(16, 0.5);
      particles.spawnShockwave(p.x, p.y, '#ff1938', 300, 0.6, 8);
    }

    // Hover above/around player with swift crimson dashes
    const tx = player.x + Math.cos(b.timer * 2.1) * 230;
    const ty = player.y - 150 + Math.sin(b.timer * 3.4) * 70;
    p.vx += (tx - p.x) * 5.5 * dt;
    p.vy += (ty - p.y) * 5.5 * dt;
    p.vx *= 0.90;
    p.vy *= 0.90;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Attack 1: Brimstone Hellblast Fan every 1.05s
    const fanCycle = b.phase === 2 ? 0.85 : 1.1;
    if (Math.floor((b.timer - dt) / fanCycle) !== Math.floor(b.timer / fanCycle)) {
      const baseA = Math.atan2(player.y - p.y, player.x - p.x);
      for (const off of [-0.3, -0.15, 0, 0.15, 0.3]) {
        projectiles.spawn({
          x: p.x,
          y: p.y,
          vx: Math.cos(baseA + off) * 580,
          vy: Math.sin(baseA + off) * 580,
          type: 'brimstone_hellblast',
          damage: 86,
          friendly: false
        });
      }
      audio.play('magic');
    }

    // Attack 2: Bullet-Hell Brimstone Curtain every 3.8s!
    if (Math.floor((b.subTimer - dt) / 3.8) !== Math.floor(b.subTimer / 3.8)) {
      particles.spawnShockwave(p.x, p.y, '#ff1938', 220, 0.4, 6);
      for (let k = -3; k <= 3; k++) {
        projectiles.spawn({
          x: player.x + k * 110 + (Math.random() - 0.5) * 35,
          y: player.y - 420,
          vx: 0,
          vy: 480,
          type: 'brimstone_hellblast',
          damage: 82,
          friendly: false
        });
      }
      audio.play('explosion');
    }

    // Attack 3: Sweeping Abyssal Brimstone Laser every 5.6s!
    if (Math.floor((b.subTimer - dt) / 5.6) !== Math.floor(b.subTimer / 5.6)) {
      const baseA = Math.atan2(player.y - p.y, player.x - p.x);
      b.deathray = {
        active: true,
        originX: p.x,
        originY: p.y,
        angle: baseA - 0.75,
        angularVel: 0.95,
        timer: 1.75,
        color: '#ff1938'
      };
      audio.play('laser');
    }
    if (b.deathray.active) {
      b.deathray.originX = p.x;
      b.deathray.originY = p.y;
    }
  }

  // =========================================================
  // PROCEDURAL PIXEL-ART BOSS RENDERER (1000x COOLER EDITION)
  // =========================================================
  render(ctx: CanvasRenderingContext2D, camX: number, camY: number, player: Player): void {
    const b = this.activeBoss;
    if (!b) return;

    ctx.save();

    // 1. Background Connectors & Grand Boss Structures
    if (b.type === 'wall_of_flesh') {
      const wx = Math.floor(b.x - camX);
      // Towering Flesh Wall with pulsing arterial glow
      const wallGrad = ctx.createLinearGradient(wx - 70, 0, wx + 20, 0);
      wallGrad.addColorStop(0, '#1f050a');
      wallGrad.addColorStop(0.65, '#6e1423');
      wallGrad.addColorStop(1, '#c92a42');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(wx - 70, 0, 85, ctx.canvas.height);

      for (let y = 0; y < ctx.canvas.height; y += 24) {
        const wobble = Math.sin(b.timer * 5 + y * 0.08) * 6;
        ctx.fillStyle = '#9e1f32';
        ctx.beginPath();
        ctx.arc(wx + 8 + wobble, y + 12, 16, 0, Math.PI * 2);
        ctx.fill();
      }
      // Sinewy Tendrils to The Hungry
      for (const p of b.parts) {
        if (p.role === 'hungry' && p.hp > 0) {
          ctx.strokeStyle = '#ff385c';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(wx + 5, b.y - camY);
          const midX = (wx + (p.x - camX)) * 0.5;
          const midY = (b.y - camY + (p.y - camY)) * 0.5 + Math.sin(b.timer * 8) * 16;
          ctx.quadraticCurveTo(midX, midY, p.x - camX, p.y - camY);
          ctx.stroke();
        }
      }
    } else if (b.type === 'the_twins' && b.parts.length === 2) {
      const [p1, p2] = b.parts;
      if (p1.hp > 0 && p2.hp > 0) {
        ctx.strokeStyle = '#d92b4b';
        ctx.lineWidth = 6;
        ctx.beginPath();
        const mx = (p1.x + p2.x) * 0.5 - camX;
        const my = (p1.y + p2.y) * 0.5 - camY + Math.sin(b.timer * 6) * 22;
        ctx.moveTo(p1.x - camX, p1.y - camY);
        ctx.quadraticCurveTo(mx, my, p2.x - camX, p2.y - camY);
        ctx.stroke();
      }
    } else if (b.type === 'skeletron' || b.type === 'skeletron_prime') {
      const head = b.parts.find((p) => p.role === 'head');
      if (head) {
        const isPrime = b.type === 'skeletron_prime';
        for (const p of b.parts) {
          if (p !== head && p.hp > 0) {
            const hx = head.x - camX;
            const hy = head.y - camY;
            const px = p.x - camX;
            const py = p.y - camY;
            const elbowX = (hx + px) * 0.5 + (px < hx ? -22 : 22);
            const elbowY = (hy + py) * 0.5 - 24;
            // Articulated 2-segment bone / cyber arm
            ctx.strokeStyle = isPrime ? '#8a99ad' : '#d6cfc2';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(elbowX, elbowY);
            ctx.lineTo(px, py);
            ctx.stroke();
            // Elbow joint
            ctx.fillStyle = isPrime ? '#ff2942' : '#aba28f';
            ctx.beginPath();
            ctx.arc(elbowX, elbowY, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    } else if (b.type === 'golem') {
      const body = b.parts.find((p) => p.role === 'body');
      if (body) {
        for (const p of b.parts) {
          if ((p.role === 'left_fist' || p.role === 'right_fist') && p.hp > 0) {
            const bx = body.x - camX;
            const by = body.y - camY;
            const fx = p.x - camX;
            const fy = p.y - camY;
            // Glowing solar chain links
            const steps = 7;
            for (let s = 0; s <= steps; s++) {
              const t = s / steps;
              const lx = bx + (fx - bx) * t;
              const ly = by + (fy - by) * t;
              ctx.fillStyle = s % 2 === 0 ? '#ff9922' : '#ffee55';
              ctx.fillRect(lx - 4, ly - 4, 8, 8);
            }
          }
        }
      }
    } else if (b.type === 'plantera') {
      const p = b.parts[0];
      if (p) {
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2 + Math.sin(b.timer * 0.8 + k) * 0.4;
          const vx = p.x - camX + Math.cos(a) * 155;
          const vy = p.y - camY + Math.sin(a) * 155;
          ctx.strokeStyle = '#389c24';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(p.x - camX, p.y - camY);
          ctx.lineTo(vx, vy);
          ctx.stroke();
          // Vine hook claw
          ctx.fillStyle = '#ff59b8';
          ctx.beginPath();
          ctx.arc(vx, vy, 9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (b.type === 'moon_lord') {
      // Colossal Celestial Moon Lord Torso, Horned Brow, Tentacle Beard & Ribcage
      const mx = Math.floor(b.x - camX);
      const my = Math.floor(b.y - camY);

      // Outer cosmic aura
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(43, 230, 184, 0.16)';
      ctx.beginPath();
      ctx.arc(mx, my - 10, 145, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Shoulders & Chest Armor
      ctx.fillStyle = '#183836';
      ctx.beginPath();
      ctx.moveTo(mx - 120, my - 45);
      ctx.lineTo(mx + 120, my - 45);
      ctx.lineTo(mx + 75, my + 85);
      ctx.lineTo(mx - 75, my + 85);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#29635e';
      ctx.fillRect(mx - 72, my - 40, 144, 110);

      // Cthulhu Head & Tentacle Beard behind Head Eye
      ctx.fillStyle = '#245954';
      ctx.beginPath();
      ctx.arc(mx, my - 90, 48, 0, Math.PI * 2);
      ctx.fill();
      // Cthulhu Horns
      ctx.fillStyle = '#96cfc4';
      ctx.beginPath();
      ctx.moveTo(mx - 35, my - 115);
      ctx.lineTo(mx - 68, my - 150);
      ctx.lineTo(mx - 18, my - 128);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(mx + 35, my - 115);
      ctx.lineTo(mx + 68, my - 150);
      ctx.lineTo(mx + 18, my - 128);
      ctx.fill();

      // Writhing Cthulhu Tentacle Beard
      ctx.strokeStyle = '#2be6b8';
      ctx.lineWidth = 6;
      for (let t = -2; t <= 2; t++) {
        ctx.beginPath();
        ctx.moveTo(mx + t * 12, my - 55);
        ctx.quadraticCurveTo(
          mx + t * 18 + Math.sin(b.timer * 5 + t) * 14,
          my - 25,
          mx + t * 15,
          my - 5
        );
        ctx.stroke();
      }

      // Thoracic Ribcage around Core
      ctx.fillStyle = '#b0ded6';
      for (let r = -15; r <= 55; r += 18) {
        ctx.fillRect(mx - 56, my + r, 40, 7);
        ctx.fillRect(mx + 16, my + r, 40, 7);
      }
    }

    // 2. Render each Boss Part with Multi-Layer Pixel Art & Glow
    for (const part of b.parts) {
      if (part.hp <= 0) continue;
      const sx = Math.floor(part.x - camX);
      const sy = Math.floor(part.y - camY);
      const r = part.radius;

      // Subtle additive boss aura
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = b.isHardmode ? 'rgba(255, 60, 140, 0.14)' : 'rgba(80, 160, 255, 0.14)';
      ctx.beginPath();
      ctx.arc(sx, sy, r * 1.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (b.type === 'king_slime') {
        // Katana Ninja inside King Slime
        ctx.fillStyle = '#11131a';
        ctx.fillRect(sx - 6, sy - 8, 12, 18);
        ctx.fillStyle = '#ff2942';
        ctx.fillRect(sx - 6, sy - 6, 12, 3); // Red ninja headband
        // Royal Gel Body
        const slimeGrad = ctx.createRadialGradient(sx - r * 0.25, sy - r * 0.2, 4, sx, sy, r);
        slimeGrad.addColorStop(0, 'rgba(130, 215, 255, 0.88)');
        slimeGrad.addColorStop(0.6, 'rgba(38, 128, 255, 0.82)');
        slimeGrad.addColorStop(1, 'rgba(18, 68, 180, 0.90)');
        ctx.fillStyle = slimeGrad;
        ctx.beginPath();
        ctx.arc(sx, sy + 4, r, Math.PI, 0, false);
        ctx.lineTo(sx + r, sy + r * 0.72);
        ctx.lineTo(sx - r, sy + r * 0.72);
        ctx.closePath();
        ctx.fill();

        // Ornate Golden Crown with Gems
        ctx.fillStyle = '#ffd747';
        ctx.fillRect(sx - 22, sy - r - 8, 44, 12);
        ctx.beginPath();
        ctx.moveTo(sx - 22, sy - r - 8);
        ctx.lineTo(sx - 22, sy - r - 20);
        ctx.lineTo(sx - 11, sy - r - 10);
        ctx.lineTo(sx, sy - r - 24);
        ctx.lineTo(sx + 11, sy - r - 10);
        ctx.lineTo(sx + 22, sy - r - 20);
        ctx.lineTo(sx + 22, sy - r - 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff2942';
        ctx.fillRect(sx - 4, sy - r - 6, 8, 6);
        ctx.fillStyle = '#3be8d1';
        ctx.fillRect(sx - 16, sy - r - 5, 5, 4);
        ctx.fillRect(sx + 11, sy - r - 5, 5, 4);
      } else if (b.type === 'eye_of_cthulhu' || b.type === 'the_twins') {
        const angle = Math.atan2(player.y - part.y, player.x - part.x);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle);

        // Writhing crimson optic tendrils behind eyeball
        ctx.strokeStyle = '#c91e38';
        ctx.lineWidth = 4;
        for (let t = -2; t <= 2; t++) {
          ctx.beginPath();
          ctx.moveTo(-r * 0.7, t * 7);
          const wave = Math.sin(b.timer * 10 + t * 1.4) * 9;
          ctx.quadraticCurveTo(-r - 14, t * 9 + wave, -r - 28, t * 11 - wave);
          ctx.stroke();
        }

        const isPhase2 = (part.phase || b.phase) === 2;
        ctx.fillStyle = isPhase2 && b.type === 'the_twins' ? '#b8c4d4' : '#f2f2f8';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Bloodshot veins on sclera
        ctx.strokeStyle = '#d92b3a';
        ctx.lineWidth = 2;
        for (let v = -1; v <= 1; v += 2) {
          ctx.beginPath();
          ctx.moveTo(-r * 0.6, v * r * 0.4);
          ctx.lineTo(0, v * r * 0.65);
          ctx.stroke();
        }

        if (isPhase2) {
          if (part.role === 'retinazer') {
            // Mechanical Laser Turret Barrel
            ctx.fillStyle = '#475263';
            ctx.fillRect(4, -10, r + 10, 20);
            ctx.fillStyle = '#ff2942';
            ctx.fillRect(10, -5, r + 6, 10);
          } else {
            // Savage Fanged Maw (Eye of Cthulhu Phase 2 & Spazmatism Phase 2)
            ctx.fillStyle = part.role === 'spazmatism' ? '#1c4f1c' : '#6e0d1c';
            ctx.beginPath();
            ctx.arc(r * 0.25, 0, r * 0.72, -1.15, 1.15);
            ctx.lineTo(-4, 0);
            ctx.closePath();
            ctx.fill();
            // Interlocking Razor Teeth
            ctx.fillStyle = '#ffffff';
            for (let t = -16; t <= 16; t += 8) {
              ctx.beginPath();
              ctx.moveTo(r * 0.25, t - 3);
              ctx.lineTo(r * 0.75, t);
              ctx.lineTo(r * 0.25, t + 3);
              ctx.fill();
            }
          }
        } else {
          // Detailed Multi-Ring Iris & Glossy Pupil
          const irisCol =
            part.role === 'spazmatism'
              ? '#38eb5c'
              : part.role === 'retinazer'
              ? '#ff2942'
              : '#2b6eff';
          ctx.fillStyle = irisCol;
          ctx.beginPath();
          ctx.arc(r * 0.42, 0, r * 0.46, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0d0f14';
          ctx.beginPath();
          ctx.arc(r * 0.52, 0, r * 0.22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(r * 0.38, -5, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (b.type === 'eater_of_worlds' || b.type === 'the_destroyer') {
        const isMech = b.type === 'the_destroyer';
        ctx.save();
        ctx.translate(sx, sy);
        const segAngle = Math.atan2(part.vy || 0, part.vx || 1);
        ctx.rotate(segAngle);

        // Armored Segment Carapace
        ctx.fillStyle = isMech ? '#6c7a8c' : '#563882';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isMech ? '#b0c0d4' : '#8559c9';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Pincer Mandibles on Head Segments
        if (part.role === 'head') {
          ctx.fillStyle = isMech ? '#d0dce8' : '#a4cf55';
          ctx.beginPath();
          ctx.moveTo(r * 0.6, -r * 0.6);
          ctx.lineTo(r + 14, -r * 0.3);
          ctx.lineTo(r * 0.5, -2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(r * 0.6, r * 0.6);
          ctx.lineTo(r + 14, r * 0.3);
          ctx.lineTo(r * 0.5, 2);
          ctx.fill();
        }

        // Glowing Core Node / Corrupt Eye
        ctx.fillStyle = isMech ? '#ff2942' : '#b84dff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (b.type === 'queen_bee') {
        const flap = Math.sin(performance.now() * 0.05) * 14;
        // Iridescent double wings
        ctx.fillStyle = 'rgba(180, 240, 255, 0.68)';
        ctx.beginPath();
        ctx.ellipse(sx - 10, sy - r + flap * 0.5, 22, 12, -0.4, 0, Math.PI * 2);
        ctx.ellipse(sx + 10, sy - r - flap * 0.5, 22, 12, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Striped Royal Chitin Body
        ctx.fillStyle = '#f5b922';
        ctx.beginPath();
        ctx.ellipse(sx, sy, r * 1.15, r * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1f1912';
        ctx.fillRect(sx - r + 4, sy - 12, r * 2 - 8, 7);
        ctx.fillRect(sx - r + 4, sy + 2, r * 2 - 8, 7);
        // Stinger tip & glowing crimson eye
        ctx.fillStyle = '#ff2942';
        ctx.fillRect(sx + (player.x >= part.x ? 14 : -22), sy - 8, 8, 8);
      } else if (b.type === 'skeletron' || b.type === 'skeletron_prime') {
        const isPrime = b.type === 'skeletron_prime';
        ctx.save();
        ctx.translate(sx, sy);
        if (part.role === 'head' && b.phase === 2) {
          ctx.rotate(b.timer * 16);
          if (isPrime) {
            // Spinning Titanium Skull Spikes
            ctx.fillStyle = '#ff2942';
            for (let sp = 0; sp < 8; sp++) {
              const sa = (sp / 8) * Math.PI * 2;
              ctx.fillRect(Math.cos(sa) * (r + 2) - 4, Math.sin(sa) * (r + 2) - 4, 8, 8);
            }
          }
        }

        if (part.role === 'head') {
          // Cranium
          ctx.fillStyle = isPrime ? '#b0bdd1' : '#e3dcc7';
          ctx.beginPath();
          ctx.arc(0, -4, r, 0, Math.PI * 2);
          ctx.fill();
          // Jawbone
          ctx.fillRect(-r * 0.65, r * 0.45, r * 1.3, 14);
          // Glowing Eye Sockets
          ctx.fillStyle = '#11131a';
          ctx.fillRect(-16, -12, 11, 11);
          ctx.fillRect(5, -12, 11, 11);
          ctx.fillStyle = isPrime ? '#ff2942' : '#ff59b8';
          ctx.fillRect(-13, -9, 5, 5);
          ctx.fillRect(8, -9, 5, 5);
          // Teeth
          ctx.fillStyle = '#1f242d';
          for (let t = -12; t <= 12; t += 6) {
            ctx.fillRect(t - 1, r * 0.5, 3, 8);
          }
        } else {
          // Hand / Prime Weapon Limb
          ctx.fillStyle = isPrime ? '#8a99ad' : '#dcd4be';
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle =
            part.role === 'prime_laser'
              ? '#ff2942'
              : part.role === 'prime_saw'
              ? '#ffd747'
              : '#3be8d1';
          ctx.fillRect(-r * 0.5, -r * 0.5, r, r);
        }
        ctx.restore();
      } else if (b.type === 'plantera') {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(b.timer * (b.phase === 1 ? 1.5 : 4));
        // Layered Petals / Monster Maw
        const petalCount = 8;
        for (let k = 0; k < petalCount; k++) {
          const pa = (k / petalCount) * Math.PI * 2;
          ctx.fillStyle = b.phase === 1 ? '#ff59b8' : '#4ec92e';
          ctx.beginPath();
          ctx.arc(Math.cos(pa) * (r * 0.65), Math.sin(pa) * (r * 0.65), r * 0.52, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = b.phase === 1 ? '#76db46' : '#7a1628';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
        ctx.fill();
        if (b.phase === 2) {
          ctx.fillStyle = '#ffffff';
          for (let t = 0; t < 6; t++) {
            const ta = (t / 6) * Math.PI * 2;
            ctx.fillRect(Math.cos(ta) * 12 - 3, Math.sin(ta) * 12 - 3, 6, 6);
          }
        }
        ctx.restore();
      } else if (b.type === 'golem') {
        // Carved Lihzahrd Sun Idol
        ctx.fillStyle = '#8c4716';
        ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
        ctx.strokeStyle = '#d97e2b';
        ctx.lineWidth = 3;
        ctx.strokeRect(sx - r, sy - r, r * 2, r * 2);
        // Glowing Solar Emblem / Eyes
        ctx.fillStyle = '#ffee38';
        if (part.role === 'head') {
          ctx.fillRect(sx - 12, sy - 6, 8, 8);
          ctx.fillRect(sx + 4, sy - 6, 8, 8);
          ctx.fillStyle = '#ff551c';
          ctx.fillRect(sx - 8, sy + 8, 16, 5);
        } else {
          ctx.beginPath();
          ctx.arc(sx, sy, r * 0.42, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (b.type === 'duke_fishron') {
        const flap = Math.sin(performance.now() * 0.035) * 12;
        // Dragon Wings
        ctx.fillStyle = b.phase === 3 ? '#ff2975' : '#2be6b8';
        ctx.beginPath();
        ctx.moveTo(sx, sy - 8);
        ctx.lineTo(sx - 28, sy - r - 14 + flap);
        ctx.lineTo(sx + 18, sy - r - 6 + flap);
        ctx.closePath();
        ctx.fill();

        // Shark-Dragon Body
        ctx.fillStyle = b.phase === 3 ? '#142b6e' : '#1cb89c';
        ctx.beginPath();
        ctx.ellipse(sx, sy, r * 1.2, r * 0.88, 0, 0, Math.PI * 2);
        ctx.fill();
        // Glowing Abyssal Eyes
        ctx.fillStyle = b.phase >= 2 ? '#ffee38' : '#ff59b8';
        ctx.fillRect(sx - 12, sy - 10, 9, 9);
        ctx.fillRect(sx + 4, sy - 10, 9, 9);
      } else if (b.type === 'lunatic_cultist') {
        // Rotating Golden Arcane Ritual Sigil behind Cultist!
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(b.timer * 2.2);
        ctx.strokeStyle = 'rgba(255, 215, 71, 0.72)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 44, 0, Math.PI * 2);
        ctx.stroke();
        for (let s = 0; s < 6; s++) {
          const a1 = (s / 6) * Math.PI * 2;
          const a2 = ((s + 2) / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a1) * 44, Math.sin(a1) * 44);
          ctx.lineTo(Math.cos(a2) * 44, Math.sin(a2) * 44);
          ctx.stroke();
        }
        ctx.restore();

        // Cultist Robes & Plague Beak Mask
        ctx.fillStyle = '#1b3682';
        ctx.fillRect(sx - 13, sy - 18, 26, 36);
        ctx.fillStyle = '#ffd747';
        ctx.fillRect(sx - 13, sy - 2, 26, 4);
        ctx.fillStyle = '#f5f2eb';
        ctx.fillRect(sx - 9, sy - 16, 18, 12);
        ctx.fillStyle = '#ff2942';
        ctx.fillRect(sx - 5, sy - 12, 4, 4);
        ctx.fillRect(sx + 2, sy - 12, 4, 4);
      } else if (b.type === 'moon_lord') {
        // Moon Lord Palm Eyes, Head Eye & Pulsing Phantasmal Core
        ctx.fillStyle = part.invulnerable ? '#1e3d3a' : '#d8f5ef';
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2be6b8';
        ctx.lineWidth = 3;
        ctx.stroke();

        if (!part.invulnerable) {
          const pulse = 1 + Math.sin(b.timer * 8) * 0.12;
          ctx.fillStyle = part.role === 'core' ? '#ff2975' : '#2be6b8';
          ctx.beginPath();
          ctx.arc(sx, sy, r * 0.56 * pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(sx, sy, r * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (b.type === 'providence') {
        // Providence, the Profaned Goddess: Blazing Golden Wings + Profaned Crystal Core
        const wingFlap = Math.sin(b.timer * 9) * 18;
        ctx.save();
        ctx.translate(sx, sy);

        // Sweeping Golden Profaned Fire Wings
        ctx.fillStyle = b.phase === 2 ? '#2bff6e' : '#ffaa00';
        for (const dir of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(dir * 16, -6);
          ctx.lineTo(dir * (r + 58), -38 + wingFlap);
          ctx.lineTo(dir * (r + 42), 12 + wingFlap * 0.5);
          ctx.lineTo(dir * 18, 22);
          ctx.closePath();
          ctx.fill();
        }

        // Profaned Stone Carapace Diamond
        ctx.fillStyle = '#6e472b';
        ctx.beginPath();
        ctx.moveTo(0, -r - 12);
        ctx.lineTo(r + 6, 0);
        ctx.lineTo(0, r + 14);
        ctx.lineTo(-r - 6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffd747';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Blazing Solar/Holy Core
        ctx.fillStyle = '#ffee55';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.26, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (b.type === 'devourer_of_gods') {
        // The Devourer of Gods: Cosmilite Armored Worm with Neon Magenta/Cyan Conduits
        ctx.save();
        ctx.translate(sx, sy);
        const segAngle = Math.atan2(part.vy || 0, part.vx || 1);
        ctx.rotate(segAngle);

        // Cosmilite Armor Segment
        ctx.fillStyle = '#1b1136';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = b.phase === 2 ? '#ff29c6' : '#3be8d1';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Giant Cosmic Mandibles on Head
        if (part.role === 'head') {
          ctx.fillStyle = '#ff29c6';
          ctx.beginPath();
          ctx.moveTo(r * 0.5, -r * 0.7);
          ctx.lineTo(r + 22, -r * 0.35);
          ctx.lineTo(r * 0.4, -3);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(r * 0.5, r * 0.7);
          ctx.lineTo(r + 22, r * 0.35);
          ctx.lineTo(r * 0.4, 3);
          ctx.fill();
        }

        // Glowing Cosmilite Core
        ctx.fillStyle = '#ff29c6';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.46, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3be8d1';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (b.type === 'yharon') {
        // Yharon, Dragon of Rebirth: Colossal Crimson-and-Gold Feathered Jungle Dragon!
        const flap = Math.sin(b.timer * 14) * 24;
        const faceDir = player.x >= part.x ? 1 : -1;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(faceDir, 1);

        // Magnificent Phoenix Feathered Wings
        ctx.fillStyle = b.phase === 2 ? '#ffaa00' : '#d9381e';
        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.lineTo(-56, -r - 36 + flap);
        ctx.lineTo(14, -r - 18 + flap * 0.6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#2bff6e'; // Jungle Dragon emerald wing tips
        ctx.beginPath();
        ctx.arc(-44, -r - 26 + flap, 10, 0, Math.PI * 2);
        ctx.fill();

        // Armored Dragon Torso & Tail Plume
        ctx.fillStyle = '#9e1f19';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.25, r * 0.88, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Golden Dragon Horns
        ctx.fillStyle = '#ffd747';
        ctx.beginPath();
        ctx.moveTo(14, -r * 0.55);
        ctx.lineTo(18, -28);
        ctx.lineTo(4, -22);
        ctx.fill();

        // Blazing Emerald/Gold Dragon Eye
        ctx.fillStyle = b.phase === 2 ? '#00ffd5' : '#2bff6e';
        ctx.fillRect(16, -10, 11, 8);
        ctx.restore();
      } else if (b.type === 'supreme_calamitas') {
        // Supreme Witch, Calamitas: Crimson Brimstone Forcefield + Orbiting Hearts + Horned Witch
        ctx.save();
        ctx.translate(sx, sy);

        // Rotating Brimstone Magic Circle Shield
        ctx.save();
        ctx.rotate(b.timer * 2.8);
        ctx.strokeStyle = '#ff1938';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r + 14, 0, Math.PI * 2);
        ctx.stroke();
        for (let k = 0; k < 4; k++) {
          const ha = (k / 4) * Math.PI * 2;
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.arc(Math.cos(ha) * (r + 14), Math.sin(ha) * (r + 14), 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Obsidian & Crimson Witch Robes
        ctx.fillStyle = '#1a0d18';
        ctx.fillRect(-16, -20, 32, 42);
        ctx.strokeStyle = '#ff1938';
        ctx.lineWidth = 2;
        ctx.strokeRect(-16, -20, 32, 42);

        // Calamitas Horns & Glowing Scarlet Eyes
        ctx.fillStyle = '#d9c5d4';
        ctx.beginPath();
        ctx.moveTo(-10, -20);
        ctx.lineTo(-18, -34);
        ctx.lineTo(-4, -20);
        ctx.moveTo(10, -20);
        ctx.lineTo(18, -34);
        ctx.lineTo(4, -20);
        ctx.fill();

        ctx.fillStyle = '#ff1938';
        ctx.fillRect(-8, -12, 6, 5);
        ctx.fillRect(3, -12, 6, 5);
        ctx.restore();
      } else {
        ctx.fillStyle = '#d9384a';
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Blinding Triple-Layered Phantasmal Deathray Beam!
    if (b.deathray.active) {
      const ox = b.deathray.originX - camX;
      const oy = b.deathray.originY - camY;
      const ex = ox + Math.cos(b.deathray.angle) * 1200;
      const ey = oy + Math.sin(b.deathray.angle) * 1200;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Outer plasma corona
      ctx.strokeStyle = 'rgba(43, 230, 184, 0.35)';
      ctx.lineWidth = 54;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Mid cyan beam
      ctx.strokeStyle = 'rgba(92, 255, 230, 0.75)';
      ctx.lineWidth = 28;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // White-hot core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Origin flare
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ox, oy, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }
}
