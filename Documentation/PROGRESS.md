# 📋 V1 Build Progress

**Last Updated**: March 22, 2026 (scheduled task run — levels & abilities update)
**Current Phase**: V1 MVP — Level System & Abilities
**Status**: 🟡 In Progress

---

## ✅ Done

### Project Setup
- [x] Vite + React project scaffolded
- [x] `package.json` created with Firebase + React dependencies
- [x] `vite.config.js` configured (port 3000)
- [x] `.gitignore` created (excludes `.env.local`, `node_modules`)
- [x] `npm install` completed successfully
- [x] `npm audit fix` run (non-breaking fixes applied)

### Firebase
- [x] Firebase project created: `virtualpet-a3121`
- [x] Firebase config copied into `.env.local`
- [x] `src/firebase.js` wired up with environment variables
- [ ] **Authentication enabled in Firebase Console** ← next step
- [ ] **Demo users created in Firebase Console**
  - `varun@virtualpet.com` / `varun123`
  - `gf@virtualpet.com` / `gf123`
- [ ] **Firestore database created** (needed for real-time pet sync)
- [ ] **Firestore security rules set** (allow read/write for authenticated users)

### Source Code — All Files Created
- [x] `src/main.jsx` — React entry point
- [x] `src/index.css` — Global styles
- [x] `src/App.jsx` — Root component with auth routing
- [x] `src/App.css` — App-level styles
- [x] `src/firebase.js` — Firebase init
- [x] `src/pages/Login.jsx` — Login page with demo account buttons
- [x] `src/pages/Game.jsx` — Main game screen
- [x] `src/pages/Game.css` — Game styles
- [x] `src/components/Pet.jsx` — Pixel art elephant + animations
- [x] `src/components/Pet.css` — Pet styles
- [x] `src/components/PomodoroTimer.jsx` — 25-min study timer
- [x] `src/components/PomodoroTimer.css` — Timer styles
- [x] `src/components/ActivityLog.jsx` — Real-time activity feed
- [x] `src/components/ActivityLog.css` — Activity log styles
- [x] `src/components/WorldProps.jsx` — All world props (trees, well, campfire, lamps, rocks, shadows, decor grass/flowers, forest cluster)
- [x] `src/components/PathOverlay.jsx` — Dirt/cobblestone path TL→TM→MM→MR
- [x] `src/components/TileMap.jsx` — Ground tile grid
- [x] `src/components/FenceOverlay.jsx` — Area boundary fences

### Level System & Abilities Update (March 22, 2026 — second pass)
- [x] **Title renamed** — Header now reads "Virtual Pet v1" (was "Rompy")
- [x] **Level system** — Pet gains +10 exp per "Play"; every 100 exp = level up; level stored in Firestore
- [x] **Level badge** — ⭐ Lv.X badge shown in the game header
- [x] **Click-to-inspect** — Clicking the hare opens a small popup showing current level, exp bar, and exp progress; movement pauses while popup is open
- [x] **Level-up animation** — On level-up, pet stops and flashes for 2 seconds (golden flash via CSS animation), then resumes wandering
- [x] **Abilities section** — Appears inside "Interact with Rompy" drawer; abilities show as locked (🔒) until the required level is reached
- [x] **Ghost Bud (Lv.2)** — Summons a white translucent ghost hare for 15 seconds; mirrors the main hare's position at a fixed offset with matching animation
- [x] **Extensible config** — `src/levelConfig.js` exposes `EXP_PER_LEVEL`, `PLAY_EXP_REWARD`, and `ABILITIES` array; add new abilities by appending to that array and adding a case in `useAbility()`

