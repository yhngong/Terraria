import { pointInRect, clamp, TILE_SIZE } from '../core/math';
import { ITEMS, ItemStack, RARITY_COLORS } from '../items/items';
import { RECIPES, Recipe } from '../items/recipes';
import { TILE_DEFS } from '../world/tiles';
import { World, BiomeType } from '../world/world';
import { Player } from '../entities/player';
import { TownNPC } from '../entities/npcs';
import { BossManager, BOSS_CATALOG } from '../entities/bosses';
import { InputManager } from '../core/input';
import { AudioManager } from '../core/audio';
import { SpriteAtlas } from '../assets/sprites';

export interface ChatLine {
  text: string;
  color: string;
  age: number;
}

export class HUD {
  isArenaMode = true;
  inventoryOpen = false;
  bossMenuOpen = false;
  fullMapOpen = false;
  showAllRecipes = false;
  controlsHelpOpen = true;

  openChestCoords: { x: number; y: number } | null = null;
  activeNPC: TownNPC | null = null;
  dialogueIndex = 0;

  craftScroll = 0;
  bossScroll = 0;

  hoveredTooltip: { title: string; subtitle: string; color: string; x: number; y: number } | null =
    null;

  chatLog: ChatLine[] = [];

  private mapCanvas: HTMLCanvasElement;
  private mapCtx: CanvasRenderingContext2D;
  private mapRefreshTimer = 0;

  constructor() {
    this.mapCanvas = document.createElement('canvas');
    this.mapCanvas.width = 210;
    this.mapCanvas.height = 80;
    this.mapCtx = this.mapCanvas.getContext('2d')!;
  }

  addChat(text: string, color = '#ffffff'): void {
    this.chatLog.push({ text, color, age: 0 });
    if (this.chatLog.length > 8) {
      this.chatLog.shift();
    }
  }

