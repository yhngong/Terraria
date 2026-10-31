import { TileId, WallId } from '../world/tiles';

export type ItemCategory =
  | 'melee'
  | 'ranged'
  | 'magic'
  | 'tool'
  | 'block'
  | 'wall'
  | 'station'
  | 'consumable'
  | 'material'
  | 'armor'
  | 'accessory'
  | 'ammo'
  | 'summon';

export type IconType =
  | 'sword'
  | 'pickaxe'
  | 'axe'
  | 'hammer'
  | 'bow'
  | 'gun'
  | 'staff'
  | 'potion'
  | 'armor'
  | 'accessory'
  | 'bar'
  | 'summon'
  | 'misc';

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  iconType: IconType;
  maxStack: number;
  rarity: number; // 0=white, 1=blue, 2=green, 3=orange, 4=light red, 5=pink, 6=purple, 7=lime, 8=yellow, 9=cyan, 10=red
  color: string;
  accentColor?: string;
  tooltip?: string;
  value: number; // in copper coins
  // Combat & Tools
  damage?: number;
  knockback?: number;
  useTime?: number; // seconds between uses
  autoReuse?: boolean;
  crit?: number;
  manaCost?: number;
  pickPower?: number;
  axePower?: number;
  hammerPower?: number;
  range?: number; // melee swing scale or reach
  // Projectiles & Ranged
  projectileType?: string;
  projectileSpeed?: number;
  projectileCount?: number;
  spread?: number;
  useAmmo?: 'arrow' | 'bullet';
  ammoType?: 'arrow' | 'bullet';
  // Placement
  placeTile?: TileId;
  placeWall?: WallId;
  // Consumables
  healHp?: number;
  healMana?: number;
  permMaxHp?: number;
  permMaxMana?: number;
  buffId?: string;
  buffDuration?: number;
  summonBoss?: string;
  // Equipment
  armorSlot?: 'head' | 'chest' | 'legs';
  defense?: number;
  bonusSpeed?: number;
  bonusJump?: boolean;
  bonusFlight?: number; // max wing flight seconds
  noKnockback?: boolean;
  lavaImmune?: boolean;
  bonusDamage?: number; // % multiplier e.g. 0.12
  bonusCrit?: number;
  hpRegenBonus?: number;
  isGrapple?: boolean;
  grappleRange?: number;
}

export interface ItemStack {
  id: string;
  count: number;
}

export const RARITY_COLORS: Record<number, string> = {
  0: '#ffffff',
  1: '#9696ff',
  2: '#96ff96',
  3: '#ffc896',
  4: '#ff9696',
  5: '#ff96ff',
  6: '#d2a0ff',
  7: '#96ff0a',
  8: '#ffff0a',
  9: '#05c8ff',
  10: '#ff2864',
  11: '#00ffd5', // Calamity Turquoise
  12: '#2bff6e', // Calamity Pure Green (Tarragon/Providence)
  13: '#ff29c6', // Calamity Cosmilite Magenta (Devourer of Gods)
  14: '#ffaa00', // Calamity Auric Gold (Yharon)
  15: '#ff1938'  // Calamity Brimstone Scarlet (Supreme Calamitas)
};

export const ITEMS: Record<string, ItemDef> = {};

function reg(def: ItemDef): void {
  ITEMS[def.id] = def;
}

// =========================================================
// 1. TOOLS (Pickaxes, Axes, Hammers)
// =========================================================
reg({
  id: 'copper_pickaxe',
  name: 'Copper Pickaxe',
  category: 'tool',
  iconType: 'pickaxe',
  maxStack: 1,
  rarity: 0,
  color: '#d9783b',
  accentColor: '#ffad70',
  damage: 4,
  knockback: 2,
  useTime: 0.24,
  autoReuse: true,
  pickPower: 35,
  value: 100,
  tooltip: '35% pickaxe power'
});
reg({
  id: 'iron_pickaxe',
  name: 'Iron Pickaxe',
  category: 'tool',
  iconType: 'pickaxe',
  maxStack: 1,
  rarity: 0,
  color: '#b8b0a8',
  accentColor: '#e8e2dc',
  damage: 6,
  knockback: 2,
  useTime: 0.21,
  autoReuse: true,
  pickPower: 45,
  value: 400,
  tooltip: '45% pickaxe power'
});
reg({
  id: 'gold_pickaxe',
  name: 'Gold Pickaxe',
  category: 'tool',
  iconType: 'pickaxe',
  maxStack: 1,
  rarity: 1,
  color: '#e6b82e',
  accentColor: '#fff085',
  damage: 8,
  knockback: 2.5,
  useTime: 0.18,
  autoReuse: true,
  pickPower: 55,
  value: 1000,
  tooltip: '55% pickaxe power — Can mine Demonite & Obsidian'
});
reg({
  id: 'nightmare_pickaxe',
  name: 'Nightmare Pickaxe',
  category: 'tool',
  iconType: 'pickaxe',
  maxStack: 1,
  rarity: 2,
  color: '#7b5cff',
  accentColor: '#b5a3ff',
  damage: 11,
  knockback: 3,
  useTime: 0.16,
  autoReuse: true,
  pickPower: 65,
  value: 2500,
  tooltip: '65% pickaxe power — Can mine Ebonstone, Dungeon Bricks & Hellstone'
});
reg({
  id: 'molten_pickaxe',
  name: 'Molten Pickaxe',
  category: 'tool',
  iconType: 'pickaxe',
  maxStack: 1,
  rarity: 3,
  color: '#ff6624',
  accentColor: '#ffdd55',
  damage: 15,
  knockback: 3.5,
  useTime: 0.15,
  autoReuse: true,
  pickPower: 100,
  value: 5400,
  tooltip: '100% pickaxe power — Can mine Cobalt & Pearlstone'
});
reg({
  id: 'cobalt_pickaxe',
  name: 'Cobalt Pickaxe',
  category: 'tool',
  iconType: 'pickaxe',
  maxStack: 1,
  rarity: 4,
  color: '#1f75fe',
  accentColor: '#7ab3ff',
  damage: 18,
  knockback: 4,
  useTime: 0.13,
  autoReuse: true,
  pickPower: 110,
  value: 10800,
  tooltip: '110% pickaxe power — Can mine Mythril'
});
reg({
  id: 'mythril_pickaxe',
  name: 'Mythril Pickaxe',
  category: 'tool',
  iconType: 'pickaxe',
  maxStack: 1,
  rarity: 4,
  color: '#29cc96',
  accentColor: '#8affd4',
  damage: 22,
  knockback: 4,
  useTime: 0.12,
  autoReuse: true,
  pickPower: 150,
  value: 16200,
  tooltip: '150% pickaxe power — Can mine Titanium'
});
reg({
  id: 'titanium_pickaxe',
  name: 'Titanium Pickaxe',
  category: 'tool',
  iconType: 'pickaxe',
  maxStack: 1,
  rarity: 5,
  color: '#c48fd9',
  accentColor: '#f3d9ff',
  damage: 26,
  knockback: 4.5,
  useTime: 0.11,
  autoReuse: true,
  pickPower: 180,
  value: 22000,
  tooltip: '180% pickaxe power'
});
reg({
  id: 'pickaxe_axe',
  name: 'Pickaxe Axe',
  category: 'tool',
  iconType: 'pickaxe',
  maxStack: 1,
  rarity: 5,
  color: '#ffd747',
  accentColor: '#ff477e',
  damage: 35,
  knockback: 5,
  useTime: 0.09,
  autoReuse: true,
  pickPower: 200,
  axePower: 110,
  value: 44000,
  tooltip: '200% pickaxe power, 110% axe power — Can mine Chlorophyte'
});
reg({
  id: 'picksaw',
  name: 'Picksaw',
  category: 'tool',
  iconType: 'pickaxe',
  maxStack: 1,
  rarity: 7,
  color: '#e0822b',
  accentColor: '#ffe047',
  damage: 44,
  knockback: 5.5,
  useTime: 0.07,
  autoReuse: true,
  pickPower: 210,
  axePower: 125,
  value: 80000,
  tooltip: '210% pickaxe power — Can mine Lihzahrd Bricks & Luminite'
});
reg({
  id: 'reefshark_pickaxe',
  name: 'Skyfringe Pickaxe [Calamity]',
  category: 'tool',
  iconType: 'pickaxe',
  maxStack: 1,
  rarity: 3,
  color: '#3be8d1',
  accentColor: '#ffd747',
  damage: 16,
  knockback: 3.5,
  useTime: 0.14,
  autoReuse: true,
  pickPower: 65,
  value: 4500,
  tooltip: '[Calamity Mod] 65% pickaxe power — Aerial-forged pickaxe that mines Demonite & Hellstone'
});
reg({
  id: 'blossom_pickaxe',
  name: 'Blossom Pickaxe [Calamity]',
  category: 'tool',
  iconType: 'pickaxe',
  maxStack: 1,
  rarity: 12,
  color: '#2bff6e',
  accentColor: '#ff85d0',
  damage: 75,
  knockback: 6,
  useTime: 0.055,
  autoReuse: true,
  pickPower: 250,
  axePower: 150,
  value: 350000,
  tooltip: '[Calamity Mod] 250% pickaxe power — Blessed by Providence, mines blocks at blinding speed'
});
reg({
  id: 'genesis_pickaxe',
  name: 'Genesis Pickaxe [Calamity]',
  category: 'tool',
  iconType: 'pickaxe',
  maxStack: 1,
  rarity: 13,
  color: '#ff29c6',
  accentColor: '#3be8d1',
  damage: 98,
  knockback: 6.5,
  useTime: 0.048,
  autoReuse: true,
  pickPower: 275,
  axePower: 175,
  value: 600000,
  tooltip: '[Calamity Mod] 275% pickaxe power, 175% axe power — Forged from Cosmilite Bars'
});
reg({
  id: 'crystyl_crusher',
  name: 'Crystyl Crusher [Calamity]',
  category: 'tool',
  iconType: 'pickaxe',
  maxStack: 1,
  rarity: 15,
  color: '#ff1938',
  accentColor: '#ffaa00',
  damage: 165,
  knockback: 8,
  useTime: 0.035,
  autoReuse: true,
  pickPower: 500,
  axePower: 250,
  hammerPower: 200,
  range: 95,
  value: 2500000,
  tooltip: '[Calamity Mod] 500% Pickaxe / 250% Axe / 200% Hammer Power — Ultimate Shadowspec multi-tool!'
});

