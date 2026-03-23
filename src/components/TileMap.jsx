/**
 * TileMap — renders the ground tile grid.
 *
 * All dimensions come from worldConfig.js.
 * To change tile sizes or add new tiles, edit TILE_SRCS and buildRow().
 *
 * Tile sources:
 *   Tileset 1 (craftpix "Top-Down Simple Summer") — grass
 *     g1 = ground_43  (primary grass)
 *     g2 = ground_52  (alternate grass)
 *
 *   Tileset 2 (craftpix "Fields") — path/transition
 *     f35, f36, f56   — top row of path, visually "touching grass"
 *     f01, f14–f16, f23 — dirt/earth interior tiles
 *
 * Layout rule (derived from worldConfig PATH_ROWS = 3):
 *   rows 0 … MAP_ROWS-4  : grass checkerboard  (g1 / g2)
 *   row  MAP_ROWS-3       : transition          (f35 / f36 / f56)
 *   rows MAP_ROWS-2 … -1  : dirt               (f01 / f14 / f15 / f16 / f23)
 */

import { MAP_COLS, MAP_ROWS, TILE_PX, PATH_ROWS } from '../worldConfig.js'

// ── Tileset 1 — grass ──────────────────────────────────────────
import g1Src  from '../assets/tiles/ground_43.png'
import g2Src  from '../assets/tiles/ground_52.png'

// ── Tileset 2 — transition row ────────────────────────────────
import f35Src from '../assets/tiles/fields_35.png'
import f36Src from '../assets/tiles/fields_36.png'
import f56Src from '../assets/tiles/fields_56.png'

// ── Tileset 2 — dirt rows ─────────────────────────────────────
import f01Src from '../assets/tiles/fields_01.png'
import f14Src from '../assets/tiles/fields_14.png'
import f15Src from '../assets/tiles/fields_15.png'
import f16Src from '../assets/tiles/fields_16.png'
import f23Src from '../assets/tiles/fields_23.png'

const TILE_SRCS = {
  g1:  g1Src,
  g2:  g2Src,
  f35: f35Src,
  f36: f36Src,
  f56: f56Src,
  f01: f01Src,
  f14: f14Src,
  f15: f15Src,
  f16: f16Src,
  f23: f23Src,
}

// Grass ends at MAP_ROWS - PATH_ROWS - 1  (inclusive)
const TRANS_ROW = MAP_ROWS - PATH_ROWS          // first non-grass row (transition)
const DIRT_ROW  = MAP_ROWS - PATH_ROWS + 1      // first pure-dirt row

const TRANS_PAT = ['f35', 'f36', 'f56']
const DIRT_PAT  = ['f01', 'f14', 'f15', 'f16', 'f23']

function buildRow(rowIdx) {
  if (rowIdx === TRANS_ROW) {
    return Array(MAP_COLS).fill(null).map((_, col) => TRANS_PAT[col % TRANS_PAT.length])
  }
  if (rowIdx >= DIRT_ROW) {
    return Array(MAP_COLS).fill(null).map((_, col) => DIRT_PAT[col % DIRT_PAT.length])
  }
  // Grass checkerboard
  return Array(MAP_COLS).fill(null).map((_, col) =>
    (rowIdx + col) % 2 === 0 ? 'g1' : 'g2'
  )
}

const MAP_GRID = Array(MAP_ROWS).fill(null).map((_, r) => buildRow(r))

export default function TileMap() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {MAP_GRID.map((row, rowIdx) =>
        row.map((tileId, colIdx) => (
          <img
            key={`${rowIdx}-${colIdx}`}
            src={TILE_SRCS[tileId]}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left:  colIdx * TILE_PX,
              top:   rowIdx * TILE_PX,
              width:  TILE_PX,
              height: TILE_PX,
              display: 'block',
              imageRendering: 'pixelated',
              userSelect: 'none',
            }}
          />
        ))
      )}
    </div>
  )
}
