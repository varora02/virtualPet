# Virtual Pet — Backlog

Roughly ordered by value. Quick wins at the top.

---

## 🧹 Dead code (delete these files)

~~All done — useBackgroundMusic.js, RompySVG.jsx, CatNPC.jsx/.css deleted 2026-03-25~~

---

## 🎨 UI — bottom panel redesign

Mockup saved at `VirtualPet/../ui-options.html`. Two options were designed:

- **Option A — Game stamps**: saturated gradients, deep coloured drop shadows, inset top-highlight. Punchy and game-like.
- **Option B — Pastel tiles**: light coloured fills with matching borders. Softer, calmer feel.

Both share:
- Icon-forward buttons (large emoji centred, tiny UPPERCASE label below)
- "Close" shrinks from a full-width bar to a small pill in the top-right
- Card gets a subtle purple-tinted shadow and a thin white border glow

**Pending decision**: pick Option A, B, or a mix (e.g. A's card style + B's button colours) to implement.

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

---

### Session log
| Date | Done |
|---|---|
| 2026-03-25 | Bird bug fix, spawn timing to production, spriteUtils.js, useHareMovement parameterized, ShopModal extracted, WanderingNPC base created, dead code deleted |
