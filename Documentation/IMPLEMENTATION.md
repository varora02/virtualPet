# Implementation Guide

> Reference for understanding and extending the VirtualPet codebase.

---

## Component Hierarchy

```
App
└── Game (state hub)
    ├── Pet (world scene renderer)
    │   ├── TileMap
    │   ├── PathOverlay
    │   ├── FenceOverlay
    │   ├── WorldProps (all interactive + decor props)
    │   ├── Grass patches (rendered inline)
    │   ├── Night overlay (conditional)
    │   ├── Light glows (loop over WORLD_PROPS with emitsLight)
    │   ├── Hare sprite (depth-sorted)
    │   └── Bubby sprite (depth-sorted)
    └── PomodoroTimer (study session UI)
        └── Controls + display
```

### Component Responsibilities

**App.jsx** — entry point; imports and renders Game.

**Game.jsx** (State Hub)
- Owns all pet stats: hunger, thirst, energy, happiness, level, XP, coins, unlockedAreas, areaTiers.
- Runs stat decay loop (1s interval) and interaction handlers.
- Manages trigger counters (feedTrigger, waterTrigger, restTrigger, studyTrigger, etc.).
- Receives callbacks from PomodoroTimer and forwards to Pet.
- Passes pet state + triggers + callbacks to Pet as props.

**Pet.jsx** (World Renderer)
- Receives pet state and triggers as props.
- Calls `useHareMovement` and `useGrassPatches` hooks.
- Renders the entire 1344×768 world: tiles, path, props, fences, grass patches, sprites, night overlay, light glows.
- Does NOT own movement logic — delegates to `useHareMovement`.

**PomodoroTimer.jsx** — standalone timer UI. Fires `onStudyStart`, `onStudyPause`, `onStudyResume`, `onStudyStop` callbacks. Owns no pet state.

---

## Key Files

| File | Responsibility |
|------|----------------|
| `App.jsx` | Entry point |
| `Game.jsx` | State hub, simulation loop, interaction handlers |
| `Pet.jsx` | World scene renderer, hook orchestration |
| `PomodoroTimer.jsx` | Study timer UI and callbacks |
| `worldConfig.js` | Dimension constants, `getAreaAtPoint()` |
| `worldData.js` | `PROP_SRCS`, `WORLD_PROPS`, `pos()`/`abs()` helpers |
| `useHareMovement.js` | Movement loop, state machine, fence clamping |
| `useGrassPatches.js` | Grass patch spawning, visibility, replenishment |
| `TileMap.jsx` | Ground tile grid |
| `PathOverlay.jsx` | Dirt path tile grid |
| `FenceOverlay.jsx` | Area boundary fences (shows/hides per unlockedAreas) |
| `WorldProps.jsx` | Maps WORLD_PROPS → rendered sprites/divs |
| `Pet.css` | All sprite animations, scene styles |

---

## Firestore Document Structure

### `pets/shared-pet`

| Field | Type | Description |
|-------|------|-------------|
| `hunger` | number (0–100) | Current hunger stat |
| `thirst` | number (0–100) | Current thirst stat |
| `energy` | number (0–100) | Current energy stat |
| `happiness` | number (0–100) | Current happiness stat |
| `level` | number | Pet level (starts at 1) |
| `exp` | number | Total accumulated XP |
| `coins` | number | Current coin balance |
| `unlockedAreas` | array\<number\> | Area IDs unlocked (e.g. [0,1,3]) |
| `areaTiers` | object | Map of areaId → tier (e.g. `{"0": 2, "4": 1}`) |
| `activePet` | string | `"harold"` or `"bubby"` |
| `ghostBudActive` | boolean | Ghost Bud ability toggle |
| `purchasedAnimations` | array\<string\> | e.g. `["dumbbell_lift", "happy_hop"]` |
| `lastInteraction` | timestamp | Last action timestamp (for mood system) |
| `mood` | string | Current mood label |

### `workouts/shared-workouts`