reg({
  id: 'copper_axe',
  name: 'Copper Axe',
  category: 'tool',
  iconType: 'axe',
  maxStack: 1,
  rarity: 0,
  color: '#d9783b',
  accentColor: '#ffad70',
  damage: 5,
  knockback: 3,
  useTime: 0.26,
  autoReuse: true,
  axePower: 40,
  value: 80,
  tooltip: 'Chops Down Trees'
});
reg({
  id: 'pwnhammer',
  name: 'Pwnhammer',
  category: 'tool',
  iconType: 'hammer',
  maxStack: 1,
  rarity: 4,
  color: '#ffd644',
  accentColor: '#ffffff',
  damage: 26,
  knockback: 7,
  useTime: 0.22,
  autoReuse: true,
  hammerPower: 80,
  value: 7800,
  tooltip: 'Strong enough to destroy Demon Altars and bless the world with Hardmode ores'
});

// =========================================================
// 2. MELEE WEAPONS
// =========================================================
reg({
  id: 'copper_shortsword',
  name: 'Bronze Shortsword',
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 0,
  color: '#cd7f32',
  accentColor: '#f2b068',
  damage: 18,
  knockback: 4,
  useTime: 0.22,
  autoReuse: true,
  range: 34,
  value: 70
});
reg({
  id: 'bronze_broadsword',
  name: 'Bronze Broadsword',
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 0,
  color: '#cd7f32',
  accentColor: '#f2b068',
  damage: 24,
  knockback: 4.5,
  useTime: 0.21,
  autoReuse: true,
  range: 38,
  value: 180,
  tooltip: 'Sturdy bronze blade for survival exploration'
});
reg({
  id: 'bronze_pickaxe',
  name: 'Bronze Pickaxe',
  category: 'tool',
  iconType: 'pickaxe',
  maxStack: 1,
  rarity: 0,
  color: '#cd7f32',
  accentColor: '#f2b068',
  damage: 10,
  knockback: 2,
  useTime: 0.20,
  autoReuse: true,
  pickPower: 40,
  value: 150,
  tooltip: '40% pickaxe power'
});
reg({
  id: 'bronze_axe',
  name: 'Bronze Axe',
  category: 'tool',
  iconType: 'axe',
  maxStack: 1,
  rarity: 0,
  color: '#cd7f32',
  accentColor: '#f2b068',
  damage: 11,
  knockback: 3,
  useTime: 0.22,
  autoReuse: true,
  axePower: 45,
  value: 140,
  tooltip: 'Chops down trees'
});
reg({
  id: 'bronze_bow',
  name: 'Bronze Bow',
  category: 'ranged',
  iconType: 'bow',
  maxStack: 1,
  rarity: 0,
  color: '#cd7f32',
  accentColor: '#f2b068',
  damage: 22,
  knockback: 2.5,
  useTime: 0.25,
  autoReuse: true,
  projectileSpeed: 520,
  useAmmo: 'arrow',
  value: 160
});
reg({
  id: 'wooden_sword',
  name: 'Wooden Broadsword',
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 0,
  color: '#9c683b',
  accentColor: '#694121',
  damage: 9,
  knockback: 4.5,
  useTime: 0.26,
  autoReuse: true,
  range: 34,
  value: 50
});
reg({
  id: 'iron_broadsword',
  name: 'Iron Broadsword',
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 0,
  color: '#b8b0a8',
  accentColor: '#7a7570',
  damage: 13,
  knockback: 5,
  useTime: 0.25,
  autoReuse: true,
  range: 36,
  value: 360
});
reg({
  id: 'gold_broadsword',
  name: 'Gold Broadsword',
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 1,
  color: '#e6b82e',
  accentColor: '#fff085',
  damage: 46,
  knockback: 5.5,
  useTime: 0.19,
  autoReuse: true,
  range: 46,
  projectileType: 'shadow_slash',
  projectileSpeed: 460,
  value: 900,
  tooltip: 'Unleashes a golden blade wave'
});
reg({
  id: 'lights_bane',
  name: "Light's Bane",
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 2,
  color: '#7b5cff',
  accentColor: '#c9b8ff',
  damage: 58,
  knockback: 5,
  useTime: 0.18,
  autoReuse: true,
  range: 46,
  projectileType: 'shadow_slash',
  projectileSpeed: 480,
  value: 2700,
  tooltip: 'Unleashes dark shadow slashes'
});
reg({
  id: 'blade_of_grass',
  name: 'Blade of Grass',
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 3,
  color: '#50c938',
  accentColor: '#a3ff78',
  damage: 66,
  knockback: 5,
  useTime: 0.19,
  autoReuse: true,
  range: 50,
  projectileType: 'leaf_blade',
  projectileSpeed: 500,
  value: 5400,
  tooltip: 'Fires razor-sharp jungle leaves'
});
reg({
  id: 'muramasa',
  name: 'Muramasa',
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 2,
  color: '#3468eb',
  accentColor: '#8cb3ff',
  damage: 54,
  knockback: 3.5,
  useTime: 0.14,
  autoReuse: true,
  range: 48,
  projectileType: 'water_bolt',
  projectileSpeed: 480,
  value: 6000,
  tooltip: 'Fast auto-swinging dungeon katana'
});
reg({
  id: 'fiery_greatsword',
  name: 'Volcano (Fiery Greatsword)',
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 3,
  color: '#ff6624',
  accentColor: '#ffdd44',
  damage: 76,
  knockback: 6.5,
  useTime: 0.22,
  autoReuse: true,
  range: 54,
  projectileType: 'fire_wave',
  projectileSpeed: 460,
  value: 8000,
  tooltip: "It's made out of fire!"
});
reg({
  id: 'nights_edge',
  name: "Night's Edge",
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 4,
  color: '#9138eb',
  accentColor: '#e08cff',
  damage: 84,
  knockback: 6,
  useTime: 0.19,
  autoReuse: true,
  range: 56,
  projectileType: 'night_arc',
  projectileSpeed: 540,
  value: 20000,
  tooltip: 'Pinnacle Pre-Hardmode blade — Fires sweeping dark arcs'
});
reg({
  id: 'excalibur',
  name: 'Excalibur',
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 5,
  color: '#ffd747',
  accentColor: '#75e6ff',
  damage: 64,
  knockback: 6,
  useTime: 0.20,
  autoReuse: true,
  range: 52,
  projectileType: 'holy_beam',
  projectileSpeed: 560,
  value: 46000,
  tooltip: 'Forged from Hallowed Bars'
});
reg({
  id: 'terra_blade',
  name: 'Terra Blade',
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 8,
  color: '#34e864',
  accentColor: '#9effb0',
  damage: 90,
  knockback: 7,
  useTime: 0.18,
  autoReuse: true,
  range: 58,
  projectileType: 'terra_beam',
  projectileSpeed: 720,
  value: 200000,
  tooltip: 'Fires high-velocity piercing Terra Beams'
});
reg({
  id: 'solar_eruption',
  name: 'Solar Eruption',
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 10,
  color: '#ff771c',
  accentColor: '#ffee55',
  damage: 118,
  knockback: 7,
  useTime: 0.18,
  autoReuse: true,
  range: 64,
  projectileType: 'solar_spear',
  projectileSpeed: 840,
  value: 500000,
  tooltip: 'Strikes with the fury of a dying star and pierces blocks'
});
reg({
  id: 'meowmere',
  name: 'Meowmere',
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 10,
  color: '#ff73d0',
  accentColor: '#73fff8',
  damage: 125,
  knockback: 8,
  useTime: 0.17,
  autoReuse: true,
  range: 60,
  projectileType: 'rainbow_cat',
  projectileSpeed: 780,
  value: 1000000,
  tooltip: 'Dropped by the Moon Lord — Fires ricocheting rainbow projectiles'
});
reg({
  id: 'zenith',
  name: 'Zenith',
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 10,
  color: '#3be8d1',
  accentColor: '#ff73d0',
  damage: 110,
  knockback: 8,
  useTime: 0.12,
  autoReuse: true,
  range: 70,
  projectileType: 'zenith_arc',
  projectileSpeed: 980,
  value: 2000000,
  tooltip: 'The culmination of a journey — Unleashes a storm of legendary returning blades to your cursor!'
});
reg({
  id: 'biome_blade',
  name: 'Biome Blade [Calamity]',
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 4,
  color: '#3be8d1',
  accentColor: '#59e62e',
  damage: 62,
  knockback: 6,
  useTime: 0.20,
  autoReuse: true,
  range: 52,
  projectileType: 'terra_beam',
  projectileSpeed: 680,
  value: 45000,
  tooltip: '[Calamity Mod] Attuned to the world itself — Fires piercing biome energy waves'
});
reg({
  id: 'excelsus',
  name: 'Excelsus [Calamity]',
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 13,
  color: '#ff29c6',
  accentColor: '#3be8d1',
  damage: 145,
  knockback: 8,
  useTime: 0.14,
  autoReuse: true,
  range: 68,
  projectileType: 'cosmic_blade',
  projectileSpeed: 960,
  projectileCount: 3,
  spread: 0.16,
  value: 1500000,
  tooltip: '[Calamity Mod] Dropped by The Devourer of Gods — Fires triple dimensional laser blades'
});
reg({
  id: 'dragon_rage',
  name: "Dragon's Rage [Calamity]",
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 14,
  color: '#ffaa00',
  accentColor: '#ff2942',
  damage: 185,
  knockback: 9,
  useTime: 0.13,
  autoReuse: true,
  range: 78,
  projectileType: 'yharon_fireball',
  projectileSpeed: 880,
  projectileCount: 2,
  spread: 0.22,
  value: 2200000,
  tooltip: '[Calamity Mod] Dropped by Yharon, Dragon of Rebirth — Unleashes a vortex of phoenix dragonfire!'
});
reg({
  id: 'ark_of_the_cosmos',
  name: 'Ark of the Cosmos [Calamity]',
  category: 'melee',
  iconType: 'sword',
  maxStack: 1,
  rarity: 15,
  color: '#ff1938',
  accentColor: '#00ffd5',
  damage: 230,
  knockback: 10,
  useTime: 0.11,
  autoReuse: true,
  range: 84,
  projectileType: 'cosmos_ark',
  projectileSpeed: 1080,
  projectileCount: 3,
  spread: 0.18,
  value: 5000000,
  tooltip: '[Calamity Mod] The ultimate Auric/Shadowspec scissor-blade — Rends reality with homing cosmic constellations!'
});

