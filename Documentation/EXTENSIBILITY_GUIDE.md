# Extensibility Guide

This guide provides step-by-step recipes for extending the Virtual Pet system with new features, interactions, props, and animations.

---

## Recipe 1: Adding a New Interaction Type

An *interaction* is something the hare walks to and performs an animation at (like eating, drinking, resting, or studying).

### Example: Adding "Play" Interaction

**Step 1: Add the prop to `worldData.js`**

Import the sprite and add a WORLD_PROPS entry:

```js
import playBallImg from '../assets/sprites/play_ball.png'

export const PROP_SRCS = {
  // ... existing entries
  play_ball: playBallImg,
}

export const WORLD_PROPS = [
  // ... existing entries
  {
    id: 'play_ball_1',
    type: 'play_ball',
    areaId: 4,                        // MM area
    x: 650, y: 300,
    displayW: 60, displayH: 60,
    collisionR: 30,
    interactive: true,
    interactType: 'play',             // NEW: Custom interaction type
  },
]
```

**Step 2: Add a trigger prop to `Pet.jsx`**

```js
export default function Pet({
  // ... existing props
  playTrigger = 0,                    // NEW: Trigger counter
}) {
  // Pass to useHareMovement:
  const { petPos, direction, eatState, arrivedAtTree } = useHareMovement({
    // ... existing params
    playTrigger,                      // NEW
    // ... other params
  })
```

**Step 3: Update `useHareMovement.js`**

In the function signature, add the new trigger:

```js
export function useHareMovement({
  // ... existing params
  playTrigger = 0,                    // NEW
  // ... rest of params
}) {
```

Add a `useEffect` for the trigger:

```js
useEffect(() => {
  if (playTrigger > playTriggerRef.current) {
    playTriggerRef.current = playTrigger
    const targetProps = WORLD_PROPS.filter(
      p => p.interactType === 'play' && isAccessible(p)
    )
    if (targetProps.length > 0) {
      const target = nearestProp(targetProps, petPos)
      eatStateRef.current = 'going_play'
      updateDirection(target)
    }
  }
}, [playTrigger])
```

