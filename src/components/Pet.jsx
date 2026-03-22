import { useState, useEffect, useRef } from 'react'
import grassUrl         from '../assets/svgs/grass.svg'
import TileMap          from './TileMap.jsx'
import PathOverlay      from './PathOverlay.jsx'
import FenceOverlay     from './FenceOverlay.jsx'
import WorldProps, { WORLD_PROPS } from './WorldProps.jsx'
import {
  AREA_W, AREA_H, HARE_PX, MARGIN,
  WALK_SPEED, RUN_SPEED,
  SPAWN_X, SPAWN_Y,
  Z_BASE, Z_GLOW,
} from '../worldConfig.js'

// Sprite sheets
import hareWalkShadow  from '../assets/sprites/Hare_Walk_with_shadow.png'  // 5 frames, 160×128
import hareRunShadow   from '../assets/sprites/Hare_Run_with_shadow.png'   // 6 frames, 192×128
import hareEating      from '../assets/sprites/Hare_Eating.png'            // 5 frames reversed
import hareDrinking    from '../assets/sprites/Hare_Drinking.png'          // 4 frames
import hareIdle        from '../assets/sprites/Hare_Idle.png'
import hareDeath       from '../assets/sprites/Hare_Death.png'

import './Pet.css'

// ── Sprite direction row offsets (2.5× scale → 80px per row) ──
const DIR_OFFSETS = { down: 0, up: -80, left: -160, right: -240 }

// ── Ghost bud offset from main hare (px) ──
const GHOST_OFFSET_X = 90
const GHOST_OFFSET_Y = -10

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function getPSTHour() {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  ).getHours()
}
function checkIsNight() {
  const h = getPSTHour(); return h >= 16 || h < 3
}

/**
 * Return the area ID that contains pixel coordinate (x, y).
 * col = floor(x / AREA_W), screenRow = floor(y / AREA_H)
 * areaId = (2 - screenRow) * 3 + col   (row 0 = TL/TM/TR = areas 6/7/8)
 * Clamped to the valid 3×3 grid.
 */
function getAreaAtPoint(x, y) {
  const col       = Math.min(Math.max(Math.floor(x / AREA_W), 0), 2)
  const screenRow = Math.min(Math.max(Math.floor(y / AREA_H), 0), 2)
  return (2 - screenRow) * 3 + col
}

/** Random point inside one area, respecting MARGIN and hare size. */
function randomPointInArea(areaId) {
  const col       = areaId % 3
  const screenRow = 2 - Math.floor(areaId / 3)
  const ax = col * AREA_W, ay = screenRow * AREA_H
  return {
    x: ax + MARGIN + Math.random() * (AREA_W - HARE_PX - MARGIN * 2),
    y: ay + MARGIN + Math.random() * (AREA_H - HARE_PX - MARGIN * 2),
  }
}

/**
 * Pick a random wander target across all unlocked areas.
 * Rejects points that land inside any prop's collision radius.
 */
function randomWanderTarget(unlockedAreas) {
  for (let i = 0; i < 60; i++) {
    const id = unlockedAreas[Math.floor(Math.random() * unlockedAreas.length)]
    const pt = randomPointInArea(id)
    const cx = pt.x + HARE_PX / 2, cy = pt.y + HARE_PX / 2
    const blocked = WORLD_PROPS.some(p =>
      Math.hypot(cx - (p.x + p.displayW / 2), cy - (p.y + p.displayH / 2)) < p.collisionR + HARE_PX / 2
    )
    if (!blocked) return pt
  }
  return randomPointInArea(unlockedAreas[0])  // fallback
}

/**
 * Spawn 1–2 edible grass patches per area.
 * Pass `areas` = array of areaIds to populate.
 * Each patch gets a stable `id` so replenish timeouts can target it.
 */
