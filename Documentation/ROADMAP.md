# Roadmap

> Condensed view of what's shipped and what's coming. For full task specs, see `Tasks/`.

---

## V1 — Shipped

### Infrastructure
- Vite + React, deployed on Vercel
- Firebase Auth (email/password) — Varun + Leena accounts + tester user support
- Firestore real-time sync — both users see changes instantly
- GitHub repo + Vercel CI/CD pipeline

### Pets
- **Harold** (pixel-art hare) — walk, run, eat, drink, study at tree, idle wander, victory lap
- **Bubby** (tuxedo cat) — walk, run, eat, drink, sit, lick/yawn/ear-scratch (random idle), workout_lift (Lv4), happy_hop (Lv7)
- Pet switcher (Harold ↔ Bubby), click-to-inspect level popup + XP bar

### World
- 9-area 3×3 grid (1344×768 px)
- Area unlock via coin shop, tier upgrades (max tier 2 per area)
- Fences close locked areas, fade on unlock
- L-shaped cobblestone path: TL → TM → MM → MR
- Props: trees, well, campfire, lamps, rocks, decorative grass/flowers, forest cluster (TR)
- Night/day cycle (PST hours) — scene darkens, prop glows activate

### Interactions
- Feed, Water, Play, Rest — each earns coins and triggers pet animations
- Pomodoro study timer (25 min work / 5 min break) — pet studies at tree
- Stretch popup after Pomodoro (+energy, +happiness, +coins)
- Workout check-in — logs workout, triggers Dumbbell Lift animation (if unlocked)

### Economy & Progression
- Coins (earned on every interaction, spent in shop)
- XP + leveling (100 XP/level), level-up flash animation
- Shop: area unlocks, tier upgrades, prop unlocks, animation unlocks, Ghost Bud ability

### Audio
- SFX for all actions; background music toggle; campfire proximity crackle; meow on Bubby click; timer completion chime

### Ambient Life
- Blue robin — flies in, perches with chest-breathe, spooks if Bubby approaches, flies off
- Bubby random idle animations (lick/yawn/ear-scratch scheduler)
- Mood system (10 moods, badge display, thought bubbles)
- Login streak badge, shared activity log

---

## V2.0 — Near Term

### NPC Friends Pack
Unlock after all 9 areas purchased. Buy individual NPC companions from shop.
- Harold wanders MM(4), grazes, reacts to Bubby's proximity
- Robin gets upgraded preen/look-around behaviors and chirp sound
- Rompy elephant (requires pond world asset — depends on Varun providing sprite)
- Summon ability when all friends purchased — group moment
- Effort: ~2–3 weeks. See `Tasks/NPC_FRIENDS_PACK.md`.

### Welcome Screen
First-time login popup with Bubby, Harold, Robin, and Rompy introducing themselves.
- Approach A (preferred): CSS sprite scene using existing sheets — zero new assets
- Approach B: AI-generated illustration (`welcome_screen.png`)
- Depends on Rompy sprite being available
- Effort: ~1 week. See `Tasks/WELCOME_SCREEN.md`.

### House / Room Customization
Multi-room house that both users customize together.
- Rooms unlock at level milestones (e.g. Lv5 → Kitchen, Lv10 → Garden)
- Furniture catalog (20–50 items) — buy with coins, place in rooms
- Room themes/wallpapers
- Drag-and-drop or click-to-place interface
- Firestore: `rooms/` collection with per-room state
- Effort: ~2–3 weeks. See `Tasks/HOUSE_CUSTOMIZATION.md`.

### Pet Evolution Stages
Visual growth arc as Bubby/Harold levels up.
- 5 visual stages: baby → child → teen → adult → elder (→ mythic at Lv20)
- Each stage is a separate sprite set
- Evolution animation on stage transition
- Outfits and cosmetics unlockable at milestones
- Current sprite slots (Harold has `harold_baby.svg` etc. planned; Bubby needs new frames)
- Effort: ~2 weeks. See `Tasks/PET_EVOLUTION.md`.

### Couple Challenges
- Weekly challenges (e.g. "Both complete 3 workouts", "Study Marathon — 10 Pomodoros together")
- Same-day bonuses: both workout → +20 happiness + bonus coins each
- Study-together bonus: both in Pomodoro within same hour → +XP
- Private leaderboard (Varun vs. Leena care contribution %)
- Effort: ~1–2 weeks.

---

## V2.1 — Mid Term

### Apple HealthKit / Google Fit Integration
- Query workouts, sleep duration, daily steps from health APIs
- Auto-log workouts into VirtualPet activity feed
- Pet stat impacts: 8h+ sleep → full energy restore; 10k steps → +happiness; poor sleep → tired
- Permissions UI, sync status indicator
- Requires React Native or Capacitor for native bridge (currently a web app)
- Effort: ~4–6 weeks (2 weeks iOS, 2 weeks Android, 2 weeks polish).

---

## V2.2+ — Long Term

### Sound Design Polish
- Commission or source proper `ambient_night.mp3` (crickets, wind, owl)
- `summon_friends.mp3` for Summon ability
- Additional ambient SFX (seasonal events, NPC sounds)

### Accessibility
- Dark mode support
- High contrast mode
- Keyboard navigation
- Screen reader support

### Seasonal Events
- Winter/autumn/rain visual themes
- Time-limited cosmetics
- Global challenges during holidays

### Mobile App
- Wrap in Capacitor or React Native for iOS/Android
- Enables HealthKit/Google Fit integration
- Push notifications for pet needs and couple challenges

### V3+ Social
- Pet profiles and sharing
- Friend's pets (read-only)
- Community leaderboards

---

## Open Questions

1. **Multiple pets:** Should advanced users have multiple pet slots, or always one shared pet?
2. **Monetization:** Free forever, or premium cosmetics?
3. **Health data start:** HealthKit only (iOS), or parallel Android/Google Fit?
4. **Rompy sprite:** Commission pixel art to match Harold/Bubby style, or different art approach?
5. **House system scope:** Build it as a separate "house view" mode, or integrate into the world grid?
6. **Activities array growth:** Currently append-only in Firestore (shared-workouts). Move to subcollection with TTL before it gets too large.
