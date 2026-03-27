/**
 * usePetMovement — owns all pet position, direction, and action-state logic.
 *
 * ─── RESPONSIBILITIES ─────────────────────────────────────────────────────────
 * • Maintains petPos, direction, eatState (the hare's current action).
 * • Runs the 50 ms movement interval (walk / run / dying-walk).
 * • Reacts to feedTrigger, waterTrigger, restTrigger, and isLevelingUp props.
 * • Clamps all movement to the unlocked area set (no fence crossing).
 * • Fires onAte callback when eating completes.
 *
 * ─── RETURNED VALUES ──────────────────────────────────────────────────────────
 *   petPos       : { x, y }  — current hare pixel position (top-left of sprite)
 *   direction    : string    — 'up' | 'down' | 'left' | 'right'
 *   eatState     : string    — 'idle' | 'going' | 'going_water' | 'eating' |
 *                              'drinking' | 'resting' | 'leveling'
 *   arrivedAtTree: boolean   — true when tired hare has reached its rest tree
 *
 * ─── ADDING NEW INTERACTIONS ──────────────────────────────────────────────────
 * Each new interaction follows the same pattern:
 *   1. Add a trigger prop (e.g. playTrigger = 0).
 *   2. Add a useEffect that reacts to it: set eatStateRef/eatState to a new
 *      state string, navigate to a target, then reset to 'idle'.
 *   3. Add a frozen-state guard in the movement loop (the `if (state === ...)` block).
 *   4. Optionally add a new `if (state === 'going_play')` run branch before idle wander.
 *   5. Map the new state string → sprite / CSS class in Pet.jsx.
 *
 * ─── FENCE CLAMPING ───────────────────────────────────────────────────────────
 * clampToUnlocked(nx, ny, pos) tries:
 *   1. Full move (nx, ny)
 *   2. X-only slide (nx, pos.y)
 *   3. Y-only slide (pos.x, ny)
 *   4. Stay put + pick a new wander target
 * All four movement modes (dying-walk, going, going_water, idle) go through this.
 */

import { useState, useEffect, useRef } from 'react'
import {
  AREA_W, AREA_H,
  HARE_PX, MARGIN,
  WALK_SPEED, RUN_SPEED,
  SPAWN_X, SPAWN_Y,
  getAreaAtPoint,
} from '../worldConfig.js'
import { WORLD_PROPS } from '../worldData.js'

// ── Internal helpers ──────────────────────────────────────────

/** Random point inside one area, respecting MARGIN and pet size. */
function randomPointInArea(areaId, petSizePx) {
  const col       = areaId % 3
  const screenRow = 2 - Math.floor(areaId / 3)
  const ax = col * AREA_W, ay = screenRow * AREA_H
  return {
    x: ax + MARGIN + Math.random() * (AREA_W - petSizePx - MARGIN * 2),
    y: ay + MARGIN + Math.random() * (AREA_H - petSizePx - MARGIN * 2),
  }
}

/**
 * Pick a random wander target across all unlocked areas.
 * Rejects points inside any prop's collision radius (up to 60 tries).
 *
 * @param {number[]} unlockedAreas
 * @param {number}   petSizePx — displayed size of the pet sprite (default: HARE_PX)
 */
export function randomWanderTarget(unlockedAreas, petSizePx = HARE_PX) {
  for (let i = 0; i < 60; i++) {
    const id = unlockedAreas[Math.floor(Math.random() * unlockedAreas.length)]
    const pt = randomPointInArea(id, petSizePx)
    const cx = pt.x + petSizePx / 2, cy = pt.y + petSizePx / 2
    const blocked = WORLD_PROPS.some(p =>
      p.collisionR > 0 &&
      Math.hypot(cx - (p.x + p.displayW / 2), cy - (p.y + p.displayH / 2)) < p.collisionR + petSizePx / 2
    )
    if (!blocked) return pt
  }
  return randomPointInArea(unlockedAreas[0], petSizePx)  // fallback
}

// ─────────────────────────────────────────────────────────────

