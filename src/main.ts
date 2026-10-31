import { TILE_SIZE, clamp, lerp, pointInRect } from './core/math';
import { InputManager } from './core/input';
import { AudioManager, MusicTrack } from './core/audio';
import { ParticleSystem } from './core/particles';
import { SpriteAtlas } from './assets/sprites';
import { World } from './world/world';
import { generateWorld } from './world/worldgen';
import { Player } from './entities/player';
import { ProjectileManager } from './entities/projectiles';
import { EnemyManager } from './entities/enemies';
import { NPCManager } from './entities/npcs';
import { BossManager } from './entities/bosses';
import { HUD } from './ui/hud';
import { ITEMS } from './items/items';

const SAVE_KEY = 'terraria_ts_save_v1';

class TerrariaGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private input: InputManager;
  private audio: AudioManager;
  private particles: ParticleSystem;
  private atlas: SpriteAtlas;

  private world!: World;
  private player!: Player;
  private projectiles!: ProjectileManager;
  private enemies!: EnemyManager;
  private npcs!: NPCManager;
  private bosses!: BossManager;
  private hud!: HUD;

  private state: 'menu' | 'playing' = 'menu';
  private zoom = 1.75;
  private camX = 0;
  private camY = 0;
  private lastTime = performance.now();

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.input = new InputManager(this.canvas);
    this.audio = new AudioManager();
    this.particles = new ParticleSystem();
    this.atlas = new SpriteAtlas();

    this.initNewWorld(1337);

    requestAnimationFrame((t) => this.loop(t));
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private initNewWorld(seed: number): void {
    this.world = generateWorld(seed);
    this.player = new Player(this.world.spawnX, this.world.spawnY);
    this.projectiles = new ProjectileManager();
    this.enemies = new EnemyManager();
    this.npcs = new NPCManager();
    this.npcs.initNPCs(this.world);
    this.bosses = new BossManager();
    this.hud = new HUD();

    this.camX = this.player.x - this.canvas.width / (2 * this.zoom);
    this.camY = this.player.y - this.canvas.height / (2 * this.zoom);

    this.hud.addChat('Welcome to Terraria! Right-click the Guide or press [K] for all 14 Bosses!', '#66ff8c');
  }

  private saveGame(): void {
    try {
      const payload = {
        tiles: Array.from(this.world.tiles),
        walls: Array.from(this.world.walls),
        surfaceY: Array.from(this.world.surfaceY),
        spawnX: this.world.spawnX,
        spawnY: this.world.spawnY,
        dungeonX: this.world.dungeonX,
        dungeonY: this.world.dungeonY,
        templeX: this.world.templeX,
        templeY: this.world.templeY,
        timeOfDay: this.world.timeOfDay,
        dayCount: this.world.dayCount,
        hardmode: this.world.hardmode,
        defeatedBosses: Array.from(this.world.defeatedBosses),
        player: {
          x: this.player.x,
          y: this.player.y,
          hp: this.player.hp,
          maxHp: this.player.maxHp,
          mana: this.player.mana,
          maxMana: this.player.maxMana,
          coins: this.player.coins,
          inventory: this.player.inventory,
          armor: this.player.armor,
          accessories: this.player.accessories
        }
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      this.hud.addChat('World & Character saved to browser storage!', '#5ce1ff');
    } catch {
      this.hud.addChat('Could not save world (storage quota).', '#ff6666');
    }
  }

  private loadGame(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      this.initNewWorld(1337);
      this.world.tiles.set(data.tiles);
      this.world.walls.set(data.walls);
      this.world.surfaceY.set(data.surfaceY);
      this.world.spawnX = data.spawnX;
      this.world.spawnY = data.spawnY;
      this.world.dungeonX = data.dungeonX;
      this.world.dungeonY = data.dungeonY;
      this.world.templeX = data.templeX;
      this.world.templeY = data.templeY;
      this.world.timeOfDay = data.timeOfDay;
      this.world.dayCount = data.dayCount;
      this.world.hardmode = data.hardmode;
      this.world.defeatedBosses = new Set(data.defeatedBosses || []);

      if (data.player) {
        this.player.x = data.player.x;
        this.player.y = data.player.y;
        this.player.hp = data.player.hp;
        this.player.maxHp = data.player.maxHp;
        this.player.mana = data.player.mana;
        this.player.maxMana = data.player.maxMana;
        this.player.coins = data.player.coins;
        this.player.inventory = data.player.inventory;
        this.player.armor = data.player.armor;
        this.player.accessories = data.player.accessories;
      }
      this.hud.addChat('Loaded saved World & Character!', '#5ce1ff');
      return true;
    } catch {
      return false;
    }
  }

  private loop(now: number): void {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.state === 'menu') {
      this.updateAndRenderMenu(dt);
    } else {
      this.updateGame(dt);
      this.renderGame();
    }

    this.input.endFrame();
    requestAnimationFrame((t) => this.loop(t));
  }

  private updateAndRenderMenu(dt: number): void {
    this.world.timeOfDay = (this.world.timeOfDay + dt * 15) % 1440;
    const sw = this.canvas.width;
    const sh = this.canvas.height;

    const viewW = sw / this.zoom;
    const viewH = sh / this.zoom;
    this.camX = this.world.spawnX - viewW / 2 + Math.sin(performance.now() * 0.0003) * 140;
    this.camY = this.world.spawnY - viewH / 2 - 20;

    this.ctx.save();
    this.ctx.scale(this.zoom, this.zoom);
    this.world.render(this.ctx, this.camX, this.camY, sw, sh, this.zoom, this.atlas, 'forest');
    this.ctx.restore();

    // Darken backdrop slightly
    this.ctx.fillStyle = 'rgba(8, 12, 24, 0.55)';
    this.ctx.fillRect(0, 0, sw, sh);

    // Title Banner
    const cx = Math.floor(sw / 2);
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 54px monospace';
    this.ctx.fillStyle = '#1b2618';
    this.ctx.fillText('TERRARIA', cx + 4, 154);
    this.ctx.fillStyle = '#4de868';
    this.ctx.fillText('TERRARIA', cx, 150);

    this.ctx.font = 'bold 16px monospace';
    this.ctx.fillStyle = '#ffd747';
    this.ctx.fillText(
      'COMPLETE TYPESCRIPT & HTML5 CANVAS EDITION — ALL 14 PRE-HARDMODE & HARDMODE BOSSES',
      cx,
      188
    );

    const hasSave = !!localStorage.getItem(SAVE_KEY);
    const buttons = [
      {
        label: 'New World (Survival Mode)',
        y: 250,
        color: '#28593a',
        border: '#5ce68c',
        action: () => {
          this.initNewWorld(Math.floor(Math.random() * 999999));
          this.state = 'playing';
          this.audio.play('craft');
        }
      },
      {
        label: 'New World + Open 14-Boss Arena & Loadout Selector',
        y: 315,
        color: '#4c266b',
        border: '#d28cff',
        action: () => {
          this.initNewWorld(Math.floor(Math.random() * 999999));
          this.hud.bossMenuOpen = true;
          this.state = 'playing';
          this.audio.play('craft');
        }
      },
      {
        label: hasSave ? 'Continue Saved World' : 'No Saved World Yet',
        y: 380,
        color: hasSave ? '#24476b' : '#282d38',
        border: hasSave ? '#6bb5ff' : '#555d6e',
        action: () => {
          if (hasSave && this.loadGame()) {
            this.state = 'playing';
            this.audio.play('craft');
          }
        }
      }
    ];

    const mx = this.input.mouseX;
    const my = this.input.mouseY;

    for (const b of buttons) {
      const bw = 460;
      const bh = 48;
      const bx = cx - bw / 2;
      const hovered = pointInRect(mx, my, { x: bx, y: b.y, w: bw, h: bh });

      this.ctx.fillStyle = hovered ? '#3a6ea5' : b.color;
      this.ctx.fillRect(bx, b.y, bw, bh);
      this.ctx.strokeStyle = hovered ? '#ffd747' : b.border;
      this.ctx.lineWidth = 2.5;
      this.ctx.strokeRect(bx, b.y, bw, bh);

      this.ctx.font = 'bold 15px monospace';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(b.label, cx, b.y + 30);

      if (hovered && this.input.mouseLeftJustPressed) {
        b.action();
      }
    }

    // Feature highlights box
    this.ctx.font = '13px monospace';
    this.ctx.fillStyle = '#dce8ff';
    this.ctx.fillText(
      'Biomes: Forest • Desert • Snow • Corruption • Jungle • Dungeon • Floating Islands • Lihzahrd Temple • Underworld • Hallow',
      cx,
      475
    );
    this.ctx.fillStyle = '#ff96ff';
    this.ctx.fillText(
      'Bosses: King Slime • Eye of Cthulhu • Eater of Worlds • Queen Bee • Skeletron • Wall of Flesh • The Twins • Destroyer • Skeletron Prime • Plantera • Golem • Duke Fishron • Lunatic Cultist • Moon Lord',
      cx,
      500
    );

    this.ctx.textAlign = 'left';
  }

  private updateGame(dt: number): void {
    // Advance Day/Night cycle (1 full day = 12 real minutes)
    const prevDay = this.world.isDaytime();
    this.world.timeOfDay += dt * 2.0;
    if (this.world.timeOfDay >= 1440) {
      this.world.timeOfDay -= 1440;
      this.world.dayCount++;
    }
    const nowDay = this.world.isDaytime();
    if (!prevDay && nowDay) {
      this.hud.addChat(`Day ${this.world.dayCount} has dawned!`, '#ffeb57');
    } else if (prevDay && !nowDay) {
      this.hud.addChat('Night has fallen... Watch out for creatures of the dark!', '#ff9696');
      // Spawn Fallen Stars occasionally at night
      for (let s = 0; s < 3; s++) {
        const sx = Math.floor(40 + Math.random() * (this.world.width - 80));
        this.world.spawnDrop(sx * TILE_SIZE, (this.world.surfaceY[sx] - 4) * TILE_SIZE, 'fallen_star', 1);
      }
    }

    if (this.input.wasPressed('F5')) {
      this.saveGame();
    }

    // Zoom controls (- / +)
    if (this.input.wasPressed('Equal')) this.zoom = clamp(this.zoom + 0.25, 1.0, 3.0);
    if (this.input.wasPressed('Minus')) this.zoom = clamp(this.zoom - 0.25, 1.0, 3.0);

    const viewW = this.canvas.width / this.zoom;
    const viewH = this.canvas.height / this.zoom;
    this.input.updateWorldMouse(this.camX, this.camY, this.zoom);

    const summonCallback = (bossId: string, sx?: number, sy?: number) => {
      this.bosses.summon(
        bossId,
        this.player,
        this.audio,
        (msg, col) => this.hud.addChat(msg, col),
        sx,
        sy
      );
    };

    const uiBlocking = this.hud.update(
      dt,
      this.input,
      this.world,
      this.player,
      this.bosses,
      this.audio,
      (id) => summonCallback(id),
      () => this.saveGame()
    );

    // Right-click Town NPC interaction
    if (!uiBlocking && this.input.mouseRightJustPressed) {
      const clickedNPC = this.npcs.findClickedNPC(
        this.input.worldMouseX,
        this.input.worldMouseY,
        this.player.x,
        this.player.y
      );
      if (clickedNPC) {
        this.hud.activeNPC = clickedNPC;
        this.hud.dialogueIndex = 0;
        this.audio.play('menu');
      }
    }

    this.player.update(
      dt,
      this.input,
      this.world,
      this.audio,
      this.particles,
      this.projectiles,
      uiBlocking,
      summonCallback,
      (cx, cy) => {
        this.hud.openChestCoords = { x: cx, y: cy };
        this.hud.inventoryOpen = true;
      },
      (msg, col) => this.hud.addChat(msg, col)
    );

    const ptx = Math.floor(this.player.x / TILE_SIZE);
    const pty = Math.floor(this.player.y / TILE_SIZE);
    const biome = this.world.getBiomeAt(ptx, pty);

    // Build list of homing targets (enemies + active boss parts)
    const homingTargets: { x: number; y: number; alive: boolean }[] = [];
    for (const e of this.enemies.enemies) {
      homingTargets.push({ x: e.x, y: e.y, alive: e.hp > 0 });
    }
    if (this.bosses.activeBoss) {
      for (const bp of this.bosses.activeBoss.parts) {
        if (!bp.invulnerable && bp.hp > 0) {
          homingTargets.push({ x: bp.x, y: bp.y, alive: true });
        }
      }
    }

    this.projectiles.update(dt, this.world, this.particles, homingTargets, this.player);
    this.enemies.update(
      dt,
      this.world,
      this.player,
      this.projectiles,
      this.audio,
      this.particles,
      biome,
      !!this.bosses.activeBoss
    );
    this.npcs.update(dt, this.world);
    this.bosses.update(
      dt,
      this.world,
      this.player,
      this.projectiles,
      this.enemies,
      this.audio,
      this.particles,
      (msg, col) => this.hud.addChat(msg, col)
    );
    this.world.updateDrops(dt);
    this.particles.update(dt);

    // Camera follow
    const targetCamX = clamp(
      this.player.x - viewW * 0.5,
      0,
      this.world.width * TILE_SIZE - viewW
    );
    const targetCamY = clamp(
      this.player.y - viewH * 0.5,
      0,
      this.world.height * TILE_SIZE - viewH
    );
    this.camX = lerp(this.camX, targetCamX, Math.min(1, dt * 10));
    this.camY = lerp(this.camY, targetCamY, Math.min(1, dt * 10));

    // Update World Liquids & Lighting in Active Viewport
    const camTileX = Math.floor(this.camX / TILE_SIZE);
    const camTileY = Math.floor(this.camY / TILE_SIZE);
    const viewTilesW = Math.ceil(viewW / TILE_SIZE);
    const viewTilesH = Math.ceil(viewH / TILE_SIZE);

    this.world.updateLiquids(camTileX, camTileY, viewTilesW, viewTilesH);
    const heldId = this.player.getHeldItem()?.id;
    const holdingLight =
      heldId === 'torch' ||
      heldId === 'fiery_greatsword' ||
      heldId === 'solar_eruption' ||
      heldId === 'nights_edge';
    this.world.updateLighting(
      camTileX,
      camTileY,
      viewTilesW,
      viewTilesH,
      ptx,
      pty,
      holdingLight
    );

    // Dynamic Biome / Boss Music
    let track: MusicTrack = 'day';
    if (this.bosses.activeBoss) {
      if (this.bosses.activeBoss.type === 'moon_lord') track = 'moonlord';
      else if (this.bosses.activeBoss.isHardmode) track = 'boss2';
      else track = 'boss1';
    } else if (biome === 'underworld') track = 'underworld';
    else if (biome === 'corruption') track = 'corruption';
    else if (biome === 'hallow') track = 'hallow';
    else if (biome === 'jungle') track = 'jungle';
    else if (biome === 'underground' || biome === 'dungeon') track = 'underground';
    else if (!this.world.isDaytime()) track = 'night';

    this.audio.updateMusic(dt, track);

    //Enemy projectile hits against Player
    for (let i = this.projectiles.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles.projectiles[i];
      if (p.friendly) continue;
      const pb = this.player.getBounds();
      if (
        p.x + p.radius > pb.x &&
        p.x - p.radius < pb.x + pb.w &&
        p.y + p.radius > pb.y &&
        p.y - p.radius < pb.y + pb.h
      ) {
        this.player.takeDamage(
          p.damage,
          Math.sign(p.vx) || 1,
          this.audio,
          this.particles,
          this.world
        );
        this.projectiles.projectiles.splice(i, 1);
      }
    }
  }

  private renderGame(): void {
    const sw = this.canvas.width;
    const sh = this.canvas.height;
    const ptx = Math.floor(this.player.x / TILE_SIZE);
    const pty = Math.floor(this.player.y / TILE_SIZE);
    const biome = this.world.getBiomeAt(ptx, pty);

    this.ctx.save();
    this.ctx.scale(this.zoom, this.zoom);

    this.world.render(this.ctx, this.camX, this.camY, sw, sh, this.zoom, this.atlas, biome);
    this.npcs.render(this.ctx, this.camX, this.camY);
    this.enemies.render(this.ctx, this.camX, this.camY);
    this.bosses.render(this.ctx, this.camX, this.camY, this.player);
    this.player.render(this.ctx, this.camX, this.camY, this.atlas);
    this.projectiles.render(this.ctx, this.camX, this.camY);
    this.particles.render(this.ctx, this.camX, this.camY);

    // Tile selection cursor highlight when holding a tool or block
    const held = this.player.getHeldItem();
    if (
      held &&
      (held.category === 'tool' || held.placeTile !== undefined || held.placeWall !== undefined)
    ) {
      const hx = this.input.tileMouseX * TILE_SIZE - this.camX;
      const hy = this.input.tileMouseY * TILE_SIZE - this.camY;
      this.ctx.strokeStyle = 'rgba(255, 235, 87, 0.65)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(hx, hy, TILE_SIZE, TILE_SIZE);
    }

    this.ctx.restore();

    // Death Banner
    if (this.player.dead) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      this.ctx.fillRect(0, 0, sw, sh);
      this.ctx.font = 'bold 36px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#ff384c';
      this.ctx.fillText('YOU WERE SLAIN...', sw / 2, sh / 2 - 10);
      this.ctx.font = 'bold 16px monospace';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(
        `Respawning in ${Math.ceil(this.player.respawnTimer)}s`,
        sw / 2,
        sh / 2 + 24
      );
      this.ctx.textAlign = 'left';
    }

    // Render HUD at native screen resolution
    this.hud.render(
      this.ctx,
      this.world,
      this.player,
      this.bosses,
      this.input,
      this.atlas,
      biome
    );
    void ITEMS;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new TerrariaGame();
});
