/**
 * worldData.js — single source of truth for all world prop definitions.
 *
 * ─── ARCHITECTURE OVERVIEW ────────────────────────────────────────────────────
 * This file is a pure data module — no React, no rendering.
 * WorldProps.jsx imports WORLD_PROPS + PROP_SRCS and renders them.
 * Pet.jsx imports WORLD_PROPS directly for collision + interaction lookups.
 *
 * ─── HOW TO ADD A NEW PROP TYPE ──────────────────────────────────────────────
 * 1. Import the PNG asset.
 * 2. Add a key → URL entry in PROP_SRCS.
 * 3. Add one or more entries to WORLD_PROPS (see PROP ENTRY SCHEMA below).
 * That's it. No changes needed in WorldProps.jsx or Pet.jsx for basic display.
 *
 * ─── PROP ENTRY SCHEMA ───────────────────────────────────────────────────────
 * {
 *   id           : string    — unique identifier (used as React key + glow key)
 *   type         : string    — key into PROP_SRCS (selects the image / spritesheet)
 *   areaId       : 0–8       — which 3×3 grid area the prop lives in (informational)
 *   x, y         : number    — absolute pixel position of the TOP-LEFT of the sprite
 *   displayW     : number    — rendered width  (px)
 *   displayH     : number    — rendered height (px)
 *   collisionR   : number    — hare wander exclusion radius (px from sprite centre).
 *                              0 = no collision (shadows, grass tufts, flowers).
 *
 *   // ── Optional fields ──────────────────────────────────────────────────────
 *
 *   interactive? : boolean   — if true, Pet.jsx may route the hare here
 *   interactType?: string    — open string: 'water' | 'rest' | <anything you add>
 *                              Pet.jsx dispatches on this value for new interactions.
 *
 *   animated?    : boolean   — true → render as <div> with CSS background animation
 *   animClass?   : string    — CSS class added to the div (drives background-position)
 *                              Add the @keyframes + .your-class to Pet.css.
 *
 *   emitsLight?  : boolean   — true → Pet.jsx renders a night-glow div at Z_GLOW
 *   glowRadius?  : number    — px radius of the radial glow (default 80)
 *   glowOffsetY? : number    — fractional y of glow centre within sprite (default 0.5)
 *                              0 = top of sprite, 1 = bottom.
 *   glowCssClass?: string    — extra CSS class on the glow div (e.g. 'campfire-glow')
 *                              Leave unset for the default warm amber glow.
 *
 *   isDecor?     : boolean   — true → fixed low z-index (3), no collision check.
 *                              Use for shadows, ground tufts, flowers.
 * }
 *
 * ─── DEPTH SORTING ───────────────────────────────────────────────────────────
 * Props are depth-sorted in WorldProps.jsx:
 *   z-index = Z_BASE + Math.round(y + displayH)   ("foot position" rule)
 * isDecor props bypass this and always render at z=3 (above tiles, below props).
 *
 * ─── AREA GRID REFERENCE ─────────────────────────────────────────────────────
 *   TL(6) TM(7) TR(8)   screenRow 0   y: 0          → AREA_H-1
 *   ML(3) MM(4) MR(5)   screenRow 1   y: AREA_H     → 2*AREA_H-1
 *   BL(0) BM(1) BR(2)   screenRow 2   y: 2*AREA_H  → SCENE_H-1
 *
 *   Column boundaries: x = AREA_W, AREA_W*2
 *   areaId = (2 - screenRow) * 3 + col
 *
 * ─── POSITION HELPERS ────────────────────────────────────────────────────────
 * pos(areaId, relX, relY) — relative fractions within an area (0–1).
 *   relX=0 → left edge of area; relX=1 → right edge.
 *   relY=0 → top edge of area;  relY=1 → bottom edge.
 *   Auto-scales with AREA_W / AREA_H from worldConfig when you resize the world.
 *
 * abs(x, y) — use for precise pixel placement when relX/relY isn't convenient
 *   (e.g. positions expressed as AREA_W * fraction for cross-area clarity).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { AREA_W, AREA_H } from './worldConfig.js'

// ── Core props ────────────────────────────────────────────────
import treeSmallUrl   from './assets/tiles/prop_tree_small.png'
import treeMediumUrl  from './assets/tiles/prop_tree_medium.png'
import treeLargeUrl   from './assets/tiles/prop_tree_large.png'
import rock01Url      from './assets/tiles/prop_rock_01.png'
import rock03Url      from './assets/tiles/prop_rock_03.png'
import wellUrl        from './assets/tiles/prop_well.png'
import campfireUrl    from './assets/tiles/prop_campfire2.png'  // 6 frames × 32×32 px (192×32)
import lamp1Url       from './assets/tiles/prop_lamp1.png'

// ── Shadow overlays (craftpix tileset2 / 2 Objects / 1 Shadow) ──
// 2,3 = small tree  4 = medium tree  5 = large tree  6 = campfire
import shadow2Url from './assets/tiles/shadow_2.png'
import shadow3Url from './assets/tiles/shadow_3.png'
import shadow4Url from './assets/tiles/shadow_4.png'
import shadow5Url from './assets/tiles/shadow_5.png'
import shadow6Url from './assets/tiles/shadow_6.png'

// ── Decorative grass blades (craftpix tileset2 / 2 Objects / 5 Grass) ──
import dg1Url from './assets/tiles/decor_grass_1.png'
import dg2Url from './assets/tiles/decor_grass_2.png'
import dg3Url from './assets/tiles/decor_grass_3.png'
import dg4Url from './assets/tiles/decor_grass_4.png'
import dg5Url from './assets/tiles/decor_grass_5.png'
import dg6Url from './assets/tiles/decor_grass_6.png'

// ── Decorative flowers (craftpix tileset2 / 2 Objects / 6 Flower) ──
import df1Url  from './assets/tiles/decor_flower_1.png'
import df2Url  from './assets/tiles/decor_flower_2.png'
import df3Url  from './assets/tiles/decor_flower_3.png'
import df4Url  from './assets/tiles/decor_flower_4.png'
import df5Url  from './assets/tiles/decor_flower_5.png'
import df6Url  from './assets/tiles/decor_flower_6.png'
import df7Url  from './assets/tiles/decor_flower_7.png'
import df8Url  from './assets/tiles/decor_flower_8.png'
import df9Url  from './assets/tiles/decor_flower_9.png'
import df10Url from './assets/tiles/decor_flower_10.png'
import df11Url from './assets/tiles/decor_flower_11.png'
import df12Url from './assets/tiles/decor_flower_12.png'

// ── Tileset2 Decorations (Stones, Bushes, Lamps, Logs, etc.) ──
import stone1Url  from './assets/tileset2/stone/1.png'
import stone2Url  from './assets/tileset2/stone/2.png'
import stone3Url  from './assets/tileset2/stone/3.png'
import stone4Url  from './assets/tileset2/stone/4.png'
import stone5Url  from './assets/tileset2/stone/5.png'
import stone6Url  from './assets/tileset2/stone/6.png'
import stone7Url  from './assets/tileset2/stone/7.png'
import stone8Url  from './assets/tileset2/stone/8.png'
import stone9Url  from './assets/tileset2/stone/9.png'
import stone10Url from './assets/tileset2/stone/10.png'
import stone11Url from './assets/tileset2/stone/11.png'
import stone12Url from './assets/tileset2/stone/12.png'
import stone13Url from './assets/tileset2/stone/13.png'
import stone14Url from './assets/tileset2/stone/14.png'

import grass1Url from './assets/tileset2/grass/1.png'
import grass2Url from './assets/tileset2/grass/2.png'
import grass3Url from './assets/tileset2/grass/3.png'
import grass4Url from './assets/tileset2/grass/4.png'
import grass5Url from './assets/tileset2/grass/5.png'
import grass6Url from './assets/tileset2/grass/6.png'

import bush1Url from './assets/tileset2/bush/1.png'
import bush2Url from './assets/tileset2/bush/2.png'
import bush3Url from './assets/tileset2/bush/3.png'
import bush4Url from './assets/tileset2/bush/4.png'
import bush5Url from './assets/tileset2/bush/5.png'
import bush6Url from './assets/tileset2/bush/6.png'

import lamp1TUrl from './assets/tileset2/decor/Lamp1.png'
import lamp2TUrl from './assets/tileset2/decor/Lamp2.png'
import lamp3TUrl from './assets/tileset2/decor/Lamp3.png'
import lamp4TUrl from './assets/tileset2/decor/Lamp4.png'
import lamp5TUrl from './assets/tileset2/decor/Lamp5.png'
import lamp6TUrl from './assets/tileset2/decor/Lamp6.png'

import log1Url from './assets/tileset2/decor/Log1.png'
import log2Url from './assets/tileset2/decor/Log2.png'
import log3Url from './assets/tileset2/decor/Log3.png'
import log4Url from './assets/tileset2/decor/Log4.png'

import tree1TUrl from './assets/tileset2/decor/Tree1.png'
import tree2TUrl from './assets/tileset2/decor/Tree2.png'

import box1Url from './assets/tileset2/decor/Box1.png'
import box2Url from './assets/tileset2/decor/Box2.png'
import box3Url from './assets/tileset2/decor/Box3.png'
import box4Url from './assets/tileset2/decor/Box4.png'

import dirt1Url from './assets/tileset2/decor/Dirt1.png'
import dirt2Url from './assets/tileset2/decor/Dirt2.png'
import dirt3Url from './assets/tileset2/decor/Dirt3.png'
import dirt4Url from './assets/tileset2/decor/Dirt4.png'
import dirt5Url from './assets/tileset2/decor/Dirt5.png'
import dirt6Url from './assets/tileset2/decor/Dirt6.png'

import camp1Url from './assets/tileset2/camp/1.png'
import camp2Url from './assets/tileset2/camp/2.png'
import camp3Url from './assets/tileset2/camp/3.png'
import camp4Url from './assets/tileset2/camp/4.png'
import camp5Url from './assets/tileset2/camp/5.png'
import camp6Url from './assets/tileset2/camp/6.png'

// Flag: 5-frame spritesheet (960×64 — each source frame is 192×64)
import flagSheetUrl     from './assets/tileset2/flag/flag_sheet.png'
// Tileset2 campfire: 2-frame spritesheet (384×64)
import campfireSheetUrl from './assets/tileset2/campfire/campfire_sheet.png'

// ── Landmark props (craftpix tileset 1) ───────────────────────
import houseUrl          from './assets/tiles/prop_house.png'
import windmillUrl       from './assets/tiles/prop_windmill.png'
import fenceHorizontalUrl from './assets/tiles/fence_horizontal.png'
import fenceVerticalUrl   from './assets/tiles/fence_vertical.png'

// ── Asset map — swap URLs here to change the tileset ─────────
// To add a new prop type: add 1 import above + 1 line here.
export const PROP_SRCS = {
  tree_small:    treeSmallUrl,
  tree_medium:   treeMediumUrl,
  tree_large:    treeLargeUrl,
  rock_01:       rock01Url,
  rock_03:       rock03Url,
  well:          wellUrl,
  campfire:      campfireUrl,
  lamp1:         lamp1Url,
  // Shadows
  shadow_2:      shadow2Url,
  shadow_3:      shadow3Url,
  shadow_4:      shadow4Url,
  shadow_5:      shadow5Url,
  shadow_6:      shadow6Url,
  // Decorative grass blades
  decor_grass_1: dg1Url,
  decor_grass_2: dg2Url,
  decor_grass_3: dg3Url,
  decor_grass_4: dg4Url,
  decor_grass_5: dg5Url,
  decor_grass_6: dg6Url,
  // Decorative flowers
  decor_flower_1:  df1Url,
  decor_flower_2:  df2Url,
  decor_flower_3:  df3Url,
  decor_flower_4:  df4Url,
  decor_flower_5:  df5Url,
  decor_flower_6:  df6Url,
  decor_flower_7:  df7Url,
  decor_flower_8:  df8Url,
  decor_flower_9:  df9Url,
  decor_flower_10: df10Url,
  decor_flower_11: df11Url,
  decor_flower_12: df12Url,
  // Tileset2 stones
  stone_1: stone1Url,
  stone_2: stone2Url,
  stone_3: stone3Url,
  stone_4: stone4Url,
  stone_5: stone5Url,
  stone_6: stone6Url,
  stone_7: stone7Url,
  stone_8: stone8Url,
  stone_9: stone9Url,
  stone_10: stone10Url,
  stone_11: stone11Url,
  stone_12: stone12Url,
  stone_13: stone13Url,
  stone_14: stone14Url,
  // Tileset2 grass
  grass_1: grass1Url,
  grass_2: grass2Url,
  grass_3: grass3Url,
  grass_4: grass4Url,
  grass_5: grass5Url,
  grass_6: grass6Url,
  // Tileset2 bushes
  bush_1: bush1Url,
  bush_2: bush2Url,
  bush_3: bush3Url,
  bush_4: bush4Url,
  bush_5: bush5Url,
  bush_6: bush6Url,
  // Tileset2 decorations (lamps, logs, trees, boxes, dirt)
  lamp_1t: lamp1TUrl,
  lamp_2t: lamp2TUrl,
  lamp_3t: lamp3TUrl,
  lamp_4t: lamp4TUrl,
  lamp_5t: lamp5TUrl,
  lamp_6t: lamp6TUrl,
  log_1: log1Url,
  log_2: log2Url,
  log_3: log3Url,
  log_4: log4Url,
  tree_1t: tree1TUrl,
  tree_2t: tree2TUrl,
  box_1: box1Url,
  box_2: box2Url,
  box_3: box3Url,
  box_4: box4Url,
  dirt_1: dirt1Url,
  dirt_2: dirt2Url,
  dirt_3: dirt3Url,
  dirt_4: dirt4Url,
  dirt_5: dirt5Url,
  dirt_6: dirt6Url,
  // Tileset2 camp items
  camp_1: camp1Url,
  camp_2: camp2Url,
  camp_3: camp3Url,
  camp_4: camp4Url,
  camp_5: camp5Url,
  camp_6: camp6Url,
  // Tileset2 animated objects (combined spritesheets)
  flag_sheet:     flagSheetUrl,      // 960×64, 5 frames of 192×64
  campfire_sheet: campfireSheetUrl,  // 384×64, 2 frames of 192×64
  // Landmark props (craftpix tileset 1)
  house:          houseUrl,          // 480×640 source — displayed ~90×120
  windmill:       windmillUrl,       // 720×720 source — displayed ~90×90
  fence_h:        fenceHorizontalUrl, // 220×80 source — displayed ~90×33
  fence_v:        fenceVerticalUrl,   // 80×220 source — displayed ~33×90
}

// ── Position helpers ──────────────────────────────────────────
/**
 * Convert area-relative fractions to absolute pixel coordinates.
 * Automatically rescales when AREA_COLS / AREA_ROWS change in worldConfig.
 *
 * @param {number} areaId  0–8
 * @param {number} relX    0 = left edge, 1 = right edge of area
 * @param {number} relY    0 = top edge,  1 = bottom edge of area
 * @returns {{ x: number, y: number }}
 */
