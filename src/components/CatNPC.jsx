/**
 * CatNPC — Tuxedo cat (Bubby) wandering the world.
 *
 * Sprites (56×56 native, displayed at 96px = 1.71×):
 *   cat_walk.png   448×224   8 frames × 4 dirs (south/north/west/east)
 *   cat_run.png    336×56    6 frames south
 *   cat_eat.png    392×112   7 frames × east(row0)/west(row1)
 *   cat_drink.png  336×56    6 frames south
 *   cat_yawn.png   616×56    11 frames south
 *   cat_jump.png   448×112   8 frames × east(row0)/west(row1)
 *
 * State machine:
 *   walk  → arrive → weighted random: eat / drink / yawn / jump / walk again
 *   run   → (south movement, 25% chance) → arrive → same choices
 *   activity → animation completes → walk
 */

import { useState, useEffect, useRef } from 'react'
import catWalkUrl  from '../assets/sprites/cat_walk.png'
import catRunUrl   from '../assets/sprites/cat_run.png'
import catEatUrl   from '../assets/sprites/cat_eat.png'
import catDrinkUrl from '../assets/sprites/cat_drink.png'
import catYawnUrl  from '../assets/sprites/cat_yawn.png'
import catJumpUrl  from '../assets/sprites/cat_jump.png'
import { AREA_W, AREA_H, Z_BASE } from '../worldConfig'
import './CatNPC.css'

// ── Display size ────────────────────────────────────────────────
const CAT_PX    = 96   // 1.71× native 56px
const SCALE     = CAT_PX / 56

// ── Sprite sheet display sizes (native × SCALE) ─────────────────
const SZ = {
  walk:  { w: Math.round(448 * SCALE), h: Math.round(224 * SCALE) },  // 8fr × 4dirs
  run:   { w: Math.round(336 * SCALE), h: Math.round(224 * SCALE) },  // 6fr × 4dirs
  eat:   { w: Math.round(392 * SCALE), h: Math.round(112 * SCALE) },
  drink: { w: Math.round(336 * SCALE), h: Math.round( 56 * SCALE) },
  yawn:  { w: Math.round(616 * SCALE), h: Math.round( 56 * SCALE) },
  jump:  { w: Math.round(448 * SCALE), h: Math.round(112 * SCALE) },
}

// ── Direction row offsets for walk/run sheets (CAT_PX per row) ──
// Rows: south(0), north(1), west(2), east(3)
const WALK_ROW = { down: 0, up: -CAT_PX, left: -CAT_PX * 2, right: -CAT_PX * 3 }
const RUN_ROW  = { down: 0, up: -CAT_PX, left: -CAT_PX * 2, right: -CAT_PX * 3 }

// ── Eat sheet row: east(0) or west(1) ───────────────────────────
const EAT_ROW  = { right: 0, left: -CAT_PX, down: 0, up: 0 }
const JUMP_ROW = { right: 0, left: -CAT_PX, down: 0, up: 0 }

// ── Activity durations (ms) — frames × ~140ms per frame ─────────
const ACTIVITY_MS = { eat: 980, drink: 840, yawn: 1540, jump: 1120 }

// ── Movement speeds ──────────────────────────────────────────────
const WALK_SPEED = 0.7
const RUN_SPEED  = 1.5

// ── Area helpers ────────────────────────────────────────────────
function areaOrigin(areaId) {
  const col = areaId % 3
  const screenRow = 2 - Math.floor(areaId / 3)
  return { x: col * AREA_W, y: screenRow * AREA_H }
}
function randomTarget(unlockedAreas) {
  const areaId = unlockedAreas[Math.floor(Math.random() * unlockedAreas.length)]
  const { x: ax, y: ay } = areaOrigin(areaId)
  const m = 52
  return {
    x: ax + m + Math.random() * (AREA_W - m * 2 - CAT_PX),
    y: ay + m + Math.random() * (AREA_H - m * 2 - CAT_PX),
  }
}

// ── Weighted random activity picker ─────────────────────────────
function pickActivity() {
  const r = Math.random()
  if (r < 0.28) return 'eat'
  if (r < 0.46) return 'drink'
  if (r < 0.68) return 'yawn'
  if (r < 0.82) return 'jump'
  return null   // just walk again
}