Add 'going_play' to the frozen-state guard (so movement doesn't interrupt mid-animation):

```js
const isFrozen = ['going_eat', 'going_water', 'going_rest', 'going_play', ...].includes(eatState)
```

Add the run branch for 'going_play':

```js
if (eatState === 'going_play') {
  const target = findNearestInteractive('play', unlockedAreas)
  if (distanceToTarget(petPos, target) < COLLISION_THRESHOLD) {
    eatStateRef.current = 'playing'  // Switch to animation state
  } else {
    // Continue walking
    const [nx, ny] = moveToward(petPos, target, WALK_SPEED)
    // ... clamp and apply
  }
}
```

Add the idle wander option for 'playing' state:

```js
if (eatState === 'playing') {
  // Animation plays for 4 seconds, then returns to idle
  // (This is handled by a separate timeout in the component)
} else if (eatState === 'idle_wander') {
  // ... existing wander logic
}
```

**Step 4: Add sprite mapping in `Pet.jsx`**

In the sprite selection section:

```js
const spriteUrl = showDead
  ? hareDeath
  : eatState === 'playing'
    ? harePlayingSprite  // NEW
    : // ... rest of conditions

const hareClass = showDead
  ? 'hare-state-dead'
  : eatState === 'playing'
    ? 'hare-state-play'  // NEW
    : // ... rest of conditions
```

**Step 5: Add CSS animation in `Pet.css`**

```css
.hare-state-play {
  width: 50px;
  height: 60px;
  background-size: 250px 60px;
  animation: hare-play 4s steps(5) 1 forwards;
}

@keyframes hare-play {
  from { background-position-x: 0; }
  to { background-position-x: -250px; }
}
```

**Step 6: Wire the trigger in `Game.jsx`**

Add trigger state:

```js
const [playTrigger, setPlayTrigger] = useState(0)

// Handler:
const handlePlay = () => setPlayTrigger(prev => prev + 1)
```

Pass to Pet and wire a button:

```js
<Pet
  // ... other props
  playTrigger={playTrigger}
/>

<button onClick={handlePlay}>Play</button>
```

---

## Recipe 2: Adding a New World Prop

Props are static or animated objects in the world (trees, water troughs, bushes, lights, etc.).

### Example: Adding a Bush

**Step 1: Prepare the sprite**

Place your sprite file in `src/assets/sprites/` or `src/assets/props/`.

**Step 2: Add to `worldData.js`**

```js
import bushImg from '../assets/props/bush_1.png'

export const PROP_SRCS = {
  // ... existing
  bush: bushImg,
}

export const WORLD_PROPS = [
  // ... existing
  {
    id: 'bush_2',
    type: 'bush',
    areaId: 3,                        // ML area
    x: 250, y: 150,
    displayW: 80, displayH: 100,
    collisionR: 40,                   // Hare must stay 40px away
    interactive: false,               // Just decoration
    isDecor: true,                    // Fixed z-index = 3
  },
]
```

**Step 3: No other changes needed!**

`WorldProps.jsx` automatically renders all entries from `WORLD_PROPS` and handles z-index, collision detection, and interactive routing.

---

## Recipe 3: Adding an Animated Prop

Use when a prop has multiple frames that cycle (like the campfire).

### Example: Flower Bloom Animation

**Step 1: Create sprite with multiple frames**

Source frames: 32×32 px, arranged horizontally (4 frames = 128×32 total).

**Step 2: Add to `worldData.js`**

```js
import flowerImg from '../assets/props/flower_bloom.png'

export const PROP_SRCS = {
  flower: flowerImg,
}

export const WORLD_PROPS = [
  {
    id: 'flower_1',
    type: 'flower',
    areaId: 7,                        // TM area
    x: 500, y: 200,
    displayW: 80, displayH: 80,       // Displayed at 2.5× scale
    collisionR: 0,                    // Decoration only
    animated: true,                   // NEW: This is animated
    animClass: 'flower-bloom',        // NEW: CSS class to apply
  },
]
```

**Step 3: Add CSS animation in `Pet.css`**

```css
.flower-bloom {
  background-size: 320px 80px;        /* 128 × 2.5 = 320 wide, 32 × 2.5 = 80 tall */
  image-rendering: pixelated;
  animation: flower-bloom 2s steps(4) infinite;
}

@keyframes flower-bloom {
  from { background-position-x: 0; }
  to { background-position-x: -320px; }
}
```

The component automatically applies the class via `WorldProps.jsx`:

```js
animated && animClass && className={animClass}
```

---

## Recipe 4: Adding a Light Source (Night Glow)

Light sources glow at night and emit a radial light effect.

### Example: Adding a Lantern Prop

**Step 1: Add the prop to `worldData.js`**

```js
import lanternImg from '../assets/props/lantern.png'

export const WORLD_PROPS = [
  {
    id: 'lantern_1',
    type: 'lantern',
    areaId: 5,
    x: 300, y: 250,
    displayW: 40, displayH: 60,
    collisionR: 0,
    emitsLight: true,                 // NEW: Enables glow rendering
    glowRadius: 100,                  // NEW: Glow circle radius in px
    glowOffsetY: 0.3,                 // NEW: Vertical position (0=top, 1=bottom)
    glowCssClass: 'lantern-glow',     // NEW: Custom CSS class for glow style
  },
]
```

**Step 2: Add CSS for the glow in `Pet.css`**

`Pet.jsx` renders glows with `mix-blend-mode: screen`, which blends them with the dark night overlay:

```css
.lantern-glow {
  background: radial-gradient(
    circle,
    rgba(255, 255, 200, 0.75) 0%,      /* bright yellow-white core */
    rgba(255, 200, 100, 0.40) 40%,
    rgba(255, 150, 50, 0.15) 65%,
    transparent 85%
  );
  /* mix-blend-mode: screen is set on .light-glow (parent) */
}
```

**Step 3: Optional — Add flicker animation**

```css
.lantern-glow {
  background: radial-gradient(
    circle,
    rgba(255, 255, 200, 0.75) 0%,
    rgba(255, 200, 100, 0.40) 40%,
    rgba(255, 150, 50, 0.15) 65%,
    transparent 85%
  );
  animation: lantern-flicker 0.2s ease-in-out infinite alternate;
}

@keyframes lantern-flicker {
  from { opacity: 0.8; transform: scale(0.95); }
  to { opacity: 1.0; transform: scale(1.05); }
}
```

The glow automatically renders in `Pet.jsx`:

```js
{isNight && WORLD_PROPS.filter(p => p.emitsLight).map(p => {
  const r = p.glowRadius ?? 80
  const gy = p.glowOffsetY ?? 0.5
  // ... render glow div with glowCssClass applied
})}
```

---

## Recipe 5: Adding a New Sprite Animation State

Use when you want the hare to display a completely new sprite and animation (like sleeping or dancing).

### Example: Adding a "Sleeping" State

**Step 1: Prepare the sprite**

Sprite sheet: 4 frames × 32×32 px (128×32 total), displayed at 80×80 px (2.5× scale).

**Step 2: Import in `Pet.jsx`**

```js
import hareSleeping from '../assets/sprites/Hare_Sleeping.png'
```

**Step 3: Add sprite selection logic in `Pet.jsx`**

```js
const spriteUrl = showDead
  ? hareDeath
  : eatState === 'sleeping'
    ? hareSleeping  // NEW
    : // ... rest of conditions
```

Add to hareClass selection:

```js
const hareClass = showDead
  ? 'hare-state-dead'
  : eatState === 'sleeping'
    ? 'hare-state-sleep'  // NEW
    : // ... rest of conditions
```

**Step 4: Disable directional rows for this state (if needed)**

Add to the isActionAnim check:

```js
const isActionAnim = eatState === 'eating' || eatState === 'drinking' || eatState === 'sleeping'
```

**Step 5: Add CSS animation in `Pet.css`**

```css
.hare-state-sleep {
  background-size: 320px 320px;       /* 128 × 2.5 = 320 */
  animation: hare-sleep 1.5s steps(4) infinite;
}

@keyframes hare-sleep {
  from { background-position-x: 0; }
  to { background-position-x: -320px; }
}
```

**Step 6: Wire state transitions (if interactive)**

If sleeping is triggered by an interaction (e.g., rest button), follow **Recipe 1** to wire the trigger and state transitions. Otherwise, you can transition to 'sleeping' via an internal timer or condition in `useHareMovement.js`.

---

## Recipe 6: Adding a New Ability

Abilities are toggleable features that modify hare behavior or appearance (like Ghost Bud).

### Example: Adding "Speed Boost" Ability

**Step 1: Add checkbox to sidebar in `Game.jsx`**

```js
const [speedBoostEnabled, setSpeedBoostEnabled] = useState(false)

// In JSX:
<label>
  <input
    type="checkbox"
    checked={speedBoostEnabled}
    onChange={(e) => setSpeedBoostEnabled(e.target.checked)}
  />
  ⚡ Speed Boost
</label>
```

**Step 2: Pass to Pet component**

```js
<Pet
  // ... other props
  speedBoostEnabled={speedBoostEnabled}
/>
```

**Step 3: Update movement speed in `useHareMovement.js`**

```js
export function useHareMovement({
  // ... existing params
  speedBoostEnabled = false,          // NEW
}) {
  const speed = speedBoostEnabled ? RUN_SPEED * 1.5 : RUN_SPEED
  // Use 'speed' in movement calculations instead of hardcoded RUN_SPEED
}
```

Alternatively, pass the multiplier as a prop and apply it directly in motion calculations:

```js
const moveSpeed = speedBoostEnabled ? (WALK_SPEED * 1.3) : WALK_SPEED
const [nx, ny] = moveToward(petPos, target, moveSpeed)
```

**Step 4: Optional — Add visual effect**

Apply a CSS filter in `Pet.jsx`:

```js
const petStyle = {
  filter: speedBoostEnabled ? 'brightness(1.2)' : 'none',
}

<div
  className={`hare-walker ${hareClass}`}
  style={petStyle}
  // ... rest of style props
/>
```

---

## Recipe 7: Adding an Area

Areas are unlocked regions of the world. Add new areas by expanding the world grid or introducing new area-specific props.

### Example: Adding a "Pond" Area

**Step 1: Increase the world grid in `worldConfig.js`**

Change `AREA_COLS` and `AREA_ROWS` to expand the grid:

```js
export const AREA_COLS = 8  // Was 7
export const AREA_ROWS = 5  // Was 4
```

All derived values (SCENE_W, SCENE_H, fence positions) auto-calculate.

**Step 2: Add new area-specific props in `worldData.js`**

```js
// New pond area (areaId = 9, for example)
{
  id: 'pond_1',
  type: 'water_lily',
  areaId: 9,
  x: 700, y: 300,
  displayW: 120, displayH: 80,
  collisionR: 50,
  interactive: true,
  interactType: 'water',
}
```

**Step 3: Update area unlocking logic in `Game.jsx` (if needed)**

The area unlock system is driven by level progression. Add conditions in the effect that sets `unlockedAreas`:

```js
const newUnlocked = [0]
if (level >= 2) newUnlocked.push(1, 2, 3)
if (level >= 4) newUnlocked.push(4, 5, 6, 7)
if (level >= 6) newUnlocked.push(8, 9)  // NEW pond area
setUnlockedAreas(newUnlocked)
```

---

## Recipe 8: Adding a Stat Modification

Modify how stats decay or how interactions restore them.

### Example: Increasing Hunger Decay

**In `Game.jsx`**, find the stat update loop:

```js
useEffect(() => {
  const interval = setInterval(() => {
    setPet(prev => ({
      ...prev,
      hunger: Math.max(0, prev.hunger - 0.5),  // Change decay rate here
      thirst: Math.max(0, prev.thirst - 0.3),
      energy: Math.max(0, prev.energy - 0.2),
      happiness: Math.max(0, prev.happiness - 0.1),
    }))
  }, 1000)
  return () => clearInterval(interval)
}, [])
```

Adjust the subtracted values to change decay rates.

### Example: Changing Interaction Rewards

In the interaction handlers (e.g., `handleFeed`, `handleWater`):

```js
const handleFeed = () => {
  setPet(prev => ({
    ...prev,
    hunger: Math.min(100, prev.hunger + 40),  // Change reward here
    happiness: Math.min(100, prev.happiness + 5),
  }))
  // ... trigger animation
}
```

---

## Recipe 9: Adding a Time-Based Feature

Features that trigger based on elapsed time (e.g., random events, stat resets, events).

### Example: Random Event Every 30 Seconds

**In `Game.jsx`:**

```js
useEffect(() => {
  const eventInterval = setInterval(() => {
    const randomEvent = Math.random()
    if (randomEvent < 0.3) {
      // 30% chance: Hare gets happy
      setPet(prev => ({
        ...prev,
        happiness: Math.min(100, prev.happiness + 10),
      }))
    } else if (randomEvent < 0.6) {
      // 30% chance: Hare gets hungry
      setPet(prev => ({
        ...prev,
        hunger: Math.max(0, prev.hunger - 10),
      }))
    }
  }, 30000)  // Every 30 seconds
  return () => clearInterval(eventInterval)
}, [])
```

---

## Common Patterns & Utilities

### Pattern: Trigger Counters

Instead of directly setting state, use a counter that increments:

```js
const [feedTrigger, setFeedTrigger] = useState(0)
const handleFeed = () => setFeedTrigger(prev => prev + 1)

// In the hook, track the ref:
const feedTriggerRef = useRef(0)
useEffect(() => {
  if (feedTrigger > feedTriggerRef.current) {
    feedTriggerRef.current = feedTrigger
    // Perform action
  }
}, [feedTrigger])
```

This pattern allows multiple identical triggers to work correctly.

### Utility: Finding Nearest Interactive Prop

```js
import { getAreaAtPoint } from '../worldConfig.js'
import { WORLD_PROPS } from '../worldData.js'

function findNearestProp(interactType, unlockedAreas) {
  const candidates = WORLD_PROPS.filter(p =>
    p.interactType === interactType &&
    unlockedAreas.includes(p.areaId)
  )

  return candidates.length > 0
    ? candidates.reduce((nearest, p) => {
        const distCurrent = Math.hypot(petPos.x - p.x, petPos.y - p.y)
        const distNearest = Math.hypot(petPos.x - nearest.x, petPos.y - nearest.y)
        return distCurrent < distNearest ? p : nearest
      })
    : null
}
```

### Utility: Distance Calculation

```js
function distanceTo(pos1, pos2) {
  return Math.hypot(pos1.x - pos2.x, pos1.y - pos2.y)
}
```

### Utility: Direction Vector

```js
function directionTo(from, to) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.hypot(dx, dy)
  return dist > 0 ? { x: dx / dist, y: dy / dist } : { x: 0, y: 0 }
}
```

---

## Testing Your Changes

1. **Verify sprite imports:** Ensure all new sprite files are properly imported at the top of the component.
2. **Check CSS animations:** Open DevTools (F12) and inspect the hare sprite to confirm animation plays.
3. **Test collision:** Verify the hare can't walk through new props (collision detection uses `collisionR`).
4. **Test interactions:** Click buttons and verify the hare walks to the correct prop and animates.
5. **Check area unlocking:** Level up and confirm new areas unlock and become accessible.
6. **Night mode:** Test light glows at night (16:00–03:00 PST) to confirm glow styling is correct.

---

## Resources

- **Sprite sheet layout:** See `ANIMATION_GUIDE.md` for detailed sprite scaling and frame arrangement.
- **World dimensions:** See `WORLD_SYSTEM.md` for coordinate systems and area mapping.
- **Component hierarchy:** See `ARCHITECTURE.md` for data flow and prop drilling.
