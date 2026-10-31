# Terraria (TypeScript + HTML5 Canvas Edition)

A complete, zero-dependency pixel-art remake of **Terraria** built with **TypeScript**, **Vite**, and **HTML5 Canvas** — featuring procedural multi-biome world generation, cellular lighting, liquid physics, 120+ items & crafting recipes, Town NPCs, and **all 14 Pre-Hardmode and Hardmode Bosses**.

---

## Features

### 1. Procedural World & Biomes
- **Surface Forest & Starter Cabin** (with Work Bench, Furnace, Iron Anvil, Chest, and Town NPCs)
- **Snow / Ice Tundra**
- **The Corruption** (Chasms, Ebonstone, Demonite Ore, and **Demon Altars**)
- **Desert** (Sand & Sandstone Caverns)
- **Jungle & Underground Jungle** (Mud, Jungle Grass, Spores, Hornets, Plantera Bulbs, Life Fruit, and the **Lihzahrd Temple** with Lihzahrd Altar)
- **The Dungeon** (Guarded by the **Old Man** on the West; multi-level chambers with Dungeon Chests, Muramasa, Cobalt Shield, Water Bolt, and Spikes)
- **Floating Sky Islands** (Cloud blocks and Skyware Chests with Hermes Boots, Cloud in a Bottle, and Fallen Stars)
- **The Underworld** (Ash roofs, Lava seas, Obsidian Ruined Houses, Hellforges, Voodoo Demons, and **Hellstone Ore**)
- **Hardmode Transformation** — Defeating the **Wall of Flesh** permanently converts parts of the world into **The Hallow** and blesses the underground with **Cobalt, Mythril, Titanium, and Chlorophyte Ores**!

### 2. All 14 Bosses (Pre-Hardmode & Hardmode)

| # | Boss | Tier | Summon Item / Trigger | Key Mechanics & Drops |
|---|---|---|---|---|
| 1 | **King Slime** | Pre-HM | Slime Crown | Shrinks as damaged, teleports, giant slam jumps, spawns Blue Slimes |
| 2 | **Eye of Cthulhu** | Pre-HM | Suspicious Looking Eye | Phase 1 spawns Servants; Phase 2 transforms into fanged mouth with rapid chain-dashes |
| 3 | **Eater of Worlds** | Pre-HM | Worm Food | 18 independent segments — destroying a middle segment splits the worm into multiple worms! |
| 4 | **Queen Bee** | Pre-HM | Abeemination | Horizontal screen dashes, stinger barrages, spawns Hornets |
| 5 | **Skeletron** | Pre-HM | Old Man at Dungeon / Curse | Articulated Skull + 2 swiping Hands; enters spinning-skull rage phase |
| 6 | **Wall of Flesh** | Pre-HM | Guide Voodoo Doll | Sweeps across the world with Laser Eyes, Mouth, and attached *The Hungry*; unlocks **Hardmode** & drops **Pwnhammer** |
| 7 | **The Twins** | Hardmode | Mechanical Eye | Dual boss (**Retinazer** & **Spazmatism**); both transform at 50% HP into mechanical Phase 2 forms |
| 8 | **The Destroyer** | Hardmode | Mechanical Worm | Colossal 26-segment mechanical worm firing body lasers |
| 9 | **Skeletron Prime** | Hardmode | Mechanical Skull | Mechanical skull with 4 independent robotic limbs: **Prime Laser, Cannon, Saw, and Vice** |
| 10 | **Plantera** | Hardmode | Break Plantera Bulb / Seed | Grapples with vines; Phase 2 sheds petals into a fast toothy maw |
| 11 | **Golem** | Hardmode | Lihzahrd Altar + Power Cell | Leaping stone body, chain-punching fists, and a **detaching flying Head** in Phase 2 |
| 12 | **Duke Fishron** | Hardmode | Truffle Worm | High-speed dashes, Sharknado bolts, and Phase 3 behind-the-player teleports |
| 13 | **Lunatic Cultist** | Hardmode | Ancient Cultist Tablet | Teleports around the player casting Homing Fireballs and Radial Ice Mist; drops **Ancient Manipulator** |
| 14 | **Moon Lord** | Endgame | Celestial Sigil | Left Hand Eye, Right Hand Eye, Forehead Eye (fires sweeping **Phantasmal Deathray**), and exposed **Moon Lord's Core**; drops **Meowmere**, **S.D.M.G.**, and **Last Prism** |

---

## Controls

| Key / Input | Action |
|---|---|
| `A` / `D` or `Left` / `Right` | Move Left / Right |
| `W` / `Space` | Jump, Double Jump, or Fly with Wings |
| `S` / `Down` | Drop through Wood Platforms |
| `E` | Fire **Grappling Hook** toward cursor (`Space` to release) |
| `Left Click` | Swing Weapon / Shoot / Mine Tiles / Place Blocks / Use Item |
| `Right Click` | Interact with Town NPCs, Open/Close Doors & Chests, Activate Lihzahrd Altar |
| `1` – `0` / `Mouse Wheel` | Select Hotbar Slot |
| `I` / `Tab` / `Esc` | Open / Close Inventory, Equipment & Crafting Menu |
| `K` | Open **14-Boss Encyclopedia, Progression Tracker & Loadout Selector** |
| `H` / `J` / `B` | Quick Heal / Quick Mana / Quick Buff |
| `M` | Toggle Fullscreen World Map |
| `Ctrl` | Toggle Smart Cursor |
| `-` / `+` | Zoom Out / Zoom In |
| `F5` | Save World & Character to Browser Storage |

---

## Running Locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```
