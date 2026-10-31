import { Noise2D, SeededRNG, TILE_SIZE, clamp } from '../core/math';
import { TileId, WallId, LiquidType } from './tiles';
import { World } from './world';
import { ItemStack } from '../items/items';

export function generateWorld(seed: number = Date.now()): World {
  const world = new World(840, 320);
  const rng = new SeededRNG(seed);
  const terrainNoise = new Noise2D(seed + 11);
  const caveNoise = new Noise2D(seed + 23);
  const detailNoise = new Noise2D(seed + 37);

  const w = world.width;
  const h = world.height;
  const centerX = Math.floor(w * 0.44);

  // 1. Compute Surface Height Profile & Biomes
  for (let x = 0; x < w; x++) {
    const n = terrainNoise.fbm(x * 0.014, 0, 4);
    let sy = Math.floor(72 + (n - 0.5) * 26);

    // Flatten spawn zone slightly
    if (Math.abs(x - centerX) < 35) {
      sy = Math.floor(sy * 0.4 + 74 * 0.6);
    }

    // Ocean slopes on far edges
    if (x < 48) {
      sy = Math.floor(74 + ((48 - x) / 48) * 22);
    } else if (x > w - 48) {
      sy = Math.floor(74 + ((x - (w - 48)) / 48) * 22);
    }

    world.surfaceY[x] = sy;
  }

  const underworldTop = h - 54;

  // 2. Fill Base Terrain, Biome Blocks & Background Walls
  for (let x = 0; x < w; x++) {
    const sy = world.surfaceY[x];
    const isOcean = x < 48 || x > w - 48;
    const isSnow = x >= 140 && x < 245;
    const isCorrupt = x >= 245 && x < 345;
    const isDesert = x >= 505 && x < 610;
    const isJungle = x >= 610 && x <= w - 48;

    for (let y = 0; y < h; y++) {
      if (y < sy) {
        if (isOcean && y >= 78) {
          world.setLiquid(x, y, 255, LiquidType.WATER);
        }
        continue;
      }

      if (y >= h - 4) {
        world.setTile(x, y, TileId.ASH);
        continue;
      }

      // Underworld Cavern Layer
      if (y >= underworldTop) {
        const uwNoise = caveNoise.fbm(x * 0.04, y * 0.06, 3);
        if (y < underworldTop + 7 || y > h - 14) {
          if (uwNoise > 0.34) {
            world.setTile(x, y, detailNoise.noise(x * 0.12, y * 0.12) > 0.76 ? TileId.HELLSTONE : TileId.ASH);
          }
        } else {
          // Open underworld gap with ash islands and lava sea at bottom
          if (uwNoise > 0.68) {
            world.setTile(x, y, TileId.ASH);
          } else if (y >= h - 18) {
            world.setLiquid(x, y, 255, LiquidType.LAVA);
          }
        }
        continue;
      }

      const depth = y - sy;
      const dirtDepth = Math.floor(14 + detailNoise.noise(x * 0.08, y * 0.08) * 10);

      if (isOcean) {
        world.setTile(x, y, depth < 12 ? TileId.SAND : TileId.SANDSTONE);
      } else if (isDesert && depth < 48) {
        world.setTile(x, y, depth < 14 ? TileId.SAND : TileId.SANDSTONE);
        if (depth > 2) world.setWall(x, y, WallId.DIRT);
      } else if (isSnow && depth < 90) {
        world.setTile(x, y, depth < dirtDepth ? TileId.SNOW : TileId.ICE);
        if (depth > 2) world.setWall(x, y, WallId.STONE);
      } else if (isCorrupt && depth < 110) {
        if (depth === 0) world.setTile(x, y, TileId.CORRUPT_GRASS);
        else if (depth < 8) world.setTile(x, y, TileId.DIRT);
        else world.setTile(x, y, TileId.EBONSTONE);
        if (depth > 1) world.setWall(x, y, WallId.CORRUPT);
      } else if (isJungle) {
        if (depth === 0) world.setTile(x, y, TileId.JUNGLE_GRASS);
        else world.setTile(x, y, TileId.MUD);
        if (depth > 1) world.setWall(x, y, WallId.JUNGLE);
      } else {
        if (depth === 0) world.setTile(x, y, TileId.GRASS);
        else if (depth < dirtDepth) world.setTile(x, y, TileId.DIRT);
        else world.setTile(x, y, TileId.STONE);

        if (depth > 1 && depth < dirtDepth + 6) {
          world.setWall(x, y, WallId.DIRT);
        } else if (depth >= dirtDepth + 6 && depth < 50) {
          world.setWall(x, y, WallId.STONE);
        }
      }
    }
  }

  // 3. Carve Caves & Underground Caverns
  for (let x = 45; x < w - 45; x++) {
    const sy = world.surfaceY[x];
    const isJungle = x >= 610 && x <= w - 48;
    for (let y = sy + 6; y < underworldTop - 4; y++) {
      const n1 = caveNoise.fbm(x * 0.045, y * 0.045, 3);
      const n2 = detailNoise.fbm(x * 0.09, y * 0.09, 2);
      const threshold = isJungle ? 0.61 : 0.65;
      if (n1 * 0.75 + n2 * 0.25 > threshold) {
        world.setTile(x, y, TileId.AIR);
        // Jungle underground grass on mud edges
        if (isJungle && world.getTile(x, y + 1) === TileId.MUD) {
          world.setTile(x, y + 1, TileId.JUNGLE_GRASS);
        }
      }
    }
  }

  // 4. Corruption Chasms, Shadow Orbs / Demon Altars
  for (let cx = 262; cx <= 330; cx += 22) {
    const sy = world.surfaceY[cx];
    const chasmDepth = sy + rng.int(42, 62);
    for (let y = sy; y < chasmDepth; y++) {
      const wobble = Math.floor(Math.sin(y * 0.25) * 2);
      for (let dx = -3; dx <= 3; dx++) {
        world.setTile(cx + wobble + dx, y, TileId.AIR);
        world.setWall(cx + wobble + dx, y, WallId.CORRUPT);
      }
    }
    // Horizontal corruption tunnel connecting chasms + Demon Altars
    for (let tx = 255; tx < 338; tx++) {
      for (let dy = -3; dy <= 3; dy++) {
        world.setTile(tx, sy + 44 + dy, TileId.AIR);
        world.setWall(tx, sy + 44 + dy, WallId.CORRUPT);
      }
      if (tx % 16 === 0) {
        world.setTile(tx, sy + 47, TileId.EBONSTONE);
        world.setTile(tx, sy + 46, TileId.DEMON_ALTAR);
      }
    }
  }

  // 5. Generate Ores across the Underground
  const totalOres = 520;
  for (let i = 0; i < totalOres; i++) {
    const ox = rng.int(25, w - 25);
    const sy = world.surfaceY[ox];
    const oy = rng.int(sy + 8, underworldTop - 6);
    const depthRatio = (oy - sy) / (underworldTop - sy);

    let ore = TileId.COPPER_ORE;
    if (depthRatio < 0.28) {
      ore = rng.chance(0.6) ? TileId.COPPER_ORE : TileId.IRON_ORE;
    } else if (depthRatio < 0.58) {
      ore = rng.chance(0.45) ? TileId.IRON_ORE : rng.chance(0.65) ? TileId.SILVER_ORE : TileId.GOLD_ORE;
    } else {
      ore = rng.chance(0.45) ? TileId.GOLD_ORE : rng.chance(0.75) ? TileId.SILVER_ORE : TileId.DEMONITE_ORE;
    }
    world.spawnOreVein(ox, oy, ore, rng.int(2, 4));
  }

  // Extra Hellstone veins in the Underworld
  for (let i = 0; i < 95; i++) {
    const hx = rng.int(30, w - 30);
    const hy = rng.int(underworldTop + 2, h - 6);
    if (world.getTile(hx, hy) === TileId.ASH) {
      world.spawnOreVein(hx, hy, TileId.HELLSTONE, rng.int(3, 5));
    }
  }

  // 6. Build the Dungeon on the West (x = 85..130)
  const dX = 95;
  const dY = world.surfaceY[dX];
  world.dungeonX = dX;
  world.dungeonY = dY - 1;

  // Entrance portico
  for (let x = dX - 10; x <= dX + 12; x++) {
    for (let y = dY - 9; y <= dY + 2; y++) {
      if (y === dY + 1 || y === dY + 2 || y === dY - 9 || x === dX - 10 || x === dX + 12) {
        world.setTile(x, y, TileId.DUNGEON_BRICK);
      } else {
        world.setTile(x, y, TileId.AIR);
        world.setWall(x, y, WallId.DUNGEON);
      }
    }
    // Open front entrance on the right side
    for (let y = dY - 4; y <= dY; y++) {
      world.setTile(dX + 12, y, TileId.AIR);
      world.setTile(dX - 10, y, TileId.AIR);
    }
  }
  world.setTile(dX - 4, dY, TileId.TORCH);
  world.setTile(dX + 4, dY, TileId.TORCH);

  // Underground Dungeon Chambers
  let curX = dX;
  let curY = dY + 2;
  for (let room = 0; room < 6; room++) {
    const nextY = curY + 18;
    // Shaft down
    for (let y = curY; y <= nextY; y++) {
      for (let dx = -4; dx <= 4; dx++) {
        if (Math.abs(dx) === 4) {
          world.setTile(curX + dx, y, TileId.DUNGEON_BRICK);
        } else {
          world.setTile(curX + dx, y, TileId.AIR);
          world.setWall(curX + dx, y, WallId.DUNGEON);
          if (y % 4 === 0 && Math.abs(dx) <= 2) {
            world.setTile(curX + dx, y, TileId.PLATFORM);
          }
        }
      }
    }
    // Horizontal chamber
    const roomW = 24;
    const roomH = 10;
    const dir = room % 2 === 0 ? 1 : -1;
    const rxStart = dir > 0 ? curX - 4 : curX - roomW + 4;
    for (let rx = rxStart; rx <= rxStart + roomW; rx++) {
      for (let ry = nextY - 2; ry <= nextY + roomH; ry++) {
        const border =
          rx === rxStart || rx === rxStart + roomW || ry === nextY - 2 || ry === nextY + roomH;
        if (border) {
          world.setTile(rx, ry, TileId.DUNGEON_BRICK);
        } else {
          world.setTile(rx, ry, TileId.AIR);
          world.setWall(rx, ry, WallId.DUNGEON);
        }
      }
    }
    // Dungeon Chest + Spikes + Torches
    const chestX = rxStart + Math.floor(roomW * 0.5);
    const chestY = nextY + roomH - 1;
    world.setTile(chestX, chestY, TileId.CHEST);
    world.setTile(chestX - 4, chestY - 3, TileId.TORCH);
    world.setTile(chestX + 4, chestY - 3, TileId.TORCH);
    if (room % 2 === 1) {
      world.setTile(chestX - 6, chestY, TileId.SPIKE);
      world.setTile(chestX + 6, chestY, TileId.SPIKE);
    }
    populateChest(world.getOrCreateChest(chestX, chestY), 'dungeon', room, rng);

    curX = rxStart + (dir > 0 ? roomW - 4 : 4);
    curY = nextY + roomH - 2;
  }

  // 7. Build the Jungle Lihzahrd Temple (for Golem!)
  const tX = 685;
  const tY = 175;
  world.templeX = tX;
  world.templeY = tY;
  const tw = 38;
  const th = 18;
  for (let x = tX - tw / 2; x <= tX + tw / 2; x++) {
    for (let y = tY - th / 2; y <= tY + th / 2; y++) {
      const isBorder =
        x <= tX - tw / 2 + 1 ||
        x >= tX + tw / 2 - 1 ||
        y <= tY - th / 2 + 1 ||
        y >= tY + th / 2 - 1;
      if (isBorder) {
        world.setTile(x, y, TileId.LIHZAHRD_BRICK);
      } else {
        world.setTile(x, y, TileId.AIR);
        world.setWall(x, y, WallId.LIHZAHRD);
      }
    }
  }
  // Temple entrance doors on left and right
  for (let dy = 2; dy <= 5; dy++) {
    world.setTile(tX - tw / 2, tY + th / 2 - dy, TileId.AIR);
    world.setTile(tX - tw / 2 + 1, tY + th / 2 - dy, TileId.DOOR_CLOSED);
  }
  const altarY = tY + th / 2 - 2;
  world.setTile(tX, altarY, TileId.LIHZAHRD_ALTAR);
  world.setTile(tX - 5, altarY, TileId.CHEST);
  populateChest(world.getOrCreateChest(tX - 5, altarY), 'temple', 0, rng);
  world.setTile(tX - 10, altarY - 4, TileId.TORCH);
  world.setTile(tX + 10, altarY - 4, TileId.TORCH);

  // 8. Build Floating Sky Islands
  const islandXs = [190, 390, 560, 710];
  islandXs.forEach((ix, idx) => {
    const iy = rng.int(22, 31);
    const rad = 16;
    for (let dx = -rad; dx <= rad; dx++) {
      const colH = Math.floor((1 - (dx * dx) / (rad * rad)) * 7);
      for (let dy = 0; dy <= colH; dy++) {
        world.setTile(ix + dx, iy + dy, dy === 0 ? TileId.GRASS : dy < 3 ? TileId.DIRT : TileId.CLOUD);
      }
    }
    // Small Skyware Cabin on the island
    for (let hx = ix - 4; hx <= ix + 4; hx++) {
      for (let hy = iy - 5; hy <= iy - 1; hy++) {
        const border = hx === ix - 4 || hx === ix + 4 || hy === iy - 5;
        if (border) {
          if (hy >= iy - 3 && (hx === ix - 4 || hx === ix + 4)) {
            world.setTile(hx, hy, TileId.DOOR_CLOSED);
          } else {
            world.setTile(hx, hy, TileId.STONE_BRICK);
          }
        } else {
          world.setTile(hx, hy, TileId.AIR);
          world.setWall(hx, hy, WallId.CLOUD);
        }
      }
    }
    world.setTile(ix, iy - 1, TileId.CHEST);
    world.setTile(ix - 2, iy - 3, TileId.TORCH);
    populateChest(world.getOrCreateChest(ix, iy - 1), 'sky', idx, rng);
  });

  // 9. Underground Cabins, Chests & Heart Crystals
  for (let i = 0; i < 24; i++) {
    const cx = rng.int(65, w - 65);
    const cy = rng.int(world.surfaceY[cx] + 22, underworldTop - 16);
    if (world.getTile(cx, cy) === TileId.LIHZAHRD_BRICK || world.getTile(cx, cy) === TileId.DUNGEON_BRICK) {
      continue;
    }
    for (let dx = -5; dx <= 5; dx++) {
      for (let dy = -3; dy <= 2; dy++) {
        const border = Math.abs(dx) === 5 || dy === -3 || dy === 2;
        if (border) {
          if (Math.abs(dx) === 5 && dy >= -1 && dy <= 1) {
            world.setTile(cx + dx, cy + dy, TileId.DOOR_CLOSED);
          } else {
            world.setTile(cx + dx, cy + dy, TileId.WOOD_PLANK);
          }
        } else {
          world.setTile(cx + dx, cy + dy, TileId.AIR);
          world.setWall(cx + dx, cy + dy, WallId.WOOD);
        }
      }
    }
    world.setTile(cx, cy + 1, TileId.CHEST);
    world.setTile(cx - 3, cy - 1, TileId.TORCH);
    world.setTile(cx + 2, cy + 1, TileId.HEART_CRYSTAL);
    const isJungle = cx >= 610;
    populateChest(world.getOrCreateChest(cx, cy + 1), isJungle ? 'jungle' : 'cavern', i, rng);
  }

  // Scatter additional Life Crystals & Clay Pots in caves
  for (let i = 0; i < 85; i++) {
    const hx = rng.int(40, w - 40);
    const hy = rng.int(world.surfaceY[hx] + 18, underworldTop - 8);
    if (world.getTile(hx, hy) === TileId.AIR && world.isSolid(hx, hy + 1)) {
      world.setTile(hx, hy, rng.chance(0.48) ? TileId.HEART_CRYSTAL : TileId.POT);
    }
  }

  // 10. Underworld Ruined Obsidian Houses & Hellforges
  for (let ux = 110; ux < w - 110; ux += 95) {
    const uy = underworldTop + 22;
    for (let dx = -6; dx <= 6; dx++) {
      for (let dy = -4; dy <= 3; dy++) {
        const border = Math.abs(dx) === 6 || dy === -4 || dy === 3;
        if (border) {
          if (Math.abs(dx) === 6 && dy >= 0 && dy <= 2) {
            world.setTile(ux + dx, uy + dy, TileId.AIR);
          } else {
            world.setTile(ux + dx, uy + dy, TileId.OBSIDIAN);
          }
        } else {
          world.setTile(ux + dx, uy + dy, TileId.AIR);
          world.setWall(ux + dx, uy + dy, WallId.BRICK);
          world.setLiquid(ux + dx, uy + dy, 0, LiquidType.NONE);
        }
      }
    }
    world.setTile(ux - 2, uy + 2, TileId.HELLFORGE);
    world.setTile(ux + 2, uy + 2, TileId.CHEST);
    world.setTile(ux, uy - 2, TileId.TORCH);
    populateChest(world.getOrCreateChest(ux + 2, uy + 2), 'underworld', ux, rng);
  }

  // 11. Plant Trees & Sunflowers on Surface
  for (let x = 55; x < w - 55; x++) {
    if (Math.abs(x - centerX) < 14 || Math.abs(x - dX) < 16) continue;
    const sy = world.surfaceY[x];
    const ground = world.getTile(x, sy);
    if (
      (ground === TileId.GRASS || ground === TileId.JUNGLE_GRASS || ground === TileId.SNOW) &&
      world.getTile(x, sy - 1) === TileId.AIR
    ) {
      if (rng.chance(0.18)) {
        const treeH = rng.int(5, 10);
        for (let ty = 1; ty <= treeH; ty++) {
          world.setTile(x, sy - ty, TileId.WOOD);
        }
        // Canopy
        for (let lx = -2; lx <= 2; lx++) {
          for (let ly = -treeH - 2; ly <= -treeH + 1; ly++) {
            if (Math.abs(lx) + Math.abs(ly + treeH) <= 3) {
              if (world.getTile(x + lx, sy + ly) === TileId.AIR) {
                world.setTile(x + lx, sy + ly, TileId.LEAVES);
              }
            }
          }
        }
        x += 3;
      } else if (ground === TileId.GRASS && rng.chance(0.08)) {
        world.setTile(x, sy - 1, TileId.SUNFLOWER);
      }
    }
  }

  // 12. Build Starter Base & Spawn Point at Center
  const spawnTileX = centerX;
  const spawnTileY = world.surfaceY[spawnTileX] - 1;
  world.spawnX = spawnTileX * TILE_SIZE + 8;
  world.spawnY = (spawnTileY - 2) * TILE_SIZE;

  // Cozy Wooden Guide House right next to spawn so NPCs have an initial home & crafting bench
  const hx0 = spawnTileX + 6;
  const hy0 = world.surfaceY[hx0];
  // Level foundation
  for (let hx = hx0; hx <= hx0 + 11; hx++) {
    for (let y = hy0; y <= hy0 + 4; y++) {
      world.setTile(hx, y, TileId.WOOD_PLANK);
    }
    for (let y = hy0 - 6; y <= hy0 - 1; y++) {
      const isWallEdge = hx === hx0 || hx === hx0 + 11 || y === hy0 - 6;
      if (isWallEdge) {
        if ((hx === hx0 || hx === hx0 + 11) && y >= hy0 - 3) {
          world.setTile(hx, y, TileId.DOOR_CLOSED);
        } else {
          world.setTile(hx, y, TileId.WOOD_PLANK);
        }
      } else {
        world.setTile(hx, y, TileId.AIR);
        world.setWall(hx, y, WallId.WOOD);
      }
    }
  }
  world.setTile(hx0 + 2, hy0 - 1, TileId.WORK_BENCH);
  world.setTile(hx0 + 4, hy0 - 1, TileId.CHAIR);
  world.setTile(hx0 + 6, hy0 - 1, TileId.FURNACE);
  world.setTile(hx0 + 8, hy0 - 1, TileId.ANVIL);
  world.setTile(hx0 + 9, hy0 - 1, TileId.CHEST);
  world.setTile(hx0 + 5, hy0 - 4, TileId.TORCH);
  world.setTile(spawnTileX - 2, spawnTileY, TileId.CAMPFIRE);

  populateChest(world.getOrCreateChest(hx0 + 9, hy0 - 1), 'starter', 0, rng);

  return world;
}

