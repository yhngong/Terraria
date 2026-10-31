import { TILE_SIZE, clamp, dist } from '../core/math';
import { TileId, TILE_DEFS, WallId, WALL_DEFS, LiquidType } from './tiles';
import { ITEMS, ItemStack } from '../items/items';
import { SpriteAtlas } from '../assets/sprites';

export type BiomeType =
  | 'forest'
  | 'desert'
  | 'snow'
  | 'corruption'
  | 'jungle'
  | 'dungeon'
  | 'underworld'
  | 'hallow'
  | 'sky'
  | 'underground';

export interface DroppedItem {
  x: number;
  y: number;
  vx: number;
  vy: number;
  id: string;
  count: number;
  pickupDelay: number;
  age: number;
}

export class World {
  readonly width: number;
  readonly height: number;

  tiles: Uint8Array;
  walls: Uint8Array;
  liquids: Uint8Array;
  liquidTypes: Uint8Array;
  light: Float32Array;
  explored: Uint8Array;

  surfaceY: Int16Array;

  chests: Map<string, (ItemStack | null)[]> = new Map();
  droppedItems: DroppedItem[] = [];

  spawnX = 0;
  spawnY = 0;
  dungeonX = 0;
  dungeonY = 0;
  templeX = 0;
  templeY = 0;

  // Time: 0..1440 minutes (4:30 AM = 270, 7:30 PM = 1170)
  timeOfDay = 480; // 8:00 AM
  dayCount = 1;
  hardmode = false;
  altarsSmashed = 0;
  defeatedBosses: Set<string> = new Set();

  // Mining state
  miningX = -1;
  miningY = -1;
  miningProgress = 0;

  private liquidTick = 0;

  constructor(width = 840, height = 320) {
    this.width = width;
    this.height = height;
    const size = width * height;
    this.tiles = new Uint8Array(size);
    this.walls = new Uint8Array(size);
    this.liquids = new Uint8Array(size);
    this.liquidTypes = new Uint8Array(size);
    this.light = new Float32Array(size);
    this.explored = new Uint8Array(size);
    this.surfaceY = new Int16Array(width);
    this.light.fill(1);
  }

  idx(x: number, y: number): number {
    return y * this.width + x;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getTile(x: number, y: number): TileId {
    if (!this.inBounds(x, y)) return TileId.STONE;
    return this.tiles[y * this.width + x] as TileId;
  }

  setTile(x: number, y: number, id: TileId): void {
    if (!this.inBounds(x, y)) return;
    this.tiles[y * this.width + x] = id;
  }

  getWall(x: number, y: number): WallId {
    if (!this.inBounds(x, y)) return WallId.NONE;
    return this.walls[y * this.width + x] as WallId;
  }

  setWall(x: number, y: number, id: WallId): void {
    if (!this.inBounds(x, y)) return;
    this.walls[y * this.width + x] = id;
  }

  getLiquid(x: number, y: number): number {
    if (!this.inBounds(x, y)) return 0;
    return this.liquids[y * this.width + x];
  }

  getLiquidType(x: number, y: number): LiquidType {
    if (!this.inBounds(x, y)) return LiquidType.NONE;
    return this.liquidTypes[y * this.width + x] as LiquidType;
  }

  setLiquid(x: number, y: number, amount: number, type: LiquidType): void {
    if (!this.inBounds(x, y)) return;
    const i = y * this.width + x;
    this.liquids[i] = clamp(Math.floor(amount), 0, 255);
    this.liquidTypes[i] = this.liquids[i] > 0 ? type : LiquidType.NONE;
  }

  isSolid(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y >= this.height) return true;
    if (y < 0) return false;
    const t = this.tiles[y * this.width + x] as TileId;
    return TILE_DEFS[t]?.solid ?? false;
  }

  isPlatform(x: number, y: number): boolean {
    if (!this.inBounds(x, y)) return false;
    const t = this.tiles[y * this.width + x] as TileId;
    return TILE_DEFS[t]?.platform ?? false;
  }

  isDaytime(): boolean {
    return this.timeOfDay >= 270 && this.timeOfDay < 1170;
  }

