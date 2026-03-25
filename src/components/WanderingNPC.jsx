/**
 * WanderingNPC — generic ground-wandering NPC sprite.
 *
 * Handles movement, collision avoidance, direction tracking, and rendering.
 * Individual NPCs only need to provide their sprite sheet + CSS animation class.
 *
 * ─── HOW TO ADD A NEW NPC ──────────────────────────────────────────────────
 * 1. Create the sprite sheet (CSS steps() animation, one row per direction).
 * 2. Add a CSS file with @keyframes for the walk cycle.
 * 3. Wrap WanderingNPC with your NPC component and pass the sprite/style props.
 *
 * Example:
 *   export default function SquirrelNPC({ unlockedAreas }) {
 *     const offsets = directionOffsets(48)
 *     return (
 *       <WanderingNPC
 *         unlockedAreas={unlockedAreas}
 *         pxSize={48}
 *         spriteUrl={squirrelWalkUrl}
 *         sheetW={384}  // 8 frames × 48px
 *         sheetH={192}  // 4 directions × 48px
 *         animClass="squirrel-walk"
 *         dirOffsets={offsets}
 *       />
 *     )
 *   }
 *
 * ─── PROPS ────────────────────────────────────────────────────────────────
 *   unlockedAreas   number[]   Areas this NPC may enter.
 *   pxSize          number     Displayed sprite size in px (square frame).
 *   walkSpeed       number     px per 50 ms tick (default: WALK_SPEED ≈ 40 px/s).
 *   spriteUrl       string     Sprite sheet asset URL.
 *   sheetW          number     Total displayed sheet width in px.
 *   sheetH          number     Total displayed sheet height in px.
 *   animClass       string     CSS class that drives the walk-cycle animation.
 *   dirOffsets      object     { down, up, left, right } → backgroundPositionY offset.
 *                              Use directionOffsets(pxSize) from spriteUtils to generate.
 *   zBase           number     Base z-index (default: Z_BASE from worldConfig).
 *   zBoost          number     Extra z-index offset (default: 0).
 *   style           object     Optional additional inline styles applied to the div.
 */

import { useState, useEffect, useRef } from 'react'
import {
  AREA_W, AREA_H,
  WALK_SPEED, MARGIN,
  Z_BASE,
  getAreaAtPoint,
} from '../worldConfig.js'
import { WORLD_PROPS } from '../worldData.js'
import { randomWanderTarget } from '../hooks/useHareMovement.js'
import { footDepthZ } from '../hooks/spriteUtils.js'

// ── Module-level spawn helper ──────────────────────────────────
function randomSpawnInArea(areaId, pxSize) {
  const col       = areaId % 3
  const screenRow = 2 - Math.floor(areaId / 3)
  return {
    x: col * AREA_W + MARGIN + Math.random() * (AREA_W - pxSize - MARGIN * 2),
    y: screenRow * AREA_H + MARGIN + Math.random() * (AREA_H - pxSize - MARGIN * 2),
  }
}

