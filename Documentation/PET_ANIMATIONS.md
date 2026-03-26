# Pet Animations

> All sprite sheets, CSS classes, animation specs, and triggers for every character.

---

## Bubby (Tuxedo Cat)

Bubby uses horizontal-only sprite sheets (one direction per file). Source frames: 56×56 px. Display: `BUBBY_PX = 140px` (scale ≈ 2.5×). CSS class is swapped by `catSpecialAnim` state in `Pet.jsx`. All CSS classes use `pet-*` prefix.

| Animation | File(s) | Frames | Sheet Width (native) | CSS Class | Trigger |
|-----------|---------|--------|----------------------|-----------|---------|
| Walk east | `cat_walk_east.png` | 8 | 448px | `pet-walk` | Idle wander, east |
| Walk west | `cat_walk_west.png` | 8 | 448px | `pet-walk` | Idle wander, west |
| Run east | `cat_run_east.png` | 6 | 336px | `pet-run` | Going to food/water/play |
| Run west | `cat_run_west.png` | 6 | 336px | `pet-run` | Going |
| Eat | `cat_eat_*.png` | 7 | 392px | `pet-eat` | Eating grass |
| Drink | `cat_drink_south.png` | 6 | 336px | `pet-drink` | Drinking at well |
| Sit | `cat_sit_*.png` | 8 | 448px | `pet-sit` | Idle sit |
| Lick | `cat_lick_south.png` | 12 | 672px | `pet-lick` | Random idle (50%) |
| Yawn | `cat_yawn_south.png` | 11 | 616px | `pet-yawn` | Random idle (30%) |
| Ear-scratch | `cat_idle.png` | 8 | 640px | `pet-scratch` | Random idle (20%) — 32×80px native frames |
| Dumbbell Lift | `cat_stand.png` | 8 | 448px | `pet-workout` | Workout check-in; shop unlock Lv4 |
| Happy Hop | `cat_jump_*.png` | 8 | 448px | `pet-hop` | Play/level-up; shop unlock Lv7 |

**Special note on ear-scratch:** `cat_idle.png` has 32×80px native frames (different from the 56×56 standard). Uses `SCRATCH_SCALE = BUBBY_PX / 32`.

### Idle Scheduler
Fires every 12–22 seconds when Bubby is sitting idle. Randomly selects: lick (50%), yawn (30%), ear-scratch (20%).
- Lick duration: 1680ms
- Yawn duration: 1540ms
- Scratch duration: 880ms

### Ghost Bud
When Ghost Bud is active, a translucent copy of Bubby follows 90px right and 10px above, mirroring all movement and animations. CSS:
```css
.hare-ghost {
  opacity: 0.52;
  filter: brightness(1.8) saturate(0.1) invert(0.08) sepia(0.4) hue-rotate(160deg);
}
```

---

## Blue Robin (Ambient Bird)

Managed by `BirdSpawner.jsx`. Source frames: 56×56 px. Display: 84×84 px (1.5× scale).

| Animation | File | Frames | CSS Class | Timing |
|-----------|------|--------|-----------|--------|
| Fly east | `bird/bird_fly_east.png` | 9 | `bird-fly` | 1.08s steps(9) infinite |
| Fly west | `bird/bird_fly_west.png` | 9 | `bird-fly` | 1.08s steps(9) infinite |
| Perch (chest breathe) | `bird/bird_perch.png` | 5 | `bird-perch` | 6s steps(5) infinite — very slow |

**Phase machine:** `appear → flying_in → perching → flying_out → (cooldown) → repeat`

Robin spooks and flies off when Bubby approaches within 90px.

---

## Harold (Hare) — NPC

Harold is a wandering NPC implemented in `HaroldNPC.jsx`. Spawns when all 9 areas are unlocked. All sheets use 32×32 px source frames at 2.5× scale (80×80 px display). Direction encoded as rows.

**Direction row offsets (`--dir-offset`):**

| Direction | Offset |
|-----------|--------|
| down | 0px |
| up | -80px |
| left | -160px |
| right | -240px |

**Harold animation table:**

| State | File | Frames | CSS Class | Notes |
|-------|------|--------|-----------|-------|
| Walk | `Hare_Walk_with_shadow.png` | 5 | `hare-state-walk` | 0.55s steps(5) infinite; directional rows |
| Run | `Hare_Run_with_shadow.png` | 6 | `hare-state-run` | 0.4s steps(6) infinite; directional rows |
| Eat | `Hare_Eating.png` | 5 | `hare-state-eat` | 4s steps(5) 1 forwards; no direction |
| Drink | `Hare_Drinking.png` | 4 | `hare-state-drink` | 4s steps(4) 1 forwards; no direction |
| Rest | `Hare_Idle.png` | 4 | `hare-state-rest` | 1.2s steps(4) infinite; no direction |
| Level-up | `Hare_Idle.png` + flash | 4 | `hare-state-rest hare-levelup` | Flash overlay pulsing 0.3s alternate |
| Dead/tired | `Hare_Death.png` | 6 | `hare-state-dead` | 0.8s steps(5) 1 forwards; parks at frame 5 |
| Study (going) | `Hare_reading_with_shadow.png` | 6 | `hare-state-run` | ~~Not used for NPC~~ |
| Study (active) | `Hare_reading_with_shadow.png` | 6×2 rows | `hare-state-study` | ~~Not used for NPC~~ |
| Study (paused) | `Hare_reading_with_shadow.png` | 6 | `hare-state-study-pause` | ~~Not used for NPC~~ |

