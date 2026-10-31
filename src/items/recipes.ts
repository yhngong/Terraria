import { TileId } from '../world/tiles';

export interface RecipeIngredient {
  id: string;
  count: number;
}

export interface Recipe {
  result: string;
  count: number;
  ingredients: RecipeIngredient[];
  station?: TileId; // undefined = craftable by hand
}

export const RECIPES: Recipe[] = [
  // =========================================================
  // HAND CRAFTING
  // =========================================================
  { result: 'torch', count: 3, ingredients: [{ id: 'wood', count: 1 }, { id: 'gel', count: 1 }] },
  { result: 'campfire', count: 1, ingredients: [{ id: 'wood', count: 10 }, { id: 'torch', count: 5 }] },
  { result: 'wood_platform', count: 2, ingredients: [{ id: 'wood', count: 1 }] },
  { result: 'wood', count: 1, ingredients: [{ id: 'wood_platform', count: 2 }] },
  { result: 'work_bench', count: 1, ingredients: [{ id: 'wood', count: 10 }] },
  { result: 'mana_crystal', count: 1, ingredients: [{ id: 'fallen_star', count: 5 }] },

  // =========================================================
  // WORK BENCH
  // =========================================================
  { result: 'wooden_sword', count: 1, station: TileId.WORK_BENCH, ingredients: [{ id: 'wood', count: 7 }] },
  { result: 'wooden_bow', count: 1, station: TileId.WORK_BENCH, ingredients: [{ id: 'wood', count: 10 }] },
  { result: 'wooden_arrow', count: 25, station: TileId.WORK_BENCH, ingredients: [{ id: 'wood', count: 1 }, { id: 'stone_block', count: 1 }] },
  { result: 'flaming_arrow', count: 10, station: TileId.WORK_BENCH, ingredients: [{ id: 'wooden_arrow', count: 10 }, { id: 'torch', count: 1 }] },
  { result: 'wood_helmet', count: 1, station: TileId.WORK_BENCH, ingredients: [{ id: 'wood', count: 20 }] },
  { result: 'wood_breastplate', count: 1, station: TileId.WORK_BENCH, ingredients: [{ id: 'wood', count: 30 }] },
  { result: 'wood_leggings', count: 1, station: TileId.WORK_BENCH, ingredients: [{ id: 'wood', count: 25 }] },
  { result: 'wooden_door', count: 1, station: TileId.WORK_BENCH, ingredients: [{ id: 'wood', count: 6 }] },
  { result: 'wooden_chair', count: 1, station: TileId.WORK_BENCH, ingredients: [{ id: 'wood', count: 4 }] },
  { result: 'wooden_table', count: 1, station: TileId.WORK_BENCH, ingredients: [{ id: 'wood', count: 8 }] },
  { result: 'chest', count: 1, station: TileId.WORK_BENCH, ingredients: [{ id: 'wood', count: 8 }, { id: 'iron_bar', count: 2 }] },
  { result: 'furnace', count: 1, station: TileId.WORK_BENCH, ingredients: [{ id: 'stone_block', count: 20 }, { id: 'wood', count: 4 }, { id: 'torch', count: 3 }] },
  { result: 'wood_wall', count: 4, station: TileId.WORK_BENCH, ingredients: [{ id: 'wood', count: 1 }] },
  { result: 'stone_wall', count: 4, station: TileId.WORK_BENCH, ingredients: [{ id: 'stone_block', count: 1 }] },
  { result: 'dirt_wall', count: 4, station: TileId.WORK_BENCH, ingredients: [{ id: 'dirt_block', count: 1 }] },
  { result: 'brick_wall', count: 4, station: TileId.WORK_BENCH, ingredients: [{ id: 'stone_brick', count: 1 }] },
  { result: 'glass_wall', count: 4, station: TileId.WORK_BENCH, ingredients: [{ id: 'glass_block', count: 1 }] },
  { result: 'lesser_healing_potion', count: 2, station: TileId.WORK_BENCH, ingredients: [{ id: 'gel', count: 2 }, { id: 'glass_block', count: 1 }] },
  { result: 'healing_potion', count: 2, station: TileId.WORK_BENCH, ingredients: [{ id: 'lesser_healing_potion', count: 2 }, { id: 'jungle_spores', count: 1 }] },
  { result: 'mana_potion', count: 2, station: TileId.WORK_BENCH, ingredients: [{ id: 'gel', count: 2 }, { id: 'fallen_star', count: 1 }] },
  { result: 'ironskin_potion', count: 1, station: TileId.WORK_BENCH, ingredients: [{ id: 'iron_ore', count: 1 }, { id: 'gel', count: 2 }] },
  { result: 'swiftness_potion', count: 1, station: TileId.WORK_BENCH, ingredients: [{ id: 'sand_block', count: 1 }, { id: 'gel', count: 2 }] },
  { result: 'regeneration_potion', count: 1, station: TileId.WORK_BENCH, ingredients: [{ id: 'jungle_spores', count: 1 }, { id: 'gel', count: 2 }] },

  // =========================================================
  // FURNACE
  // =========================================================
  { result: 'copper_bar', count: 1, station: TileId.FURNACE, ingredients: [{ id: 'copper_ore', count: 3 }] },
  { result: 'iron_bar', count: 1, station: TileId.FURNACE, ingredients: [{ id: 'iron_ore', count: 3 }] },
  { result: 'silver_bar', count: 1, station: TileId.FURNACE, ingredients: [{ id: 'silver_ore', count: 4 }] },
  { result: 'gold_bar', count: 1, station: TileId.FURNACE, ingredients: [{ id: 'gold_ore', count: 4 }] },
  { result: 'demonite_bar', count: 1, station: TileId.FURNACE, ingredients: [{ id: 'demonite_ore', count: 3 }] },
  { result: 'glass_block', count: 1, station: TileId.FURNACE, ingredients: [{ id: 'sand_block', count: 2 }] },
  { result: 'stone_brick', count: 1, station: TileId.FURNACE, ingredients: [{ id: 'stone_block', count: 2 }] },
  { result: 'obsidian_skull', count: 1, station: TileId.FURNACE, ingredients: [{ id: 'obsidian', count: 20 }] },

  // =========================================================
  // IRON ANVIL
  // =========================================================
  { result: 'iron_anvil', count: 1, station: TileId.WORK_BENCH, ingredients: [{ id: 'iron_bar', count: 5 }] },
  { result: 'iron_pickaxe', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'iron_bar', count: 10 }, { id: 'wood', count: 3 }] },
  { result: 'iron_broadsword', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'iron_bar', count: 8 }] },
  { result: 'iron_helmet', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'iron_bar', count: 15 }] },
  { result: 'iron_breastplate', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'iron_bar', count: 25 }] },
  { result: 'iron_leggings', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'iron_bar', count: 20 }] },

  { result: 'gold_pickaxe', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'gold_bar', count: 10 }, { id: 'wood', count: 4 }] },
  { result: 'gold_broadsword', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'gold_bar', count: 8 }] },
  { result: 'gold_helmet', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'gold_bar', count: 15 }] },
  { result: 'gold_breastplate', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'gold_bar', count: 25 }] },
  { result: 'gold_leggings', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'gold_bar', count: 20 }] },

  { result: 'lights_bane', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'demonite_bar', count: 10 }] },
  { result: 'demon_bow', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'demonite_bar', count: 8 }] },
  { result: 'nightmare_pickaxe', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'demonite_bar', count: 12 }, { id: 'shadow_scale', count: 6 }] },
  { result: 'shadow_helmet', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'demonite_bar', count: 15 }, { id: 'shadow_scale', count: 10 }] },
  { result: 'shadow_breastplate', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'demonite_bar', count: 25 }, { id: 'shadow_scale', count: 20 }] },
  { result: 'shadow_leggings', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'demonite_bar', count: 20 }, { id: 'shadow_scale', count: 15 }] },

  { result: 'blade_of_grass', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'jungle_spores', count: 12 }, { id: 'stinger', count: 12 }] },
  { result: 'grappling_hook', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'iron_bar', count: 10 }, { id: 'cobweb', count: 15 }] },
  { result: 'musket_ball', count: 50, station: TileId.ANVIL, ingredients: [{ id: 'iron_bar', count: 1 }] },

  // =========================================================
  // HELLFORGE & MOLTEN TIER
  // =========================================================
  { result: 'hellforge', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'furnace', count: 1 }, { id: 'hellstone_ore', count: 10 }] },
  { result: 'hellstone_bar', count: 1, station: TileId.HELLFORGE, ingredients: [{ id: 'hellstone_ore', count: 3 }, { id: 'obsidian', count: 1 }] },
  { result: 'molten_pickaxe', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'hellstone_bar', count: 20 }] },
  { result: 'fiery_greatsword', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'hellstone_bar', count: 20 }] },
  { result: 'molten_fury', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'hellstone_bar', count: 15 }] },
  { result: 'molten_helmet', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'hellstone_bar', count: 10 }] },
  { result: 'molten_breastplate', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'hellstone_bar', count: 20 }] },
  { result: 'molten_leggings', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'hellstone_bar', count: 15 }] },

  // =========================================================
  // DEMON ALTAR & BOSS SUMMONS
  // =========================================================
  {
    result: 'nights_edge',
    count: 1,
    station: TileId.DEMON_ALTAR,
    ingredients: [
      { id: 'lights_bane', count: 1 },
      { id: 'blade_of_grass', count: 1 },
      { id: 'muramasa', count: 1 },
      { id: 'fiery_greatsword', count: 1 }
    ]
  },
  { result: 'slime_crown', count: 1, ingredients: [{ id: 'gel', count: 20 }, { id: 'gold_bar', count: 1 }] },
  { result: 'suspicious_looking_eye', count: 1, ingredients: [{ id: 'lens', count: 6 }] },
  { result: 'worm_food', count: 1, ingredients: [{ id: 'rotten_chunk', count: 8 }, { id: 'ebonstone_block', count: 5 }] },
  { result: 'abeemination', count: 1, ingredients: [{ id: 'stinger', count: 4 }, { id: 'jungle_spores', count: 4 }, { id: 'mud_block', count: 5 }] },
  { result: 'old_mans_curse', count: 1, ingredients: [{ id: 'bone', count: 10 }, { id: 'cobweb', count: 10 }] },
  { result: 'guide_voodoo_doll', count: 1, ingredients: [{ id: 'ash_block', count: 15 }, { id: 'hellstone_ore', count: 5 }] },

  // =========================================================
  // HARDMODE: COBALT, MYTHRIL, TITANIUM, HALLOWED, CHLOROPHYTE, SOLAR
  // =========================================================
  { result: 'cobalt_bar', count: 1, station: TileId.HELLFORGE, ingredients: [{ id: 'cobalt_ore', count: 3 }] },
  { result: 'mythril_bar', count: 1, station: TileId.HELLFORGE, ingredients: [{ id: 'mythril_ore', count: 4 }] },
  { result: 'mythril_anvil', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'mythril_bar', count: 10 }] },
  { result: 'adamantite_forge', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'hellforge', count: 1 }, { id: 'titanium_ore', count: 15 }] },
  { result: 'titanium_bar', count: 1, station: TileId.ADAMANTITE_FORGE, ingredients: [{ id: 'titanium_ore', count: 4 }] },
  { result: 'chlorophyte_bar', count: 1, station: TileId.ADAMANTITE_FORGE, ingredients: [{ id: 'chlorophyte_ore', count: 5 }] },

  { result: 'cobalt_pickaxe', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'cobalt_bar', count: 15 }] },
  { result: 'cobalt_helmet', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'cobalt_bar', count: 10 }] },
  { result: 'cobalt_breastplate', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'cobalt_bar', count: 20 }] },
  { result: 'cobalt_leggings', count: 1, station: TileId.ANVIL, ingredients: [{ id: 'cobalt_bar', count: 15 }] },

  { result: 'mythril_pickaxe', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'mythril_bar', count: 15 }] },
  { result: 'mythril_helmet', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'mythril_bar', count: 10 }] },
  { result: 'mythril_breastplate', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'mythril_bar', count: 20 }] },
  { result: 'mythril_leggings', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'mythril_bar', count: 15 }] },

  { result: 'titanium_pickaxe', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'titanium_bar', count: 18 }] },
  { result: 'titanium_helmet', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'titanium_bar', count: 12 }] },
  { result: 'titanium_breastplate', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'titanium_bar', count: 24 }] },
  { result: 'titanium_leggings', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'titanium_bar', count: 18 }] },

  // Mechanical Boss Summons
  { result: 'mechanical_eye', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'lens', count: 3 }, { id: 'iron_bar', count: 5 }, { id: 'soul_of_light', count: 6 }] },
  { result: 'mechanical_worm', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'rotten_chunk', count: 6 }, { id: 'iron_bar', count: 5 }, { id: 'soul_of_night', count: 6 }] },
  { result: 'mechanical_skull', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'bone', count: 20 }, { id: 'iron_bar', count: 5 }, { id: 'soul_of_light', count: 3 }, { id: 'soul_of_night', count: 3 }] },
  { result: 'plantera_seed', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'chlorophyte_bar', count: 3 }, { id: 'jungle_spores', count: 5 }] },
  { result: 'lihzahrd_power_cell', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'fallen_star', count: 5 }, { id: 'lihzahrd_brick', count: 10 }] },
  { result: 'truffle_worm', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'chlorophyte_bar', count: 3 }, { id: 'soul_of_night', count: 5 }] },
  { result: 'cultist_medallion', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'hallowed_bar', count: 5 }, { id: 'soul_of_fright', count: 3 }] },

  // Hallowed & Soul Gear
  { result: 'angel_wings', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'soul_of_flight', count: 20 }, { id: 'soul_of_light', count: 15 }] },
  { result: 'daedalus_stormbow', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'soul_of_light', count: 15 }, { id: 'pearlstone_block', count: 25 }] },
  { result: 'crystal_storm', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'soul_of_light', count: 15 }, { id: 'fallen_star', count: 10 }] },
  { result: 'golden_shower', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'soul_of_night', count: 15 }, { id: 'fallen_star', count: 10 }] },
  { result: 'holy_arrow', count: 100, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'wooden_arrow', count: 100 }, { id: 'fallen_star', count: 2 }, { id: 'pearlstone_block', count: 3 }] },
  { result: 'greater_healing_potion', count: 3, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'healing_potion', count: 3 }, { id: 'soul_of_light', count: 1 }] },

  { result: 'excalibur', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'hallowed_bar', count: 12 }] },
  { result: 'megashark', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'minishark', count: 1 }, { id: 'soul_of_might', count: 20 }] },
  {
    result: 'pickaxe_axe',
    count: 1,
    station: TileId.MYTHRIL_ANVIL,
    ingredients: [
      { id: 'hallowed_bar', count: 18 },
      { id: 'soul_of_might', count: 1 },
      { id: 'soul_of_sight', count: 1 },
      { id: 'soul_of_fright', count: 1 }
    ]
  },
  { result: 'hallowed_helmet', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'hallowed_bar', count: 12 }] },
  { result: 'hallowed_breastplate', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'hallowed_bar', count: 24 }] },
  { result: 'hallowed_leggings', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'hallowed_bar', count: 18 }] },

  { result: 'chlorophyte_shotbow', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'chlorophyte_bar', count: 12 }] },
  { result: 'chlorophyte_bullet', count: 70, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'musket_ball', count: 70 }, { id: 'chlorophyte_bar', count: 1 }] },
  { result: 'chlorophyte_helmet', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'chlorophyte_bar', count: 12 }] },
  { result: 'chlorophyte_breastplate', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'chlorophyte_bar', count: 24 }] },
  { result: 'chlorophyte_leggings', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'chlorophyte_bar', count: 18 }] },

  { result: 'terra_blade', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'nights_edge', count: 1 }, { id: 'excalibur', count: 1 }, { id: 'chlorophyte_bar', count: 12 }] },
  { result: 'ankh_shield', count: 1, station: TileId.MYTHRIL_ANVIL, ingredients: [{ id: 'cobalt_shield', count: 1 }, { id: 'obsidian_skull', count: 1 }, { id: 'soul_of_night', count: 10 }] },

  // =========================================================
  // ANCIENT MANIPULATOR (Endgame Lunar Tier)
  // =========================================================
  { result: 'luminite_bar', count: 1, station: TileId.ANCIENT_MANIPULATOR, ingredients: [{ id: 'luminite_ore', count: 4 }] },
  { result: 'solar_eruption', count: 1, station: TileId.ANCIENT_MANIPULATOR, ingredients: [{ id: 'solar_fragment', count: 18 }] },
  { result: 'nebula_blaze', count: 1, station: TileId.ANCIENT_MANIPULATOR, ingredients: [{ id: 'solar_fragment', count: 18 }] },
  { result: 'celestial_sigil', count: 1, station: TileId.ANCIENT_MANIPULATOR, ingredients: [{ id: 'solar_fragment', count: 20 }] },
  { result: 'super_healing_potion', count: 4, station: TileId.ANCIENT_MANIPULATOR, ingredients: [{ id: 'greater_healing_potion', count: 4 }, { id: 'solar_fragment', count: 1 }] },
  { result: 'solar_helmet', count: 1, station: TileId.ANCIENT_MANIPULATOR, ingredients: [{ id: 'luminite_bar', count: 8 }, { id: 'solar_fragment', count: 10 }] },
  { result: 'solar_breastplate', count: 1, station: TileId.ANCIENT_MANIPULATOR, ingredients: [{ id: 'luminite_bar', count: 16 }, { id: 'solar_fragment', count: 20 }] },
  { result: 'solar_leggings', count: 1, station: TileId.ANCIENT_MANIPULATOR, ingredients: [{ id: 'luminite_bar', count: 12 }, { id: 'solar_fragment', count: 15 }] },
  { result: 'solar_wings', count: 1, station: TileId.ANCIENT_MANIPULATOR, ingredients: [{ id: 'luminite_bar', count: 10 }, { id: 'solar_fragment', count: 14 }] }
];