// =========================================================
// 3. RANGED WEAPONS & AMMO
// =========================================================
reg({
  id: 'wooden_bow',
  name: 'Wooden Bow',
  category: 'ranged',
  iconType: 'bow',
  maxStack: 1,
  rarity: 0,
  color: '#9c683b',
  damage: 22,
  knockback: 2,
  useTime: 0.26,
  autoReuse: true,
  projectileSpeed: 520,
  useAmmo: 'arrow',
  value: 40
});
reg({
  id: 'demon_bow',
  name: 'Demon Bow',
  category: 'ranged',
  iconType: 'bow',
  maxStack: 1,
  rarity: 1,
  color: '#7b5cff',
  damage: 38,
  knockback: 3,
  useTime: 0.21,
  autoReuse: true,
  projectileSpeed: 600,
  useAmmo: 'arrow',
  value: 1800
});
reg({
  id: 'bees_knees',
  name: "The Bee's Knees",
  category: 'ranged',
  iconType: 'bow',
  maxStack: 1,
  rarity: 3,
  color: '#f5b922',
  accentColor: '#2e261b',
  damage: 34,
  knockback: 3,
  useTime: 0.21,
  autoReuse: true,
  projectileSpeed: 620,
  projectileCount: 2,
  spread: 0.08,
  useAmmo: 'arrow',
  value: 10000,
  tooltip: 'Fires twin bee-infused arrows'
});
reg({
  id: 'molten_fury',
  name: 'Molten Fury',
  category: 'ranged',
  iconType: 'bow',
  maxStack: 1,
  rarity: 3,
  color: '#ff6624',
  damage: 58,
  knockback: 3.5,
  useTime: 0.20,
  autoReuse: true,
  projectileSpeed: 680,
  useAmmo: 'arrow',
  value: 12000,
  tooltip: 'Lights wooden arrows ablaze'
});
reg({
  id: 'minishark',
  name: 'Minishark',
  category: 'ranged',
  iconType: 'gun',
  maxStack: 1,
  rarity: 2,
  color: '#6e7c8f',
  accentColor: '#b0c4de',
  damage: 20,
  knockback: 1,
  useTime: 0.085,
  autoReuse: true,
  projectileSpeed: 800,
  spread: 0.05,
  useAmmo: 'bullet',
  value: 35000,
  tooltip: 'Half shark, half gun, completely awesome'
});
reg({
  id: 'daedalus_stormbow',
  name: 'Daedalus Stormbow',
  category: 'ranged',
  iconType: 'bow',
  maxStack: 1,
  rarity: 5,
  color: '#9ce0ff',
  accentColor: '#ffd966',
  damage: 20,
  knockback: 3,
  useTime: 0.27,
  autoReuse: true,
  projectileSpeed: 650,
  projectileCount: 3,
  spread: 0.16,
  useAmmo: 'arrow',
  value: 45000,
  tooltip: 'Fires a volley of 3 arrows at once'
});
reg({
  id: 'megashark',
  name: 'Megashark',
  category: 'ranged',
  iconType: 'gun',
  maxStack: 1,
  rarity: 5,
  color: '#5a6e85',
  accentColor: '#ff4252',
  damage: 21,
  knockback: 1.5,
  useTime: 0.09,
  autoReuse: true,
  projectileSpeed: 880,
  spread: 0.04,
  useAmmo: 'bullet',
  value: 60000,
  tooltip: "Minishark's older brother"
});
reg({
  id: 'chlorophyte_shotbow',
  name: 'Chlorophyte Shotbow',
  category: 'ranged',
  iconType: 'bow',
  maxStack: 1,
  rarity: 7,
  color: '#59e62e',
  accentColor: '#baff80',
  damage: 28,
  knockback: 3.5,
  useTime: 0.22,
  autoReuse: true,
  projectileSpeed: 740,
  projectileCount: 3,
  spread: 0.12,
  useAmmo: 'arrow',
  value: 90000
});
reg({
  id: 'tsunami',
  name: 'Tsunami',
  category: 'ranged',
  iconType: 'bow',
  maxStack: 1,
  rarity: 8,
  color: '#1ce0b8',
  accentColor: '#8cffe6',
  damage: 27,
  knockback: 4,
  useTime: 0.24,
  autoReuse: true,
  projectileSpeed: 820,
  projectileCount: 4,
  spread: 0.15,
  useAmmo: 'arrow',
  value: 150000,
  tooltip: 'Fires 4 arrows per shot — Dropped by Duke Fishron'
});
reg({
  id: 'sdmg',
  name: 'S.D.M.G.',
  category: 'ranged',
  iconType: 'gun',
  maxStack: 1,
  rarity: 10,
  color: '#3be8d1',
  accentColor: '#ffffff',
  damage: 44,
  knockback: 2.5,
  useTime: 0.075,
  autoReuse: true,
  projectileSpeed: 1050,
  spread: 0.02,
  useAmmo: 'bullet',
  value: 1000000,
  tooltip: 'Space Dolphin Machine Gun — Dropped by the Moon Lord'
});
reg({
  id: 'phoenix_flame_blaster',
  name: 'Drataliornus [Calamity]',
  category: 'ranged',
  iconType: 'bow',
  maxStack: 1,
  rarity: 14,
  color: '#ffaa00',
  accentColor: '#ff2942',
  damage: 68,
  knockback: 4.5,
  useTime: 0.14,
  autoReuse: true,
  projectileSpeed: 1080,
  projectileCount: 5,
  spread: 0.16,
  useAmmo: 'arrow',
  value: 2000000,
  tooltip: '[Calamity Mod] Dropped by Yharon — Fires a 5-arrow phoenix dragonfire storm!'
});
reg({
  id: 'soma_prime',
  name: 'Soma Prime [Calamity]',
  category: 'ranged',
  iconType: 'gun',
  maxStack: 1,
  rarity: 15,
  color: '#ff1938',
  accentColor: '#ffaa00',
  damage: 88,
  knockback: 3,
  useTime: 0.05,
  autoReuse: true,
  projectileSpeed: 1280,
  spread: 0.025,
  useAmmo: 'bullet',
  value: 3500000,
  tooltip: '[Calamity Mod] Shadowspec hyper-minigun that shreds anything in existence'
});