**Harold state machine:**
```
idle_wander ─── (button) ──→ going_eat/water/rest/study
                                ↓ (arrival)
                          eating/drinking/resting/study
                                ↓ (timer)
                          idle_wander

isTired → dying_walk → (at tree) → resting → idle_wander
levelUp → leveling (2s) → idle_wander
```

**CSS class naming convention:** `hare-state-<action>`, `hare-walker`, `hare-<modifier>`.

---

## Reading Sprite Details

`Hare_reading_with_shadow.png` — 1024×682 px total. 6 frames × 4 rows, each source frame ~170×170 px, displayed at 80×80 px. `background-size: 480px 320px`.

Row usage:
- Row 1 (y=0): `study_pause` — book resting, glancing up
- Row 2 (y=-80): unused
- Row 3 (y=-160): `study` loop A — reading actively
- Row 4 (y=-240): `study` loop B — reading actively

Active study timing: x-animation cycles 6 frames over 6s; y-animation alternates rows 3↔4 every 6s (12s full cycle). This is achieved with two simultaneous CSS animations:
```css
.hare-state-study {
  animation:
    hare-read-x 6s steps(6) infinite,
    hare-read-y 12s steps(2, end) infinite;
}
```

---

## Animations Planned / Still Needed

| Animation | For | Notes |
|-----------|-----|-------|
| Dumbbell Lift | Bubby | `cat_stand.png` — shop unlock at Lv4, also triggers on workout check-in |
| Happy Hop | Bubby | `cat_jump_*.png` — shop unlock at Lv7, also on play/level-up |
| Robin look-around, preen | Robin | Additional perch behaviors; currently just chest-breathe |
| Rompy animations | Rompy elephant | Sprite TBD — Varun to provide |
| Harold NPC walk/eat/drink/rest | Harold | ✅ Implemented — spawns when all 9 areas unlocked; wanders, eats grass, drinks at well, rests at tree |

---

## Harold ↔ Bubby Interaction Ideas

These are planned interactions to make the world feel alive. No sprites confirmed yet — noting here for future implementation.

### Proximity Reactions (passive, no new sprites needed)
- **Bubby approaches Harold eating** — Harold pauses mid-chew, ears perk up (could be a 1-frame hold), then resumes after Bubby passes. Simple state check, no new sprite.
- **Harold startles Robin** — if Harold wanders too close to Robin's perch point, Robin spooks and flies off (same logic as Bubby's spook radius, but triggered by Harold's position too).
- **Both at well at same time** — if Bubby arrives at the well while Harold is drinking, Bubby sits and waits, then drinks after Harold finishes. Queue logic.

### Greeting Animations (need sprites or can be CSS)
- **First meeting of the day** — when Bubby and Harold get within 60px for the first time since login, both face each other briefly (direction swap). Could use existing idle sprites, just timed facing.
- **Bubby bops Harold** — tap Harold → Bubby does a small hop (`pet-hop`) and Harold does a brief `hare-state-rest` (surprised idle). No damage, just playful.

### Shared Activities (longer-term, needs sprites)
- **Synchronized rest** — if both are near a tree at the same time, they both play rest animations side by side.
- **Harold brings Bubby a gift** — Harold occasionally pathfinds to Bubby and "drops" a coin (+1 coin for the player), then trots away. Uses run sprite, no new animation.
- **Chase** — low probability event: Harold runs in a wide arc around Bubby for 3–5s, Bubby tracks Harold with idle facing. Uses existing run sprite.

### Seasonal / Milestone (future)
- **Level-up celebration** — when Bubby levels up, Harold does a `hare-state-rest hare-levelup` flash from wherever he is in the world, as if cheering.
- **Workout together** — if both users log a workout in the same day, Harold and Bubby do their workout animations simultaneously for 3s.

---

## Special Animations

### Thought Bubbles
Triggered on pet click (Harold). Displays a thought bubble with mood/emoji above the pet's head. Purely CSS/JSX — no sprite sheet.

### Level-Up Flash
```css
.hare-levelup {
  animation:
    hare-rest 1.2s steps(4) infinite,
    levelup-flash 0.3s ease-in-out infinite alternate !important;
}
@keyframes levelup-flash {
  from { filter: brightness(1.0) saturate(1.0); transform: scale(1.0); }
  to   { filter: brightness(2.2) saturate(2.0) sepia(0.3) hue-rotate(-20deg); transform: scale(1.08); }
}
```
Golden glow + subtle scale pulse. Duration: 2 seconds, then returns to idle.

---

## Adding a New Animation (Step-by-Step)

1. Create sprite sheet (32×32 or 56×56 source frames, exported as PNG).
2. Calculate `background-size`: `(frames × display_px)` wide, `(rows × display_px)` tall.
3. Import sprite in `Pet.jsx`.
4. Add sprite URL selection: `eatState === 'new_state' ? newSprite : ...`
5. Add CSS class selection: `eatState === 'new_state' ? 'pet-new' : ...`
6. Add CSS in `Pet.css`:
   ```css
   .pet-new {
     background-size: XXXpx YYYpx;
     animation: pet-new Xs steps(N) [infinite | 1 forwards];
   }
   @keyframes pet-new {
     from { background-position-x: 0; }
     to   { background-position-x: -XXXpx; }
   }
   ```
7. Test: verify sprite displays, frames cycle, looping/duration match.
