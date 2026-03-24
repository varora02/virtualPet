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

// Bubby (tuxedo cat) sprites — native 56px, displayed at 80px
import catWalk  from '../assets/sprites/cat_walk.png'   // 448×224 — 8fr × 4dirs
import catRun   from '../assets/sprites/cat_run.png'    // 336×224 — 6fr × 4dirs
import catEat   from '../assets/sprites/cat_eat.png'    // 392×112 — 7fr × east+west
import catDrink from '../assets/sprites/cat_drink.png'  // 336×56  — 6fr south
import catSit   from '../assets/sprites/cat_sit.png'    // 448×112 — 8fr × east+west
import catLick  from '../assets/sprites/cat_lick.png'   // 672×56  — 12fr south
import catPuke  from '../assets/sprites/cat_puke.png'   // 504×112 — 9fr × east+west
import catJump  from '../assets/sprites/cat_jump.png'   // 448×112 — 8fr × east+west
import catYawn  from '../assets/sprites/cat_yawn.png'   // 616×56  — 11fr south
import catBall  from '../assets/sprites/cat_ball.png'   // 504×112 — 9fr × east+west
import catStand from '../assets/sprites/cat_stand.png'  // 504×112 — 9fr × east+west

import './Pet.css'
import './BubbyCat.css'

// ── Sprite direction row offsets (2.5× scale → 80px per row) ──
const DIR_OFFSETS = { down: 0, up: -80, left: -160, right: -240 }

// ── Ghost bud offset from main hare (px) ──────────────────────
const GHOST_OFFSET_X = 90
const GHOST_OFFSET_Y = -10

