import { TILE_SIZE, dist } from '../core/math';
import { World } from '../world/world';

export interface ShopEntry {
  itemId: string;
  price: number; // in copper coins
}

export interface TownNPC {
  id: string;
  name: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  color: string;
  hatColor?: string;
  aiTimer: number;
  dialogue: string[];
  shop: ShopEntry[];
}

export class NPCManager {
  npcs: TownNPC[] = [];

  initNPCs(world: World): void {
    this.npcs = [
      {
        id: 'guide',
        name: 'Andrew',
        title: ' the Guide',
        x: world.spawnX + 48,
        y: world.spawnY,
        vx: 0,
        vy: 0,
        facing: -1,
        color: '#8f6239',
        hatColor: '#694121',
        aiTimer: 0,
        dialogue: [
          'Greetings! Use your Pickaxe and Axe to gather Wood, Stone, and Ores, then craft at the Work Bench, Furnace, and Anvil inside our cabin.',
          'Press [K] at any time to open the Boss Encyclopedia & Progression Tracker, where you can check or summon all 14 Pre-Hardmode and Hardmode bosses!',
          'Explore Floating Sky Islands above for Wings/Boots, the Corruption for Demonite, the Jungle for Spores, the Dungeon on the West, and the Underworld below!'
        ],
        shop: [
          { itemId: 'torch', price: 10 },
          { itemId: 'wooden_arrow', price: 8 },
          { itemId: 'wood_platform', price: 5 },
          { itemId: 'lesser_healing_potion', price: 60 },
          { itemId: 'slime_crown', price: 500 },
          { itemId: 'suspicious_looking_eye', price: 600 }
        ]
      },
      {
        id: 'merchant',
        name: 'Gilbert',
        title: ' the Merchant',
        x: world.spawnX + 110,
        y: world.spawnY,
        vx: 0,
        vy: 0,
        facing: -1,
        color: '#2e59a8',
        hatColor: '#e6b82e',
        aiTimer: 1.1,
        dialogue: [
          'Sword beats paper! Get one today—or stock up on potions, arrows, and adventure gear!',
          'Need a Grappling Hook (press E) or Hermes Boots? I have them right here in stock.'
        ],
        shop: [
          { itemId: 'healing_potion', price: 150 },
          { itemId: 'mana_potion', price: 100 },
          { itemId: 'ironskin_potion', price: 180 },
          { itemId: 'swiftness_potion', price: 180 },
          { itemId: 'regeneration_potion', price: 180 },
          { itemId: 'grappling_hook', price: 1200 },
          { itemId: 'hermes_boots', price: 2500 },
          { itemId: 'cloud_in_a_bottle', price: 2500 },
          { itemId: 'iron_anvil', price: 500 },
          { itemId: 'furnace', price: 300 }
        ]
      },
      {
        id: 'nurse',
        name: 'Abigail',
        title: ' the Nurse',
        x: world.spawnX - 55,
        y: world.spawnY,
        vx: 0,
        vy: 0,
        facing: 1,
        color: '#f26b8a',
        hatColor: '#ffffff',
        aiTimer: 2.0,
        dialogue: [
          'Show me where it hurts! Click [Heal Full HP] below or buy Life Crystals & Potions for your next boss battle.'
        ],
        shop: [
          { itemId: 'lesser_healing_potion', price: 50 },
          { itemId: 'healing_potion', price: 140 },
          { itemId: 'greater_healing_potion', price: 400 },
          { itemId: 'super_healing_potion', price: 1000 },
          { itemId: 'life_crystal', price: 3000 },
          { itemId: 'mana_crystal', price: 1200 },
          { itemId: 'band_of_regeneration', price: 2500 }
        ]
      },
      {
        id: 'arms_dealer',
        name: 'Dante',
        title: ' the Arms Dealer',
        x: world.spawnX - 105,
        y: world.spawnY,
        vx: 0,
        vy: 0,
        facing: 1,
        color: '#474c59',
        hatColor: '#22252b',
        aiTimer: 0.5,
        dialogue: [
          'Keep your hands off my gun, buddy! ...Unless you have the coins for a Minishark and plenty of ammo!'
        ],
        shop: [
          { itemId: 'minishark', price: 7500 },
          { itemId: 'musket_ball', price: 7 },
          { itemId: 'flaming_arrow', price: 12 },
          { itemId: 'holy_arrow', price: 35 },
          { itemId: 'chlorophyte_bullet', price: 45 },
          { itemId: 'worm_food', price: 700 },
          { itemId: 'abeemination', price: 900 },
          { itemId: 'guide_voodoo_doll', price: 1500 }
        ]
      },
      {
        id: 'old_man',
        name: 'Old Man',
        title: ' of the Dungeon',
        x: world.dungeonX * TILE_SIZE,
        y: world.dungeonY * TILE_SIZE - 12,
        vx: 0,
        vy: 0,
        facing: 1,
        color: '#733446',
        hatColor: '#bfa888',
        aiTimer: 0,
        dialogue: [
          'You cannot enter the Dungeon until you defeat my master! Click [Curse — Summon Skeletron] below to free me from Skeletron!'
        ],
        shop: [
          { itemId: 'old_mans_curse', price: 500 },
          { itemId: 'healing_potion', price: 150 },
          { itemId: 'cobalt_shield', price: 3500 },
          { itemId: 'muramasa', price: 4000 },
          { itemId: 'water_bolt', price: 4000 }
        ]
      }
    ];
  }