// ── Component ───────────────────────────────────────────────────
export default function CatNPC({ unlockedAreas = [0] }) {
  const [pos, setPos]       = useState(() => {
    const { x: ax, y: ay } = areaOrigin(0)
    return { x: ax + AREA_W - 130, y: ay + AREA_H - 110 }
  })
  const [dir, setDir]       = useState('right')
  const [state, setState]   = useState('walk')   // walk | run | eat | drink | yawn | jump

  const targetRef   = useRef(null)
  const timerRef    = useRef(null)
  const posRef      = useRef(pos)
  const dirRef      = useRef(dir)
  const unlockedRef = useRef(unlockedAreas)

  useEffect(() => { posRef.current = pos }, [pos])
  useEffect(() => { dirRef.current = dir }, [dir])
  useEffect(() => { unlockedRef.current = unlockedAreas }, [unlockedAreas])

  function goWalk() {
    const target = randomTarget(unlockedRef.current)
    targetRef.current = target
    // 25% chance to run if heading generally south
    const dy = target.y - posRef.current.y
    const useRun = dy > 40 && Math.random() < 0.25
    setState(useRun ? 'run' : 'walk')
  }

  function onArrived() {
    const activity = pickActivity()
    if (activity) {
      setState(activity)
      timerRef.current = setTimeout(goWalk, ACTIVITY_MS[activity])
    } else {
      goWalk()
    }
  }

  // Start walking on mount
  useEffect(() => {
    goWalk()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  // Movement tick — runs while walking or running
  useEffect(() => {
    if (state !== 'walk' && state !== 'run') return
    const speed = state === 'run' ? RUN_SPEED : WALK_SPEED

    const id = setInterval(() => {
      const target = targetRef.current
      if (!target) return
      const { x, y } = posRef.current
      const dx = target.x - x
      const dy = target.y - y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < speed + 1) {
        setPos({ x: target.x, y: target.y })
        onArrived()
        return
      }

      const newDir = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down'  : 'up')
      setDir(newDir)
      setPos(prev => ({
        x: prev.x + (dx / dist) * speed,
        y: prev.y + (dy / dist) * speed,
      }))
    }, 50)

    return () => clearInterval(id)
  }, [state])

  // ── Build sprite style ───────────────────────────────────────
  const zIndex = Z_BASE + Math.round(pos.y + CAT_PX)

  let spriteStyle = {}
  let cssClass    = 'cat-npc'

  if (state === 'walk') {
    spriteStyle = {
      backgroundImage: `url(${catWalkUrl})`,
      backgroundSize:  `${SZ.walk.w}px ${SZ.walk.h}px`,
      backgroundPositionY: `${WALK_ROW[dir]}px`,
    }
    cssClass += ' cat-walk'
  } else if (state === 'run') {
    spriteStyle = {
      backgroundImage: `url(${catRunUrl})`,
      backgroundSize:  `${SZ.run.w}px ${SZ.run.h}px`,
      backgroundPositionY: `${RUN_ROW[dir]}px`,
    }
    cssClass += ' cat-run'
  } else if (state === 'eat') {
    spriteStyle = {
      backgroundImage: `url(${catEatUrl})`,
      backgroundSize:  `${SZ.eat.w}px ${SZ.eat.h}px`,
      backgroundPositionY: `${EAT_ROW[dir]}px`,
    }
    cssClass += ' cat-eat'
  } else if (state === 'drink') {
    spriteStyle = {
      backgroundImage: `url(${catDrinkUrl})`,
      backgroundSize:  `${SZ.drink.w}px ${SZ.drink.h}px`,
      backgroundPositionY: '0px',
    }
    cssClass += ' cat-drink'
  } else if (state === 'yawn') {
    spriteStyle = {
      backgroundImage: `url(${catYawnUrl})`,
      backgroundSize:  `${SZ.yawn.w}px ${SZ.yawn.h}px`,
      backgroundPositionY: '0px',
    }
    cssClass += ' cat-yawn'
  } else if (state === 'jump') {
    spriteStyle = {
      backgroundImage: `url(${catJumpUrl})`,
      backgroundSize:  `${SZ.jump.w}px ${SZ.jump.h}px`,
      backgroundPositionY: `${JUMP_ROW[dir]}px`,
    }
    cssClass += ' cat-jump'
  }

  return (
    <div
      className={cssClass}
      aria-hidden="true"
      style={{
        position: 'absolute',
        left:     Math.round(pos.x),
        top:      Math.round(pos.y),
        width:    CAT_PX,
        height:   CAT_PX,
        zIndex,
        pointerEvents: 'none',
        backgroundRepeat: 'no-repeat',
        ...spriteStyle,
      }}
    />
  )
}
