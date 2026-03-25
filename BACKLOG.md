# Virtual Pet — Backlog

Roughly ordered by value. Quick wins at the top.

---

## 🧹 Dead code (delete these files)

| File | Why it's dead |
|---|---|
| `src/hooks/useBackgroundMusic.js` | Replaced by `play('ambient_day')` directly in Game.jsx |
| `src/components/RompySVG.jsx` | Never imported anywhere — leftover from the old SVG Rompy era |
| `src/components/CatNPC.jsx` + `CatNPC.css` | Never imported anywhere — Bubby's wandering now lives in Pet.jsx |

---

## 🔧 Refactors

### R1 — Extract `useBubbySprite` hook from Pet.jsx
Pet.jsx is 662 lines and half of it is Bubby sprite computation (direction rows,
`BUBBY_SZ` table, per-state backgroundImage/backgroundSize/backgroundPositionY logic).
Extract that block into `src/hooks/useBubbySprite.js` → Pet.jsx drops to ~450 lines.

### R2 — BirdSpawner: derive PERCH_POINTS from world props
Currently five {x,y} coords are hardcoded in BirdSpawner. When the tilemap changes,
these can go stale silently. Better approach: tag trees/props in worldData.js with
`perchable: true` and let BirdSpawner pick from those at runtime.

### R3 — Game.jsx domain hook split (big, optional)
Game.jsx has 31 useState calls in one component. If it ever becomes a pain to navigate,
split into domain hooks:
- `usePomodoroState` — studyTrigger, studyPause/Resume/Stop, timer logic
- `usePetProgression` — areaTiers, getNextUpgrade, handleProgressionPurchase
- `useMusicControl` — musicMuted, toggleMusic (already tiny, low priority)

---

## ✨ Features / QoL

### F1 — Add next NPC using WanderingNPC base
A squirrel, hedgehog, or fox that wanders visible areas. WanderingNPC base is ready —
just need a sprite sheet + CSS walk-cycle animation. Should only appear in unlocked areas.

### F2 — Loading skeleton
During Firestore data load (`loading === true`), the game shows nothing. A simple
placeholder (pet silhouette + pulsing bars for the stats) would be much friendlier.

### F3 — BirdSpawner: per-perch-point facing direction
Currently the bird faces left if entering from the right, and vice versa. Once perched,
it could turn to face a preferred direction (e.g. always face inward toward the world
center) rather than keeping its approach direction.

### F4 — World screen-size handling
Verify that world-scene gracefully handles viewports narrower than 1344px
(horizontal scroll vs scale-down). Set an explicit `min-width` or CSS `scale()` so
the game remains playable on 13" MacBooks.

### F5 — New world props / tier 3
Add props that only appear at high tiers (tier 3+). Fountain, statue, seasonal tree, etc.

---

## 🐛 Known issues

- None currently tracked.

---

*Last updated: 2026-03-25*