reg({
  id: 'wooden_arrow',
  name: 'Wooden Arrow',
  category: 'ammo',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 0,
  color: '#b88656',
  accentColor: '#e6edf5',
  damage: 5,
  ammoType: 'arrow',
  projectileType: 'arrow',
  value: 5
});
reg({
  id: 'flaming_arrow',
  name: 'Flaming Arrow',
  category: 'ammo',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 0,
  color: '#ff661c',
  accentColor: '#ffee55',
  damage: 7,
  ammoType: 'arrow',
  projectileType: 'fire_arrow',
  value: 10
});
reg({
  id: 'holy_arrow',
  name: 'Holy Arrow',
  category: 'ammo',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 4,
  color: '#5ce1ff',
  accentColor: '#ff70d9',
  damage: 10,
  ammoType: 'arrow',
  projectileType: 'holy_arrow',
  value: 35,
  tooltip: 'Summons falling stars on impact'
});
reg({
  id: 'musket_ball',
  name: 'Musket Ball',
  category: 'ammo',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 0,
  color: '#9aa4b2',
  accentColor: '#d9e3f0',
  damage: 6,
  ammoType: 'bullet',
  projectileType: 'bullet',
  value: 7
});
reg({
  id: 'chlorophyte_bullet',
  name: 'Chlorophyte Bullet',
  category: 'ammo',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 7,
  color: '#59e62e',
  accentColor: '#d2ffb8',
  damage: 11,
  ammoType: 'bullet',
  projectileType: 'homing_bullet',
  value: 45,
  tooltip: 'Chases after your target!'
});

// =========================================================
// 4. MAGIC WEAPONS
// =========================================================
reg({
  id: 'wand_of_sparking',
  name: 'Wand of Sparking',
  category: 'magic',
  iconType: 'staff',
  maxStack: 1,
  rarity: 1,
  color: '#8f5830',
  accentColor: '#ff7722',
  damage: 44,
  knockback: 2,
  useTime: 0.19,
  autoReuse: true,
  manaCost: 4,
  projectileType: 'spark_bolt',
  projectileSpeed: 540,
  value: 1000,
  tooltip: 'Shoots a blazing spark that ignites foes'
});
reg({
  id: 'water_bolt',
  name: 'Water Bolt',
  category: 'magic',
  iconType: 'staff',
  maxStack: 1,
  rarity: 2,
  color: '#2b7fff',
  accentColor: '#8cd4ff',
  damage: 54,
  knockback: 4,
  useTime: 0.19,
  autoReuse: true,
  manaCost: 6,
  projectileType: 'water_bolt',
  projectileSpeed: 460,
  value: 6000,
  tooltip: 'Casts a piercing bolt of water that ricochets off walls'
});
reg({
  id: 'demon_scythe',
  name: 'Demon Scythe',
  category: 'magic',
  iconType: 'staff',
  maxStack: 1,
  rarity: 3,
  color: '#8538ff',
  accentColor: '#d1a8ff',
  damage: 68,
  knockback: 5,
  useTime: 0.21,
  autoReuse: true,
  manaCost: 9,
  projectileType: 'demon_scythe',
  projectileSpeed: 580,
  value: 10000,
  tooltip: 'Casts a spinning demonic scythe that shreds enemies'
});
reg({
  id: 'crystal_storm',
  name: 'Crystal Storm',
  category: 'magic',
  iconType: 'staff',
  maxStack: 1,
  rarity: 5,
  color: '#ff66d9',
  accentColor: '#66e3ff',
  damage: 28,
  knockback: 2.5,
  useTime: 0.11,
  autoReuse: true,
  manaCost: 5,
  projectileType: 'crystal_shard',
  projectileSpeed: 680,
  spread: 0.14,
  value: 45000,
  tooltip: 'Summons a rapid storm of bouncing crystal shards'
});
reg({
  id: 'golden_shower',
  name: 'Golden Shower',
  category: 'magic',
  iconType: 'staff',
  maxStack: 1,
  rarity: 5,
  color: '#ffcf24',
  accentColor: '#fff599',
  damage: 34,
  knockback: 3,
  useTime: 0.14,
  autoReuse: true,
  manaCost: 7,
  projectileType: 'ichor_stream',
  projectileSpeed: 640,
  value: 45000,
  tooltip: 'Piercing golden stream that reduces enemy defense'
});
reg({
  id: 'razorblade_typhoon',
  name: 'Razorblade Typhoon',
  category: 'magic',
  iconType: 'staff',
  maxStack: 1,
  rarity: 8,
  color: '#1cb3ff',
  accentColor: '#9cebff',
  damage: 64,
  knockback: 5,
  useTime: 0.24,
  autoReuse: true,
  manaCost: 14,
  projectileType: 'typhoon',
  projectileSpeed: 560,
  projectileCount: 1,
  spread: 0.12,
  value: 160000,
  tooltip: 'Casts a fast-moving homing razorwheel — Dropped by Duke Fishron'
});
reg({
  id: 'nebula_blaze',
  name: 'Nebula Blaze',
  category: 'magic',
  iconType: 'staff',
  maxStack: 1,
  rarity: 10,
  color: '#e838ff',
  accentColor: '#75e6ff',
  damage: 98,
  knockback: 5,
  useTime: 0.15,
  autoReuse: true,
  manaCost: 10,
  projectileType: 'nebula_bolt',
  projectileSpeed: 760,
  value: 500000,
  tooltip: 'From Orion’s belt to the palm of your hand'
});
reg({
  id: 'last_prism',
  name: 'Last Prism',
  category: 'magic',
  iconType: 'staff',
  maxStack: 1,
  rarity: 10,
  color: '#80ffea',
  accentColor: '#ff80df',
  damage: 52,
  knockback: 2,
  useTime: 0.12,
  autoReuse: true,
  manaCost: 8,
  projectileType: 'prism_beam',
  projectileSpeed: 980,
  projectileCount: 2,
  spread: 0.08,
  value: 1000000,
  tooltip: 'Fires a life-form disintegration rainbow — Dropped by the Moon Lord'
});
reg({
  id: 'vehemence',
  name: 'Vehemence [Calamity]',
  category: 'magic',
  iconType: 'staff',
  maxStack: 1,
  rarity: 15,
  color: '#ff1938',
  accentColor: '#ffaa00',
  damage: 135,
  knockback: 5,
  useTime: 0.12,
  autoReuse: true,
  manaCost: 9,
  projectileType: 'brimstone_hellblast',
  projectileSpeed: 960,
  projectileCount: 3,
  spread: 0.18,
  value: 3500000,
  tooltip: '[Calamity Mod] Dropped by Supreme Witch, Calamitas — Unleashes homing Brimstone Hellblasts!'
});

