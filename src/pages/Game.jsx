import { useState, useEffect, useRef } from 'react'
import { signOut } from 'firebase/auth'
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import Pet from '../components/Pet'
import PomodoroTimer from '../components/PomodoroTimer'
import ActivityLog from '../components/ActivityLog'
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
  lastLoginDate: null,
  ownedItems: [],
  lastFed: null,
  lastWatered: null,
  activities: []
}

const SHOP_ITEMS = [
  { id: 'basketball',  name: 'Basketball',   imgUrl: null, icon: '🏀', cost: 50, desc: 'An orange ball Rompy loves to dribble' },
  { id: 'soccerball',  name: 'Soccer Ball',  imgUrl: null, icon: '⚽', cost: 50, desc: 'A classic ball for a kick-around' },
  { id: 'flower',      name: 'Flower Patch', imgUrl: null, icon: '🌸', cost: 50, desc: 'A pretty patch for the garden' },
]

// Inject real SVG URLs after import (can't do this at module level before imports)
SHOP_ITEMS[0].imgUrl = basketballUrl
SHOP_ITEMS[1].imgUrl = soccerballUrl

function Game({ user }) {
  const [pet, setPet]                   = useState(DEFAULT_PET)
  const [loading, setLoading]           = useState(true)
  const [showActions, setShowActions]   = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [feedTrigger, setFeedTrigger]   = useState(0)
  const [restTrigger, setRestTrigger]   = useState(0)
  const [showShop, setShowShop]         = useState(false)
  const hasCheckedDaily                 = useRef(false)

  const userName = user.email.includes('varun') ? 'Varun' : 'GF'

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

        // Daily login bonus — fires once per calendar day, first time pet loads
        if (!hasCheckedDaily.current) {
          hasCheckedDaily.current = true
          const today = new Date().toDateString()
          if (data.lastLoginDate !== today) {
            const bonus = 5
            updateDoc(petRef, {
              coins: (data.coins || 0) + bonus,
              lastLoginDate: today,
              activities: arrayUnion({
                text: `${userName} logged in — daily bonus +${bonus} 🪙`,
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
    if (pet.hunger >= 100) return
    setFeedTrigger(n => n + 1)
    updatePet(
      { hunger: Math.min(100, pet.hunger + 20), happiness: Math.min(100, pet.happiness + 5) },
      `${userName} fed ${pet.name} +1 🪙`,
      1
    )
  }

  const waterPet = () => {
    if (pet.thirst >= 100) return
    updatePet(
      { thirst: Math.min(100, pet.thirst + 25), happiness: Math.min(100, pet.happiness + 3) },
      `${userName} gave ${pet.name} water +1 🪙`,
      1
    )
  }

  const playWithPet = () => {
    if (pet.energy < 10) return
    updatePet(
      { happiness: Math.min(100, pet.happiness + 15), energy: Math.max(0, pet.energy - 10), hunger: Math.max(0, pet.hunger - 5) },
      `${userName} played with ${pet.name} +1 🪙`,
      1
    )
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

  const buyItem = async (itemId) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId)
    if (!item) return
    if ((pet.coins || 0) < item.cost) return
    if ((pet.ownedItems || []).includes(itemId)) return
    const petRef = doc(db, 'pets', 'shared-pet')
    try {
      await updateDoc(petRef, {
        coins: (pet.coins || 0) - item.cost,
        ownedItems: arrayUnion(itemId),
        activities: arrayUnion({
          text: `${userName} bought ${item.name} for Rompy! 🛍`,
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

  return (
    <div className="game">

      {/* Header */}
      <header className="game-header">
        <h1 className="game-title">Rompy</h1>
        <div className="header-right">
          <span className="coin-badge">🪙 {pet.coins || 0}</span>
          <span className="user-badge">
            {userName === 'Varun' ? '💙' : '💖'} {userName}
          </span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* World — constrained + centered */}
      <div className="world-full">
        <Pet pet={pet} hasInteracted={hasInteracted} feedTrigger={feedTrigger} restTrigger={restTrigger} />
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
              <div className="actions">
                <button className="action-btn feed"  onClick={feedPet}>🍎 Feed</button>
                <button className="action-btn water" onClick={waterPet}>💧 Water</button>
                <button className="action-btn play"  onClick={playWithPet}>🎾 Play</button>
                <button className="action-btn rest"  onClick={restPet}>😴 Rest</button>
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
                <div className="shop-items">
                  {SHOP_ITEMS.map(item => {
                    const owned  = (pet.ownedItems || []).includes(item.id)
                    const canBuy = (pet.coins || 0) >= item.cost && !owned
                    return (
                      <div key={item.id} className={`shop-item${owned ? ' owned' : ''}`}>
                        {item.imgUrl
                          ? <img src={item.imgUrl} alt={item.name} className="shop-item-img" />
                          : <span className="shop-item-icon">{item.icon}</span>
                        }
                        <div className="shop-item-info">
                          <span className="shop-item-name">{item.name}</span>
                          <span className="shop-item-desc">{item.desc}</span>
                        </div>
                        <button
                          className={`shop-buy-btn${canBuy ? '' : ' disabled'}`}
                          onClick={() => canBuy && buyItem(item.id)}
                          disabled={!canBuy}
                        >
                          {owned ? '✓ Owned' : `🪙 ${item.cost}`}
                        </button>
                      </div>
                    )
                  })}
                </div>
                <p className="shop-earn-tip">Earn: feed/water/play/rest +1 · study session +10 · daily login +5</p>
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