| Field | Type | Description |
|-------|------|-------------|
| `activities` | array\<object\> | Append-only log of all actions |
| `activities[].user` | string | `"varun"` or `"leena"` |
| `activities[].type` | string | Action type (feed, water, play, rest, study, workout) |
| `activities[].timestamp` | timestamp | When the action occurred |
| `activities[].coins` | number | Coins earned by this action |
| `workoutDoneToday` | object | `{ varun: bool, leena: bool }` — resets daily |
| `loginStreak` | object | Per-user streak counters |

---

## World Grid

### Dimensions (worldConfig.js)

| Constant | Value | Meaning |
|----------|-------|---------|
| `TILE_PX` | 64 | px per tile |
| `AREA_COLS` | 7 | tiles wide per area |
| `AREA_ROWS` | 4 | tiles tall per area |
| `AREA_W` | 448 | px per area (7×64) |
| `AREA_H` | 256 | px per area (4×64) |
| `SCENE_W` | 1344 | total scene width (3×448) |
| `SCENE_H` | 768 | total scene height (3×256) |
| `HARE_PX` | 80 | hare sprite display size |
| `BUBBY_PX` | 140 | Bubby sprite display size |
| `WALK_SPEED` | 2.0 | px per 50ms tick (~40 px/s) |
| `RUN_SPEED` | 8.0 | px per tick (~160 px/s) |

To resize the world: change only `AREA_COLS` and `AREA_ROWS`. All derived values auto-update.

### Area Grid (areaId)

```
TL(6)  TM(7)  TR(8)   ← y: 0–255
ML(3)  MM(4)  MR(5)   ← y: 256–511
BL(0)  BM(1)  BR(2)   ← y: 512–767
```

`areaId = (2 - screenRow) * 3 + col`

`getAreaAtPoint(x, y)` in `worldConfig.js` converts pixel coords to area ID. The pet spawns in BL (area 0).

### PROGRESSION_ORDER

Areas unlock via coins spent in the shop. Intended progression: BL(0) → BM(1)+ML(3) → BR(2)+MM(4)+MR(5) → TL(6)+TM(7)+TR(8).

---

## Tile System

### Ground Tiles (TileMap.jsx)

All tiles are 64×64 px (`imageRendering: pixelated`).

| Tile Key | File | Purpose |
|----------|------|---------|
| g1 | ground_43.png | Primary grass (checkerboard even) |
| g2 | ground_52.png | Alternate grass (checkerboard odd) |
| f35/f36/f56 | fields_35–56.png | Grass→dirt transition rows |
| f01 | fields_01.png | Dirt center |
| f14–f16 | fields_14–16.png | Dirt edge variants |
| f23 | fields_23.png | Dirt corner |

Bottom 3 tile rows are dirt/transition (controlled by `PATH_ROWS = 3`).

### Path Overlay (PathOverlay.jsx)

L-shaped dirt/cobblestone path:
```
TL(6) ─────────────── TM(7)
                          │
                         MM(4) ──────── MR(5)
```
Route: horizontal (rows 1–2, cols 0–9), corner (col 10), vertical (rows 3–4), corner, horizontal (rows 5–6, cols 11–20).

### worldConfig Constants

```js
pos(areaId, relX, relY)   // area-relative fractions → absolute px; rescales with world
abs(x, y)                  // raw pixel coords (round to nearest int)
```

---

## How to Add a New Prop to worldData.js

1. Copy the PNG to `src/assets/sprites/` or `src/assets/props/` or `src/assets/tiles/`.
2. `import bushImg from '../assets/props/bush_1.png'`
3. Add to `PROP_SRCS`: `bush: bushImg`
4. Add entry to `WORLD_PROPS`:

```js
{
  id: 'bush_2',            // unique string — React key and glow key
  type: 'bush',            // key in PROP_SRCS
  areaId: 3,               // informational; collision uses x/y not areaId
  x: 250, y: 150,          // absolute pixel coords of sprite top-left
  displayW: 80, displayH: 100,
  collisionR: 40,          // hare exclusion radius from centre (0 = no collision)

  // Optional fields:
  interactive: true,       // hare may be routed here
  interactType: 'water',   // 'water' | 'rest' | <new type>

  animated: true,          // render as <div> with CSS bg animation
  animClass: 'prop-campfire', // CSS class driving background-position

  emitsLight: true,        // render night glow div at Z_GLOW
  glowRadius: 100,         // glow circle radius in px (default 80)
  glowOffsetY: 0.3,        // 0=top of sprite, 1=bottom (default 0.5)
  glowCssClass: 'lantern-glow', // extra CSS class on glow div

  isDecor: true,           // fixed z=3, no collision (shadows, tufts, flowers)

  tier: 2,                 // minimum area tier required to show this prop
}
```