// =========================================================
// 5. ARMOR SETS (Head, Chest, Legs)
// =========================================================
function regArmorSet(
  prefix: string,
  label: string,
  rarity: number,
  color: string,
  accent: string,
  defHead: number,
  defChest: number,
  defLegs: number,
  bonusDmg: number,
  val: number
): void {
  reg({
    id: `${prefix}_helmet`,
    name: `${label} Helmet`,
    category: 'armor',
    iconType: 'armor',
    maxStack: 1,
    rarity,
    color,
    accentColor: accent,
    armorSlot: 'head',
    defense: defHead,
    bonusDamage: bonusDmg,
    value: val,
    tooltip: `${defHead} defense, +${Math.round(bonusDmg * 100)}% damage`
  });
  reg({
    id: `${prefix}_breastplate`,
    name: `${label} Breastplate`,
    category: 'armor',
    iconType: 'armor',
    maxStack: 1,
    rarity,
    color,
    accentColor: accent,
    armorSlot: 'chest',
    defense: defChest,
    bonusDamage: bonusDmg,
    value: val * 1.4,
    tooltip: `${defChest} defense, +${Math.round(bonusDmg * 100)}% damage`
  });
  reg({
    id: `${prefix}_leggings`,
    name: `${label} Greaves`,
    category: 'armor',
    iconType: 'armor',
    maxStack: 1,
    rarity,
    color,
    accentColor: accent,
    armorSlot: 'legs',
    defense: defLegs,
    bonusSpeed: 0.06,
    value: val * 1.1,
    tooltip: `${defLegs} defense, +6% movement speed`
  });
}

regArmorSet('wood', 'Wood', 0, '#9c683b', '#694121', 1, 2, 1, 0.02, 50);
regArmorSet('bronze', 'Bronze', 0, '#cd7f32', '#f2b068', 2, 3, 2, 0.03, 250);
regArmorSet('iron', 'Iron', 0, '#b8b0a8', '#7a7570', 3, 4, 3, 0.04, 600);
regArmorSet('gold', 'Gold', 1, '#e6b82e', '#fff085', 5, 6, 5, 0.06, 2000);
regArmorSet('shadow', 'Shadow', 2, '#6d4ce6', '#b19cff', 6, 8, 6, 0.09, 5000);
regArmorSet('molten', 'Molten', 3, '#ff6624', '#ffdd55', 8, 10, 8, 0.12, 9000);
regArmorSet('cobalt', 'Cobalt', 4, '#1f75fe', '#7ab3ff', 10, 13, 10, 0.14, 15000);
regArmorSet('mythril', 'Mythril', 4, '#29cc96', '#8affd4', 13, 16, 12, 0.16, 24000);
regArmorSet('titanium', 'Titanium', 5, '#c48fd9', '#f3d9ff', 15, 19, 15, 0.18, 35000);
regArmorSet('hallowed', 'Hallowed', 5, '#ffd747', '#ff477e', 17, 21, 16, 0.21, 50000);
regArmorSet('chlorophyte', 'Chlorophyte', 7, '#59e62e', '#baff80', 20, 24, 18, 0.25, 80000);
regArmorSet('solar', 'Solar Flare', 10, '#ff771c', '#ffee55', 26, 34, 24, 0.32, 200000);
// Calamity Mod Armor Sets!
regArmorSet('aerospec', 'Aerospec [Calamity]', 3, '#3be8d1', '#ffd747', 6, 8, 6, 0.10, 6500);
regArmorSet('tarragon', 'Tarragon [Calamity]', 12, '#2bff6e', '#ffd747', 32, 42, 28, 0.38, 400000);
regArmorSet('god_slayer', 'God Slayer [Calamity]', 13, '#ff29c6', '#3be8d1', 38, 50, 34, 0.45, 750000);
regArmorSet('auric_tesla', 'Auric Tesla [Calamity]', 14, '#ffaa00', '#00ffd5', 48, 62, 44, 0.54, 1500000);
regArmorSet('demonshade', 'Demonshade [Calamity]', 15, '#ff1938', '#ffaa00', 58, 76, 52, 0.65, 3000000);

// =========================================================
// 6. ACCESSORIES & GRAPPLING HOOK
// =========================================================
reg({
  id: 'grappling_hook',
  name: 'Grappling Hook',
  category: 'accessory',
  iconType: 'accessory',
  maxStack: 1,
  rarity: 1,
  color: '#9aa4b2',
  accentColor: '#dce6f2',
  isGrapple: true,
  grappleRange: 340,
  value: 2000,
  tooltip: 'Press E while equipped or in inventory to grapple onto blocks!'
});
reg({
  id: 'hermes_boots',
  name: 'Hermes Boots',
  category: 'accessory',
  iconType: 'accessory',
  maxStack: 1,
  rarity: 1,
  color: '#34b855',
  accentColor: '#ffffff',
  bonusSpeed: 0.35,
  value: 5000,
  tooltip: 'The wearer can run super fast (+35% speed)'
});
reg({
  id: 'cloud_in_a_bottle',
  name: 'Cloud in a Bottle',
  category: 'accessory',
  iconType: 'accessory',
  maxStack: 1,
  rarity: 1,
  color: '#bce6ff',
  accentColor: '#ffffff',
  bonusJump: true,
  value: 5000,
  tooltip: 'Allows the holder to double jump'
});
reg({
  id: 'band_of_regeneration',
  name: 'Band of Regeneration',
  category: 'accessory',
  iconType: 'accessory',
  maxStack: 1,
  rarity: 1,
  color: '#ff4275',
  accentColor: '#ffb3c7',
  hpRegenBonus: 3,
  value: 5000,
  tooltip: 'Slowly regenerates life (+3 HP/sec)'
});
reg({
  id: 'cobalt_shield',
  name: 'Cobalt Shield',
  category: 'accessory',
  iconType: 'accessory',
  maxStack: 1,
  rarity: 2,
  color: '#2563eb',
  accentColor: '#ffd24c',
  defense: 4,
  noKnockback: true,
  value: 8000,
  tooltip: 'Grants +4 defense and immunity to knockback'
});
reg({
  id: 'obsidian_skull',
  name: 'Obsidian Skull',
  category: 'accessory',
  iconType: 'accessory',
  maxStack: 1,
  rarity: 2,
  color: '#3d2566',
  accentColor: '#9163e0',
  defense: 2,
  lavaImmune: true,
  value: 6500,
  tooltip: 'Grants immunity to fire blocks and reduces lava damage'
});
reg({
  id: 'angel_wings',
  name: 'Angel Wings',
  category: 'accessory',
  iconType: 'accessory',
  maxStack: 1,
  rarity: 5,
  color: '#e8f5ff',
  accentColor: '#ffd966',
  bonusFlight: 1.8,
  bonusSpeed: 0.15,
  value: 40000,
  tooltip: 'Allows flight and slow fall, negates fall damage'
});
reg({
  id: 'solar_wings',
  name: 'Solar Wings',
  category: 'accessory',
  iconType: 'accessory',
  maxStack: 1,
  rarity: 10,
  color: '#ff771c',
  accentColor: '#ffee55',
  bonusFlight: 3.4,
  bonusSpeed: 0.30,
  value: 160000,
  tooltip: 'High-speed celestial flight'
});
reg({
  id: 'ankh_shield',
  name: 'Ankh Shield',
  category: 'accessory',
  iconType: 'accessory',
  maxStack: 1,
  rarity: 7,
  color: '#24b89c',
  accentColor: '#ffd942',
  defense: 8,
  noKnockback: true,
  lavaImmune: true,
  value: 100000,
  tooltip: '+8 defense, knockback & fire immunity'
});
reg({
  id: 'celestial_shell',
  name: 'Celestial Shell',
  category: 'accessory',
  iconType: 'accessory',
  maxStack: 1,
  rarity: 8,
  color: '#ff6642',
  accentColor: '#42d4ff',
  defense: 6,
  bonusDamage: 0.15,
  hpRegenBonus: 4,
  value: 140000,
  tooltip: '+6 defense, +15% all damage, +4 HP/sec regeneration'
});
reg({
  id: 'cosmic_car_key',
  name: 'Cosmic Car Key (UFO Mount)',
  category: 'accessory',
  iconType: 'accessory',
  maxStack: 1,
  rarity: 9,
  color: '#3be8d1',
  accentColor: '#ffd747',
  value: 250000,
  tooltip: 'Summons a ridable UFO Mount with infinite 360° flight! (Press R to toggle mount, F to cycle mount style)'
});
reg({
  id: 'celestial_tracers',
  name: 'Celestial Tracers [Calamity]',
  category: 'accessory',
  iconType: 'accessory',
  maxStack: 1,
  rarity: 14,
  color: '#ffaa00',
  accentColor: '#00ffd5',
  defense: 12,
  bonusFlight: 5.5,
  bonusSpeed: 0.55,
  bonusDamage: 0.15,
  noKnockback: true,
  lavaImmune: true,
  value: 1500000,
  tooltip: '[Calamity Mod] Seraph Tracers — Extreme flight time, +55% speed, +15% damage, +12 defense & lava immunity!'
});

