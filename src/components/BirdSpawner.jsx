/**
 * BirdSpawner — renders an ambient blue robin that periodically flies in,
 * perches for a while, then flies off. Purely decorative, no game-state impact.
 *
 * Sprites (56×56 native):
 *   bird_fly_east.png  — 9-frame wing-flap sheet  (504×56 native)
 *   bird_fly_west.png  — same, mirrored
 *   bird_perch.png     — 5-frame chest-breathing   (280×56 native)
 *
 * Phase machine:
 *   idle → appear (1 frame, sets start position) → flying_in → perching → flying_out → idle
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import birdFlyEastUrl from '../assets/sprites/bird/bird_fly_east.png'
import birdFlyWestUrl from '../assets/sprites/bird/bird_fly_west.png'
import birdPerchUrl   from '../assets/sprites/bird/bird_perch.png'
import './BirdSpawner.css'

const BIRD_SIZE  = 56        // native px per frame
const BIRD_SCALE = 1.5       // render at 84×84
const BIRD_PX    = BIRD_SIZE * BIRD_SCALE   // 84

const FLY_PX_S   = 180       // flight speed px/s

// Perch locations: x in world px, y from world top.
// Chosen to sit near tree-tops and elevated props.
const PERCH_POINTS = [
  { x: 115, y: 335 },
  { x: 355, y: 305 },
  { x: 630, y: 320 },
  { x: 890, y: 295 },
  { x: 1150, y: 315 },
]

const PERCH_MIN_MS  = 10_000
const PERCH_MAX_MS  = 20_000
const SPAWN_MIN_MS  =  8_000  // first visit comes quickly for testing; raise to 40_000 for production
const SPAWN_MAX_MS  = 20_000  // raise to 90_000 for production

export default function BirdSpawner({ worldWidth = 1344 }) {
  const [bird, setBird]   = useState(null)
  const spawnRef          = useRef(null)
  const phaseRef          = useRef(null)

  const scheduleSpawn = useCallback(() => {
    const delay = SPAWN_MIN_MS + Math.random() * (SPAWN_MAX_MS - SPAWN_MIN_MS)
    spawnRef.current = setTimeout(() => {
      const perch        = PERCH_POINTS[Math.floor(Math.random() * PERCH_POINTS.length)]
      const fromLeft     = Math.random() < 0.5
      const startX       = fromLeft ? -BIRD_PX - 10 : worldWidth + 10
      const exitX        = fromLeft ? worldWidth + 10 : -BIRD_PX - 10
      const dir          = fromLeft ? 'east' : 'west'
      const perchDur     = PERCH_MIN_MS + Math.random() * (PERCH_MAX_MS - PERCH_MIN_MS)
      const flyInDurS    = Math.abs(startX - perch.x) / FLY_PX_S
      const flyOutDurS   = Math.abs(perch.x - exitX)  / FLY_PX_S

      setBird({ startX, perchX: perch.x, perchY: perch.y, exitX,
                dir, phase: 'appear', perchDur, flyInDurS, flyOutDurS })
    }, delay)
  }, [worldWidth])

  // Kick off first spawn on mount
  useEffect(() => {
    scheduleSpawn()
    return () => {
      clearTimeout(spawnRef.current)
      clearTimeout(phaseRef.current)
    }
  }, [scheduleSpawn])

  // Phase transitions
  useEffect(() => {
    if (!bird) return
    clearTimeout(phaseRef.current)

    if (bird.phase === 'appear') {
      // Paint one frame at startX, then immediately trigger flying_in
      // so the CSS transition has a starting position to animate from.
      const raf = requestAnimationFrame(() =>
        setBird(b => b ? { ...b, phase: 'flying_in' } : null)
      )
      return () => cancelAnimationFrame(raf)
    }

    if (bird.phase === 'flying_in') {
      phaseRef.current = setTimeout(
        () => setBird(b => b ? { ...b, phase: 'perching' } : null),
        bird.flyInDurS * 1000
      )
    }

    if (bird.phase === 'perching') {
      phaseRef.current = setTimeout(
        () => setBird(b => b ? { ...b, phase: 'flying_out' } : null),
        bird.perchDur
      )
    }

    if (bird.phase === 'flying_out') {
      phaseRef.current = setTimeout(() => {
        setBird(null)
        scheduleSpawn()
      }, bird.flyOutDurS * 1000)
    }
  }, [bird?.phase, scheduleSpawn])

  if (!bird) return null

  const { phase, startX, perchX, perchY, exitX, dir, flyInDurS, flyOutDurS } = bird

  const isFlying   = phase === 'flying_in' || phase === 'flying_out'
  const renderX    = phase === 'appear'     ? startX
                   : phase === 'flying_in'  ? perchX
                   : phase === 'perching'   ? perchX
                   : exitX   // flying_out

  const transDurS  = phase === 'flying_in'  ? flyInDurS
                   : phase === 'flying_out' ? flyOutDurS
                   : 0

  const spriteUrl  = isFlying
    ? (dir === 'east' ? birdFlyEastUrl : birdFlyWestUrl)
    : birdPerchUrl

  const frameCols  = isFlying ? 9 : 5
  const sheetW     = BIRD_SIZE * frameCols * BIRD_SCALE  // scaled sheet width in px

  return (
    <div
      className={isFlying ? 'bird-fly' : 'bird-perch'}
      style={{
        position:         'absolute',
        left:             renderX,
        top:              perchY,
        width:            BIRD_PX,
        height:           BIRD_PX,
        backgroundImage:  `url(${spriteUrl})`,
        backgroundSize:   `${sheetW}px ${BIRD_PX}px`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '0 0',
        imageRendering:   'pixelated',
        transition:       transDurS > 0 ? `left ${transDurS}s linear` : 'none',
        zIndex:           300,
        pointerEvents:    'none',
      }}
    />
  )
}
