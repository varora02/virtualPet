# World System — Architecture & Extensibility Guide

> Keep this document up to date whenever you add new systems.
> Future sessions use it to get oriented without reading every file.

---

## Current Dimensions (worldConfig.js)

| Constant      | Value | Meaning                          |
|---------------|-------|----------------------------------|
| `TILE_PX`     | 64    | px per tile                      |
| `AREA_COLS`   | 7     | tiles wide per area              |
| `AREA_ROWS`   | 4     | tiles tall per area              |
| `GRID_W/H`    | 3×3   | fixed area grid                  |
| `AREA_W`      | 448   | px per area column (7×64)        |
| `AREA_H`      | 256   | px per area row (4×64)           |
| `SCENE_W`     | 1344  | total scene width (21×64)        |
| `SCENE_H`     | 768   | total scene height (12×64)       |
| `HARE_PX`     | 80    | hare sprite display size         |
| `WALK_SPEED`  | 2.0   | px per 50 ms tick (~40 px/s)     |
| `RUN_SPEED`   | 8.0   | px per tick (~160 px/s)          |

**To resize the world:** change only `AREA_COLS` and `AREA_ROWS` in worldConfig.js.
All derived values (SCENE_W, SCENE_H, fence positions, spawn point, prop positions) auto-update.

---

## Area Grid

```
TL(6)  TM(7)  TR(8)   ← screenRow 0  (y: 0       → AREA_H-1)
ML(3)  MM(4)  MR(5)   ← screenRow 1  (y: AREA_H  → 2*AREA_H-1)
BL(0)  BM(1)  BR(2)   ← screenRow 2  (y: 2*AREA_H → SCENE_H-1)
```

`areaId = (2 - screenRow) * 3 + col`

`getAreaAtPoint(x, y)` in worldConfig.js converts pixel coords to area ID.
The hare spawns in BL (area 0).

---

## File Map

```
src/
  worldConfig.js          — all dimensions + getAreaAtPoint()
  worldData.js            — PROP_SRCS asset map + pos()/abs() helpers + WORLD_PROPS array
  hooks/
    useGrassPatches.js    — grass patch state, spawn logic, area-unlock detection
    useHareMovement.js    — position, direction, eatState, movement loop, fence clamping
  components/
    Pet.jsx               — scene root: renders everything, uses hooks above (~180 lines)
    WorldProps.jsx        — thin renderer: maps WORLD_PROPS → <img>/<div> elements
    TileMap.jsx           — ground tile grid
    PathOverlay.jsx       — dirt path tiles (L-shaped route across TL/TM/MM/MR)
    FenceOverlay.jsx      — area boundary fences (shows/hides per unlockedAreas prop)
    Pet.css               — all sprite animations + scene styles
```

---

## Z-Index Tiers

| Layer              | z-index formula                       | Value (default) |
|--------------------|---------------------------------------|-----------------|
| Ground tiles       | 0                                     | 0               |
| Path tiles         | 2                                     | 2               |
| Decor (shadows, grass tufts, flowers) | 3               | 3               |
| Grass patches      | 8                                     | 8               |
| Props + Hare       | `Z_BASE + round(footY)`              | ~10–798         |
| H-fences           | `Z_BASE + round(fenceY)` (depth-sorted) | ~10–798      |
| V-fences           | `Z_VFENCE = Z_BASE + SCENE_H + 20`  | 798             |
| Night overlay      | `Z_NIGHT = Z_BASE + SCENE_H + 40`   | 818             |
| Light glows        | `Z_GLOW  = Z_BASE + SCENE_H + 42`   | 820             |

**Foot-position depth sorting:** `z = Z_BASE + round(y + displayH)` — objects higher on screen
appear behind objects lower on screen. Both props and the hare use this formula.

---

## Adding a New Prop

1. Add the PNG import to `worldData.js`.
2. Add a key → URL entry in `PROP_SRCS`.
3. Add one or more entries to `WORLD_PROPS` using the schema below.
4. No changes needed in WorldProps.jsx, Pet.jsx, or any hooks.

### WORLD_PROPS Entry Schema

