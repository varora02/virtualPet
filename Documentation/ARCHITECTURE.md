# Architecture Guide

## Component Hierarchy

```
App
├── Game (state hub)
│   ├── Pet (world scene renderer)
│   │   ├── TileMap
│   │   ├── PathOverlay
│   │   ├── FenceOverlay
│   │   ├── WorldProps (all interactive props)
│   │   ├── Grass patches (rendered inline)
│   │   ├── Night overlay (conditional)
│   │   ├── Light glows (loop over WORLD_PROPS)
│   │   └── Hare sprite (clickable)
│   └── PomodoroTimer (study session UI)
│       └── Controls + display
└── Sidebar / UI Container
```

### Component Responsibilities

**App.jsx**
- Entry point; imports and renders Game and PomodoroTimer.

**Game.jsx** (State Hub)
- Owns all pet stats (hunger, thirst, energy, happiness, level, XP).
- Runs the main simulation loop (stat decay, interaction processing).
- Manages interaction triggers (feedTrigger, waterTrigger, restTrigger, studyTrigger, etc.).
- Receives callbacks from PomodoroTimer and forwards to Pet.
- Passes down pet state + triggers + callbacks to Pet as props.
- Tracks user input (Start, Pause, Reset buttons).

**Pet.jsx** (World Renderer)
- Receives pet state and triggers as props.
- Calls hooks to compute hare position and animation state.
- Renders the entire 3×3 world grid, including:
  - Ground tiles (TileMap)
  - Path overlay (PathOverlay)
  - Interactive props (WorldProps)
  - Fences (FenceOverlay, conditional on unlockedAreas)
  - Grass patches (useGrassPatches hook)
  - Hare sprite (depth-sorted)
  - Night overlay and light glows (conditional on isNight)
  - In-world level popup (conditional on showLevelPopup)
- Does NOT own movement logic; delegates to useHareMovement hook.

**PomodoroTimer.jsx**
- Standalone timer UI component.
- Manages timer state (time left, work vs. break, running vs. paused).
- Fires callbacks: `onStudyStart`, `onStudyPause`, `onStudyResume`, `onStudyStop`.
- Does NOT own hare state; purely a UI control.

---

## Data Flow

### Pet State (Game.jsx → Pet → Hooks → Renders)

```
Game.jsx
  ├─ pet = { hunger, thirst, energy, happiness, level, exp, ... }
  ├─ unlockedAreas = [0, 1, 3, 4]
  └─ Passes to Pet component

Pet.jsx
  ├─ Receives pet, unlockedAreas, triggers, callbacks
  ├─ Calls useHareMovement() → receives { petPos, direction, eatState, arrivedAtTree }
  ├─ Calls useGrassPatches(unlockedAreas) → receives { grassPatches, hideGrassPatch, restoreGrassPatch }
  └─ Renders world using computed position + animation state

CSS Animations
  └─ Sprite displays based on eatState + direction, no further data flow needed
```

### Interaction Triggers (Button → Counter → Hook → State Change)

```
User clicks "Feed" button
  ↓
Game.jsx: handleFeed() → setFeedTrigger(prev => prev + 1)
  ↓
Game.jsx: passes feedTrigger to Pet component
  ↓
Pet.jsx: passes feedTrigger to useHareMovement hook
  ↓
useHareMovement.js: useEffect([feedTrigger]) detects change
  ↓
  - Sets eatState to 'going_eat'
  - Finds nearest grass patch
  - Hare walks to patch
  - On arrival, eatState → 'eating'
  - Animation plays (4 seconds)
  - Callback: onAte() called
  ↓
Game.jsx: onAte() → increases hunger stat
```

### Study Session Flow (PomodoroTimer → Game → Pet → useHareMovement)

