import { Noise2D, SeededRNG, TILE_SIZE, clamp } from '../core/math';
import { TileId, WallId, LiquidType } from './tiles';
import { World } from './world';
import { ItemStack } from '../items/items';

export function generateArenaWorld(seed: number = Date.now()): World {
  const world = new World(1400, 380);
  const rng = new SeededRNG(seed);
  const terrainNoise = new Noise2D(seed + 19);
  const w = world.width;
  const h = world.height;
  const centerX = Math.floor(w * 0.5);
  const floorY = 240;

  // Set surfaceY with randomized outer hills and open grand colosseum floor
  for (let x = 0; x < w; x++) {
    if (x < 120 || x > w - 120) {
      const n = terrainNoise.fbm(x * 0.02, 0, 3);
      world.surfaceY[x] = Math.floor(floorY - 18 + (n - 0.5) * 28);
    } else {
      world.surfaceY[x] = floorY;
    }
  }

  // 1. Solid Arena Floor & Grand Foundation
  for (let x = 0; x < w; x++) {
    const sy = world.surfaceY[x];
    for (let y = sy; y < h; y++) {
      if (y === sy) {
        world.setTile(x, y, x >= 120 && x <= w - 120 ? TileId.STONE_BRICK : TileId.GRASS);
      } else if (y < sy + 6) {
        world.setTile(x, y, x >= 120 && x <= w - 120 ? TileId.STONE_BRICK : TileId.DIRT);
      } else if (y === h - 1) {
        world.setTile(x, y, TileId.LIHZAHRD_BRICK);
      } else {
        world.setTile(x, y, TileId.STONE);
      }
    }
  }

  // 2. Grand Colosseum Boundary Towers on Left (x=120) and Right (x=w-120)
  for (const bx of [120, w - 120]) {
    for (let y = 50; y <= floorY; y++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (Math.abs(dx) === 3 || y === 50) {
          world.setTile(bx + dx, y, TileId.DUNGEON_BRICK);
        } else {
          world.setWall(bx + dx, y, WallId.DUNGEON);
          if (y % 12 === 0) {
            world.setTile(bx + dx, y, TileId.TORCH);
          }
        }
      }
    }
  }

  // 3. Multi-Tiered Wide-Open Boss Rush Sky Platforms (7 tiers across the giant 1400-wide arena, with randomized drop gaps)
  const platformYLevels = [72, 98, 124, 150, 176, 200, 220];
  for (const py of platformYLevels) {
    const gapOffset = rng.int(0, 75);
    const gapPeriod = rng.int(85, 115);
    for (let x = 135; x <= w - 135; x++) {
      if ((x + gapOffset) % gapPeriod >= gapPeriod - 10) continue;
      world.setTile(x, py, TileId.PLATFORM);

      // Arena buffs & lighting
      if (x % 38 === 0) {
        world.setTile(x, py - 1, TileId.CAMPFIRE);
      } else if (x % 19 === 0) {
        world.setTile(x, py - 1, TileId.TORCH);
      }
    }
  }

  // 4. Randomized Floating Sky Islands above the Arena
  const numSkyIslands = 6;
  for (let i = 0; i < numSkyIslands; i++) {
    const ix = Math.floor(200 + i * ((w - 400) / (numSkyIslands - 1)) + rng.int(-35, 35));
    const iy = rng.int(32, 48);
    const rad = rng.int(12, 18);
    for (let dx = -rad; dx <= rad; dx++) {
      const colH = Math.floor((1 - (dx * dx) / (rad * rad)) * 6);
      for (let dy = 0; dy <= colH; dy++) {
        world.setTile(ix + dx, iy + dy, dy === 0 ? TileId.GRASS : TileId.CLOUD);
      }
    }
    world.setTile(ix, iy - 1, TileId.CAMPFIRE);
  }

  // 5. Decorative Background Pillars in the Colosseum
  const pillarSpacing = rng.int(75, 95);
  for (let px = 180; px <= w - 180; px += pillarSpacing) {
    for (let y = 72; y < floorY; y++) {
      world.setWall(px, y, WallId.BRICK);
      world.setWall(px + 1, y, WallId.BRICK);
    }
  }

  // 6. Central Champion's Pavilion at Spawn (centerX, y = 176)
  const spawnYTile = 176;
  for (let dx = -16; dx <= 16; dx++) {
    world.setTile(centerX + dx, spawnYTile, TileId.STONE_BRICK);
    for (let dy = -6; dy <= -1; dy++) {
      world.setWall(centerX + dx, spawnYTile + dy, WallId.GLASS);
    }
  }
  world.setTile(centerX - 12, spawnYTile - 1, TileId.WORK_BENCH);
  world.setTile(centerX - 10, spawnYTile - 1, TileId.FURNACE);
  world.setTile(centerX - 8, spawnYTile - 1, TileId.MYTHRIL_ANVIL);
  world.setTile(centerX - 6, spawnYTile - 1, TileId.ADAMANTITE_FORGE);
  world.setTile(centerX - 4, spawnYTile - 1, TileId.ANCIENT_MANIPULATOR);
  world.setTile(centerX - 2, spawnYTile - 1, TileId.DEMON_ALTAR);
  world.setTile(centerX + 4, spawnYTile - 1, TileId.CAMPFIRE);
  world.setTile(centerX + 7, spawnYTile - 1, TileId.CHEST);
  world.setTile(centerX + 9, spawnYTile - 1, TileId.CHEST);
  world.setTile(centerX + 12, spawnYTile - 1, TileId.LIHZAHRD_ALTAR);

  // Stock Armory Chest 1 with Vanilla Endgame Weapons & Potions
  const armory = world.getOrCreateChest(centerX + 7, spawnYTile - 1);
  const armoryItems: [string, number][] = [
    ['zenith', 1],
    ['meowmere', 1],
    ['terra_blade', 1],
    ['solar_eruption', 1],
    ['sdmg', 1],
    ['tsunami', 1],
    ['last_prism', 1],
    ['razorblade_typhoon', 1],
    ['terrarian_yoyo', 1],
    ['nights_edge', 1],
    ['daedalus_stormbow', 1],
    ['megashark', 1],
    ['super_healing_potion', 50],
    ['mana_potion', 50],
    ['holy_arrow', 999],
    ['chlorophyte_bullet', 999],
    ['ironskin_potion', 20],
    ['swiftness_potion', 20],
    ['regeneration_potion', 20],
    ['cosmic_car_key', 1]
  ];
  armoryItems.forEach(([id, count], idx) => {
    armory[idx] = { id, count };
  });

  // Stock Armory Chest 2 with Calamity Mod Weapons, Yoyos & Tools
  const calamityArmory = world.getOrCreateChest(centerX + 9, spawnYTile - 1);
  const calamityItems: [string, number][] = [
    ['earth', 1],
    ['deaths_ascension', 1],
    ['galactus_blade', 1],
    ['holy_collider', 1],
    ['ark_of_the_cosmos', 1],
    ['dragon_rage', 1],
    ['excelsus', 1],
    ['biome_blade', 1],
    ['phoenix_flame_blaster', 1],
    ['soma_prime', 1],
    ['vehemence', 1],
    ['azathoth', 1],
    ['the_obliterator', 1],
    ['burning_revelation', 1],
    ['pandemic', 1],
    ['air_spinner', 1],
    ['crystyl_crusher', 1],
    ['genesis_pickaxe', 1],
    ['blossom_pickaxe', 1],
    ['reefshark_pickaxe', 1]
  ];
  calamityItems.forEach(([id, count], idx) => {
    calamityArmory[idx] = { id, count };
  });

  world.spawnX = centerX * TILE_SIZE;
  world.spawnY = (spawnYTile - 3) * TILE_SIZE;
  world.dungeonX = 132;
  world.dungeonY = floorY - 1;
  world.templeX = w - 132;
  world.templeY = floorY - 1;

  return world;
}