export function pos(areaId, relX, relY) {
  const col = areaId % 3
  const row = 2 - Math.floor(areaId / 3)  // 0 = top screen row, 2 = bottom
  return {
    x: Math.round(col * AREA_W + relX * AREA_W),
    y: Math.round(row * AREA_H + relY * AREA_H),
  }
}

/**
 * Absolute pixel position helper (no rounding via fractions).
 * Use when coordinates are more naturally expressed in raw pixels.
 */
export function abs(x, y) { return { x: Math.round(x), y: Math.round(y) } }

// ── World prop definitions ────────────────────────────────────
// All positions use pos() so they auto-rescale when world dimensions change.
// Use abs() only when a position is naturally expressed in pixels
// (e.g. AREA_W * 2 + offset) and area-relative fractions would be confusing.
export const WORLD_PROPS = [

  // ══════════════════════════════════════════════════════════
  //  SHADOWS  (isDecor: true → rendered at fixed low z-index)
  //  shadow_2/3 → small trees  shadow_4 → medium  shadow_5 → large
  //  shadow_6 → campfire
  //  Displayed at 4× scale; placed slightly south of each prop's base.
  //
  //  NOT rendered for:
  //    - Bottom-row trees (areas 0/1/2): would spill onto sand tiles
  //    - Path-adjacent tree_6: tree moved off path, no shadow on dirt
  //    - lamp_1: relocated to MR area, no shadow desired
  // ══════════════════════════════════════════════════════════

  // Under tree_3 (small, area 3) — shadow_3 @ 4× = 120×104
  { id: 'shd_tree3', type: 'shadow_3', isDecor: true,
    areaId: 3, tier: 1, ...abs(0.03 * AREA_W, AREA_H + 0.06 * AREA_H),
    displayW: 120, displayH: 104, collisionR: 0 },

  // Under tree_4 (large, area 4) — shadow_5 @ 4× = 220×176
  { id: 'shd_tree4', type: 'shadow_5', isDecor: true,
    areaId: 4, tier: 1, ...abs(AREA_W + 0.03 * AREA_W, AREA_H + 0.06 * AREA_H),
    displayW: 220, displayH: 176, collisionR: 0 },

  // Under lamp_6 (area 6) — shadow_2 @ 3× = 87×75
  { id: 'shd_lamp6', type: 'shadow_2', isDecor: true,
    areaId: 6, tier: 1, ...abs(0.62 * AREA_W, 0.58 * AREA_H),
    displayW: 87, displayH: 75, collisionR: 0 },

  // Under campfire — shadow_6 @ 3× = 285×186
  { id: 'shd_campfire', type: 'shadow_6', isDecor: true,
    areaId: 4, tier: 1, ...abs(AREA_W + 0.27 * AREA_W, AREA_H + 0.38 * AREA_H),
    displayW: 285, displayH: 186, collisionR: 0 },

  // ══════════════════════════════════════════════════════════
  //  DECORATIVE GRASS BUNDLES  (isDecor: true)
  //  5× scale (pixel art source ≈5–9px → 25–45px)
  //  Bottom-row areas (0/1/2): kept at relY < 0.25 so they stay on grass,
  //  not the sand/path tiles below.
  // ══════════════════════════════════════════════════════════

  // Area 0 (BL)
  { id: 'dg_0a', type: 'decor_grass_1', isDecor: true, areaId: 0, tier: 1, ...abs(0.20 * AREA_W, AREA_H * 2 + 0.10 * AREA_H), displayW: 30, displayH: 30, collisionR: 0 },
  { id: 'dg_0b', type: 'decor_grass_4', isDecor: true, areaId: 0, tier: 1, ...abs(0.22 * AREA_W, AREA_H * 2 + 0.12 * AREA_H), displayW: 30, displayH: 25, collisionR: 0 },
  { id: 'dg_0c', type: 'decor_grass_2', isDecor: true, areaId: 0, tier: 1, ...abs(0.24 * AREA_W, AREA_H * 2 + 0.11 * AREA_H), displayW: 35, displayH: 30, collisionR: 0 },
  { id: 'dg_0d', type: 'decor_grass_5', isDecor: true, areaId: 0, tier: 1, ...abs(0.55 * AREA_W, AREA_H * 2 + 0.08 * AREA_H), displayW: 25, displayH: 40, collisionR: 0 },
  { id: 'dg_0e', type: 'decor_grass_3', isDecor: true, areaId: 0, tier: 1, ...abs(0.57 * AREA_W, AREA_H * 2 + 0.09 * AREA_H), displayW: 25, displayH: 35, collisionR: 0 },

  // Area 1 (BM)
  { id: 'dg_1a', type: 'decor_grass_6', isDecor: true, areaId: 1, tier: 1, ...abs(AREA_W + 0.40 * AREA_W, AREA_H * 2 + 0.10 * AREA_H), displayW: 25, displayH: 32, collisionR: 0 },
  { id: 'dg_1b', type: 'decor_grass_1', isDecor: true, areaId: 1, tier: 1, ...abs(AREA_W + 0.42 * AREA_W, AREA_H * 2 + 0.08 * AREA_H), displayW: 30, displayH: 30, collisionR: 0 },
  { id: 'dg_1c', type: 'decor_grass_3', isDecor: true, areaId: 1, tier: 1, ...abs(AREA_W + 0.55 * AREA_W, AREA_H * 2 + 0.08 * AREA_H), displayW: 25, displayH: 35, collisionR: 0 },
  { id: 'dg_1d', type: 'decor_grass_5', isDecor: true, areaId: 1, tier: 1, ...abs(AREA_W + 0.57 * AREA_W, AREA_H * 2 + 0.08 * AREA_H), displayW: 30, displayH: 40, collisionR: 0 },
  { id: 'dg_1e', type: 'decor_grass_2', isDecor: true, areaId: 1, tier: 1, ...abs(AREA_W + 0.59 * AREA_W, AREA_H * 2 + 0.10 * AREA_H), displayW: 35, displayH: 30, collisionR: 0 },

  // Area 2 (BR)
  { id: 'dg_2a', type: 'decor_grass_4', isDecor: true, areaId: 2, tier: 1, ...abs(2 * AREA_W + 0.30 * AREA_W, AREA_H * 2 + 0.10 * AREA_H), displayW: 30, displayH: 25, collisionR: 0 },
  { id: 'dg_2b', type: 'decor_grass_6', isDecor: true, areaId: 2, tier: 1, ...abs(2 * AREA_W + 0.32 * AREA_W, AREA_H * 2 + 0.08 * AREA_H), displayW: 25, displayH: 32, collisionR: 0 },
  { id: 'dg_2c', type: 'decor_grass_1', isDecor: true, areaId: 2, tier: 1, ...abs(2 * AREA_W + 0.34 * AREA_W, AREA_H * 2 + 0.10 * AREA_H), displayW: 30, displayH: 30, collisionR: 0 },

  // Area 3 (ML) — near tree_3 base
  { id: 'dg_3a', type: 'decor_grass_2', isDecor: true, areaId: 3, tier: 1, ...abs(0.03 * AREA_W, AREA_H + 0.11 * AREA_H), displayW: 35, displayH: 30, collisionR: 0 },
  { id: 'dg_3b', type: 'decor_grass_5', isDecor: true, areaId: 3, tier: 1, ...abs(0.05 * AREA_W, AREA_H + 0.09 * AREA_H), displayW: 30, displayH: 40, collisionR: 0 },
  { id: 'dg_3c', type: 'decor_grass_3', isDecor: true, areaId: 3, tier: 1, ...abs(0.50 * AREA_W, AREA_H + 0.50 * AREA_H), displayW: 25, displayH: 35, collisionR: 0 },
  { id: 'dg_3d', type: 'decor_grass_4', isDecor: true, areaId: 3, tier: 1, ...abs(0.52 * AREA_W, AREA_H + 0.50 * AREA_H), displayW: 30, displayH: 25, collisionR: 0 },

  // Area 4 (MM) — near campfire & tree_4
  { id: 'dg_4a', type: 'decor_grass_6', isDecor: true, areaId: 4, tier: 1, ...abs(AREA_W + 0.06 * AREA_W, AREA_H + 0.12 * AREA_H), displayW: 25, displayH: 32, collisionR: 0 },
  { id: 'dg_4b', type: 'decor_grass_1', isDecor: true, areaId: 4, tier: 1, ...abs(AREA_W + 0.08 * AREA_W, AREA_H + 0.10 * AREA_H), displayW: 30, displayH: 30, collisionR: 0 },
  { id: 'dg_4c', type: 'decor_grass_2', isDecor: true, areaId: 4, tier: 1, ...abs(AREA_W + 0.65 * AREA_W, AREA_H + 0.55 * AREA_H), displayW: 35, displayH: 30, collisionR: 0 },
  { id: 'dg_4d', type: 'decor_grass_4', isDecor: true, areaId: 4, tier: 1, ...abs(AREA_W + 0.67 * AREA_W, AREA_H + 0.57 * AREA_H), displayW: 30, displayH: 25, collisionR: 0 },

  // Area 5 (MR)
  { id: 'dg_5a', type: 'decor_grass_3', isDecor: true, areaId: 5, tier: 1, ...abs(2 * AREA_W + 0.20 * AREA_W, AREA_H + 0.40 * AREA_H), displayW: 25, displayH: 35, collisionR: 0 },
  { id: 'dg_5b', type: 'decor_grass_5', isDecor: true, areaId: 5, tier: 1, ...abs(2 * AREA_W + 0.22 * AREA_W, AREA_H + 0.40 * AREA_H), displayW: 30, displayH: 40, collisionR: 0 },
  { id: 'dg_5c', type: 'decor_grass_6', isDecor: true, areaId: 5, tier: 1, ...abs(2 * AREA_W + 0.24 * AREA_W, AREA_H + 0.42 * AREA_H), displayW: 25, displayH: 32, collisionR: 0 },

  // Area 6 (TL) — under tree_6 and other spots
  { id: 'dg_6a', type: 'decor_grass_1', isDecor: true, areaId: 6, tier: 1, ...abs(0.05 * AREA_W, 0.12 * AREA_H), displayW: 30, displayH: 30, collisionR: 0 },
  { id: 'dg_6b', type: 'decor_grass_3', isDecor: true, areaId: 6, tier: 1, ...abs(0.07 * AREA_W, 0.10 * AREA_H), displayW: 25, displayH: 35, collisionR: 0 },
  { id: 'dg_6c', type: 'decor_grass_2', isDecor: true, areaId: 6, tier: 1, ...abs(0.45 * AREA_W, 0.65 * AREA_H), displayW: 35, displayH: 30, collisionR: 0 },
  { id: 'dg_6d', type: 'decor_grass_4', isDecor: true, areaId: 6, tier: 1, ...abs(0.47 * AREA_W, 0.65 * AREA_H), displayW: 30, displayH: 25, collisionR: 0 },
  { id: 'dg_6e', type: 'decor_grass_5', isDecor: true, areaId: 6, tier: 1, ...abs(0.49 * AREA_W, 0.67 * AREA_H), displayW: 30, displayH: 40, collisionR: 0 },

  // Area 7 (TM)
  { id: 'dg_7a', type: 'decor_grass_6', isDecor: true, areaId: 7, tier: 1, ...abs(AREA_W + 0.38 * AREA_W, 0.12 * AREA_H), displayW: 25, displayH: 32, collisionR: 0 },
  { id: 'dg_7b', type: 'decor_grass_1', isDecor: true, areaId: 7, tier: 1, ...abs(AREA_W + 0.40 * AREA_W, 0.10 * AREA_H), displayW: 30, displayH: 30, collisionR: 0 },
  { id: 'dg_7c', type: 'decor_grass_2', isDecor: true, areaId: 7, tier: 1, ...abs(AREA_W + 0.60 * AREA_W, 0.55 * AREA_H), displayW: 35, displayH: 30, collisionR: 0 },
  { id: 'dg_7d', type: 'decor_grass_4', isDecor: true, areaId: 7, tier: 1, ...abs(AREA_W + 0.62 * AREA_W, 0.55 * AREA_H), displayW: 30, displayH: 25, collisionR: 0 },

  // Area 8 (TR) — under forest trees
  { id: 'dg_8a', type: 'decor_grass_3', isDecor: true, areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.15 * AREA_W, 0.45 * AREA_H), displayW: 25, displayH: 35, collisionR: 0 },
  { id: 'dg_8b', type: 'decor_grass_5', isDecor: true, areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.17 * AREA_W, 0.45 * AREA_H), displayW: 30, displayH: 40, collisionR: 0 },
  { id: 'dg_8c', type: 'decor_grass_6', isDecor: true, areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.50 * AREA_W, 0.30 * AREA_H), displayW: 25, displayH: 32, collisionR: 0 },
  { id: 'dg_8d', type: 'decor_grass_1', isDecor: true, areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.52 * AREA_W, 0.30 * AREA_H), displayW: 30, displayH: 30, collisionR: 0 },

  // ══════════════════════════════════════════════════════════
  //  DECORATIVE FLOWER BUNDLES  (isDecor: true)
  //  Scattered across areas; some near trees for colour.
  //  Bottom-row areas: relY < 0.25 keeps them on grass, not sand.
  // ══════════════════════════════════════════════════════════

  // Area 0 (BL)
  { id: 'df_0a', type: 'decor_flower_3', isDecor: true, areaId: 0, tier: 1, ...abs(0.35 * AREA_W, AREA_H * 2 + 0.13 * AREA_H), displayW: 24, displayH: 24, collisionR: 0 },
  { id: 'df_0b', type: 'decor_flower_5', isDecor: true, areaId: 0, tier: 1, ...abs(0.37 * AREA_W, AREA_H * 2 + 0.13 * AREA_H), displayW: 24, displayH: 20, collisionR: 0 },
  { id: 'df_0c', type: 'decor_flower_1', isDecor: true, areaId: 0, tier: 1, ...abs(0.39 * AREA_W, AREA_H * 2 + 0.14 * AREA_H), displayW: 24, displayH: 24, collisionR: 0 },

  // Area 1 (BM)
  { id: 'df_1a', type: 'decor_flower_7', isDecor: true, areaId: 1, tier: 1, ...abs(AREA_W + 0.20 * AREA_W, AREA_H * 2 + 0.12 * AREA_H), displayW: 32, displayH: 24, collisionR: 0 },
  { id: 'df_1b', type: 'decor_flower_8', isDecor: true, areaId: 1, tier: 1, ...abs(AREA_W + 0.22 * AREA_W, AREA_H * 2 + 0.12 * AREA_H), displayW: 28, displayH: 24, collisionR: 0 },
  { id: 'df_1c', type: 'decor_flower_2', isDecor: true, areaId: 1, tier: 1, ...abs(AREA_W + 0.24 * AREA_W, AREA_H * 2 + 0.14 * AREA_H), displayW: 24, displayH: 20, collisionR: 0 },

  // Area 3 (ML) — near lamp and rock
  { id: 'df_3a', type: 'decor_flower_9',  isDecor: true, areaId: 3, tier: 1, ...abs(0.25 * AREA_W, AREA_H + 0.70 * AREA_H), displayW: 32, displayH: 28, collisionR: 0 },
  { id: 'df_3b', type: 'decor_flower_10', isDecor: true, areaId: 3, tier: 1, ...abs(0.27 * AREA_W, AREA_H + 0.70 * AREA_H), displayW: 24, displayH: 16, collisionR: 0 },
  { id: 'df_3c', type: 'decor_flower_4',  isDecor: true, areaId: 3, tier: 1, ...abs(0.29 * AREA_W, AREA_H + 0.72 * AREA_H), displayW: 24, displayH: 20, collisionR: 0 },
  { id: 'df_3d', type: 'decor_flower_6',  isDecor: true, areaId: 3, tier: 1, ...abs(0.31 * AREA_W, AREA_H + 0.70 * AREA_H), displayW: 24, displayH: 20, collisionR: 0 },

  // Area 4 (MM) — near campfire for warmth
  { id: 'df_4a', type: 'decor_flower_11', isDecor: true, areaId: 4, tier: 1, ...abs(AREA_W + 0.55 * AREA_W, AREA_H + 0.20 * AREA_H), displayW: 24, displayH: 20, collisionR: 0 },
  { id: 'df_4b', type: 'decor_flower_12', isDecor: true, areaId: 4, tier: 1, ...abs(AREA_W + 0.57 * AREA_W, AREA_H + 0.20 * AREA_H), displayW: 32, displayH: 28, collisionR: 0 },
  { id: 'df_4c', type: 'decor_flower_1',  isDecor: true, areaId: 4, tier: 1, ...abs(AREA_W + 0.59 * AREA_W, AREA_H + 0.22 * AREA_H), displayW: 24, displayH: 24, collisionR: 0 },

  // Area 6 (TL) — near lamp_6
  { id: 'df_6a', type: 'decor_flower_3', isDecor: true, areaId: 6, tier: 1, ...abs(0.60 * AREA_W, 0.15 * AREA_H), displayW: 24, displayH: 24, collisionR: 0 },
  { id: 'df_6b', type: 'decor_flower_5', isDecor: true, areaId: 6, tier: 1, ...abs(0.62 * AREA_W, 0.15 * AREA_H), displayW: 24, displayH: 20, collisionR: 0 },
  { id: 'df_6c', type: 'decor_flower_7', isDecor: true, areaId: 6, tier: 1, ...abs(0.64 * AREA_W, 0.17 * AREA_H), displayW: 32, displayH: 24, collisionR: 0 },

  // Area 7 (TM) — under tree_7
  { id: 'df_7a', type: 'decor_flower_9',  isDecor: true, areaId: 7, tier: 1, ...abs(AREA_W + 0.38 * AREA_W, 0.14 * AREA_H), displayW: 32, displayH: 28, collisionR: 0 },
  { id: 'df_7b', type: 'decor_flower_2',  isDecor: true, areaId: 7, tier: 1, ...abs(AREA_W + 0.40 * AREA_W, 0.12 * AREA_H), displayW: 24, displayH: 20, collisionR: 0 },

  // Area 8 (TR) — forest floor
  { id: 'df_8a', type: 'decor_flower_4',  isDecor: true, areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.30 * AREA_W, 0.20 * AREA_H), displayW: 24, displayH: 20, collisionR: 0 },
  { id: 'df_8b', type: 'decor_flower_6',  isDecor: true, areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.32 * AREA_W, 0.20 * AREA_H), displayW: 24, displayH: 20, collisionR: 0 },
  { id: 'df_8c', type: 'decor_flower_8',  isDecor: true, areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.34 * AREA_W, 0.22 * AREA_H), displayW: 28, displayH: 24, collisionR: 0 },
  { id: 'df_8d', type: 'decor_flower_11', isDecor: true, areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.55 * AREA_W, 0.60 * AREA_H), displayW: 24, displayH: 20, collisionR: 0 },
  { id: 'df_8e', type: 'decor_flower_12', isDecor: true, areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.57 * AREA_W, 0.60 * AREA_H), displayW: 32, displayH: 28, collisionR: 0 },

  // ══════════════════════════════════════════════════════════
  //  INTERACTIVE / STRUCTURAL PROPS
  // ══════════════════════════════════════════════════════════

  // ── Well — BL (area 0), right-centre — water source ──────────
  { id: 'well_0', type: 'well',
    areaId: 0, tier: 1, ...pos(0, 0.73, 0.28),
    displayW: 100, displayH: 100, collisionR: 52,
    interactive: true, interactType: 'water' },

  // ── Trees — 1 per area (BL→MR), plus forest cluster in TR ────
  { id: 'tree_0', type: 'tree_small',
    areaId: 0, tier: 1, ...pos(0, 0.07, 0.01),
    displayW: 80, displayH: 93, collisionR: 44,
    interactive: true, interactType: 'rest' },

  { id: 'tree_1', type: 'tree_small',
    areaId: 1, tier: 1, ...pos(1, 0.44, 0.01),
    displayW: 80, displayH: 93, collisionR: 44,
    interactive: true, interactType: 'rest' },

  { id: 'tree_2', type: 'tree_medium',
    areaId: 2, tier: 2, ...pos(2, 0.60, 0.01),
    displayW: 90, displayH: 100, collisionR: 50,
    interactive: true, interactType: 'rest' },

  { id: 'tree_3', type: 'tree_small',
    areaId: 3, tier: 1, ...pos(3, 0.07, 0.01),
    displayW: 80, displayH: 93, collisionR: 44,
    interactive: true, interactType: 'rest' },

  // tree_4 in MM is positioned left so campfire can sit at centre
  { id: 'tree_4', type: 'tree_large',
    areaId: 4, tier: 1, ...pos(4, 0.08, 0.01),
    displayW: 100, displayH: 120, collisionR: 56,
    interactive: true, interactType: 'rest' },

  // tree_5 at relY=0.62 — base clears path row 5 (relY ≈ 0.25–0.50 in MR)
  { id: 'tree_5', type: 'tree_medium',
    areaId: 5, tier: 1, ...pos(5, 0.34, 0.62),
    displayW: 90, displayH: 100, collisionR: 50,
    interactive: true, interactType: 'rest' },

  // tree_6 at relY=0.55 — base clears path row 1 (y=64–128 in TL)
  { id: 'tree_6', type: 'tree_small',
    areaId: 6, tier: 1, ...pos(6, 0.07, 0.55),
    displayW: 80, displayH: 93, collisionR: 44,
    interactive: true, interactType: 'rest' },

  // tree_7 at relY=0.55 — base clears path row 1 (y=64–128 in TM)
  { id: 'tree_7', type: 'tree_medium',
    areaId: 7, tier: 1, ...pos(7, 0.41, 0.55),
    displayW: 90, displayH: 100, collisionR: 50,
    interactive: true, interactType: 'rest' },

  { id: 'tree_8', type: 'tree_large',
    areaId: 8, tier: 1, ...pos(8, 0.10, 0.01),
    displayW: 100, displayH: 120, collisionR: 56,
    interactive: true, interactType: 'rest' },

  // ── Forest cluster — TR (area 8) — dense tree grouping ───────
  { id: 'forest_8a', type: 'tree_small',
    areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.35 * AREA_W, 0.02 * AREA_H),
    displayW: 75, displayH: 88, collisionR: 40,
    interactive: true, interactType: 'rest' },
  { id: 'forest_8b', type: 'tree_medium',
    areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.52 * AREA_W, 0.01 * AREA_H),
    displayW: 85, displayH: 95, collisionR: 46,
    interactive: true, interactType: 'rest' },
  { id: 'forest_8c', type: 'tree_large',
    areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.70 * AREA_W, 0.00 * AREA_H),
    displayW: 95, displayH: 115, collisionR: 52,
    interactive: true, interactType: 'rest' },
  { id: 'forest_8d', type: 'tree_small',
    areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.82 * AREA_W, 0.02 * AREA_H),
    displayW: 72, displayH: 84, collisionR: 38,
    interactive: true, interactType: 'rest' },
  { id: 'forest_8e', type: 'tree_medium',
    areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.25 * AREA_W, 0.30 * AREA_H),
    displayW: 80, displayH: 92, collisionR: 44,
    interactive: true, interactType: 'rest' },
  { id: 'forest_8f', type: 'tree_small',
    areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.44 * AREA_W, 0.35 * AREA_H),
    displayW: 70, displayH: 82, collisionR: 38,
    interactive: true, interactType: 'rest' },
  { id: 'forest_8g', type: 'tree_large',
    areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.60 * AREA_W, 0.30 * AREA_H),
    displayW: 90, displayH: 108, collisionR: 50,
    interactive: true, interactType: 'rest' },
  { id: 'forest_8h', type: 'tree_small',
    areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.78 * AREA_W, 0.33 * AREA_H),
    displayW: 72, displayH: 84, collisionR: 38,
    interactive: true, interactType: 'rest' },

  // Denser canopy — overlap allowed
  { id: 'forest_8i', type: 'tree_large',
    areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.07 * AREA_W, 0.00 * AREA_H),
    displayW: 95, displayH: 112, collisionR: 50,
    interactive: true, interactType: 'rest' },
  { id: 'forest_8j', type: 'tree_medium',
    areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.18 * AREA_W, 0.02 * AREA_H),
    displayW: 82, displayH: 94, collisionR: 44,
    interactive: true, interactType: 'rest' },
  { id: 'forest_8k', type: 'tree_small',
    areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.42 * AREA_W, 0.13 * AREA_H),
    displayW: 74, displayH: 86, collisionR: 40,
    interactive: true, interactType: 'rest' },
  { id: 'forest_8l', type: 'tree_large',
    areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.88 * AREA_W, 0.00 * AREA_H),
    displayW: 90, displayH: 108, collisionR: 48,
    interactive: true, interactType: 'rest' },
  { id: 'forest_8m', type: 'tree_medium',
    areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.08 * AREA_W, 0.28 * AREA_H),
    displayW: 80, displayH: 90, collisionR: 42,
    interactive: true, interactType: 'rest' },
  { id: 'forest_8n', type: 'tree_small',
    areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.55 * AREA_W, 0.55 * AREA_H),
    displayW: 70, displayH: 82, collisionR: 38,
    interactive: true, interactType: 'rest' },
  { id: 'forest_8o', type: 'tree_large',
    areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.72 * AREA_W, 0.55 * AREA_H),
    displayW: 92, displayH: 110, collisionR: 50,
    interactive: true, interactType: 'rest' },
  { id: 'forest_8p', type: 'tree_medium',
    areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.88 * AREA_W, 0.52 * AREA_H),
    displayW: 80, displayH: 92, collisionR: 44,
    interactive: true, interactType: 'rest' },
  { id: 'forest_8q', type: 'tree_small',
    areaId: 8, tier: 1, ...abs(2 * AREA_W + 0.20 * AREA_W, 0.55 * AREA_H),
    displayW: 72, displayH: 84, collisionR: 38,
    interactive: true, interactType: 'rest' },

  // ── Campfire — MM (area 4), centred ───────────────────────────
  // prop_campfire2.png: 6 frames × 32×32 px → displayed at 3× (96×96)
  // animClass 'prop-campfire' drives the steps(6) CSS animation (Pet.css).
  // glowCssClass 'campfire-glow' enables the warm-flickering light variant.
  { id: 'campfire_0', type: 'campfire',
    areaId: 4, tier: 1, ...pos(4, 0.393, 0.313),
    displayW: 96, displayH: 96, collisionR: 52,
    animated: true, animClass: 'prop-campfire',
    emitsLight: true, glowRadius: 150, glowOffsetY: 0.55, glowCssClass: 'campfire-glow' },

  // ── Lamps — emit warm glow at night (40×70 px) ────────────────
  // lamp_1: MR area (5), left edge, overlooking path row 5.
  // lamp_6: TL area (6), relY=0.55, clear of path row 1.
  { id: 'lamp_1', type: 'lamp1',
    areaId: 5, tier: 1, ...pos(5, 0.06, 0.20),
    displayW: 40, displayH: 70, collisionR: 24,
    emitsLight: true, glowRadius: 90, glowOffsetY: 0.12 },

  { id: 'lamp_6', type: 'lamp1',
    areaId: 6, tier: 1, ...pos(6, 0.65, 0.55),
    displayW: 40, displayH: 70, collisionR: 24,
    emitsLight: true, glowRadius: 90, glowOffsetY: 0.12 },

  // ── Rocks — decorative scatter ────────────────────────────────
  { id: 'rock_0', type: 'rock_01', areaId: 0, tier: 1, ...pos(0, 0.44, 0.68), displayW: 60, displayH: 50, collisionR: 30 },
  { id: 'rock_1', type: 'rock_03', areaId: 1, tier: 1, ...pos(1, 0.76, 0.63), displayW: 50, displayH: 30, collisionR: 26 },
  { id: 'rock_2', type: 'rock_01', areaId: 2, tier: 1, ...pos(2, 0.08, 0.70), displayW: 60, displayH: 50, collisionR: 30 },
  { id: 'rock_3', type: 'rock_03', areaId: 4, tier: 1, ...pos(4, 0.78, 0.70), displayW: 50, displayH: 30, collisionR: 26 },
  { id: 'rock_4', type: 'rock_01', areaId: 6, tier: 1, ...pos(6, 0.73, 0.66), displayW: 60, displayH: 50, collisionR: 30 },

  // ══════════════════════════════════════════════════════════
  // ──  TIER 1 DECORATIONS (Upper Areas) ────────────────────
  // ──  Tier 2 & 3 props intentionally empty — to be added  ──
  // ══════════════════════════════════════════════════════════

  // ── AREA 7 (TM) ──────────────────────────────────────────
  { id: 't1_7_g1', type: 'grass_1', isDecor: true, areaId: 7, tier: 1, ...pos(7, 0.25, 0.30), displayW: 28, displayH: 32, collisionR: 0 },
  { id: 't1_7_g4', type: 'grass_4', isDecor: true, areaId: 7, tier: 1, ...pos(7, 0.28, 0.35), displayW: 28, displayH: 24, collisionR: 0 },
  { id: 't1_7_stone', type: 'stone_2', isDecor: true, areaId: 7, tier: 1, ...pos(7, 0.60, 0.60), displayW: 40, displayH: 35, collisionR: 0 },

  // ── AREA 3 (ML) ──────────────────────────────────────────
  { id: 't1_3_s7', type: 'stone_7', isDecor: true, areaId: 3, tier: 1, ...pos(3, 0.15, 0.25), displayW: 40, displayH: 35, collisionR: 0 },
  { id: 't1_3_s11', type: 'stone_11', isDecor: true, areaId: 3, tier: 1, ...pos(3, 0.70, 0.70), displayW: 40, displayH: 35, collisionR: 0 },
  { id: 't1_3_g2', type: 'grass_2', isDecor: true, areaId: 3, tier: 1, ...pos(3, 0.55, 0.45), displayW: 28, displayH: 32, collisionR: 0 },

  // ── AREA 5 (MR) ──────────────────────────────────────────
  { id: 't1_5_g3', type: 'grass_3', isDecor: true, areaId: 5, tier: 1, ...pos(5, 0.30, 0.45), displayW: 28, displayH: 32, collisionR: 0 },
  { id: 't1_5_g5', type: 'grass_5', isDecor: true, areaId: 5, tier: 1, ...pos(5, 0.35, 0.50), displayW: 28, displayH: 28, collisionR: 0 },
  { id: 't1_5_stone', type: 'stone_5', isDecor: true, areaId: 5, tier: 1, ...pos(5, 0.70, 0.65), displayW: 40, displayH: 35, collisionR: 0 },

  // ── AREA 1 (BM) ──────────────────────────────────────────
  { id: 't1_1_s1', type: 'stone_1', isDecor: true, areaId: 1, tier: 1, ...pos(1, 0.25, 0.25), displayW: 40, displayH: 35, collisionR: 0 },
  { id: 't1_1_s9', type: 'stone_9', isDecor: true, areaId: 1, tier: 1, ...pos(1, 0.70, 0.70), displayW: 40, displayH: 35, collisionR: 0 },
  { id: 't1_1_bush', type: 'bush_5', isDecor: true, areaId: 1, tier: 1, ...pos(1, 0.55, 0.50), displayW: 44, displayH: 40, collisionR: 0 },

  // ── AREA 6 (TL) ──────────────────────────────────────────
  { id: 't1_6_s3', type: 'stone_3', isDecor: true, areaId: 6, tier: 1, ...pos(6, 0.20, 0.30), displayW: 40, displayH: 35, collisionR: 0 },
  { id: 't1_6_s13', type: 'stone_13', isDecor: true, areaId: 6, tier: 1, ...pos(6, 0.60, 0.70), displayW: 40, displayH: 35, collisionR: 0 },
  { id: 't1_6_g1', type: 'grass_1', isDecor: true, areaId: 6, tier: 1, ...pos(6, 0.45, 0.50), displayW: 28, displayH: 32, collisionR: 0 },

  // ── AREA 8 (TR) ──────────────────────────────────────────
  { id: 't1_8_g2', type: 'grass_2', isDecor: true, areaId: 8, tier: 1, ...pos(8, 0.30, 0.40), displayW: 28, displayH: 32, collisionR: 0 },
  { id: 't1_8_g4', type: 'grass_4', isDecor: true, areaId: 8, tier: 1, ...pos(8, 0.35, 0.45), displayW: 28, displayH: 24, collisionR: 0 },
  { id: 't1_8_stone', type: 'stone_6', isDecor: true, areaId: 8, tier: 1, ...pos(8, 0.70, 0.65), displayW: 40, displayH: 35, collisionR: 0 },

  // ── AREA 0 (BL) ──────────────────────────────────────────
  { id: 't1_0_s8', type: 'stone_8', isDecor: true, areaId: 0, tier: 1, ...pos(0, 0.20, 0.25), displayW: 40, displayH: 35, collisionR: 0 },
  { id: 't1_0_s14', type: 'stone_14', isDecor: true, areaId: 0, tier: 1, ...pos(0, 0.65, 0.70), displayW: 40, displayH: 35, collisionR: 0 },
  { id: 't1_0_bush', type: 'bush_1', isDecor: true, areaId: 0, tier: 1, ...pos(0, 0.50, 0.50), displayW: 44, displayH: 40, collisionR: 0 },

  // ── AREA 2 (BR) ──────────────────────────────────────────
  // Tier 1: rock + well + ground cover
  { id: 't1_2_g3', type: 'grass_3', isDecor: true, areaId: 2, tier: 1, ...pos(2, 0.30, 0.40), displayW: 28, displayH: 32, collisionR: 0 },
  { id: 't1_2_g6', type: 'grass_6', isDecor: true, areaId: 2, tier: 1, ...pos(2, 0.35, 0.45), displayW: 28, displayH: 32, collisionR: 0 },
  { id: 't1_2_stone', type: 'stone_10', isDecor: true, areaId: 2, tier: 1, ...pos(2, 0.70, 0.65), displayW: 40, displayH: 35, collisionR: 0 },
  { id: 'well_2', type: 'well',
    areaId: 2, tier: 1, ...pos(2, 0.55, 0.28),
    displayW: 100, displayH: 100, collisionR: 48 },

  // Tier 2: tree (moved from tier 1), a second rock, and a bush
  { id: 't2_2_rock', type: 'rock_03', isDecor: true, areaId: 2, tier: 2, ...pos(2, 0.78, 0.60), displayW: 50, displayH: 30, collisionR: 0 },
  { id: 't2_2_bush', type: 'bush_2', isDecor: true, areaId: 2, tier: 2, ...pos(2, 0.18, 0.52), displayW: 48, displayH: 42, collisionR: 0 },
  { id: 't2_2_flower', type: 'flower_4', isDecor: true, areaId: 2, tier: 2, ...pos(2, 0.48, 0.55), displayW: 20, displayH: 18, collisionR: 0 },
  { id: 't2_2_flower2', type: 'flower_9', isDecor: true, areaId: 2, tier: 2, ...pos(2, 0.52, 0.60), displayW: 20, displayH: 18, collisionR: 0 },

  // Tier 3: lantern near the well to light it up
  { id: 'lamp_2', type: 'lamp1',
    areaId: 2, tier: 3, ...pos(2, 0.68, 0.22),
    displayW: 40, displayH: 70, collisionR: 20,
    emitsLight: true, glowRadius: 100, glowOffsetY: 0.12 },

]
