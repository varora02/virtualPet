/**
 * PathOverlay — renders a dirt path across the map.
 *
 * ─── PATH LAYOUT ─────────────────────────────────────────────────────────────
 * The path starts at the left edge of TL (Area 6), travels east through TM
 * (Area 7), turns south through the TM→MM border, continues south through MM
 * (Area 4), then turns east ending at the right edge of MR (Area 5).
 *
 *   TL(6) ──────── TM(7) ──── ┐
 *                              │
 *                        MM(4) ┘ ────── MR(5)
 *
 * ─── TILE SEMANTICS (verified by visual inspection) ─────────────────────────
 *   ground_path_41 — straight HORIZONTAL (grass top/bottom, dirt centre)
 *   ground_path_38 — straight VERTICAL   (grass left/right, dirt centre)
 *   ground_path_30 — corner LEFT↔BOTTOM  (path from left turns down)
 *   ground_path_34 — corner RIGHT↔TOP    (path from above turns right)
 *
 * ─── ROUTE ───────────────────────────────────────────────────────────────────
 *   Row 1,  cols  0–11 : horizontal (tile 41)
 *   Col 12, row   1    : corner left→down (tile 30)
 *   Col 12, rows  2–4  : vertical (tile 38)
 *   Col 12, row   5    : corner down→right (tile 34)
 *   Row 5,  cols 13–20 : horizontal (tile 41)
 *
 * ─── TILE COORDINATE SYSTEM ──────────────────────────────────────────────────
 * The scene is MAP_COLS × MAP_ROWS tiles (21 × 12 at default config).
 * Each tile is TILE_PX × TILE_PX pixels (64 px).
 * Area layout (3×3 grid, 7 tiles wide × 4 rows tall per area):
 *   TL area 6: tile cols  0–6,  rows 0–3
 *   TM area 7: tile cols  7–13, rows 0–3
 *   MM area 4: tile cols  7–13, rows 4–7
 *   MR area 5: tile cols 14–20, rows 4–7
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { TILE_PX } from '../worldConfig.js'

// Path tile images (256×256 source, rendered at TILE_PX × TILE_PX)
import p38Src from '../assets/tiles/ground_path_38.png'  // vertical straight
import p41Src from '../assets/tiles/ground_path_41.png'  // horizontal straight
import p30Src from '../assets/tiles/ground_path_30.png'  // corner: left → down
import p34Src from '../assets/tiles/ground_path_34.png'  // corner: down → right

const PATH_SRCS = {
  h:   p41Src,   // horizontal straight
  v:   p38Src,   // vertical straight
  cld: p30Src,   // corner: left→down  (top of the south turn)
  cdr: p34Src,   // corner: down→right (bottom of the south turn)
}

/**
 * Build the list of path tile specs.
 * col, row: tile grid coordinates (0-based).
 * src: key into PATH_SRCS.
 */
function buildPathTiles() {
  const tiles = []

  // ── Horizontal segment (top): row 1, cols 0–11 ───────────────
  for (let col = 0; col <= 11; col++) {
    tiles.push({ col, row: 1, src: 'h' })
  }

  // ── Corner: path coming from left turns south ─────────────────
  tiles.push({ col: 12, row: 1, src: 'cld' })

  // ── Vertical segment: col 12, rows 2–4 ───────────────────────
  for (let row = 2; row <= 4; row++) {
    tiles.push({ col: 12, row, src: 'v' })
  }

  // ── Corner: path coming from above turns east ─────────────────
  tiles.push({ col: 12, row: 5, src: 'cdr' })

  // ── Horizontal segment (bottom): row 5, cols 13–20 ───────────
  for (let col = 13; col <= 20; col++) {
    tiles.push({ col, row: 5, src: 'h' })
  }

  return tiles
}

const PATH_TILES = buildPathTiles()

// Path tiles sit just above the ground (z=2), below shadows (z=3)
// and well below depth-sorted props (Z_BASE+…).
const Z_PATH = 2

export default function PathOverlay() {
  return (
    <>
      {PATH_TILES.map(({ col, row, src }, i) => (
        <img
          key={`path_${col}_${row}_${i}`}
          src={PATH_SRCS[src]}
          alt=""
          draggable={false}
          style={{
            position:       'absolute',
            left:           col * TILE_PX,
            top:            row * TILE_PX,
            width:          TILE_PX,
            height:         TILE_PX,
            zIndex:         Z_PATH,
            pointerEvents:  'none',
            userSelect:     'none',
            imageRendering: 'pixelated',
          }}
        />
      ))}
    </>
  )
}