No changes needed in WorldProps.jsx, Pet.jsx, or any hooks.

---

## How to Add a New Interaction Type

An *interaction* is something the pet walks to and performs an animation at.

1. **worldData.js**: Add prop with `interactive: true, interactType: 'play'`.
2. **Pet.jsx**: Add `playTrigger = 0` prop, pass to `useHareMovement`.
3. **useHareMovement.js**:
   - Add `useEffect([playTrigger])` that sets `eatStateRef = 'going_play'` and finds target.
   - Add `'going_play'` to the frozen-state guard.
   - Add `if (state === 'going_play')` run branch.
4. **Pet.jsx**: Map `eatState === 'going_play'` → sprite URL and CSS class.
5. **Pet.css**: Add keyframes if new animation is needed.
6. **Game.jsx**: Add `const [playTrigger, setPlayTrigger] = useState(0)`, wire button.

---

## How to Add a New NPC

1. Create a new component (e.g. `HaroldNPC.jsx`) using `WanderingNPC.jsx` as base.
2. Define sprite imports and CSS classes in `Pet.css`.
3. Add position state and movement logic (can reuse movement patterns from `useHareMovement`).
4. Render inside `Pet.jsx` after all other world layers (z-index should respect foot-position depth sort).
5. Wire any interaction callbacks through `Game.jsx`.

See `NPCS.md` for per-NPC sprite and behavior specs.

---

## Scene Layer Stack (Z-Index)

| Z-index | Layer | Component |
|---------|-------|-----------|
| 0 | Ground tiles | `TileMap` |
| 2 | Path overlay tiles | `PathOverlay` |
| 3 | Decor (shadows, grass tufts, flowers) | `WorldProps` (`isDecor: true`) |
| 8 | Edible grass patches | `Pet.jsx` inline |
| Z_BASE + footY (~10–788) | Props + Hare (depth-sorted) | `WorldProps`, `Pet.jsx` |
| ~798 | Vertical fences | `FenceOverlay` |
| 818 | Night overlay | `Pet.jsx` |
| 820 | Light glows | `Pet.jsx` |

**Foot-position formula:** `z = Z_BASE + Math.round(y + displayH)` — objects lower on screen appear in front of objects higher on screen.

---

## Tier Decoration System

Each area has up to 3 tiers. Tier 1 is the base state when unlocked. Tiers 2+ are purchased in the shop.

**How tiers work in code:**
- `areaTiers` in Firestore stores `{ areaId: tierLevel }` for each area.
- `WORLD_PROPS` entries include a `tier` field (1/2/3). Props only render if `areaTiers[prop.areaId] >= prop.tier`.
- No other files need changing — filtering is wired in `WorldProps.jsx`.

**Asset sources:** `craftpix tileset2 / 2 Objects/` — subdirs: Stone (16 variants), Grass (6), Flower (12), Decor (boxes, dirt, lamps, logs, trees), Camp (6), Bush (6). Animated: Flag (5-frame), Campfire (6-frame).

**Pattern for adding a new tier prop:**
1. Import PNG from tileset2 into `worldData.js`.
2. Add to `PROP_SRCS`.
3. Add `WORLD_PROPS` entry with `tier: 2` (or 3), `collisionR: 0`, `isDecor: true`.
4. Position within the area's pixel bounds: `x = areaCol * AREA_W + offset`, `y = (2 - areaRow) * AREA_H + offset`.

