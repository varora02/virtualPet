/**
 * worldConfig.js — single source of truth for all world dimensions.
 *
 * ─── HOW TO RESIZE THE WORLD ──────────────────────────────────────────────────
 * Change AREA_COLS and/or AREA_ROWS.  Everything else (SCENE_W, SCENE_H,
 * fence positions, area bounds, spawn point, …) auto-derives from these two.
 *
 *   AREA_COLS = tiles wide per area  (currently 7)
 *   AREA_ROWS = tiles tall per area  (currently 4)
 *
 * The map is always a fixed 3-column × 3-row grid of areas.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Tile size ─────────────────────────────────────────────────
export const TILE_PX    = 64

// ── Area sizing — the two knobs to turn ───────────────────────
export const AREA_COLS  = 7     // tiles wide per area   (prev: 6)
export const AREA_ROWS  = 4     // tiles tall per area   (prev: 3)

// ── Grid layout — do not change (3×3 area grid) ──────────────
export const GRID_W     = 3     // areas across
export const GRID_H     = 3     // areas down

// ── Derived dimensions — do NOT edit directly ─────────────────
export const MAP_COLS   = GRID_W * AREA_COLS    // 21 tiles wide
export const MAP_ROWS   = GRID_H * AREA_ROWS    // 12 tiles tall
export const AREA_W     = AREA_COLS * TILE_PX   // 448 px per area column
export const AREA_H     = AREA_ROWS * TILE_PX   // 256 px per area row
export const SCENE_W    = MAP_COLS  * TILE_PX   // 1344 px total width
export const SCENE_H    = MAP_ROWS  * TILE_PX   //  768 px total height

// ── Path tile rows at map bottom ─────────────────────────────
// Last PATH_ROWS tile rows become dirt/transition instead of grass.
// Row (MAP_ROWS - PATH_ROWS)     → transition tiles (35/36/56)
// Rows (MAP_ROWS - PATH_ROWS + 1) … (MAP_ROWS - 1) → dirt tiles
export const PATH_ROWS  = 3

// ── Hare constants ────────────────────────────────────────────
export const HARE_PX    = 80    // sprite display size (px)
export const WALK_SPEED = 2.0   // px per 50 ms tick  (~40 px/s)
export const RUN_SPEED  = 8.0   // px per tick  (~160 px/s)
export const MARGIN     = 8     // min px gap between hare and area edge

// ── Spawn position (centre of area 0 — BL) ───────────────────
// Area 0 top-left: x=0, y = AREA_H * (GRID_H - 1) = AREA_H * 2
export const SPAWN_X    = Math.round(AREA_W / 2 - HARE_PX / 2)
export const SPAWN_Y    = Math.round(AREA_H * 2 + AREA_H / 2 - HARE_PX / 2)

// ── Z-index tiers ─────────────────────────────────────────────
//
//   Layer                 z-index
//   ─────────────────     ─────────────────────────────────────
//   Ground tiles          0
//   Grass patches         8
//   Props + Hare          Z_BASE + round(footY)  ≈ 10–788
//   H-fences              Z_BASE + round(fenceY)   (depth-sorted)
//   V-fences              Z_VFENCE                 (above scene content)
//   Night overlay         Z_NIGHT                  (darkens everything)
//   Light glows           Z_GLOW                   (punch through dark)
//
// WHY H-FENCES ARE DEPTH-SORTED:
//   A horizontal fence at y=Y should appear *behind* trees whose foot
//   is above Y and *in front of* trees whose foot is below Y.
//   Using Z_BASE + Y achieves this automatically and stays correct
//   regardless of what new objects are added to the scene.
//
// WHY V-FENCES ARE NOT DEPTH-SORTED:
//   Vertical fences span the full height of an area — they have no
//   single meaningful "depth" position.  Sitting above all scene
//   content (but below night) keeps them consistently visible.

export const Z_BASE     = 10
export const Z_VFENCE   = Z_BASE + SCENE_H + 20   //  798
export const Z_NIGHT    = Z_BASE + SCENE_H + 40   //  818
export const Z_GLOW     = Z_BASE + SCENE_H + 42   //  820

// ── Geometry helpers ──────────────────────────────────────────
/**
 * Return the area ID (0–8) that contains pixel coordinate (x, y).
 *
 * Area layout (3×3 grid):
 *   col       = floor(x / AREA_W)   clamped 0–2
 *   screenRow = floor(y / AREA_H)   clamped 0–2  (0=top, 2=bottom)
 *   areaId    = (2 - screenRow) * 3 + col
 *
 *   TL(6) TM(7) TR(8)   screenRow 0
 *   ML(3) MM(4) MR(5)   screenRow 1
 *   BL(0) BM(1) BR(2)   screenRow 2
 */
export function getAreaAtPoint(x, y) {
  const col       = Math.min(Math.max(Math.floor(x / AREA_W), 0), 2)
  const screenRow = Math.min(Math.max(Math.floor(y / AREA_H), 0), 2)
  return (2 - screenRow) * 3 + col
}