// =========================================================
// 7. POTIONS & PERMANENT UPGRADES
// =========================================================
reg({
  id: 'lesser_healing_potion',
  name: 'Lesser Healing Potion',
  category: 'consumable',
  iconType: 'potion',
  maxStack: 999,
  rarity: 0,
  color: '#ff425b',
  accentColor: '#ff9ead',
  healHp: 50,
  useTime: 0.3,
  value: 60,
  tooltip: 'Restores 50 life (Press H for Quick Heal)'
});
reg({
  id: 'healing_potion',
  name: 'Healing Potion',
  category: 'consumable',
  iconType: 'potion',
  maxStack: 999,
  rarity: 1,
  color: '#e62246',
  accentColor: '#ff8ca1',
  healHp: 100,
  useTime: 0.3,
  value: 200,
  tooltip: 'Restores 100 life'
});
reg({
  id: 'greater_healing_potion',
  name: 'Greater Healing Potion',
  category: 'consumable',
  iconType: 'potion',
  maxStack: 999,
  rarity: 4,
  color: '#ff1c7a',
  accentColor: '#ffd447',
  healHp: 150,
  useTime: 0.3,
  value: 500,
  tooltip: 'Restores 150 life'
});
reg({
  id: 'super_healing_potion',
  name: 'Super Healing Potion',
  category: 'consumable',
  iconType: 'potion',
  maxStack: 999,
  rarity: 9,
  color: '#ff2957',
  accentColor: '#3be8d1',
  healHp: 200,
  useTime: 0.3,
  value: 1500,
  tooltip: 'Restores 200 life'
});
reg({
  id: 'omega_healing_potion',
  name: 'Omega Healing Potion [Calamity]',
  category: 'consumable',
  iconType: 'potion',
  maxStack: 999,
  rarity: 13,
  color: '#ff29c6',
  accentColor: '#ffaa00',
  healHp: 300,
  useTime: 0.25,
  value: 5000,
  tooltip: '[Calamity Mod] Restores 300 life'
});
reg({
  id: 'mana_potion',
  name: 'Mana Potion',
  category: 'consumable',
  iconType: 'potion',
  maxStack: 999,
  rarity: 1,
  color: '#2b6eff',
  accentColor: '#8cbdff',
  healMana: 100,
  useTime: 0.25,
  value: 100,
  tooltip: 'Restores 100 mana (Press J for Quick Mana)'
});
reg({
  id: 'ironskin_potion',
  name: 'Ironskin Potion',
  category: 'consumable',
  iconType: 'potion',
  maxStack: 999,
  rarity: 1,
  color: '#f2cb30',
  accentColor: '#fff59e',
  buffId: 'ironskin',
  buffDuration: 240,
  useTime: 0.3,
  value: 200,
  tooltip: 'Increases defense by 8 for 4 minutes'
});
reg({
  id: 'swiftness_potion',
  name: 'Swiftness Potion',
  category: 'consumable',
  iconType: 'potion',
  maxStack: 999,
  rarity: 1,
  color: '#34d968',
  accentColor: '#a6ffbe',
  buffId: 'swiftness',
  buffDuration: 240,
  useTime: 0.3,
  value: 200,
  tooltip: '25% increased movement speed for 4 minutes'
});
reg({
  id: 'regeneration_potion',
  name: 'Regeneration Potion',
  category: 'consumable',
  iconType: 'potion',
  maxStack: 999,
  rarity: 1,
  color: '#d93888',
  accentColor: '#ffa6d2',
  buffId: 'regen',
  buffDuration: 240,
  useTime: 0.3,
  value: 200,
  tooltip: 'Provides rapid life regeneration for 4 minutes'
});
reg({
  id: 'life_crystal',
  name: 'Life Crystal',
  category: 'consumable',
  iconType: 'misc',
  maxStack: 99,
  rarity: 2,
  color: '#ff2b67',
  accentColor: '#ff99bb',
  permMaxHp: 20,
  useTime: 0.4,
  value: 7500,
  tooltip: 'Permanently increases maximum life by 20 (up to 400)'
});
reg({
  id: 'life_fruit',
  name: 'Life Fruit',
  category: 'consumable',
  iconType: 'misc',
  maxStack: 99,
  rarity: 7,
  color: '#e8b923',
  accentColor: '#63cf38',
  permMaxHp: 10,
  useTime: 0.4,
  value: 10000,
  tooltip: 'Permanently increases maximum life by 10 (up to 500)'
});
reg({
  id: 'mana_crystal',
  name: 'Mana Crystal',
  category: 'consumable',
  iconType: 'misc',
  maxStack: 99,
  rarity: 2,
  color: '#387eff',
  accentColor: '#99c4ff',
  permMaxMana: 20,
  useTime: 0.4,
  value: 2500,
  tooltip: 'Permanently increases maximum mana by 20 (up to 200)'
});

