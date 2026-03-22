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
import './Game.css'

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
  activities: []
}

const SHOP_ITEMS = [
  { id: 'basketball', name: 'Basketball', imgUrl: null, icon: '🏀', cost: 50, desc: 'An orange ball Rompy loves to dribble' },
  { id: 'soccerball', name: 'Soccer Ball', imgUrl: null, icon: '⚽', cost: 50, desc: 'A classic ball for a kick-around' },
  // ── World area unlocks (sequential: 0 is always unlocked) ──
  { id: 'area_1', name: 'Bottom Middle', icon: '🗺️', cost: 5, desc: 'Unlock the bottom-middle area for Rompy to explore' },
  { id: 'area_2', name: 'Bottom Right',  icon: '🗺️', cost: 5, desc: 'Unlock the bottom-right area' },
  { id: 'area_3', name: 'Middle Left',   icon: '🗺️', cost: 5, desc: 'Unlock the middle-left area' },
  { id: 'area_4', name: 'Middle Center', icon: '🗺️', cost: 5, desc: 'Unlock the middle-center area' },
  { id: 'area_5', name: 'Middle Right',  icon: '🗺️', cost: 5, desc: 'Unlock the middle-right area' },
  { id: 'area_6', name: 'Top Left',      icon: '🗺️', cost: 5, desc: 'Unlock the top-left area' },
  { id: 'area_7', name: 'Top Middle',    icon: '🗺️', cost: 5, desc: 'Unlock the top-middle area' },
  { id: 'area_8', name: 'Top Right',     icon: '🗺️', cost: 5, desc: 'Unlock the top-right area — the whole world!' },
]

// Visual grouping for the shop UI
const SHOP_SECTIONS = [
  { id: 'toys',  label: '🧸 Toys',        itemIds: ['basketball', 'soccerball'] },
  { id: 'areas', label: '🗺️ World Areas', itemIds: ['area_1','area_2','area_3','area_4','area_5','area_6','area_7','area_8'] },
]

// Inject real SVG URLs after import (can't do this at module level before imports)
SHOP_ITEMS[0].imgUrl = basketballUrl
SHOP_ITEMS[1].imgUrl = soccerballUrl

function Game({ user }) {
  const [pet, setPet]                   = useState(DEFAULT_PET)
  const [petKey, setPetKey]             = useState(0)   // increment → forces Pet remount → respawn at SPAWN_X/Y
  const [loading, setLoading]           = useState(true)
  const [showActions, setShowActions]   = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [feedTrigger, setFeedTrigger]     = useState(0)
  const [restTrigger, setRestTrigger]     = useState(0)
  const [waterTrigger, setWaterTrigger]   = useState(0)
  const [showShop, setShowShop]         = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // ── Level-up & popup state ────────────────────────────────────
  const [isLevelingUp, setIsLevelingUp]   = useState(false)
  const [showLevelPopup, setShowLevelPopup] = useState(false)

  // ── Ability state ─────────────────────────────────────────────
  const [ghostBudActive, setGhostBudActive] = useState(false)
  const ghostBudTimerRef = useRef(null)

  const hasCheckedDaily                 = useRef(false)
  const petRef                          = useRef(pet)
  useEffect(() => { petRef.current = pet }, [pet])

  const userName = user.email.includes('varun') ? 'Varun' : 'GF'

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
    updatePet(
      { hunger: Math.min(100, pet.hunger + 15), happiness: Math.min(100, pet.happiness + 20), energy: Math.min(100, pet.energy + 10) },
      `${userName} finished a study session — ${pet.name} is proud +10 🪙`,
      10
    )
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

  const clearActivity = async () => {
    const petRef = doc(db, 'pets', 'shared-pet')
    try { await updateDoc(petRef, { activities: [] }) }
    catch (err) { console.error('Error clearing activity:', err) }
  }

  const resetGame = async () => {
    const petRef = doc(db, 'pets', 'shared-pet')
    try {
      await setDoc(petRef, { ...DEFAULT_PET, createdAt: serverTimestamp() })
      setShowResetConfirm(false)
      setGhostBudActive(false)
      setIsLevelingUp(false)
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
          unlockedAreas={pet.unlockedAreas || [0]}
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

          {/* Inline shop toggle */}
          <div className="shop-section">
            <button className="shop-toggle-btn" onClick={() => setShowShop(s => !s)}>
              {showShop ? '▲ Close Shop' : `🛍 Shop  ·  🪙 ${pet.coins || 0}`}
            </button>
            {showShop && (
              <div className="shop-inline">
                {SHOP_SECTIONS.map(section => {
                  const sectionItems = section.itemIds.map(id => SHOP_ITEMS.find(i => i.id === id)).filter(Boolean)
                  return (
                    <div key={section.id} className="shop-group">
                      <div className="shop-group-label">{section.label}</div>
                      <div className="shop-items">
                        {sectionItems.map(item => {
                          const isAreaItem = item.id.startsWith('area_')
                          const areaId     = isAreaItem ? parseInt(item.id.split('_')[1]) : null
                          const unlocked   = pet.unlockedAreas || [0]

                          const owned = isAreaItem
                            ? unlocked.includes(areaId)
                            : (pet.ownedItems || []).includes(item.id)

                          const prerequisiteMissing = isAreaItem && areaId > 0 && !unlocked.includes(areaId - 1)
                          const canBuy = (pet.coins || 0) >= item.cost && !owned && !prerequisiteMissing

                          return (
                            <div key={item.id} className={`shop-item${owned ? ' owned' : ''}${prerequisiteMissing ? ' locked' : ''}`}>
                              {item.imgUrl
                                ? <img src={item.imgUrl} alt={item.name} className="shop-item-img" />
                                : <span className="shop-item-icon">{prerequisiteMissing ? '🔒' : item.icon}</span>
                              }
                              <div className="shop-item-info">
                                <span className="shop-item-name">{item.name}</span>
                                <span className="shop-item-desc">{prerequisiteMissing ? 'Unlock previous area first' : item.desc}</span>
                              </div>
                              <button
                                className={`shop-buy-btn${canBuy ? '' : ' disabled'}`}
                                onClick={() => canBuy && buyItem(item.id)}
                                disabled={!canBuy}
                              >
                                {owned ? '✓ Owned' : prerequisiteMissing ? '🔒' : `🪙 ${item.cost}`}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                <p className="shop-earn-tip">Earn: feed/water/play/rest +1 · study session +10 · login streak 🔥 tracked daily</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Pomodoro + Activity toggle */}
        <div className="right-panel">
          <PomodoroTimer onComplete={onPomodoroComplete} userName={userName} />

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

      {/* Shop modal removed — shop is now inline under stats panel */}
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

export default Game