```
User clicks ▶ Start in PomodoroTimer
  ↓
PomodoroTimer: fires onStudyStart() callback
  ↓
Game.jsx: handleStudyStart() → increments studyTrigger
  ↓
Game.jsx: passes studyTrigger to Pet component
  ↓
Pet.jsx: passes studyTrigger to useHareMovement hook
  ↓
useHareMovement.js: useEffect([studyTrigger]) detects change
  ↓
  - Finds nearest accessible tree with interactType='rest'
  - Sets eatState to 'going_study'
  - Hare runs to tree
  ↓
On arrival at tree:
  - eatState → 'study'
  - Sprite switches to reading animation
  - CSS animates rows 3 ↔ 4 every 6 seconds
  ↓
User clicks ⏸ Pause in PomodoroTimer
  ↓
PomodoroTimer: fires onStudyPause() callback
  ↓
Game.jsx: handleStudyPause() → increments studyPauseTrigger
  ↓
useHareMovement.js: useEffect([studyPauseTrigger]) → eatState='study_pause'
  ↓
Pet.jsx: sprite switches to reading sprite row 1 (closed book)
  ↓
User clicks ▶ Resume
  ↓
Similar flow increments studyResumeTrigger → eatState='study'
  ↓
User timer expires or clicks 🔄 Reset
  ↓
PomodoroTimer: fires onStudyStop() callback
  ↓
Game.jsx: handleStudyStop() → increments studyStopTrigger
  ↓
useHareMovement.js: eatState='idle', hare wanders freely
  ↓
Game.jsx: onComplete() bonus XP applied
```

---

## State Management Patterns

### 1. Trigger Counter Pattern

Used for all interactions (feed, water, rest, study, etc.):

```js
// Game.jsx
const [feedTrigger, setFeedTrigger] = useState(0)

const handleFeed = () => {
  setFeedTrigger(prev => prev + 1)  // Increment to signal
}

// Pass to Pet
<Pet feedTrigger={feedTrigger} />

// In useHareMovement.js
const feedTriggerRef = useRef(0)

useEffect(() => {
  if (feedTrigger > feedTriggerRef.current) {
    feedTriggerRef.current = feedTrigger
    // Trigger action: find food, set eatState='going_eat', etc.
  }
}, [feedTrigger])
```

**Why?** Allows multiple identical triggers to queue correctly. A single boolean or state value would miss rapid clicks.

### 2. Callback Pattern for Results

Hooks report results back to Game.jsx via callbacks:

```js
// Pet.jsx
<Pet
  onAte={handleAte}
  onLevelUpComplete={handleLevelUpComplete}
/>

// Game.jsx
const handleAte = () => {
  setPet(prev => ({
    ...prev,
    hunger: Math.min(100, prev.hunger + 25),
    happiness: Math.min(100, prev.happiness + 3),
  }))
}
```

**Why?** Allows the world renderer (Pet) to delegate stat changes back to the centralized state hub (Game).

### 3. Ref Tracking Pattern

Used in hooks to distinguish first trigger from re-renders:

```js
const feedTriggerRef = useRef(0)

useEffect(() => {
  if (feedTrigger > feedTriggerRef.current) {
    // Action only happens once per trigger increment
    feedTriggerRef.current = feedTrigger
  }
}, [feedTrigger])
```

**Why?** Without this, the useEffect would fire on every re-render, causing duplicate actions.

### 4. Position Tracking Pattern

Movement uses refs to maintain continuous position between renders:

```js
const posRef = useRef({ x: 0, y: 0 })
const directionRef = useRef('down')
const eatStateRef = useRef('idle')

// Movement loop updates refs in place
posRef.current.x += vx
posRef.current.y += vy

// Return computed values on each render
return {
  petPos: posRef.current,      // Latest position
  direction: directionRef.current,
  eatState: eatStateRef.current,
}
```

**Why?** Allows smooth continuous movement without re-rendering 60 times per second. Position updates in a setInterval loop, and the component renders it via refs.

---

## Key Files & Their Roles

| File | Responsibility |
|------|-----------------|
| `App.jsx` | Entry point |
| `Game.jsx` | State hub, simulation loop, interaction handlers |
| `Pet.jsx` | World scene renderer, hook orchestration |
| `PomodoroTimer.jsx` | Study timer UI and callbacks |
| `worldConfig.js` | Dimension constants, area → pixel mapping |
| `worldData.js` | Prop positions, sprite asset map (PROP_SRCS, WORLD_PROPS) |
| `useHareMovement.js` | Movement logic, state machine, interaction routing |
| `useGrassPatches.js` | Grass patch spawning, visibility, replenishment |
| `TileMap.jsx` | Ground tile grid rendering |
| `PathOverlay.jsx` | Dirt path tile grid |
| `FenceOverlay.jsx` | Area boundary fences |
| `WorldProps.jsx` | Maps WORLD_PROPS to rendered sprites |
| `Pet.css` | All sprite animations, styling |

---

## Stat Simulation Loop

**Location:** `Game.jsx`, `useEffect` with `[isPaused]` dependency