// =========================================================
// 8. BOSS SUMMONING ITEMS (All 14 Bosses!)
// =========================================================
reg({
  id: 'slime_crown',
  name: 'Slime Crown',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 1,
  color: '#2e86ff',
  accentColor: '#ffd747',
  summonBoss: 'king_slime',
  useTime: 0.5,
  value: 1000,
  tooltip: 'Summons King Slime'
});
reg({
  id: 'suspicious_looking_eye',
  name: 'Suspicious Looking Eye',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 1,
  color: '#e6e6eb',
  accentColor: '#d92b3a',
  summonBoss: 'eye_of_cthulhu',
  useTime: 0.5,
  value: 1000,
  tooltip: 'Summons the Eye of Cthulhu'
});
reg({
  id: 'worm_food',
  name: 'Worm Food',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 1,
  color: '#6e529c',
  accentColor: '#a4cf55',
  summonBoss: 'eater_of_worlds',
  useTime: 0.5,
  value: 1000,
  tooltip: 'Summons the Eater of Worlds'
});
reg({
  id: 'abeemination',
  name: 'Abeemination',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 2,
  color: '#f5b922',
  accentColor: '#2e261b',
  summonBoss: 'queen_bee',
  useTime: 0.5,
  value: 1500,
  tooltip: 'Summons the Queen Bee'
});
reg({
  id: 'old_mans_curse',
  name: 'Clothier Voodoo / Dungeon Curse',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 2,
  color: '#d9cfb8',
  accentColor: '#b82c2c',
  summonBoss: 'skeletron',
  useTime: 0.5,
  value: 2000,
  tooltip: 'Summons Skeletron, guardian of the Dungeon'
});
reg({
  id: 'guide_voodoo_doll',
  name: 'Guide Voodoo Doll',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 3,
  color: '#b87e56',
  accentColor: '#3b66ab',
  summonBoss: 'wall_of_flesh',
  useTime: 0.5,
  value: 2500,
  tooltip: 'Use or drop in lava to summon the Wall of Flesh and unleash Hardmode!'
});
reg({
  id: 'mechanical_eye',
  name: 'Mechanical Eye',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 4,
  color: '#b8c4d4',
  accentColor: '#ff3838',
  summonBoss: 'the_twins',
  useTime: 0.5,
  value: 4000,
  tooltip: 'Summons The Twins (Retinazer & Spazmatism)'
});
reg({
  id: 'mechanical_worm',
  name: 'Mechanical Worm',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 4,
  color: '#9aa6b8',
  accentColor: '#ff2b2b',
  summonBoss: 'the_destroyer',
  useTime: 0.5,
  value: 4000,
  tooltip: 'Summons The Destroyer'
});
reg({
  id: 'mechanical_skull',
  name: 'Mechanical Skull',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 4,
  color: '#b8c2d1',
  accentColor: '#ff4229',
  summonBoss: 'skeletron_prime',
  useTime: 0.5,
  value: 4000,
  tooltip: 'Summons Skeletron Prime'
});
reg({
  id: 'plantera_seed',
  name: 'Primal Plantera Bulb',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 6,
  color: '#ff59b8',
  accentColor: '#76db46',
  summonBoss: 'plantera',
  useTime: 0.5,
  value: 5000,
  tooltip: 'Summons Plantera (or break a Plantera Bulb in the Jungle)'
});
reg({
  id: 'lihzahrd_power_cell',
  name: 'Lihzahrd Power Cell',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 7,
  color: '#b8631d',
  accentColor: '#ffeb42',
  summonBoss: 'golem',
  useTime: 0.5,
  value: 6000,
  tooltip: 'Summons Golem, guardian of the Jungle Temple'
});
reg({
  id: 'truffle_worm',
  name: 'Truffle Worm',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 7,
  color: '#427bff',
  accentColor: '#d9ebff',
  summonBoss: 'duke_fishron',
  useTime: 0.5,
  value: 8000,
  tooltip: 'Summons Duke Fishron, Mutant Terror of the Sea'
});
reg({
  id: 'cultist_medallion',
  name: 'Ancient Cultist Tablet',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 8,
  color: '#2b52ab',
  accentColor: '#ffd747',
  summonBoss: 'lunatic_cultist',
  useTime: 0.5,
  value: 10000,
  tooltip: 'Summons the Lunatic Cultist'
});
reg({
  id: 'celestial_sigil',
  name: 'Celestial Sigil',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 10,
  color: '#3be8d1',
  accentColor: '#ff771c',
  summonBoss: 'moon_lord',
  useTime: 0.5,
  value: 20000,
  tooltip: 'Summons the Moon Lord — Impending doom approaches...'
});
reg({
  id: 'profaned_core',
  name: 'Profaned Core [Calamity]',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 12,
  color: '#ffaa00',
  accentColor: '#2bff6e',
  summonBoss: 'providence',
  useTime: 0.5,
  value: 50000,
  tooltip: '[Calamity Mod] Summons Providence, the Profaned Goddess'
});
reg({
  id: 'cosmic_worm',
  name: 'Cosmic Worm [Calamity]',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 13,
  color: '#ff29c6',
  accentColor: '#3be8d1',
  summonBoss: 'devourer_of_gods',
  useTime: 0.5,
  value: 75000,
  tooltip: '[Calamity Mod] Summons The Devourer of Gods — "A GOD DOES NOT FEAR DEATH!"'
});
reg({
  id: 'blessed_phoenix_egg',
  name: 'Blessed Phoenix Egg [Calamity]',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 14,
  color: '#ffaa00',
  accentColor: '#ff2942',
  summonBoss: 'yharon',
  useTime: 0.5,
  value: 100000,
  tooltip: '[Calamity Mod] Summons Yharon, Dragon of Rebirth — "The air is getting warmer around you..."'
});
reg({
  id: 'altar_of_accursed',
  name: 'Ashes of Calamity [Calamity]',
  category: 'summon',
  iconType: 'summon',
  maxStack: 20,
  rarity: 15,
  color: '#ff1938',
  accentColor: '#ffaa00',
  summonBoss: 'supreme_calamitas',
  useTime: 0.5,
  value: 150000,
  tooltip: '[Calamity Mod] Summons Supreme Witch, Calamitas — "Do you enjoy going through hell?"'
});

// =========================================================
// 9. ORES, BARS & CRAFTING MATERIALS
// =========================================================
function regOreAndBar(
  prefix: string,
  label: string,
  tile: TileId,
  rarity: number,
  color: string,
  accent: string,
  val: number
): void {
  reg({
    id: `${prefix}_ore`,
    name: `${label} Ore`,
    category: 'block',
    iconType: 'misc',
    maxStack: 9999,
    rarity,
    color,
    accentColor: accent,
    placeTile: tile,
    useTime: 0.12,
    autoReuse: true,
    value: val
  });
  reg({
    id: `${prefix}_bar`,
    name: `${label} Bar`,
    category: 'material',
    iconType: 'bar',
    maxStack: 9999,
    rarity,
    color,
    accentColor: accent,
    value: val * 3
  });
}

regOreAndBar('copper', 'Copper', TileId.COPPER_ORE, 0, '#d9783b', '#ffad70', 25);
regOreAndBar('iron', 'Iron', TileId.IRON_ORE, 0, '#b89f8d', '#e3cfc1', 50);
regOreAndBar('silver', 'Silver', TileId.SILVER_ORE, 0, '#b8cad9', '#eff7ff', 75);
regOreAndBar('gold', 'Gold', TileId.GOLD_ORE, 1, '#e6b82e', '#fff085', 120);
regOreAndBar('demonite', 'Demonite', TileId.DEMONITE_ORE, 1, '#7b5cff', '#b5a3ff', 250);
regOreAndBar('hellstone', 'Hellstone', TileId.HELLSTONE, 2, '#ff6624', '#ffdd55', 350);
regOreAndBar('cobalt', 'Cobalt', TileId.COBALT_ORE, 4, '#1f75fe', '#7ab3ff', 450);
regOreAndBar('mythril', 'Mythril', TileId.MYTHRIL_ORE, 4, '#29cc96', '#8affd4', 600);
regOreAndBar('titanium', 'Titanium', TileId.TITANIUM_ORE, 5, '#c48fd9', '#f3d9ff', 800);
regOreAndBar('chlorophyte', 'Chlorophyte', TileId.CHLOROPHYTE_ORE, 7, '#59e62e', '#baff80', 1200);
regOreAndBar('luminite', 'Luminite', TileId.LUMINITE_ORE, 10, '#42f5d4', '#b8fff0', 2500);

reg({
  id: 'hallowed_bar',
  name: 'Hallowed Bar',
  category: 'material',
  iconType: 'bar',
  maxStack: 9999,
  rarity: 5,
  color: '#ffd747',
  accentColor: '#ff477e',
  value: 2000,
  tooltip: 'Dropped by Mechanical Bosses'
});