  getSunlightFactor(): number {
    // 270 = 4:30 AM, 720 = Noon, 1170 = 7:30 PM
    if (this.timeOfDay >= 330 && this.timeOfDay <= 1110) {
      return 1.0;
    }
    if (this.timeOfDay >= 240 && this.timeOfDay < 330) {
      return lerpValue(0.15, 1.0, (this.timeOfDay - 240) / 90);
    }
    if (this.timeOfDay > 1110 && this.timeOfDay <= 1200) {
      return lerpValue(1.0, 0.15, (this.timeOfDay - 1110) / 90);
    }
    return 0.15;
  }

  getTimeString(): string {
    const totalMinutes = Math.floor(this.timeOfDay) % 1440;
    const hours24 = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${hours12}:${mins.toString().padStart(2, '0')} ${ampm}`;
  }

  getBiomeAt(tx: number, ty: number): BiomeType {
    if (ty > this.height - 52) return 'underworld';
    if (ty < 42) return 'sky';

    // Sample nearby blocks for Corruption, Hallow, Jungle, Dungeon, Snow, Desert
    let corrupt = 0;
    let hallow = 0;
    let jungle = 0;
    let dungeon = 0;
    let snow = 0;
    let desert = 0;

    const r = 14;
    for (let dy = -r; dy <= r; dy += 2) {
      for (let dx = -r; dx <= r; dx += 2) {
        const t = this.getTile(tx + dx, ty + dy);
        if (t === TileId.EBONSTONE || t === TileId.CORRUPT_GRASS) corrupt++;
        else if (t === TileId.PEARLSTONE || t === TileId.HALLOWED_GRASS) hallow++;
        else if (t === TileId.MUD || t === TileId.JUNGLE_GRASS || t === TileId.LIHZAHRD_BRICK) jungle++;
        else if (t === TileId.DUNGEON_BRICK) dungeon++;
        else if (t === TileId.SNOW || t === TileId.ICE) snow++;
        else if (t === TileId.SAND || t === TileId.SANDSTONE) desert++;
      }
    }

    if (dungeon >= 8) return 'dungeon';
    if (corrupt >= 8) return 'corruption';
    if (hallow >= 8) return 'hallow';
    if (jungle >= 10) return 'jungle';
    if (snow >= 10) return 'snow';
    if (desert >= 12) return 'desert';

    const surf = this.surfaceY[clamp(tx, 0, this.width - 1)] || 95;
    if (ty > surf + 22) return 'underground';
    return 'forest';
  }

  getOrCreateChest(x: number, y: number): (ItemStack | null)[] {
    const key = `${x},${y}`;
    let slots = this.chests.get(key);
    if (!slots) {
      slots = new Array(20).fill(null);
      this.chests.set(key, slots);
    }
    return slots;
  }

  spawnDrop(x: number, y: number, id: string, count = 1, pickupDelay = 0.25): void {
    if (!ITEMS[id] || count <= 0) return;
    // Try merging with nearby identical drop
    for (const d of this.droppedItems) {
      if (d.id === id && dist(d.x, d.y, x, y) < 28 && d.count + count <= ITEMS[id].maxStack) {
        d.count += count;
        return;
      }
    }
    this.droppedItems.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 90,
      vy: -80 - Math.random() * 60,
      id,
      count,
      pickupDelay,
      age: 0
    });
  }

  updateDrops(dt: number): void {
    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const d = this.droppedItems[i];
      d.age += dt;
      if (d.pickupDelay > 0) d.pickupDelay -= dt;

      d.vy = Math.min(360, d.vy + 520 * dt);
      const nextX = d.x + d.vx * dt;
      const tx = Math.floor(nextX / TILE_SIZE);
      const ty = Math.floor(d.y / TILE_SIZE);
      if (!this.isSolid(tx, ty)) {
        d.x = nextX;
      } else {
        d.vx = 0;
      }

      const nextY = d.y + d.vy * dt;
      const by = Math.floor((nextY + 6) / TILE_SIZE);
      if (d.vy > 0 && (this.isSolid(tx, by) || this.isPlatform(tx, by))) {
        d.y = by * TILE_SIZE - 6;
        d.vy = 0;
        d.vx *= 0.8;
      } else {
        d.y = nextY;
      }

      if (d.age > 300) {
        this.droppedItems.splice(i, 1);
      }
    }
  }

  updateLiquids(camTileX: number, camTileY: number, viewW: number, viewH: number): void {
    this.liquidTick++;
    if (this.liquidTick % 2 !== 0) return;

    const minX = clamp(camTileX - 16, 1, this.width - 2);
    const maxX = clamp(camTileX + viewW + 16, 1, this.width - 2);
    const minY = clamp(camTileY - 16, 1, this.height - 2);
    const maxY = clamp(camTileY + viewH + 16, 1, this.height - 2);

    for (let y = maxY; y >= minY; y--) {
      for (let x = minX; x <= maxX; x++) {
        const i = y * this.width + x;
        const amt = this.liquids[i];
        if (amt <= 0) continue;
        const type = this.liquidTypes[i] as LiquidType;

        if (this.isSolid(x, y)) {
          this.liquids[i] = 0;
          this.liquidTypes[i] = LiquidType.NONE;
          continue;
        }

        // Flow down
        const downIdx = (y + 1) * this.width + x;
        if (!this.isSolid(x, y + 1)) {
          const downAmt = this.liquids[downIdx];
          const downType = this.liquidTypes[downIdx] as LiquidType;
          if (downAmt > 0 && downType !== type) {
            // Water + Lava = Obsidian!
            this.setTile(x, y + 1, TileId.OBSIDIAN);
            this.liquids[downIdx] = 0;
            this.liquidTypes[downIdx] = LiquidType.NONE;
            this.liquids[i] = 0;
            this.liquidTypes[i] = LiquidType.NONE;
            continue;
          }
          if (downAmt < 255) {
            const transfer = Math.min(amt, 255 - downAmt);
            this.liquids[downIdx] += transfer;
            this.liquidTypes[downIdx] = type;
            this.liquids[i] -= transfer;
            if (this.liquids[i] === 0) this.liquidTypes[i] = LiquidType.NONE;
            continue;
          }
        }

        // Flow sideways
        const dir = (x + y + this.liquidTick) & 1 ? 1 : -1;
        const nx = x + dir;
        if (!this.isSolid(nx, y)) {
          const sideIdx = y * this.width + nx;
          const sideAmt = this.liquids[sideIdx];
          const sideType = this.liquidTypes[sideIdx] as LiquidType;
          if (sideAmt > 0 && sideType !== type) {
            this.setTile(nx, y, TileId.OBSIDIAN);
            this.liquids[sideIdx] = 0;
            this.liquidTypes[sideIdx] = LiquidType.NONE;
            this.liquids[i] = 0;
            this.liquidTypes[i] = LiquidType.NONE;
            continue;
          }
          if (amt > sideAmt + 4) {
            const diff = Math.floor((amt - sideAmt) * 0.5);
            this.liquids[sideIdx] += diff;
            this.liquidTypes[sideIdx] = type;
            this.liquids[i] -= diff;
          }
        }
      }
    }
  }

  updateLighting(
    camTileX: number,
    camTileY: number,
    viewW: number,
    viewH: number,
    playerTileX: number,
    playerTileY: number,
    playerHoldingLight: boolean
  ): void {
    const pad = 12;
    const minX = clamp(camTileX - pad, 1, this.width - 2);
    const maxX = clamp(camTileX + viewW + pad, 1, this.width - 2);
    const minY = clamp(camTileY - pad, 1, this.height - 2);
    const maxY = clamp(camTileY + viewH + pad, 1, this.height - 2);

    const sun = this.getSunlightFactor();

    // 1. Seed light sources
    for (let y = minY; y <= maxY; y++) {
      const surf = this.surfaceY[clamp(Math.floor((minX + maxX) * 0.5), 0, this.width - 1)];
      void surf;
      for (let x = minX; x <= maxX; x++) {
        const i = y * this.width + x;
        const tile = this.tiles[i] as TileId;
        const wall = this.walls[i] as WallId;
        const def = TILE_DEFS[tile];

        let l = 0.04; // Minimum ambient visibility
        if (y > this.height - 52) {
          l = 0.38; // Underworld ambient glow
        }

        // Sky light if no solid block and no background wall above surface
        if ((!def || !def.solid || def.transparent) && wall === WallId.NONE && y <= this.surfaceY[x] + 4) {
          l = Math.max(l, sun);
        }

        if (def?.light) {
          const maxCh = Math.max(def.light[0], def.light[1], def.light[2]);
          l = Math.max(l, maxCh);
        }

        if (this.liquids[i] > 20 && this.liquidTypes[i] === LiquidType.LAVA) {
          l = Math.max(l, 0.85);
        }

        this.light[i] = l;
        if (l > 0.12) {
          this.explored[i] = 1;
        }
      }
    }

    // Player light
    if (this.inBounds(playerTileX, playerTileY)) {
      const pIdx = playerTileY * this.width + playerTileX;
      this.light[pIdx] = Math.max(this.light[pIdx], playerHoldingLight ? 1.0 : 0.68);
    }

    // 2. Forward & backward cellular relaxation passes
    for (let pass = 0; pass < 2; pass++) {
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const i = y * this.width + x;
          const solid = this.isSolid(x, y) && !TILE_DEFS[this.tiles[i] as TileId]?.transparent;
          const decay = solid ? 0.16 : 0.065;
          const nMax = Math.max(
            this.light[i - 1],
            this.light[i + 1],
            this.light[i - this.width],
            this.light[i + this.width]
          );
          if (nMax - decay > this.light[i]) {
            this.light[i] = nMax - decay;
            if (this.light[i] > 0.12) this.explored[i] = 1;
          }
        }
      }

      for (let y = maxY; y >= minY; y--) {
        for (let x = maxX; x >= minX; x--) {
          const i = y * this.width + x;
          const solid = this.isSolid(x, y) && !TILE_DEFS[this.tiles[i] as TileId]?.transparent;
          const decay = solid ? 0.16 : 0.065;
          const nMax = Math.max(
            this.light[i - 1],
            this.light[i + 1],
            this.light[i - this.width],
            this.light[i + this.width]
          );
          if (nMax - decay > this.light[i]) {
            this.light[i] = nMax - decay;
            if (this.light[i] > 0.12) this.explored[i] = 1;
          }
        }
      }
    }
  }

  triggerHardmode(): string[] {
    const messages: string[] = [];
    if (this.hardmode) return messages;
    this.hardmode = true;
    messages.push('The ancient spirits of light and dark have been released!');
    messages.push('Your world has been blessed with Cobalt, Mythril, and Titanium!');
    messages.push('Chlorophyte and Plantera Bulbs are sprouting in the Underground Jungle!');

    // 1. Convert a surface/underground band into The Hallow
    const hallowStart = Math.floor(this.width * 0.56);
    const hallowEnd = Math.floor(this.width * 0.68);
    for (let x = hallowStart; x < hallowEnd; x++) {
      for (let y = 30; y < this.height - 60; y++) {
        const t = this.getTile(x, y);
        if (t === TileId.GRASS) this.setTile(x, y, TileId.HALLOWED_GRASS);
        else if (t === TileId.STONE) this.setTile(x, y, TileId.PEARLSTONE);
      }
    }

    // 2. Spawn Hardmode Ores + Jungle Chlorophyte & Plantera Bulbs
    this.blessWithHardmodeOres();

    for (let k = 0; k < 140; k++) {
      const x = Math.floor(this.width * 0.68 + Math.random() * (this.width * 0.22));
      const y = Math.floor(110 + Math.random() * (this.height - 170));
      if (this.getTile(x, y) === TileId.MUD) {
        this.spawnOreVein(x, y, TileId.CHLOROPHYTE_ORE, 6);
      }
      if (this.getTile(x, y) === TileId.AIR && this.getTile(x, y + 1) === TileId.JUNGLE_GRASS) {
        if (Math.random() < 0.35) {
          this.setTile(x, y, TileId.PLANTERA_BULB);
        } else {
          this.setTile(x, y, TileId.LIFE_FRUIT);
        }
      }
    }

    return messages;
  }

  blessWithHardmodeOres(): string {
    this.altarsSmashed++;
    const tier = (this.altarsSmashed - 1) % 3;
    const ore =
      tier === 0 ? TileId.COBALT_ORE : tier === 1 ? TileId.MYTHRIL_ORE : TileId.TITANIUM_ORE;

    // Also seed all 3 on first trigger so player always has full progression access
    for (let i = 0; i < 90; i++) {
      const rx = Math.floor(20 + Math.random() * (this.width - 40));
      const ry = Math.floor(115 + Math.random() * (this.height - 175));
      if (this.getTile(rx, ry) === TileId.STONE) {
        const chosen =
          i < 35 ? TileId.COBALT_ORE : i < 65 ? TileId.MYTHRIL_ORE : TileId.TITANIUM_ORE;
        this.spawnOreVein(rx, ry, chosen, 5 + Math.floor(Math.random() * 4));
      }
    }

    return `Your world has been blessed with ${TILE_DEFS[ore].name}!`;
  }

  spawnOreVein(cx: number, cy: number, ore: TileId, radius: number): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius * (0.5 + Math.random() * 0.6)) {
          const t = this.getTile(cx + dx, cy + dy);
          if (
            t === TileId.STONE ||
            t === TileId.DIRT ||
            t === TileId.MUD ||
            t === TileId.ICE ||
            t === TileId.ASH
          ) {
            this.setTile(cx + dx, cy + dy, ore);
          }
        }
      }
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    screenW: number,
    screenH: number,
    zoom: number,
    atlas: SpriteAtlas,
    biome: BiomeType
  ): void {
    const viewW = screenW / zoom;
    const viewH = screenH / zoom;

    // 1. Sky & Biome Atmosphere
    this.renderBackground(ctx, camX, camY, viewW, viewH, biome);

    const startX = clamp(Math.floor(camX / TILE_SIZE) - 1, 0, this.width - 1);
    const endX = clamp(Math.ceil((camX + viewW) / TILE_SIZE) + 1, 0, this.width - 1);
    const startY = clamp(Math.floor(camY / TILE_SIZE) - 1, 0, this.height - 1);
    const endY = clamp(Math.ceil((camY + viewH) / TILE_SIZE) + 1, 0, this.height - 1);

    ctx.imageSmoothingEnabled = false;

    // 2. Background Walls, Liquids, and Foreground Tiles
    for (let y = startY; y <= endY; y++) {
      const rowOffset = y * this.width;
      const drawY = Math.floor(y * TILE_SIZE - camY);

      for (let x = startX; x <= endX; x++) {
        const i = rowOffset + x;
        const drawX = Math.floor(x * TILE_SIZE - camX);
        const lightVal = this.light[i];

        if (lightVal <= 0.02) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
          continue;
        }

        const wall = this.walls[i] as WallId;
        const tile = this.tiles[i] as TileId;
        const liq = this.liquids[i];

        // Draw Wall if tile isn't a full opaque block
        if (wall !== WallId.NONE && (tile === TileId.AIR || TILE_DEFS[tile]?.transparent)) {
          const wc = atlas.wallCanvases.get(wall);
          if (wc) {
            ctx.drawImage(wc, drawX, drawY);
          }
        }

        // Draw Liquid
        if (liq > 0) {
          const lType = this.liquidTypes[i] as LiquidType;
          const h = Math.max(2, Math.ceil((liq / 255) * TILE_SIZE));
          if (lType === LiquidType.WATER) {
            ctx.fillStyle = 'rgba(38, 128, 255, 0.62)';
          } else if (lType === LiquidType.LAVA) {
            ctx.fillStyle = 'rgba(255, 85, 18, 0.88)';
          } else {
            ctx.fillStyle = 'rgba(255, 196, 28, 0.78)';
          }
          ctx.fillRect(drawX, drawY + (TILE_SIZE - h), TILE_SIZE, h);
        }

        // Draw Foreground Tile
        if (tile !== TileId.AIR) {
          const tc = atlas.tileCanvases.get(tile);
          if (tc) {
            ctx.drawImage(tc, drawX, drawY);
          }
        }

        // Apply lighting shade
        if (lightVal < 0.98 && (wall !== WallId.NONE || tile !== TileId.AIR || y > this.surfaceY[x])) {
          ctx.fillStyle = `rgba(0, 0, 0, ${(1 - lightVal).toFixed(2)})`;
          ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // 3. Mining Crack Overlay
    if (this.miningX >= 0 && this.miningProgress > 0) {
      const tile = this.getTile(this.miningX, this.miningY);
      const def = TILE_DEFS[tile];
      if (def && def.hardness > 0) {
        const ratio = clamp(this.miningProgress / def.hardness, 0, 1);
        const mx = Math.floor(this.miningX * TILE_SIZE - camX);
        const my = Math.floor(this.miningY * TILE_SIZE - camY);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(mx + 8, my + 8);
        ctx.lineTo(mx + 8 - ratio * 6, my + 8 - ratio * 6);
        ctx.moveTo(mx + 8, my + 8);
        ctx.lineTo(mx + 8 + ratio * 6, my + 8 + ratio * 5);
        ctx.moveTo(mx + 8, my + 8);
        ctx.lineTo(mx + 8 - ratio * 5, my + 8 + ratio * 6);
        ctx.stroke();
      }
    }

    // 4. Dropped Items in World
    for (const d of this.droppedItems) {
      const def = ITEMS[d.id];
      if (!def) continue;
      const bob = Math.sin(d.age * 4) * 2;
      const sx = Math.floor(d.x - camX - 8);
      const sy = Math.floor(d.y - camY - 8 + bob);
      const icon = atlas.getItemIcon(def);
      ctx.drawImage(icon, sx, sy, 16, 16);
    }
  }

  private renderBackground(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
    biome: BiomeType
  ): void {
    const sun = this.getSunlightFactor();
    const grad = ctx.createLinearGradient(0, 0, 0, viewH);

    if (biome === 'underworld') {
      grad.addColorStop(0, '#1f0909');
      grad.addColorStop(0.6, '#47120c');
      grad.addColorStop(1, '#7a2210');
    } else if (biome === 'underground') {
      grad.addColorStop(0, '#141722');
      grad.addColorStop(1, '#232838');
    } else if (biome === 'corruption') {
      grad.addColorStop(0, '#1a112b');
      grad.addColorStop(1, '#342252');
    } else if (biome === 'hallow') {
      grad.addColorStop(0, lerpColor('#121a36', '#61c7ff', sun));
      grad.addColorStop(1, lerpColor('#261d42', '#ffd6f5', sun));
    } else if (biome === 'jungle') {
      grad.addColorStop(0, lerpColor('#0d1b14', '#3898ba', sun));
      grad.addColorStop(1, lerpColor('#173022', '#7ad98c', sun));
    } else {
      grad.addColorStop(0, lerpColor('#080b18', '#3a88e8', sun));
      grad.addColorStop(0.65, lerpColor('#121830', '#7ec4ff', sun));
      grad.addColorStop(1, lerpColor('#1b2442', '#bce4ff', sun));
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, viewW, viewH);

    // Sun / Moon & Stars when above underground
    if (biome !== 'underworld' && biome !== 'underground') {
      if (sun < 0.6) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(1 - sun) * 0.8})`;
        for (let i = 0; i < 45; i++) {
          const sx = ((i * 197 + Math.floor(camX * 0.05)) % Math.floor(viewW));
          const sy = ((i * 89) % Math.floor(viewH * 0.55));
          ctx.fillRect((sx + viewW) % viewW, sy, 2, 2);
        }
      }