```js
{
  id           : string    // unique — used as React key and glow key
  type         : string    // key in PROP_SRCS
  areaId       : 0–8       // informational (collision uses x/y, not areaId)
  x, y         : number    // absolute pixel coords of sprite top-left
  displayW     : number    // rendered width (px)
  displayH     : number    // rendered height (px)
  collisionR   : number    // hare exclusion radius from centre (0 = no collision)

  // Optional
  interactive? : boolean   // hare may be routed here
  interactType?: string    // open string: 'water' | 'rest' | <new type>

  animated?    : boolean   // render as <div> with CSS bg animation
  animClass?   : string    // CSS class that drives background-position animation

  emitsLight?  : boolean   // render a night glow div at Z_GLOW
  glowRadius?  : number    // glow circle radius in px (default 80)
  glowOffsetY? : number    // 0=top of sprite, 1=bottom (default 0.5)
  glowCssClass?: string    // extra CSS class on glow div (e.g. 'campfire-glow')

  isDecor?     : boolean   // fixed z=3, no collision (shadows, tufts, flowers)
}
```

### Position Helpers

```js
pos(areaId, relX, relY)   // area-relative fractions → absolute pixels; rescales with world
abs(x, y)                  // raw pixel coords (round to nearest int)
```

---

## Adding a New Interaction Type

An *interaction* is something the hare walks to and performs an animation at.

1. **Add the prop** to `WORLD_PROPS` with `interactive: true` and a new `interactType` string
   (e.g. `interactType: 'play'`).

2. **Add a trigger prop** to `Pet.jsx` (e.g. `playTrigger = 0`) and pass it into `useHareMovement`.

3. **In `useHareMovement.js`:**
   - Add a `useEffect` that reacts to the trigger: sets `eatStateRef` to `'going_play'`, picks a target pos from the new prop, calls `updateDirection`.
   - Add `'going_play'` to the frozen-state guard so it doesn't interrupt mid-animation.
   - Add a `if (state === 'going_play')` run branch before idle wander (mirrors `going_water`).

4. **In `Pet.jsx`:** map `eatState === 'going_play'` → sprite URL and CSS class.

5. **In `Pet.css`:** add the new animation keyframes if needed.

---

## Adding a New Light Source

Set on the prop entry in `worldData.js`:

```js
emitsLight: true,
glowRadius: 120,          // px radius
glowOffsetY: 0.3,         // centre of glow within the sprite (0=top, 1=bottom)
glowCssClass: 'my-glow',  // optional — for custom colour/animation
```

Add the CSS class to `Pet.css` with a `radial-gradient` background and `mix-blend-mode: screen`.
See `.campfire-glow` as an example (the default `.light-glow` gives a warm amber look).

---

## Fence Clamping

`clampToUnlocked(nx, ny, pos)` in `useHareMovement.js` prevents the hare from entering
locked areas. It runs on every movement tick for all four movement modes
(dying-walk, going, going_water, idle wander).

Priority order:
1. Full move `(nx, ny)` — accepted if in an unlocked area.
2. X-only slide `(nx, pos.y)` — lets the hare slide along a fence edge.
3. Y-only slide `(pos.x, ny)` — same, other axis.
4. Stay put — picks a new random wander target so the hare doesn't freeze.

The dying-walk tree search (`isTired` effect) also filters to trees whose **centre pixel**
falls inside an unlocked area, so the hare never targets a tree it can't reach.

---

## Grass Patches (useGrassPatches.js)

