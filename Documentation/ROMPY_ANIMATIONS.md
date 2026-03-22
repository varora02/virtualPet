# Rompy Animations & World Behaviours

A reference for every animation and state that Rompy and the world scene currently support, plus where to change them.

---

## Rompy States

Rompy can be in one of these states at any time (`eatStateRef.current` in `Pet.jsx`):

| State      | How it's triggered                        | What Rompy does                          |
|------------|-------------------------------------------|------------------------------------------|
| `idle`     | Default / after other states finish       | Walks left ↔ right automatically         |
| `going`    | Feed button pressed & grass is visible    | Walks toward the grass patch at 2× speed |
| `eating`   | Arrives at grass position                 | Stands still for 2.5 s, brightness pulses |
| `resting`  | Rest button pressed                       | Stands still for 5 s, gentle opacity pulse |
| `tired`    | `pet.energy <= 0`                         | Completely still, desaturated + dimmed   |

---

## CSS Animation Classes

All animations are in `src/components/Pet.css`.

### `.rompy-eating`
Rompy "chews" — cycles between bright and slightly dim:
```css
animation: eating-chew 0.45s ease-in-out infinite
/* 0%/100%: brightness(1.08) saturate(1.15) */
/* 50%:     brightness(0.94) saturate(0.88) */
```

### `.rompy-resting`
Gentle fade in/out while standing still:
```css
animation: rompy-rest-pulse 1.2s ease-in-out infinite
/* 0%/100%: opacity 1   */
/* 50%:     opacity 0.72 */
```

### `.rompy-tired`
Applied when `pet.energy === 0`. Overrides mood filter:
```css
filter: brightness(0.82) saturate(0.35) !important
```

### Mood filters (`.mood-filter-*`)
Tint Rompy's appearance based on overall stat average:

| Class               | Trigger (avg stat) | Filter                                        |
|---------------------|--------------------|-----------------------------------------------|
| `mood-filter-happy`   | ≥ 80             | none (full colour)                            |
| `mood-filter-neutral` | 50–79            | `brightness(0.96) saturate(0.9)`             |
| `mood-filter-sad`     | 25–49            | `brightness(0.78) saturate(0.5) hue-rotate(15deg)` |
| `mood-filter-critical`| < 25             | `brightness(0.65) grayscale(0.8)`            |

The background also switches: `critical` → `background2.svg` (night scene), otherwise `background3.svg` (day).

---

## Walking Mechanics

Defined as constants at the top of `src/components/Pet.jsx`:

```js
const WALK_SPEED = 0.18   // % per 50 ms tick — increase to walk faster
const WALK_LEFT  = 4      // left boundary (% from left edge of scene)
const WALK_RIGHT = 55     // right boundary — increase to let Rompy go further right
const GRASS_X    = 62     // % position of the grass food patch
```

Rompy's horizontal position is stored as `petX` (0–100, percent of scene width).
Direction is stored in `dirRef.current` (1 = right, -1 = left).
`facingRight` state drives `transform: scaleX(-1)` (flips the SVG horizontally).

---

## World Scene Objects

### Butterfly (`butterfly.svg`)
Floats lazily across the top third of the sky. Defined in `Pet.css`:
```css
animation: butterflyFloat 28s linear infinite
/* Travels left → right → loops */
/* Flips horizontally at 50% (turning around) */
```
To adjust speed: change `28s`. To change flight path: edit the `@keyframes butterflyFloat` percentages.

### Grass Patch (`grass.svg`)
- Fixed at `left: 62%` (GRASS_X constant), `bottom: 120px`
- Disappears when Rompy eats it (via `setGrassVisible(false)`)
- Respawns after **45 seconds** (`setTimeout → setGrassVisible(true)`)
- To change respawn time: edit the `45000` ms value in Pet.jsx

---

## Rompy Vertical Position

Adjust these values in `src/components/Pet.css` if Rompy or the grass appears too high or low:

```css
.rompy-walker { bottom: 115px; }  /* Rompy's feet level — increase = move up */
.world-grass  { bottom: 120px; }  /* Grass clump height — increase = move up  */
```

The background SVG (`background3.svg`) is **621 × 256 px** (2.43:1 ratio). With `object-fit: cover` on a ~420 px tall scene, the image scales to fit the width, making the grass line approximately **115–125 px from the bottom** of the container depending on scene width.

---

## Planned Animations (Future)

- **Trunk wave** — idle happiness animation using sprite sheets or SVG SMIL
- **Walking legs** — frame-by-frame SVG swap or CSS sprite offset
- **Play reaction** — Rompy bounces when Play is triggered
- **Water drinking** — Rompy walks to a water source (similar to grass mechanic)
- **Evolution glow** — sparkle effect when Rompy levels up