function makeGrassPatchesForAreas(areas) {
  const patches = []
  areas.forEach(areaId => {
    const col       = areaId % 3
    const screenRow = 2 - Math.floor(areaId / 3)
    const ax = col * AREA_W, ay = screenRow * AREA_H
    const count = Math.floor(Math.random() * 2) + 1   // 1 or 2 per area
    let placed = 0, attempts = 0
    while (placed < count && attempts < 80) {
      attempts++
      const x = ax + 40 + Math.random() * (AREA_W - 58 - 40)
      const y = ay + 20 + Math.random() * (AREA_H - 74)
      const blocked = WORLD_PROPS.some(p =>
        Math.hypot(x + 29 - (p.x + p.displayW / 2), y + 29 - (p.y + p.displayH / 2)) < p.collisionR + 40
      )
      // Stay spread out within the same area
      const tooClose = patches
        .filter(p => p.areaId === areaId)
        .some(p => Math.hypot(p.x - x, p.y - y) < 72)
      if (!blocked && !tooClose) {
        patches.push({
          id:      `grass_${areaId}_${placed}`,
          areaId,
          x:       +x.toFixed(1),
          y:       +y.toFixed(1),
          visible: true,
        })
        placed++
      }
    }
  })
  return patches
}

// ─────────────────────────────────────────────────────────────

