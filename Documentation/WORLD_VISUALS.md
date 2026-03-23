# 🌍 World Visuals & Scene Composition

**Last Updated**: March 22, 2026
**Status**: Active — reflects current `src/components/` state

This document covers every visual layer of the game world: the tile map, path overlay, world props (shadows, trees, lamps, campfire, well, rocks), and decorative grass/flower bundles. It is the single reference for adding, removing, or repositioning visual elements.

---

## Scene Architecture

The game world is a fixed **1344 × 768 px** canvas rendered in `Pet.jsx`. Layers stack from bottom to top:

| Z-index range | Layer | Component |
|---|---|---|
| 0 | Ground tiles | `TileMap` |
| 2 | Path overlay tiles | `PathOverlay` |
| 3 | Decor (shadows, grass tufts, flowers) | `WorldProps` (isDecor: true) |
| 8 | Edible grass patches | `Pet.jsx` inline |
| Z_BASE + footY (~10–788) | Props + Hare (depth-sorted) | `WorldProps`, `Pet.jsx` |
| ~798 | Vertical fences | `FenceOverlay` |
| 818 | Night overlay | `Pet.jsx` |
| 820 | Light glows | `Pet.jsx` |

---

## Area Grid Reference

The world is divided into a 3×3 grid of areas, each **448 × 256 px** (7 tiles × 4 tiles at 64 px/tile).

```
TL(6)  TM(7)  TR(8)    ← y: 0 to 255
ML(3)  MM(4)  MR(5)    ← y: 256 to 511
BL(0)  BM(1)  BR(2)    ← y: 512 to 767
```

Area 0 (BL) is always unlocked. Additional areas are purchased in the shop.

---

## Ground Tiles (TileMap.jsx)

All tiles are 64 × 64 px (imageRendering: pixelated).

| Tile Key | File | Purpose |
|---|---|---|
| g1 | ground_43.png | Primary grass (checkerboard even) |
| g2 | ground_52.png | Alternate grass (checkerboard odd) |
| f35 | fields_35.png | Transition row (grass→dirt) |
| f36 | fields_36.png | Transition row alt |
| f56 | fields_56.png | Transition row alt 2 |
| f01 | fields_01.png | Dirt center |
| f14–f16 | fields_14–16.png | Dirt edge variants |
| f23 | fields_23.png | Dirt corner |

The bottom 3 tile rows of the map are dirt/transition (controlled by `PATH_ROWS = 3` in `worldConfig.js`).

---

## Path Overlay (PathOverlay.jsx)

A dirt/cobblestone path crosses the top half of the map using "Top-Down Simple Summer Ground" tiles from the craftpix tileset.

### Route
```
TL(6) ─────────────── TM(7)
                         │
                        MM(4) ──────── MR(5)
```

The path is 2 tiles wide throughout.

### Tile Types

| Key | Source File | Role |
|---|---|---|
| h | ground_path_28.png | Horizontal center |
| h2 | ground_path_54.png | Horizontal alt / end cap |
| v | ground_path_30.png | Vertical center |
| et | ground_path_34.png | Horizontal top edge |
| eb | ground_path_36.png | Horizontal bottom edge |
| crd | ground_path_38.png | Corner: right → down |
| cdr | ground_path_41.png | Corner: down → right |

### Tile Positions (grid coords, 0-based)

- **Horizontal top**: rows 1–2, cols 0–9 (across TL and into TM)
- **Corner turn**: col 10, rows 1–2
- **Vertical section**: cols 10–11, rows 3–4 (crossing TM→MM boundary)
- **Corner turn**: cols 10–11, row 5
- **Horizontal bottom**: rows 5–6, cols 11–20 (across MM and MR)

To adjust the path, edit `buildPathTiles()` in `PathOverlay.jsx`.

---

## World Props (WorldProps.jsx)

All interactive and decorative props are defined in the `WORLD_PROPS` array. Non-decor props use depth-sorted z-index (`Z_BASE + y + displayH`). Decor props (`isDecor: true`) use fixed z-index 3.

### Interactive Props

#### Well (area 0 — BL)
- **File**: `prop_well.png` (200 × 200 px source)
- **Display**: 100 × 100 px
- **Collision radius**: 52 px
- **Interaction**: `water` — Rompy runs here when watered

#### Campfire (area 4 — MM)
- **File**: `prop_campfire2.png` — 6-frame sprite sheet, 192 × 32 px total
  - Source: `craftpix tileset2 / 3 Animated Objects / 2 Campfire / 2.png`
- **Display**: 64 × 64 px (2× scale)
- **CSS class**: `.prop-campfire` — `background-size: 384px 64px`, `steps(6)` animation
- **Glow**: radius 120 px, glowOffsetY 0.55 (campfire-glow class with flicker)
- **Collision radius**: 40 px

