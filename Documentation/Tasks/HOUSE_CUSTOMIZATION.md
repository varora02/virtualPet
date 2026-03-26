# Task: House Customization

Multi-room house that both users customize together with furniture and themes.

---

## Overview

A separate "house view" mode accessible from the main game UI. Players unlock rooms by reaching pet level milestones and buy furniture with coins. Both users share the same house state via Firestore.

---

## Rooms

| Room | Unlock Level | Unlock Cost |
|------|-------------|-------------|
| Starting Room (bedroom) | Always available | Free |
| Kitchen | Level 5 | 100 coins |
| Study Room | Level 7 | 120 coins |
| Garden/Outdoor | Level 10 | 150 coins |
| Bathroom | Level 8 | 80 coins |
| Master Bedroom | Level 15 | 100 coins |

---

## Furniture Catalog (Planned)

20–50 items at launch. Examples:
- Basic Chair: 25 coins
- Cozy Bed: 50 coins
- Plant (small): 15 coins / (large): 35 coins
- Painting: 40 coins
- Rug: 30 coins
- Lamp: 20 coins
- Bookshelf: 45 coins

---

## Implementation Notes

- New component: `HouseView.jsx` — full-screen room scene, replaces world view when active
- Navigation: 🏠 button in header to enter house, back button to return to world
- Furniture placement: click-to-place interface; drag-and-drop if feasible
- Firestore: `rooms/` subcollection or fields in `pets/shared-pet`:
  ```
  rooms: {
    bedroom: { unlocked: true, theme: "cozy", furniture: ["bed", "lamp"] },
    kitchen: { unlocked: false }
  }
  ```
- Both users see and modify the same house in real time (same `onSnapshot` pattern as pet state)
- Room backgrounds: flat vector SVGs (see `ASSETS.md → SVG Asset Wishlist`)

---

## Open Design Questions

- Drag-and-drop or simpler click-to-place with grid snapping?
- Pets wander inside the house, or house is a separate static scene?
- Do we render the pet in the house view or keep it purely decorative?
