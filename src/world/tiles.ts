export enum TileId {
  AIR = 0,
  DIRT = 1,
  GRASS = 2,
  STONE = 3,
  WOOD = 4,
  LEAVES = 5,
  SAND = 6,
  SANDSTONE = 7,
  SNOW = 8,
  ICE = 9,
  MUD = 10,
  JUNGLE_GRASS = 11,
  EBONSTONE = 12,
  CORRUPT_GRASS = 13,
  PEARLSTONE = 14,
  HALLOWED_GRASS = 15,
  ASH = 16,
  HELLSTONE = 17,
  OBSIDIAN = 18,
  DUNGEON_BRICK = 19,
  LIHZAHRD_BRICK = 20,
  CLOUD = 21,
  WOOD_PLANK = 22,
  STONE_BRICK = 23,
  GLASS = 24,
  PLATFORM = 25,
  TORCH = 26,
  CAMPFIRE = 27,
  WORK_BENCH = 28,
  FURNACE = 29,
  ANVIL = 30,
  CHEST = 31,
  DOOR_CLOSED = 32,
  DOOR_OPEN = 33,
  CHAIR = 34,
  TABLE = 35,
  HEART_CRYSTAL = 36,
  LIFE_FRUIT = 37,
  DEMON_ALTAR = 38,
  PLANTERA_BULB = 39,
  LIHZAHRD_ALTAR = 40,
  HELLFORGE = 41,
  MYTHRIL_ANVIL = 42,
  ADAMANTITE_FORGE = 43,
  ANCIENT_MANIPULATOR = 44,
  // Ores
  COPPER_ORE = 45,
  IRON_ORE = 46,
  SILVER_ORE = 47,
  GOLD_ORE = 48,
  DEMONITE_ORE = 49,
  COBALT_ORE = 50,
  MYTHRIL_ORE = 51,
  TITANIUM_ORE = 52,
  CHLOROPHYTE_ORE = 53,
  LUMINITE_ORE = 54,
  POT = 55,
  COBWEB = 56,
  SPIKE = 57,
  SUNFLOWER = 58
}

export enum WallId {
  NONE = 0,
  DIRT = 1,
  STONE = 2,
  WOOD = 3,
  BRICK = 4,
  DUNGEON = 5,
  JUNGLE = 6,
  CORRUPT = 7,
  LIHZAHRD = 8,
  GLASS = 9,
  CLOUD = 10
}

export enum LiquidType {
  NONE = 0,
  WATER = 1,
  LAVA = 2,
  HONEY = 3
}

export interface TileDef {
  id: TileId;
  name: string;
  solid: boolean;
  platform?: boolean;
  transparent?: boolean;
  hardness: number; // HP to mine
  minPick?: number; // Minimum pickaxe power required
  tool: 'pick' | 'axe' | 'hammer' | 'any';
  dropItemId?: string;
  color: string;
  accentColor?: string;
  speckleColor?: string;
  light?: [number, number, number]; // RGB 0..1
  damageOnTouch?: number;
  isOre?: boolean;
  isStation?: boolean;
}

export interface WallDef {
  id: WallId;
  name: string;
  color: string;
  accentColor: string;
  dropItemId?: string;
  houseValid: boolean;
}

export const WALL_DEFS: Record<WallId, WallDef> = {
  [WallId.NONE]: { id: WallId.NONE, name: 'None', color: '#000000', accentColor: '#000000', houseValid: false },
  [WallId.DIRT]: { id: WallId.DIRT, name: 'Dirt Wall', color: '#47301f', accentColor: '#362315', dropItemId: 'dirt_wall', houseValid: false },
  [WallId.STONE]: { id: WallId.STONE, name: 'Stone Wall', color: '#3b3e45', accentColor: '#2c2f36', dropItemId: 'stone_wall', houseValid: false },
  [WallId.WOOD]: { id: WallId.WOOD, name: 'Wood Wall', color: '#614126', accentColor: '#4c321b', dropItemId: 'wood_wall', houseValid: true },
  [WallId.BRICK]: { id: WallId.BRICK, name: 'Brick Wall', color: '#52565e', accentColor: '#3a3d45', dropItemId: 'brick_wall', houseValid: true },
  [WallId.DUNGEON]: { id: WallId.DUNGEON, name: 'Dungeon Wall', color: '#242b47', accentColor: '#191f36', houseValid: true },
  [WallId.JUNGLE]: { id: WallId.JUNGLE, name: 'Jungle Wall', color: '#2b4221', accentColor: '#1d2e16', houseValid: false },
  [WallId.CORRUPT]: { id: WallId.CORRUPT, name: 'Ebonstone Wall', color: '#2d233d', accentColor: '#1f172b', houseValid: false },
  [WallId.LIHZAHRD]: { id: WallId.LIHZAHRD, name: 'Lihzahrd Wall', color: '#4a2912', accentColor: '#331b0a', houseValid: true },
  [WallId.GLASS]: { id: WallId.GLASS, name: 'Glass Wall', color: '#8fd8ff44', accentColor: '#ffffff55', dropItemId: 'glass_wall', houseValid: true },
  [WallId.CLOUD]: { id: WallId.CLOUD, name: 'Cloud Wall', color: '#cfdbe6', accentColor: '#b3c4d4', houseValid: true }
};

