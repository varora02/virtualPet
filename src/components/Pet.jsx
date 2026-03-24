/**
 * Pet — top-level scene component.
 *
 * Owns:
 *   • Scene layout (TileMap, PathOverlay, WorldProps, FenceOverlay)
 *   • Night overlay + light glows
 *   • Hare sprite + ghost bud
 *   • In-world level popup
 *
 * Movement and interaction logic → useHareMovement (src/hooks/useHareMovement.js)
 * Grass patch state             → useGrassPatches  (src/hooks/useGrassPatches.js)
 * Prop data + asset map         → worldData.js      (src/worldData.js)
 * World dimensions              → worldConfig.js    (src/worldConfig.js)
 *
 * ─── ADDING A NEW INTERACTION ────────────────────────────────────────────────
 * See the extensibility guide at the top of useHareMovement.js.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react'
import grassUrl         from '../assets/svgs/grass.svg'
import grass2Url        from '../assets/tiles/decor_grass_2.png'
import grass3Url        from '../assets/tiles/decor_grass_4.png'
import TileMap          from './TileMap.jsx'
import PathOverlay      from './PathOverlay.jsx'
import FenceOverlay     from './FenceOverlay.jsx'
import WorldProps       from './WorldProps.jsx'
import { WORLD_PROPS }  from '../worldData.js'
import {
  HARE_PX,
  Z_BASE, Z_GLOW,
  AREA_W, AREA_H,
} from '../worldConfig.js'
import { useGrassPatches }  from '../hooks/useGrassPatches.js'
import { useHareMovement }  from '../hooks/useHareMovement.js'

// Sprite sheets
import hareWalkShadow  from '../assets/sprites/Hare_Walk_with_shadow.png'     // 5 frames, 160×128
import hareRunShadow   from '../assets/sprites/Hare_Run_with_shadow.png'    // 6 frames, 192×128
import hareEating      from '../assets/sprites/Hare_Eating.png'             // 5 frames reversed
import hareDrinking    from '../assets/sprites/Hare_Drinking.png'           // 4 frames
import hareIdle        from '../assets/sprites/Hare_Idle.png'
import hareDeath       from '../assets/sprites/Hare_Death.png'
import hareReading     from '../assets/sprites/Hare_reading_with_shadow.png' // 6 frames × 4 rows, 1024×682

import './Pet.css'

// ── Sprite direction row offsets (2.5× scale → 80px per row) ──
const DIR_OFFSETS = { down: 0, up: -80, left: -160, right: -240 }

// ── Ghost bud offset from main hare (px) ──────────────────────
const GHOST_OFFSET_X = 90
const GHOST_OFFSET_Y = -10

// ── Day / night helpers ────────────────────────────────────────
function getPSTHour() {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  ).getHours()
}
function checkIsNight() {
  const h = getPSTHour(); return h >= 16 || h < 3
}

// ─────────────────────────────────────────────────────────────

export default function Pet({
  pet,
  hasInteracted      = false,
  feedTrigger        = 0,
  restTrigger        = 0,
  waterTrigger       = 0,
  studyTrigger       = 0,   // start: hare walks to tree → enters 'study' state
  studyPauseTrigger  = 0,   // pause: switches to 'study_pause' (row 1)
  studyResumeTrigger = 0,   // resume: returns to 'study' (rows 3 & 4)
  studyStopTrigger   = 0,   // stop:  returns to 'idle'
  celebrateTrigger   = 0,   // session complete: victory lap through unlocked areas
  unlockedAreas      = [0],
  visibleProps       = null,
  onAte              = null,
  level              = 1,
  isLevelingUp       = false,
  onLevelUpComplete  = null,
  onPetClick         = null,
  isPaused           = false,
  ghostBudActive     = false,
  showLevelPopup     = false,
  onCloseLevelPopup  = null,
  expInLevel         = 0,
  expPct             = 0,
  expPerLevel        = 100,
  pathVisible        = false,
  areaTiers          = { 0: 1 },
  upgradedArea       = null,
}) {
  const [isNight, setIsNight] = useState(checkIsNight)
  const onPetClickRef         = useRef(onPetClick)
  useEffect(() => { onPetClickRef.current = onPetClick }, [onPetClick])

  // Day/night polling
  useEffect(() => {
    const id = setInterval(() => setIsNight(checkIsNight()), 60000)
    return () => clearInterval(id)
  }, [])

  // ── Grass patches ─────────────────────────────────────────────
  const { grassPatches, grassPatchesRef, hideGrassPatch, restoreGrassPatch }
    = useGrassPatches(unlockedAreas)

  // ── Hare movement ─────────────────────────────────────────────
  const { petPos, direction, eatState, arrivedAtTree } = useHareMovement({
    pet,
    unlockedAreas,
    visibleProps,
    feedTrigger,
    restTrigger,
    waterTrigger,
    studyTrigger,
    studyPauseTrigger,
    studyResumeTrigger,
    studyStopTrigger,
    celebrateTrigger,
    isLevelingUp,
    isPaused,
    grassPatchesRef,
    hideGrassPatch,
    restoreGrassPatch,
    onAte,
    onLevelUpComplete,
  })

  // ── Derived display values ────────────────────────────────────
  const avgStat = (pet.hunger + pet.thirst + pet.energy + pet.happiness) / 4
  const mood    = avgStat >= 80 ? 'happy' : avgStat >= 50 ? 'neutral' : avgStat >= 25 ? 'sad' : 'critical'
  const isTired = pet.energy <= 10

  const isLevelingState = eatState === 'leveling'
  const isActionAnim    = eatState === 'eating' || eatState === 'drinking'
  const isStudyState    = eatState === 'study' || eatState === 'study_pause'
  const showDead        = isTired && arrivedAtTree
  // study states don't use directional rows; everything else does
  const dirOffset       = (isActionAnim || isStudyState) ? 0 : DIR_OFFSETS[direction]

  // ── Sprite selection ──────────────────────────────────────────
  const spriteUrl = showDead
    ? hareDeath
    : (eatState === 'study' || eatState === 'study_pause' || eatState === 'going_study')
      ? hareReading
      : eatState === 'eating'
        ? hareEating
        : eatState === 'drinking'
          ? hareDrinking
          : (eatState === 'resting' || isLevelingState)
            ? hareIdle
            : (eatState === 'going' || eatState === 'going_water' || eatState === 'going_celebrate')
              ? hareRunShadow
              : hareWalkShadow

  // ── CSS class selection ───────────────────────────────────────
  const hareClass = showDead
    ? 'hare-state-dead'
    : eatState === 'study'
      ? 'hare-state-study'
      : eatState === 'study_pause'
        ? 'hare-state-study-pause'
        : eatState === 'going_study'
          ? 'hare-state-run'       // runs to tree
          : eatState === 'eating'
            ? 'hare-state-eat'
            : eatState === 'drinking'
              ? 'hare-state-drink'
              : eatState === 'resting'
                ? 'hare-state-rest'
                : isLevelingState
                  ? 'hare-state-rest hare-levelup'
                  : (eatState === 'going' || eatState === 'going_water')
                    ? 'hare-state-run'
                    : 'hare-state-walk'

  // Depth-sort z-index: foot of hare = y + HARE_PX
  const hareZ = Z_BASE + Math.round(petPos.y + HARE_PX)

  const ghostPos = {
    x: petPos.x + GHOST_OFFSET_X,
    y: petPos.y + GHOST_OFFSET_Y,
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className={`world-scene mood-${mood}`} style={isNight ? { filter: 'brightness(0.68) saturate(0.82)' } : {}}>

      <TileMap />
      {pathVisible && <PathOverlay />}
      <WorldProps worldProps={visibleProps ?? undefined} />
      <FenceOverlay unlockedAreas={unlockedAreas} />

      {/* Night overlay — above all depth-sorted content (z=818) */}
      {isNight && <div className="night-overlay" aria-hidden="true" />}

      {/* Night light glows — radial halos above the night overlay (z=820).
          Reads emitsLight, glowRadius, glowOffsetY, glowCssClass from each prop.
          To add a new light source: set emitsLight:true on its entry in worldData.js.
          To customise the glow style: set glowCssClass to a new CSS class in Pet.css. */}
      {isNight && (visibleProps ?? WORLD_PROPS).filter(p => p.emitsLight).map(p => {
        const r   = p.glowRadius   ?? 80
        const gy  = p.glowOffsetY  ?? 0.5
        const cx  = p.x + p.displayW / 2
        const cy  = p.y + p.displayH * gy
        return (
          <div
            key={`glow_${p.id}`}
            className={`light-glow${p.glowCssClass ? ` ${p.glowCssClass}` : ''}`}
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

      {/* Grass patches — 3 variants for visual variety */}
      {grassPatches.map((g, i) => {
        if (!g.visible) return null
        const src = g.variant === 1 ? grass2Url : g.variant === 2 ? grass3Url : grassUrl
        const cls = g.variant === 1 ? 'world-grass world-grass--v2'
                  : g.variant === 2 ? 'world-grass world-grass--v3'
                  : 'world-grass'
        return (
          <img key={i} src={src} alt="grass" className={cls}
            style={{ left: `${g.x}px`, top: `${g.y}px` }} />
        )
      })}

      {/* Ghost Bud — mirrors main hare with translucent white tint */}
      {ghostBudActive && (
        <div
          className={`hare-walker hare-ghost ${hareClass}`}
          style={{
            left:   `${ghostPos.x}px`,
            top:    `${ghostPos.y}px`,
            zIndex: hareZ - 1,
            '--sprite-url': `url(${spriteUrl})`,
            '--dir-offset': `${dirOffset}px`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Hare — depth-sorted, clickable for level popup */}
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

      {/* ── Cloud/fog cover for locked areas ─────────────────────
          An area is locked when areaTiers[id] === 0 (or missing).
          Area 0 always starts at tier 1 so it will never show a cloud. */}
      {[0,1,2,3,4,5,6,7,8].map(areaId => {
        const tier = areaTiers[areaId] ?? 0
        if (tier > 0) return null   // unlocked — no cloud
        const col       = areaId % 3
        const screenRow = 2 - Math.floor(areaId / 3)
        const INSET = 22  // keep cloud clear of fence border pixels
        return (
          <div
            key={`cloud_${areaId}`}
            className="locked-area-cloud"
            style={{
              left:   col * AREA_W + INSET,
              top:    screenRow * AREA_H + INSET,
              width:  AREA_W - INSET * 2,
              height: AREA_H - INSET * 2,
            }}
          >
            <div className="cloud-puff cloud-puff-1" />
            <div className="cloud-puff cloud-puff-2" />
            <div className="cloud-puff cloud-puff-3" />
            <div className="cloud-puff cloud-puff-4" />
            <div className="cloud-puff cloud-puff-5" />
            <div className="cloud-puff cloud-puff-6" />
            <div className="cloud-puff cloud-puff-7" />
            <span className="cloud-mystery-label">✨ Locked</span>
          </div>
        )
      })}

      {/* ── Area upgrade flash ────────────────────────────────────
          Briefly flashes golden when a tier upgrade or unlock purchase goes through. */}
      {upgradedArea !== null && (() => {
        const col       = upgradedArea % 3
        const screenRow = 2 - Math.floor(upgradedArea / 3)
        return (
          <div
            className="area-upgrade-flash"
            style={{ left: col * AREA_W, top: screenRow * AREA_H, width: AREA_W, height: AREA_H }}
          />
        )
      })()}

      {/* Scene edge vignette — subtle darkness around map perimeter for focus */}
      <div className="scene-vignette" aria-hidden="true" />

    </div>
  )
}