  update(
    dt: number,
    input: InputManager,
    world: World,
    player: Player,
    bosses: BossManager,
    audio: AudioManager,
    onSummonBoss: (id: string) => void,
    onSaveGame: () => void
  ): boolean {
    this.hoveredTooltip = null;

    for (let i = this.chatLog.length - 1; i >= 0; i--) {
      this.chatLog[i].age += dt;
    }

    // Keyboard shortcuts
    for (let k = 0; k < 10; k++) {
      const code = k === 9 ? 'Digit0' : `Digit${k + 1}`;
      if (input.wasPressed(code)) {
        player.selectedSlot = k;
        audio.play('menu');
      }
    }

    if (input.wheelDelta !== 0) {
      if (this.inventoryOpen && input.mouseX < 360 && input.mouseY > 280) {
        this.craftScroll = Math.max(0, this.craftScroll + input.wheelDelta);
      } else if (this.bossMenuOpen) {
        this.bossScroll = clamp(this.bossScroll + input.wheelDelta, 0, Math.max(0, BOSS_CATALOG.length - 7));
      } else {
        player.selectedSlot = (player.selectedSlot + input.wheelDelta + 10) % 10;
      }
    }

    if (input.wasPressed('KeyI') || input.wasPressed('Tab') || input.wasPressed('Escape')) {
      this.inventoryOpen = !this.inventoryOpen;
      if (!this.inventoryOpen) {
        this.openChestCoords = null;
        this.activeNPC = null;
      }
      audio.play('menu');
    }

    if (input.wasPressed('KeyK')) {
      this.bossMenuOpen = !this.bossMenuOpen;
      audio.play('menu');
    }

    if (input.wasPressed('KeyM')) {
      this.fullMapOpen = !this.fullMapOpen;
      audio.play('menu');
    }

    if (input.wasPressed('F1')) {
      this.controlsHelpOpen = !this.controlsHelpOpen;
    }

    // Refresh minimap texture periodically
    this.mapRefreshTimer -= dt;
    if (this.mapRefreshTimer <= 0) {
      this.mapRefreshTimer = 0.5;
      this.rebuildMinimap(world, player, bosses);
    }

    // Check UI Clicks
    let uiConsumedMouse = false;
    const mx = input.mouseX;
    const my = input.mouseY;

    // Top-right quick buttons
    const btnBossRect = { x: window.innerWidth - 220, y: 158, w: 102, h: 24 };
    const btnSaveRect = { x: window.innerWidth - 112, y: 158, w: 96, h: 24 };
    // Top-center Boss Rush & Mount Bar buttons
    const cx = Math.floor(window.innerWidth / 2);
    const btnStartRush = { x: cx - 220, y: 42, w: 108, h: 24 };
    const btnNextWave = { x: cx - 106, y: 42, w: 96, h: 24 };
    const btnToggleMount = { x: cx - 4, y: 42, w: 112, h: 24 };
    const btnCycleMount = { x: cx + 114, y: 42, w: 106, h: 24 };

    if (input.mouseLeftJustPressed) {
      if (pointInRect(mx, my, btnBossRect)) {
        this.bossMenuOpen = !this.bossMenuOpen;
        audio.play('menu');
        return true;
      }
      if (pointInRect(mx, my, btnSaveRect)) {
        onSaveGame();
        audio.play('craft');
        return true;
      }
      if (this.isArenaMode) {
        if (pointInRect(mx, my, btnStartRush)) {
          bosses.startBossRush(player, audio, (m, c) => this.addChat(m, c));
          return true;
        }
        if (pointInRect(mx, my, btnNextWave)) {
          bosses.advanceBossRushNow(player, audio, (m, c) => this.addChat(m, c));
          return true;
        }
        if (pointInRect(mx, my, btnToggleMount)) {
          player.mounted = !player.mounted;
          audio.play('grapple');
          this.addChat(
            player.mounted ? `Mounted ${player.getMountName()}!` : 'Dismounted.',
            '#3be8d1'
          );
          return true;
        }
        if (pointInRect(mx, my, btnCycleMount)) {
          const order: ('ufo' | 'fishron' | 'dragon' | 'airship')[] = [
            'ufo',
            'fishron',
            'dragon',
            'airship'
          ];
          player.mountType = order[(order.indexOf(player.mountType) + 1) % order.length];
          player.mounted = true;
          audio.play('magic');
          this.addChat(`Switched Flying Mount to: ${player.getMountName()}!`, '#ffd747');
          return true;
        }
      }
    }

    // Hotbar click
    for (let i = 0; i < 10; i++) {
      const r = { x: 16 + i * 44, y: 16, w: 40, h: 40 };
      if (pointInRect(mx, my, r)) {
        uiConsumedMouse = true;
        if (input.mouseLeftJustPressed) {
          if (this.inventoryOpen) {
            this.handleSlotClick(player, player.inventory, i, audio);
          } else {
            player.selectedSlot = i;
            audio.play('menu');
          }
        }
      }
    }

    if (this.inventoryOpen) {
      if (mx < 540 && my < 540) uiConsumedMouse = true;

      // Inventory rows 1..3 (slots 10..39)
      for (let i = 10; i < 40; i++) {
        const col = i % 10;
        const row = Math.floor(i / 10);
        const r = { x: 16 + col * 44, y: 16 + row * 44, w: 40, h: 40 };
        if (pointInRect(mx, my, r) && input.mouseLeftJustPressed) {
          this.handleSlotClick(player, player.inventory, i, audio);
        }
      }

      // Armor Slots (Head, Chest, Legs)
      const armorKeys: ('head' | 'chest' | 'legs')[] = ['head', 'chest', 'legs'];
      armorKeys.forEach((key, idx) => {
        const r = { x: 472, y: 60 + idx * 44, w: 40, h: 40 };
        if (pointInRect(mx, my, r) && input.mouseLeftJustPressed) {
          const cur = player.cursorItem;
          if (!cur || (ITEMS[cur.id]?.armorSlot === key)) {
            const prev = player.armor[key];
            player.armor[key] = cur;
            player.cursorItem = prev;
            audio.play('menu');
          }
        }
      });

      // Accessory Slots (0..4)
      for (let idx = 0; idx < 5; idx++) {
        const r = { x: 522, y: 60 + idx * 44, w: 40, h: 40 };
        if (pointInRect(mx, my, r) && input.mouseLeftJustPressed) {
          const cur = player.cursorItem;
          if (!cur || ITEMS[cur.id]?.category === 'accessory') {
            const prev = player.accessories[idx];
            player.accessories[idx] = cur;
            player.cursorItem = prev;
            audio.play('menu');
          }
        }
      }

      // Trash Slot
      const trashRect = { x: 416, y: 196, w: 40, h: 40 };
      if (pointInRect(mx, my, trashRect) && input.mouseLeftJustPressed) {
        player.cursorItem = null;
        audio.play('dig');
      }

      // Toggle All Recipes vs Craftable Only
      const toggleRecipeBtn = { x: 110, y: 248, w: 150, h: 22 };
      if (pointInRect(mx, my, toggleRecipeBtn) && input.mouseLeftJustPressed) {
        this.showAllRecipes = !this.showAllRecipes;
        this.craftScroll = 0;
        audio.play('menu');
      }

      // Crafting Recipe Clicks
      const stations = player.getNearbyStations(world);
      const recipes = this.showAllRecipes
        ? RECIPES
        : RECIPES.filter((r) => player.canCraft(r, stations));
      const maxVisible = 6;
      for (let idx = 0; idx < maxVisible; idx++) {
        const recipe = recipes[this.craftScroll + idx];
        if (!recipe) break;
        const r = { x: 16, y: 276 + idx * 40, w: 280, h: 36 };
        if (pointInRect(mx, my, r) && input.mouseLeftJustPressed) {
          player.craft(recipe, stations, audio);
        }
      }

      // Open Chest UI
      if (this.openChestCoords) {
        const chestSlots = world.getOrCreateChest(this.openChestCoords.x, this.openChestCoords.y);
        for (let i = 0; i < 20; i++) {
          const col = i % 5;
          const row = Math.floor(i / 5);
          const r = { x: 316 + col * 44, y: 276 + row * 44, w: 40, h: 40 };
          if (pointInRect(mx, my, r)) {
            uiConsumedMouse = true;
            if (input.mouseLeftJustPressed) {
              this.handleSlotClick(player, chestSlots, i, audio);
            }
          }
        }
        // Loot All button
        const lootAllRect = { x: 316, y: 248, w: 95, h: 22 };
        if (pointInRect(mx, my, lootAllRect) && input.mouseLeftJustPressed) {
          for (let i = 0; i < chestSlots.length; i++) {
            const s = chestSlots[i];
            if (s) {
              const taken = player.addItem(s.id, s.count);
              s.count -= taken;
              if (s.count <= 0) chestSlots[i] = null;
            }
          }
          audio.play('pickup');
        }
      }
    }

    // Active Town NPC Dialogue & Shop Modal
    if (this.activeNPC) {
      const panel = { x: window.innerWidth / 2 - 220, y: 110, w: 440, h: 310 };
      if (pointInRect(mx, my, panel)) {
        uiConsumedMouse = true;
        if (input.mouseLeftJustPressed) {
          // Close button
          if (pointInRect(mx, my, { x: panel.x + panel.w - 32, y: panel.y + 8, w: 24, h: 24 })) {
            this.activeNPC = null;
            audio.play('menu');
            return true;
          }
          // Special Action Button (Nurse Heal / Old Man Curse / Guide Next Tip)
          const specialBtn = { x: panel.x + 16, y: panel.y + 92, w: 210, h: 26 };
          if (pointInRect(mx, my, specialBtn)) {
            if (this.activeNPC.id === 'nurse') {
              player.hp = player.maxHp;
              audio.play('potion');
              this.addChat('The Nurse restored you to full health!', '#38eb5c');
            } else if (this.activeNPC.id === 'old_man') {
              onSummonBoss('skeletron');
              this.activeNPC = null;
              return true;
            } else {
              this.dialogueIndex = (this.dialogueIndex + 1) % this.activeNPC.dialogue.length;
              audio.play('menu');
            }
          }

          // Shop items
          this.activeNPC.shop.forEach((entry, idx) => {
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            const sr = {
              x: panel.x + 16 + col * 204,
              y: panel.y + 130 + row * 34,
              w: 196,
              h: 30
            };
            if (pointInRect(mx, my, sr)) {
              if (player.coins >= entry.price) {
                if (player.addItem(entry.itemId, 1) > 0) {
                  player.coins -= entry.price;
                  audio.play('craft');
                }
              } else {
                this.addChat('Not enough coins!', '#ff6666');
              }
            }
          });
        }
      }
    }

    // Boss Encyclopedia & Sandbox Progression Menu (`K` key)
    if (this.bossMenuOpen) {
      const panel = {
        x: Math.floor(window.innerWidth / 2 - 330),
        y: 65,
        w: 660,
        h: 490
      };
      if (pointInRect(mx, my, panel)) {
        uiConsumedMouse = true;
        if (input.mouseLeftJustPressed) {
          // Close [X]
          if (pointInRect(mx, my, { x: panel.x + panel.w - 34, y: panel.y + 10, w: 24, h: 24 })) {
            this.bossMenuOpen = false;
            audio.play('menu');
            return true;
          }

          // Quick Loadouts & Teleport Buttons at top of Boss Menu
          const topBtns = [
            {
              label: 'Pre-HM Gear',
              action: () => {
                player.addItem('nights_edge', 1);
                player.addItem('molten_fury', 1);
                player.addItem('demon_scythe', 1);
                player.addItem('molten_pickaxe', 1);
                player.addItem('healing_potion', 30);
                player.addItem('flaming_arrow', 500);
                player.armor.head = { id: 'molten_helmet', count: 1 };
                player.armor.chest = { id: 'molten_breastplate', count: 1 };
                player.armor.legs = { id: 'molten_leggings', count: 1 };
                player.accessories[0] = { id: 'hermes_boots', count: 1 };
                player.accessories[1] = { id: 'cloud_in_a_bottle', count: 1 };
                player.accessories[2] = { id: 'cobalt_shield', count: 1 };
                player.accessories[3] = { id: 'obsidian_skull', count: 1 };
                player.accessories[4] = { id: 'grappling_hook', count: 1 };
                player.maxHp = Math.max(player.maxHp, 400);
                player.hp = player.maxHp;
                player.maxMana = 200;
                player.mana = 200;
                this.addChat('Equipped Molten & Night’s Edge Pre-Hardmode Loadout!', '#ffc896');
              }
            },
            {
              label: 'Hardmode Gear',
              action: () => {
                player.addItem('terra_blade', 1);
                player.addItem('tsunami', 1);
                player.addItem('razorblade_typhoon', 1);
                player.addItem('picksaw', 1);
                player.addItem('holy_arrow', 999);
                player.addItem('greater_healing_potion', 30);
                player.armor.head = { id: 'chlorophyte_helmet', count: 1 };
                player.armor.chest = { id: 'chlorophyte_breastplate', count: 1 };
                player.armor.legs = { id: 'chlorophyte_leggings', count: 1 };
                player.accessories[0] = { id: 'angel_wings', count: 1 };
                player.accessories[1] = { id: 'hermes_boots', count: 1 };
                player.accessories[2] = { id: 'ankh_shield', count: 1 };
                player.accessories[3] = { id: 'celestial_shell', count: 1 };
                player.accessories[4] = { id: 'grappling_hook', count: 1 };
                player.maxHp = 500;
                player.hp = 500;
                player.maxMana = 200;
                player.mana = 200;
                this.addChat('Equipped Terra Blade & Chlorophyte Hardmode Loadout!', '#96ff0a');
              }
            },
            {
              label: 'Endgame Gear',
              action: () => {
                player.addItem('zenith', 1);
                player.addItem('meowmere', 1);
                player.addItem('sdmg', 1);
                player.addItem('last_prism', 1);
                player.addItem('solar_eruption', 1);
                player.addItem('chlorophyte_bullet', 999);
                player.addItem('super_healing_potion', 30);
                player.armor.head = { id: 'solar_helmet', count: 1 };
                player.armor.chest = { id: 'solar_breastplate', count: 1 };
                player.armor.legs = { id: 'solar_leggings', count: 1 };
                player.accessories[0] = { id: 'solar_wings', count: 1 };
                player.accessories[1] = { id: 'hermes_boots', count: 1 };
                player.accessories[2] = { id: 'ankh_shield', count: 1 };
                player.accessories[3] = { id: 'celestial_shell', count: 1 };
                player.accessories[4] = { id: 'band_of_regeneration', count: 1 };
                player.maxHp = 500;
                player.hp = 500;
                player.maxMana = 200;
                player.mana = 200;
                this.addChat('Equipped Celestial Moon Lord & Zenith Loadout!', '#05c8ff');
              }
            },
            {
              label: `Godmode: ${player.godMode ? 'ON' : 'OFF'}`,
              action: () => {
                player.godMode = !player.godMode;
                this.addChat(`Godmode is now ${player.godMode ? 'ENABLED' : 'DISABLED'}.`, '#ffeb57');
              }
            },
            {
              label: 'Calamity Gear',
              action: () => {
                player.addItem('earth', 1);
                player.addItem('deaths_ascension', 1);
                player.addItem('galactus_blade', 1);
                player.addItem('holy_collider', 1);
                player.addItem('azathoth', 1);
                player.addItem('the_obliterator', 1);
                player.addItem('burning_revelation', 1);
                player.addItem('ark_of_the_cosmos', 1);
                player.addItem('dragon_rage', 1);
                player.addItem('crystyl_crusher', 1);
                player.addItem('omega_healing_potion', 30);
                player.armor.head = { id: 'demonshade_helmet', count: 1 };
                player.armor.chest = { id: 'demonshade_breastplate', count: 1 };
                player.armor.legs = { id: 'demonshade_leggings', count: 1 };
                player.accessories[0] = { id: 'celestial_tracers', count: 1 };
                player.accessories[1] = { id: 'ankh_shield', count: 1 };
                player.accessories[2] = { id: 'celestial_shell', count: 1 };
                player.maxHp = 700;
                player.hp = 700;
                player.maxMana = 200;
                player.mana = 200;
                this.addChat("Equipped Calamity Arsenal (Earth, Death's Ascension, Galactus Blade, Holy Collider, Azathoth Yoyo & Demonshade Armor)!", '#ff1938');
              }
            },
            {
              label: 'TP: Spawn',
              action: () => {
                player.x = world.spawnX;
                player.y = world.spawnY;
                player.vx = 0;
                player.vy = 0;
              }
            },
            {
              label: 'TP: Dungeon',
              action: () => {
                player.x = world.dungeonX * TILE_SIZE;
                player.y = (world.dungeonY - 2) * TILE_SIZE;
                player.vx = 0;
                player.vy = 0;
              }
            },
            {
              label: 'TP: Temple',
              action: () => {
                player.x = world.templeX * TILE_SIZE;
                player.y = world.templeY * TILE_SIZE;
                player.vx = 0;
                player.vy = 0;
              }
            },
            {
              label: 'TP: Hell',
              action: () => {
                player.x = world.spawnX;
                player.y = (world.height - 32) * TILE_SIZE;
                player.vx = 0;
                player.vy = 0;
              }
            }
          ];

          topBtns.forEach((b, idx) => {
            const br = { x: panel.x + 12 + idx * 71, y: panel.y + 44, w: 68, h: 24 };
            if (pointInRect(mx, my, br)) {
              b.action();
              audio.play('craft');
            }
          });

          // Boss list rows
          const maxRows = 7;
          for (let i = 0; i < maxRows; i++) {
            const entry = BOSS_CATALOG[this.bossScroll + i];
            if (!entry) break;
            const rowY = panel.y + 82 + i * 54;
            const summonBtn = { x: panel.x + panel.w - 122, y: rowY + 12, w: 106, h: 28 };
            const itemBtn = { x: panel.x + panel.w - 236, y: rowY + 12, w: 106, h: 28 };

            if (pointInRect(mx, my, summonBtn)) {
              onSummonBoss(entry.id);
              this.bossMenuOpen = false;
              return true;
            }
            if (pointInRect(mx, my, itemBtn)) {
              player.addItem(entry.summonItem, 1);
              audio.play('pickup');
              this.addChat(`Added ${ITEMS[entry.summonItem]?.name} to inventory!`, '#96ff96');
            }
          }
        }
      }
    }

    return uiConsumedMouse;
  }

