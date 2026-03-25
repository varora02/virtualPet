/**
 * ShopModal — extracted from Game.jsx.
 *
 * Three tabs: Items · Animations · World
 *
 * Named exports for constants that Game.jsx also uses:
 *   SHOP_ITEMS, ANIMATION_ITEMS, PROGRESSION_ORDER
 */

import { useState } from 'react'
import basketballUrl from '../assets/svgs/basketball.svg'
import soccerballUrl from '../assets/svgs/soccerball.svg'

// ── Shop data ──────────────────────────────────────────────────────────────
export const SHOP_ITEMS = [
  { id: 'basketball', name: 'Basketball', imgUrl: basketballUrl, icon: '🏀', cost: 1, desc: 'An orange ball Rompy loves to dribble' },
  { id: 'soccerball', name: 'Soccer Ball', imgUrl: soccerballUrl, icon: '⚽', cost: 1, desc: 'A classic ball for a kick-around' },
]

export const ANIMATION_ITEMS = [
  { id: 'ball_roll',    name: 'Ball Roll',     icon: '🎱', cost: 1, requiredLevel: 3, desc: 'Bubby rolls a ball during play!' },
  { id: 'workout_lift', name: 'Dumbbell Lift', icon: '🏋️', cost: 1, requiredLevel: 4, desc: 'Bubby pumps iron after a workout!' },
  { id: 'happy_hop',   name: 'Happy Hop',      icon: '🌸', cost: 1, requiredLevel: 7, desc: 'Bubby hops with joy when leveling up!' },
]

// Unlock order: BL(0) → BM(1) → BR(2) → ML(3) → MM(4) → MR(5) → TL(6) → TM(7) → TR(8)
export const PROGRESSION_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8]

const AREA_LABELS = {
  0: 'Bottom Left', 1: 'Bottom Mid', 2: 'Bottom Right',
  3: 'Mid Left',    4: 'Center',     5: 'Mid Right',
  6: 'Top Left',    7: 'Top Mid',    8: 'Top Right',
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ShopModal({
  pet,
  coins,
  areaTiers,
  unlockedAreas,
  getNextUpgrade,
  canUnlockPath,
  onBuy,
  pathUnlocked,
  onBuyItem,
  onBuyAnimation,
  currentLevel,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('items')
  const next = getNextUpgrade()
  // Use the stricter canUnlockPath (requires both local tier state + Firestore confirmation)
  const allAreasDone = canUnlockPath ?? PROGRESSION_ORDER.every(id => (areaTiers[id] ?? 0) >= 2)

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
            className={`shop-tab-btn${activeTab === 'animations' ? ' active' : ''}`}
            onClick={() => setActiveTab('animations')}
          >✨ Animations</button>
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

          {/* ── Animations tab ───────────────────────────── */}
          {activeTab === 'animations' && (
            <div className="shop-items-tab">
              <div className="shop-card-grid">
                {ANIMATION_ITEMS.map(anim => {
                  const owned      = (pet.unlockedAnimations || []).includes(anim.id)
                  const levelOk    = currentLevel >= anim.requiredLevel
                  const canAfford  = coins >= anim.cost
                  const canBuy     = levelOk && canAfford && !owned
                  const btnClass   = owned ? 'owned-state' : !levelOk ? 'cant-afford' : canAfford ? 'can-buy' : 'cant-afford'
                  return (
                    <div
                      key={anim.id}
                      className={`shop-card${owned ? ' owned' : ''}${!levelOk && !owned ? ' locked-level' : ''}${!canAfford && levelOk && !owned ? ' poor' : ''}`}
                    >
                      <div className="shop-card-art">
                        <span className="shop-card-icon">{levelOk ? anim.icon : '🔒'}</span>
                      </div>
                      <span className="shop-card-name">{anim.name}</span>
                      <span className="shop-card-desc">
                        {levelOk ? anim.desc : `Requires level ${anim.requiredLevel}`}
                      </span>
                      <button
                        className={`shop-card-btn ${btnClass}`}
                        onClick={() => canBuy && onBuyAnimation(anim.id)}
                        disabled={!canBuy}
                      >
                        {owned ? '✓ Unlocked' : !levelOk ? `🔒 Lv.${anim.requiredLevel}` : `🪙 ${anim.cost}  Unlock`}
                      </button>
                    </div>
                  )
                })}
              </div>
              <p className="shop-earn-tip">💡 Level up Bubby to unlock new animations!</p>
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
                  const isDone     = isUnlocked && tier >= 2

                  return (
                    <div
                      key={areaId}
                      className={`shop-prog-row${isCurrent ? ' current' : ''}${isDone ? ' done' : ''}${!isUnlocked && !isCurrent ? ' locked' : ''}`}
                    >
                      <span className="shop-prog-num">{i + 1}.</span>
                      <span className="shop-prog-name">{AREA_LABELS[areaId]}</span>
                      <span className="shop-prog-tiers">
                        {[1, 2].map(t => (
                          <span
                            key={t}
                            className={`shop-tier-pip${tier >= 2 ? ' full' : tier >= t ? ' filled' : ''}`}
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