**Per-area plan** (see TIER_DECORATION_SPEC.md source for full item list):
- Area 4 (MM, starting meadow): Tier 2 adds flower clusters + log + stone; Tier 3 adds flag + lamp + bush.
- Area 7 (BM): Tier 2 adds flowers + bush + log; Tier 3 adds camp item + lamp + box.
- Areas 3, 5, 1, 6, 8, 0, 2: Similar pattern — stones/grass at T1, flowers/bushes at T2, lamps/camp/logs at T3.

---

## Sprite Sheet Conventions

### Bubby (Tuxedo Cat)
- Source frames: 56×56 px
- Display: `BUBBY_PX = 140px` (scale ≈ 2.5×)
- Sheets are horizontal-only (one direction per file)
- CSS class prefix: `bubby-*` (e.g. `bubby-walk`, `bubby-run`)

### Harold (Hare)
- Source frames: 32×32 px
- Display: `HARE_PX = 80px` (scale = 2.5×)
- Direction encoded as rows: row 0=down, 1=up, 2=left, 3=right
- Direction offset CSS variable `--dir-offset`: down=0, up=-80, left=-160, right=-240 (px)
- Special exception: `cat_idle.png` (ear-scratch) has 32×80px native frames; `SCRATCH_SCALE = BUBBY_PX / 32`

### Naming convention
- Pet animations: `cat_<state>_<direction>.png` (Bubby), `Hare_<State>_with_shadow.png` (Harold)
- Bird: `bird/bird_<state>_<direction>.png`

---

## CSS Animation Patterns

### Basic frame cycling (steps())

```css
.bubby-walk {
  background-size: 1120px 140px;    /* 8 frames × 140px */
  animation: bubby-walk 0.8s steps(8) infinite;
}
@keyframes bubby-walk {
  from { background-position-x: 0; }
  to   { background-position-x: -1120px; }
}
```

**Formula:** `background-size-width = frameCount × BUBBY_PX`

### One-time animation (forwards)

```css
.bubby-eat {
  animation: bubby-eat 1.4s steps(7) 1 forwards;
}
```

`1 forwards` — plays once, freezes on last frame.

### Keyframe naming conventions
- Pet animations: `bubby-<state>`, `hare-<state>`
- Prop animations: `prop-<name>`, `<name>-flicker`
- Effects: `levelup-flash`, `bird-fly`, `bird-perch`

---

## Night System

**Time detection:**
```js
function getPSTHour() {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  ).getHours()
}
function checkIsNight() {
  const h = getPSTHour()
  return h >= 16 || h < 3  // 4 PM to 3 AM PST
}
```
Night is checked every 60 seconds (not per render).

**Night rendering:**
- `.night-overlay` div at z-index 818 darkens scene: `rgba(10, 20, 60, 0.55)`
- Light glows rendered for all props with `emitsLight: true`
- Glow divs use `mix-blend-mode: screen` to blend with dark overlay

**Glow CSS classes:**
- `.light-glow` — default warm amber (lamps, well)
- `.campfire-glow` — brighter, warm with subtle flicker animation

**Adding a new light source:** Set `emitsLight: true`, `glowRadius`, `glowOffsetY`, `glowCssClass` on the prop entry. Add a CSS class with `radial-gradient` background.

---

## State Management Patterns

### Trigger Counter Pattern
```js
// Game.jsx
const [feedTrigger, setFeedTrigger] = useState(0)
const handleFeed = () => setFeedTrigger(prev => prev + 1)

// useHareMovement.js
const feedTriggerRef = useRef(0)
useEffect(() => {
  if (feedTrigger > feedTriggerRef.current) {
    feedTriggerRef.current = feedTrigger
    // perform action
  }
}, [feedTrigger])
```
Allows multiple rapid identical triggers to queue correctly.

### Ref Tracking for Continuous State
Movement uses refs to maintain continuous position between renders without triggering re-renders at 20 FPS.

```js
const posRef = useRef({ x: 0, y: 0 })
const eatStateRef = useRef('idle')
// Movement loop updates refs in place; component reads them each render
```

### Real-time Firestore Sync
Game state is synced to Firestore via `onSnapshot`. Increments use `increment()` and array appends use `arrayUnion()` to avoid race conditions between two concurrent users.
