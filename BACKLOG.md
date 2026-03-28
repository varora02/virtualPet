# Virtual Pet — Backlog

Roughly ordered by value. Quick wins at the top.

---

## 🔴 Must Do (before sharing URL more widely)

### S1 — Lock Firestore security rules
Currently open (dev mode) — any authenticated user can read/write all pet data and coins.
Lock rules to approved emails only. Template in `Documentation/DEPLOYMENT.md`.
**Action:** Firebase Console → Firestore → Rules tab (not a code change)

---

## 🎨 Assets to Generate

### Rompy sprites (Pixel Lab)
Character description and all prompts are in `Documentation/ASSETS.md`.

| Sprite | File | Frames | Priority |
|--------|------|--------|----------|
| Study (reading) | `rompy_study.png` | 6fr, 2 rows | 🔴 High — needed for shared session |
| Celebrate (jump) | `rompy_celebrate.png` | 6fr | 🔴 High — needed for session complete |
| Idle (breathing) | `rompy_idle.png` | 4fr | 🔴 High — needed for passive presence |
| Walk south | `rompy_walk_south.png` | 4fr | 🟡 Medium — needed for wandering NPC |
| Walk north | `rompy_walk_north.png` | 4fr | 🟡 Medium |
| Walk east | `rompy_walk_east.png` | 4fr | 🟡 Medium |
| Run east | `rompy_run_east.png` | 6fr | 🟡 Medium |

### Bubby sprites
| Sprite | File | Frames | Notes |
|--------|------|--------|-------|
| Study (sitting with book) | `cat_study.png` | 6fr | Currently falls through to sit anim |

---

## 🎨 UI Asset Pack — Finalise

Two mockup options exist at the project root (`ui-options.html`):
- **Option A — Game stamps**: saturated gradients, deep coloured drop shadows, punchy game-like feel
- **Option B — Pastel tiles**: light colour fills, softer/calmer feel

**Task:** Decide on A, B, or a mix, then source a matching icon/UI pack.
Good places to look: itch.io ("pixel UI", "cozy game HUD"), Kenney.nl ("ui pack", "game interface").

---

## 🔧 Refactors

### R1 — Extract `useBubbySprite` hook from Pet.jsx
Pet.jsx is 670+ lines and half is Bubby sprite computation.
Extract into `src/hooks/useBubbySprite.js` → Pet.jsx drops to ~450 lines.

### R2 — BirdSpawner: derive PERCH_POINTS from worldData
Currently five `{x,y}` coords are hardcoded. Tag props with `perchable: true` in worldData.js
and let BirdSpawner pick from those at runtime — stays correct when the tilemap changes.

### R3 — Game.jsx domain hook split (big, optional)
Game.jsx has 30+ useState calls. When it becomes painful, split into:
- `usePomodoroState` — study triggers, timer logic
- `usePetProgression` — areaTiers, upgrades, shop
- `useMusicControl` — tiny, low priority

---

## ✨ Features / QoL

### F1 — Wire up Rompy as wandering NPC
`WanderingNPC.jsx` base exists. Once Rompy walk sprites arrive:
add walk-cycle CSS, register in Pet.jsx, replace 🐘 placeholder in shared session.

### F2 — `cat_study.png` wiring
Once generated: branch `eatState === 'study'` separately in Pet.jsx (currently uses sit),
add `cat-study` CSS class + import.

### F3 — Loading skeleton
During Firestore load, game shows nothing. Add pet silhouette + pulsing stat bars.

### F4 — World screen-size handling
Verify the 1344px world scales on 13" MacBooks. Set `min-width` or CSS `scale()`.

### F5 — Night ambient music
`ambient_night.mp3` is referenced but commented out in `useSoundManager.js`.
Source the file and uncomment the one line.

### F6 — New world props / tier 3
Props only at high tiers — fountain, statue, seasonal tree, etc.

### F7 — Robin additional perch behaviours
Preen + look-around animations. Prompts in `Documentation/ASSETS.md`.

---

## 🐛 Known issues

- None currently tracked.

---

*Last updated: 2026-03-27*

---

### Session log
| Date | Done |
|---|---|
| 2026-03-27 | Shared Pomodoro session (Firestore-driven), Rompy placeholder, vercel.json cache fix, yawn 65→50%, timer volume reduced, staging folders deleted, useHareMovement.js deleted, BACKLOG restructured |
| 2026-03-25 | Bird bug fix, spawn timing, spriteUtils.js, useHareMovement parameterised, ShopModal extracted, WanderingNPC base created, dead code deleted |
