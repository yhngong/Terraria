import { TILE_SIZE, clamp, lerp, pointInRect } from './core/math';
import { InputManager } from './core/input';
import { AudioManager, MusicTrack } from './core/audio';
import { ParticleSystem } from './core/particles';
import { SpriteAtlas } from './assets/sprites';
import { World } from './world/world';
import { generateWorld, generateArenaWorld } from './world/worldgen';
import { Player } from './entities/player';
import { ProjectileManager } from './entities/projectiles';
import { EnemyManager } from './entities/enemies';
import { BossManager, BOSS_CATALOG } from './entities/bosses';
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
  private bosses!: BossManager;
  private hud!: HUD;

  private state: 'menu' | 'playing' = 'menu';
  private zoom = 1.45;
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

    this.initNewWorld(1337, 'arena');

    requestAnimationFrame((t) => this.loop(t));
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private initNewWorld(seed: number, mode: 'arena' | 'survival' = 'arena'): void {
    this.world = mode === 'arena' ? generateArenaWorld() : generateWorld(seed);
    this.player = new Player(this.world.spawnX, this.world.spawnY, mode);
    this.player.mounted = mode === 'arena';
    this.projectiles = new ProjectileManager();
    this.enemies = new EnemyManager();
    this.enemies.allowNaturalSpawns = mode === 'survival';
    this.bosses = new BossManager();
    this.hud = new HUD();
    this.hud.isArenaMode = mode === 'arena';

    this.camX = this.player.x - this.canvas.width / (2 * this.zoom);
    this.camY = this.player.y - this.canvas.height / (2 * this.zoom);

    if (mode === 'survival') {
      this.hud.addChat(
        'Classic Survival World generated! Starting with Bronze Gear (Sword, Bow, Pickaxe, Axe & Bronze Armor)!',
        '#f2b068'
      );
    } else {
      this.hud.addChat(
        'FLYING MOUNT ACTIVE! [WASD] 360° Flight, [Shift] Sonic Turbo Dash, [F] Switch Mount! Gear auto-upgrades as you beat Boss Rush waves!',
        '#3be8d1'
      );
    }
  }

  private saveGame(): void {
    try {
      const payload = {
        isArena: this.hud.isArenaMode,
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
      this.initNewWorld(1337, data.isArena === false ? 'survival' : 'arena');
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
    this.input.controlsEnabled = this.state === 'playing';

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
    const t = performance.now() * 0.001;

    const viewW = sw / this.zoom;
    const viewH = sh / this.zoom;
    this.camX = this.world.spawnX - viewW / 2 + Math.sin(t * 0.35) * 160;
    this.camY = this.world.spawnY - viewH / 2 - 30;

    this.ctx.save();
    this.ctx.scale(this.zoom, this.zoom);
    this.world.render(this.ctx, this.camX, this.camY, sw, sh, this.zoom, this.atlas, 'forest');
    this.ctx.restore();

    // Cinematic dark gradient backdrop
    const grad = this.ctx.createRadialGradient(sw / 2, sh / 2, 80, sw / 2, sh / 2, Math.max(sw, sh) * 0.7);
    grad.addColorStop(0, 'rgba(10, 14, 30, 0.5)');
    grad.addColorStop(1, 'rgba(4, 6, 16, 0.88)');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, sw, sh);

    const cx = Math.floor(sw / 2);

    // Orbiting energy blades in the background of the title
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';
    const colors = ['#3be8d1', '#ff2975', '#ffd747', '#a8ff38', '#9d4edd', '#ff7b24'];
    for (let i = 0; i < 6; i++) {
      const ang = t * 1.8 + (i * Math.PI * 2) / 6;
      const ox = cx + Math.cos(ang) * 280;
      const oy = 140 + Math.sin(ang * 2) * 36;
      this.ctx.save();
      this.ctx.translate(ox, oy);
      this.ctx.rotate(ang + Math.PI / 4);
      this.ctx.fillStyle = colors[i];
      this.ctx.beginPath();
      this.ctx.moveTo(22, 0);
      this.ctx.lineTo(-10, -6);
      this.ctx.lineTo(-16, 0);
      this.ctx.lineTo(-10, 6);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
    }
    this.ctx.restore();

    // Title Banner with Neon Glow
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 62px monospace';
    this.ctx.fillStyle = '#091f15';
    this.ctx.fillText('TERRARIA: BOSS RUSH', cx + 4, 144);
    this.ctx.fillStyle = '#3be8d1';
    this.ctx.fillText('TERRARIA: BOSS RUSH', cx, 140);

    this.ctx.font = 'bold 16px monospace';
    this.ctx.fillStyle = '#ffd747';
    this.ctx.fillText(
      `⚡ GRAND COLOSSEUM ARENA • ${BOSS_CATALOG.length} BOSS GAUNTLET • CALAMITY MOD • 360° FLYING MOUNTS ⚡`,
      cx,
      182
    );

    const hasSave = !!localStorage.getItem(SAVE_KEY);
    const buttons = [
      {
        label: `⚔️ START ${BOSS_CATALOG.length}-BOSS RUSH GAUNTLET (Vanilla + Calamity Mod!)`,
        y: 225,
        color: '#6b1236',
        border: '#ff3875',
        action: () => {
          this.initNewWorld(1337, 'arena');
          this.state = 'playing';
          this.bosses.startBossRush(this.player, this.audio, (m, c) => this.hud.addChat(m, c));
        }
      },
      {
        label: `🛸 OPEN ARENA SANDBOX (Free Flight + Summon Any of ${BOSS_CATALOG.length} Bosses)`,
        y: 285,
        color: '#3c1e6e',
        border: '#c77dff',
        action: () => {
          this.initNewWorld(1337, 'arena');
          this.hud.bossMenuOpen = true;
          this.state = 'playing';
          this.audio.play('craft');
        }
      },
      {
        label: '🌲 CLASSIC SURVIVAL WORLD (Procedural Biomes, Mining & Crafting)',
        y: 345,
        color: '#1b4d3e',
        border: '#3be8d1',
        action: () => {
          this.initNewWorld(Math.floor(Math.random() * 999999), 'survival');
          this.state = 'playing';
          this.audio.play('craft');
        }
      },
      {
        label: hasSave ? '💾 CONTINUE SAVED WORLD' : 'NO SAVED WORLD YET',
        y: 405,
        color: hasSave ? '#1d3c6b' : '#222634',
        border: hasSave ? '#5ce1ff' : '#4a5268',
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
      const bw = Math.min(580, sw - 28);
      const bh = 48;
      const bx = cx - bw / 2;
      const hovered = pointInRect(mx, my, { x: bx, y: b.y, w: bw, h: bh });

      this.ctx.fillStyle = hovered ? '#2c6eb5' : b.color;
      this.ctx.fillRect(bx, b.y, bw, bh);
      this.ctx.strokeStyle = hovered ? '#ffd747' : b.border;
      this.ctx.lineWidth = hovered ? 3 : 2;
      this.ctx.strokeRect(bx, b.y, bw, bh);

      this.ctx.font = 'bold 15px monospace';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(b.label, cx, b.y + 30);

      if (hovered && this.input.mouseLeftJustPressed) {
        b.action();
      }
    }

    // Loadout & Controls Showcase
    this.ctx.font = 'bold 13px monospace';
    this.ctx.fillStyle = '#3be8d1';
    this.ctx.fillText(
      'PROGRESSION: Pre-HM -> Hardmode -> Moon Lord (Zenith) -> Calamity Mod (Auric Tesla, Demonshade & Ark of the Cosmos)!',
      cx,
      478
    );
    this.ctx.fillStyle = '#ff96ff';
    this.ctx.fillText(
      `ALL ${BOSS_CATALOG.length} BOSSES: 14 Vanilla Bosses (King Slime -> Moon Lord) + 4 Calamity Bosses (Providence • Devourer of Gods • Yharon • Supreme Calamitas)`,
      cx,
      504
    );

    this.ctx.textAlign = 'left';
  }

  private updateGame(dt: number): void {
    // Advance Day/Night cycle
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
      this.hud.addChat('Blood & Starlight fill the Colosseum sky...', '#ff9696');
    }

    if (this.input.wasPressed('F5')) {
      this.saveGame();
    }

    // Zoom controls (- / +)
    if (this.input.wasPressed('Equal')) this.zoom = clamp(this.zoom + 0.2, 0.9, 2.8);
    if (this.input.wasPressed('Minus')) this.zoom = clamp(this.zoom - 0.2, 0.9, 2.8);

    const viewW = this.canvas.width / this.zoom;
    const viewH = this.canvas.height / this.zoom;
    this.input.updateWorldMouse(this.camX, this.camY, this.zoom);

    // Mobile Attack Button Auto-Aim / Directional Aim
    if (this.input.mobileAttackHeld || this.input.mobileAttackJustPressed) {
      if (this.input.attackAimActive) {
        this.input.worldMouseX = this.player.x + Math.cos(this.input.attackAimAngle) * 180;
        this.input.worldMouseY = this.player.y + Math.sin(this.input.attackAimAngle) * 180;
      } else {
        // Auto-aim at nearest vulnerable boss part or enemy, or fallback to joystick/facing direction
        let bestX = this.player.x + this.player.facing * 160;
        let bestY = this.player.y;
        let bestDist = Infinity;

        if (this.bosses.activeBoss) {
          for (const bp of this.bosses.activeBoss.parts) {
            if (!bp.invulnerable && bp.hp > 0) {
              const d = Math.hypot(bp.x - this.player.x, bp.y - this.player.y);
              if (d < bestDist) {
                bestDist = d;
                bestX = bp.x;
                bestY = bp.y;
              }
            }
          }
        }
        if (bestDist === Infinity) {
          for (const e of this.enemies.enemies) {
            if (e.hp > 0) {
              const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
              if (d < bestDist) {
                bestDist = d;
                bestX = e.x;
                bestY = e.y;
              }
            }
          }
        }
        if (bestDist === Infinity && this.input.joyActive && (Math.abs(this.input.joyX) > 0.15 || Math.abs(this.input.joyY) > 0.15)) {
          bestX = this.player.x + this.input.joyX * 160;
          bestY = this.player.y + this.input.joyY * 160;
        }
        this.input.worldMouseX = bestX;
        this.input.worldMouseY = bestY;
      }
      this.input.tileMouseX = Math.floor(this.input.worldMouseX / TILE_SIZE);
      this.input.tileMouseY = Math.floor(this.input.worldMouseY / TILE_SIZE);
    }

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

    // Dynamic Camera follow with subtle mouse-look lead
    const mouseLeadX = ((this.input.mouseX - this.canvas.width * 0.5) / this.zoom) * 0.14;
    const mouseLeadY = ((this.input.mouseY - this.canvas.height * 0.5) / this.zoom) * 0.14;
    const targetCamX = clamp(
      this.player.x + mouseLeadX - viewW * 0.5,
      0,
      this.world.width * TILE_SIZE - viewW
    );
    const targetCamY = clamp(
      this.player.y + mouseLeadY - viewH * 0.5,
      0,
      this.world.height * TILE_SIZE - viewH
    );
    this.camX = lerp(this.camX, targetCamX, Math.min(1, dt * 11));
    this.camY = lerp(this.camY, targetCamY, Math.min(1, dt * 11));

    // Update World Liquids & Lighting in Active Viewport
    const camTileX = Math.floor(this.camX / TILE_SIZE);
    const camTileY = Math.floor(this.camY / TILE_SIZE);
    const viewTilesW = Math.ceil(viewW / TILE_SIZE);
    const viewTilesH = Math.ceil(viewH / TILE_SIZE);

    this.world.updateLiquids(camTileX, camTileY, viewTilesW, viewTilesH);
    const heldId = this.player.getHeldItem()?.id;
    const holdingLight =
      heldId === 'torch' ||
      heldId === 'zenith' ||
      heldId === 'terra_blade' ||
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

    // Enemy projectile hits against Player
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

    // Apply Screen Shake offset
    const shakeX =
      this.particles.shakeIntensity > 0
        ? (Math.random() - 0.5) * 2 * this.particles.shakeIntensity
        : 0;
    const shakeY =
      this.particles.shakeIntensity > 0
        ? (Math.random() - 0.5) * 2 * this.particles.shakeIntensity
        : 0;
    const renderCamX = this.camX + shakeX;
    const renderCamY = this.camY + shakeY;

    this.ctx.save();
    this.ctx.scale(this.zoom, this.zoom);

    this.world.render(this.ctx, renderCamX, renderCamY, sw, sh, this.zoom, this.atlas, biome);
    this.enemies.render(this.ctx, renderCamX, renderCamY);
    this.bosses.render(this.ctx, renderCamX, renderCamY, this.player);
    this.player.render(this.ctx, renderCamX, renderCamY, this.atlas);
    this.projectiles.render(this.ctx, renderCamX, renderCamY);
    this.particles.render(this.ctx, renderCamX, renderCamY);

    // Tile selection cursor highlight when holding a tool or block
    const held = this.player.getHeldItem();
    if (
      held &&
      (held.category === 'tool' || held.placeTile !== undefined || held.placeWall !== undefined)
    ) {
      const hx = this.input.tileMouseX * TILE_SIZE - renderCamX;
      const hy = this.input.tileMouseY * TILE_SIZE - renderCamY;
      this.ctx.strokeStyle = 'rgba(255, 235, 87, 0.65)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(hx, hy, TILE_SIZE, TILE_SIZE);
    }

    this.ctx.restore();

    // Screen Flash Overlay (Boss Kill / Phase Transition / Super Nova)
    if (this.particles.flashAlpha > 0.01) {
      this.ctx.save();
      this.ctx.globalAlpha = this.particles.flashAlpha;
      this.ctx.fillStyle = this.particles.flashColor;
      this.ctx.fillRect(0, 0, sw, sh);
      this.ctx.restore();
    }

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
