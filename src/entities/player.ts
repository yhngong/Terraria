import { TILE_SIZE, clamp, dist, rectOverlap, Rect } from '../core/math';
import { ITEMS, ItemStack, ItemDef } from '../items/items';
import { RECIPES, Recipe } from '../items/recipes';
import { TileId, TILE_DEFS, WallId, LiquidType } from '../world/tiles';
import { World } from '../world/world';
import { InputManager } from '../core/input';
import { AudioManager } from '../core/audio';
import { ParticleSystem } from '../core/particles';
import { ProjectileManager } from './projectiles';
import { SpriteAtlas } from '../assets/sprites';

export class Player {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  readonly width = 14;
  readonly height = 26;
  facing: 1 | -1 = 1;

  hp = 100;
  maxHp = 100;
  mana = 40;
  maxMana = 40;
  coins = 500; // 5 silver

  dead = false;
  respawnTimer = 0;
  invulnTimer = 0;
  potionCooldown = 0;

  onGround = false;
  coyoteTimer = 0;
  canDoubleJump = false;
  flightTimeLeft = 0;
  maxFlightTime = 0;
  fallStartY = 0;
  walkAnimTime = 0;

  // Grappling hook
  grapple = {
    active: false,
    latched: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0
  };

  // Inventory: 40 slots (0..9 = hotbar)
  inventory: (ItemStack | null)[] = new Array(40).fill(null);
  selectedSlot = 0;
  cursorItem: ItemStack | null = null;

  armor: {
    head: ItemStack | null;
    chest: ItemStack | null;
    legs: ItemStack | null;
  } = { head: null, chest: null, legs: null };

  accessories: (ItemStack | null)[] = new Array(5).fill(null);

  buffs: Map<string, number> = new Map();

  // Action / Swing state
  useCooldown = 0;
  swingDuration = 0.25;
  swingTimer = 0;
  swingHitIds: Set<number> = new Set();

  // Godmode toggle for testing/sandbox
  godMode = false;

  // Flying Mount System
  mounted = true;
  mountType: 'ufo' | 'fishron' | 'dragon' | 'airship' = 'ufo';
  mountDashCooldown = 0;
  mountHoverPhase = 0;

  constructor(spawnX: number, spawnY: number) {
    this.x = spawnX;
    this.y = spawnY;
    this.fallStartY = spawnY;
    this.giveStarterKit();
  }

  giveStarterKit(): void {
    this.inventory.fill(null);
    this.inventory[0] = { id: 'nights_edge', count: 1 };
    this.inventory[1] = { id: 'molten_fury', count: 1 };
    this.inventory[2] = { id: 'demon_scythe', count: 1 };
    this.inventory[3] = { id: 'minishark', count: 1 };
    this.inventory[4] = { id: 'healing_potion', count: 30 };
    this.inventory[5] = { id: 'molten_pickaxe', count: 1 };
    this.inventory[6] = { id: 'molten_hamaxe', count: 1 };
    this.inventory[7] = { id: 'cosmic_car_key', count: 1 };
    this.inventory[8] = { id: 'flaming_arrow', count: 999 };
    this.inventory[9] = { id: 'musket_ball', count: 999 };

    this.maxHp = 400;
    this.hp = 400;
    this.maxMana = 200;
    this.mana = 200;

    this.armor.head = { id: 'molten_helmet', count: 1 };
    this.armor.chest = { id: 'molten_breastplate', count: 1 };
    this.armor.legs = { id: 'molten_leggings', count: 1 };

    this.accessories[0] = { id: 'cosmic_car_key', count: 1 };
    this.accessories[1] = { id: 'hermes_boots', count: 1 };
    this.accessories[2] = { id: 'cobalt_shield', count: 1 };
    this.accessories[3] = { id: 'cloud_in_a_bottle', count: 1 };
    this.accessories[4] = { id: 'band_of_regeneration', count: 1 };
  }

  upgradeForBossRushWave(wave: number): string | null {
    // Auto-upgrade player arsenal at key Boss Rush milestones
    if (wave === 7) {
      // Entering Hardmode (The Twins)
      this.inventory[0] = { id: 'excalibur', count: 1 };
      this.inventory[1] = { id: 'daedalus_stormbow', count: 1 };
      this.inventory[2] = { id: 'crystal_storm', count: 1 };
      this.inventory[3] = { id: 'megashark', count: 1 };
      this.inventory[4] = { id: 'greater_healing_potion', count: 30 };
      this.inventory[8] = { id: 'holy_arrow', count: 999 };
      this.armor.head = { id: 'titanium_helmet', count: 1 };
      this.armor.chest = { id: 'titanium_breastplate', count: 1 };
      this.armor.legs = { id: 'titanium_leggings', count: 1 };
      this.accessories[2] = { id: 'ankh_shield', count: 1 };
      this.maxHp = 450;
      this.hp = 450;
      return 'Hardmode Arsenal Unlocked: Excalibur, Daedalus Stormbow, Megashark & Titanium Armor!';
    }
    if (wave === 10) {
      // Entering Plantera / Golem / Fishron
      this.inventory[0] = { id: 'terra_blade', count: 1 };
      this.inventory[1] = { id: 'tsunami', count: 1 };
      this.inventory[2] = { id: 'razorblade_typhoon', count: 1 };
      this.inventory[9] = { id: 'chlorophyte_bullet', count: 999 };
      this.armor.head = { id: 'chlorophyte_helmet', count: 1 };
      this.armor.chest = { id: 'chlorophyte_breastplate', count: 1 };
      this.armor.legs = { id: 'chlorophyte_leggings', count: 1 };
      this.accessories[3] = { id: 'celestial_shell', count: 1 };
      this.maxHp = 500;
      this.hp = 500;
      return 'Jungle & Temple Arsenal Unlocked: Terra Blade, Tsunami, Razorblade Typhoon & Chlorophyte Armor!';
    }
    if (wave === 13) {
      // Entering Lunatic Cultist & Moon Lord
      this.inventory[0] = { id: 'meowmere', count: 1 };
      this.inventory[1] = { id: 'sdmg', count: 1 };
      this.inventory[2] = { id: 'last_prism', count: 1 };
      this.inventory[3] = { id: 'solar_eruption', count: 1 };
      this.inventory[4] = { id: 'super_healing_potion', count: 30 };
      this.armor.head = { id: 'solar_helmet', count: 1 };
      this.armor.chest = { id: 'solar_breastplate', count: 1 };
      this.armor.legs = { id: 'solar_leggings', count: 1 };
      this.maxHp = 500;
      this.hp = 500;
      return 'Celestial Endgame Arsenal Unlocked: Meowmere, S.D.M.G., Last Prism, Solar Eruption & Solar Armor!';
    }
    return null;
  }

  getBounds(): Rect {
    return {
      x: this.x - this.width * 0.5,
      y: this.y - this.height * 0.5,
      w: this.width,
      h: this.height
    };
  }

  getHeldItem(): ItemDef | null {
    const stack = this.inventory[this.selectedSlot];
    if (!stack) return null;
    return ITEMS[stack.id] || null;
  }

