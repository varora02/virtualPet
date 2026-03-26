# Task: Pet Evolution

Visual growth arc — pet changes appearance as it levels up through 5 stages.

---

## Overview

As the pet accumulates XP and levels up, it visually evolves through distinct stages. Each stage has a new sprite set. Transitions trigger an evolution animation and a level-up popup with the new form's name.

---

## Evolution Stages

| Stage | Level Range | Bubby | Harold |
|-------|-------------|-------|--------|
| Baby | 1–4 | Tiny Bubby, big eyes | Baby Harold, wobbly proportions |
| Child | 5–9 | Slightly larger, more expressive | Child Harold |
| Adult | 10–14 | Current full-size Bubby | Current Harold (already exists) |
| Elder | 15–19 | Distinguished, calm | Wise Harold with visible age |
| Mythic | 20 | Glowing aura, cosmic coloring | Legendary Harold |

For Harold, the existing sprite sheets cover the adult stage. New sprite sets are needed for all other stages.

---

## Key Design Notes

- Current XP system: 100 XP/level, XP accumulates continuously — level = floor(totalExp / 100) + 1. This may need rebalancing for a 20-level arc.
- Evolution stages are cosmetic only — stats and behavior remain the same per stage.
- The evolution animation should be distinct from the regular level-up flash (which is per-level). Evolution animation plays only at stage thresholds (Lv5, Lv10, Lv15, Lv20).
- Sprite selection logic lives in `Pet.jsx` — add a `getEvolutionStage(level)` helper and switch sprite imports based on stage.

---

## Cosmetics & Outfits

Unlockable at level milestones (via shop or automatic):
- Lv5 — Seasonal costume (e.g. witch hat for October)
- Lv10 — Collar or accessory
- Lv15 — Elder costume visual
- Lv20 — Mythic theme (glowing aura, particle effects)

---

## Implementation Steps

1. Source/commission sprite sheets for each evolution stage.
2. Add `getEvolutionStage(level)` to `worldConfig.js` or a new `petUtils.js`.
3. Import all stage sprites in `Pet.jsx`, switch based on `evolutionStage`.
4. Add evolution animation: distinct from `levelup-flash`, plays at stage transition.
5. Update level-up popup to show evolution stage name when a threshold is crossed.
6. Store `evolutionStage` in Firestore (derived field, but store to avoid recomputation).