  update(dt: number, world: World): void {
    for (const npc of this.npcs) {
      npc.aiTimer -= dt;
      if (npc.aiTimer <= 0) {
        npc.aiTimer = 1.5 + Math.random() * 2.5;
        const r = Math.random();
        if (r < 0.35) {
          npc.vx = -38;
          npc.facing = -1;
        } else if (r < 0.7) {
          npc.vx = 38;
          npc.facing = 1;
        } else {
          npc.vx = 0;
        }
      }

      npc.vy = Math.min(400, npc.vy + 700 * dt);
      const nextX = npc.x + npc.vx * dt;
      const tx = Math.floor((nextX + npc.facing * 8) / TILE_SIZE);
      const ty = Math.floor(npc.y / TILE_SIZE);
      if (!world.isSolid(tx, ty)) {
        npc.x = nextX;
      } else {
        npc.vx = -npc.vx;
        npc.facing = npc.facing === 1 ? -1 : 1;
      }

      const nextY = npc.y + npc.vy * dt;
      const footY = Math.floor((nextY + 13) / TILE_SIZE);
      const curTx = Math.floor(npc.x / TILE_SIZE);
      if (npc.vy >= 0 && (world.isSolid(curTx, footY) || world.isPlatform(curTx, footY))) {
        npc.y = footY * TILE_SIZE - 13.01;
        npc.vy = 0;
      } else {
        npc.y = nextY;
      }
    }
  }

  findClickedNPC(worldX: number, worldY: number, playerX: number, playerY: number): TownNPC | null {
    for (const npc of this.npcs) {
      if (
        dist(worldX, worldY, npc.x, npc.y) < 22 &&
        dist(playerX, playerY, npc.x, npc.y) < 180
      ) {
        return npc;
      }
    }
    return null;
  }

  render(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    for (const npc of this.npcs) {
      const sx = Math.floor(npc.x - camX);
      const sy = Math.floor(npc.y - camY);

      // Legs
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(sx - 4, sy + 5, 4, 8);
      ctx.fillRect(sx, sy + 5, 4, 8);

      // Tunic
      ctx.fillStyle = npc.color;
      ctx.fillRect(sx - 5, sy - 4, 10, 10);

      // Head
      ctx.fillStyle = '#f5c296';
      ctx.fillRect(sx - 5, sy - 13, 10, 9);
      ctx.fillStyle = '#1b1e26';
      ctx.fillRect(npc.facing > 0 ? sx + 2 : sx - 4, sy - 10, 2, 2);

      // Hat / Hair
      if (npc.hatColor) {
        ctx.fillStyle = npc.hatColor;
        ctx.fillRect(sx - 6, sy - 15, 12, 4);
      }

      // Nameplate on hover/nearby
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillText(npc.name, sx + 1, sy - 19);
      ctx.fillStyle = '#96ff96';
      ctx.fillText(npc.name, sx, sy - 20);
      ctx.textAlign = 'left';
    }
  }
}