#### Lamps (areas 1 and 6)
- **File**: `prop_lamp1.png` (60 × 105 px source, pre-scaled)
- **Display**: 40 × 70 px (scaled down from previous 60 × 105)
- **Glow**: radius 90 px, glowOffsetY 0.12 (near lamp head)
- **Night-only**: glows are only rendered when `isNight === true`

#### Trees

| ID | Type | Area | Display |
|---|---|---|---|
| tree_0 | small | BL(0) | 80 × 93 |
| tree_1 | small | BM(1) | 80 × 93 |
| tree_2 | medium | BR(2) | 90 × 100 |
| tree_3 | small | ML(3) | 80 × 93 |
| tree_4 | large | MM(4) | 100 × 120 |
| tree_5 | medium | MR(5) | 90 × 100 |
| tree_6 | small | TL(6) | 80 × 93 |
| tree_7 | medium | TM(7) | 90 × 100 |
| tree_8 | large | TR(8) | 100 × 120 |
| forest_8a–h | small/medium/large | TR(8) | various |

The TR area (8) has an 8-tree forest cluster (`forest_8a` through `forest_8h`) to create a dense woodland effect in the fenced top-right section.

### Shadow Overlays

Shadows use `isDecor: true` (z-index 3) so they appear above the ground but behind all depth-sorted props.

Source: `craftpix tileset2 / 2 Objects / 1 Shadow /`

| Shadow | Source File | Used For | Display Scale |
|---|---|---|---|
| shadow_2 | 2.png (29×25) | Small trees, lamps | ~4× → ~116×100 |
| shadow_3 | 3.png (30×26) | Small trees | ~4× → ~120×104 |
| shadow_4 | 4.png (44×37) | Medium trees | ~4× → ~176×148 |
| shadow_5 | 5.png (55×44) | Large trees | ~4× → ~220×176 |
| shadow_6 | 6.png (95×62) | Campfire | ~2× → ~190×124 |

Shadows are placed slightly south and inset from each prop's base position to give a convincing ground-shadow effect.

### Decorative Grass Bundles

Small pixel-art grass blades from `craftpix tileset2 / 2 Objects / 5 Grass /` (files 1–6, each 5–9 × 5–10 px), rendered at ~5× scale (25–35 px display). Always placed in groups of 2–4 nearby sprites, never isolated.

**Areas with grass bundles**: all 9 areas (0–8).
Each bundle has 2–5 individual `decor_grass_N` props clustered within ~30–40 px of each other. Some bundles are placed near or under tree bases.

### Decorative Flower Bundles

Flowers from `craftpix tileset2 / 2 Objects / 6 Flower /` (files 1–12, 6–8 × 4–7 px each), rendered at ~4× scale (24–32 px display). Placed in groups of 2–4.

**Areas with flower bundles**: BL(0), BM(1), ML(3), MM(4), TL(6), TM(7), TR(8).

---

## Night System

Night is detected by checking PST hour (4 PM → 3 AM = night) via `checkIsNight()` in `Pet.jsx`.

When `isNight === true`:
- The `.night-overlay` div (z-index 818) darkens the whole scene with `rgba(10, 20, 60, 0.55)`.
- Light glows are rendered for all props with `emitsLight: true`.
- Campfire glow uses `.campfire-glow` (brighter, with subtle flicker animation).

### Glow Brightness

`.light-glow` gradient:
- 0%: rgba(255, 220, 120, **0.72**) — warm yellow core
- 40%: rgba(255, 170, 60, **0.40**) — amber mid
- 65%: rgba(255, 130, 30, **0.15**) — orange falloff
- 85%: transparent

`.campfire-glow` gradient (extra warm):
- 0%: rgba(255, 200, 80, **0.80**)
- 35%: rgba(255, 140, 30, **0.50**)
- 60%: rgba(255, 100, 10, **0.20**)
- 80%: transparent

---

## How to Add New Decor

1. Copy the source PNG to `src/assets/tiles/`.
2. Add an import at the top of `WorldProps.jsx`.
3. Add the key to `PROP_SRCS`.
4. Add one or more entries to `WORLD_PROPS` with `isDecor: true`, `collisionR: 0`.
   - For bundles: place 2–4 entries within 30–50 px of each other.

## How to Add New Path Tiles

1. Copy the PNG to `src/assets/tiles/`.
2. Add an import and entry to `PATH_SRCS` in `PathOverlay.jsx`.
3. Add `{ col, row, src }` entries to `buildPathTiles()`.

---

*See also: `WORLD_SYSTEM.md` (world/area system overview), `SVG_ASSETS.md` (SVG asset list)*