  private handleSlotClick(
    player: Player,
    slots: (ItemStack | null)[],
    index: number,
    audio: AudioManager
  ): void {
    const slot = slots[index];
    const cur = player.cursorItem;

    // Quick equip if shift-clicked or armor/accessory
    if (!cur && slot) {
      const def = ITEMS[slot.id];
      if (def?.armorSlot && !player.armor[def.armorSlot]) {
        player.armor[def.armorSlot] = slot;
        slots[index] = null;
        audio.play('menu');
        return;
      }
    }

    if (cur && slot && cur.id === slot.id) {
      const max = ITEMS[slot.id]?.maxStack || 999;
      const space = max - slot.count;
      const move = Math.min(space, cur.count);
      slot.count += move;
      cur.count -= move;
      if (cur.count <= 0) player.cursorItem = null;
    } else {
      slots[index] = cur;
      player.cursorItem = slot;
    }
    audio.play('menu');
  }

  private rebuildMinimap(world: World, player: Player, bosses: BossManager): void {
    const mw = this.mapCanvas.width;
    const mh = this.mapCanvas.height;
    const img = this.mapCtx.createImageData(mw, mh);
    const data = img.data;

    for (let my = 0; my < mh; my++) {
      const wy = Math.floor((my / mh) * world.height);
      for (let mx = 0; mx < mw; mx++) {
        const wx = Math.floor((mx / mw) * world.width);
        const idx = wy * world.width + wx;
        const pIdx = (my * mw + mx) * 4;

        const t = world.tiles[idx];
        const liq = world.liquids[idx];
        let hex = '#121829';

        if (t !== 0 && TILE_DEFS[t as keyof typeof TILE_DEFS]) {
          hex = TILE_DEFS[t as keyof typeof TILE_DEFS].color;
        } else if (liq > 0) {
          hex = world.liquidTypes[idx] === 2 ? '#ff5512' : '#2680ff';
        } else if (wy < world.surfaceY[wx]) {
          hex = '#3a7bd5';
        }

        const r = parseInt(hex.slice(1, 3), 16) || 20;
        const g = parseInt(hex.slice(3, 5), 16) || 28;
        const b = parseInt(hex.slice(5, 7), 16) || 45;
        data[pIdx] = r;
        data[pIdx + 1] = g;
        data[pIdx + 2] = b;
        data[pIdx + 3] = 255;
      }
    }
    this.mapCtx.putImageData(img, 0, 0);

    // Player dot
    const px = Math.floor((player.x / (world.width * TILE_SIZE)) * mw);
    const py = Math.floor((player.y / (world.height * TILE_SIZE)) * mh);
    this.mapCtx.fillStyle = '#ffffff';
    this.mapCtx.fillRect(px - 2, py - 2, 4, 4);

    // Boss dot
    if (bosses.activeBoss && bosses.activeBoss.parts[0]) {
      const bp = bosses.activeBoss.parts[0];
      const bx = Math.floor((bp.x / (world.width * TILE_SIZE)) * mw);
      const by = Math.floor((bp.y / (world.height * TILE_SIZE)) * mh);
      this.mapCtx.fillStyle = '#ff2942';
      this.mapCtx.fillRect(bx - 3, by - 3, 6, 6);
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    world: World,
    player: Player,
    bosses: BossManager,
    input: InputManager,
    atlas: SpriteAtlas,
    biome: BiomeType
  ): void {
    const sw = ctx.canvas.width;
    const sh = ctx.canvas.height;

    // 1. Hotbar (Slots 0..9)
    for (let i = 0; i < 10; i++) {
      const x = 16 + i * 44;
      const y = 16;
      const selected = player.selectedSlot === i;
      this.drawSlot(ctx, x, y, player.inventory[i], selected ? '#ffd747' : '#3a4a6b', atlas, `${(i + 1) % 10}`);
      if (pointInRect(input.mouseX, input.mouseY, { x, y, w: 40, h: 40 }) && player.inventory[i]) {
        this.setTooltipFromItem(player.inventory[i]!, input.mouseX, input.mouseY);
      }
    }

    const held = player.getHeldItem();
    if (held) {
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = RARITY_COLORS[held.rarity] || '#fff';
      ctx.fillText(held.name, 16, 72);
    }

    // 2. Expanded Inventory, Equipment, Crafting & Chests
    if (this.inventoryOpen) {
      for (let i = 10; i < 40; i++) {
        const col = i % 10;
        const row = Math.floor(i / 10);
        const x = 16 + col * 44;
        const y = 16 + row * 44;
        this.drawSlot(ctx, x, y, player.inventory[i], '#2b3854', atlas);
        if (pointInRect(input.mouseX, input.mouseY, { x, y, w: 40, h: 40 }) && player.inventory[i]) {
          this.setTooltipFromItem(player.inventory[i]!, input.mouseX, input.mouseY);
        }
      }

      // Coins & Defense Summary
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#ffd747';
      const gold = Math.floor(player.coins / 100);
      const copper = player.coins % 100;
      ctx.fillText(`Coins: ${gold}g ${copper}c   Defense: ${player.getDefense()}`, 16, 206);

      // Trash Slot
      this.drawSlot(ctx, 416, 196, null, '#6b2d38', atlas, 'DEL');

      // Armor Slots
      ctx.fillStyle = '#b0c4de';
      ctx.fillText('Armor', 472, 52);
      const armorSlots: { key: 'head' | 'chest' | 'legs'; label: string }[] = [
        { key: 'head', label: 'H' },
        { key: 'chest', label: 'C' },
        { key: 'legs', label: 'L' }
      ];
      armorSlots.forEach((a, idx) => {
        const x = 472;
        const y = 60 + idx * 44;
        this.drawSlot(ctx, x, y, player.armor[a.key], '#3c526b', atlas, a.label);
        if (pointInRect(input.mouseX, input.mouseY, { x, y, w: 40, h: 40 }) && player.armor[a.key]) {
          this.setTooltipFromItem(player.armor[a.key]!, input.mouseX, input.mouseY);
        }
      });

      // Accessory Slots
      ctx.fillStyle = '#b0c4de';
      ctx.fillText('Acc.', 522, 52);
      for (let idx = 0; idx < 5; idx++) {
        const x = 522;
        const y = 60 + idx * 44;
        this.drawSlot(ctx, x, y, player.accessories[idx], '#32594a', atlas, `A${idx + 1}`);
        if (
          pointInRect(input.mouseX, input.mouseY, { x, y, w: 40, h: 40 }) &&
          player.accessories[idx]
        ) {
          this.setTooltipFromItem(player.accessories[idx]!, input.mouseX, input.mouseY);
        }
      }

      // Crafting Section
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('Crafting', 16, 264);

      ctx.fillStyle = this.showAllRecipes ? '#3a6ea5' : '#25334a';
      ctx.fillRect(110, 248, 150, 22);
      ctx.strokeStyle = '#7ea8d9';
      ctx.strokeRect(110, 248, 150, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px monospace';
      ctx.fillText(this.showAllRecipes ? 'Mode: Recipe Guide' : 'Mode: CraftableNow', 118, 263);

      const stations = player.getNearbyStations(world);
      const recipes = this.showAllRecipes
        ? RECIPES
        : RECIPES.filter((r) => player.canCraft(r, stations));

      for (let idx = 0; idx < 6; idx++) {
        const recipe = recipes[this.craftScroll + idx];
        if (!recipe) break;
        const item = ITEMS[recipe.result];
        if (!item) continue;
        const rx = 16;
        const ry = 276 + idx * 40;
        const can = player.canCraft(recipe, stations);

        ctx.fillStyle = can ? 'rgba(36, 58, 92, 0.92)' : 'rgba(28, 32, 42, 0.85)';
        ctx.fillRect(rx, ry, 280, 36);
        ctx.strokeStyle = can ? '#6bb5ff' : '#444c5c';
        ctx.strokeRect(rx, ry, 280, 36);

        ctx.drawImage(atlas.getItemIcon(item), rx + 4, ry + 6, 24, 24);
        ctx.fillStyle = can ? RARITY_COLORS[item.rarity] || '#fff' : '#888';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`${item.name} ${recipe.count > 1 ? `x${recipe.count}` : ''}`, rx + 34, ry + 16);

        const ingText = recipe.ingredients
          .map((ing) => `${ITEMS[ing.id]?.name || ing.id}(${player.countItem(ing.id)}/${ing.count})`)
          .join(', ');
        ctx.fillStyle = '#b0c4de';
        ctx.font = '10px monospace';
        ctx.fillText(ingText.slice(0, 38), rx + 34, ry + 30);
      }

      // Open Chest Grid
      if (this.openChestCoords) {
        ctx.fillStyle = '#ffd747';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('Chest Storage', 316, 238);

        ctx.fillStyle = '#2d5a3c';
        ctx.fillRect(316, 248, 95, 22);
        ctx.strokeStyle = '#6ce08c';
        ctx.strokeRect(316, 248, 95, 22);
        ctx.fillStyle = '#fff';
        ctx.font = '11px monospace';
        ctx.fillText('[Loot All]', 328, 263);

        const chestSlots = world.getOrCreateChest(this.openChestCoords.x, this.openChestCoords.y);
        for (let i = 0; i < 20; i++) {
          const col = i % 5;
          const row = Math.floor(i / 5);
          const x = 316 + col * 44;
          const y = 276 + row * 44;
          this.drawSlot(ctx, x, y, chestSlots[i], '#4a3623', atlas);
        }
      }
    }

    // 3. Top-Right: Health, Mana & Minimap
    const rightX = sw - 226;
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = player.maxHp > 400 ? '#ffd747' : '#ff4268';
    ctx.fillText(`Life: ${Math.ceil(player.hp)} / ${player.maxHp}`, rightX, 24);

    // Heart Bar
    const heartW = 200;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(rightX, 30, heartW, 12);
    ctx.fillStyle = player.maxHp > 400 ? '#f5b922' : '#ff2b5e';
    ctx.fillRect(rightX + 1, 31, (heartW - 2) * clamp(player.hp / player.maxHp, 0, 1), 10);

    ctx.fillStyle = '#5ca8ff';
    ctx.fillText(`Mana: ${Math.floor(player.mana)} / ${player.maxMana}`, rightX, 56);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(rightX, 62, heartW, 8);
    ctx.fillStyle = '#387eff';
    ctx.fillRect(rightX + 1, 63, (heartW - 2) * clamp(player.mana / player.maxMana, 0, 1), 6);

    // Minimap Box
    ctx.drawImage(this.mapCanvas, rightX, 76);
    ctx.strokeStyle = '#6882ad';
    ctx.lineWidth = 2;
    ctx.strokeRect(rightX, 76, 210, 80);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#dce8ff';
    ctx.fillText(
      `${world.getTimeString()} | ${biome.toUpperCase()}${world.hardmode ? ' [HM]' : ''}`,
      rightX + 4,
      152
    );

    // Top-right Action Buttons ([K] Bosses, [F5] Save)
    ctx.fillStyle = '#4a286b';
    ctx.fillRect(sw - 220, 158, 102, 24);
    ctx.strokeStyle = '#c485ff';
    ctx.strokeRect(sw - 220, 158, 102, 24);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`[K] ${BOSS_CATALOG.length} Bosses`, sw - 213, 174);

    ctx.fillStyle = '#244f3d';
    ctx.fillRect(sw - 112, 158, 96, 24);
    ctx.strokeStyle = '#5ce6a0';
    ctx.strokeRect(sw - 112, 158, 96, 24);
    ctx.fillStyle = '#fff';
    ctx.fillText('Save World', sw - 98, 174);

    // 3b. Top-Center Boss Rush & Flying Mount Status Bar (Arena Mode Only!)
    if (this.isArenaMode) {
      const cx = Math.floor(sw / 2);
      ctx.fillStyle = 'rgba(12, 16, 30, 0.88)';
      ctx.fillRect(cx - 226, 12, 452, 58);
      ctx.strokeStyle = bosses.bossRushActive ? '#ffd747' : '#4a628a';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 226, 12, 452, 58);

      ctx.textAlign = 'center';
      ctx.font = 'bold 13px monospace';
      const mins = Math.floor(bosses.bossRushTimer / 60);
      const secs = (bosses.bossRushTimer % 60).toFixed(1).padStart(4, '0');
      if (bosses.bossRushCompleted) {
        ctx.fillStyle = '#05c8ff';
        ctx.fillText(`🏆 ${BOSS_CATALOG.length}-BOSS RUSH COMPLETED! CLEAR TIME: ${mins}:${secs}`, cx, 31);
      } else if (bosses.bossRushActive) {
        const waveEntry = BOSS_CATALOG[bosses.bossRushWave - 1];
        const waveStatus =
          bosses.bossRushCountdown > 0
            ? `Next Wave in ${bosses.bossRushCountdown.toFixed(1)}s...`
            : waveEntry?.name || '';
        ctx.fillStyle = '#ffd747';
        ctx.fillText(
          `⚔ BOSS RUSH WAVE ${bosses.bossRushWave}/${BOSS_CATALOG.length}: ${waveStatus} (${mins}:${secs})`,
          cx,
          31
        );
      } else {
        ctx.fillStyle = '#5ce1ff';
        ctx.fillText(
          `GRAND ARENA — Mount: ${player.mounted ? player.getMountName() : 'OFF'} (WASD to Fly, Shift to Boost)`,
          cx,
          31
        );
      }

      // 4 interactive buttons in Top-Center Bar
      const centerBtns = [
        {
          x: cx - 220,
          w: 108,
          label: bosses.bossRushActive ? 'Restart Rush' : '▶ Start Rush',
          bg: '#59243a',
          border: '#ff668c'
        },
        {
          x: cx - 106,
          w: 96,
          label: '⏭ Next Wave',
          bg: '#4a361f',
          border: '#ffd747'
        },
        {
          x: cx - 4,
          w: 112,
          label: `[R] Mount:${player.mounted ? 'ON' : 'OFF'}`,
          bg: player.mounted ? '#1f4f46' : '#2d3442',
          border: '#3be8d1'
        },
        {
          x: cx + 114,
          w: 106,
          label: '[F] Next Mount',
          bg: '#2b3859',
          border: '#75b8ff'
        }
      ];
      ctx.font = 'bold 11px monospace';
      for (const b of centerBtns) {
        ctx.fillStyle = b.bg;
        ctx.fillRect(b.x, 42, b.w, 24);
        ctx.strokeStyle = b.border;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x, 42, b.w, 24);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(b.label, b.x + b.w / 2, 58);
      }
      ctx.textAlign = 'left';
    }

    // 4. Active Boss Health Bar at Bottom Center
    const bossHp = bosses.getBossHealthSummary();
    if (bossHp) {
      const bw = Math.min(540, sw - 80);
      const bx = Math.floor((sw - bw) / 2);
      const by = sh - 54;

      ctx.fillStyle = 'rgba(12, 14, 24, 0.88)';
      ctx.fillRect(bx, by, bw, 28);
      const ratio = clamp(bossHp.hp / bossHp.maxHp, 0, 1);
      ctx.fillStyle = bossHp.phase >= 2 ? '#ff2957' : '#d9384a';
      ctx.fillRect(bx + 3, by + 3, (bw - 6) * ratio, 22);
      ctx.strokeStyle = '#ffd747';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, 28);

      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(
        `${bossHp.name} ${bossHp.phase > 1 ? `(Phase ${bossHp.phase})` : ''} — ${Math.ceil(bossHp.hp)} / ${bossHp.maxHp}`,
        sw / 2,
        by + 19
      );
      ctx.textAlign = 'left';
    }

    // 5. Chat & Event Log (Bottom Left — raised above joystick on mobile)
    let chatY = input.isMobile ? sh - 195 : sh - 70;
    ctx.font = 'bold 12px monospace';
    for (let i = this.chatLog.length - 1; i >= 0; i--) {
      const c = this.chatLog[i];
      if (c.age > 14) continue;
      const alpha = c.age > 11 ? (14 - c.age) / 3 : 1;
      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillText(c.text, 17, chatY + 1);
      ctx.fillStyle = c.color;
      ctx.fillText(c.text, 16, chatY);
      chatY -= 18;
    }
    ctx.globalAlpha = 1;

    // Controls quick hint bar at bottom-left (Desktop only)
    if (this.controlsHelpOpen && !input.isMobile) {
      ctx.font = '11px monospace';
      ctx.fillStyle = 'rgba(200, 220, 255, 0.88)';
      ctx.fillText(
        this.isArenaMode
          ? `Controls: [WASD/Space] 360° Mount Flight  [Shift] Mount Turbo Boost  [R] Toggle Mount  [F] Switch Mount (UFO/Fishron/Dragon/Ship)  [L-Click] Attack  [H] Heal  [K] ${BOSS_CATALOG.length} Bosses & Gear`
          : 'Controls: [WASD/Space] Move & Jump  [I] Inventory & Crafting  [L-Click] Mine / Place / Attack  [R-Click] Open Chest / Door  [E] Grapple  [H] Quick Heal  [M] World Map',
        16,
        sh - 10
      );
    }

    // Mobile Virtual Controls Overlay (ONLY rendered on mobile devices!)
    if (input.isMobile) {
      this.renderMobileControls(ctx, input);
    }

    // 6. Active NPC Dialogue / Shop Window
    if (this.activeNPC) {
      this.renderNPCModal(ctx, sw, this.activeNPC, atlas);
    }

    // 7. Boss Encyclopedia & Sandbox Arena Window
    if (this.bossMenuOpen) {
      this.renderBossModal(ctx, sw, world, player, atlas);
    }

    // 8. Fullscreen Map Overlay (`M`)
    if (this.fullMapOpen) {
      ctx.fillStyle = 'rgba(8, 12, 22, 0.92)';
      ctx.fillRect(60, 50, sw - 120, sh - 110);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.mapCanvas, 70, 80, sw - 140, sh - 150);
      ctx.strokeStyle = '#ffd747';
      ctx.strokeRect(60, 50, sw - 120, sh - 110);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('WORLD MAP — Press [M] to Close', 76, 72);
    }

    // 9. Cursor Held Item & Hover Tooltip
    if (player.cursorItem) {
      const def = ITEMS[player.cursorItem.id];
      if (def) {
        ctx.drawImage(atlas.getItemIcon(def), input.mouseX + 6, input.mouseY + 6, 24, 24);
        if (player.cursorItem.count > 1) {
          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = '#fff';
          ctx.fillText(`${player.cursorItem.count}`, input.mouseX + 20, input.mouseY + 28);
        }
      }
    }

    if (this.hoveredTooltip) {
      this.renderTooltip(ctx, this.hoveredTooltip);
    }
  }

  private renderMobileControls(ctx: CanvasRenderingContext2D, input: InputManager): void {
    const layout = input.getMobileLayout();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. Virtual Joystick (Bottom-Left)
    ctx.beginPath();
    ctx.arc(layout.joyX, layout.joyY, layout.joyRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16, 24, 44, 0.52)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = input.joyActive ? '#3be8d1' : 'rgba(120, 170, 235, 0.65)';
    ctx.stroke();

    // Inner guide crosshairs
    ctx.strokeStyle = 'rgba(120, 170, 235, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(layout.joyX - layout.joyRadius * 0.65, layout.joyY);
    ctx.lineTo(layout.joyX + layout.joyRadius * 0.65, layout.joyY);
    ctx.moveTo(layout.joyX, layout.joyY - layout.joyRadius * 0.65);
    ctx.lineTo(layout.joyX, layout.joyY + layout.joyRadius * 0.65);
    ctx.stroke();

    // Movable Joystick Thumb Knob
    const knobX = layout.joyX + input.joyX * (layout.joyRadius * 0.62);
    const knobY = layout.joyY + input.joyY * (layout.joyRadius * 0.62);
    ctx.beginPath();
    ctx.arc(knobX, knobY, 24, 0, Math.PI * 2);
    ctx.fillStyle = input.joyActive ? 'rgba(59, 232, 209, 0.85)' : 'rgba(92, 168, 255, 0.68)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // 2. Attack Button (Bottom-Right)
    ctx.beginPath();
    ctx.arc(layout.atkX, layout.atkY, layout.atkRadius, 0, Math.PI * 2);
    ctx.fillStyle = input.mobileAttackHeld
      ? 'rgba(255, 56, 92, 0.85)'
      : 'rgba(140, 24, 58, 0.65)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = input.mobileAttackHeld ? '#ffd747' : '#ff668c';
    ctx.stroke();

    if (input.attackAimActive) {
      const ax = layout.atkX + Math.cos(input.attackAimAngle) * (layout.atkRadius + 12);
      const ay = layout.atkY + Math.sin(input.attackAimAngle) * (layout.atkRadius + 12);
      ctx.beginPath();
      ctx.arc(ax, ay, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd747';
      ctx.fill();
    }

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ATK', layout.atkX, layout.atkY);

    // 3. Inventory Button (Left of Attack Button)
    ctx.beginPath();
    ctx.arc(layout.invX, layout.invY, layout.invRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.inventoryOpen
      ? 'rgba(72, 118, 210, 0.88)'
      : 'rgba(28, 44, 82, 0.68)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = this.inventoryOpen ? '#ffd747' : '#7ea8ff';
    ctx.stroke();
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('INV', layout.invX, layout.invY);

    // 4. Dash Button (Above Attack Button)
    ctx.beginPath();
    ctx.arc(layout.dashX, layout.dashY, layout.dashRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20, 78, 92, 0.68)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#3be8d1';
    ctx.stroke();
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('DASH', layout.dashX, layout.dashY);

    ctx.restore();
  }

  private renderNPCModal(
    ctx: CanvasRenderingContext2D,
    sw: number,
    npc: TownNPC,
    atlas: SpriteAtlas
  ): void {
    const px = Math.floor(sw / 2 - 220);
    const py = 110;
    const pw = 440;
    const ph = 310;

    ctx.fillStyle = 'rgba(18, 25, 42, 0.95)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#ffd747';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#ffd747';
    ctx.fillText(`${npc.name}${npc.title}`, px + 16, py + 26);

    ctx.fillStyle = '#ff5959';
    ctx.fillText('[X]', px + pw - 32, py + 24);

    // Wrapped dialogue
    ctx.font = '12px monospace';
    ctx.fillStyle = '#e2ebff';
    const text = npc.dialogue[this.dialogueIndex % npc.dialogue.length];
    this.drawWrappedText(ctx, `"${text}"`, px + 16, py + 48, pw - 32, 16);

    // Special Action Button
    ctx.fillStyle = '#2d598a';
    ctx.fillRect(px + 16, py + 92, 210, 26);
    ctx.strokeStyle = '#75b8ff';
    ctx.strokeRect(px + 16, py + 92, 210, 26);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    const actionLabel =
      npc.id === 'nurse'
        ? '[Heal Full HP (Free)]'
        : npc.id === 'old_man'
        ? '[Curse — Summon Skeletron!]'
        : '[Next Progression Tip]';
    ctx.fillText(actionLabel, px + 24, py + 109);

    // Shop Grid
    npc.shop.forEach((entry, idx) => {
      const def = ITEMS[entry.itemId];
      if (!def) return;
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const sx = px + 16 + col * 204;
      const sy = py + 130 + row * 34;

      ctx.fillStyle = 'rgba(34, 48, 76, 0.9)';
      ctx.fillRect(sx, sy, 196, 30);
      ctx.strokeStyle = '#4e6b9c';
      ctx.strokeRect(sx, sy, 196, 30);

      ctx.drawImage(atlas.getItemIcon(def), sx + 4, sy + 3, 24, 24);
      ctx.fillStyle = RARITY_COLORS[def.rarity] || '#fff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(def.name.slice(0, 18), sx + 32, sy + 15);
      ctx.fillStyle = '#ffd747';
      ctx.font = '10px monospace';
      ctx.fillText(`${entry.price}c`, sx + 32, sy + 26);
    });
  }

  private renderBossModal(
    ctx: CanvasRenderingContext2D,
    sw: number,
    world: World,
    player: Player,
    atlas: SpriteAtlas
  ): void {
    const px = Math.floor(sw / 2 - 330);
    const py = 65;
    const pw = 660;
    const ph = 490;

    ctx.fillStyle = 'rgba(14, 18, 32, 0.96)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#c485ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#ffd747';
    ctx.fillText(
      `BOSS ENCYCLOPEDIA & PROGRESSION TRACKER (${world.defeatedBosses.size}/${BOSS_CATALOG.length} Defeated) — Scroll Wheel`,
      px + 16,
      py + 26
    );
    ctx.fillStyle = '#ff5959';
    ctx.fillText('[X]', px + pw - 32, py + 26);

    // Top Quick Loadout & Teleport Bar
    const topLabels = [
      'Pre-HM',
      'Hardmode',
      'Endgame',
      `God: ${player.godMode ? 'ON' : 'OFF'}`,
      'Calamity',
      'TP: Spawn',
      'TP: Dungn',
      'TP: Templ',
      'TP: Hell'
    ];
    topLabels.forEach((lbl, idx) => {
      const bx = px + 12 + idx * 71;
      const by = py + 44;
      ctx.fillStyle = idx === 4 ? '#4a1228' : '#273859';
      ctx.fillRect(bx, by, 68, 24);
      ctx.strokeStyle = idx === 4 ? '#ff1938' : '#6bb5ff';
      ctx.strokeRect(bx, by, 68, 24);
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText(lbl, bx + 4, by + 16);
    });

    const maxRows = 7;
    for (let i = 0; i < maxRows; i++) {
      const entry = BOSS_CATALOG[this.bossScroll + i];
      if (!entry) break;
      const ry = py + 82 + i * 54;
      const beaten = world.defeatedBosses.has(entry.id);

      ctx.fillStyle = beaten ? 'rgba(28, 62, 46, 0.85)' : 'rgba(28, 36, 58, 0.85)';
      ctx.fillRect(px + 14, ry, pw - 28, 48);
      ctx.strokeStyle = entry.hardmode ? '#ff66d9' : '#5882c4';
      ctx.strokeRect(px + 14, ry, pw - 28, 48);

      const sItem = ITEMS[entry.summonItem];
      if (sItem) {
        ctx.drawImage(atlas.getItemIcon(sItem), px + 22, ry + 12, 24, 24);
      }

      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = beaten ? '#5ce68c' : entry.hardmode ? '#ff96ff' : '#ffffff';
      ctx.fillText(
        `#${entry.tier} ${entry.name} ${beaten ? '✓ DEFEATED' : entry.hardmode ? '[Hardmode]' : '[Pre-HM]'}`,
        px + 54,
        ry + 19
      );

      ctx.font = '11px monospace';
      ctx.fillStyle = '#b0c4de';
      ctx.fillText(`${entry.biomeHint} | Drops: ${entry.dropsSummary.slice(0, 44)}`, px + 54, ry + 37);

      // [Get Item] button
      ctx.fillStyle = '#2d4f6b';
      ctx.fillRect(px + pw - 236, ry + 10, 106, 28);
      ctx.strokeStyle = '#75c4ff';
      ctx.strokeRect(px + pw - 236, ry + 10, 106, 28);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('[+Summon Item]', px + pw - 230, ry + 28);

      // [Summon Now!] button
      ctx.fillStyle = '#6b243e';
      ctx.fillRect(px + pw - 122, ry + 10, 100, 28);
      ctx.strokeStyle = '#ff668c';
      ctx.strokeRect(px + pw - 122, ry + 10, 100, 28);
      ctx.fillStyle = '#fff';
      ctx.fillText('[Fight Boss!]', px + pw - 115, ry + 28);
    }
  }

  private drawSlot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    stack: ItemStack | null,
    borderColor: string,
    atlas: SpriteAtlas,
    badge?: string
  ): void {
    ctx.fillStyle = 'rgba(20, 28, 48, 0.86)';
    ctx.fillRect(x, y, 40, 40);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderColor === '#ffd747' ? 2.5 : 1.5;
    ctx.strokeRect(x, y, 40, 40);

    if (badge) {
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(200, 215, 240, 0.55)';
      ctx.fillText(badge, x + 3, y + 11);
    }

    if (stack) {
      const def = ITEMS[stack.id];
      if (def) {
        ctx.drawImage(atlas.getItemIcon(def), x + 8, y + 8, 24, 24);
        if (stack.count > 1) {
          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = '#000';
          ctx.fillText(`${stack.count}`, x + 5, y + 37);
          ctx.fillStyle = '#fff';
          ctx.fillText(`${stack.count}`, x + 4, y + 36);
        }
      }
    }
  }

  private setTooltipFromItem(stack: ItemStack, mx: number, my: number): void {
    const def = ITEMS[stack.id];
    if (!def) return;
    const stats: string[] = [];
    if (def.damage) stats.push(`${def.damage} damage`);
    if (def.pickPower) stats.push(`${def.pickPower}% pickaxe power`);
    if (def.axePower) stats.push(`${def.axePower}% axe power`);
    if (def.hammerPower) stats.push(`${def.hammerPower}% hammer power`);
    if (def.defense) stats.push(`${def.defense} defense`);
    if (def.manaCost) stats.push(`Uses ${def.manaCost} mana`);
    if (def.tooltip) stats.push(def.tooltip);

    this.hoveredTooltip = {
      title: `${def.name}${stack.count > 1 ? ` (${stack.count})` : ''}`,
      subtitle: stats.join(' • '),
      color: RARITY_COLORS[def.rarity] || '#ffffff',
      x: mx + 14,
      y: my + 18
    };
  }

  private renderTooltip(
    ctx: CanvasRenderingContext2D,
    t: { title: string; subtitle: string; color: string; x: number; y: number }
  ): void {
    ctx.font = 'bold 12px monospace';
    const w1 = ctx.measureText(t.title).width;
    ctx.font = '11px monospace';
    const w2 = t.subtitle ? ctx.measureText(t.subtitle).width : 0;
    const boxW = Math.max(w1, w2) + 18;
    const boxH = t.subtitle ? 42 : 24;
    const bx = Math.min(t.x, ctx.canvas.width - boxW - 10);
    const by = Math.min(t.y, ctx.canvas.height - boxH - 10);

    ctx.fillStyle = 'rgba(10, 14, 26, 0.94)';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = t.color;
    ctx.strokeRect(bx, by, boxW, boxH);

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = t.color;
    ctx.fillText(t.title, bx + 8, by + 16);

    if (t.subtitle) {
      ctx.font = '11px monospace';
      ctx.fillStyle = '#cfdcf0';
      ctx.fillText(t.subtitle, bx + 8, by + 33);
    }
  }

  private drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): void {
    const words = text.split(' ');
    let line = '';
    let curY = y;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth) {
        ctx.fillText(line, x, curY);
        line = w;
        curY += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, curY);
  }
}
