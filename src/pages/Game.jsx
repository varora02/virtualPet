import { useState, useEffect, useRef } from 'react'
import { signOut } from 'firebase/auth'
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import Pet from '../components/Pet'
import PomodoroTimer from '../components/PomodoroTimer'
import ActivityLog from '../components/ActivityLog'
import { EXP_PER_LEVEL, PLAY_EXP_REWARD, ABILITIES } from '../levelConfig'
import basketballUrl  from '../assets/svgs/basketball.svg'
import soccerballUrl  from '../assets/svgs/soccerball.svg'
import { WORLD_PROPS } from '../worldData'
import './Game.css'

const STORAGE_KEY = 'virtualpet_progression'
// Unlock order: BL(0) → BM(1) → BR(2) → ML(3) → MM(4) → MR(5) → TL(6) → TM(7) → TR(8)
// Area 0 is always pre-unlocked at tier 1; upgrades + new areas proceed from there.
const PROGRESSION_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8]

function loadProgression() {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    return s ? JSON.parse(s) : null
  } catch { return null }
}

const DEFAULT_PET = {
  name: 'Rompy',
  hunger: 80,
  thirst: 80,
  energy: 80,
  happiness: 80,
  coins: 0,
  experience: 0,
  level: 1,
  lastLoginDate: null,
  loginStreak: 0,
  ownedItems: [],
  unlockedAreas: [0],   // area 0 (bottom-left) always unlocked
  lastFed: null,
  lastWatered: null,
  activities: [],
  todayStudySessions: 0,
  lastStudyDate: null,
}

const SHOP_ITEMS = [
  { id: 'basketball', name: 'Basketball', imgUrl: null, icon: '🏀', cost: 1, desc: 'An orange ball Rompy loves to dribble' },
  { id: 'soccerball', name: 'Soccer Ball', imgUrl: null, icon: '⚽', cost: 1, desc: 'A classic ball for a kick-around' },
]

// Visual grouping for the shop UI — area unlocks live in ProgressionRoadmap, not here
const SHOP_SECTIONS = [
  { id: 'toys',  label: '🧸 Toys', itemIds: ['basketball', 'soccerball'] },
]

// Inject real SVG URLs after import (can't do this at module level before imports)
SHOP_ITEMS[0].imgUrl = basketballUrl
SHOP_ITEMS[1].imgUrl = soccerballUrl