- 1–2 patches spawned per unlocked area on mount.
- New patches appended automatically when new areas unlock.
- Each patch is `{ id, areaId, x, y, visible }`.
- `hideGrassPatch(i)` / `restoreGrassPatch(i)` are passed into `useHareMovement` for eat/replenish.
- Replenish timer: 45 s (set in the movement hook's `going` branch).
- Spawn avoids prop collision radii automatically (WORLD_PROPS is checked per candidate point).

---

## Path Layout (PathOverlay.jsx)

L-shaped dirt path using 4 tile types:

| Key   | Tile file        | Meaning              |
|-------|------------------|----------------------|
| `h`   | ground_path_41   | Horizontal straight  |
| `v`   | ground_path_38   | Vertical straight    |
| `cld` | ground_path_30   | Corner: left → down  |
| `cdr` | ground_path_34   | Corner: down → right |

Route (tile coordinates, 21×12 grid):
```
Row 1, cols  0–11  → horizontal (tile 41)
Col 12, row  1     → corner left→down (tile 30)
Col 12, rows 2–4   → vertical (tile 38)
Col 12, row  5     → corner down→right (tile 34)
Row 5, cols 13–20  → horizontal (tile 41)
```

This traces TL(6) → TM(7) → MM(4) → MR(5).

---

## Hare Sprites

All sheets use 32×32 px source frames, displayed at 2.5× (80×80 px).
Direction is controlled by `background-position-y` (row offset):

| Direction | --dir-offset |
|-----------|-------------|
| down      | 0px         |
| up        | -80px       |
| left      | -160px      |
| right     | -240px      |

| State        | Sprite file                   | Frames | CSS class                    |
|--------------|-------------------------------|--------|------------------------------|
| walk/idle    | Hare_Walk_with_shadow         | 5      | hare-state-walk              |
| run          | Hare_Run_with_shadow          | 6      | hare-state-run               |
| eating       | Hare_Eating                   | 5      | hare-state-eat               |
| drinking     | Hare_Drinking                 | 4      | hare-state-drink             |
| resting      | Hare_Idle                     | 4      | hare-state-rest              |
| level-up     | Hare_Idle + flash             | 4      | hare-state-rest hare-levelup |
| dead/tired   | Hare_Death                    | 6      | hare-state-dead              |
| going_study  | Hare_reading_with_shadow      | 6      | hare-state-run (runs to tree)|
| study        | Hare_reading_with_shadow      | 6×2 rows| hare-state-study            |
| study_pause  | Hare_reading_with_shadow      | 6      | hare-state-study-pause       |

Eating and level-up animations play for 4 s then reset to idle.
Drinking plays for 4 s. Resting for 5 s.

### Reading sprite (Hare_reading_with_shadow.png)
1024×682 px — 6 frames × 4 rows, each source frame ~170×170 px, displayed at 80×80 px.
`background-size: 480px 320px`

Row usage:
- Row 1 (y=0)    → `study_pause` — hare glances up, book resting (pause/stop)
- Row 2 (y=-80)  → unused
- Row 3 (y=-160) → `study` loop A (reading actively)
- Row 4 (y=-240) → `study` loop B (reading actively)

Active study: x-animation cycles 6 frames over 6 s; y-animation alternates row 3↔4 every 6 s (12 s full cycle).

### Study session flow (PomodoroTimer → Game.jsx → useHareMovement)
1. User hits ▶ Start (work phase) → `onStudyStart` → `studyTrigger++` → hare runs to nearest tree → `going_study` → arrives → `study`
2. User hits ⏸ Pause → `onStudyPause` → `studyPauseTrigger++` → hare switches to `study_pause` (row 1)
3. User hits ▶ Resume → `onStudyStart` (again) → `studyResumeTrigger++` → hare returns to `study`
4. User hits 🔄 Reset OR work session completes → `onStudyStop` → `studyStopTrigger++` → hare returns to `idle`

---

## Notable Decisions & Gotchas

**getAreaAtPoint is in worldConfig.js** (not Pet.jsx) because both the movement hook
and the dying-walk filter need it. Import from worldConfig.

**WorldProps.jsx re-exports WORLD_PROPS** (`export { WORLD_PROPS } from '../worldData.js'`)
so existing code that does `import { WORLD_PROPS } from './WorldProps.jsx'` keeps working.

**Campfire glow uses glowCssClass** — the prop entry in worldData.js has
`glowCssClass: 'campfire-glow'`. Pet.jsx reads this field generically, so any future
animated light source gets its own CSS class without touching Pet.jsx.

**Tree shadows are NOT rendered for bottom-row trees** (areas 0/1/2) because the shadow
sprites would spill over the sand tiles at the bottom of those areas. Shadow entries for
those trees are intentionally absent from WORLD_PROPS.

**Path-adjacent trees** (tree_6 in TL, tree_7 in TM, tree_5 in MR) are positioned at
relY ≥ 0.55 so their bases sit below path row 1 (y ≈ 64–128 in TL/TM) and path row 5
(relY ≈ 0.25–0.50 in MR). Their shadows are also omitted to avoid overlap with dirt tiles.
