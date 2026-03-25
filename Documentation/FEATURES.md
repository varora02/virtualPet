# Features Guide

## Two Pets

### Rompy (hare)
The default pet. Wanders the world, walks to food/water/rest/study spots in response to button presses, does a victory lap when played with.

### Bubby (tuxedo cat)
Unlockable by pressing the pet-switcher button in the header. Moves independently and has a richer idle animation set — randomly plays lick, yawn, or ear-scratch while sitting. Purrs briefly after you play with her. Responds to campfire proximity with ambient crackling audio.

**Switch pets:** 🐱 / 🐰 button in the game header.

---

## Pet Stats

Four stats (0–100) decay over time and are restored by interactions:

- **Hunger** — Restored by feeding. Decreases slowly during wandering.
- **Thirst** — Restored by watering. Decreases slowly over time.
- **Energy** — Restored by resting. Decreases during study sessions and active play.
- **Happiness** — Increases through play, study, and milestone events. Decreases if other stats fall low.

---

## Core Interactions

### Feed 🍎
Pet walks to the nearest grass patch and eats (+hunger, +1 coin). Grass respawns after 45s.

### Water 💧
Pet walks to the well and drinks (+thirst, +1 coin).

### Play 🎾
Pet performs a victory animation (+happiness, +XP, +1 coin). May trigger a level-up. If playing as Bubby, she purrs contentedly 0.8s after playing.

### Rest 😴
Pet stands still for 5 seconds (+energy, +1 coin).

### Pomodoro Study Timer ⏱
Start a 25-minute work session. Rompy walks to the nearest tree and reads; Bubby continues wandering nearby. When the session completes: +hunger, +happiness, +energy, +10 coins. A stretch popup appears offering a bonus (+energy, +happiness, +5 coins).

---

## Level System

Every interaction earns XP. Every 100 XP = 1 level. Level-ups trigger a 2-second golden flash animation and a popup.

Click the pet to inspect its current level, XP, and XP-to-next-level.

**Shop unlocks gated by level:**
- Lv2 — Ghost Bud (ability: translucent companion mirrors pet for 15s)
- Lv4 — Dumbbell Lift animation (Bubby pumps iron after a workout check-in)
- Lv7 — Happy Hop animation (Bubby jumps excitedly on level-up/play)

---

## World & Area System

### Layout

```
TL(6)  TM(7)  TR(8)   ← Top row
ML(3)  MM(4)  MR(5)   ← Middle row
BL(0)  BM(1)  BR(2)   ← Bottom row  (pets spawn in BL)
```

Each area is 448×256 px. The full world is 1344×768 px.

### Progression

Area 0 (BL) starts unlocked at tier 1. Spend coins in the shop to unlock adjacent areas and upgrade existing areas to tier 2. Tier upgrades change what props appear in that area.

Fences close off locked areas and disappear when an area unlocks.

### Props

- **Trees** — rest spots and Rompy's study locations
- **Well** — water source
- **Campfire** — decorative; plays crackling audio when Bubby wanders nearby
- **Lamps** — glow at night
- **Rocks, grass tufts, flowers** — decorative
- **Forest cluster** — 8 trees densely packed in TR area

### Night & Day

Night runs 20:00–07:00 PST. The scene darkens and prop glows (campfire, lamps, well) activate.

---

## Shop

Open with the 🛍 button. Three tabs:

- **World** — unlock new areas and upgrade existing areas to tier 2 (costs coins)
- **Items** — purchase props like basketball or soccer ball (purely decorative)
- **Animations** — unlock special animations for Bubby (Dumbbell Lift, Happy Hop)

---

## Audio

- Background music — toggle with 🔇/🎵 button in header (starts off, click to enable)
- SFX on every action (eat, drink, play, rest, coin reward, level-up, shop)
- Meow when you click Bubby
- Campfire proximity crackle
- Unlock fanfare when purchasing area upgrades
- Pomodoro completion chime

---

## Ambient Life

A blue robin occasionally flies in from the edge of the world, perches on a prop or tree-top with a slow chest-breathing animation, then flies off. Purely decorative.

---

## Couple Collaboration

Both Varun and Leena see the same pet in real time via Firebase Firestore. Any action either person takes (feed, water, play, rest, pomodoro) is reflected immediately for the other person and logged in the shared activity feed.

---

## Ghost Bud (Ability, Lv2)

A white translucent copy of the active pet follows 90px to the right and 10px above, mirroring all movement and animations. Toggle on/off via the abilities section inside the action drawer.