export default function WanderingNPC({
  unlockedAreas  = [0],
  pxSize         = 48,
  walkSpeed      = WALK_SPEED,
  spriteUrl,
  sheetW,
  sheetH,
  animClass      = '',
  dirOffsets     = { down: 0, up: 0, left: 0, right: 0 },
  zBase          = Z_BASE,
  zBoost         = 0,
  style          = {},
}) {
  const [pos, setPos]             = useState(() => randomSpawnInArea(unlockedAreas[0] ?? 0, pxSize))
  const [direction, setDirection] = useState('right')

  const posRef           = useRef(pos)
  const dirRef           = useRef('right')
  const unlockedRef      = useRef(unlockedAreas)
  const wanderTargetRef  = useRef(() => randomWanderTarget(unlockedAreas, pxSize))
  const stuckRef         = useRef(0)
  const prevDistRef      = useRef(Infinity)

  // Keep unlocked areas ref current
  useEffect(() => { unlockedRef.current = unlockedAreas }, [unlockedAreas])

  // ── Movement tick (50 ms) ──────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const p       = posRef.current
      const unlocked = unlockedRef.current

      // ── Collision helpers ────────────────────────────────────
      const blockingProp = (px, py) => {
        const cx = px + pxSize / 2, cy = py + pxSize / 2
        return WORLD_PROPS.find(prop =>
          prop.collisionR > 0 &&
          Math.hypot(cx - (prop.x + prop.displayW / 2), cy - (prop.y + prop.displayH / 2)) < prop.collisionR + pxSize / 2
        ) ?? null
      }

      const passable = (px, py) =>
        unlocked.includes(getAreaAtPoint(px + pxSize / 2, py + pxSize / 2)) && !blockingProp(px, py)

      const clamp = (nx, ny) => {
        if (passable(nx, ny))    return { x: nx, y: ny }
        if (passable(nx, p.y))   return { x: nx, y: p.y }
        if (passable(p.x, ny))   return { x: p.x, y: ny }

        // Escape depenetration — push away from blocking prop
        const stuck = blockingProp(p.x, p.y)
        if (stuck) {
          const pcx = stuck.x + stuck.displayW / 2
          const pcy = stuck.y + stuck.displayH / 2
          const ex  = p.x + pxSize / 2 - pcx
          const ey  = p.y + pxSize / 2 - pcy
          const ed  = Math.hypot(ex, ey) || 1
          const escX = p.x + (ex / ed) * walkSpeed
          const escY = p.y + (ey / ed) * walkSpeed
          if (unlocked.includes(getAreaAtPoint(escX + pxSize / 2, escY + pxSize / 2)))
            return { x: escX, y: escY }
        }

        // Stuck against fence — pick fresh target
        wanderTargetRef.current = randomWanderTarget(unlocked, pxSize)
        return { x: p.x, y: p.y }
      }

      // ── Walk toward wander target ────────────────────────────
      const wt   = wanderTargetRef.current
      const dx   = wt.x - p.x, dy = wt.y - p.y
      const dist = Math.hypot(dx, dy)

      if (dist < walkSpeed + 1) {
        // Arrived — pick next target
        wanderTargetRef.current = randomWanderTarget(unlocked, pxSize)
        stuckRef.current        = 0
        prevDistRef.current     = Infinity
        return
      }

      const nx      = p.x + (dx / dist) * walkSpeed
      const ny      = p.y + (dy / dist) * walkSpeed
      const clamped = clamp(nx, ny)

      // ── Progress check (anti-grind) ──────────────────────────
      if (dist < prevDistRef.current - 0.5) {
        stuckRef.current = 0
      } else {
        stuckRef.current += 1
        if (stuckRef.current >= 20) {
          wanderTargetRef.current = randomWanderTarget(unlocked, pxSize)
          stuckRef.current        = 0
          prevDistRef.current     = Infinity
        }
      }
      prevDistRef.current = dist

      // ── Update direction ─────────────────────────────────────
      const newDir = Math.abs(dx) >= Math.abs(dy)
        ? (dx >= 0 ? 'right' : 'left')
        : (dy >= 0 ? 'down'  : 'up')
      if (newDir !== dirRef.current) {
        dirRef.current = newDir
        setDirection(newDir)
      }

      posRef.current = clamped
      setPos(clamped)
    }, 50)

    return () => clearInterval(id)
  }, [pxSize, walkSpeed])

  const zIndex    = footDepthZ(pos.y, pxSize, zBase, zBoost)
  const dirOffset = dirOffsets[direction] ?? 0

  return (
    <div
      className={animClass}
      style={{
        position:            'absolute',
        left:                Math.round(pos.x),
        top:                 Math.round(pos.y),
        width:               pxSize,
        height:              pxSize,
        backgroundImage:     spriteUrl ? `url(${spriteUrl})` : 'none',
        backgroundSize:      `${sheetW}px ${sheetH}px`,
        backgroundPositionY: `${dirOffset}px`,
        backgroundRepeat:    'no-repeat',
        imageRendering:      'pixelated',
        zIndex,
        pointerEvents:       'none',
        ...style,
      }}
    />
  )
}