function Pet({
  pet,
  hasInteracted   = false,
  feedTrigger     = 0,
  restTrigger     = 0,
  waterTrigger    = 0,
  unlockedAreas   = [0],
  onAte           = null,   // callback fired when hare finishes eating
  level           = 1,      // current pet level
  isLevelingUp    = false,  // true for 2s on level-up
  onLevelUpComplete = null, // callback after flash animation ends
  onPetClick      = null,   // callback when hare is clicked (for level popup)
  isPaused        = false,  // true while level popup is open
  ghostBudActive  = false,  // true while Ghost Bud ability is active
  showLevelPopup  = false,  // controls in-world popup visibility
  onCloseLevelPopup = null, // called when popup close is clicked
  expInLevel      = 0,      // exp progress within the current level
  expPct          = 0,      // percentage 0–100 toward next level
  expPerLevel     = 100,    // exp required per level
}) {
  const [petPos, setPetPos]         = useState({ x: SPAWN_X, y: SPAWN_Y })
  const [direction, setDirection]   = useState('right')
  // 'idle' | 'going' | 'going_water' | 'eating' | 'drinking' | 'resting' | 'leveling'
  const [eatState, setEatState]     = useState('idle')
  // Grass patches: 1-2 per unlocked area, keyed by stable id
  const [grassPatches, setGrassPatches] = useState(() => makeGrassPatchesForAreas(unlockedAreas))
  const [isNight, setIsNight]       = useState(checkIsNight)
  // Dying walk: hare walks toward nearest tree before death anim plays
  const [arrivedAtTree, setArrivedAtTree] = useState(false)

  // ── Refs ──────────────────────────────────────────────────────
  const eatStateRef        = useRef('idle')
  const petPosRef          = useRef({ x: SPAWN_X, y: SPAWN_Y })
  const directionRef       = useRef('right')
  const targetIdxRef       = useRef(-1)         // index into grassPatchesRef.current
  const targetPosRef       = useRef({ x: 0, y: 0 })
  const wanderTargetRef    = useRef(randomPointInArea(0))
  const grassPatchesRef    = useRef(grassPatches)
  const unlockedAreasRef   = useRef(unlockedAreas)
  const prevUnlockedRef    = useRef(unlockedAreas)   // detect newly unlocked areas
  const onAteRef           = useRef(onAte)            // always-current callback ref
  const restTargetRef      = useRef(null)             // tree destination when dying
  const arrivedAtTreeRef   = useRef(false)
  const isPausedRef        = useRef(isPaused)         // up-to-date pause flag for movement loop
  const isLevelingUpRef    = useRef(isLevelingUp)
  const onLevelUpCompleteRef = useRef(onLevelUpComplete)
  const onPetClickRef      = useRef(onPetClick)

  // Keep refs in sync with latest props
  useEffect(() => { onAteRef.current = onAte },                 [onAte])
  useEffect(() => { isPausedRef.current = isPaused },           [isPaused])
  useEffect(() => { isLevelingUpRef.current = isLevelingUp },   [isLevelingUp])
  useEffect(() => { onLevelUpCompleteRef.current = onLevelUpComplete }, [onLevelUpComplete])
  useEffect(() => { onPetClickRef.current = onPetClick },       [onPetClick])

  const avgStat = (pet.hunger + pet.thirst + pet.energy + pet.happiness) / 4
  const mood    = avgStat >= 80 ? 'happy' : avgStat >= 50 ? 'neutral' : avgStat >= 25 ? 'sad' : 'critical'
  const isTired = pet.energy <= 10

  // ── Keep refs in sync ─────────────────────────────────────────
  useEffect(() => { petPosRef.current    = petPos },           [petPos])
  useEffect(() => { grassPatchesRef.current = grassPatches }, [grassPatches])
  useEffect(() => { unlockedAreasRef.current = unlockedAreas }, [unlockedAreas])

  // ── Generate new grass patches when new areas are unlocked ────
  useEffect(() => {
    const prev = prevUnlockedRef.current
    const newlyUnlocked = unlockedAreas.filter(id => !prev.includes(id))
    if (newlyUnlocked.length > 0) {
      const newPatches = makeGrassPatchesForAreas(newlyUnlocked)
      setGrassPatches(ps => [...ps, ...newPatches])
    }
    prevUnlockedRef.current = unlockedAreas
  }, [unlockedAreas])

  // Day / night
  useEffect(() => {
    const id = setInterval(() => setIsNight(checkIsNight()), 60000)
    return () => clearInterval(id)
  }, [])

  // ── Level-up animation (flashes for 4s then returns to idle) ──
  useEffect(() => {
    if (!isLevelingUp) return
    // Interrupt current action, enter leveling state
    eatStateRef.current = 'leveling'
    setEatState('leveling')
    const timer = setTimeout(() => {
      eatStateRef.current = 'idle'
      setEatState('idle')
      wanderTargetRef.current = randomWanderTarget(unlockedAreasRef.current)
      if (onLevelUpCompleteRef.current) onLevelUpCompleteRef.current()
    }, 4000)
    return () => clearTimeout(timer)
  }, [isLevelingUp])

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

  // ── When energy hits 0 → find nearest tree and walk to it ────
  useEffect(() => {
    if (!isTired) {
      arrivedAtTreeRef.current = false
      setArrivedAtTree(false)
      restTargetRef.current = null
      return
    }
    // Interrupt whatever the hare was doing
    eatStateRef.current = 'idle'
    setEatState('idle')
    arrivedAtTreeRef.current = false
    setArrivedAtTree(false)

    const pos = petPosRef.current
    const accessible = unlockedAreasRef.current
    // Only walk to trees inside unlocked areas — prevents crossing fences into locked zones
    const trees = WORLD_PROPS.filter(p =>
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
    // Target: just in front of (below) the tree trunk
    restTargetRef.current = {
      x: nearest.x + nearest.displayW / 2 - HARE_PX / 2,
      y: nearest.y + nearest.displayH - HARE_PX + 8,
    }
  }, [isTired])

  // ── Feed → find nearest visible grass in an accessible area ──
  useEffect(() => {
    if (feedTrigger === 0) return
    if (isTired) return
    if (eatStateRef.current !== 'idle') return
    const patches = grassPatchesRef.current
    const accessible = unlockedAreasRef.current
    let bestIdx = -1, bestDist = Infinity
    const pos = petPosRef.current
    patches.forEach((g, i) => {
      if (!g.visible) return
      // Only eat grass in areas the pet can access
      if (!accessible.includes(g.areaId)) return
      const d = Math.hypot(pos.x - g.x, pos.y - g.y)
      if (d < bestDist) { bestDist = d; bestIdx = i }
    })
    // No visible grass in accessible areas → don't trigger eating
    if (bestIdx === -1) return
    targetIdxRef.current = bestIdx
    targetPosRef.current = { x: patches[bestIdx].x, y: patches[bestIdx].y }
    eatStateRef.current = 'going'
    setEatState('going')
    updateDirection(patches[bestIdx].x - pos.x, patches[bestIdx].y - pos.y)
  }, [feedTrigger])

  // ── Rest button → freeze 5 s ──────────────────────────────────
  useEffect(() => {
    if (restTrigger === 0) return
    eatStateRef.current = 'resting'
    setEatState('resting')
    setTimeout(() => { eatStateRef.current = 'idle'; setEatState('idle') }, 5000)
  }, [restTrigger])

  // ── Water button → run to well ────────────────────────────────
  useEffect(() => {
    if (waterTrigger === 0) return
    if (isTired) return
    if (eatStateRef.current !== 'idle') return
    const well = WORLD_PROPS.find(p => p.interactType === 'water')
    if (!well) {
      // Fallback: drink in place
      eatStateRef.current = 'drinking'
      setEatState('drinking')
      setTimeout(() => { eatStateRef.current = 'idle'; setEatState('idle') }, 4000)
      return
    }
    // Stop just in front of the well
    targetPosRef.current = {
      x: well.x + well.displayW / 2 - HARE_PX / 2,
      y: well.y + well.displayH - HARE_PX + 4,
    }
    eatStateRef.current = 'going_water'
    setEatState('going_water')
    const pos = petPosRef.current
    updateDirection(targetPosRef.current.x - pos.x, targetPosRef.current.y - pos.y)
  }, [waterTrigger])

  // ── Main movement loop ────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      // Pause movement when popup is open or level-up animation is playing
      if (isPausedRef.current) return

      const state = eatStateRef.current

      /**
       * Clamp a proposed move (nx, ny) so the hare never enters a locked area.
       * Uses the sprite centre for the area check.
       * Tries full move → x-only slide → y-only slide → stay put.
       * If stuck in place, picks a new wander target so the hare doesn't freeze.
       */
      const clampToUnlocked = (nx, ny, pos) => {
        const unlocked = unlockedAreasRef.current
        const cx = nx + HARE_PX / 2, cy = ny + HARE_PX / 2
        if (unlocked.includes(getAreaAtPoint(cx, cy))) return { x: nx, y: ny }

        // Try x-only
        const cxX = nx + HARE_PX / 2, cyX = pos.y + HARE_PX / 2
        if (unlocked.includes(getAreaAtPoint(cxX, cyX))) return { x: nx, y: pos.y }

        // Try y-only
        const cxY = pos.x + HARE_PX / 2, cyY = ny + HARE_PX / 2
        if (unlocked.includes(getAreaAtPoint(cxY, cyY))) return { x: pos.x, y: ny }

        // Fully blocked — stay put and pick a new wander target
        wanderTargetRef.current = randomWanderTarget(unlocked)
        return { x: pos.x, y: pos.y }
      }

      // ── Dying walk toward nearest tree ────────────────────────
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
        const rawNx = pos.x + (dx / dist) * WALK_SPEED
        const rawNy = pos.y + (dy / dist) * WALK_SPEED
        const clamped = clampToUnlocked(rawNx, rawNy, pos)
        updateDirection(dx, dy)
        petPosRef.current = clamped; setPetPos(clamped)
        return
      }

      // ── Frozen states (including leveling) ────────────────────
      if (state === 'eating' || state === 'drinking' || state === 'resting' || state === 'leveling') return

      const pos = petPosRef.current

      // ── Run to grass (feed) ───────────────────────────────────
      if (state === 'going') {
        const tx = targetPosRef.current.x, ty = targetPosRef.current.y
        const dx = tx - pos.x, dy = ty - pos.y
        const dist = Math.hypot(dx, dy)
        if (dist < RUN_SPEED + 1) {
          const idx = targetIdxRef.current
          eatStateRef.current = 'eating'; setEatState('eating')
          setGrassPatches(ps => ps.map((g, i) => i === idx ? { ...g, visible: false } : g))
          petPosRef.current = { x: tx, y: ty }; setPetPos({ x: tx, y: ty })
          setTimeout(() => {
            eatStateRef.current = 'idle'; setEatState('idle')
            directionRef.current = 'left'; setDirection('left')
            wanderTargetRef.current = randomWanderTarget(unlockedAreasRef.current)
            // Fire hunger-update callback now that eating is complete
            if (onAteRef.current) onAteRef.current()
            setTimeout(() => {
              setGrassPatches(ps => ps.map((g, i) => i === idx ? { ...g, visible: true } : g))
            }, 45000)
          }, 4000)
          return
        }
        const rawNx = pos.x + (dx / dist) * RUN_SPEED
        const rawNy = pos.y + (dy / dist) * RUN_SPEED
        const clamped = clampToUnlocked(rawNx, rawNy, pos)
        updateDirection(dx, dy)
        petPosRef.current = clamped; setPetPos(clamped)
        return
      }

      // ── Run to well (water) ───────────────────────────────────
      if (state === 'going_water') {
        const tx = targetPosRef.current.x, ty = targetPosRef.current.y
        const dx = tx - pos.x, dy = ty - pos.y
        const dist = Math.hypot(dx, dy)
        if (dist < RUN_SPEED + 1) {
          eatStateRef.current = 'drinking'; setEatState('drinking')
          petPosRef.current = { x: tx, y: ty }; setPetPos({ x: tx, y: ty })
          setTimeout(() => {
            eatStateRef.current = 'idle'; setEatState('idle')
            wanderTargetRef.current = randomWanderTarget(unlockedAreasRef.current)
          }, 4000)
          return
        }
        const rawNx = pos.x + (dx / dist) * RUN_SPEED
        const rawNy = pos.y + (dy / dist) * RUN_SPEED
        const clampedW = clampToUnlocked(rawNx, rawNy, pos)
        updateDirection(dx, dy)
        petPosRef.current = clampedW; setPetPos(clampedW)
        return
      }

      // ── Idle wander ───────────────────────────────────────────
      const wt = wanderTargetRef.current
      const dx = wt.x - pos.x, dy = wt.y - pos.y
      const dist = Math.hypot(dx, dy)
      if (dist < WALK_SPEED + 1) {
        wanderTargetRef.current = randomWanderTarget(unlockedAreasRef.current)
        return
      }
      const rawNx = pos.x + (dx / dist) * WALK_SPEED
      const rawNy = pos.y + (dy / dist) * WALK_SPEED
      const clampedI = clampToUnlocked(rawNx, rawNy, pos)
      updateDirection(dx, dy)
      petPosRef.current = clampedI; setPetPos(clampedI)
    }, 50)

    return () => clearInterval(id)
  }, [isTired])

  // ── Derive sprite ─────────────────────────────────────────────
  const isLevelingState = eatState === 'leveling'
  const isActionAnim    = eatState === 'eating' || eatState === 'drinking'
  const showDead        = isTired && arrivedAtTree
  const dirOffset       = isActionAnim ? 0 : DIR_OFFSETS[direction]

  const spriteUrl = showDead
    ? hareDeath
    : eatState === 'eating'
      ? hareEating
      : eatState === 'drinking'
        ? hareDrinking
        : (eatState === 'resting' || isLevelingState)
          ? hareIdle
          : (eatState === 'going' || eatState === 'going_water')
            ? hareRunShadow
            : hareWalkShadow

  const hareClass = showDead
    ? 'hare-state-dead'
    : eatState === 'eating'
      ? 'hare-state-eat'
      : eatState === 'drinking'
        ? 'hare-state-drink'
        : eatState === 'resting'
          ? 'hare-state-rest'
          : isLevelingState
            ? 'hare-state-rest hare-levelup'  // idle pose + flash animation
            : (eatState === 'going' || eatState === 'going_water')
              ? 'hare-state-run'
              : 'hare-state-walk'

  // Depth-sort z-index: foot of hare = petPos.y + HARE_PX
  const hareZ = Z_BASE + Math.round(petPos.y + HARE_PX)

  // ── Ghost hare position (offset from main hare) ───────────────
  const ghostPos = {
    x: petPos.x + GHOST_OFFSET_X,
    y: petPos.y + GHOST_OFFSET_Y,
  }

  return (
    <div className={`world-scene mood-${mood}`}>

      <TileMap />
      <PathOverlay />
      <WorldProps />
      <FenceOverlay unlockedAreas={unlockedAreas} />

      {/* Night overlay — above all depth-sorted content */}
      {isNight && <div className="night-overlay" aria-hidden="true" />}

      {/* Night light glows — warm radial halos above the night overlay.
          Only rendered for props with emitsLight: true.
          z-index Z_GLOW (820) sits above the night overlay (818). */}
      {isNight && WORLD_PROPS.filter(p => p.emitsLight).map(p => {
        const r   = p.glowRadius  ?? 80
        const gy  = p.glowOffsetY ?? 0.5
        const cx  = p.x + p.displayW / 2
        const cy  = p.y + p.displayH * gy
        return (
          <div
            key={`glow_${p.id}`}
            className={`light-glow${p.id === 'campfire_0' ? ' campfire-glow' : ''}`}
            aria-hidden="true"
            style={{
              left:   cx - r,
              top:    cy - r,
              width:  r * 2,
              height: r * 2,
              zIndex: Z_GLOW,
            }}
          />
        )
      })}

      {/* Grass patches */}
      {grassPatches.map((g, i) => g.visible && (
        <img
          key={i}
          src={grassUrl}
          alt="grass"
          className="world-grass"
          style={{ left: `${g.x}px`, top: `${g.y}px` }}
        />
      ))}

      {/* Ghost Bud — mirrors main hare at an offset with a white translucent tint */}
      {ghostBudActive && (
        <div
          className={`hare-walker hare-ghost ${hareClass}`}
          style={{
            left:  `${ghostPos.x}px`,
            top:   `${ghostPos.y}px`,
            zIndex: hareZ - 1,
            '--sprite-url': `url(${spriteUrl})`,
            '--dir-offset': `${dirOffset}px`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Hare — depth-sorted via dynamic z-index; clickable for level popup */}
      <div
        className={`hare-walker mood-filter-${mood} ${hareClass}`}
        style={{
          left:   `${petPos.x}px`,
          top:    `${petPos.y}px`,
          zIndex: hareZ,
          '--sprite-url': `url(${spriteUrl})`,
          '--dir-offset': `${dirOffset}px`,
          cursor: 'pointer',
          pointerEvents: 'auto',
        }}
        onClick={() => { if (onPetClickRef.current) onPetClickRef.current() }}
        aria-label="Your pet hare — click to see level"
        title="Click to see level"
      />

      {/* In-world level popup — floats above the hare */}
      {showLevelPopup && (
        <div
          className="hare-level-popup"
          style={{
            left:   petPos.x + HARE_PX / 2,
            top:    petPos.y - 12,
            zIndex: hareZ + 200,
          }}
        >
          <div className="hlp-star">⭐</div>
          <div className="hlp-title">Level {level}</div>
          <div className="hlp-exp">{expInLevel} / {expPerLevel} exp</div>
          <div className="hlp-bar">
            <div className="hlp-bar-fill" style={{ width: `${expPct}%` }} />
          </div>
          <button
            className="hlp-close"
            onClick={() => { if (onCloseLevelPopup) onCloseLevelPopup() }}
          >
            Close
          </button>
        </div>
      )}

    </div>
  )
}

export default Pet
