# TODO

---

## Done (V1 Shipped)

- Vite + React + Vercel deploy pipeline
- Firebase Auth (Varun + Leena + tester user)
- Firestore real-time sync with `onSnapshot`
- Harold (hare) — full animation set, study at tree, wander
- Bubby (tuxedo cat) — full animation set, random idle scheduler
- Pet switcher (Harold ↔ Bubby)
- 9-area 3×3 world grid (1344×768 px)
- Area unlock via coin shop
- Tier upgrades (max tier 2 per area) — props appear per tier
- Fences close locked areas, fade on unlock
- L-shaped cobblestone path: TL → TM → MM → MR
- Props: trees, well, campfire, lamps, rocks, decorative grass/flowers, TR forest cluster
- Night/day cycle (PST) — scene darkens, prop glows activate
- Feed, Water, Play, Rest interactions — coins + animations
- Pomodoro study timer (25min work / 5min break) + stretch popup
- Workout check-in — logs workout, triggers Dumbbell Lift if unlocked
- XP + leveling (100 XP/level), level-up flash animation, click-to-inspect popup
- Shop: area unlocks, tier upgrades, prop unlocks, animation unlocks (Dumbbell Lift Lv4, Happy Hop Lv7), Ghost Bud ability (Lv2)
- Coins earned on every interaction
- SFX for all actions, background music toggle
- Blue robin ambient bird — fly in/perch/spook/fly off phase machine
- Mood system (10 moods, badge display, thought bubbles)
- Login streak badge, shared activity log
- Bubby login screen (replaced old elephant SVG placeholder)

---

## In Progress

- [ ] **World tier visuals** — tier 1→2 upgrades should visibly change the area (new props appearing per TIER_DECORATION_SPEC plan in `IMPLEMENTATION.md`)
- [ ] **Robin additional behaviors** — look-around and preen animations while perching
- [ ] **Night ambient music** — add `ambient_night.mp3` to `src/assets/sounds/music/` and uncomment one import line in `useSoundManager.js`

---

## Pending — Near Term

- [ ] **Welcome screen** — first-time login popup with Bubby, Harold, Robin, Rompy. See `Tasks/WELCOME_SCREEN.md`. *Blocked on Rompy sprite.*
- [ ] **NPC Friends Pack** — Harold as wandering NPC in MM(4), Robin upgraded behaviors, Rompy wiring. See `Tasks/NPC_FRIENDS_PACK.md`. *Blocked on Rompy sprite.*
- [ ] **House customization** — multi-room house, furniture system, room themes. See `Tasks/HOUSE_CUSTOMIZATION.md`.
- [ ] **Pet evolution stages** — visual growth arc (5 stages), evolution animations, cosmetic unlocks. See `Tasks/PET_EVOLUTION.md`.
- [ ] **Couple challenges** — weekly challenges, same-day bonuses, private leaderboard.
- [ ] **Rompy elephant sprite** — Varun to provide. Drop in `src/assets/` and tell Claude the filename.

---

## Pending — Future

- [ ] Apple HealthKit integration (requires native wrapper — Capacitor or React Native)
- [ ] Google Fit integration
- [ ] Sound design: `summon_friends.mp3`, `ambient_night.mp3`
- [ ] Seasonal events (winter/autumn/rain themes, time-limited cosmetics)
- [ ] Accessibility (dark mode, high contrast, keyboard navigation, screen reader)
- [ ] Performance pass (lazy-load images, debounce rapid clicks)
- [ ] Mobile app wrapping (Capacitor)
- [ ] V3 social features (pet profiles, friend pets, community leaderboards)

---

## Known Issues / Tech Debt

- **`activities` array unbounded** — shared-workouts doc grows forever. Before any wider launch: move to a subcollection or add a Cloud Function to prune old entries.
- **Firebase security rules open** — currently development-mode rules. Must be locked to approved emails before any public deployment.
- **npm vulnerabilities** — `esbuild ≤0.24.2` (dev-only, not a production risk); `undici` via Firebase (upstream, not actionable). Do NOT run `npm audit fix --force`.
- **Harold dead code in Pet.jsx** — Harold's sprite/state logic still lives in Pet.jsx but is dormant. When NPC Friends Pack ships, move Harold to his own NPC component and clean up Pet.jsx.
- **`background1.svg` unused** — 6.6MB file in `svgs/`. Needs optimization (simplify paths) before it can be used.
- **Mood system triggers** — mood transitions are implemented but some edge cases (long absence → "neglected" mood) may need tuning.