```js
useEffect(() => {
  if (isPaused) return

  const interval = setInterval(() => {
    setPet(prev => ({
      ...prev,
      // Decay rates (per second)
      hunger: Math.max(0, prev.hunger - HUNGER_DECAY),
      thirst: Math.max(0, prev.thirst - THIRST_DECAY),
      energy: Math.max(0, prev.energy - ENERGY_DECAY),
      happiness: Math.max(0, prev.happiness - HAPPINESS_DECAY),

      // Update based on current state
      exp: prev.exp + EXP_PER_SECOND,
    }))
  }, 1000)

  return () => clearInterval(interval)
}, [isPaused])
```

**Decay rates** can be modified based on eatState. For example, during study sessions, energy decays faster:

```js
const energyDecay = eatState === 'study' ? ENERGY_DECAY * 2 : ENERGY_DECAY
```

---

## Movement System (useHareMovement.js)

### State Machine Overview

```
idle_wander
  ↓ (button clicked)
going_eat → eating → idle_wander
going_water → drinking → idle_wander
going_rest → resting → idle_wander
going_study → study ↔ study_pause → idle_wander

(if stats critical)
dying_walk → (at tree) → dead/resting → idle_wander

(during level up)
idle_wander → leveling → idle_wander
```

### Movement Tick Loop

**Location:** `useHareMovement.js`, `setInterval` with 50ms tick

```js
setInterval(() => {
  const state = eatStateRef.current
  const [nx, ny] = calculateNextPos(state)

  // Clamp to unlocked areas
  const [cx, cy] = clampToUnlocked(nx, ny)

  // Update position and direction
  posRef.current = { x: cx, y: cy }
  directionRef.current = determineDirection({ x: cx, y: cy })

  // Render next frame
  updateComponent()
}, 50)
```

**Movement speeds:**
- `WALK_SPEED = 2.0` px/tick (40 px/s) — idle wandering
- `RUN_SPEED = 8.0` px/tick (160 px/s) — going to food/water/rest/study

### Frozen States

During certain animations, movement should halt completely:

```js
const isFrozen = ['eating', 'drinking', 'resting', 'study', 'study_pause', 'leveling', 'dead'].includes(eatState)

if (isFrozen) {
  // No movement allowed; don't update position
  return
}
```

### Fence Clamping

When the hare tries to move into a locked area:

```js
function clampToUnlocked(nx, ny, currentPos, unlockedAreas) {
  const targetArea = getAreaAtPoint(nx, ny)

  if (unlockedAreas.includes(targetArea)) {
    return [nx, ny]  // Full move accepted
  }

  // Slide along fence edge
  const xArea = getAreaAtPoint(nx, currentPos.y)
  if (unlockedAreas.includes(xArea)) {
    return [nx, currentPos.y]  // X slide
  }

  const yArea = getAreaAtPoint(currentPos.x, ny)
  if (unlockedAreas.includes(yArea)) {
    return [currentPos.x, ny]  // Y slide
  }

  return [currentPos.x, currentPos.y]  // Stay put
}
```

---

## Grass Patch System (useGrassPatches.js)

### Lifecycle

```
Mount
  ↓
Spawn 1–2 patches per unlocked area (avoid collision radii)
  ↓
Visible
  ↓ (hare eats)
Hide (opacity: 0)
  ↓ (45 second timer)
Restore (opacity: 1)
  ↓ (repeat)

New area unlocked
  ↓
Spawn additional patches in new area
```

### Spawn Algorithm

```js
function spawnGrass(areaId, count) {
  const candidates = []

  for (let i = 0; i < 100; i++) {  // Try 100 random points
    const [x, y] = randomPointInArea(areaId)

    // Check no collision with existing props
    const collides = WORLD_PROPS.some(p =>
      distance([x, y], [p.x + p.displayW/2, p.y + p.displayH/2]) < p.collisionR
    )

    if (!collides) {
      candidates.push([x, y])
    }

    if (candidates.length >= count) break
  }

  return candidates
}
```

---

## Night Mode System

### Time Check

```js
function getPSTHour() {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  ).getHours()
}

function checkIsNight() {
  const h = getPSTHour()
  return h >= 16 || h < 3  // 4 PM to 3 AM
}
```

### Night Rendering

**In Pet.jsx:**