reg({
  id: 'gel',
  name: 'Gel',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 0,
  color: '#3498ff',
  accentColor: '#8cc7ff',
  value: 5,
  tooltip: 'Both tasty and flammable'
});
reg({
  id: 'lens',
  name: 'Lens',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 0,
  color: '#e8e8f0',
  accentColor: '#d92b3a',
  value: 50
});
reg({
  id: 'rotten_chunk',
  name: 'Rotten Chunk',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 0,
  color: '#6e529c',
  accentColor: '#9c78cf',
  value: 30
});
reg({
  id: 'shadow_scale',
  name: 'Shadow Scale',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 1,
  color: '#5a3db8',
  accentColor: '#a385ff',
  value: 150
});
reg({
  id: 'stinger',
  name: 'Stinger',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 1,
  color: '#7cd938',
  accentColor: '#c8ff8c',
  value: 80
});
reg({
  id: 'jungle_spores',
  name: 'Jungle Spores',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 1,
  color: '#63eb2d',
  accentColor: '#ccff80',
  value: 90
});
reg({
  id: 'bone',
  name: 'Bone',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 1,
  color: '#e3dec8',
  accentColor: '#ffffff',
  value: 50
});
reg({
  id: 'cobweb',
  name: 'Cobweb',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 0,
  color: '#e0e6ed',
  accentColor: '#ffffff',
  placeTile: TileId.COBWEB,
  value: 5
});
reg({
  id: 'fallen_star',
  name: 'Fallen Star',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 1,
  color: '#ffe038',
  accentColor: '#ffffff',
  value: 250,
  tooltip: 'Used to craft Mana Crystals and magical items'
});
reg({
  id: 'soul_of_light',
  name: 'Soul of Light',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 4,
  color: '#ff66d9',
  accentColor: '#ffd1f3',
  value: 500,
  tooltip: "'The essence of light creatures'"
});
reg({
  id: 'soul_of_night',
  name: 'Soul of Night',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 4,
  color: '#9c42ff',
  accentColor: '#dbb3ff',
  value: 500,
  tooltip: "'The essence of dark creatures'"
});
reg({
  id: 'soul_of_flight',
  name: 'Soul of Flight',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 4,
  color: '#42d4ff',
  accentColor: '#b8f0ff',
  value: 600,
  tooltip: "'The essence of powerful flying creatures'"
});
reg({
  id: 'soul_of_sight',
  name: 'Soul of Sight',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 5,
  color: '#34e875',
  accentColor: '#a8ffc4',
  value: 1200,
  tooltip: "'The essence of all-seeing watchers' (The Twins)"
});
reg({
  id: 'soul_of_might',
  name: 'Soul of Might',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 5,
  color: '#3488ff',
  accentColor: '#a8ccff',
  value: 1200,
  tooltip: "'The essence of the destroyer' (The Destroyer)"
});
reg({
  id: 'soul_of_fright',
  name: 'Soul of Fright',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 5,
  color: '#ff5238',
  accentColor: '#ffb5a8',
  value: 1200,
  tooltip: "'The essence of pure terror' (Skeletron Prime)"
});
reg({
  id: 'solar_fragment',
  name: 'Solar Fragment',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 9,
  color: '#ff771c',
  accentColor: '#ffee55',
  value: 2000,
  tooltip: "'The fury of the universe lies within this fragment'"
});
reg({
  id: 'unholy_essence',
  name: 'Unholy Essence [Calamity]',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 12,
  color: '#ffaa00',
  accentColor: '#ffee55',
  value: 4500,
  tooltip: '[Calamity Mod] Profaned essence dropped by Providence'
});
reg({
  id: 'cosmilite_bar',
  name: 'Cosmilite Bar [Calamity]',
  category: 'material',
  iconType: 'bar',
  maxStack: 9999,
  rarity: 13,
  color: '#ff29c6',
  accentColor: '#3be8d1',
  value: 12000,
  tooltip: '[Calamity Mod] Otherworldly armor plating dropped by The Devourer of Gods'
});
reg({
  id: 'yharon_soul_fragment',
  name: 'Yharon Soul Fragment [Calamity]',
  category: 'material',
  iconType: 'misc',
  maxStack: 9999,
  rarity: 14,
  color: '#ffaa00',
  accentColor: '#ff2942',
  value: 18000,
  tooltip: '[Calamity Mod] A burning shard of the Jungle Dragon’s rebirth soul'
});
reg({
  id: 'auric_bar',
  name: 'Auric Bar [Calamity]',
  category: 'material',
  iconType: 'bar',
  maxStack: 9999,
  rarity: 14,
  color: '#ffaa00',
  accentColor: '#00ffd5',
  value: 25000,
  tooltip: '[Calamity Mod] Draconic gold bar surging with Yharon’s auric voltage'
});
reg({
  id: 'shadowspec_bar',
  name: 'Shadowspec Bar [Calamity]',
  category: 'material',
  iconType: 'bar',
  maxStack: 9999,
  rarity: 15,
  color: '#ff1938',
  accentColor: '#ffaa00',
  value: 40000,
  tooltip: '[Calamity Mod] The pinnacle of Calamity metallurgy — Forged from Supreme Calamitas’s brimstone'
});

// =========================================================
// 10. BLOCKS, WALLS & FURNITURE / STATIONS
// =========================================================
function regBlock(id: string, name: string, tile: TileId, color: string, cat: ItemCategory = 'block'): void {
  reg({
    id,
    name,
    category: cat,
    iconType: 'misc',
    maxStack: 9999,
    rarity: 0,
    color,
    placeTile: tile,
    useTime: 0.11,
    autoReuse: true,
    value: 5
  });
}

regBlock('dirt_block', 'Dirt Block', TileId.DIRT, '#825432');
regBlock('stone_block', 'Stone Block', TileId.STONE, '#767b85');
regBlock('wood', 'Wood', TileId.WOOD_PLANK, '#9c683b');
regBlock('sand_block', 'Sand Block', TileId.SAND, '#ded078');
regBlock('sandstone_block', 'Sandstone Block', TileId.SANDSTONE, '#b89653');
regBlock('snow_block', 'Snow Block', TileId.SNOW, '#dcebf7');
regBlock('ice_block', 'Ice Block', TileId.ICE, '#7dbef0');
regBlock('mud_block', 'Mud Block', TileId.MUD, '#543d46');
regBlock('ebonstone_block', 'Ebonstone Block', TileId.EBONSTONE, '#544575');
regBlock('pearlstone_block', 'Pearlstone Block', TileId.PEARLSTONE, '#d9c5e3');
regBlock('ash_block', 'Ash Block', TileId.ASH, '#453e42');
regBlock('obsidian', 'Obsidian', TileId.OBSIDIAN, '#241838');
regBlock('dungeon_brick', 'Dungeon Brick', TileId.DUNGEON_BRICK, '#384675');
regBlock('lihzahrd_brick', 'Lihzahrd Brick', TileId.LIHZAHRD_BRICK, '#8c4c1e');
regBlock('cloud_block', 'Cloud Block', TileId.CLOUD, '#edf5fc');
regBlock('stone_brick', 'Gray Brick', TileId.STONE_BRICK, '#868b96');
regBlock('glass_block', 'Glass Block', TileId.GLASS, '#a8e6ff');
regBlock('wood_platform', 'Wood Platform', TileId.PLATFORM, '#ad7745');
regBlock('torch', 'Torch', TileId.TORCH, '#ffaa22');
regBlock('campfire', 'Campfire', TileId.CAMPFIRE, '#ff6622', 'station');
regBlock('work_bench', 'Work Bench', TileId.WORK_BENCH, '#9e6637', 'station');
regBlock('furnace', 'Furnace', TileId.FURNACE, '#6e737d', 'station');
regBlock('iron_anvil', 'Iron Anvil', TileId.ANVIL, '#8f96a3', 'station');
regBlock('chest', 'Chest', TileId.CHEST, '#b87635', 'station');
regBlock('wooden_door', 'Wooden Door', TileId.DOOR_CLOSED, '#8f5b30', 'station');
regBlock('wooden_chair', 'Wooden Chair', TileId.CHAIR, '#9c673a', 'station');
regBlock('wooden_table', 'Wooden Table', TileId.TABLE, '#966135', 'station');
regBlock('hellforge', 'Hellforge', TileId.HELLFORGE, '#b82c25', 'station');
regBlock('mythril_anvil', 'Mythril Anvil', TileId.MYTHRIL_ANVIL, '#34bd9b', 'station');
regBlock('adamantite_forge', 'Titanium Forge', TileId.ADAMANTITE_FORGE, '#d9385a', 'station');
regBlock('ancient_manipulator', 'Ancient Manipulator', TileId.ANCIENT_MANIPULATOR, '#2be6b8', 'station');
regBlock('lihzahrd_altar', 'Lihzahrd Altar', TileId.LIHZAHRD_ALTAR, '#b8631d', 'station');
regBlock('spike', 'Spike', TileId.SPIKE, '#8f99ab');
regBlock('sunflower', 'Sunflower', TileId.SUNFLOWER, '#ffd629');

function regWall(id: string, name: string, wall: WallId, color: string): void {
  reg({
    id,
    name,
    category: 'wall',
    iconType: 'misc',
    maxStack: 9999,
    rarity: 0,
    color,
    placeWall: wall,
    useTime: 0.08,
    autoReuse: true,
    value: 2
  });
}

regWall('dirt_wall', 'Dirt Wall', WallId.DIRT, '#47301f');
regWall('stone_wall', 'Stone Wall', WallId.STONE, '#3b3e45');
regWall('wood_wall', 'Wood Wall', WallId.WOOD, '#614126');
regWall('brick_wall', 'Brick Wall', WallId.BRICK, '#52565e');
regWall('glass_wall', 'Glass Wall', WallId.GLASS, '#8fd8ff');
