/**
 * HaroldNPC — Harold the hare as a world NPC.
 *
 * Appears once all 9 areas are unlocked. Wanders autonomously and follows
 * a simple daily routine: eats at grass patches, drinks at the well, and
 * rests under trees when tired.
 *
 * State machine:
 *   wander → going_eat → eating → wander
 *          → going_drink → drinking → wander
 *          → going_rest → resting → wander
 *
 * Uses the existing hare sprite sheets + .hare-walker / .hare-state-* CSS.
 * Reading animations intentionally excluded (Harold is not a studier as NPC).
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { WORLD_PROPS } from '../worldData.js'
import {
  HARE_PX, WALK_SPEED,
  AREA_W, AREA_H,
  MARGIN, Z_BASE,
  getAreaAtPoint,
} from '../worldConfig.js'
import { directionOffsets, footDepthZ } from '../hooks/spriteUtils.js'
import { randomWanderTarget } from '../hooks/usePetMovement.js'

// Sprites
import hareWalkShadow from '../assets/sprites/Hare_Walk_with_shadow.png'
import hareRunShadow  from '../assets/sprites/Hare_Run_with_shadow.png'
import hareEating     from '../assets/sprites/Hare_Eating.png'
import hareDrinking   from '../assets/sprites/Hare_Drinking.png'
import hareIdle       from '../assets/sprites/Hare_Idle.png'

// Direction row offsets (down=0, up=-80, left=-160, right=-240)
const DIR_OFFSETS = directionOffsets(HARE_PX)

// Harold wanders a touch slower than player-controlled — more casual
const HAROLD_SPEED = WALK_SPEED * 0.75

// How often Harold decides to eat / drink / rest (ms, randomised per trigger)
const EAT_MIN    = 60_000
const EAT_MAX    = 120_000
const DRINK_MIN  = 90_000
const DRINK_MAX  = 180_000
const REST_MIN   = 180_000
const REST_MAX   = 240_000
const ACTION_DUR_EAT   = 2_500   // eat animation hold (ms)
const ACTION_DUR_DRINK = 2_500
const REST_MIN_DUR     = 10_000
const REST_MAX_DUR     = 20_000

const ALL_AREAS = [0, 1, 2, 3, 4, 5, 6, 7, 8]

// ── Prop helpers ──────────────────────────────────────────────────────────────

/** Visible decor-grass props (Harold can "eat" near any of them) */
const GRASS_PROPS = WORLD_PROPS.filter(p => p.type.startsWith('decor_grass_'))

/** The well */
const WELL_PROP   = WORLD_PROPS.find(p => p.type === 'well') ?? null

/** Main (non-forest) trees Harold can rest under */
const TREE_PROPS  = WORLD_PROPS.filter(
  p => p.interactType === 'rest' && !p.id.startsWith('forest_')
)

function randomSpawnPos() {
  // Start Harold near the centre of the world (area 4 = MM)
  const col = 1, screenRow = 1
  return {
    x: col * AREA_W + MARGIN + Math.random() * (AREA_W - HARE_PX - MARGIN * 2),
    y: screenRow * AREA_H + MARGIN + Math.random() * (AREA_H - HARE_PX - MARGIN * 2),
  }
}

