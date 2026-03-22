# 🎨 SVG Assets — Full Download List

All assets should be **flat vector style** matching the reference art.
Save to: `VirtualPet/svgs/` — the code automatically picks them up from `src/assets/svgs/`.

---

## ✅ Already Have

| File | Used For | Status |
|------|----------|--------|
| `rompy.svg` | Main character (all screens) | ✅ Wired up |
| `background3.svg` | World scene — daytime | ✅ Wired up |
| `background2.svg` | World scene — critical/night mood | ✅ Wired up |
| `grass.svg` | Ground strip texture | ✅ Wired up |
| `background1.svg` | Rich wide scene | ⚠️ 6.6MB — needs optimization before use |

---

## 🔴 Priority 1 — Character States (needed now for V1 polish)

These replace the current CSS filter mood system with actual art.

| File to download | Description | Size hint |
|-----------------|-------------|-----------|
| `rompy_happy.svg` | Rompy smiling, ears perked up, maybe a little bounce pose | Square ~200px |
| `rompy_sad.svg` | Drooping ears, frown, maybe a small tear | Square ~200px |
| `rompy_critical.svg` | Very sick — very droopy, grey-toned, slumped | Square ~200px |
| `rompy_eating.svg` | Trunk reaching toward a food bowl, mid-chew | Square ~200px |
| `rompy_drinking.svg` | Trunk dipping into water, small splash | Square ~200px |
| `rompy_sleeping.svg` | Eyes closed, lying down, "ZZZ" optional | Square ~200px |
| `rompy_playing.svg` | Energetic pose — maybe kicking or tossing a ball | Square ~200px |
| `rompy_studying.svg` | Sitting, focused, little book or pencil | Square ~200px |

---

## 🟠 Priority 2 — World Decorations (makes the scene feel alive)

These get placed as objects Rompy can walk to and interact with.

| File | Description | Notes |
|------|-------------|-------|
| `cloud.svg` | Single fluffy cloud shape | Will be duplicated/scaled in code |
| `tree_large.svg` | Tall leafy tree | Background decoration |
| `tree_small.svg` | Smaller tree / bush | Ground level |
| `flower_patch.svg` | Small cluster of flowers | Ground decoration |
| `food_bowl.svg` | Round bowl with food pellets (filled) | Where Rompy eats |
| `food_bowl_empty.svg` | Same bowl but empty | Shown when hunger is low |
| `toy_ball.svg` | Simple bouncy ball | Where Rompy plays |
| `bed_spot.svg` | Cozy sleeping pad / nest | Where Rompy rests |
| `lake_scene.svg` | Cliff + waterfall gap + lake (right side, portrait) | Replaces current programmatic version |

**Lake scene spec:**
- Viewbox: `0 0 210 290` (portrait, tall)
- Left cliff wall, right cliff wall, gap in middle for waterfall
- Waterfall = static blue/white shape in gap (code animates the flow)
- Lake at bottom filling full width
- Rocky pixel-style boulders at cliff base

---

## 🟡 Priority 3 — Evolution Stages (V2.0 feature)

Rompy levels up over time. Each stage looks older/more majestic.

| File | Stage | Description |
|------|-------|-------------|
| `rompy_baby.svg` | Level 1–4 | Tiny, big eyes, wobbly proportions, very cute |
| `rompy_teen.svg` | Level 5–9 | Slightly mischievous, energetic pose |
| `rompy_adult.svg` | Level 10–14 | Current `rompy.svg` — calm and strong |
| `rompy_elder.svg` | Level 15–19 | Distinguished, wise, maybe small tusks |
| `rompy_mythic.svg` | Level 20 | Legendary — glowing aura, cosmic colouring, majestic |

---

## 🟢 Priority 4 — UI & Game Icons (V2.0 economy system)

Small icons used inside buttons, shop, stats, and overlays.

| File | Used For | Size |
|------|----------|------|
| `coin.svg` | In-game currency display | 32×32px |
| `star.svg` | XP / achievement stars | 32×32px |
| `heart.svg` | Love / couple meter | 32×32px |
| `trophy.svg` | Achievement badge | 48×48px |
| `lock.svg` | Locked item in shop | 32×32px |
| `shop_bag.svg` | Shop button icon | 48×48px |
| `house_icon.svg` | House/room navigation | 48×48px |
| `pomodoro_icon.svg` | Study timer button | 48×48px |

---

## 🔵 Priority 5 — House / Room Scenes (V2.0 house system)

Full room backgrounds that replace the outdoor world scene when inside.

| File | Room | Description |
|------|------|-------------|
| `room_living.svg` | Living Room | Couch, rug, window — starting room |
| `room_bedroom.svg` | Bedroom | Bed, lamp, cozy — unlocked at level 5 |
| `room_kitchen.svg` | Kitchen | Counter, shelves — unlocked at level 8 |
| `room_garden.svg` | Garden | Flowers, pond, fence — unlocked at level 12 |
| `room_study.svg` | Study Room | Desk, bookshelves — unlocked at level 10 |

**Room spec:** Wide landscape format, ~900×300px, flat vector interior scene.

---

## 🌸 Priority 6 — Seasonal Variations (V2.2)

| File | Season | Description |
|------|--------|-------------|
| `background_snow.svg` | Winter | Same layout as bg3 but snow-covered |
| `background_rain.svg` | Rainy day | Grey sky, rain streaks, puddles |
| `background_night.svg` | Night | Stars, moon, dark landscape — richer than bg2 |
| `background_autumn.svg` | Autumn | Orange/red leaves, warm tones |
| `rompy_scarf.svg` | Winter Rompy | Rompy wearing a cosy scarf |
| `rompy_raincoat.svg` | Rainy Rompy | Rompy in a tiny raincoat |

---

## 📐 Style Guide for All Assets

- **Style:** Flat vector, bold outlines, limited colour palette (5–8 colours per asset)
- **Backgrounds:** No gradients in the SVG itself — code applies gradients/overlays
- **Characters:** Clean silhouette, expressive face, chunky proportions
- **File format:** `.svg` — keep paths clean and minimal (under ~500 paths ideally)
- **Colour palette (Rompy):** Purple/lavender body `#7B6FAB`, pink blush `#F7A8B8`, dark outline `#2C2240`, cream tummy `#EDE0FF`
- **Avoid:** Raster effects, embedded photos, complex gradients inside the SVG

---

## 🗂️ File Location

```
VirtualPet/
├── svgs/              ← drop new files HERE
│   ├── rompy.svg
│   ├── background2.svg
│   ├── background3.svg
│   ├── grass.svg
│   └── background1.svg  (not yet used — too large)
└── src/
    └── assets/
        └── svgs/      ← code reads from here (auto-copied)
```

When you drop new files into `svgs/`, let me know and I'll wire them into the right component.

---

*Last updated: March 2026*