function populateChest(
  slots: (ItemStack | null)[],
  type: 'starter' | 'cavern' | 'jungle' | 'dungeon' | 'sky' | 'underworld' | 'temple',
  index: number,
  rng: SeededRNG
): void {
  const add = (slot: number, id: string, count: number) => {
    slots[clamp(slot, 0, slots.length - 1)] = { id, count };
  };

  if (type === 'starter') {
    add(0, 'lesser_healing_potion', 10);
    add(1, 'torch', 35);
    add(2, 'wooden_arrow', 100);
    add(3, 'wood', 60);
    add(4, 'grappling_hook', 1);
    add(5, 'slime_crown', 1);
    add(6, 'suspicious_looking_eye', 1);
    add(7, 'ironskin_potion', 3);
  } else if (type === 'sky') {
    const loot = ['hermes_boots', 'cloud_in_a_bottle', 'band_of_regeneration', 'wand_of_sparking'];
    add(0, loot[index % loot.length], 1);
    add(1, 'fallen_star', rng.int(5, 10));
    add(2, 'healing_potion', rng.int(3, 6));
    add(3, 'gold_bar', rng.int(5, 12));
  } else if (type === 'dungeon') {
    const loot = ['muramasa', 'cobalt_shield', 'water_bolt', 'old_mans_curse'];
    add(0, loot[index % loot.length], 1);
    add(1, 'healing_potion', rng.int(4, 8));
    add(2, 'bone', rng.int(15, 30));
    add(3, 'mana_potion', rng.int(5, 10));
  } else if (type === 'jungle') {
    add(0, rng.chance(0.5) ? 'blade_of_grass' : 'bees_knees', 1);
    add(1, 'abeemination', 1);
    add(2, 'jungle_spores', rng.int(8, 16));
    add(3, 'stinger', rng.int(8, 16));
    add(4, 'healing_potion', rng.int(4, 8));
  } else if (type === 'underworld') {
    add(0, rng.chance(0.5) ? 'demon_scythe' : 'fiery_greatsword', 1);
    add(1, 'guide_voodoo_doll', 1);
    add(2, 'hellstone_bar', rng.int(10, 20));
    add(3, 'obsidian_skull', 1);
    add(4, 'healing_potion', rng.int(6, 12));
  } else if (type === 'temple') {
    add(0, 'lihzahrd_power_cell', 3);
    add(1, 'super_healing_potion', 10);
    add(2, 'solar_fragment', 10);
  } else {
    const primaries = ['hermes_boots', 'cloud_in_a_bottle', 'band_of_regeneration', 'wand_of_sparking', 'grappling_hook'];
    add(0, primaries[index % primaries.length], 1);
    add(1, 'lesser_healing_potion', rng.int(4, 9));
    add(2, 'torch', rng.int(15, 30));
    add(3, 'iron_bar', rng.int(6, 15));
    add(4, 'flaming_arrow', rng.int(25, 50));
    add(5, 'suspicious_looking_eye', 1);
  }
}
