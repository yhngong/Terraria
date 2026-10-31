import { TILE_SIZE, SeededRNG } from '../core/math';
import { TileId, TILE_DEFS, WallId, WALL_DEFS } from '../world/tiles';
import type { ItemDef } from '../items/items';

export class SpriteAtlas {
  tileCanvases: Map<TileId, HTMLCanvasElement> = new Map();
  wallCanvases: Map<WallId, HTMLCanvasElement> = new Map();
  itemCanvases: Map<string, HTMLCanvasElement> = new Map();

  constructor() {
    this.buildTiles();
    this.buildWalls();
  }

  private buildTiles(): void {
    const rng = new SeededRNG(9001);
    for (const key of Object.keys(TILE_DEFS)) {
      const id = Number(key) as TileId;
      if (id === TileId.AIR) continue;
      const def = TILE_DEFS[id];
      const c = document.createElement('canvas');
      c.width = TILE_SIZE;
      c.height = TILE_SIZE;
      const ctx = c.getContext('2d')!;

      // Special non-full-block tiles
      if (id === TileId.TORCH) {
        ctx.fillStyle = '#7a4d24';
        ctx.fillRect(7, 7, 2, 8);
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(6, 3, 4, 5);
        ctx.fillStyle = '#ffee55';
        ctx.fillRect(7, 4, 2, 3);
      } else if (id === TileId.CAMPFIRE) {
        ctx.fillStyle = '#6b4222';
        ctx.fillRect(2, 11, 12, 4);
        ctx.fillStyle = '#ff5511';
        ctx.fillRect(4, 4, 8, 8);
        ctx.fillStyle = '#ffdd44';
        ctx.fillRect(6, 6, 4, 5);
      } else if (id === TileId.PLATFORM) {
        ctx.fillStyle = def.color;
        ctx.fillRect(0, 0, 16, 5);
        ctx.fillStyle = def.accentColor || '#5c3c1e';
        ctx.fillRect(0, 4, 16, 2);
        ctx.fillRect(2, 5, 2, 3);
        ctx.fillRect(12, 5, 2, 3);
      } else if (id === TileId.WORK_BENCH) {
        ctx.fillStyle = def.color;
        ctx.fillRect(1, 4, 14, 4);
        ctx.fillStyle = def.accentColor || '#5c3c1e';
        ctx.fillRect(3, 8, 3, 8);
        ctx.fillRect(10, 8, 3, 8);
      } else if (id === TileId.TABLE) {
        ctx.fillStyle = def.color;
        ctx.fillRect(0, 3, 16, 3);
        ctx.fillStyle = def.accentColor || '#5c3c1e';
        ctx.fillRect(2, 6, 2, 10);
        ctx.fillRect(12, 6, 2, 10);
      } else if (id === TileId.CHAIR) {
        ctx.fillStyle = def.color;
        ctx.fillRect(4, 2, 2, 14);
        ctx.fillRect(4, 9, 8, 2);
        ctx.fillRect(10, 11, 2, 5);
      } else if (id === TileId.FURNACE || id === TileId.HELLFORGE || id === TileId.ADAMANTITE_FORGE) {
        ctx.fillStyle = def.color;
        ctx.fillRect(1, 2, 14, 14);
        ctx.fillStyle = '#1f1a1c';
        ctx.fillRect(4, 7, 8, 7);
        ctx.fillStyle = def.accentColor || '#ff7722';
        ctx.fillRect(5, 9, 6, 5);
        ctx.fillStyle = '#fff066';
        ctx.fillRect(6, 11, 4, 3);
      } else if (id === TileId.ANVIL || id === TileId.MYTHRIL_ANVIL) {
        ctx.fillStyle = def.color;
        ctx.fillRect(2, 5, 12, 4);
        ctx.fillStyle = def.accentColor || '#555';
        ctx.fillRect(5, 9, 6, 4);
        ctx.fillRect(3, 13, 10, 3);
      } else if (id === TileId.ANCIENT_MANIPULATOR) {
        ctx.fillStyle = '#222836';
        ctx.fillRect(2, 3, 12, 13);
        ctx.fillStyle = def.color;
        ctx.fillRect(4, 5, 8, 8);
        ctx.fillStyle = def.accentColor || '#ff9933';
        ctx.fillRect(6, 7, 4, 4);
      } else if (id === TileId.CHEST) {
        ctx.fillStyle = def.color;
        ctx.fillRect(2, 4, 12, 12);
        ctx.fillStyle = '#5c3818';
        ctx.fillRect(2, 9, 12, 2);
        ctx.fillStyle = def.accentColor || '#ffd24c';
        ctx.fillRect(7, 8, 2, 4);
      } else if (id === TileId.DOOR_CLOSED) {
        ctx.fillStyle = def.color;
        ctx.fillRect(4, 0, 8, 16);
        ctx.fillStyle = def.accentColor || '#ffd24c';
        ctx.fillRect(9, 7, 2, 2);
      } else if (id === TileId.DOOR_OPEN) {
        ctx.fillStyle = def.color;
        ctx.fillRect(0, 0, 4, 16);
      } else if (id === TileId.HEART_CRYSTAL) {
        ctx.fillStyle = def.color;
        ctx.fillRect(3, 3, 4, 4);
        ctx.fillRect(9, 3, 4, 4);
        ctx.fillRect(2, 5, 12, 5);
        ctx.fillRect(4, 10, 8, 3);
        ctx.fillRect(6, 13, 4, 2);
        ctx.fillStyle = def.accentColor || '#ff99bb';
        ctx.fillRect(4, 4, 2, 2);
      } else if (id === TileId.LIFE_FRUIT) {
        ctx.fillStyle = def.accentColor || '#44cc33';
        ctx.fillRect(3, 2, 10, 12);
        ctx.fillStyle = def.color;
        ctx.fillRect(5, 4, 6, 8);
      } else if (id === TileId.DEMON_ALTAR) {
        ctx.fillStyle = def.color;
        ctx.fillRect(1, 5, 14, 11);
        ctx.fillStyle = def.accentColor || '#cc66ff';
        ctx.fillRect(3, 2, 2, 6);
        ctx.fillRect(7, 1, 2, 7);
        ctx.fillRect(11, 2, 2, 6);
      } else if (id === TileId.PLANTERA_BULB) {
        ctx.fillStyle = def.accentColor || '#55cc33';
        ctx.fillRect(4, 9, 8, 7);
        ctx.fillStyle = def.color;
        ctx.fillRect(3, 2, 10, 9);
        ctx.fillStyle = '#ffd1ec';
        ctx.fillRect(6, 4, 4, 4);
      } else if (id === TileId.LIHZAHRD_ALTAR) {
        ctx.fillStyle = def.color;
        ctx.fillRect(1, 6, 14, 10);
        ctx.fillStyle = def.accentColor || '#ffdd44';
        ctx.fillRect(5, 1, 6, 6);
      } else if (id === TileId.POT) {
        ctx.fillStyle = def.color;
        ctx.fillRect(4, 4, 8, 2);
        ctx.fillRect(3, 6, 10, 8);
        ctx.fillRect(5, 14, 6, 2);
      } else if (id === TileId.SUNFLOWER) {
        ctx.fillStyle = def.accentColor || '#3db846';
        ctx.fillRect(7, 7, 2, 9);
        ctx.fillStyle = def.color;
        ctx.fillRect(4, 1, 8, 7);
        ctx.fillStyle = '#5c3818';
        ctx.fillRect(6, 3, 4, 3);
      } else if (id === TileId.COBWEB) {
        ctx.fillStyle = 'rgba(235, 242, 250, 0.65)';
        for (let i = 0; i < 16; i += 2) {
          ctx.fillRect(i, i, 2, 2);
          ctx.fillRect(14 - i, i, 2, 2);
          ctx.fillRect(7, i, 2, 1);
          ctx.fillRect(i, 7, 1, 2);
        }
      } else {
        // Solid / natural block texture
        ctx.fillStyle = def.color;
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

        // Grass top cap
        if (
          id === TileId.GRASS ||
          id === TileId.JUNGLE_GRASS ||
          id === TileId.CORRUPT_GRASS ||
          id === TileId.HALLOWED_GRASS
        ) {
          ctx.fillStyle = def.accentColor!;
          ctx.fillRect(0, 0, TILE_SIZE, 4);
          for (let x = 0; x < TILE_SIZE; x += 2) {
            const drop = rng.int(3, 6);
            ctx.fillRect(x, 0, 2, drop);
          }
          ctx.fillStyle = def.speckleColor || def.accentColor!;
          for (let x = 0; x < TILE_SIZE; x += 4) {
            ctx.fillRect(x, 0, 2, 2);
          }
        } else if (def.isOre) {
          // Ore veins inside stone/base
          for (let y = 0; y < TILE_SIZE; y += 2) {
            for (let x = 0; x < TILE_SIZE; x += 2) {
              const r = rng.next();
              if (r < 0.25) {
                ctx.fillStyle = def.accentColor!;
                ctx.fillRect(x, y, 3, 3);
              } else if (r < 0.36 && def.speckleColor) {
                ctx.fillStyle = def.speckleColor;
                ctx.fillRect(x, y, 2, 2);
              } else if (r > 0.85) {
                ctx.fillStyle = 'rgba(0,0,0,0.18)';
                ctx.fillRect(x, y, 2, 2);
              }
            }
          }
        } else {
          // Standard pixel-art noise & brick/plank lines
          for (let y = 0; y < TILE_SIZE; y += 2) {
            for (let x = 0; x < TILE_SIZE; x += 2) {
              const r = rng.next();
              if (r < 0.22 && def.accentColor) {
                ctx.fillStyle = def.accentColor;
                ctx.fillRect(x, y, 2, 2);
              } else if (r < 0.32 && def.speckleColor) {
                ctx.fillStyle = def.speckleColor;
                ctx.fillRect(x, y, 2, 2);
              }
            }
          }

          if (
            id === TileId.STONE_BRICK ||
            id === TileId.DUNGEON_BRICK ||
            id === TileId.LIHZAHRD_BRICK ||
            id === TileId.WOOD_PLANK
          ) {
            ctx.fillStyle = 'rgba(0,0,0,0.28)';
            ctx.fillRect(0, 7, 16, 1);
            ctx.fillRect(0, 15, 16, 1);
            ctx.fillRect(7, 0, 1, 7);
            ctx.fillRect(15, 8, 1, 7);
          }
        }

        // Subtle border for crispness
        ctx.strokeStyle = 'rgba(0,0,0,0.16)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      }

      this.tileCanvases.set(id, c);
    }
  }

  private buildWalls(): void {
    const rng = new SeededRNG(4004);
    for (const key of Object.keys(WALL_DEFS)) {
      const id = Number(key) as WallId;
      if (id === WallId.NONE) continue;
      const def = WALL_DEFS[id];
      const c = document.createElement('canvas');
      c.width = TILE_SIZE;
      c.height = TILE_SIZE;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = def.color;
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = def.accentColor;
      for (let y = 0; y < TILE_SIZE; y += 2) {
        for (let x = 0; x < TILE_SIZE; x += 2) {
          if (rng.next() < 0.28) {
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, 7, 16, 1);
      ctx.fillRect(0, 15, 16, 1);
      this.wallCanvases.set(id, c);
    }
  }

  getItemIcon(item: ItemDef): HTMLCanvasElement {
    const existing = this.itemCanvases.get(item.id);
    if (existing) return existing;

    const c = document.createElement('canvas');
    c.width = 24;
    c.height = 24;
    const ctx = c.getContext('2d')!;
    const color = item.color || '#cccccc';
    const accent = item.accentColor || '#ffffff';

    if (item.placeTile !== undefined) {
      const tc = this.tileCanvases.get(item.placeTile);
      if (tc) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tc, 4, 4, 16, 16);
        this.itemCanvases.set(item.id, c);
        return c;
      }
    }

    ctx.save();
    switch (item.iconType) {
      case 'sword': {
        // Diagonal pixel sword
        ctx.fillStyle = '#6e4726';
        ctx.fillRect(4, 17, 4, 3);
        ctx.fillStyle = accent;
        ctx.fillRect(6, 13, 5, 5);
        ctx.fillStyle = color;
        for (let i = 0; i < 11; i++) {
          ctx.fillRect(8 + i, 13 - i, 4, 4);
        }
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 9; i++) {
          ctx.fillRect(9 + i, 12 - i, 1, 2);
        }
        break;
      }
      case 'scythe': {
        // Diagonal reaper handle + sweeping curved scythe blade
        ctx.fillStyle = '#5c3c6e';
        for (let i = 0; i < 14; i++) {
          ctx.fillRect(4 + i, 19 - i, 2, 2);
        }
        ctx.fillStyle = color;
        ctx.fillRect(10, 3, 10, 4);
        ctx.fillRect(6, 5, 6, 3);
        ctx.fillRect(4, 7, 4, 3);
        ctx.fillStyle = accent;
        ctx.fillRect(11, 4, 8, 2);
        ctx.fillRect(7, 6, 4, 1);
        break;
      }
      case 'yoyo': {
        // Coiled string + glowing dual-ring yoyo disc
        ctx.fillStyle = '#dce8ff';
        ctx.fillRect(4, 15, 5, 2);
        ctx.fillRect(7, 13, 3, 2);
        ctx.fillStyle = color;
        ctx.fillRect(9, 5, 11, 11);
        ctx.fillStyle = accent;
        ctx.fillRect(11, 7, 7, 7);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(13, 9, 3, 3);
        break;
      }
      case 'pickaxe': {
        ctx.fillStyle = '#825432';
        for (let i = 0; i < 12; i++) {
          ctx.fillRect(4 + i, 18 - i, 2, 2);
        }
        ctx.fillStyle = color;
        ctx.fillRect(10, 3, 9, 4);
        ctx.fillRect(16, 5, 4, 9);
        ctx.fillStyle = accent;
        ctx.fillRect(12, 4, 5, 2);
        break;
      }
      case 'axe': {
        ctx.fillStyle = '#825432';
        for (let i = 0; i < 12; i++) {
          ctx.fillRect(4 + i, 18 - i, 2, 2);
        }
        ctx.fillStyle = color;
        ctx.fillRect(12, 4, 7, 8);
        ctx.fillStyle = accent;
        ctx.fillRect(16, 5, 3, 6);
        break;
      }
      case 'hammer': {
        ctx.fillStyle = '#825432';
        for (let i = 0; i < 12; i++) {
          ctx.fillRect(4 + i, 18 - i, 2, 2);
        }
        ctx.fillStyle = color;
        ctx.fillRect(10, 3, 10, 8);
        ctx.fillStyle = accent;
        ctx.fillRect(12, 5, 6, 4);
        break;
      }
      case 'bow': {
        ctx.fillStyle = '#cfd8e3';
        ctx.fillRect(7, 4, 1, 16);
        ctx.fillStyle = color;
        ctx.fillRect(8, 3, 5, 3);
        ctx.fillRect(12, 5, 4, 5);
        ctx.fillRect(14, 9, 3, 6);
        ctx.fillRect(12, 14, 4, 5);
        ctx.fillRect(8, 18, 5, 3);
        break;
      }
      case 'gun': {
        ctx.fillStyle = color;
        ctx.fillRect(4, 8, 16, 6);
        ctx.fillRect(5, 13, 5, 6);
        ctx.fillStyle = accent;
        ctx.fillRect(8, 9, 10, 2);
        break;
      }
      case 'staff': {
        ctx.fillStyle = color;
        for (let i = 0; i < 12; i++) {
          ctx.fillRect(4 + i, 18 - i, 2, 2);
        }
        ctx.fillStyle = accent;
        ctx.fillRect(14, 3, 7, 7);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(16, 5, 3, 3);
        break;
      }
      case 'potion': {
        ctx.fillStyle = '#d8f0ff';
        ctx.fillRect(9, 4, 6, 4);
        ctx.fillRect(6, 8, 12, 12);
        ctx.fillStyle = color;
        ctx.fillRect(7, 10, 10, 9);
        ctx.fillStyle = accent;
        ctx.fillRect(8, 11, 3, 4);
        break;
      }
      case 'armor': {
        ctx.fillStyle = color;
        ctx.fillRect(5, 5, 14, 14);
        ctx.fillStyle = accent;
        ctx.fillRect(7, 7, 10, 6);
        ctx.fillStyle = '#1b1e26';
        ctx.fillRect(8, 10, 8, 2);
        break;
      }
      case 'accessory': {
        ctx.fillStyle = color;
        ctx.fillRect(5, 6, 14, 12);
        ctx.fillStyle = accent;
        ctx.fillRect(8, 8, 8, 8);
        break;
      }
      case 'bar': {
        ctx.fillStyle = color;
        ctx.fillRect(4, 8, 16, 9);
        ctx.fillStyle = accent;
        ctx.fillRect(6, 9, 12, 3);
        break;
      }
      case 'summon': {
        ctx.fillStyle = color;
        ctx.fillRect(5, 4, 14, 16);
        ctx.fillStyle = accent;
        ctx.fillRect(8, 7, 3, 4);
        ctx.fillRect(13, 7, 3, 4);
        ctx.fillRect(8, 14, 8, 3);
        break;
      }
      default: {
        ctx.fillStyle = color;
        ctx.fillRect(5, 5, 14, 14);
        ctx.fillStyle = accent;
        ctx.fillRect(8, 8, 8, 8);
        break;
      }
    }
    ctx.restore();

    this.itemCanvases.set(item.id, c);
    return c;
  }
}