/**
 * @param {{
 *   pet:                object   — pet stats (hunger, thirst, energy, happiness)
 *   petSizePx:          number   — displayed sprite size in px (default: HARE_PX = 64)
 *   unlockedAreas:      number[] — area IDs the hare can enter
 *   feedTrigger:        number   — incremented by parent to trigger a feed run
 *   restTrigger:        number   — incremented to trigger a rest pause
 *   waterTrigger:       number   — incremented to trigger a water run
 *   studyTrigger:       number   — start study: hare walks to nearest tree → 'study'
 *   studyPauseTrigger:  number   — pause study: switches to 'study_pause' (row 1)
 *   studyResumeTrigger: number   — resume study: switches back to 'study' (rows 3+4)
 *   studyStopTrigger:   number   — stop study: returns to 'idle'
 *   celebrateTrigger:   number   — incremented to trigger a victory lap through unlocked areas
 *   isLevelingUp:       boolean  — true during level-up flash
 *   isPaused:           boolean  — true while level popup is open (freezes movement)
 *   grassPatchesRef:    React.MutableRefObject — live array of grass patches
 *   hideGrassPatch:     (i: number) => void
 *   restoreGrassPatch:  (i: number) => void
 *   onAte:              (() => void) | null
 *   onLevelUpComplete:  (() => void) | null
 * }} props
 */