// ── Bubby (cat) display constants — native 56px, shown at 80px ─
const BUBBY_PX    = 80
const BUBBY_SCALE = BUBBY_PX / 56
const BUBBY_SZ = {
  walk:  { w: Math.round(448 * BUBBY_SCALE), h: Math.round(224 * BUBBY_SCALE) },
  run:   { w: Math.round(336 * BUBBY_SCALE), h: Math.round(224 * BUBBY_SCALE) },
  eat:   { w: Math.round(392 * BUBBY_SCALE), h: Math.round(112 * BUBBY_SCALE) },
  drink: { w: Math.round(336 * BUBBY_SCALE), h: Math.round( 56 * BUBBY_SCALE) },
  sit:   { w: Math.round(448 * BUBBY_SCALE), h: Math.round(112 * BUBBY_SCALE) },
  lick:  { w: Math.round(672 * BUBBY_SCALE), h: Math.round( 56 * BUBBY_SCALE) },
  puke:  { w: Math.round(504 * BUBBY_SCALE), h: Math.round(112 * BUBBY_SCALE) },
  jump:  { w: Math.round(448 * BUBBY_SCALE), h: Math.round(112 * BUBBY_SCALE) },
  yawn:  { w: Math.round(616 * BUBBY_SCALE), h: Math.round( 56 * BUBBY_SCALE) },
  ball:  { w: Math.round(504 * BUBBY_SCALE), h: Math.round(112 * BUBBY_SCALE) },
  stand: { w: Math.round(504 * BUBBY_SCALE), h: Math.round(112 * BUBBY_SCALE) },
}
// Direction rows for cat walk/run (4-dir sheets, 80px per row)
const BUBBY_DIR_ROW = { down: 0, up: -BUBBY_PX, left: -BUBBY_PX * 2, right: -BUBBY_PX * 3 }
// East/West rows for eat, sit, puke, jump (2-row sheets)
const BUBBY_EW_ROW  = { right: 0, left: -BUBBY_PX, down: 0, up: 0 }

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
  petType            = 'rompy',  // 'rompy' | 'bubby'
  petHunger          = 80,
  greetTrigger       = 0,        // increment to send Bubby to area center + lick
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

  // ── Hare/Bubby movement ───────────────────────────────────────
  const greetArrivedRef = useRef(null)
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
    greetTrigger:    petType === 'bubby' ? greetTrigger : 0,
    onGreetArrived:  () => { if (greetArrivedRef.current) greetArrivedRef.current() },
    wellYOffset:     petType === 'bubby' ? -32 : 0,
    isLevelingUp,
    isPaused,
    grassPatchesRef,
    hideGrassPatch,
    restoreGrassPatch,
    onAte,
    onLevelUpComplete,
  })

  // ── Bubby special animations ──────────────────────────────────
  // 'lick' | 'yawn' | 'puke' | 'stand' | null — overrides idle sprite when set
  const [catSpecialAnim,    setCatSpecialAnim]    = useState(null)
  const catSpecialTimerRef  = useRef(null)
  const catInnerTimerRef    = useRef(null)   // tracks the "play then reschedule" inner timer
  const prevEatStateRef     = useRef('idle')
  // Ref mirror of eatState — used inside async timer callbacks to read latest value
  const eatStateRefLocal    = useRef(eatState)
  useEffect(() => { eatStateRefLocal.current = eatState }, [eatState])

  // Helper: is Bubby currently moving in any way?
  const isAnyMoving = (es) =>
    es === 'going' || es === 'going_water' || es === 'going_study' ||
    es === 'going_greet' || es === 'going_celebrate'

  // Clear special anim the moment Bubby starts moving (guard against timer race)
  useEffect(() => {
    if (petType !== 'bubby') return
    if (isAnyMoving(eatState)) {
      setCatSpecialAnim(null)
      clearTimeout(catSpecialTimerRef.current)
      clearTimeout(catInnerTimerRef.current)
    }
  }, [petType, eatState])

  // Periodic lick / yawn — only while fully still (idle or resting)
  useEffect(() => {
    if (petType !== 'bubby') return
    if (eatState !== 'idle' && eatState !== 'resting') return
    const schedule = () => {
      catSpecialTimerRef.current = setTimeout(() => {
        // Double-check we're still still before playing
        const cur = eatStateRefLocal.current
        if (cur !== 'idle' && cur !== 'resting') { schedule(); return }
        const pick = Math.random() < 0.6 ? 'lick' : 'yawn'
        const dur  = pick === 'lick' ? 1540 : 1400  // 11 steps×140ms vs 10 steps×140ms
        setCatSpecialAnim(pick)
        catInnerTimerRef.current = setTimeout(() => {
          setCatSpecialAnim(null)
          // Only reschedule if still in an idle/resting state
          const curAfter = eatStateRefLocal.current
          if (curAfter === 'idle' || curAfter === 'resting') schedule()
        }, dur)
      }, 8000 + Math.random() * 12000)
    }
    schedule()
    return () => {
      clearTimeout(catSpecialTimerRef.current)
      clearTimeout(catInnerTimerRef.current)
    }
  }, [petType, eatState])

  // Puke when hunger < 10% — only while still
  useEffect(() => {
    if (petType !== 'bubby' || petHunger >= 10) return
    if (eatState !== 'idle' && eatState !== 'resting') return
    const t = setTimeout(() => {
      if (eatStateRefLocal.current !== 'idle' && eatStateRefLocal.current !== 'resting') return
      setCatSpecialAnim('puke')
      catInnerTimerRef.current = setTimeout(() => setCatSpecialAnim(null), 1120)  // 8 steps × 140ms
    }, 3000 + Math.random() * 6000)
    return () => clearTimeout(t)
  }, [petType, petHunger, eatState])

  // Stand up after resting
  useEffect(() => {
    if (petType !== 'bubby') return
    if (eatState === 'idle' && prevEatStateRef.current === 'resting') {
      setCatSpecialAnim('stand')
      const t = setTimeout(() => setCatSpecialAnim(null), 1120)  // 8 steps × 140ms
      return () => clearTimeout(t)
    }
    prevEatStateRef.current = eatState
  }, [petType, eatState])

  // Wire up greet arrival → play lick
  useEffect(() => {
    greetArrivedRef.current = () => {
      setCatSpecialAnim('lick')
      setTimeout(() => setCatSpecialAnim(null), 1540)
    }
  }, [])

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
    : (eatState === 'study' || eatState === 'study_pause')
      ? hareReading
      : eatState === 'eating'
        ? hareEating
        : eatState === 'drinking'
          ? hareDrinking
          : (eatState === 'resting' || isLevelingState)
            ? hareIdle
            : (eatState === 'going' || eatState === 'going_water' || eatState === 'going_celebrate' || eatState === 'going_study')
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

  // ── Bubby sprite computation ───────────────────────────────────
  const bubbyZ = Z_BASE + Math.round(petPos.y + BUBBY_PX)
  let bubbySprite    = null
  let bubbyCssClass  = 'bubby-cat'
  let bubbyBgSize    = ''
  let bubbyBgPosY    = '0px'

  if (petType === 'bubby') {
    const isRunning  = eatState === 'going' || eatState === 'going_water'
                    || eatState === 'going_study' || eatState === 'going_greet'
                    || eatState === 'going_celebrate'
    const isEating   = eatState === 'eating'
    const isDrinking = eatState === 'drinking'
    const isResting  = eatState === 'resting' || eatState === 'study'
                    || eatState === 'study_pause' || isLevelingState || showDead
    // Special animations only play when Bubby is completely still (not moving)
    const canPlaySpecial = !isRunning && !isEating && !isDrinking

    if (eatState === 'celebrate_ball') {
      // Ball animation while stopped at celebrate waypoint
      bubbySprite    = catBall
      bubbyCssClass += ' bubby-ball'
      bubbyBgSize    = `${BUBBY_SZ.ball.w}px ${BUBBY_SZ.ball.h}px`
      bubbyBgPosY    = `${BUBBY_EW_ROW[direction]}px`
    } else if (canPlaySpecial && catSpecialAnim === 'stand') {
      bubbySprite    = catStand
      bubbyCssClass += ' bubby-stand'
      bubbyBgSize    = `${BUBBY_SZ.stand.w}px ${BUBBY_SZ.stand.h}px`
      bubbyBgPosY    = `${BUBBY_EW_ROW[direction]}px`
    } else if (canPlaySpecial && catSpecialAnim === 'puke') {
      bubbySprite    = catPuke
      bubbyCssClass += ' bubby-puke'
      bubbyBgSize    = `${BUBBY_SZ.puke.w}px ${BUBBY_SZ.puke.h}px`
      bubbyBgPosY    = `${BUBBY_EW_ROW[direction]}px`
    } else if (canPlaySpecial && catSpecialAnim === 'lick') {
      bubbySprite    = catLick
      bubbyCssClass += ' bubby-lick'
      bubbyBgSize    = `${BUBBY_SZ.lick.w}px ${BUBBY_SZ.lick.h}px`
      bubbyBgPosY    = '0px'
    } else if (canPlaySpecial && catSpecialAnim === 'yawn') {
      bubbySprite    = catYawn
      bubbyCssClass += ' bubby-yawn'
      bubbyBgSize    = `${BUBBY_SZ.yawn.w}px ${BUBBY_SZ.yawn.h}px`
      bubbyBgPosY    = '0px'
    } else if (isEating) {
      bubbySprite    = catEat
      bubbyCssClass += ' bubby-eat'
      bubbyBgSize    = `${BUBBY_SZ.eat.w}px ${BUBBY_SZ.eat.h}px`
      bubbyBgPosY    = `${BUBBY_EW_ROW[direction]}px`
    } else if (isDrinking) {
      bubbySprite    = catDrink
      bubbyCssClass += ' bubby-drink'
      bubbyBgSize    = `${BUBBY_SZ.drink.w}px ${BUBBY_SZ.drink.h}px`
      bubbyBgPosY    = '0px'
    } else if (isRunning) {
      // All purposeful running (including going_celebrate) shows run animation
      bubbySprite    = catRun
      bubbyCssClass += ' bubby-run'
      bubbyBgSize    = `${BUBBY_SZ.run.w}px ${BUBBY_SZ.run.h}px`
      bubbyBgPosY    = `${BUBBY_DIR_ROW[direction]}px`
    } else if (isResting) {
      bubbySprite    = catSit
      bubbyCssClass += ' bubby-sit'
      bubbyBgSize    = `${BUBBY_SZ.sit.w}px ${BUBBY_SZ.sit.h}px`
      bubbyBgPosY    = `${BUBBY_EW_ROW[direction]}px`
    } else {
      bubbySprite    = catWalk
      bubbyCssClass += ' bubby-walk'
      bubbyBgSize    = `${BUBBY_SZ.walk.w}px ${BUBBY_SZ.walk.h}px`
      bubbyBgPosY    = `${BUBBY_DIR_ROW[direction]}px`
    }
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


      {/* Active pet — Rompy (hare) or Bubby (cat) */}
      {petType === 'bubby' ? (
        <div
          className={bubbyCssClass}
          style={{
            position:          'absolute',
            left:              Math.round(petPos.x),
            top:               Math.round(petPos.y),
            width:             BUBBY_PX,
            height:            BUBBY_PX,
            zIndex:            bubbyZ,
            cursor:            'pointer',
            pointerEvents:     'auto',
            backgroundImage:   bubbySprite ? `url(${bubbySprite})` : 'none',
            backgroundSize:    bubbyBgSize,
            backgroundPositionY: bubbyBgPosY,
            backgroundRepeat:  'no-repeat',
          }}
          onClick={() => { if (onPetClickRef.current) onPetClickRef.current() }}
          aria-label="Your pet cat — click to see level"
          title="Click to see level"
        />
      ) : (
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
      )}

      {/* In-world level popup — floats above the hare.
          z-index 900 keeps it above fences (798), clouds (790),
          night overlay (818) and light glows (820). */}
      {showLevelPopup && (
        <div
          className="hare-level-popup"
          style={{
            left:   petPos.x + HARE_PX / 2,
            top:    petPos.y - 12,
            zIndex: 900,
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