export const TILE_DEFS: Record<TileId, TileDef> = {
  [TileId.AIR]: {
    id: TileId.AIR,
    name: 'Air',
    solid: false,
    transparent: true,
    hardness: 0,
    tool: 'any',
    color: 'transparent'
  },
  [TileId.DIRT]: {
    id: TileId.DIRT,
    name: 'Dirt Block',
    solid: true,
    hardness: 30,
    tool: 'pick',
    dropItemId: 'dirt_block',
    color: '#825432',
    accentColor: '#6b4226',
    speckleColor: '#9c6944'
  },
  [TileId.GRASS]: {
    id: TileId.GRASS,
    name: 'Grass Block',
    solid: true,
    hardness: 35,
    tool: 'pick',
    dropItemId: 'dirt_block',
    color: '#825432',
    accentColor: '#30a846',
    speckleColor: '#48cc5e'
  },
  [TileId.STONE]: {
    id: TileId.STONE,
    name: 'Stone Block',
    solid: true,
    hardness: 65,
    tool: 'pick',
    dropItemId: 'stone_block',
    color: '#767b85',
    accentColor: '#5c6069',
    speckleColor: '#9197a3'
  },
  [TileId.WOOD]: {
    id: TileId.WOOD,
    name: 'Living Wood / Tree Trunk',
    solid: false,
    transparent: true,
    hardness: 55,
    tool: 'axe',
    dropItemId: 'wood',
    color: '#8c5b32',
    accentColor: '#694121',
    speckleColor: '#a67144'
  },
  [TileId.LEAVES]: {
    id: TileId.LEAVES,
    name: 'Tree Leaves',
    solid: false,
    transparent: true,
    hardness: 15,
    tool: 'any',
    color: '#288f3b',
    accentColor: '#1d6e2c',
    speckleColor: '#42b858'
  },
  [TileId.SAND]: {
    id: TileId.SAND,
    name: 'Sand Block',
    solid: true,
    hardness: 28,
    tool: 'pick',
    dropItemId: 'sand_block',
    color: '#ded078',
    accentColor: '#c7b65d',
    speckleColor: '#f2e694'
  },
  [TileId.SANDSTONE]: {
    id: TileId.SANDSTONE,
    name: 'Sandstone Block',
    solid: true,
    hardness: 60,
    tool: 'pick',
    dropItemId: 'sandstone_block',
    color: '#b89653',
    accentColor: '#997a3d',
    speckleColor: '#cfaf6b'
  },
  [TileId.SNOW]: {
    id: TileId.SNOW,
    name: 'Snow Block',
    solid: true,
    hardness: 30,
    tool: 'pick',
    dropItemId: 'snow_block',
    color: '#dcebf7',
    accentColor: '#bbd3e8',
    speckleColor: '#ffffff'
  },
  [TileId.ICE]: {
    id: TileId.ICE,
    name: 'Ice Block',
    solid: true,
    hardness: 55,
    tool: 'pick',
    dropItemId: 'ice_block',
    color: '#7dbef0',
    accentColor: '#5da2db',
    speckleColor: '#b5dfff'
  },
  [TileId.MUD]: {
    id: TileId.MUD,
    name: 'Mud Block',
    solid: true,
    hardness: 35,
    tool: 'pick',
    dropItemId: 'mud_block',
    color: '#543d46',
    accentColor: '#3f2c34',
    speckleColor: '#6b4e59'
  },
  [TileId.JUNGLE_GRASS]: {
    id: TileId.JUNGLE_GRASS,
    name: 'Jungle Grass',
    solid: true,
    hardness: 40,
    tool: 'pick',
    dropItemId: 'mud_block',
    color: '#543d46',
    accentColor: '#69c42b',
    speckleColor: '#8ae04a'
  },
  [TileId.EBONSTONE]: {
    id: TileId.EBONSTONE,
    name: 'Ebonstone Block',
    solid: true,
    hardness: 110,
    minPick: 65,
    tool: 'pick',
    dropItemId: 'ebonstone_block',
    color: '#544575',
    accentColor: '#3d3159',
    speckleColor: '#73609e'
  },
  [TileId.CORRUPT_GRASS]: {
    id: TileId.CORRUPT_GRASS,
    name: 'Corrupt Grass',
    solid: true,
    hardness: 40,
    tool: 'pick',
    dropItemId: 'dirt_block',
    color: '#6b4c3b',
    accentColor: '#7c52bd',
    speckleColor: '#9c71de'
  },
  [TileId.PEARLSTONE]: {
    id: TileId.PEARLSTONE,
    name: 'Pearlstone Block',
    solid: true,
    hardness: 130,
    minPick: 100,
    tool: 'pick',
    dropItemId: 'pearlstone_block',
    color: '#d9c5e3',
    accentColor: '#bfa4cf',
    speckleColor: '#f5e9fc'
  },
  [TileId.HALLOWED_GRASS]: {
    id: TileId.HALLOWED_GRASS,
    name: 'Hallowed Grass',
    solid: true,
    hardness: 40,
    tool: 'pick',
    dropItemId: 'dirt_block',
    color: '#825432',
    accentColor: '#42b9f5',
    speckleColor: '#7adeff'
  },
  [TileId.ASH]: {
    id: TileId.ASH,
    name: 'Ash Block',
    solid: true,
    hardness: 40,
    tool: 'pick',
    dropItemId: 'ash_block',
    color: '#453e42',
    accentColor: '#332d30',
    speckleColor: '#5c5258'
  },
  [TileId.HELLSTONE]: {
    id: TileId.HELLSTONE,
    name: 'Hellstone',
    solid: true,
    hardness: 120,
    minPick: 65,
    tool: 'pick',
    dropItemId: 'hellstone_ore',
    color: '#9c2c1f',
    accentColor: '#ff6624',
    speckleColor: '#ffba42',
    light: [0.65, 0.25, 0.08],
    damageOnTouch: 15,
    isOre: true
  },
  [TileId.OBSIDIAN]: {
    id: TileId.OBSIDIAN,
    name: 'Obsidian',
    solid: true,
    hardness: 115,
    minPick: 55,
    tool: 'pick',
    dropItemId: 'obsidian',
    color: '#241838',
    accentColor: '#140c21',
    speckleColor: '#4c3278'
  },
  [TileId.DUNGEON_BRICK]: {
    id: TileId.DUNGEON_BRICK,
    name: 'Dungeon Brick',
    solid: true,
    hardness: 120,
    minPick: 65,
    tool: 'pick',
    dropItemId: 'dungeon_brick',
    color: '#384675',
    accentColor: '#253054',
    speckleColor: '#50629c'
  },
  [TileId.LIHZAHRD_BRICK]: {
    id: TileId.LIHZAHRD_BRICK,
    name: 'Lihzahrd Brick',
    solid: true,
    hardness: 240,
    minPick: 210,
    tool: 'pick',
    dropItemId: 'lihzahrd_brick',
    color: '#8c4c1e',
    accentColor: '#5e300f',
    speckleColor: '#ba6c32'
  },
  [TileId.CLOUD]: {
    id: TileId.CLOUD,
    name: 'Cloud',
    solid: true,
    hardness: 35,
    tool: 'pick',
    dropItemId: 'cloud_block',
    color: '#edf5fc',
    accentColor: '#d0e2f2',
    speckleColor: '#ffffff'
  },
  [TileId.WOOD_PLANK]: {
    id: TileId.WOOD_PLANK,
    name: 'Wood Block',
    solid: true,
    hardness: 45,
    tool: 'pick',
    dropItemId: 'wood',
    color: '#9c683b',
    accentColor: '#784e29',
    speckleColor: '#b57e4e'
  },
  [TileId.STONE_BRICK]: {
    id: TileId.STONE_BRICK,
    name: 'Gray Brick',
    solid: true,
    hardness: 70,
    tool: 'pick',
    dropItemId: 'stone_brick',
    color: '#868b96',
    accentColor: '#636873',
    speckleColor: '#a6acb8'
  },
  [TileId.GLASS]: {
    id: TileId.GLASS,
    name: 'Glass Block',
    solid: true,
    transparent: true,
    hardness: 25,
    tool: 'pick',
    dropItemId: 'glass_block',
    color: '#a8e6ff',
    accentColor: '#dcf5ff',
    speckleColor: '#ffffff'
  },
  [TileId.PLATFORM]: {
    id: TileId.PLATFORM,
    name: 'Wood Platform',
    solid: false,
    platform: true,
    transparent: true,
    hardness: 18,
    tool: 'any',
    dropItemId: 'wood_platform',
    color: '#ad7745',
    accentColor: '#7a5029'
  },
  [TileId.TORCH]: {
    id: TileId.TORCH,
    name: 'Torch',
    solid: false,
    transparent: true,
    hardness: 5,
    tool: 'any',
    dropItemId: 'torch',
    color: '#ffaa22',
    accentColor: '#ffee77',
    light: [1.0, 0.88, 0.55]
  },
  [TileId.CAMPFIRE]: {
    id: TileId.CAMPFIRE,
    name: 'Campfire',
    solid: false,
    transparent: true,
    hardness: 20,
    tool: 'any',
    dropItemId: 'campfire',
    color: '#ff6622',
    accentColor: '#ffcc44',
    light: [1.0, 0.72, 0.42],
    isStation: true
  },
  [TileId.WORK_BENCH]: {
    id: TileId.WORK_BENCH,
    name: 'Work Bench',
    solid: false,
    platform: true,
    transparent: true,
    hardness: 30,
    tool: 'any',
    dropItemId: 'work_bench',
    color: '#9e6637',
    accentColor: '#6e431f',
    isStation: true
  },
  [TileId.FURNACE]: {
    id: TileId.FURNACE,
    name: 'Furnace',
    solid: false,
    transparent: true,
    hardness: 45,
    tool: 'pick',
    dropItemId: 'furnace',
    color: '#6e737d',
    accentColor: '#ff7722',
    light: [0.7, 0.45, 0.2],
    isStation: true
  },
  [TileId.ANVIL]: {
    id: TileId.ANVIL,
    name: 'Iron Anvil',
    solid: false,
    platform: true,
    transparent: true,
    hardness: 50,
    tool: 'pick',
    dropItemId: 'iron_anvil',
    color: '#8f96a3',
    accentColor: '#595f69',
    isStation: true
  },
  [TileId.CHEST]: {
    id: TileId.CHEST,
    name: 'Chest',
    solid: false,
    transparent: true,
    hardness: 50,
    tool: 'pick',
    dropItemId: 'chest',
    color: '#b87635',
    accentColor: '#ffd24c'
  },
  [TileId.DOOR_CLOSED]: {
    id: TileId.DOOR_CLOSED,
    name: 'Wooden Door (Closed)',
    solid: true,
    transparent: true,
    hardness: 40,
    tool: 'any',
    dropItemId: 'wooden_door',
    color: '#8f5b30',
    accentColor: '#d9b44a'
  },
  [TileId.DOOR_OPEN]: {
    id: TileId.DOOR_OPEN,
    name: 'Wooden Door (Open)',
    solid: false,
    transparent: true,
    hardness: 40,
    tool: 'any',
    dropItemId: 'wooden_door',
    color: '#734824',
    accentColor: '#b89435'
  },
  [TileId.CHAIR]: {
    id: TileId.CHAIR,
    name: 'Wooden Chair',
    solid: false,
    transparent: true,
    hardness: 25,
    tool: 'any',
    dropItemId: 'wooden_chair',
    color: '#9c673a',
    accentColor: '#6b4322'
  },
  [TileId.TABLE]: {
    id: TileId.TABLE,
    name: 'Wooden Table',
    solid: false,
    platform: true,
    transparent: true,
    hardness: 30,
    tool: 'any',
    dropItemId: 'wooden_table',
    color: '#966135',
    accentColor: '#69401f',
    isStation: true
  },
  [TileId.HEART_CRYSTAL]: {
    id: TileId.HEART_CRYSTAL,
    name: 'Life Crystal',
    solid: false,
    transparent: true,
    hardness: 65,
    tool: 'pick',
    dropItemId: 'life_crystal',
    color: '#ff2b67',
    accentColor: '#ff8fb1',
    light: [0.7, 0.18, 0.35]
  },
  [TileId.LIFE_FRUIT]: {
    id: TileId.LIFE_FRUIT,
    name: 'Life Fruit',
    solid: false,
    transparent: true,
    hardness: 65,
    tool: 'any',
    dropItemId: 'life_fruit',
    color: '#e8b923',
    accentColor: '#63cf38',
    light: [0.55, 0.5, 0.15]
  },
  [TileId.DEMON_ALTAR]: {
    id: TileId.DEMON_ALTAR,
    name: 'Demon Altar',
    solid: false,
    transparent: true,
    hardness: 140,
    minPick: 80, // Pwnhammer / Hardmode hammer power
    tool: 'hammer',
    color: '#6b2d99',
    accentColor: '#bf55ec',
    light: [0.5, 0.2, 0.7],
    isStation: true
  },
  [TileId.PLANTERA_BULB]: {
    id: TileId.PLANTERA_BULB,
    name: "Plantera's Bulb",
    solid: false,
    transparent: true,
    hardness: 45,
    tool: 'pick',
    color: '#ff59b8',
    accentColor: '#76db46',
    light: [0.75, 0.28, 0.58]
  },
  [TileId.LIHZAHRD_ALTAR]: {
    id: TileId.LIHZAHRD_ALTAR,
    name: 'Lihzahrd Altar',
    solid: false,
    transparent: true,
    hardness: 250,
    minPick: 210,
    tool: 'pick',
    dropItemId: 'lihzahrd_altar',
    color: '#b8631d',
    accentColor: '#ffdd44',
    light: [0.75, 0.6, 0.15],
    isStation: true
  },
  [TileId.HELLFORGE]: {
    id: TileId.HELLFORGE,
    name: 'Hellforge',
    solid: false,
    transparent: true,
    hardness: 85,
    minPick: 60,
    tool: 'pick',
    dropItemId: 'hellforge',
    color: '#b82c25',
    accentColor: '#ff9922',
    light: [0.85, 0.35, 0.15],
    isStation: true
  },
  [TileId.MYTHRIL_ANVIL]: {
    id: TileId.MYTHRIL_ANVIL,
    name: 'Mythril Anvil',
    solid: false,
    platform: true,
    transparent: true,
    hardness: 80,
    tool: 'pick',
    dropItemId: 'mythril_anvil',
    color: '#34bd9b',
    accentColor: '#7cf2d5',
    isStation: true
  },
  [TileId.ADAMANTITE_FORGE]: {
    id: TileId.ADAMANTITE_FORGE,
    name: 'Titanium Forge',
    solid: false,
    transparent: true,
    hardness: 95,
    tool: 'pick',
    dropItemId: 'adamantite_forge',
    color: '#d9385a',
    accentColor: '#ffaa44',
    light: [0.85, 0.3, 0.4],
    isStation: true
  },
  [TileId.ANCIENT_MANIPULATOR]: {
    id: TileId.ANCIENT_MANIPULATOR,
    name: 'Ancient Manipulator',
    solid: false,
    transparent: true,
    hardness: 110,
    tool: 'pick',
    dropItemId: 'ancient_manipulator',
    color: '#2be6b8',
    accentColor: '#ff8a2b',
    light: [0.35, 0.85, 0.75],
    isStation: true
  },
  [TileId.COPPER_ORE]: {
    id: TileId.COPPER_ORE,
    name: 'Copper Ore',
    solid: true,
    hardness: 65,
    tool: 'pick',
    dropItemId: 'copper_ore',
    color: '#767b85',
    accentColor: '#d9783b',
    speckleColor: '#ffad70',
    isOre: true
  },
  [TileId.IRON_ORE]: {
    id: TileId.IRON_ORE,
    name: 'Iron Ore',
    solid: true,
    hardness: 75,
    tool: 'pick',
    dropItemId: 'iron_ore',
    color: '#767b85',
    accentColor: '#b89f8d',
    speckleColor: '#e3cfc1',
    isOre: true
  },
  [TileId.SILVER_ORE]: {
    id: TileId.SILVER_ORE,
    name: 'Silver Ore',
    solid: true,
    hardness: 85,
    tool: 'pick',
    dropItemId: 'silver_ore',
    color: '#767b85',
    accentColor: '#b8cad9',
    speckleColor: '#eff7ff',
    isOre: true
  },
  [TileId.GOLD_ORE]: {
    id: TileId.GOLD_ORE,
    name: 'Gold Ore',
    solid: true,
    hardness: 95,
    tool: 'pick',
    dropItemId: 'gold_ore',
    color: '#767b85',
    accentColor: '#e6b82e',
    speckleColor: '#fff085',
    isOre: true
  },
  [TileId.DEMONITE_ORE]: {
    id: TileId.DEMONITE_ORE,
    name: 'Demonite Ore',
    solid: true,
    hardness: 110,
    minPick: 55,
    tool: 'pick',
    dropItemId: 'demonite_ore',
    color: '#544575',
    accentColor: '#7b5cff',
    speckleColor: '#b5a3ff',
    light: [0.22, 0.15, 0.45],
    isOre: true
  },
  [TileId.COBALT_ORE]: {
    id: TileId.COBALT_ORE,
    name: 'Cobalt Ore',
    solid: true,
    hardness: 135,
    minPick: 100,
    tool: 'pick',
    dropItemId: 'cobalt_ore',
    color: '#6b7385',
    accentColor: '#1f75fe',
    speckleColor: '#7ab3ff',
    isOre: true
  },
  [TileId.MYTHRIL_ORE]: {
    id: TileId.MYTHRIL_ORE,
    name: 'Mythril Ore',
    solid: true,
    hardness: 155,
    minPick: 110,
    tool: 'pick',
    dropItemId: 'mythril_ore',
    color: '#6b7385',
    accentColor: '#29cc96',
    speckleColor: '#8affd4',
    isOre: true
  },
  [TileId.TITANIUM_ORE]: {
    id: TileId.TITANIUM_ORE,
    name: 'Titanium Ore',
    solid: true,
    hardness: 175,
    minPick: 150,
    tool: 'pick',
    dropItemId: 'titanium_ore',
    color: '#6b7385',
    accentColor: '#c48fd9',
    speckleColor: '#f3d9ff',
    isOre: true
  },
  [TileId.CHLOROPHYTE_ORE]: {
    id: TileId.CHLOROPHYTE_ORE,
    name: 'Chlorophyte Ore',
    solid: true,
    hardness: 205,
    minPick: 200,
    tool: 'pick',
    dropItemId: 'chlorophyte_ore',
    color: '#46543d',
    accentColor: '#59e62e',
    speckleColor: '#baff80',
    light: [0.18, 0.45, 0.12],
    isOre: true
  },
  [TileId.LUMINITE_ORE]: {
    id: TileId.LUMINITE_ORE,
    name: 'Luminite Ore',
    solid: true,
    hardness: 220,
    minPick: 210,
    tool: 'pick',
    dropItemId: 'luminite_ore',
    color: '#283d3b',
    accentColor: '#42f5d4',
    speckleColor: '#b8fff0',
    light: [0.25, 0.7, 0.6],
    isOre: true
  },
  [TileId.POT]: {
    id: TileId.POT,
    name: 'Clay Pot',
    solid: false,
    transparent: true,
    hardness: 5,
    tool: 'any',
    color: '#a85638',
    accentColor: '#7a3921'
  },
  [TileId.COBWEB]: {
    id: TileId.COBWEB,
    name: 'Cobweb',
    solid: false,
    transparent: true,
    hardness: 5,
    tool: 'any',
    dropItemId: 'cobweb',
    color: '#d9e0e6',
    accentColor: '#ffffff'
  },
  [TileId.SPIKE]: {
    id: TileId.SPIKE,
    name: 'Dungeon Spike',
    solid: true,
    hardness: 95,
    tool: 'pick',
    dropItemId: 'spike',
    color: '#8f99ab',
    accentColor: '#d0dae8',
    damageOnTouch: 30
  },
  [TileId.SUNFLOWER]: {
    id: TileId.SUNFLOWER,
    name: 'Sunflower',
    solid: false,
    transparent: true,
    hardness: 15,
    tool: 'any',
    dropItemId: 'sunflower',
    color: '#ffd629',
    accentColor: '#3db846',
    light: [0.35, 0.32, 0.12]
  }
};