  getDefense(): number {
    let def = 0;
    for (const slot of [this.armor.head, this.armor.chest, this.armor.legs]) {
      if (slot && ITEMS[slot.id]?.defense) {
        def += ITEMS[slot.id].defense!;
      }
    }
    for (const acc of this.accessories) {
      if (acc && ITEMS[acc.id]?.defense) {
        def += ITEMS[acc.id].defense!;
      }
    }
    if (this.buffs.has('ironskin')) def += 8;
    return def;
  }

  getDamageMultiplier(): number {
    let mult = 1.0;
    for (const slot of [this.armor.head, this.armor.chest, this.armor.legs]) {
      if (slot && ITEMS[slot.id]?.bonusDamage) {
        mult += ITEMS[slot.id].bonusDamage!;
      }
    }
    for (const acc of this.accessories) {
      if (acc && ITEMS[acc.id]?.bonusDamage) {
        mult += ITEMS[acc.id].bonusDamage!;
      }
    }
    return mult;
  }

  hasNoKnockback(): boolean {
    return this.accessories.some((a) => a && ITEMS[a.id]?.noKnockback);
  }

  hasLavaImmunity(): boolean {
    return this.accessories.some((a) => a && ITEMS[a.id]?.lavaImmune);
  }

  getSpeedMultiplier(): number {
    let mult = 1.0;
    for (const slot of [this.armor.head, this.armor.chest, this.armor.legs]) {
      if (slot && ITEMS[slot.id]?.bonusSpeed) {
        mult += ITEMS[slot.id].bonusSpeed!;
      }
    }
    for (const acc of this.accessories) {
      if (acc && ITEMS[acc.id]?.bonusSpeed) {
        mult += ITEMS[acc.id].bonusSpeed!;
      }
    }
    if (this.buffs.has('swiftness')) mult += 0.25;
    return mult;
  }

  hasDoubleJump(): boolean {
    return this.accessories.some((a) => a && ITEMS[a.id]?.bonusJump);
  }

  getMaxFlightTime(): number {
    let best = 0;
    for (const acc of this.accessories) {
      if (acc && ITEMS[acc.id]?.bonusFlight) {
        best = Math.max(best, ITEMS[acc.id].bonusFlight!);
      }
    }
    return best;
  }

  hasGrappleAvailable(): number {
    for (const acc of this.accessories) {
      if (acc && ITEMS[acc.id]?.isGrapple) return ITEMS[acc.id].grappleRange || 320;
    }
    for (const s of this.inventory) {
      if (s && ITEMS[s.id]?.isGrapple) return ITEMS[s.id].grappleRange || 320;
    }
    return 0;
  }

  addItem(id: string, count = 1): number {
    const def = ITEMS[id];
    if (!def || count <= 0) return 0;
    let remaining = count;

    // 1. Stack into existing slots
    for (let i = 0; i < this.inventory.length && remaining > 0; i++) {
      const slot = this.inventory[i];
      if (slot && slot.id === id && slot.count < def.maxStack) {
        const space = def.maxStack - slot.count;
        const add = Math.min(space, remaining);
        slot.count += add;
        remaining -= add;
      }
    }

    // 2. Fill empty slots
    for (let i = 0; i < this.inventory.length && remaining > 0; i++) {
      if (!this.inventory[i]) {
        const add = Math.min(def.maxStack, remaining);
        this.inventory[i] = { id, count: add };
        remaining -= add;
      }
    }

    return count - remaining;
  }

  countItem(id: string): number {
    let total = 0;
    for (const s of this.inventory) {
      if (s && s.id === id) total += s.count;
    }
    return total;
  }

  consumeItem(id: string, count = 1): boolean {
    if (this.countItem(id) < count) return false;
    let rem = count;
    for (let i = 0; i < this.inventory.length && rem > 0; i++) {
      const s = this.inventory[i];
      if (s && s.id === id) {
        const take = Math.min(s.count, rem);
        s.count -= take;
        rem -= take;
        if (s.count <= 0) this.inventory[i] = null;
      }
    }
    return true;
  }

  findAmmo(ammoType: 'arrow' | 'bullet'): ItemDef | null {
    for (const s of this.inventory) {
      if (s && ITEMS[s.id]?.ammoType === ammoType) {
        return ITEMS[s.id];
      }
    }
    return null;
  }