export function usePetMovement({
  pet,
  petSizePx = HARE_PX,
  unlockedAreas,
  visibleProps,        // tier-filtered props — hare only targets trees that are visible
  feedTrigger,
  restTrigger,
  scaredTrigger = 0,  // incremented when pet is clicked too many times — runs away
  waterTrigger,
  studyTrigger       = 0,
  studyPauseTrigger  = 0,
  studyResumeTrigger = 0,
  studyStopTrigger   = 0,
  celebrateTrigger   = 0,
  greetTrigger       = 0,        // Bubby: run to center of current area then lick
  onGreetArrived     = null,     // called when Bubby reaches the greet target
  wellYOffset        = 0,        // extra y offset for water target (negative = higher up the well)
  catAnimFreezeRef   = null,     // ref set to true by Pet.jsx during grooming/special anims
  isLevelingUp,
  isPaused,
  grassPatchesRef,
  hideGrassPatch,
  restoreGrassPatch,
  onAte,
  onLevelUpComplete,
}) {
  // Props available for interactions — fall back to full list if visibleProps not given
  const interactableProps = visibleProps ?? WORLD_PROPS
  const isTired = pet.energy <= 10

  // ── State ─────────────────────────────────────────────────────
  const [petPos,        setPetPos]        = useState({ x: SPAWN_X, y: SPAWN_Y })
  const [direction,     setDirection]     = useState('right')
  const [eatState,      setEatState]      = useState('idle')
  const [arrivedAtTree, setArrivedAtTree] = useState(false)

  // ── Refs (avoid stale closures in the interval) ───────────────
  const petPosRef          = useRef({ x: SPAWN_X, y: SPAWN_Y })
  const directionRef       = useRef('right')
  const eatStateRef        = useRef('idle')
  const targetIdxRef       = useRef(-1)
  const targetPosRef       = useRef({ x: 0, y: 0 })
  const wanderTargetRef    = useRef(randomPointInArea(0, petSizePx))
  // Counts consecutive ticks where Bubby made no progress toward his wander
  // target. After ~1 s (20 ticks × 50 ms) without closing the gap, a fresh
  // target is forced so he turns away from the obstacle automatically.
  const wanderStuckRef    = useRef(0)
  const wanderPrevDistRef = useRef(Infinity)  // dist to target on the previous tick
  const unlockedAreasRef   = useRef(unlockedAreas)
  const arrivedAtTreeRef   = useRef(false)
  const restTargetRef          = useRef(null)
  const celebrateWaypointsRef  = useRef([])
  const celebrateWpIdxRef      = useRef(0)
  const isPausedRef          = useRef(isPaused)
  const onAteRef             = useRef(onAte)
  const onLevelUpCompleteRef = useRef(onLevelUpComplete)
  const onGreetArrivedRef    = useRef(onGreetArrived)
  const greetTargetRef       = useRef(null)

  // Keep refs current
  useEffect(() => { petPosRef.current           = petPos },        [petPos])
  useEffect(() => { unlockedAreasRef.current    = unlockedAreas }, [unlockedAreas])
  useEffect(() => { isPausedRef.current         = isPaused },      [isPaused])
  useEffect(() => { onAteRef.current            = onAte },         [onAte])
  useEffect(() => { onLevelUpCompleteRef.current = onLevelUpComplete }, [onLevelUpComplete])
  useEffect(() => { onGreetArrivedRef.current   = onGreetArrived }, [onGreetArrived])

  // ── Direction helper ──────────────────────────────────────────
  function updateDirection(dx, dy) {
    const dir = Math.abs(dx) >= Math.abs(dy)
      ? (dx >= 0 ? 'right' : 'left')
      : (dy >= 0 ? 'down'  : 'up')
    if (dir !== directionRef.current) {
      directionRef.current = dir
      setDirection(dir)
    }
  }

  // ── Level-up flash (4 s) ──────────────────────────────────────
  useEffect(() => {
    if (!isLevelingUp) return
    eatStateRef.current = 'leveling'
    setEatState('leveling')
    const timer = setTimeout(() => {
      eatStateRef.current = 'idle'
      setEatState('idle')
      wanderTargetRef.current = randomWanderTarget(unlockedAreasRef.current, petSizePx)
      if (onLevelUpCompleteRef.current) onLevelUpCompleteRef.current()
    }, 4000)
    return () => clearTimeout(timer)
  }, [isLevelingUp])

  // ── Tired → walk toward nearest accessible tree ───────────────
  useEffect(() => {
    if (!isTired) {
      arrivedAtTreeRef.current = false
      setArrivedAtTree(false)
      restTargetRef.current = null
      return
    }
    eatStateRef.current = 'idle'
    setEatState('idle')
    arrivedAtTreeRef.current = false
    setArrivedAtTree(false)

    const pos        = petPosRef.current
    const accessible = unlockedAreasRef.current
    const trees = interactableProps.filter(p =>
      p.interactType === 'rest' &&
      accessible.includes(getAreaAtPoint(p.x + p.displayW / 2, p.y + p.displayH / 2))
    )
    if (trees.length === 0) {
      arrivedAtTreeRef.current = true
      setArrivedAtTree(true)
      return
    }
    const nearest = trees.reduce((best, t) =>
      Math.hypot(t.x - pos.x, t.y - pos.y) < Math.hypot(best.x - pos.x, best.y - pos.y) ? t : best
    )
    restTargetRef.current = {
      x: nearest.x + nearest.displayW / 2 - petSizePx / 2,
      y: nearest.y + nearest.displayH - petSizePx + 8,
    }
  }, [isTired])

  // ── Feed trigger → run to nearest visible accessible grass ────
  useEffect(() => {
    if (feedTrigger === 0) return
    if (isTired) return
    if (eatStateRef.current !== 'idle') return
    const patches    = grassPatchesRef.current
    const accessible = unlockedAreasRef.current
    let bestIdx = -1, bestDist = Infinity
    const pos = petPosRef.current
    patches.forEach((g, i) => {
      if (!g.visible) return
      if (!accessible.includes(g.areaId)) return
      const d = Math.hypot(pos.x - g.x, pos.y - g.y)
      if (d < bestDist) { bestDist = d; bestIdx = i }
    })
    if (bestIdx === -1) return
    targetIdxRef.current  = bestIdx
    targetPosRef.current  = { x: patches[bestIdx].x, y: patches[bestIdx].y }
    eatStateRef.current   = 'going'
    setEatState('going')
    updateDirection(patches[bestIdx].x - pos.x, patches[bestIdx].y - pos.y)
  }, [feedTrigger])

  // ── Rest trigger → freeze 5 s ─────────────────────────────────
  useEffect(() => {
    if (restTrigger === 0) return
    eatStateRef.current = 'resting'
    setEatState('resting')
    setTimeout(() => { eatStateRef.current = 'idle'; setEatState('idle') }, 5000)
  }, [restTrigger])

  // ── Water trigger → run to well ───────────────────────────────
  useEffect(() => {
    if (waterTrigger === 0) return
    if (isTired) return
    if (eatStateRef.current !== 'idle') return
    const well = WORLD_PROPS.find(p => p.interactType === 'water')
    if (!well) {
      eatStateRef.current = 'drinking'
      setEatState('drinking')
      setTimeout(() => { eatStateRef.current = 'idle'; setEatState('idle') }, 4000)
      return
    }
    targetPosRef.current = {
      x: well.x + well.displayW / 2 - petSizePx / 2,
      y: well.y + well.displayH - petSizePx + 4 + wellYOffset,
    }
    eatStateRef.current = 'going_water'
    setEatState('going_water')
    updateDirection(targetPosRef.current.x - petPosRef.current.x, targetPosRef.current.y - petPosRef.current.y)
  }, [waterTrigger])

  // ── Study trigger → walk to nearest accessible tree → 'study' ─
  useEffect(() => {
    if (studyTrigger === 0) return
    if (isTired) return
    const pos        = petPosRef.current
    const accessible = unlockedAreasRef.current
    const trees = interactableProps.filter(p =>
      p.interactType === 'rest' &&
      accessible.includes(getAreaAtPoint(p.x + p.displayW / 2, p.y + p.displayH / 2))
    )
    if (trees.length === 0) {
      // No tree reachable — study in place
      eatStateRef.current = 'study'
      setEatState('study')
      return
    }
    const nearest = trees.reduce((best, t) =>
      Math.hypot(t.x - pos.x, t.y - pos.y) < Math.hypot(best.x - pos.x, best.y - pos.y) ? t : best
    )
    targetPosRef.current = {
      x: nearest.x + nearest.displayW / 2 - petSizePx / 2,
      y: nearest.y + nearest.displayH - petSizePx + 8,
    }
    eatStateRef.current = 'going_study'
    setEatState('going_study')
    updateDirection(targetPosRef.current.x - pos.x, targetPosRef.current.y - pos.y)
  }, [studyTrigger])

  // ── Study pause → row 1 (book closed / paused look) ──────────
  useEffect(() => {
    if (studyPauseTrigger === 0) return
    if (eatStateRef.current === 'study' || eatStateRef.current === 'going_study') {
      eatStateRef.current = 'study_pause'
      setEatState('study_pause')
    }
  }, [studyPauseTrigger])

  // ── Study resume → back to rows 3+4 loop ─────────────────────
  useEffect(() => {
    if (studyResumeTrigger === 0) return
    if (eatStateRef.current === 'study_pause') {
      eatStateRef.current = 'study'
      setEatState('study')
    }
  }, [studyResumeTrigger])

  // ── Study stop → return to idle ───────────────────────────────
  useEffect(() => {
    if (studyStopTrigger === 0) return
    eatStateRef.current = 'idle'
    setEatState('idle')
    wanderTargetRef.current = randomWanderTarget(unlockedAreasRef.current, petSizePx)
  }, [studyStopTrigger])

  // ── Celebration run → 3-loop run+ball sequence ────────────────
  // Defined AFTER studyStopTrigger so it wins when both fire in the
  // same React render cycle (session-complete fires both together).
  // Pattern: run to waypoint → stop → ball anim → run to next (×3)
  useEffect(() => {
    if (celebrateTrigger === 0) return
    if (isTired) return
    const unlocked = unlockedAreasRef.current
    // Pick 3 waypoints: run→ball×3
    const waypoints = Array.from({ length: 3 }, () => randomWanderTarget(unlocked))
    celebrateWaypointsRef.current = waypoints
    celebrateWpIdxRef.current = 0
    targetPosRef.current = waypoints[0]
    eatStateRef.current = 'going_celebrate'
    setEatState('going_celebrate')
    updateDirection(waypoints[0].x - petPosRef.current.x, waypoints[0].y - petPosRef.current.y)
  }, [celebrateTrigger])

  // ── Greet: run to center of current area then lick ────────────
  useEffect(() => {
    if (greetTrigger === 0) return
    const pos = petPosRef.current
    // Compute center of whichever area the pet is currently in
    const areaId    = getAreaAtPoint(pos.x + petSizePx / 2, pos.y + petSizePx / 2)
    const col       = areaId % 3
    const screenRow = 2 - Math.floor(areaId / 3)
    const cx        = col * AREA_W + AREA_W / 2 - petSizePx / 2
    const cy        = screenRow * AREA_H + AREA_H / 2 - petSizePx / 2
    greetTargetRef.current = { x: cx, y: cy }
    targetPosRef.current   = { x: cx, y: cy }
    eatStateRef.current    = 'going_greet'
    setEatState('going_greet')
    updateDirection(cx - pos.x, cy - pos.y)
  }, [greetTrigger])

  // ── Scared: rapid-click → sprint to a random far target ──────
  useEffect(() => {
    if (scaredTrigger === 0) return
    const target = randomWanderTarget(unlockedAreasRef.current, petSizePx)
    // Reuse the celebrate path (1 waypoint, no ball anim since ball_roll won't be active)
    celebrateWaypointsRef.current = [target]
    celebrateWpIdxRef.current = 0
    targetPosRef.current = target
    eatStateRef.current = 'going_celebrate'
    setEatState('going_celebrate')
    updateDirection(target.x - petPosRef.current.x, target.y - petPosRef.current.y)
  }, [scaredTrigger])

  // ── Main movement loop (50 ms tick) ──────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (isPausedRef.current) return

      const state = eatStateRef.current

      /**
       * Clamp a proposed move so the pet never enters a locked area.
       * Tries: full move → x-only → y-only → stay + new wander target.
       * Used for dying-walk (prop collisions intentionally not checked — pet walks up to tree).
       */
      const clampToUnlocked = (nx, ny, pos) => {
        const unlocked = unlockedAreasRef.current
        if (unlocked.includes(getAreaAtPoint(nx + petSizePx / 2, ny + petSizePx / 2)))
          return { x: nx, y: ny }
        if (unlocked.includes(getAreaAtPoint(nx + petSizePx / 2, pos.y + petSizePx / 2)))
          return { x: nx, y: pos.y }
        if (unlocked.includes(getAreaAtPoint(pos.x + petSizePx / 2, ny + petSizePx / 2)))
          return { x: pos.x, y: ny }
        wanderTargetRef.current = randomWanderTarget(unlocked, petSizePx)
        return { x: pos.x, y: pos.y }
      }

      /**
       * Like clampToUnlocked but also avoids prop collision radii.
       * Used for all free-movement states (wander, run, greet) so the pet
       * never clips through a tree or well during travel.
       *
       * Escape hatch: if the pet's *current position* is already inside a
       * prop's collision zone (which happens after rest/study at a tree ends),
       * all three slide attempts fail. In that case we detect the overlapping
       * prop and push the pet directly away from its centre at WALK_SPEED so
       * they can escape smoothly instead of freezing forever.
       */
      const clampToPassable = (nx, ny, pos) => {
        const unlocked = unlockedAreasRef.current

        // Returns the first blocking prop at (px,py), or null if none.
        const blockingProp = (px, py) => {
          const cx = px + petSizePx / 2, cy = py + petSizePx / 2
          return WORLD_PROPS.find(p =>
            p.collisionR > 0 &&
            Math.hypot(cx - (p.x + p.displayW / 2), cy - (p.y + p.displayH / 2)) < p.collisionR + petSizePx / 2
          ) ?? null
        }
        const passable = (px, py) =>
          unlocked.includes(getAreaAtPoint(px + petSizePx / 2, py + petSizePx / 2)) && !blockingProp(px, py)

        if (passable(nx, ny))    return { x: nx, y: ny }
        if (passable(nx, pos.y)) return { x: nx, y: pos.y }
        if (passable(pos.x, ny)) return { x: pos.x, y: ny }

        // ── Escape depenetration ──────────────────────────────────
        // All three move attempts failed. Check if *current pos* is already
        // inside a prop (e.g. pet rested/studied inside a tree and state just
        // returned to idle). If so, push directly away from that prop.
        const stuck = blockingProp(pos.x, pos.y)
        if (stuck) {
          const pcx = stuck.x + stuck.displayW / 2
          const pcy = stuck.y + stuck.displayH / 2
          const ex  = pos.x + petSizePx / 2 - pcx
          const ey  = pos.y + petSizePx / 2 - pcy
          const ed  = Math.hypot(ex, ey) || 1
          const escX = pos.x + (ex / ed) * WALK_SPEED
          const escY = pos.y + (ey / ed) * WALK_SPEED
          // Accept the escape even if still overlapping — we'll clear on
          // subsequent ticks.  Only reject if it crosses a fence.
          if (unlocked.includes(getAreaAtPoint(escX + petSizePx / 2, escY + petSizePx / 2))) {
            return { x: escX, y: escY }
          }
        }

        wanderTargetRef.current = randomWanderTarget(unlocked, petSizePx)
        return { x: pos.x, y: pos.y }
      }

      // ── Dying walk ────────────────────────────────────────────
      if (isTired) {
        if (arrivedAtTreeRef.current) return
        const rt = restTargetRef.current
        if (!rt) { arrivedAtTreeRef.current = true; setArrivedAtTree(true); return }
        const pos = petPosRef.current
        const dx = rt.x - pos.x, dy = rt.y - pos.y
        const dist = Math.hypot(dx, dy)
        if (dist < WALK_SPEED + 1) {
          petPosRef.current = rt; setPetPos(rt)
          arrivedAtTreeRef.current = true; setArrivedAtTree(true)
          return
        }
        // Use clampToUnlocked (not clampToPassable) — pet intentionally walks inside tree collision zone to rest
        const clamped = clampToUnlocked(pos.x + (dx / dist) * WALK_SPEED, pos.y + (dy / dist) * WALK_SPEED, pos)
        updateDirection(dx, dy)
        petPosRef.current = clamped; setPetPos(clamped)
        return
      }

      // ── Frozen states ─────────────────────────────────────────
      if (catAnimFreezeRef?.current) return
      if (state === 'eating' || state === 'drinking' || state === 'resting' || state === 'leveling' ||
          state === 'study'  || state === 'study_pause' || state === 'celebrate_ball') return

      const pos = petPosRef.current

      // ── Run to grass ──────────────────────────────────────────
      if (state === 'going') {
        const tx = targetPosRef.current.x, ty = targetPosRef.current.y
        const dx = tx - pos.x, dy = ty - pos.y
        const dist = Math.hypot(dx, dy)
        if (dist < RUN_SPEED + 1) {
          const idx = targetIdxRef.current
          eatStateRef.current = 'eating'; setEatState('eating')
          hideGrassPatch(idx)
          petPosRef.current = { x: tx, y: ty }; setPetPos({ x: tx, y: ty })
          setTimeout(() => {
            eatStateRef.current = 'idle'; setEatState('idle')
            directionRef.current = 'left'; setDirection('left')
            wanderTargetRef.current = randomWanderTarget(unlockedAreasRef.current, petSizePx)
            if (onAteRef.current) onAteRef.current()
            setTimeout(() => restoreGrassPatch(idx), 45000)
          }, 4000)
          return
        }
        const clamped = clampToPassable(pos.x + (dx / dist) * RUN_SPEED, pos.y + (dy / dist) * RUN_SPEED, pos)
        updateDirection(dx, dy)
        petPosRef.current = clamped; setPetPos(clamped)
        return
      }

      // ── Run to tree (study) ───────────────────────────────────
      // Uses clampToUnlocked (not clampToPassable) so the pet can enter
      // the tree's collision zone to actually reach and rest at the tree.
      if (state === 'going_study') {
        const tx = targetPosRef.current.x, ty = targetPosRef.current.y
        const dx = tx - pos.x, dy = ty - pos.y
        const dist = Math.hypot(dx, dy)
        if (dist < RUN_SPEED + 1) {
          eatStateRef.current = 'study'; setEatState('study')
          petPosRef.current = { x: tx, y: ty }; setPetPos({ x: tx, y: ty })
          return
        }
        const clamped = clampToUnlocked(pos.x + (dx / dist) * RUN_SPEED, pos.y + (dy / dist) * RUN_SPEED, pos)
        updateDirection(dx, dy)
        petPosRef.current = clamped; setPetPos(clamped)
        return
      }

      // ── Celebration run → stop + ball at each waypoint ───────
      // Pattern: run to waypoint → freeze as 'celebrate_ball' (1260 ms)
      //          → run to next waypoint × 3, then return to idle.
      if (state === 'going_celebrate') {
        const tx = targetPosRef.current.x, ty = targetPosRef.current.y
        const dx = tx - pos.x, dy = ty - pos.y
        const dist = Math.hypot(dx, dy)
        if (dist < RUN_SPEED + 1) {
          // Arrived — snap to waypoint and play ball animation (stopped)
          petPosRef.current = { x: tx, y: ty }; setPetPos({ x: tx, y: ty })
          eatStateRef.current = 'celebrate_ball'; setEatState('celebrate_ball')
          const nextIdx = celebrateWpIdxRef.current + 1
          setTimeout(() => {
            if (nextIdx < celebrateWaypointsRef.current.length) {
              celebrateWpIdxRef.current = nextIdx
              const next = celebrateWaypointsRef.current[nextIdx]
              targetPosRef.current = next
              eatStateRef.current = 'going_celebrate'; setEatState('going_celebrate')
              updateDirection(next.x - petPosRef.current.x, next.y - petPosRef.current.y)
            } else {
              // All 3 loops done — return to idle wander
              eatStateRef.current = 'idle'; setEatState('idle')
              wanderTargetRef.current = randomWanderTarget(unlockedAreasRef.current, petSizePx)
            }
          }, 1260) // 9 frames × 140 ms = ball anim duration
          return
        }
        const clamped = clampToPassable(pos.x + (dx / dist) * RUN_SPEED, pos.y + (dy / dist) * RUN_SPEED, pos)
        updateDirection(dx, dy)
        petPosRef.current = clamped; setPetPos(clamped)
        return
      }

      // ── Greet run → area center, then freeze for lick ────────────
      if (state === 'going_greet') {
        const tx = greetTargetRef.current?.x ?? targetPosRef.current.x
        const ty = greetTargetRef.current?.y ?? targetPosRef.current.y
        const dx = tx - pos.x, dy = ty - pos.y
        const dist = Math.hypot(dx, dy)
        if (dist < RUN_SPEED + 1) {
          greetTargetRef.current = null
          // Hold in resting (frozen) for lick duration, then return to idle wander
          eatStateRef.current = 'resting'; setEatState('resting')
          if (onGreetArrivedRef.current) onGreetArrivedRef.current()
          setTimeout(() => {
            if (eatStateRef.current === 'resting') {
              eatStateRef.current = 'idle'; setEatState('idle')
              wanderTargetRef.current = randomWanderTarget(unlockedAreasRef.current, petSizePx)
            }
          }, 1600)  // slightly longer than lick anim (1540ms)
          return
        }
        const clamped = clampToPassable(pos.x + (dx / dist) * RUN_SPEED, pos.y + (dy / dist) * RUN_SPEED, pos)
        updateDirection(dx, dy)
        petPosRef.current = clamped; setPetPos(clamped)
        return
      }

      // ── Run to well ───────────────────────────────────────────
      // Uses clampToUnlocked so the pet can always reach the water source
      // regardless of prop collision zones along the path.
      if (state === 'going_water') {
        const tx = targetPosRef.current.x, ty = targetPosRef.current.y
        const dx = tx - pos.x, dy = ty - pos.y
        const dist = Math.hypot(dx, dy)
        if (dist < RUN_SPEED + 1) {
          eatStateRef.current = 'drinking'; setEatState('drinking')
          petPosRef.current = { x: tx, y: ty }; setPetPos({ x: tx, y: ty })
          setTimeout(() => {
            eatStateRef.current = 'idle'; setEatState('idle')
            wanderTargetRef.current = randomWanderTarget(unlockedAreasRef.current, petSizePx)
          }, 4000)
          return
        }
        const clamped = clampToUnlocked(pos.x + (dx / dist) * RUN_SPEED, pos.y + (dy / dist) * RUN_SPEED, pos)
        updateDirection(dx, dy)
        petPosRef.current = clamped; setPetPos(clamped)
        return
      }

      // ── Idle wander ───────────────────────────────────────────
      const wt = wanderTargetRef.current
      const dx = wt.x - pos.x, dy = wt.y - pos.y
      const dist = Math.hypot(dx, dy)
      if (dist < WALK_SPEED + 1) {
        wanderTargetRef.current = randomWanderTarget(unlockedAreasRef.current, petSizePx)
        wanderStuckRef.current  = 0
        wanderPrevDistRef.current = Infinity
        return
      }
      const nx = pos.x + (dx / dist) * WALK_SPEED
      const ny = pos.y + (dy / dist) * WALK_SPEED
      // clampToPassable already picks a new random wander target when blocked
      // by a prop (all three slide attempts fail). We don't fall back to
      // clampToUnlocked so Bubby changes direction instead of walking through props.
      const clamped = clampToPassable(nx, ny, pos)

      // ── Progress timeout ───────────────────────────────────────
      // Compare this tick's distance to last tick's. If Bubby isn't getting
      // closer (sliding along a wall or grinding face-first into it), count
      // stuck frames. After ~1 s with no progress, pick a fresh target so he
      // turns away from the obstacle instead of pressing against it forever.
      if (dist < wanderPrevDistRef.current - 0.5) {
        wanderStuckRef.current = 0           // making progress — reset counter
      } else {
        wanderStuckRef.current += 1
        if (wanderStuckRef.current >= 20) {  // ~1 s at 50 ms/tick
          wanderTargetRef.current   = randomWanderTarget(unlockedAreasRef.current, petSizePx)
          wanderStuckRef.current    = 0
          wanderPrevDistRef.current = Infinity
        }
      }
      wanderPrevDistRef.current = dist

      updateDirection(dx, dy)
      petPosRef.current = clamped; setPetPos(clamped)
    }, 50)

    return () => clearInterval(id)
  }, [isTired])

  return { petPos, direction, eatState, arrivedAtTree }
}
