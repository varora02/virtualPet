/**
 * FenceOverlay — wooden fence segments between the 9 world areas.
 *
 * ─── Z-INDEX RULE (see worldConfig.js for full explanation) ──────────────────
 *
 *   Horizontal fences → DEPTH-SORTED:
 *     z = Z_BASE + Math.round(fenceY + FENCE_THICK / 2)
 *
 *     This makes a fence at y=Y appear *behind* objects whose foot is
 *     above Y (e.g. a tree at y=Y placed at top of area) and *in front*
 *     of objects whose foot is below Y.  Future props follow automatically.
 *
 *   Vertical fences → Z_VFENCE (above all scene content, below night):
 *     Vertical fences span the full area height and have no single depth
 *     position.  They sit above everything but below the night overlay,
 *     remaining always crisp on both sides.
 *
 * ─── Area grid ───────────────────────────────────────────────────────────────
 *   TL(6) TM(7) TR(8)   y: 0       → AREA_H-1
 *   ML(3) MM(4) MR(5)   y: AREA_H  → 2*AREA_H-1
 *   BL(0) BM(1) BR(2)   y: 2*AREA_H → SCENE_H-1  ← hare spawns in BL
 */

import { AREA_W, AREA_H, SCENE_H, Z_BASE, Z_VFENCE } from '../worldConfig.js'
import hFenceUrl from '../assets/tiles/fence_horizontal.png'
import vFenceUrl from '../assets/tiles/fence_vertical.png'

const FENCE_THICK = 40  // display thickness (px)

const FENCE_SEGMENTS = [
  // ── Vertical (left/right neighbours) ─────────────────────────
  { axis: 'v', x: AREA_W,   y1: AREA_H*2, y2: AREA_H*3, a: 0, b: 1 },  // BL|BM
  { axis: 'v', x: AREA_W*2, y1: AREA_H*2, y2: AREA_H*3, a: 1, b: 2 },  // BM|BR
  { axis: 'v', x: AREA_W,   y1: AREA_H,   y2: AREA_H*2, a: 3, b: 4 },  // ML|MM
  { axis: 'v', x: AREA_W*2, y1: AREA_H,   y2: AREA_H*2, a: 4, b: 5 },  // MM|MR
  { axis: 'v', x: AREA_W,   y1: 0,        y2: AREA_H,   a: 6, b: 7 },  // TL|TM
  { axis: 'v', x: AREA_W*2, y1: 0,        y2: AREA_H,   a: 7, b: 8 },  // TM|TR
  // ── Horizontal (top/bottom neighbours) ───────────────────────
  { axis: 'h', y: AREA_H*2, x1: 0,       x2: AREA_W,   a: 0, b: 3 },  // BL|ML
  { axis: 'h', y: AREA_H*2, x1: AREA_W,  x2: AREA_W*2, a: 1, b: 4 },  // BM|MM
  { axis: 'h', y: AREA_H*2, x1: AREA_W*2,x2: AREA_W*3, a: 2, b: 5 },  // BR|MR
  { axis: 'h', y: AREA_H,   x1: 0,       x2: AREA_W,   a: 3, b: 6 },  // ML|TL
  { axis: 'h', y: AREA_H,   x1: AREA_W,  x2: AREA_W*2, a: 4, b: 7 },  // MM|TM
  { axis: 'h', y: AREA_H,   x1: AREA_W*2,x2: AREA_W*3, a: 5, b: 8 },  // MR|TR
]

const segW = Math.round(220 * FENCE_THICK / 80)   // aspect-correct tile width
const segH = Math.round(220 * FENCE_THICK / 80)

export default function FenceOverlay({ unlockedAreas = [0] }) {
  const unlocked = new Set(unlockedAreas)

  return (
    <>
      {FENCE_SEGMENTS.map((seg, i) => {
        const visible = !(unlocked.has(seg.a) && unlocked.has(seg.b))

        // ── Z-index rule ─────────────────────────────────────────
        // H-fence: depth-sorted (foot = fenceY + half thickness)
        // V-fence: Z_VFENCE (above all scene content, below night)
        const zIndex = seg.axis === 'h'
          ? Z_BASE + Math.round(seg.y + FENCE_THICK / 2)
          : Z_VFENCE

        const base = {
          position: 'absolute',
          opacity:  visible ? 1 : 0,
          transition: 'opacity 0.9s ease',
          zIndex,
          pointerEvents: 'none',
          userSelect: 'none',
        }

        if (seg.axis === 'h') {
          return (
            <div key={i} style={{
              ...base,
              left:   seg.x1,
              top:    seg.y - FENCE_THICK / 2,
              width:  seg.x2 - seg.x1,
              height: FENCE_THICK,
              backgroundImage:    `url(${hFenceUrl})`,
              backgroundRepeat:   'repeat-x',
              backgroundSize:     `${segW}px ${FENCE_THICK}px`,
              backgroundPosition: 'center',
            }} />
          )
        }
        return (
          <div key={i} style={{
            ...base,
            left:   seg.x - FENCE_THICK / 2,
            top:    seg.y1,
            width:  FENCE_THICK,
            height: seg.y2 - seg.y1,
            backgroundImage:    `url(${vFenceUrl})`,
            backgroundRepeat:   'repeat-y',
            backgroundSize:     `${FENCE_THICK}px ${segH}px`,
            backgroundPosition: 'center',
          }} />
        )
      })}
    </>
  )
}