  getNearbyStations(world: World): Set<TileId> {
    const stations = new Set<TileId>();
    const ptx = Math.floor(this.x / TILE_SIZE);
    const pty = Math.floor(this.y / TILE_SIZE);
    const r = 6;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const t = world.getTile(ptx + dx, pty + dy);
        if (TILE_DEFS[t]?.isStation) {
          stations.add(t);
          // Upgraded stations also satisfy base station recipes
          if (t === TileId.HELLFORGE || t === TileId.ADAMANTITE_FORGE) {
            stations.add(TileId.FURNACE);
          }
          if (t === TileId.ADAMANTITE_FORGE) {
            stations.add(TileId.HELLFORGE);
          }
          if (t === TileId.MYTHRIL_ANVIL) {
            stations.add(TileId.ANVIL);
          }
          if (t === TileId.TABLE) {
            stations.add(TileId.WORK_BENCH);
          }
        }
      }
    }
    return stations;
  }

  canCraft(recipe: Recipe, stations: Set<TileId>): boolean {
    if (recipe.station !== undefined && !stations.has(recipe.station)) {
      return false;
    }
    for (const ing of recipe.ingredients) {
      if (this.countItem(ing.id) < ing.count) return false;
    }
    return true;
  }

  craft(recipe: Recipe, stations: Set<TileId>, audio: AudioManager): boolean {
    if (!this.canCraft(recipe, stations)) return false;
    for (const ing of recipe.ingredients) {
      this.consumeItem(ing.id, ing.count);
    }
    this.addItem(recipe.result, recipe.count);
    audio.play('craft');
    return true;
  }

  getAvailableRecipes(world: World): Recipe[] {
    const stations = this.getNearbyStations(world);
    return RECIPES.filter((r) => this.canCraft(r, stations));
  }

  takeDamage(
    rawDamage: number,
    knockbackDir: number,
    audio: AudioManager,
    particles: ParticleSystem,
    world: World
  ): void {
    if (this.dead || this.invulnTimer > 0 || this.godMode) return;
    const def = this.getDefense();
    const dmg = Math.max(1, Math.round(rawDamage - def * 0.5));
    this.hp -= dmg;
    this.invulnTimer = 0.55;

    if (!this.hasNoKnockback() && knockbackDir !== 0) {
      this.vx = knockbackDir * 190;
      this.vy = -150;
    }

    particles.addText(this.x, this.y - 10, `-${dmg}`, '#ff4242', 1.15);
    particles.spawn(this.x, this.y, '#d92b3a', 10, 110, 3);
    audio.play('playerHurt');

    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.respawnTimer = 4.0;
      this.grapple.active = false;
      particles.spawn(this.x, this.y, '#d92b3a', 28, 160, 4);
      audio.play('kill');
      void world;
    }
  }

  quickHeal(audio: AudioManager, particles: ParticleSystem): void {
    if (this.potionCooldown > 0 || this.hp >= this.maxHp) return;
    let bestSlot = -1;
    let bestHeal = 0;
    for (let i = 0; i < this.inventory.length; i++) {
      const s = this.inventory[i];
      if (!s) continue;
      const def = ITEMS[s.id];
      if (def?.healHp && def.healHp > bestHeal) {
        bestHeal = def.healHp;
        bestSlot = i;
      }
    }
    if (bestSlot >= 0) {
      const s = this.inventory[bestSlot]!;
      this.hp = Math.min(this.maxHp, this.hp + bestHeal);
      this.potionCooldown = 15;
      s.count--;
      if (s.count <= 0) this.inventory[bestSlot] = null;
      audio.play('potion');
      particles.addText(this.x, this.y - 14, `+${bestHeal}`, '#38eb5c', 1.2);
      particles.spawn(this.x, this.y, '#ff425b', 8, 70, 3, 0, true);
    }
  }

  quickMana(audio: AudioManager, particles: ParticleSystem): void {
    if (this.mana >= this.maxMana) return;
    for (let i = 0; i < this.inventory.length; i++) {
      const s = this.inventory[i];
      if (!s) continue;
      const def = ITEMS[s.id];
      if (def?.healMana) {
        this.mana = Math.min(this.maxMana, this.mana + def.healMana);
        s.count--;
        if (s.count <= 0) this.inventory[i] = null;
        audio.play('mana');
        particles.addText(this.x, this.y - 14, `+${def.healMana}`, '#429eff', 1.1);
        return;
      }
    }
  }

  quickBuff(audio: AudioManager, particles: ParticleSystem): void {
    let used = false;
    for (let i = 0; i < this.inventory.length; i++) {
      const s = this.inventory[i];
      if (!s) continue;
      const def = ITEMS[s.id];
      if (def?.buffId && def.buffDuration && !this.buffs.has(def.buffId)) {
        this.buffs.set(def.buffId, def.buffDuration);
        s.count--;
        if (s.count <= 0) this.inventory[i] = null;
        used = true;
      }
    }
    if (used) {
      audio.play('potion');
      particles.spawn(this.x, this.y, '#42e8ff', 10, 90, 3, 0, true);
    }
  }

  update(
    dt: number,
    input: InputManager,
    world: World,
    audio: AudioManager,
    particles: ParticleSystem,
    projectiles: ProjectileManager,
    uiBlockingMouse: boolean,
    onSummonBoss: (bossId: string, x?: number, y?: number) => void,
    onOpenChest: (cx: number, cy: number) => void,
    onChatMessage: (msg: string, color?: string) => void
  ): void {
    if (this.dead) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.dead = false;
        this.hp = this.maxHp;
        this.mana = this.maxMana;
        this.vx = 0;
        this.vy = 0;
        this.x = world.spawnX;
        this.y = world.spawnY;
        this.fallStartY = this.y;
      }
      return;
    }

    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.potionCooldown > 0) this.potionCooldown = Math.max(0, this.potionCooldown - dt);
    if (this.useCooldown > 0) this.useCooldown -= dt;
    if (this.swingTimer > 0) this.swingTimer -= dt;

    // Update buffs
    for (const [k, v] of this.buffs.entries()) {
      if (v - dt <= 0) this.buffs.delete(k);
      else this.buffs.set(k, v - dt);
    }

    // Passive HP & Mana Regeneration
    const nearbyStations = this.getNearbyStations(world);
    let hpRegen = 1.6;
    if (nearbyStations.has(TileId.CAMPFIRE)) hpRegen += 2.5;
    if (this.buffs.has('regen')) hpRegen += 4.0;
    for (const acc of this.accessories) {
      if (acc && ITEMS[acc.id]?.hpRegenBonus) {
        hpRegen += ITEMS[acc.id].hpRegenBonus!;
      }
    }
    this.hp = Math.min(this.maxHp, this.hp + hpRegen * dt);
    this.mana = Math.min(this.maxMana, this.mana + (Math.abs(this.vx) < 10 ? 18 : 9) * dt);

    // Hotkeys
    if (input.wasPressed('KeyH')) this.quickHeal(audio, particles);
    if (input.wasPressed('KeyJ')) this.quickMana(audio, particles);
    if (input.wasPressed('KeyB')) this.quickBuff(audio, particles);

    // Flying Mount Toggle (KeyR) & Style Cycle (KeyF)
    if (input.wasPressed('KeyR')) {
      this.mounted = !this.mounted;
      this.grapple.active = false;
      this.fallStartY = this.y;
      audio.play('grapple');
      particles.spawn(this.x, this.y, '#3be8d1', 16, 120, 3.5, 0, true);
      onChatMessage(
        this.mounted
          ? `Mounted ${this.getMountName()}! (Use WASD/Space to fly freely, Shift to Turbo Boost)`
          : 'Dismounted.',
        '#3be8d1'
      );
    }

    if (input.wasPressed('KeyF')) {
      const order: ('ufo' | 'fishron' | 'dragon' | 'airship')[] = ['ufo', 'fishron', 'dragon', 'airship'];
      this.mountType = order[(order.indexOf(this.mountType) + 1) % order.length];
      this.mounted = true;
      audio.play('magic');
      particles.spawn(this.x, this.y, '#ffd747', 16, 120, 3.5, 0, true);
      onChatMessage(`Switched Flying Mount to: ${this.getMountName()}!`, '#ffd747');
    }

    if (this.mountDashCooldown > 0) this.mountDashCooldown -= dt;
    this.mountHoverPhase += dt * 4.5;

    // Grappling Hook ('KeyE')
    const grappleRange = this.hasGrappleAvailable();
    if (input.wasPressed('KeyE') && grappleRange > 0) {
      const angle = Math.atan2(input.worldMouseY - this.y, input.worldMouseX - this.x);
      this.grapple.active = true;
      this.grapple.latched = false;
      this.grapple.x = this.x;
      this.grapple.y = this.y;
      this.grapple.vx = Math.cos(angle) * 680;
      this.grapple.vy = Math.sin(angle) * 680;
      audio.play('grapple');
    }

    if (this.grapple.active) {
      if (!this.grapple.latched) {
        this.grapple.x += this.grapple.vx * dt;
        this.grapple.y += this.grapple.vy * dt;
        const gtx = Math.floor(this.grapple.x / TILE_SIZE);
        const gty = Math.floor(this.grapple.y / TILE_SIZE);
        if (world.isSolid(gtx, gty)) {
          this.grapple.latched = true;
          audio.play('tink');
        } else if (dist(this.x, this.y, this.grapple.x, this.grapple.y) > grappleRange) {
          this.grapple.active = false;
        }
      } else {
        const dx = this.grapple.x - this.x;
        const dy = this.grapple.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d > 14) {
          this.vx = (dx / d) * 380;
          this.vy = (dy / d) * 380;
        } else {
          this.vx *= 0.5;
          this.vy *= 0.5;
        }
        this.fallStartY = this.y;
        this.flightTimeLeft = this.getMaxFlightTime();
        this.canDoubleJump = this.hasDoubleJump();
        if (input.wasPressed('Space')) {
          this.grapple.active = false;
          this.vy = -310;
          audio.play('jump');
        }
      }
    }

    // Horizontal & Vertical Movement (including 360° Flying Mount!)
    const moveLeft = input.isDown('KeyA') || input.isDown('ArrowLeft');
    const moveRight = input.isDown('KeyD') || input.isDown('ArrowRight');
    const moveDown = input.isDown('KeyS') || input.isDown('ArrowDown');
    const jumpHeld = input.isDown('Space') || input.isDown('KeyW') || input.isDown('ArrowUp');
    const jumpJust =
      input.wasPressed('Space') || input.wasPressed('KeyW') || input.wasPressed('ArrowUp');
    const dashPressed = input.wasPressed('ShiftLeft') || input.wasPressed('ShiftRight');

    if (this.mounted) {
      // Full 360° Omnidirectional Flying Mount Physics!
      const mountSpeed = 310 * Math.max(1, this.getSpeedMultiplier() * 0.85);
      const mountAccel = 1800;

      if (moveLeft && !moveRight) {
        this.vx = Math.max(-mountSpeed, this.vx - mountAccel * dt);
        this.facing = -1;
      } else if (moveRight && !moveLeft) {
        this.vx = Math.min(mountSpeed, this.vx + mountAccel * dt);
        this.facing = 1;
      } else {
        this.vx *= Math.pow(0.002, dt);
        if (Math.abs(this.vx) < 4) this.vx = 0;
      }

      if (jumpHeld && !moveDown) {
        this.vy = Math.max(-mountSpeed, this.vy - mountAccel * dt);
      } else if (moveDown && !jumpHeld) {
        this.vy = Math.min(mountSpeed, this.vy + mountAccel * dt);
      } else {
        this.vy *= Math.pow(0.002, dt);
        if (Math.abs(this.vy) < 4) this.vy = 0;
      }

      // Shift Key: Mount Turbo Dash!
      if (dashPressed && this.mountDashCooldown <= 0) {
        this.mountDashCooldown = 0.65;
        const dx = (moveRight ? 1 : moveLeft ? -1 : 0) || this.facing;
        const dy = moveDown ? 1 : jumpHeld ? -1 : 0;
        const len = Math.hypot(dx, dy) || 1;
        this.vx = (dx / len) * 680;
        this.vy = (dy / len) * 680;
        this.invulnTimer = Math.max(this.invulnTimer, 0.28);
        audio.play('laser');
        particles.spawnShockwave(this.x, this.y, '#3be8d1', 90, 0.28, 4);
        particles.triggerShake(5, 0.15);
        particles.spawn(this.x, this.y, '#3be8d1', 22, 220, 4, 0, true);
      }

      if (Math.hypot(this.vx, this.vy) > 220) {
        particles.spawnAfterimage(this.x, this.y, 12, '#3be8d1', 0.18);
      }

      // Ambient Mount Thruster Particles
      if (Math.random() < 0.65) {
        const pCol =
          this.mountType === 'dragon'
            ? '#ff771c'
            : this.mountType === 'fishron'
            ? '#1cb3ff'
            : this.mountType === 'airship'
            ? '#ffd747'
            : '#3be8d1';
        particles.spawn(this.x + (Math.random() - 0.5) * 14, this.y + 14, pCol, 1, 35, 2.8, 25, true);
      }

      this.fallStartY = this.y;
      // When mounted, pass dropThroughPlatform = !onGround || moveDown so flying down passes through platforms smoothly
      this.moveAndCollide(dt, world, moveDown || this.vy < 0 || !this.onGround, audio, particles);
    } else {
      const maxSpeed = 165 * this.getSpeedMultiplier();
      const accel = this.onGround ? 1200 : 750;

      if (!this.grapple.latched) {
        if (moveLeft && !moveRight) {
          this.vx = Math.max(-maxSpeed, this.vx - accel * dt);
          this.facing = -1;
        } else if (moveRight && !moveLeft) {
          this.vx = Math.min(maxSpeed, this.vx + accel * dt);
          this.facing = 1;
        } else {
          const friction = this.onGround ? 1100 : 320;
          if (Math.abs(this.vx) <= friction * dt) this.vx = 0;
          else this.vx -= Math.sign(this.vx) * friction * dt;
        }
      }

      if (this.onGround && Math.abs(this.vx) > 20) {
        this.walkAnimTime += dt * (Math.abs(this.vx) / 110);
        if (Math.abs(this.vx) > 195 && Math.random() < 0.35) {
          particles.spawn(this.x, this.y + 12, '#e8f5ff', 1, 30, 2.5, 0);
        }
      } else {
        this.walkAnimTime = 0;
      }

      // Jumping, Double Jump & Wings
      this.maxFlightTime = this.getMaxFlightTime();
      if (this.onGround) {
        this.coyoteTimer = 0.1;
        this.canDoubleJump = this.hasDoubleJump();
        this.flightTimeLeft = this.maxFlightTime;
      } else {
        this.coyoteTimer -= dt;
      }

      if (!this.grapple.latched) {
        if (jumpJust && this.coyoteTimer > 0) {
          this.vy = -325;
          this.onGround = false;
          this.coyoteTimer = 0;
          audio.play('jump');
        } else if (jumpJust && this.canDoubleJump) {
          this.vy = -310;
          this.canDoubleJump = false;
          particles.spawn(this.x, this.y + 12, '#ffffff', 12, 95, 3.5, 20);
          audio.play('jump');
        } else if (jumpHeld && !this.onGround && this.flightTimeLeft > 0) {
          this.flightTimeLeft -= dt;
          this.vy = Math.max(-235, this.vy - 980 * dt);
          this.fallStartY = this.y;
          if (Math.random() < 0.5) {
            particles.spawn(this.x - this.facing * 6, this.y + 4, '#ffd966', 1, 45, 3, 40, true);
          }
        }
      }

      // Gravity & Liquids
      const ptx = Math.floor(this.x / TILE_SIZE);
      const pty = Math.floor(this.y / TILE_SIZE);
      const inLiquid = world.getLiquid(ptx, pty) > 60;
      const liquidType = world.getLiquidType(ptx, pty);

      if (!this.grapple.latched) {
        const grav = inLiquid ? 320 : 760;
        const maxFall = inLiquid ? 140 : jumpHeld && this.maxFlightTime > 0 ? 110 : 480;
        this.vy = Math.min(maxFall, this.vy + grav * dt);
        if (inLiquid && jumpHeld) {
          this.vy = -150;
        }
      }

      if (inLiquid && liquidType === LiquidType.LAVA && !this.hasLavaImmunity()) {
        this.takeDamage(45, 0, audio, particles, world);
      }

      // AABB Tile Collision
      this.moveAndCollide(dt, world, moveDown, audio, particles);
    }

    // Pickup Dropped Items
    for (let i = world.droppedItems.length - 1; i >= 0; i--) {
      const d = world.droppedItems[i];
      if (d.pickupDelay > 0) continue;
      const distToPlayer = dist(this.x, this.y, d.x, d.y);
      if (distToPlayer < 68) {
        const dx = this.x - d.x;
        const dy = this.y - d.y;
        const len = Math.max(1, Math.hypot(dx, dy));
        d.x += (dx / len) * 280 * dt;
        d.y += (dy / len) * 280 * dt;
        if (distToPlayer < 18) {
          const added = this.addItem(d.id, d.count);
          if (added > 0) {
            audio.play('pickup');
            const itemName = ITEMS[d.id]?.name || d.id;
            particles.addText(this.x, this.y - 16, `${itemName} (${added})`, '#ffffff', 0.9);
            d.count -= added;
            if (d.count <= 0) {
              world.droppedItems.splice(i, 1);
            }
          }
        }
      }
    }

    // Right-click world interactions (Doors, Chests, Lihzahrd Altar)
    if (!uiBlockingMouse && input.mouseRightJustPressed) {
      const tx = input.tileMouseX;
      const ty = input.tileMouseY;
      if (dist(this.x, this.y, (tx + 0.5) * TILE_SIZE, (ty + 0.5) * TILE_SIZE) < 115) {
        const clickedTile = world.getTile(tx, ty);
        if (clickedTile === TileId.DOOR_CLOSED) {
          this.toggleDoor(world, tx, ty, TileId.DOOR_OPEN);
          audio.play('place');
        } else if (clickedTile === TileId.DOOR_OPEN) {
          this.toggleDoor(world, tx, ty, TileId.DOOR_CLOSED);
          audio.play('place');
        } else if (clickedTile === TileId.CHEST) {
          onOpenChest(tx, ty);
          audio.play('menu');
        } else if (clickedTile === TileId.LIHZAHRD_ALTAR) {
          if (this.consumeItem('lihzahrd_power_cell', 1)) {
            onSummonBoss('golem', tx * TILE_SIZE, (ty - 6) * TILE_SIZE);
          } else {
            onChatMessage('Requires a Lihzahrd Power Cell in your inventory!', '#ff9696');
          }
        }
      }
    }

    // Left-click Item Use (Weapons, Tools, Blocks, Consumables, Summons)
    if (!uiBlockingMouse) {
      const held = this.getHeldItem();
      const trigger = held?.autoReuse ? input.mouseLeft : input.mouseLeftJustPressed;
      if (held && trigger && this.useCooldown <= 0) {
        this.useHeldItem(
          dt,
          held,
          input,
          world,
          audio,
          particles,
          projectiles,
          onSummonBoss,
          onChatMessage
        );
      } else if (!input.mouseLeft) {
        world.miningProgress = 0;
        world.miningX = -1;
        world.miningY = -1;
      }
    }
  }

  private toggleDoor(world: World, tx: number, ty: number, target: TileId): void {
    for (let dy = -3; dy <= 3; dy++) {
      const t = world.getTile(tx, ty + dy);
      if (t === TileId.DOOR_CLOSED || t === TileId.DOOR_OPEN) {
        world.setTile(tx, ty + dy, target);
      }
    }
  }

  private useHeldItem(
    dt: number,
    held: ItemDef,
    input: InputManager,
    world: World,
    audio: AudioManager,
    particles: ParticleSystem,
    projectiles: ProjectileManager,
    onSummonBoss: (bossId: string, x?: number, y?: number) => void,
    onChatMessage: (msg: string, color?: string) => void
  ): void {
    this.facing = input.worldMouseX >= this.x ? 1 : -1;

    // 1. Tool (Pickaxe, Axe, Hammer)
    if (held.category === 'tool') {
      let tx = input.tileMouseX;
      let ty = input.tileMouseY;

      // Smart Cursor: automatically find closest solid block in mouse direction
      if (input.smartCursor) {
        const angle = Math.atan2(input.worldMouseY - this.y, input.worldMouseX - this.x);
        for (let d = 14; d <= 72; d += 8) {
          const cx = Math.floor((this.x + Math.cos(angle) * d) / TILE_SIZE);
          const cy = Math.floor((this.y + Math.sin(angle) * d) / TILE_SIZE);
          if (world.getTile(cx, cy) !== TileId.AIR) {
            tx = cx;
            ty = cy;
            break;
          }
        }
      }

      const reach = 96;
      const targetCenterX = (tx + 0.5) * TILE_SIZE;
      const targetCenterY = (ty + 0.5) * TILE_SIZE;

      this.swingDuration = held.useTime || 0.2;
      if (this.swingTimer <= 0) {
        this.swingTimer = this.swingDuration;
        this.swingHitIds.clear();
      }

      if (dist(this.x, this.y, targetCenterX, targetCenterY) <= reach) {
        const tile = world.getTile(tx, ty);
        const def = TILE_DEFS[tile];

        // Hammer breaks background walls or Demon Altars
        if (held.hammerPower && tile === TileId.AIR && world.getWall(tx, ty) !== WallId.NONE) {
          const wId = world.getWall(tx, ty);
          world.setWall(tx, ty, WallId.NONE);
          audio.play('dig');
          this.useCooldown = held.useTime || 0.2;
          return;
        }

        if (tile !== TileId.AIR && def) {
          const rightTool =
            def.tool === 'any' ||
            (def.tool === 'pick' && (held.pickPower || 0) > 0) ||
            (def.tool === 'axe' && (held.axePower || 0) > 0) ||
            (def.tool === 'hammer' && (held.hammerPower || 0) > 0);

          const power =
            def.tool === 'axe'
              ? held.axePower || 0
              : def.tool === 'hammer'
              ? held.hammerPower || 0
              : held.pickPower || 35;

          if (rightTool && power >= (def.minPick || 0)) {
            if (world.miningX !== tx || world.miningY !== ty) {
              world.miningX = tx;
              world.miningY = ty;
              world.miningProgress = 0;
            }
            world.miningProgress += power * 4.2 * dt;

            if (this.useCooldown <= 0) {
              audio.play(def.isOre || tile === TileId.STONE ? 'tink' : 'dig');
              particles.spawn(targetCenterX, targetCenterY, def.color, 3, 55, 2.5);
              this.useCooldown = held.useTime || 0.18;
            }

            if (world.miningProgress >= def.hardness) {
              this.finishMiningTile(
                world,
                tx,
                ty,
                tile,
                particles,
                onSummonBoss,
                onChatMessage
              );
              world.miningProgress = 0;
            }
          }
        }
      }
      return;
    }

    // 2. Placeable Block / Station / Wall
    if (held.placeTile !== undefined || held.placeWall !== undefined) {
      const tx = input.tileMouseX;
      const ty = input.tileMouseY;
      const targetCenterX = (tx + 0.5) * TILE_SIZE;
      const targetCenterY = (ty + 0.5) * TILE_SIZE;
      if (dist(this.x, this.y, targetCenterX, targetCenterY) <= 105) {
        if (held.placeTile !== undefined && world.getTile(tx, ty) === TileId.AIR) {
          const tileRect: Rect = { x: tx * TILE_SIZE, y: ty * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };
          const overlapsPlayer =
            TILE_DEFS[held.placeTile]?.solid && rectOverlap(this.getBounds(), tileRect);
          if (!overlapsPlayer) {
            if (held.placeTile === TileId.DOOR_CLOSED) {
              // Place 3-tile tall door
              if (
                world.getTile(tx, ty - 1) === TileId.AIR &&
                world.getTile(tx, ty - 2) === TileId.AIR
              ) {
                world.setTile(tx, ty, TileId.DOOR_CLOSED);
                world.setTile(tx, ty - 1, TileId.DOOR_CLOSED);
                world.setTile(tx, ty - 2, TileId.DOOR_CLOSED);
              } else {
                return;
              }
            } else {
              world.setTile(tx, ty, held.placeTile);
            }
            this.consumeSelected(1);
            audio.play('place');
            this.useCooldown = held.useTime || 0.12;
          }
        } else if (held.placeWall !== undefined && world.getWall(tx, ty) === WallId.NONE) {
          world.setWall(tx, ty, held.placeWall);
          this.consumeSelected(1);
          audio.play('place');
          this.useCooldown = held.useTime || 0.08;
        }
      }
      return;
    }

    // 3. Melee Weapon
    if (held.category === 'melee') {
      this.useCooldown = held.useTime || 0.22;
      this.swingDuration = this.useCooldown;
      this.swingTimer = this.swingDuration;
      this.swingHitIds.clear();
      audio.play('swing');

      if (held.projectileType) {
        const angle = Math.atan2(input.worldMouseY - this.y, input.worldMouseX - this.x);
        const spd = held.projectileSpeed || 500;
        const dmg = Math.round((held.damage || 20) * this.getDamageMultiplier());

        if (held.projectileType === 'zenith_arc') {
          for (let k = 0; k < 2; k++) {
            projectiles.spawn({
              x: this.x,
              y: this.y,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              type: 'zenith_arc',
              damage: dmg,
              knockback: held.knockback || 6,
              friendly: true,
              targetX: input.worldMouseX + (Math.random() - 0.5) * 36,
              targetY: input.worldMouseY + (Math.random() - 0.5) * 36
            });
          }
        } else {
          projectiles.spawn({
            x: this.x + Math.cos(angle) * 14,
            y: this.y + Math.sin(angle) * 14,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            type: held.projectileType,
            damage: dmg,
            knockback: held.knockback || 4,
            friendly: true
          });
        }
      }
      return;
    }

    // 4. Ranged Weapon
    if (held.category === 'ranged') {
      const ammo = held.useAmmo ? this.findAmmo(held.useAmmo) : null;
      if (held.useAmmo && !ammo) return;
      if (ammo) this.consumeItem(ammo.id, 1);

      this.useCooldown = held.useTime || 0.22;
      audio.play(held.iconType === 'gun' ? 'gun' : 'bow');

      const baseAngle = Math.atan2(input.worldMouseY - this.y, input.worldMouseX - this.x);
      const count = held.projectileCount || 1;
      const spread = held.spread || 0;
      const spd = held.projectileSpeed || 600;
      const totalDmg = Math.round(
        ((held.damage || 10) + (ammo?.damage || 0)) * this.getDamageMultiplier()
      );
      let projType = ammo?.projectileType || (held.useAmmo === 'bullet' ? 'bullet' : 'arrow');
      if (held.id === 'molten_fury' && projType === 'arrow') {
        projType = 'fire_arrow';
      }

      for (let i = 0; i < count; i++) {
        const offset = count === 1 ? (Math.random() - 0.5) * spread : (i - (count - 1) / 2) * (spread / Math.max(1, count - 1));
        const a = baseAngle + offset;
        projectiles.spawn({
          x: this.x + Math.cos(a) * 12,
          y: this.y + Math.sin(a) * 12,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          type: projType,
          damage: totalDmg,
          knockback: held.knockback || 3,
          friendly: true
        });
      }
      return;
    }

    // 5. Magic Weapon
    if (held.category === 'magic') {
      const cost = held.manaCost || 6;
      if (this.mana < cost && !this.godMode) return;
      if (!this.godMode) this.mana -= cost;

      this.useCooldown = held.useTime || 0.2;
      audio.play('magic');

      const baseAngle = Math.atan2(input.worldMouseY - this.y, input.worldMouseX - this.x);
      const count = held.projectileCount || 1;
      const spread = held.spread || 0;
      const spd = held.projectileSpeed || 520;
      const dmg = Math.round((held.damage || 18) * this.getDamageMultiplier());

      for (let i = 0; i < count; i++) {
        const a = baseAngle + (Math.random() - 0.5) * spread;
        projectiles.spawn({
          x: this.x + Math.cos(a) * 14,
          y: this.y + Math.sin(a) * 14,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          type: held.projectileType || 'spark_bolt',
          damage: dmg,
          knockback: held.knockback || 3,
          friendly: true
        });
      }
      return;
    }

    // 6. Consumable / Boss Summon / Mount Key
    if (held.id === 'cosmic_car_key') {
      this.mounted = !this.mounted;
      this.useCooldown = 0.3;
      audio.play('grapple');
      particles.spawn(this.x, this.y, '#3be8d1', 16, 120, 3.5, 0, true);
      onChatMessage(
        this.mounted ? `Mounted ${this.getMountName()}!` : 'Dismounted.',
        '#3be8d1'
      );
      return;
    }

    if (held.category === 'consumable' || held.category === 'summon') {
      if (held.summonBoss) {
        onSummonBoss(held.summonBoss);
        this.consumeSelected(1);
        this.useCooldown = 0.5;
        return;
      }
      if (held.permMaxHp) {
        const cap = held.id === 'life_fruit' ? 500 : 400;
        if (this.maxHp < cap) {
          this.maxHp = Math.min(cap, this.maxHp + held.permMaxHp);
          this.hp = Math.min(this.maxHp, this.hp + held.permMaxHp);
          this.consumeSelected(1);
          audio.play('potion');
          particles.addText(this.x, this.y - 16, `+${held.permMaxHp} Max HP!`, '#ff2b67', 1.25);
          this.useCooldown = 0.4;
        }
        return;
      }
      if (held.permMaxMana) {
        if (this.maxMana < 200) {
          this.maxMana = Math.min(200, this.maxMana + held.permMaxMana);
          this.mana = Math.min(this.maxMana, this.mana + held.permMaxMana);
          this.consumeSelected(1);
          audio.play('mana');
          particles.addText(this.x, this.y - 16, `+${held.permMaxMana} Max Mana!`, '#387eff', 1.25);
          this.useCooldown = 0.4;
        }
        return;
      }
      if (held.healHp && this.potionCooldown <= 0 && this.hp < this.maxHp) {
        this.hp = Math.min(this.maxHp, this.hp + held.healHp);
        this.potionCooldown = 15;
        this.consumeSelected(1);
        audio.play('potion');
        particles.addText(this.x, this.y - 14, `+${held.healHp}`, '#38eb5c', 1.15);
        this.useCooldown = 0.35;
        return;
      }
      if (held.healMana && this.mana < this.maxMana) {
        this.mana = Math.min(this.maxMana, this.mana + held.healMana);
        this.consumeSelected(1);
        audio.play('mana');
        this.useCooldown = 0.3;
        return;
      }
      if (held.buffId && held.buffDuration) {
        this.buffs.set(held.buffId, held.buffDuration);
        this.consumeSelected(1);
        audio.play('potion');
        this.useCooldown = 0.3;
      }
    }
  }

  private finishMiningTile(
    world: World,
    tx: number,
    ty: number,
    tile: TileId,
    particles: ParticleSystem,
    onSummonBoss: (bossId: string, x?: number, y?: number) => void,
    onChatMessage: (msg: string, color?: string) => void
  ): void {
    const def = TILE_DEFS[tile];
    const cx = (tx + 0.5) * TILE_SIZE;
    const cy = (ty + 0.5) * TILE_SIZE;

    // Tree chopping: fell entire trunk above
    if (tile === TileId.WOOD) {
      let y = ty;
      while (world.getTile(tx, y) === TileId.WOOD) {
        world.setTile(tx, y, TileId.AIR);
        world.spawnDrop(cx, y * TILE_SIZE, 'wood', 2);
        // Clear adjacent canopy leaves
        for (let lx = -2; lx <= 2; lx++) {
          for (let ly = -2; ly <= 2; ly++) {
            if (world.getTile(tx + lx, y + ly) === TileId.LEAVES) {
              world.setTile(tx + lx, y + ly, TileId.AIR);
              particles.spawn((tx + lx) * TILE_SIZE, (y + ly) * TILE_SIZE, '#288f3b', 3, 50, 2.5);
            }
          }
        }
        y--;
      }
      return;
    }

    world.setTile(tx, ty, TileId.AIR);
    particles.spawn(cx, cy, def.color, 8, 85, 3);

    if (tile === TileId.DEMON_ALTAR) {
      const msg = world.blessWithHardmodeOres();
      onChatMessage(msg, '#5ce1ff');
      return;
    }

    if (tile === TileId.PLANTERA_BULB) {
      onSummonBoss('plantera', cx, cy);
      return;
    }

    if (tile === TileId.POT) {
      world.spawnDrop(cx, cy, 'torch', 4);
      world.spawnDrop(cx, cy, 'lesser_healing_potion', 1);
      world.spawnDrop(cx, cy, 'wooden_arrow', 15);
      return;
    }

    if (def.dropItemId) {
      world.spawnDrop(cx, cy, def.dropItemId, 1);
    }
  }

  private consumeSelected(amount: number): void {
    const s = this.inventory[this.selectedSlot];
    if (!s) return;
    s.count -= amount;
    if (s.count <= 0) {
      this.inventory[this.selectedSlot] = null;
    }
  }

  private moveAndCollide(
    dt: number,
    world: World,
    dropThroughPlatform: boolean,
    audio: AudioManager,
    particles: ParticleSystem
  ): void {
    const hw = this.width * 0.5;
    const hh = this.height * 0.5;

    // Horizontal step
    const nextX = this.x + this.vx * dt;
    const topTile = Math.floor((this.y - hh + 2) / TILE_SIZE);
    const botTile = Math.floor((this.y + hh - 2) / TILE_SIZE);

    if (this.vx > 0) {
      const rightTile = Math.floor((nextX + hw) / TILE_SIZE);
      let blocked = false;
      for (let ty = topTile; ty <= botTile; ty++) {
        if (world.isSolid(rightTile, ty)) {
          blocked = true;
          break;
        }
      }
      // Auto-step 1-block ledges when walking
      if (
        blocked &&
        this.onGround &&
        world.isSolid(rightTile, botTile) &&
        !world.isSolid(rightTile, botTile - 1) &&
        !world.isSolid(rightTile, botTile - 2)
      ) {
        this.y = botTile * TILE_SIZE - hh - 0.01;
        this.x = nextX;
      } else if (blocked) {
        this.x = rightTile * TILE_SIZE - hw - 0.01;
        this.vx = 0;
      } else {
        this.x = nextX;
      }
    } else if (this.vx < 0) {
      const leftTile = Math.floor((nextX - hw) / TILE_SIZE);
      let blocked = false;
      for (let ty = topTile; ty <= botTile; ty++) {
        if (world.isSolid(leftTile, ty)) {
          blocked = true;
          break;
        }
      }
      if (
        blocked &&
        this.onGround &&
        world.isSolid(leftTile, botTile) &&
        !world.isSolid(leftTile, botTile - 1) &&
        !world.isSolid(leftTile, botTile - 2)
      ) {
        this.y = botTile * TILE_SIZE - hh - 0.01;
        this.x = nextX;
      } else if (blocked) {
        this.x = (leftTile + 1) * TILE_SIZE + hw + 0.01;
        this.vx = 0;
      } else {
        this.x = nextX;
      }
    }

    // Vertical step
    const nextY = this.y + this.vy * dt;
    const leftX = Math.floor((this.x - hw + 2) / TILE_SIZE);
    const rightX = Math.floor((this.x + hw - 2) / TILE_SIZE);
    this.onGround = false;

    if (this.vy >= 0) {
      const footTile = Math.floor((nextY + hh) / TILE_SIZE);
      const prevFootTile = Math.floor((this.y + hh - 1) / TILE_SIZE);
      let hitGround = false;
      let touchDmg = 0;

      for (let tx = leftX; tx <= rightX; tx++) {
        const tid = world.getTile(tx, footTile);
        if (TILE_DEFS[tid]?.damageOnTouch) {
          touchDmg = Math.max(touchDmg, TILE_DEFS[tid].damageOnTouch!);
        }
        if (world.isSolid(tx, footTile)) {
          hitGround = true;
          break;
        }
        if (
          !dropThroughPlatform &&
          world.isPlatform(tx, footTile) &&
          prevFootTile < footTile
        ) {
          hitGround = true;
          break;
        }
      }

      if (hitGround) {
        // Fall damage if no wings and fell > 26 tiles
        const fallTiles = (footTile * TILE_SIZE - hh - this.fallStartY) / TILE_SIZE;
        if (fallTiles > 26 && this.maxFlightTime <= 0) {
          const fallDmg = Math.floor((fallTiles - 26) * 8);
          this.takeDamage(fallDmg, 0, audio, particles, world);
        }
        if (touchDmg > 0 && !this.hasLavaImmunity()) {
          this.takeDamage(touchDmg, -this.facing, audio, particles, world);
        }

        this.y = footTile * TILE_SIZE - hh - 0.01;
        this.vy = 0;
        this.onGround = true;
        this.fallStartY = this.y;
      } else {
        this.y = nextY;
        if (this.vy < 0) this.fallStartY = this.y;
      }
    } else {
      this.fallStartY = this.y;
      const headTile = Math.floor((nextY - hh) / TILE_SIZE);
      let hitCeiling = false;
      for (let tx = leftX; tx <= rightX; tx++) {
        if (world.isSolid(tx, headTile)) {
          hitCeiling = true;
          break;
        }
      }
      if (hitCeiling) {
        this.y = (headTile + 1) * TILE_SIZE + hh + 0.01;
        this.vy = 0;
      } else {
        this.y = nextY;
      }
    }
  }

  getMountName(): string {
    switch (this.mountType) {
      case 'ufo':
        return 'Cosmic UFO Saucer';
      case 'fishron':
        return 'Cute Fishron Mount';
      case 'dragon':
        return 'Celestial Solar Dragon';
      case 'airship':
        return 'Flying Dutchman Airship';
    }
  }

  getMeleeHitbox(): Rect | null {
    const held = this.getHeldItem();
    if (!held || this.swingTimer <= 0 || (!held.damage && held.category !== 'melee')) {
      return null;
    }
    const reach = held.range || 38;
    return {
      x: this.facing > 0 ? this.x - 6 : this.x - reach,
      y: this.y - reach * 0.75,
      w: reach + 6,
      h: reach * 1.45
    };
  }

  render(ctx: CanvasRenderingContext2D, camX: number, camY: number, atlas: SpriteAtlas): void {
    if (this.dead) return;

    const bob = this.mounted ? Math.sin(this.mountHoverPhase) * 2.5 : 0;
    const sx = Math.floor(this.x - camX);
    const sy = Math.floor(this.y - camY + bob);

    // Grapple chain & claw
    if (this.grapple.active) {
      const gx = this.grapple.x - camX;
      const gy = this.grapple.y - camY;
      ctx.strokeStyle = '#9aa4b2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(gx, gy);
      ctx.stroke();
      ctx.fillStyle = '#dce6f2';
      ctx.fillRect(gx - 3, gy - 3, 6, 6);
    }

    ctx.save();
    if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.55;
    }

    // Back Mount Layer (Wings / Dragon / Fishron / Airship Hull behind player)
    if (this.mounted) {
      const flap = Math.sin(this.mountHoverPhase * 3.2) * 7;
      if (this.mountType === 'fishron') {
        ctx.fillStyle = 'rgba(190, 240, 255, 0.85)';
        ctx.beginPath();
        ctx.moveTo(sx - this.facing * 4, sy + 2);
        ctx.lineTo(sx - this.facing * 22, sy - 10 + flap);
        ctx.lineTo(sx - this.facing * 16, sy + 8 + flap * 0.5);
        ctx.closePath();
        ctx.fill();
      } else if (this.mountType === 'dragon') {
        ctx.fillStyle = '#ff771c';
        ctx.beginPath();
        ctx.moveTo(sx - this.facing * 4, sy);
        ctx.lineTo(sx - this.facing * 26, sy - 14 + flap);
        ctx.lineTo(sx - this.facing * 18, sy + 9 + flap * 0.5);
        ctx.closePath();
        ctx.fill();
      } else if (this.mountType === 'airship') {
        // Golden mast & sail behind player
        ctx.fillStyle = '#6e431f';
        ctx.fillRect(sx - 1, sy - 22, 3, 28);
        ctx.fillStyle = 'rgba(255, 235, 160, 0.85)';
        ctx.fillRect(sx - 10, sy - 20, 20, 12);
      } else if (this.mountType === 'ufo') {
        // Translucent Martian glass dome around upper torso
        ctx.fillStyle = 'rgba(130, 245, 255, 0.32)';
        ctx.beginPath();
        ctx.arc(sx, sy + 2, 14, Math.PI, 0);
        ctx.fill();
      }
    } else if (this.maxFlightTime > 0) {
      const wingColor = this.accessories.some((a) => a?.id === 'solar_wings')
        ? '#ff771c'
        : '#d8f0ff';
      const flap = this.onGround ? 0 : Math.sin(performance.now() * 0.025) * 6;
      ctx.fillStyle = wingColor;
      ctx.beginPath();
      ctx.moveTo(sx - this.facing * 2, sy - 2);
      ctx.lineTo(sx - this.facing * 16, sy - 12 + flap);
      ctx.lineTo(sx - this.facing * 13, sy + 6 + flap * 0.5);
      ctx.closePath();
      ctx.fill();
    }

    const legOffset = this.mounted ? 0 : Math.sin(this.walkAnimTime * 10) * 3;
    const headDef = this.armor.head ? ITEMS[this.armor.head.id] : null;
    const chestDef = this.armor.chest ? ITEMS[this.armor.chest.id] : null;
    const legsDef = this.armor.legs ? ITEMS[this.armor.legs.id] : null;

    // Legs
    ctx.fillStyle = legsDef ? legsDef.color : '#2e4975';
    ctx.fillRect(sx - 4 + legOffset, sy + 5, 4, 8);
    ctx.fillRect(sx - legOffset, sy + 5, 4, 8);

    // Torso / Chestplate
    ctx.fillStyle = chestDef ? chestDef.color : '#b8352c';
    ctx.fillRect(sx - 5, sy - 4, 10, 10);
    if (chestDef?.accentColor) {
      ctx.fillStyle = chestDef.accentColor;
      ctx.fillRect(sx - 3, sy - 2, 6, 4);
    }

    // Head & Hair / Helmet
    ctx.fillStyle = '#f5c296';
    ctx.fillRect(sx - 5, sy - 13, 10, 9);
    // Eye
    ctx.fillStyle = '#1b1e26';
    ctx.fillRect(this.facing > 0 ? sx + 2 : sx - 4, sy - 10, 2, 2);

    if (headDef) {
      ctx.fillStyle = headDef.color;
      ctx.fillRect(sx - 6, sy - 14, 12, 6);
      if (headDef.accentColor) {
        ctx.fillStyle = headDef.accentColor;
        ctx.fillRect(sx - 4, sy - 15, 8, 2);
      }
    } else {
      // Classic Terraria brown spiky hair
      ctx.fillStyle = '#6e4224';
      ctx.fillRect(sx - 6, sy - 14, 12, 4);
      ctx.fillRect(this.facing > 0 ? sx - 6 : sx + 3, sy - 10, 3, 4);
    }

    // Foreground Mount Layer (UFO Saucer Rim / Fishron Body / Dragon Body / Airship Deck)
    if (this.mounted) {
      if (this.mountType === 'ufo') {
        // Metallic Martian UFO Saucer
        ctx.fillStyle = '#7e8fa6';
        ctx.fillRect(sx - 18, sy + 4, 36, 7);
        ctx.fillStyle = '#b8cad9';
        ctx.fillRect(sx - 14, sy + 2, 28, 3);
        // Glowing neon lights along saucer rim
        const pulse = Math.floor(performance.now() * 0.01) % 2 === 0;
        ctx.fillStyle = pulse ? '#3be8d1' : '#ffd747';
        ctx.fillRect(sx - 14, sy + 6, 4, 3);
        ctx.fillRect(sx - 2, sy + 6, 4, 3);
        ctx.fillRect(sx + 10, sy + 6, 4, 3);
        // Bottom anti-gravity beam glow
        ctx.fillStyle = 'rgba(59, 232, 209, 0.55)';
        ctx.fillRect(sx - 9, sy + 11, 18, 4);
      } else if (this.mountType === 'fishron') {
        ctx.fillStyle = '#1cb89c';
        ctx.fillRect(sx - 16, sy + 4, 32, 9);
        ctx.fillStyle = '#ff59b8';
        ctx.fillRect(sx + this.facing * 10, sy + 2, 7, 5);
        ctx.fillStyle = '#ffee38';
        ctx.fillRect(sx + this.facing * 12, sy + 4, 3, 3);
      } else if (this.mountType === 'dragon') {
        ctx.fillStyle = '#d94814';
        ctx.fillRect(sx - 18, sy + 4, 36, 8);
        ctx.fillStyle = '#ffee55';
        ctx.fillRect(sx - 12, sy + 6, 24, 4);
        ctx.fillRect(sx + this.facing * 14, sy + 1, 8, 7);
      } else if (this.mountType === 'airship') {
        ctx.fillStyle = '#8c5425';
        ctx.fillRect(sx - 19, sy + 4, 38, 9);
        ctx.fillStyle = '#ffd747';
        ctx.fillRect(sx - 20, sy + 4, 40, 2);
        ctx.fillRect(sx - 12, sy + 8, 24, 2);
      }
    }

    // Swinging Held Weapon / Tool
    if (this.swingTimer > 0) {
      const held = this.getHeldItem();
      if (held) {
        const prog = 1 - this.swingTimer / Math.max(0.05, this.swingDuration);
        const startA = this.facing > 0 ? -Math.PI * 0.65 : -Math.PI * 0.35;
        const endA = this.facing > 0 ? Math.PI * 0.35 : -Math.PI * 1.35;
        const angle = startA + (endA - startA) * prog;
        const icon = atlas.getItemIcon(held);
        const scale = held.range ? held.range / 28 : 1.0;

        ctx.save();
        ctx.translate(sx + this.facing * 4, sy - 1);
        ctx.rotate(angle);
        ctx.drawImage(icon, 0, -22 * scale, 24 * scale, 24 * scale);
        ctx.restore();
      }
    }

    ctx.restore();
  }
}
