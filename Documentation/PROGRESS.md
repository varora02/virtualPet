# 📋 Build Progress

**Last Updated**: March 24, 2026
**Status**: 🟢 V1 Live — active feature development

---

## ✅ Shipped & Working

### Infrastructure
- [x] Vite + React, deployed on Vercel
- [x] Firebase Auth (email/password) — Varun + Leena accounts
- [x] Firestore real-time sync — both users see changes instantly
- [x] GitHub repo + Vercel CI/CD pipeline

### Pets
- [x] **Rompy** (pixel-art hare) — walk, run, eat, drink, study at tree, idle wander, victory lap
- [x] **Bubby** (tuxedo cat) — walk, run, eat, drink, sit, lick (idle), yawn (idle), ear-scratch (idle), workout_lift (shop unlock Lv4), happy_hop (shop unlock Lv7)
- [x] Pet switcher — toggle between Rompy and Bubby in-session
- [x] Click-to-inspect — level popup, XP bar

### World
- [x] 9-area 3×3 grid (1344×768 world px)
- [x] Area unlock progression — coins spent in shop to unlock areas
- [x] Tier upgrades (max tier 2 per area) — unlocks new props in that area
- [x] Fences close locked areas; fade out when area unlocks
- [x] L-shaped cobblestone path: TL → TM → MM → MR
- [x] Props: trees, well, campfire, lamps, rocks, decorative grass/flowers, forest cluster (TR)
- [x] Night/day cycle (PST hours) — scene darkens, prop glows activate

### Interactions
- [x] Feed — pet walks to nearest grass patch and eats (+hunger, +coins)
- [x] Water — pet walks to well and drinks (+thirst, +coins)
- [x] Play — pet does victory animation (+happiness, +XP, +coins; may level up)
- [x] Rest — pet stands still 5s (+energy, +coins)
- [x] Pomodoro timer — 25-min work / 5-min break; pet studies at tree while active
- [x] Stretch popup after each Pomodoro session (+energy, +happiness, +coins)

### Economy & Progression
- [x] Coins — earned on every interaction, spent in shop
- [x] Experience + leveling (100 XP/level) — displayed in click popup
- [x] Level-up flash animation
- [x] Shop — area upgrades, prop unlocks, animation unlocks (Dumbbell Lift Lv4, Happy Hop Lv7)
- [x] Ghost Bud ability (Lv2) — translucent companion mirrors pet position

### Audio
- [x] SFX for all actions (eat, drink, play, rest, coin, celebrate, levelup, open/close/toggle)
- [x] Meow on Bubby click
- [x] Campfire proximity audio (plays when Bubby wanders near campfire)
- [x] Background music (ambient_day.mp3) — 🔇 button in header to toggle on/off
- [x] unlock_area sound on area purchase
- [x] cat_purr after playing with Bubby
- [x] timer_finish on Pomodoro completion

### Ambient Life
- [x] Blue robin bird — flies in from edge, perches with subtle chest-breathing, flies off
- [x] Bubby idle animations (lick / yawn / ear-scratch) — random scheduler
- [x] Rompy wander with collision redirect (won't grind against props)

### Misc
- [x] Login streak badge
- [x] Activity log (shared between both users)
- [x] Thought bubble on pet click (Rompy)
- [x] Workout check-in (prompts for workout done today)

---

## 🔲 In Progress / Up Next

- [ ] **World tier visuals** — tier 1→2 upgrades should visibly change the area (new prop appearing, different decoration)
- [ ] **More perch/NPC behaviors** — look-around, preen animations for the robin
- [ ] **Night ambient music** — add `ambient_night.mp3` to `src/assets/sounds/music/` and uncomment one import line in `useSoundManager.js`

---

## 🗂 V2.0 Features (Planned — see feature spec docs)

- Pet evolution (visual stages tied to level)
- House customization (rooms, furniture)
- Health integration (Apple Health / Google Fit step sync)
- Couple challenges and leaderboards
- Expanded coin economy and shop depth

---

## 🐛 Known Issues

**npm vulnerabilities** — `esbuild ≤0.24.2` (dev only, not production risk); `undici` via Firebase (upstream, not actionable). Do NOT run `npm audit fix --force`.

---

## 📁 Documentation Files

| File | Purpose |
|------|---------|
| `PROGRESS.md` | ← You are here |
| `DOCUMENTATION_INDEX.md` | Map of all docs |
| `ARCHITECTURE.md` | Component hierarchy, data flow, state patterns |
| `WORLD_SYSTEM.md` | World coords, prop system, z-index, fences |
| `WORLD_VISUALS.md` | Tile layout, prop placement, night glow spec |
| `ANIMATION_GUIDE.md` | Sprite sheet format, CSS animation patterns |
| `EXTENSIBILITY_GUIDE.md` | Recipes for adding props, interactions, abilities |
| `TIER_DECORATION_SPEC.md` | Area tier upgrade decoration plan |
| `FEATURE_*.md` | V2.0+ feature specs (coins, evolution, house, health, couple) |
| `IMPLEMENTATION_ROADMAP.md` | V2 timeline & phases |
| `POST_V1_ROADMAP.md` | Long-term product vision |