function pickTarget(prop) {
  // Walk to just in front of the prop's centre
  return {
    x: prop.x + prop.displayW / 2 - HARE_PX / 2,
    y: prop.y + prop.displayH - HARE_PX,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HaroldNPC({ allAreasUnlocked = false, visibleProps = [] }) {
  const [pos, setPos]           = useState(randomSpawnPos)
  const [direction, setDirection] = useState('down')
  const [actionState, setActionState] = useState('wander') // wander | going_eat | eating | going_drink | drinking | going_rest | resting

  const posRef        = useRef(pos)
  const dirRef        = useRef('down')
  const actionRef     = useRef('wander')
  const targetRef     = useRef(randomWanderTarget(ALL_AREAS, HARE_PX))
  const stuckRef      = useRef(0)
  const prevDistRef   = useRef(Infinity)
  const actionTimerRef = useRef(null)
  const eatTimerRef   = useRef(null)
  const drinkTimerRef = useRef(null)
  const restTimerRef  = useRef(null)

  // Sync refs
  useEffect(() => { posRef.current = pos }, [pos])

  // ── Collision helpers ──────────────────────────────────────────────────────

  const blockingProp = useCallback((px, py) => {
    const cx = px + HARE_PX / 2, cy = py + HARE_PX / 2
    return WORLD_PROPS.find(prop =>
      prop.collisionR > 0 &&
      Math.hypot(cx - (prop.x + prop.displayW / 2), cy - (prop.y + prop.displayH / 2)) < prop.collisionR + HARE_PX / 2
    ) ?? null
  }, [])

  const passable = useCallback((px, py) => {
    return ALL_AREAS.includes(getAreaAtPoint(px + HARE_PX / 2, py + HARE_PX / 2)) &&
           !blockingProp(px, py)
  }, [blockingProp])

  const clampPos = useCallback((nx, ny, p) => {
    if (passable(nx, ny))   return { x: nx, y: ny }
    if (passable(nx, p.y))  return { x: nx, y: p.y }
    if (passable(p.x, ny))  return { x: p.x, y: ny }
    // Push away from blocking prop
    const stuck = blockingProp(p.x, p.y)
    if (stuck) {
      const ex = p.x + HARE_PX / 2 - (stuck.x + stuck.displayW / 2)
      const ey = p.y + HARE_PX / 2 - (stuck.y + stuck.displayH / 2)
      const ed = Math.hypot(ex, ey) || 1
      const escX = p.x + (ex / ed) * HAROLD_SPEED
      const escY = p.y + (ey / ed) * HAROLD_SPEED
      if (ALL_AREAS.includes(getAreaAtPoint(escX + HARE_PX / 2, escY + HARE_PX / 2)))
        return { x: escX, y: escY }
    }
    return { x: p.x, y: p.y }
  }, [passable, blockingProp])

  // ── Transition into an action (eat/drink/rest) ─────────────────────────────

  const startAction = useCallback((type) => {
    let prop = null
    if (type === 'eat') {
      const available = GRASS_PROPS.length > 0 ? GRASS_PROPS : null
      if (!available) return
      prop = available[Math.floor(Math.random() * available.length)]
    } else if (type === 'drink') {
      prop = WELL_PROP
      if (!prop) return
    } else if (type === 'rest') {
      if (TREE_PROPS.length === 0) return
      prop = TREE_PROPS[Math.floor(Math.random() * TREE_PROPS.length)]
    }
    if (!prop) return
    targetRef.current = pickTarget(prop)
    actionRef.current = `going_${type}`
    setActionState(`going_${type}`)
  }, [])

  // ── Schedule recurring activities ─────────────────────────────────────────

  const scheduleEat = useCallback(() => {
    clearTimeout(eatTimerRef.current)
    const delay = EAT_MIN + Math.random() * (EAT_MAX - EAT_MIN)
    eatTimerRef.current = setTimeout(() => {
      if (actionRef.current === 'wander') startAction('eat')
      scheduleEat()
    }, delay)
  }, [startAction])

  const scheduleDrink = useCallback(() => {
    clearTimeout(drinkTimerRef.current)
    const delay = DRINK_MIN + Math.random() * (DRINK_MAX - DRINK_MIN)
    drinkTimerRef.current = setTimeout(() => {
      if (actionRef.current === 'wander') startAction('drink')
      scheduleDrink()
    }, delay)
  }, [startAction])

  const scheduleRest = useCallback(() => {
    clearTimeout(restTimerRef.current)
    const delay = REST_MIN + Math.random() * (REST_MAX - REST_MIN)
    restTimerRef.current = setTimeout(() => {
      if (actionRef.current === 'wander') startAction('rest')
      scheduleRest()
    }, delay)
  }, [startAction])

  // Start schedules on mount, clear on unmount
  useEffect(() => {
    if (!allAreasUnlocked) return
    // Stagger initial timers so eat/drink/rest don't fire simultaneously
    eatTimerRef.current   = setTimeout(() => { scheduleEat()   }, 30_000)
    drinkTimerRef.current = setTimeout(() => { scheduleDrink() }, 50_000)
    restTimerRef.current  = setTimeout(() => { scheduleRest()  }, 80_000)
    return () => {
      clearTimeout(eatTimerRef.current)
      clearTimeout(drinkTimerRef.current)
      clearTimeout(restTimerRef.current)
      clearTimeout(actionTimerRef.current)
    }
  }, [allAreasUnlocked, scheduleEat, scheduleDrink, scheduleRest])

  // ── Movement tick (50 ms) ─────────────────────────────────────────────────

  useEffect(() => {
    if (!allAreasUnlocked) return

    const id = setInterval(() => {
      const p      = posRef.current
      const action = actionRef.current

      // Not moving during action animations
      if (action === 'eating' || action === 'drinking' || action === 'resting') return

      const tgt  = targetRef.current
      const dx   = tgt.x - p.x
      const dy   = tgt.y - p.y
      const dist = Math.hypot(dx, dy)

      // Arrived at target
      if (dist < HAROLD_SPEED + 2) {
        stuckRef.current    = 0
        prevDistRef.current = Infinity

        if (action === 'going_eat') {
          actionRef.current = 'eating'
          setActionState('eating')
          clearTimeout(actionTimerRef.current)
          actionTimerRef.current = setTimeout(() => {
            actionRef.current = 'wander'
            setActionState('wander')
            targetRef.current = randomWanderTarget(ALL_AREAS, HARE_PX)
          }, ACTION_DUR_EAT)
        } else if (action === 'going_drink') {
          actionRef.current = 'drinking'
          setActionState('drinking')
          clearTimeout(actionTimerRef.current)
          actionTimerRef.current = setTimeout(() => {
            actionRef.current = 'wander'
            setActionState('wander')
            targetRef.current = randomWanderTarget(ALL_AREAS, HARE_PX)
          }, ACTION_DUR_DRINK)
        } else if (action === 'going_rest') {
          actionRef.current = 'resting'
          setActionState('resting')
          clearTimeout(actionTimerRef.current)
          const restDur = REST_MIN_DUR + Math.random() * (REST_MAX_DUR - REST_MIN_DUR)
          actionTimerRef.current = setTimeout(() => {
            actionRef.current = 'wander'
            setActionState('wander')
            targetRef.current = randomWanderTarget(ALL_AREAS, HARE_PX)
          }, restDur)
        } else {
          // wander — pick next waypoint
          targetRef.current = randomWanderTarget(ALL_AREAS, HARE_PX)
        }
        return
      }

      // Step toward target
      const nx = p.x + (dx / dist) * HAROLD_SPEED
      const ny = p.y + (dy / dist) * HAROLD_SPEED
      const next = clampPos(nx, ny, p)

      // Anti-stuck
      if (dist < prevDistRef.current - 0.5) {
        stuckRef.current = 0
      } else {
        stuckRef.current += 1
        if (stuckRef.current >= 20) {
          targetRef.current = randomWanderTarget(ALL_AREAS, HARE_PX)
          stuckRef.current  = 0
          prevDistRef.current = Infinity
        }
      }
      prevDistRef.current = dist

      // Update direction
      const newDir = Math.abs(dx) >= Math.abs(dy)
        ? (dx >= 0 ? 'right' : 'left')
        : (dy >= 0 ? 'down'  : 'up')
      if (newDir !== dirRef.current) {
        dirRef.current = newDir
        setDirection(newDir)
      }

      posRef.current = next
      setPos(next)
    }, 50)

    return () => clearInterval(id)
  }, [allAreasUnlocked, clampPos])

  // ── Render ────────────────────────────────────────────────────────────────

  if (!allAreasUnlocked) return null

  // Sprite + CSS class based on action state
  const isGoingAnywhere = actionState === 'going_eat' || actionState === 'going_drink' || actionState === 'going_rest'
  const spriteUrl = actionState === 'eating'
    ? hareEating
    : actionState === 'drinking'
      ? hareDrinking
      : (actionState === 'resting')
        ? hareIdle
        : isGoingAnywhere
          ? hareRunShadow
          : hareWalkShadow

  const cssClass = actionState === 'eating'
    ? 'hare-state-eat'
    : actionState === 'drinking'
      ? 'hare-state-drink'
      : actionState === 'resting'
        ? 'hare-state-rest'
        : isGoingAnywhere
          ? 'hare-state-run'
          : 'hare-state-walk'

  const dirOffset = DIR_OFFSETS[direction] ?? 0
  const zIndex    = footDepthZ(pos.y, HARE_PX, Z_BASE)

  return (
    <div
      className={`hare-walker ${cssClass}`}
      style={{
        left:             `${Math.round(pos.x)}px`,
        top:              `${Math.round(pos.y)}px`,
        zIndex,
        '--sprite-url':   `url(${spriteUrl})`,
        '--dir-offset':   `${dirOffset}px`,
        pointerEvents:    'none',
        opacity:          0.95,
      }}
      aria-hidden="true"
      title="Harold"
    />
  )
}
