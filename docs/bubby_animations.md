# Bubby's Animations

Complete reference of all Bubby (tuxedo cat) animations — sprite sheets, display dimensions, triggers, and unlock status.

---

## Always Available (no purchase required)

| Animation | File | Sheet | Display | Trigger |
|-----------|------|-------|---------|---------|
| **Walk** | `cat_walk.png` | 448×224 — 8fr × 4 dirs | 640×320 | Default movement |
| **Run** | `cat_run.png` | 336×224 — 6fr × 4 dirs | 480×320 | Purposeful movement (going to food, water, study, celebrate) |
| **Eat** | `cat_eat.png` | 392×112 — 7fr × E+W | 560×160 | Arrives at grass patch to eat |
| **Drink** | `cat_drink.png` | 336×56 — 6fr south | 480×80 | Arrives at well to drink |
| **Sit** | `cat_sit.png` | 448×112 — 8fr × E+W | 640×160 | Resting, studying, leveling up, or tired |
| **Lick** | `cat_lick.png` | 672×56 — 12fr south | 960×80 | Random idle (50% chance in lick/yawn/scratch pool, every 8–20 s); also plays on tab-focus greet |
| **Yawn** | `cat_yawn.png` | 616×56 — 11fr south | 880×80 | Random idle (30% chance) |
| **Scratch** | `cat_idle.png` | 256×32 — 8fr south, 32px native | 640×80 | Random idle (20% chance) — Bubby scratches an ear with her hind paw |
| **Jump** | `cat_jump.png` | 448×112 — 8fr × E+W | 640×160 | Fires once after leveling up (**requires Happy Hop unlock**) |

---

## Shop Unlockables

Purchase from the **Shop → Animations** tab with 🪙 coins.

| Animation | Shop Item | Icon | Cost | Level Req | File | Trigger |
|-----------|-----------|------|------|-----------|------|---------|
| **Ball Roll** | Ball Roll | 🎱 | 1 🪙 | Lv 3 | `cat_ball.png` — 504×112, 9fr × E+W | Plays on a loop during the ball-rolling phase of the Celebrate animation |
| **Dumbbell Lift** | Dumbbell Lift | 🏋️ | 1 🪙 | Lv 4 | `cat_stand.png` — 504×112, 9fr × E+W | Plays **twice** when the workout check-in popup is answered "Yes" |
| **Happy Hop** | Happy Hop | 🌸 | 1 🪙 | Lv 7 | `cat_jump.png` — 448×112, 8fr × E+W | Plays once after Bubby levels up |

---

## Animation Pool Detail

The **random idle pool** fires every 8–20 seconds while Bubby is fully still (idle or resting). It picks:

- **50%** → Lick (12 frames, ~1.68 s)
- **30%** → Yawn (11 frames, ~1.54 s)
- **20%** → Scratch ear (8 frames, ~0.88 s)

Movement or state transitions immediately cancel any pending idle timer.

---

## Removed

| Animation | Reason |
|-----------|--------|
| ~~Puke~~ (`cat_puke.png`) | Removed — was triggered when hunger < 10% |
| ~~Stretch~~ (`cat_stand.png` via 'stretch' shop ID) | Repurposed as Dumbbell Lift shop item |