function Game({ user }) {
  const _saved = loadProgression()
  // Area 0 (BL) always starts at tier 1; player upgrades it before unlocking area 1
  const [areaTiers, setAreaTiers] = useState(_saved?.areaTiers ?? { 0: 1 })

  const [pet, setPet]                   = useState(DEFAULT_PET)
  const [petKey, setPetKey]             = useState(0)   // increment → forces Pet remount → respawn at SPAWN_X/Y
  const [loading, setLoading]           = useState(true)
  const [showActions, setShowActions]   = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [feedTrigger,        setFeedTrigger]        = useState(0)
  const [restTrigger,        setRestTrigger]        = useState(0)
  const [waterTrigger,       setWaterTrigger]       = useState(0)
  const [studyTrigger,       setStudyTrigger]       = useState(0)
  const [studyPauseTrigger,  setStudyPauseTrigger]  = useState(0)
  const [studyResumeTrigger, setStudyResumeTrigger] = useState(0)
  const [studyStopTrigger,   setStudyStopTrigger]   = useState(0)
  const [celebrateTrigger,   setCelebrateTrigger]   = useState(0)
  const studyStartedRef = useRef(false)  // true once hare has been sent to a tree
  const [showStretchPopup, setShowStretchPopup] = useState(false)
  const [showShop, setShowShop]         = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [upgradedArea, setUpgradedArea] = useState(null)  // areaId that just upgraded → flash

  // ── Level-up & popup state ────────────────────────────────────
  const [isLevelingUp, setIsLevelingUp]   = useState(false)
  const [showLevelPopup, setShowLevelPopup] = useState(false)

  // ── Ability state ─────────────────────────────────────────────
  const [ghostBudActive, setGhostBudActive] = useState(false)
  const ghostBudTimerRef = useRef(null)
  // Flash fires AFTER the shop closes — store the areaId here during purchase,
  // then trigger setUpgradedArea when the modal's onClose fires.
  const pendingFlashAreaRef = useRef(null)

  const hasCheckedDaily                 = useRef(false)
  const petRef                          = useRef(pet)
  useEffect(() => { petRef.current = pet }, [pet])

  // ── Persist local progression to localStorage ─────────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      areaTiers,
      unlockedAreas: pet.unlockedAreas || [0],
      coins: pet.coins || 0,
    }))
  }, [areaTiers, pet.unlockedAreas, pet.coins])

  const userName = user.email.includes('varun') ? 'Varun' : 'Leena'

  // Compute level from experience (level 1 = 0–99 exp, level 2 = 100–199, etc.)
  const computeLevel = (exp) => Math.floor((exp || 0) / EXP_PER_LEVEL) + 1

  // Real-time listener
  useEffect(() => {
    const petRef = doc(db, 'pets', 'shared-pet')

    const unsubscribe = onSnapshot(petRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        if (data.name === 'Ellie') {
          updateDoc(petRef, { name: 'Rompy' })
          data.name = 'Rompy'
        }
        setPet({ ...DEFAULT_PET, ...data })

        // Daily login streak — fires once per calendar day, first time pet loads
        if (!hasCheckedDaily.current) {
          hasCheckedDaily.current = true
          const today = new Date().toDateString()
          if (data.lastLoginDate !== today) {
            // Calculate streak: consecutive day = yesterday's date?
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayStr = yesterday.toDateString()
            const prevStreak = data.loginStreak || 0
            const newStreak = data.lastLoginDate === yesterdayStr ? prevStreak + 1 : 1
            updateDoc(petRef, {
              lastLoginDate: today,
              loginStreak: newStreak,
              activities: arrayUnion({
                text: `${userName} logged in — 🔥 ${newStreak} day streak!`,
                user: userName,
                timestamp: new Date().toISOString()
              })
            })
          }
        }
      } else {
        setDoc(petRef, { ...DEFAULT_PET, createdAt: serverTimestamp() })
      }
      setLoading(false)
    }, (error) => {
      console.error('Firestore error:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Local stat decay
  useEffect(() => {
    const decay = setInterval(() => {
      setPet(prev => ({
        ...prev,
        hunger:    Math.max(0, prev.hunger    - 0.5),
        thirst:    Math.max(0, prev.thirst    - 0.7),
        energy:    Math.max(0, prev.energy    - 0.3),
        happiness: Math.max(0, prev.happiness - 0.4)
      }))
    }, 30000)
    return () => clearInterval(decay)
  }, [])

  // updatePet: coinDelta defaults to 0
  const updatePet = async (updates, activityText, coinDelta = 0) => {
    const petRef = doc(db, 'pets', 'shared-pet')
    setHasInteracted(true)
    const activity = { text: activityText, user: userName, timestamp: new Date().toISOString() }
    try {
      const coinUpdates = coinDelta !== 0
        ? { coins: Math.max(0, (pet.coins || 0) + coinDelta) }
        : {}
      await updateDoc(petRef, { ...updates, ...coinUpdates, activities: arrayUnion(activity) })
    } catch (err) {
      console.error('Error updating pet:', err)
    }
  }

  const feedPet = () => {
    // Just send the hare toward grass — hunger only updates via onAte
    // when the hare actually arrives and finishes eating.
    if (pet.hunger >= 100) return
    setFeedTrigger(n => n + 1)
  }

  // Called by Pet.jsx when the hare completes eating a grass patch.
  // Uses petRef so the value of hunger is always current (not stale closure).
  // Hunger rises by 50 (50% of max) per meal; only fires when real grass was eaten.
  const handleAte = () => {
    const p = petRef.current
    updatePet(
      { hunger: Math.min(100, p.hunger + 50), happiness: Math.min(100, p.happiness + 5) },
      `${userName} fed ${p.name} +1 🪙`,
      1
    )
  }

  const waterPet = () => {
    if (pet.thirst >= 100) return
    setWaterTrigger(n => n + 1)
    updatePet(
      { thirst: Math.min(100, pet.thirst + 25), happiness: Math.min(100, pet.happiness + 3) },
      `${userName} gave ${pet.name} water +1 🪙`,
      1
    )
  }

  const playWithPet = async () => {
    if (pet.energy < 10) return

    const currentExp   = pet.experience || 0
    const currentLevel = pet.level || 1
    const newExp       = currentExp + PLAY_EXP_REWARD
    const newLevel     = computeLevel(newExp)
    const didLevelUp   = newLevel > currentLevel

    const statUpdates = {
      happiness:  Math.min(100, pet.happiness + 15),
      energy:     Math.max(0,   pet.energy    - 10),
      hunger:     Math.max(0,   pet.hunger    - 5),
      thirst:     Math.max(0,   pet.thirst    - 8),
      experience: newExp,
      level:      newLevel,
    }

    const activityText = didLevelUp
      ? `${userName} played with ${pet.name} — Level Up! ⭐ Now level ${newLevel}! +1 🪙`
      : `${userName} played with ${pet.name} +1 🪙`

    await updatePet(statUpdates, activityText, 1)

    if (didLevelUp) {
      setIsLevelingUp(true)
    }
  }

  // Called by Pet after the 2s level-up flash animation ends
  const handleLevelUpComplete = () => {
    setIsLevelingUp(false)
  }

  // Called when user clicks the hare — show level popup & pause movement
  const handlePetClick = () => {
    setShowLevelPopup(true)
  }

  const closeLevelPopup = () => {
    setShowLevelPopup(false)
  }

  const restPet = () => {
    if (pet.energy >= 100) return
    setRestTrigger(n => n + 1)   // signal Pet to stand still 5s
    updatePet(
      { energy: Math.min(100, pet.energy + 30) },
      `${userName} let ${pet.name} rest +1 🪙`,
      1
    )
  }

  const onPomodoroComplete = () => {
    setHasInteracted(true)
    const today = new Date().toDateString()
    const prevSessions = (pet.lastStudyDate === today) ? (pet.todayStudySessions || 0) : 0
    const newTodaySessions = prevSessions + 1
    updatePet(
      {
        hunger: Math.min(100, pet.hunger + 15),
        happiness: Math.min(100, pet.happiness + 20),
        energy: Math.min(100, pet.energy + 10),
        todayStudySessions: newTodaySessions,
        lastStudyDate: today,
      },
      `${userName} finished a study session — ${pet.name} is proud +10 🪙`,
      10
    )
    // Post-session celebrations
    setShowStretchPopup(true)
    setCelebrateTrigger(n => n + 1)
  }

  // ── Study (Pomodoro) hare callbacks ───────────────────────────
  // onStudyStart fires when the timer starts/resumes (work phase only).
  // studyStartedRef tracks whether the hare has already reached a study tree
  // (so subsequent resumes use studyResumeTrigger, not studyTrigger).
  const handleStudyStart = () => {
    if (!studyStartedRef.current) {
      studyStartedRef.current = true
      setStudyTrigger(n => n + 1)   // hare walks to nearest tree
    } else {
      setStudyResumeTrigger(n => n + 1)   // hare already at tree → resume rows 3+4
    }
  }
  const handleStudyPause = () => {
    setStudyPauseTrigger(n => n + 1)
  }
  const handleStudyStop = () => {
    studyStartedRef.current = false
    setStudyStopTrigger(n => n + 1)   // hare returns to idle wander
  }

  const handleStretchYes = () => {
    updatePet(
      { energy: Math.min(100, pet.energy + 3) },
      `${userName} stretched — Rompy is happy! +3 energy ✨`,
      0
    )
    setShowStretchPopup(false)
  }

  // ── Ability handlers ──────────────────────────────────────────

  /**
   * useAbility: dispatches the correct handler for a given ability id.
   * Add new cases here as more abilities are introduced.
   */
  const useAbility = (abilityId) => {
    switch (abilityId) {
      case 'ghost_bud':
        activateGhostBud()
        break
      default:
        console.warn(`Unknown ability: ${abilityId}`)
    }
  }

  const activateGhostBud = () => {
    const ability = ABILITIES.find(a => a.id === 'ghost_bud')
    if (!ability) return
    if (ghostBudActive) return  // already active
    setGhostBudActive(true)
    if (ghostBudTimerRef.current) clearTimeout(ghostBudTimerRef.current)
    ghostBudTimerRef.current = setTimeout(() => {
      setGhostBudActive(false)
    }, ability.duration)
  }

  const buyItem = async (itemId) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId)
    if (!item) return
    if ((pet.coins || 0) < item.cost) return

    const isAreaItem = itemId.startsWith('area_')
    const areaId     = isAreaItem ? parseInt(itemId.split('_')[1]) : null
    const unlocked   = pet.unlockedAreas || [0]

    if (isAreaItem) {
      if (unlocked.includes(areaId)) return                  // already unlocked
      if (areaId > 0 && !unlocked.includes(areaId - 1)) return  // must unlock in order
    } else {
      if ((pet.ownedItems || []).includes(itemId)) return
    }

    const petRef = doc(db, 'pets', 'shared-pet')
    try {
      const itemUpdate = isAreaItem
        ? { unlockedAreas: arrayUnion(areaId) }
        : { ownedItems: arrayUnion(itemId) }
      await updateDoc(petRef, {
        coins: (pet.coins || 0) - item.cost,
        ...itemUpdate,
        activities: arrayUnion({
          text: `${userName} unlocked ${item.name} for Rompy! 🛍`,
          user: userName,
          timestamp: new Date().toISOString()
        })
      })
    } catch (err) {
      console.error('Error buying item:', err)
    }
  }

  // ── Tier progression ──────────────────────────────────────────
  // Area 0 (BL) is always tier 1 from the start. Progression:
  //   Upgrade area 0 T1→T2→T3, then unlock area 1 at T1, upgrade T2→T3, unlock area 2, etc.
  //   After all 9 areas reach T3: offer the path unlock.
  const allAreasMaxed = PROGRESSION_ORDER.every(id => (areaTiers[id] ?? 0) >= 3)
  const pathUnlocked  = pet.pathUnlocked === true

  function getNextUpgrade() {
    for (let i = 0; i < PROGRESSION_ORDER.length; i++) {
      const areaId     = PROGRESSION_ORDER[i]
      const tier       = areaTiers[areaId] ?? 0
      // Area 0 is pre-unlocked — if somehow tier is 0, treat it as tier 1
      const effectiveTier = (i === 0 && tier === 0) ? 1 : tier
      const isUnlocked    = effectiveTier > 0

      if (!isUnlocked) {
        // Area not yet unlocked — only show if previous area is T3
        const prevArea = PROGRESSION_ORDER[i - 1]
        if ((areaTiers[prevArea] ?? 0) < 3) break  // previous not maxed, stop here
        return { type: 'unlock', areaId, cost: 1 }
      }
      if (effectiveTier < 3) {
        return { type: 'tier', areaId, fromTier: effectiveTier, toTier: effectiveTier + 1, cost: 1 }
      }
    }
    // All areas at T3 — offer the path as the final unlock
    if (allAreasMaxed && !pathUnlocked) {
      return { type: 'path', cost: 1 }
    }
    return null
  }

  const handleProgressionPurchase = async () => {
    const next = getNextUpgrade()
    if (!next) return
    if ((pet.coins || 0) < next.cost) return
    const petRef = doc(db, 'pets', 'shared-pet')
    try {
      const areaUpdate = next.type === 'unlock'
        ? { unlockedAreas: arrayUnion(next.areaId) }
        : next.type === 'path'
          ? { pathUnlocked: true }
          : {}
      const activityText = next.type === 'unlock'
        ? `${userName} unlocked area ${next.areaId}! 🗺️`
        : next.type === 'path'
          ? `${userName} unlocked the world path! 🛤️`
          : `${userName} upgraded area ${next.areaId} to tier ${next.toTier}! ⭐`
      await updateDoc(petRef, {
        coins: (pet.coins || 0) - next.cost,
        ...areaUpdate,
        activities: arrayUnion({ text: activityText, user: userName, timestamp: new Date().toISOString() })
      })
      if (next.type === 'unlock') {
        setAreaTiers(prev => ({ ...prev, [next.areaId]: 1 }))
        pendingFlashAreaRef.current = next.areaId   // fires when shop closes
      } else if (next.type === 'tier') {
        setAreaTiers(prev => ({ ...prev, [next.areaId]: next.toTier }))
        pendingFlashAreaRef.current = next.areaId   // fires when shop closes
      }
      // path: pathUnlocked derives from areaTiers in Firestore; pet state will update via onSnapshot
    } catch (err) {
      console.error('Progression purchase error:', err)
    }
  }

  const clearActivity = async () => {
    const petRef = doc(db, 'pets', 'shared-pet')
    try { await updateDoc(petRef, { activities: [] }) }
    catch (err) { console.error('Error clearing activity:', err) }
  }

  const resetGame = async () => {
    const petRef = doc(db, 'pets', 'shared-pet')
    try {
      await setDoc(petRef, { ...DEFAULT_PET, createdAt: serverTimestamp() })
      // Reset local tier state and wipe persisted progression from localStorage
      setAreaTiers({ 0: 1 })
      localStorage.removeItem(STORAGE_KEY)
      setShowResetConfirm(false)
      setGhostBudActive(false)
      setIsLevelingUp(false)
      studyStartedRef.current = false
      setPetKey(k => k + 1)   // force Pet remount → hare respawns in BL area
    } catch (err) {
      console.error('Reset error:', err)
    }
  }

  const handleLogout = async () => {
    try { await signOut(auth) }
    catch (err) { console.error('Logout error:', err) }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <p className="loading-text">Finding Rompy...</p>
      </div>
    )
  }

  const currentLevel = pet.level || 1
  const currentExp   = pet.experience || 0
  const expInLevel   = currentExp % EXP_PER_LEVEL
  const expPct       = Math.round((expInLevel / EXP_PER_LEVEL) * 100)

  // ── Daily study goal (seeded by date, changes each day) ──────
  const _today = new Date()
  const _seed  = _today.getFullYear() * 10000 + (_today.getMonth() + 1) * 100 + _today.getDate()
  const dailyGoal = 2 + (_seed % 3)  // 2, 3, or 4 depending on the day
  const todayStr  = _today.toDateString()
  const todaySessions = (pet.lastStudyDate === todayStr) ? (pet.todayStudySessions || 0) : 0

  // Show tier-1 props for any area that's Firestore-unlocked but not yet in the new tier system.
  const visibleProps = WORLD_PROPS.filter(p => {
    const areaTier = areaTiers[p.areaId] ?? ((pet.unlockedAreas || [0]).includes(p.areaId) ? 1 : 0)
    return (p.tier ?? 1) <= areaTier
  })

  return (
    <div className="game">

      {/* Header */}
      <header className="game-header">
        <h1 className="game-title">Virtual Pet v1</h1>
        <div className="header-right">
          <span className="level-badge" title={`${expInLevel}/${EXP_PER_LEVEL} exp`}>⭐ Lv.{currentLevel}</span>
          <span className="coin-badge">🪙 {pet.coins || 0}</span>
          <span className="streak-badge" title="Login streak">🔥 {pet.loginStreak || 0}</span>
          <span className="user-badge">
            {userName === 'Varun' ? '💙' : '💖'} {userName}
          </span>
          <button className="reset-btn" onClick={() => setShowResetConfirm(true)} title="Reset game state">↺ Reset</button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="reset-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="reset-modal" onClick={e => e.stopPropagation()}>
            <h3 className="reset-modal-title">Reset Game?</h3>
            <p className="reset-modal-body">
              This will reset all stats, coins, owned items and unlocked areas back to defaults. Cannot be undone.
            </p>
            <div className="reset-modal-actions">
              <button className="reset-confirm-btn" onClick={resetGame}>Yes, Reset</button>
              <button className="reset-cancel-btn" onClick={() => setShowResetConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* World — constrained + centered */}
      <div className="world-full">
        <Pet
          key={petKey}
          pet={pet}
          hasInteracted={hasInteracted}
          feedTrigger={feedTrigger}
          restTrigger={restTrigger}
          waterTrigger={waterTrigger}
          studyTrigger={studyTrigger}
          studyPauseTrigger={studyPauseTrigger}
          studyResumeTrigger={studyResumeTrigger}
          studyStopTrigger={studyStopTrigger}
          celebrateTrigger={celebrateTrigger}
          unlockedAreas={pet.unlockedAreas || [0]}
          visibleProps={visibleProps}
          onAte={handleAte}
          level={currentLevel}
          isLevelingUp={isLevelingUp}
          onLevelUpComplete={handleLevelUpComplete}
          onPetClick={handlePetClick}
          isPaused={showLevelPopup}
          ghostBudActive={ghostBudActive}
          showLevelPopup={showLevelPopup}
          onCloseLevelPopup={closeLevelPopup}
          expInLevel={expInLevel}
          expPct={expPct}
          expPerLevel={EXP_PER_LEVEL}
          pathVisible={pet.pathUnlocked === true}
          areaTiers={areaTiers}
          upgradedArea={upgradedArea}
        />
      </div>

      {/* Bottom panels */}
      <div className="game-bottom">

        {/* Left: circular stats + actions + shop toggles */}
        <div className="stats-panel">
          <div className="circ-stats">
            <CircStat label="Hunger"    value={pet.hunger}    color="#e74c3c" emoji="🍎" />
            <CircStat label="Thirst"    value={pet.thirst}    color="#3498db" emoji="💧" />
            <CircStat label="Energy"    value={pet.energy}    color="#f39c12" emoji="⚡" />
            <CircStat label="Happiness" value={pet.happiness} color="#2ecc71" emoji="💚" />
          </div>

          <div className="actions-section">
            <button className="actions-toggle-btn" onClick={() => setShowActions(s => !s)}>
              {showActions ? '▲ Close' : '🎮 Interact with Rompy'}
            </button>
            {showActions && (
              <div className="actions-container">
                {/* Core actions */}
                <div className="actions">
                  <button className="action-btn feed"  onClick={feedPet}>🍎 Feed</button>
                  <button className="action-btn water" onClick={waterPet}>💧 Water</button>
                  <button className="action-btn play"  onClick={playWithPet}>🎾 Play</button>
                  <button className="action-btn rest"  onClick={restPet}>😴 Rest</button>
                </div>

                {/* Abilities section */}
                {ABILITIES.length > 0 && (
                  <div className="abilities-section">
                    <div className="abilities-label">✨ Abilities</div>
                    <div className="abilities-list">
                      {ABILITIES.map(ability => {
                        const unlocked = currentLevel >= ability.requiredLevel
                        const isActive = ability.id === 'ghost_bud' && ghostBudActive
                        return (
                          <div
                            key={ability.id}
                            className={`ability-item${unlocked ? '' : ' ability-locked'}${isActive ? ' ability-active' : ''}`}
                          >
                            <span className="ability-icon">{unlocked ? ability.icon : '🔒'}</span>
                            <div className="ability-info">
                              <span className="ability-name">{ability.name}</span>
                              <span className="ability-desc">
                                {unlocked
                                  ? (isActive ? 'Active…' : ability.desc)
                                  : `Unlocks at level ${ability.requiredLevel}`}
                              </span>
                            </div>
                            <button
                              className={`ability-btn${unlocked && !isActive ? '' : ' disabled'}`}
                              onClick={() => unlocked && !isActive && useAbility(ability.id)}
                              disabled={!unlocked || isActive}
                            >
                              {isActive ? '✓ Active' : unlocked ? 'Use' : `Lv.${ability.requiredLevel}`}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Shop button — opens modal */}
          <div className="shop-section">
            <button className="shop-toggle-btn" onClick={() => setShowShop(true)}>
              🛍 Shop  ·  🪙 {pet.coins || 0}
            </button>
          </div>
        </div>

        {/* Right: Pomodoro + Activity toggle */}
        <div className="right-panel">
          <PomodoroTimer
            onComplete={onPomodoroComplete}
            userName={userName}
            onStudyStart={handleStudyStart}
            onStudyPause={handleStudyPause}
            onStudyStop={handleStudyStop}
            dailyGoal={dailyGoal}
            todaySessions={todaySessions}
          />

          <div className="activity-section">
            <div className="activity-header-row">
              <button className="activity-toggle-btn" onClick={() => setShowActivity(s => !s)}>
                {showActivity ? '▲ Hide Log' : '📋 Activity Log'}
              </button>
              {showActivity && (pet.activities?.length > 0) && (
                <button className="clear-activity-btn" onClick={clearActivity}>Clear</button>
              )}
            </div>
            {showActivity && <ActivityLog activities={pet.activities || []} />}
          </div>
        </div>

      </div>

      {/* ── Stretch Popup ──────────────────────────────────────── */}
      {showStretchPopup && (
        <div className="stretch-overlay" onClick={() => setShowStretchPopup(false)}>
          <div className="stretch-modal" onClick={e => e.stopPropagation()}>
            <div className="stretch-rompy">🐰</div>
            <h3 className="stretch-title">Rompy wants to stretch!</h3>
            <p className="stretch-body">Did you stand up and take a breather?</p>
            <div className="stretch-actions">
              <button className="stretch-btn stretch-yes" onClick={handleStretchYes}>
                Yes! 🙆 <span className="stretch-bonus">+3 energy</span>
              </button>
              <button className="stretch-btn stretch-no" onClick={() => setShowStretchPopup(false)}>
                Not yet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Shop Modal ─────────────────────────────────────────── */}
      {showShop && (
        <ShopModal
          pet={pet}
          coins={pet.coins || 0}
          areaTiers={areaTiers}
          unlockedAreas={pet.unlockedAreas || [0]}
          getNextUpgrade={getNextUpgrade}
          onBuy={handleProgressionPurchase}
          pathUnlocked={pet.pathUnlocked === true}
          onBuyItem={buyItem}
          onClose={() => {
            setShowShop(false)
            // Trigger upgrade flash now that the shop is closed
            if (pendingFlashAreaRef.current !== null) {
              setUpgradedArea(pendingFlashAreaRef.current)
              pendingFlashAreaRef.current = null
              setTimeout(() => setUpgradedArea(null), 3000)
            }
          }}
        />
      )}
    </div>
  )
}

// Circular progress stat
function CircStat({ label, value, color, emoji }) {
  const r    = 22
  const circ = 2 * Math.PI * r
  const pct  = Math.max(0, Math.min(100, value))
  const offset = circ * (1 - pct / 100)

  return (
    <div className="circ-stat">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#E8E8E8" strokeWidth="6" />
        <circle
          cx="32" cy="32" r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '32px 32px', transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x="32" y="37" textAnchor="middle" fontSize="18" dominantBaseline="middle">{emoji}</text>
      </svg>
      <span className="circ-label">{label}</span>
      <span className="circ-value">{Math.round(pct)}%</span>
    </div>
  )
}

const AREA_LABELS = {
  0: 'Bottom Left', 1: 'Bottom Mid', 2: 'Bottom Right',
  3: 'Mid Left',    4: 'Center',     5: 'Mid Right',
  6: 'Top Left',    7: 'Top Mid',    8: 'Top Right',
}

// ── Shop Modal ────────────────────────────────────────────────────────────────
function ShopModal({ pet, coins, areaTiers, unlockedAreas, getNextUpgrade, onBuy, pathUnlocked, onBuyItem, onClose }) {
  const [activeTab, setActiveTab] = useState('items')
  const next = getNextUpgrade()
  const allAreasDone = PROGRESSION_ORDER.every(id => (areaTiers[id] ?? 0) >= 3)

  return (
    <div className="shop-modal-overlay" onClick={onClose}>
      <div className="shop-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="shop-modal-header">
          <span className="shop-modal-title">🛍️ Rompy&apos;s Shop</span>
          <span className="shop-modal-coins">🪙 {coins}</span>
          <button className="shop-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="shop-modal-tabs">
          <button
            className={`shop-tab-btn${activeTab === 'items' ? ' active' : ''}`}
            onClick={() => setActiveTab('items')}
          >🧸 Items</button>
          <button
            className={`shop-tab-btn${activeTab === 'world' ? ' active' : ''}`}
            onClick={() => setActiveTab('world')}
          >🗺️ World</button>
        </div>

        {/* Body */}
        <div className="shop-modal-body">

          {/* ── Items tab ─────────────────────────────────── */}
          {activeTab === 'items' && (
            <div className="shop-items-tab">
              <div className="shop-card-grid">
                {SHOP_ITEMS.map(item => {
                  const owned     = (pet.ownedItems || []).includes(item.id)
                  const canAfford = coins >= item.cost
                  const btnClass  = owned ? 'owned-state' : canAfford ? 'can-buy' : 'cant-afford'
                  return (
                    <div
                      key={item.id}
                      className={`shop-card${owned ? ' owned' : ''}${!canAfford && !owned ? ' poor' : ''}`}
                    >
                      <div className="shop-card-art">
                        {item.imgUrl
                          ? <img src={item.imgUrl} alt={item.name} className="shop-card-img" />
                          : <span className="shop-card-icon">{item.icon}</span>
                        }
                      </div>
                      <span className="shop-card-name">{item.name}</span>
                      <span className="shop-card-desc">{item.desc}</span>
                      <button
                        className={`shop-card-btn ${btnClass}`}
                        onClick={() => !owned && canAfford && onBuyItem(item.id)}
                        disabled={owned || !canAfford}
                      >
                        {owned ? '✓ Owned' : `🪙 ${item.cost}  Buy`}
                      </button>
                    </div>
                  )
                })}
              </div>
              <p className="shop-earn-tip">💡 Complete sessions, feed Rompy, and play to earn 🪙</p>
            </div>
          )}

          {/* ── World tab ─────────────────────────────────── */}
          {activeTab === 'world' && (
            <div className="shop-world-body">

              {/* World Progression section */}
              <div className="shop-world-section-label">🗺️ World Progression</div>
              <div className="shop-progression-list">
                {PROGRESSION_ORDER.map((areaId, i) => {
                  const isUnlocked = areaId === 0 ? true : unlockedAreas.includes(areaId)
                  const tier       = areaTiers[areaId] ?? (areaId === 0 ? 1 : 0)
                  const isCurrent  = next && next.type !== 'path' && next.areaId === areaId
                  const isDone     = isUnlocked && tier >= 3

                  return (
                    <div
                      key={areaId}
                      className={`shop-prog-row${isCurrent ? ' current' : ''}${isDone ? ' done' : ''}${!isUnlocked && !isCurrent ? ' locked' : ''}`}
                    >
                      <span className="shop-prog-num">{i + 1}.</span>
                      <span className="shop-prog-name">{AREA_LABELS[areaId]}</span>
                      <span className="shop-prog-tiers">
                        {[1, 2, 3].map(t => (
                          <span
                            key={t}
                            className={`shop-tier-pip${tier >= 3 ? ' full' : tier >= t ? ' filled' : ''}`}
                          >T{t}</span>
                        ))}
                      </span>
                      {isDone && <span className="shop-prog-check">✓</span>}
                      {isCurrent && (
                        <button
                          className={`shop-prog-buy-btn${coins >= next.cost ? '' : ' disabled'}`}
                          onClick={onBuy}
                          disabled={coins < next.cost}
                        >
                          {next.type === 'unlock' ? '🔓 Unlock' : `⬆️ T${next.toTier}`} · 🪙{next.cost}
                        </button>
                      )}
                      {!isUnlocked && !isCurrent && (
                        <span className="shop-prog-lock">🔒</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Special Unlockables section */}
              <div className="shop-world-section-label shop-world-section-label--special">✨ Special Unlockables</div>
              <div className="shop-special-note">Unlock all 9 world tiers to reveal these.</div>
              <div className="shop-progression-list">

                {/* World Path */}
                <div className={`shop-prog-row${next?.type === 'path' ? ' current' : ''}${pathUnlocked ? ' done' : ''}${!allAreasDone && !pathUnlocked ? ' locked' : ''}`}>
                  <span className="shop-prog-num">1.</span>
                  <span className="shop-prog-name">🛤️ World Path</span>
                  <span className="shop-prog-desc">Connects all regions</span>
                  {pathUnlocked && <span className="shop-prog-check">✓</span>}
                  {!pathUnlocked && next?.type === 'path' && (
                    <button
                      className={`shop-prog-buy-btn${coins >= next.cost ? '' : ' disabled'}`}
                      onClick={onBuy}
                      disabled={coins < next.cost}
                    >🔓 Unlock · 🪙{next.cost}</button>
                  )}
                  {!pathUnlocked && next?.type !== 'path' && (
                    <span className="shop-prog-lock">🔒</span>
                  )}
                </div>

                {/* Future unlockables placeholder */}
                <div className="shop-prog-row locked">
                  <span className="shop-prog-num">2.</span>
                  <span className="shop-prog-name">🏰 More coming soon…</span>
                  <span className="shop-prog-lock">🔒</span>
                </div>

              </div>

              {!next && pathUnlocked && (
                <div className="shop-world-complete">✨ World fully unlocked — you&apos;re amazing!</div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Game