export function generateWorld(seed: number = Date.now()): World {
  const world = new World(1600, 480);
  const rng = new SeededRNG(seed);
  const terrainNoise = new Noise2D(seed + 11);
  const caveNoise = new Noise2D(seed + 23);
  const detailNoise = new Noise2D(seed + 37);

  const w = world.width;
  const h = world.height;
  const centerX = Math.floor(w * 0.5) + rng.int(-60, 60);

  // Randomly orient major world sides (Dungeon + Snow vs Jungle + Lihzahrd Temple)
  const dungeonOnLeft = rng.chance(0.5);

  const snowStart = dungeonOnLeft ? rng.int(220, 290) : rng.int(w - 520, w - 450);
  const snowEnd = snowStart + rng.int(190, 240);

  const jungleStart = dungeonOnLeft ? rng.int(w - 430, w - 360) : rng.int(85, 140);
  const jungleEnd = dungeonOnLeft ? w - 85 : jungleStart + rng.int(270, 330);

  const desertStart = dungeonOnLeft
    ? rng.int(centerX + 80, centerX + 160)
    : rng.int(centerX - 310, centerX - 220);
  const desertEnd = desertStart + rng.int(160, 210);

  // Two Corruption biomes (one on the West half, one on the East half)
  const corrupt1Start = dungeonOnLeft
    ? rng.int(snowEnd + 25, centerX - 95)
    : rng.int(jungleEnd + 25, centerX - 95);
  const corrupt1End = corrupt1Start + rng.int(120, 160);

  const corrupt2Start = dungeonOnLeft
    ? rng.int(desertEnd + 25, jungleStart - 25)
    : rng.int(centerX + 95, snowStart - 25);
  const corrupt2End = Math.max(corrupt2Start + 110, Math.min(w - 140, corrupt2Start + rng.int(120, 155)));

  const isSnowCol = (x: number) => x >= snowStart && x < snowEnd;
  const isJungleCol = (x: number) => x >= jungleStart && x <= jungleEnd;
  const isDesertCol = (x: number) => x >= desertStart && x < desertEnd;
  const isCorruptCol = (x: number) =>
    (x >= corrupt1Start && x < corrupt1End) || (x >= corrupt2Start && x < corrupt2End);

  // 1. Compute Randomized Surface Height Profile
  const baseSurface = rng.int(88, 104);
  for (let x = 0; x < w; x++) {
    const n = terrainNoise.fbm(x * 0.011, 0, 4);
    const hills = detailNoise.fbm(x * 0.032, 10, 2);
    let sy = Math.floor(baseSurface + (n - 0.5) * 42 + (hills - 0.5) * 14);

    // Flatten spawn zone slightly
    if (Math.abs(x - centerX) < 42) {
      sy = Math.floor(sy * 0.35 + baseSurface * 0.65);
    }

    // Ocean slopes on far edges
    if (x < 75) {
      sy = Math.floor(baseSurface + 4 + ((75 - x) / 75) * 28);
    } else if (x > w - 75) {
      sy = Math.floor(baseSurface + 4 + ((x - (w - 75)) / 75) * 28);
    }

    world.surfaceY[x] = sy;
  }

  const underworldTop = h - 76;

  // 2. Fill Base Terrain, Biome Blocks & Background Walls
  for (let x = 0; x < w; x++) {
    const sy = world.surfaceY[x];
    const isOcean = x < 75 || x > w - 75;
    const isSnow = isSnowCol(x);
    const isCorrupt = isCorruptCol(x);
    const isDesert = isDesertCol(x);
    const isJungle = isJungleCol(x);

    for (let y = 0; y < h; y++) {
      if (y < sy) {
        if (isOcean && y >= baseSurface + 8) {
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
        const uwNoise = caveNoise.fbm(x * 0.035, y * 0.055, 3);
        if (y < underworldTop + 9 || y > h - 16) {
          if (uwNoise > 0.34) {
            world.setTile(
              x,
              y,
              detailNoise.noise(x * 0.12, y * 0.12) > 0.75 ? TileId.HELLSTONE : TileId.ASH
            );
          }
        } else {
          // Open underworld gap with ash islands and lava sea at bottom
          if (uwNoise > 0.67) {
            world.setTile(x, y, TileId.ASH);
          } else if (y >= h - 22) {
            world.setLiquid(x, y, 255, LiquidType.LAVA);
          }
        }
        continue;
      }

      const depth = y - sy;
      const dirtDepth = Math.floor(16 + detailNoise.noise(x * 0.08, y * 0.08) * 12);

      if (isOcean) {
        world.setTile(x, y, depth < 15 ? TileId.SAND : TileId.SANDSTONE);
      } else if (isDesert && depth < 72) {
        world.setTile(x, y, depth < 18 ? TileId.SAND : TileId.SANDSTONE);
        if (depth > 2) world.setWall(x, y, WallId.DIRT);
      } else if (isSnow && depth < 150) {
        world.setTile(x, y, depth < dirtDepth ? TileId.SNOW : TileId.ICE);
        if (depth > 2) world.setWall(x, y, WallId.STONE);
      } else if (isCorrupt && depth < 165) {
        if (depth === 0) world.setTile(x, y, TileId.CORRUPT_GRASS);
        else if (depth < 9) world.setTile(x, y, TileId.DIRT);
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

        if (depth > 1 && depth < dirtDepth + 8) {
          world.setWall(x, y, WallId.DIRT);
        } else if (depth >= dirtDepth + 8 && depth < 75) {
          world.setWall(x, y, WallId.STONE);
        }
      }
    }
  }

  // 3. Carve Caves & Underground Caverns
  for (let x = 65; x < w - 65; x++) {
    const sy = world.surfaceY[x];
    const isJungle = isJungleCol(x);
    for (let y = sy + 6; y < underworldTop - 4; y++) {
      const n1 = caveNoise.fbm(x * 0.042, y * 0.042, 3);
      const n2 = detailNoise.fbm(x * 0.085, y * 0.085, 2);
      const threshold = isJungle ? 0.6 : 0.64;
      if (n1 * 0.75 + n2 * 0.25 > threshold) {
        world.setTile(x, y, TileId.AIR);
        if (isJungle && world.getTile(x, y + 1) === TileId.MUD) {
          world.setTile(x, y + 1, TileId.JUNGLE_GRASS);
        }
      }
    }
  }

  // 4. Corruption Chasms, Shadow Orbs / Demon Altars in both Corruption zones
  for (const [cStart, cEnd] of [
    [corrupt1Start, corrupt1End],
    [corrupt2Start, corrupt2End]
  ]) {
    if (cEnd - cStart < 60) continue;
    const tunnelY = world.surfaceY[Math.floor((cStart + cEnd) * 0.5)] + rng.int(44, 58);
    for (let cx = cStart + 18; cx <= cEnd - 18; cx += rng.int(20, 28)) {
      const sy = world.surfaceY[cx];
      const chasmDepth = sy + rng.int(48, 76);
      const phase = rng.next() * Math.PI * 2;
      for (let y = sy; y < chasmDepth; y++) {
        const wobble = Math.floor(Math.sin(y * 0.22 + phase) * 2.5);
        for (let dx = -3; dx <= 3; dx++) {
          world.setTile(cx + wobble + dx, y, TileId.AIR);
          world.setWall(cx + wobble + dx, y, WallId.CORRUPT);
        }
      }
    }
    // Horizontal corruption tunnel connecting chasms + Demon Altars
    for (let tx = cStart + 10; tx < cEnd - 10; tx++) {
      for (let dy = -3; dy <= 3; dy++) {
        world.setTile(tx, tunnelY + dy, TileId.AIR);
        world.setWall(tx, tunnelY + dy, WallId.CORRUPT);
      }
      if (tx % 15 === 0) {
        world.setTile(tx, tunnelY + 3, TileId.EBONSTONE);
        world.setTile(tx, tunnelY + 2, TileId.DEMON_ALTAR);
      }
    }
  }

  // 5. Generate Ores across the Underground (scaled for 1600x480 world)
  const totalOres = 1600;
  for (let i = 0; i < totalOres; i++) {
    const ox = rng.int(30, w - 30);
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
    world.spawnOreVein(ox, oy, ore, rng.int(2, 5));
  }

  // Extra Hellstone veins in the Underworld
  for (let i = 0; i < 220; i++) {
    const hx = rng.int(35, w - 35);
    const hy = rng.int(underworldTop + 2, h - 6);
    if (world.getTile(hx, hy) === TileId.ASH) {
      world.spawnOreVein(hx, hy, TileId.HELLSTONE, rng.int(3, 5));
    }
  }

  // 6. Build the Dungeon on the chosen Dungeon side
  const dX = dungeonOnLeft ? rng.int(125, 175) : rng.int(w - 175, w - 125);
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
    for (let y = dY - 4; y <= dY; y++) {
      world.setTile(dX + 12, y, TileId.AIR);
      world.setTile(dX - 10, y, TileId.AIR);
    }
  }
  world.setTile(dX - 4, dY, TileId.TORCH);
  world.setTile(dX + 4, dY, TileId.TORCH);

  // Underground Dungeon Chambers (9 deep chambers)
  let curX = dX;
  let curY = dY + 2;
  for (let room = 0; room < 9; room++) {
    const nextY = curY + rng.int(17, 23);
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
    const roomW = rng.int(22, 28);
    const roomH = rng.int(10, 12);
    const dir = room % 2 === 0 ? 1 : -1;
    const rxStart = clamp(dir > 0 ? curX - 4 : curX - roomW + 4, 55, w - roomW - 55);
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

  // 7. Build the Jungle Lihzahrd Temple in the Deep Jungle
  const tX = Math.floor((jungleStart + jungleEnd) * 0.5) + rng.int(-35, 35);
  const tY = rng.int(235, 290);
  world.templeX = tX;
  world.templeY = tY;
  const tw = 42;
  const th = 20;
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
  for (let dy = 2; dy <= 5; dy++) {
    world.setTile(tX - tw / 2, tY + th / 2 - dy, TileId.AIR);
    world.setTile(tX - tw / 2 + 1, tY + th / 2 - dy, TileId.DOOR_CLOSED);
  }
  const altarY = tY + th / 2 - 2;
  world.setTile(tX, altarY, TileId.LIHZAHRD_ALTAR);
  world.setTile(tX - 6, altarY, TileId.CHEST);
  populateChest(world.getOrCreateChest(tX - 6, altarY), 'temple', 0, rng);
  world.setTile(tX - 10, altarY - 4, TileId.TORCH);
  world.setTile(tX + 10, altarY - 4, TileId.TORCH);

  // 8. Build 8 Randomized Floating Sky Islands
  const numIslands = 8;
  for (let idx = 0; idx < numIslands; idx++) {
    const ix = Math.floor(140 + idx * ((w - 280) / (numIslands - 1)) + rng.int(-45, 45));
    const iy = rng.int(24, 42);
    const rad = rng.int(15, 21);
    for (let dx = -rad; dx <= rad; dx++) {
      const colH = Math.floor((1 - (dx * dx) / (rad * rad)) * 8);
      for (let dy = 0; dy <= colH; dy++) {
        world.setTile(
          ix + dx,
          iy + dy,
          dy === 0 ? TileId.GRASS : dy < 3 ? TileId.DIRT : TileId.CLOUD
        );
      }
    }
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
  }

  // 9. Underground Cabins, Chests & Heart Crystals (50 cabins across the larger world)
  for (let i = 0; i < 50; i++) {
    const cx = rng.int(80, w - 80);
    const cy = rng.int(world.surfaceY[cx] + 24, underworldTop - 18);
    if (
      world.getTile(cx, cy) === TileId.LIHZAHRD_BRICK ||
      world.getTile(cx, cy) === TileId.DUNGEON_BRICK
    ) {
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
    const isJungle = isJungleCol(cx);
    populateChest(world.getOrCreateChest(cx, cy + 1), isJungle ? 'jungle' : 'cavern', i, rng);
  }

  // Scatter additional Life Crystals & Clay Pots in caves
  for (let i = 0; i < 180; i++) {
    const hx = rng.int(50, w - 50);
    const hy = rng.int(world.surfaceY[hx] + 18, underworldTop - 8);
    if (world.getTile(hx, hy) === TileId.AIR && world.isSolid(hx, hy + 1)) {
      world.setTile(hx, hy, rng.chance(0.5) ? TileId.HEART_CRYSTAL : TileId.POT);
    }
  }

  // 10. Underworld Ruined Obsidian Houses & Hellforges
  for (let ux = 120; ux < w - 120; ux += rng.int(90, 125)) {
    const uy = underworldTop + rng.int(22, 30);
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
  for (let x = 75; x < w - 75; x++) {
    if (Math.abs(x - centerX) < 16 || Math.abs(x - dX) < 18) continue;
    const sy = world.surfaceY[x];
    const ground = world.getTile(x, sy);
    if (
      (ground === TileId.GRASS || ground === TileId.JUNGLE_GRASS || ground === TileId.SNOW) &&
      world.getTile(x, sy - 1) === TileId.AIR
    ) {
      if (rng.chance(0.18)) {
        const treeH = rng.int(5, 11);
        for (let ty = 1; ty <= treeH; ty++) {
          world.setTile(x, sy - ty, TileId.WOOD);
        }
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

  const hx0 = spawnTileX + 6;
  const hy0 = world.surfaceY[hx0];
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
    const loot = [
      'air_spinner',
      'hermes_boots',
      'cloud_in_a_bottle',
      'band_of_regeneration',
      'wand_of_sparking'
    ];
    add(0, loot[index % loot.length], 1);
    add(1, 'fallen_star', rng.int(5, 10));
    add(2, 'healing_potion', rng.int(3, 6));
    add(3, 'gold_bar', rng.int(5, 12));
  } else if (type === 'dungeon') {
    const loot = ['muramasa', 'cobalt_shield', 'water_bolt', 'minishark', 'old_mans_curse'];
    add(0, loot[index % loot.length], 1);
    add(1, 'healing_potion', rng.int(4, 8));
    add(2, 'bone', rng.int(15, 30));
    add(3, 'mana_potion', rng.int(5, 10));
  } else if (type === 'jungle') {
    const jLoot = ['blade_of_grass', 'bees_knees', 'biome_blade', 'pandemic'];
    add(0, jLoot[index % jLoot.length], 1);
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
    add(3, 'picksaw', 1);
  } else {
    const primaries = [
      'hermes_boots',
      'cloud_in_a_bottle',
      'band_of_regeneration',
      'wand_of_sparking',
      'reefshark_pickaxe',
      'grappling_hook'
    ];
    add(0, primaries[index % primaries.length], 1);
    add(1, 'lesser_healing_potion', rng.int(4, 9));
    add(2, 'torch', rng.int(15, 30));
    add(3, 'iron_bar', rng.int(6, 15));
    add(4, 'flaming_arrow', rng.int(25, 50));
    add(5, 'suspicious_looking_eye', 1);
  }
}
