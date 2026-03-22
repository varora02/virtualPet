import { useState, useEffect, useRef } from 'react'
import grassUrl         from '../assets/svgs/grass.svg'
import TileMap          from './TileMap.jsx'
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
}) {
  const [petPos, setPetPos]         = useState({ x: SPAWN_X, y: SPAWN_Y })
  const [direction, setDirection]   = useState('right')
  // 'idle' | 'going' | 'going_water' | 'eating' | 'drinking' | 'resting'
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

  const avgStat = (pet.hunger + pet.thirst + pet.energy + pet.happiness) / 4
  const mood    = avgStat >= 80 ? 'happy' : avgStat >= 50 ? 'neutral' : avgStat >= 25 ? 'sad' : 'critical'
  const isTired = pet.energy <= 0

  // ── Keep refs in sync ─────────────────────────────────────────
  useEffect(() => { petPosRef.current    = petPos },           [petPos])
  useEffect(() => { grassPatchesRef.current = grassPatches }, [grassPatches])
  useEffect(() => { unlockedAreasRef.current = unlockedAreas }, [unlockedAreas])

  // Day / night
  useEffect(() => {
    const id = setInterval(() => setIsNight(checkIsNight()), 60000)
    return () => clearInterval(id)
  }, [])

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
    const trees = WORLD_PROPS.filter(p => p.interactType === 'rest')
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

  // ── Feed → find nearest visible grass and run ─────────────────
  useEffect(() => {
    if (feedTrigger === 0) return
    if (isTired) return
    if (eatStateRef.current !== 'idle') return
    const patches = grassPatchesRef.current
    let bestIdx = -1, bestDist = Infinity
    const pos = petPosRef.current
    patches.forEach((g, i) => {
      if (!g.visible) return
      const d = Math.hypot(pos.x - g.x, pos.y - g.y)
      if (d < bestDist) { bestDist = d; bestIdx = i }
    })
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
      const state = eatStateRef.current

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
        const nx = pos.x + (dx / dist) * WALK_SPEED
        const ny = pos.y + (dy / dist) * WALK_SPEED
        updateDirection(dx, dy)
        petPosRef.current = { x: nx, y: ny }; setPetPos({ x: nx, y: ny })
        return
      }

      // ── Frozen states ─────────────────────────────────────────
      if (state === 'eating' || state === 'drinking' || state === 'resting') return

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
            setTimeout(() => {
              setGrassPatches(ps => ps.map((g, i) => i === idx ? { ...g, visible: true } : g))
            }, 45000)
          }, 4000)
          return
        }
        const nx = pos.x + (dx / dist) * RUN_SPEED
        const ny = pos.y + (dy / dist) * RUN_SPEED
        updateDirection(dx, dy)
        petPosRef.current = { x: nx, y: ny }; setPetPos({ x: nx, y: ny })
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
        const nx = pos.x + (dx / dist) * RUN_SPEED
        const ny = pos.y + (dy / dist) * RUN_SPEED
        updateDirection(dx, dy)
        petPosRef.current = { x: nx, y: ny }; setPetPos({ x: nx, y: ny })
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
      const nx = pos.x + (dx / dist) * WALK_SPEED
      const ny = pos.y + (dy / dist) * WALK_SPEED
      updateDirection(dx, dy)
      petPosRef.current = { x: nx, y: ny }; setPetPos({ x: nx, y: ny })
    }, 50)

    return () => clearInterval(id)
  }, [isTired])

  // ── Derive sprite ─────────────────────────────────────────────
  const isActionAnim = eatState === 'eating' || eatState === 'drinking'
  const showDead     = isTired && arrivedAtTree
  const dirOffset    = isActionAnim ? 0 : DIR_OFFSETS[direction]

  const spriteUrl = showDead
    ? hareDeath
    : eatState === 'eating'
      ? hareEating
      : eatState === 'drinking'
        ? hareDrinking
        : eatState === 'resting'
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
          : (eatState === 'going' || eatState === 'going_water')
            ? 'hare-state-run'
            : 'hare-state-walk'

  // Depth-sort z-index: foot of hare = petPos.y + HARE_PX
  const hareZ = Z_BASE + Math.round(petPos.y + HARE_PX)

  return (
    <div className={`world-scene mood-${mood}`}>

      <TileMap />
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

      {/* Hare — depth-sorted via dynamic z-index */}
      <div
        className={`hare-walker mood-filter-${mood} ${hareClass}`}
        style={{
          left:  `${petPos.x}px`,
          top:   `${petPos.y}px`,
          zIndex: hareZ,
          '--sprite-url': `url(${spriteUrl})`,
          '--dir-offset': `${dirOffset}px`,
        }}
        aria-label="Your pet hare"
      />

    </div>
  )
}

export default Pet