### Visual & Gameplay Changes (March 22, 2026 — first pass)
- [x] **Hunger system fix** — hunger only increases when pet actually eats real grass (`onAte` callback now fires correctly); +50 pts per meal (50% of max, up from +20)
- [x] **Grass in accessible areas only** — feed trigger selects grass from unlocked areas only; no grass = no feeding possible
- [x] **Area-unlock grass** — new grass patches are generated whenever new areas are purchased
- [x] **Campfire visual** — switched to `prop_campfire2.png` (2.png frame set, 192×32 px); CSS updated to `background-size: 384px 64px`
- [x] **Lamp scale** — reduced from 60×105 px to 40×70 px; glow radius increased to 90 px for proportionally brighter look
- [x] **Well size** — increased from 64×64 px to 100×100 px; collision radius 38→52 px
- [x] **Night-only glow** — already implemented; glow brightness increased (core opacity 0.50→0.72; campfire core 0.80)
- [x] **Shadows** — added under tree_0,1,2,4,6, both lamps, and campfire using craftpix shadow assets 2–6; rendered at z=3 (above ground, below props)
- [x] **Decorative grass bundles** — 2–5 grass blade sprites per bundle, spread across all 9 areas; some near/under tree bases
- [x] **Decorative flower bundles** — 2–4 flower sprites per bundle in 7 areas
- [x] **Forest cluster** — 8 additional trees (forest_8a–8h) densely placed in TR area (area 8)
- [x] **Path overlay** — cobblestone path from TL through TM, down to MM, then right to MR; using craftpix ground tiles 28,30,34,36,38,41,54
- [x] **Login streak** — daily login no longer awards coins; instead tracks consecutive login days (`loginStreak` in Firestore); 🔥 streak badge shown in header
- [x] **Documentation** — new `WORLD_VISUALS.md` created; PROGRESS.md updated

---

## 🔲 Still To Do — V1

### Firebase Setup (Do this before running the app)
- [ ] Go to Firebase Console → Authentication → Sign-in method → Enable **Email/Password**
- [ ] Go to Authentication → Users → Add user: `varun@virtualpet.com` / `varun123`
- [ ] Go to Authentication → Users → Add user: `gf@virtualpet.com` / `gf123`
- [ ] Go to Firestore Database → Create database (start in **test mode** for now)
- [ ] Set Firestore rules to allow authenticated reads/writes

### Testing
- [ ] Run `npm run dev` and open `http://localhost:3000`
- [ ] Log in as Varun, log in as GF on another tab/device
- [ ] Test all pet actions: Feed 🍎, Water 💧, Play 🎮, Rest 😴
- [ ] Verify both users see pet stat changes in real-time
- [ ] Test Pomodoro timer completes and feeds the pet
- [ ] Verify activity log updates for both users

### Polish
- [ ] Test on mobile (responsive layout check)
- [ ] Review and tweak animations
- [ ] Fix any bugs found during testing

### Deployment
- [ ] Create GitHub repository: `VirtualPet`
- [ ] Push code to GitHub (`.env.local` will be excluded by `.gitignore`)
- [ ] Connect repo to Vercel
- [ ] Add environment variables to Vercel dashboard (same values as `.env.local`)
- [ ] Deploy and get live URL
- [ ] Share URL with GF 💚

---

## 🐛 Known Issues

### npm Vulnerabilities (March 21, 2026)
Running `npm audit` shows 12 vulnerabilities:

**esbuild ≤0.24.2** (Moderate) — dev server only
- Only affects the local dev server, NOT your production build
- Fix requires `npm audit fix --force` which upgrades to Vite 8 (breaking change — hold off for now)
- **Action**: Ignore for now. Do NOT run `npm audit fix --force`.

**undici** (High) — transitive Firebase dependency
- Firebase Auth/Firestore/Storage depend on this
- `npm audit fix` was run but Firebase hasn't patched this yet upstream
- **Action**: Monitor for a Firebase SDK update. Not a user-facing risk for a private app between two people.

---

## 📁 Documentation Folder Guide

| File | Purpose |
|------|---------|
| `PROGRESS.md` | ← You are here. V1 build tracker |
| `DOCUMENTATION_INDEX.md` | Map of all docs and who should read them |
| `IMPLEMENTATION_ROADMAP.md` | Detailed V2.0–V2.2 timeline & resource planning |
| `POST_V1_ROADMAP.md` | High-level V2–V3 vision |
| `FEATURE_COINS_ECONOMY.md` | Coins & shop system spec |
| `FEATURE_PET_EVOLUTION.md` | Pet levels, evolution stages, tricks |
| `FEATURE_HOUSE_CUSTOMIZATION.md` | Rooms, furniture, decoration system |
| `FEATURE_HEALTH_INTEGRATION.md` | Apple Health + Google Fit integration |
| `FEATURE_COUPLE_COLLABORATION.md` | Couple challenges & sync features |

---

## 🚀 Immediate Next Steps (in order)

1. **Enable Firebase Auth** — Email/Password sign-in in Firebase Console
2. **Create the two demo users** in Firebase Console → Authentication
3. **Create Firestore database** in Firebase Console (test mode)
4. **Run `npm run dev`** and test the app
5. Once working locally → **deploy to Vercel**