      // Celestial body arc
      const isDay = this.isDaytime();
      const prog = isDay
        ? (this.timeOfDay - 270) / 900
        : ((this.timeOfDay + 270) % 1440) / 540;
      const cx = clamp(prog, 0.05, 0.95) * viewW;
      const cy = Math.sin(clamp(prog, 0, 1) * Math.PI) * -110 + 145;

      if (isDay) {
        ctx.fillStyle = '#fff380';
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#e2ebff';
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      // Parallax Distant Mountains / Trees
      ctx.fillStyle =
        biome === 'corruption'
          ? 'rgba(35, 22, 56, 0.55)'
          : biome === 'snow'
          ? 'rgba(165, 195, 225, 0.45)'
          : biome === 'desert'
          ? 'rgba(185, 145, 78, 0.45)'
          : 'rgba(28, 72, 54, 0.45)';
      const step = 32;
      for (let x = -step; x < viewW + step; x += step) {
        const wx = Math.floor((x + camX * 0.2) / step);
        const h = 45 + Math.abs(Math.sin(wx * 0.45) * 40 + Math.cos(wx * 0.2) * 25);
        ctx.fillRect(x - ((camX * 0.2) % step), viewH - h, step + 1, h);
      }
    }
  }
}

function lerpValue(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

function lerpColor(hexA: string, hexB: string, t: number): string {
  const c = clamp(t, 0, 1);
  const rA = parseInt(hexA.slice(1, 3), 16);
  const gA = parseInt(hexA.slice(3, 5), 16);
  const bA = parseInt(hexA.slice(5, 7), 16);
  const rB = parseInt(hexB.slice(1, 3), 16);
  const gB = parseInt(hexB.slice(3, 5), 16);
  const bB = parseInt(hexB.slice(5, 7), 16);
  const r = Math.round(rA + (rB - rA) * c);
  const g = Math.round(gA + (gB - gA) * c);
  const b = Math.round(bA + (bB - bA) * c);
  return `rgb(${r},${g},${b})`;
}