```js
{isNight && <div className="night-overlay" />}

{isNight && WORLD_PROPS.filter(p => p.emitsLight).map(p => {
  const r = p.glowRadius ?? 80
  const gy = p.glowOffsetY ?? 0.5
  const cx = p.x + p.displayW / 2
  const cy = p.y + p.displayH * gy

  return (
    <div
      className={`light-glow${p.glowCssClass ? ` ${p.glowCssClass}` : ''}`}
      style={{
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        zIndex: Z_GLOW,
      }}
    />
  )
})}
```

---

## Level-Up System

### Experience Accumulation

Game.jsx simulation loop adds XP each second:

```js
exp: prev.exp + (EXP_PER_SECOND * expModifier)
```

Modifiers:
- Base: 1 point/s
- During study: 1.5× (1.5 points/s)
- After completing study session: +10 bonus points

### Level Progression

```js
const expPerLevel = 100  // Configurable
const level = Math.floor(exp / expPerLevel) + 1
const expInLevel = exp % expPerLevel
const expPct = (expInLevel / expPerLevel) * 100
```

### Level-Up Animation

Triggered when level increases:

```js
useEffect(() => {
  if (newLevel > previousLevel) {
    setIsLevelingUp(true)
    setTimeout(() => setIsLevelingUp(false), 2000)  // 2 second animation
  }
}, [level])
```

During levelup:
- `eatState = 'leveling'` (hare stays in idle pose)
- CSS applies `hare-state-rest hare-levelup` classes
- Flash animation plays over idle animation
- Popup displays new level + XP bar

---

## Area Unlocking

### Area Access Logic

```js
useEffect(() => {
  const newUnlocked = [0]  // Always unlock BL (area 0)

  if (level >= 2) newUnlocked.push(1, 3)       // Bottom row + ML
  if (level >= 4) newUnlocked.push(2, 4, 5)    // BR + Middle row
  if (level >= 6) newUnlocked.push(6, 7, 8)    // Top row

  setUnlockedAreas(newUnlocked)
}, [level])
```

### Accessibility Check

Before any movement to a target:

```js
const isAccessible = (prop, unlockedAreas) => {
  return unlockedAreas.includes(getAreaAtPoint(prop.x, prop.y))
}
```

Grass patches spawn only in unlocked areas. Interactive props (trees, water) are filtered by accessibility before the hare targets them.

---

## Ghost Bud Feature

### Activation

Toggle in sidebar → `ghostBudActive` state in Game.jsx → passed to Pet.jsx.

### Rendering

**In Pet.jsx:**

```js
{ghostBudActive && (
  <div
    className={`hare-walker hare-ghost ${hareClass}`}
    style={{
      left: ghostPos.x,      // Main hare x + offset
      top: ghostPos.y,       // Main hare y + offset
      zIndex: hareZ - 1,     // Behind main hare
      '--sprite-url': `url(${spriteUrl})`,
      '--dir-offset': `${dirOffset}px`,
    }}
  />
)}
```

### Styling (Pet.css)

```css
.hare-ghost {
  opacity: 0.52;
  filter: brightness(1.8) saturate(0.1) invert(0.08) sepia(0.4) hue-rotate(160deg);
}
```

The ghost mirrors the main hare's sprite, animation state, and position offset, but with a white-tinted translucent look.

---

## Z-Index Depth Sorting

The world uses depth sorting to create 3D illusion:

```
0       Ground tiles
2       Path tiles
3       Decor (shadows, grass tufts)
8       Grass patches (food)
~10–798 Props + Hare (z = Z_BASE + round(footY))
798     V-fences
818     Night overlay
820     Light glows
```

**Foot-position formula:** `z = Z_BASE + Math.round(petPos.y + HARE_PX)`

Objects lower on screen (higher y-position) appear in front of objects higher on screen. This naturally creates proper visual layering without explicit sorting per frame.

---

## Performance Considerations

- **Movement loop:** 50ms tick (20 FPS movement updates) separate from React render cycle.
- **Position tracking:** Uses refs to avoid re-rendering on every movement tick.
- **Stat simulation:** 1-second intervals for stat decay; coarse enough to avoid flickering.
- **Night polling:** Checks time every 60 seconds, not every render.
- **Prop filtering:** Done once per interaction trigger, not per frame.
- **Grass spawning:** Only on mount and area unlock (infrequent).
- **CSS animations:** Hardware-accelerated sprite animations; no JavaScript per-frame overhead.
