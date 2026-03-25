# Animation Guide

This guide explains how sprite sheets are structured, CSS animations work, and how state transitions control what the player sees on screen.

> **Note:** 'Rompy' is reserved for the upcoming elephant NPC companion. The hare character is named **Harold**.

---

## Bubby (Tuxedo Cat) Animations

Bubby uses horizontal-only sprite sheets (one direction per file) at 56×56 native frames, rendered at `BUBBY_PX = 140px` (scale ≈ 2.5×). The CSS class is swapped by `catSpecialAnim` state in Pet.jsx.

| Animation | File | Frames | Sheet W (native) | CSS Class | Trigger |
|-----------|------|--------|-----------------|-----------|---------|
| Walk east | `cat_walk_east.png` | 8 | 448px | `bubby-walk` | idle wander, east |
| Walk west | `cat_walk_west.png` | 8 | 448px | `bubby-walk` | idle wander, west |
| Run east | `cat_run_east.png` | 6 | 336px | `bubby-run` | going to food/water/play |
| Run west | `cat_run_west.png` | 6 | 336px | `bubby-run` | going |
| Eat | `cat_eat_*.png` | 7 | 392px | `bubby-eat` | eating grass |
| Drink | `cat_drink_south.png` | 6 | 336px | `bubby-drink` | drinking at well |
| Sit | `cat_sit_*.png` | 8 | 448px | `bubby-sit` | idle sit |
| Lick | `cat_lick_south.png` | 12 | 672px | `bubby-lick` | random idle (50%) |
| Yawn | `cat_yawn_south.png` | 11 | 616px | `bubby-yawn` | random idle (30%) |
| Ear-scratch | `cat_idle.png` | 8 | 640px | `bubby-scratch` | random idle (20%) — 32×80px native |
| Dumbbell Lift | `cat_stand.png` | 8 | 448px | `bubby-workout` | workout check-in, shop Lv4 |
| Happy Hop | `cat_jump_*.png` | 8 | 448px | `bubby-hop` | play/level-up, shop Lv7 |

**Idle scheduler** — fires every 12–22s when Bubby is sitting idle. Picks lick/yawn/scratch at random (50/30/20%). Durations: lick 1680ms, yawn 1540ms, scratch 880ms.

**Special note on ear-scratch** — `cat_idle.png` has 32×80px native frames (different from the 56×56 standard). Uses `SCRATCH_SCALE = BUBBY_PX / 32 = 2.5`.

---

## Blue Robin (Ambient Bird) Animations

The robin uses 56×56 native frames at 1.5× scale (84×84 displayed), managed by `BirdSpawner.jsx`.

| Animation | File | Frames | CSS Class | Speed |
|-----------|------|--------|-----------|-------|
| Fly east | `bird/bird_fly_east.png` | 9 | `bird-fly` | 1.08s steps(9) infinite |
| Fly west | `bird/bird_fly_west.png` | 9 | `bird-fly` | 1.08s steps(9) infinite |
| Perch (chest breathe) | `bird/bird_perch.png` | 5 | `bird-perch` | 6s steps(5) infinite — very slow |

The bird follows a phase machine: `appear → flying_in → perching → flying_out → (cooldown) → repeat`.

---

---

## Sprite Sheet Fundamentals

### Scale & Resolution

All hare sprites use the same scaling and frame dimensions for consistency:

- **Source frame:** 32×32 pixels (pixel-art source resolution)
- **Display scale:** 2.5× (renders as 80×80 pixels on screen)
- **Background-size adjustment:** Source width/height × 2.5 = display background-size

### Example Calculation

For a sprite sheet with 5 frames arranged horizontally:

```
Source:     160px wide (5 × 32px) × 128px tall (4 rows × 32px)
Display:    400px wide (160 × 2.5) × 320px tall (128 × 2.5)

CSS:
  width: 80px;
  height: 80px;
  background-size: 400px 320px;   /* Total sheet size at 2.5× scale */
```

---

## Direction Encoding

Hare sprite sheets use rows to encode direction:

```
Row 0: Facing DOWN
Row 1: Facing UP
Row 2: Facing LEFT
Row 3: Facing RIGHT
```

Each row is offset by one frame height (80px at 2.5× scale):

```
Direction offset (--dir-offset CSS variable):
  down:  0px      (row 0, no offset)
  up:    -80px    (row 1, one frame up)
  left:  -160px   (row 2, two frames up)
  right: -240px   (row 3, three frames up)
```

**Set dynamically in Pet.jsx:**

```js
const dirOffset = (isActionAnim || isStudyState) ? 0 : DIR_OFFSETS[direction]

<div
  style={{
    '--dir-offset': `${dirOffset}px`,
    background-position-y: 'var(--dir-offset)',
  }}
/>
```

For action animations (eating, drinking) or study states (which have their own pose rows), direction is ignored by setting `--dir-offset: 0`.

---

## The Animation System

### CSS Animation Structure

All hare animations use `steps()` function for frame-by-frame playback:

```css
.hare-state-walk {
  background-size: 400px 320px;   /* 5 frames × 4 directions */
  animation: hare-walk 0.55s steps(5) infinite;
}

@keyframes hare-walk {
  from { background-position-x: 0; }
  to   { background-position-x: -400px; }
}
```

**How it works:**
1. `steps(5)` divides the 0.55s duration into 5 discrete steps (one per frame).
2. Each frame is 80px wide (400px ÷ 5).
3. Horizontally: background slides from 0 → -400px over 0.55 seconds.
4. Vertically: background-position-y stays at `var(--dir-offset)` (updated by JavaScript).

**Frame timing:**
- Walk: 0.55s ÷ 5 frames = 0.11s per frame (~9 FPS)
- Run: 0.4s ÷ 6 frames = 0.067s per frame (~15 FPS)
- Eating: 4s ÷ 5 frames = 0.8s per frame (slow, deliberate)

### Two-Axis Animation (Study State Example)

For the reading animation, two simultaneous animations control x and y position:

```css
.hare-state-study {
  background-size: 480px 320px;   /* 6 frames × 4 rows */
  animation:
    hare-read-x 6s steps(6) infinite,
    hare-read-y 12s steps(2, end) infinite;
}

@keyframes hare-read-x {
  from { background-position-x: 0; }
  to   { background-position-x: -480px; }     /* 6 frames, 80px each */
}

@keyframes hare-read-y {
  0%   { background-position-y: -160px; }     /* Row 3 */
  50%  { background-position-y: -240px; }     /* Row 4 */
  100% { background-position-y: -160px; }     /* Back to Row 3 */
}
```

**Timing breakdown:**
- X animation: 6s ÷ 6 frames = 1s per frame (one frame every second)
- Y animation: Alternates between -160px and -240px every 6s (50% mark at 6s, 100% at 12s)
- Combined effect: Hare reads actively, alternating between two focused poses every 6 seconds

**Why two separate animations?**
- X controls frame progression (horizontal sprite cycling)
- Y controls which reading pose displays (alternating rows)
- By using separate timing, we get smooth frame cycling with periodic pose changes

---

## State-to-Sprite Mapping

**Pet.jsx** determines which sprite and animation class to apply based on `eatState`:

```js
const spriteUrl = showDead
  ? hareDeath
  : eatState === 'study' || eatState === 'study_pause' || eatState === 'going_study'
    ? hareReading
    : eatState === 'eating'
      ? hareEating
      : eatState === 'drinking'
        ? hareDrinking
        : eatState === 'resting' || eatState === 'leveling'
          ? hareIdle
          : (eatState === 'going' || eatState === 'going_water')
            ? hareRunShadow
            : hareWalkShadow

const hareClass = showDead
  ? 'hare-state-dead'
  : eatState === 'study'
    ? 'hare-state-study'
    : eatState === 'study_pause'
      ? 'hare-state-study-pause'
      : eatState === 'going_study'
        ? 'hare-state-run'
        : eatState === 'eating'
          ? 'hare-state-eat'
          : eatState === 'drinking'
            ? 'hare-state-drink'
            : eatState === 'resting'
              ? 'hare-state-rest'
              : eatState === 'leveling'
                ? 'hare-state-rest hare-levelup'
                : (eatState === 'going' || eatState === 'going_water')
                  ? 'hare-state-run'
                  : 'hare-state-walk'
```

### State Machine Diagram

```
idle_wander
  ├─ CSS: hare-state-walk (5 frames, 0.55s, directional rows)
  ├─ On feed/water/rest: → going_* state
  └─ On study: → going_study state

going_eat / going_water / going_rest / going_study
  ├─ CSS: hare-state-run (6 frames, 0.4s, directional rows)
  └─ On arrival: → action_* state

eating
  ├─ CSS: hare-state-eat (5 frames, 4s, frozen, no direction)
  └─ After 4s: → idle_wander

drinking
  ├─ CSS: hare-state-drink (4 frames, 4s, frozen, no direction)
  └─ After 4s: → idle_wander

resting
  ├─ CSS: hare-state-rest (4 frames, 1.2s loop, frozen, no direction)
  └─ After 5s: → idle_wander

study
  ├─ CSS: hare-state-study (6 frames × 2 rows, alternating, frozen, no direction)
  │        (x: 6s steps(6), y: 12s steps(2))
  └─ On pause/stop: → study_pause or idle_wander

study_pause
  ├─ CSS: hare-state-study-pause (6 frames row 1, frozen, no direction)
  └─ On resume/stop: → study or idle_wander

leveling
  ├─ CSS: hare-state-rest hare-levelup (4 frames + flash, frozen)
  └─ After 2s: → idle_wander

dead (tired)
  ├─ CSS: hare-state-dead (6 frames, 0.8s, frozen, desaturated)
  └─ After reaching tree: → resting
```

---

## CSS Animation Recipes

### Basic Frame Cycling (Walk/Run)

```css
.hare-state-walk {
  background-size: 400px 320px;      /* 5 frames × 4 rows */
  animation: hare-walk 0.55s steps(5) infinite;
}

@keyframes hare-walk {
  from { background-position-x: 0; }
  to   { background-position-x: -400px; }   /* Moves left by 5 frames */
}
```

**Calculation:**
- Total width: 160px (5 × 32px) × 2.5 = 400px
- Duration: 0.55s for 5 frames
- `steps(5)`: Move to -400px in 5 discrete steps
- `infinite`: Loop continuously

### One-Time Animation (Eating/Drinking)

```css
.hare-state-eat {
  width: 44px;
  height: 50px;
  background-size: 219px 50px;       /* Scaled eating sprite */
  animation: hare-eat 4s steps(5) 1 forwards;
}

@keyframes hare-eat {
  from { background-position-x: 0; }
  to   { background-position-x: -219px; }
}
```

**Key differences:**
- `steps(5) 1 forwards`: Play once, freeze on last frame
- `4s`: Total duration for the action
- Smaller sprite dimensions (44×50px instead of 80×80px)

### Dual-Axis Animation (Study)

```css
.hare-state-study {
  background-size: 480px 320px;
  animation:
    hare-read-x 6s steps(6) infinite,
    hare-read-y 12s steps(2, end) infinite;
}

@keyframes hare-read-x {
  from { background-position-x: 0; }
  to   { background-position-x: -480px; }
}

@keyframes hare-read-y {
  0%   { background-position-y: -160px; }
  50%  { background-position-y: -240px; }
  100% { background-position-y: -160px; }
}
```

**Advanced aspects:**
- Two animations run simultaneously on different schedules
- X animation: 6s ÷ 6 frames = 1s per frame
- Y animation: 12s total, 50% mark at 6s (alternates rows every 6s)
- `steps(2, end)`: Two discrete positions (two rows), stepping at the end of each 6s interval
- Creates a reading loop: actively reading (rows 3 & 4 alternating) for 6 seconds per row

### Flashy Effect (Level-Up)

```css
.hare-levelup {
  animation:
    hare-rest 1.2s steps(4) infinite,
    levelup-flash 0.3s ease-in-out infinite alternate !important;
}

@keyframes levelup-flash {
  from {
    filter: brightness(1.0) saturate(1.0);
    transform: scale(1.0);
  }
  to {
    filter: brightness(2.2) saturate(2.0) sepia(0.3) hue-rotate(-20deg);
    transform: scale(1.08);
  }
}
```

**Techniques:**
- Two animations layered: base walk + flash effect
- `!important`: Override the base animation's timing
- `brightness(2.2)`: Bright glow
- `saturate(2.0)`: Exaggerated colors
- `sepia(0.3) hue-rotate(-20deg)`: Golden tint
- `scale(1.08)`: Subtle growth effect
- `ease-in-out alternate`: Smooth pulsing (not stepped)

---

## Sprite Asset Specifications

### Walking Sprite (Hare_Walk_with_shadow.png)

- **Dimensions:** 160×128 px
- **Layout:** 5 frames × 4 rows (down, up, left, right)
- **Frame size:** 32×32 px
- **Display:** 80×80 px (2.5× scale)
- **Background-size:** 400px × 320px
- **Animation:** 0.55s, steps(5), infinite

### Running Sprite (Hare_Run_with_shadow.png)

- **Dimensions:** 192×128 px
- **Layout:** 6 frames × 4 rows
- **Frame size:** 32×32 px
- **Display:** 80×80 px
- **Background-size:** 480px × 320px
- **Animation:** 0.4s, steps(6), infinite

### Eating Sprite (Hare_Eating.png)

- **Dimensions:** 351×80 px
- **Layout:** 5 frames (no directional rows)
- **Frame size:** ~70×80 px (portrait, larger)
- **Display:** 44×50 px (scaled down)
- **Background-size:** 219px × 50px
- **Animation:** 4s, steps(5), 1 forwards

### Drinking Sprite (Hare_Drinking.png)

- **Dimensions:** 416×80 px
- **Layout:** 4 frames
- **Frame size:** 104×80 px
- **Display:** 65×50 px
- **Background-size:** 260px × 50px
- **Animation:** 4s, steps(4), 1 forwards

### Idle Sprite (Hare_Idle.png)

- **Dimensions:** 128×128 px
- **Layout:** 4 frames (no directional rows)
- **Frame size:** 32×32 px
- **Display:** 80×80 px
- **Background-size:** 320px × 320px
- **Animation:** 1.2s, steps(4), infinite

### Death Sprite (Hare_Death.png)

- **Dimensions:** 192×128 px
- **Layout:** 6 frames × 4 rows
- **Frame size:** 32×32 px
- **Display:** 80×80 px
- **Background-size:** 480px × 320px
- **Animation:** 0.8s, steps(5) 1 forwards
- **Note:** stops at -400px (5 frames) not -480px (all 6 frames) to park on last frame

### Reading Sprite (Hare_reading_with_shadow.png)

- **Dimensions:** 1024×682 px
- **Layout:** 6 frames × 4 rows (~170×170 px per source frame)
- **Frame size:** ~170×170 px (source)
- **Display:** 80×80 px (scaled down from ~170)
- **Background-size:** 480px × 320px

**Row usage:**
```
Row 1 (y=0):     study_pause — book closed (paused reading)
Row 2 (y=-80px): unused
Row 3 (y=-160px): study loop A — actively reading
Row 4 (y=-240px): study loop B — actively reading
```

**Animation:**
- X: 6s, steps(6), infinite (frames cycle)
- Y: 12s, steps(2, end), infinite (rows alternate: 3→4→3 every 6s)

---

## Performance & Optimization

### Hardware Acceleration

CSS animations are GPU-accelerated when using properties like:
- `background-position` (yes, hardware-accelerated in most browsers)
- `transform` (always accelerated)
- `opacity` (always accelerated)

**Current approach:** Background-position changes trigger repaints but not full layout recalculations. Acceptable for 60 FPS display.

### Avoid Expensive Properties

Do NOT animate these in loops (used `filter` sparingly):
- `width` / `height` (triggers layout recalculation)
- `left` / `top` (triggers layout; use `transform` instead)
- `display` (triggers layout; use `visibility` or `opacity`)

**Hare sprite positioning:** Uses `left` / `top` via JavaScript in Pet.jsx, updated every 50ms in the movement loop. Acceptable because the number of elements is small (just 1-2 sprites).

### Motion Update Frequency

- **CSS animations:** 60 FPS (browser's render cycle)
- **Hare position updates:** 50ms interval (20 FPS) via JavaScript
- **Stat decay:** 1000ms interval (1 second)

This mixed approach balances smoothness with performance:
- Animation frames are smooth (CSS handles interpolation)
- Position updates are frequent enough for smooth visual motion
- Stats don't need frequent updates (player perception is slower)

---

## Timing Synchronization

### Study Session: Coordinating X and Y Animations

Problem: How do we ensure rows alternate every 6 seconds while frames cycle?

Solution: Two separate animations with carefully chosen durations:

```
hare-read-x: 6s, steps(6) → Each frame lasts 1 second
              Frame 0 (0.0s)  Frame 1 (1.0s)  Frame 2 (2.0s) ... Frame 5 (5.0s)

hare-read-y: 12s, steps(2, end) → Switch at 50% (6s) and 100% (12s)
              Row 3 (0–6s)  Row 4 (6–12s)  Row 3 (12–18s, loops)
```

By setting the Y animation to exactly 2× the X duration, rows alternate at every cycle boundary.

### Frame Timing for Visual Smoothness

Walk animation: 0.55s ÷ 5 frames = 110ms per frame
- Feels natural for casual wandering

Run animation: 0.4s ÷ 6 frames = 67ms per frame
- Faster, more energetic for chasing food

Eat animation: 4s ÷ 5 frames = 800ms per frame
- Slow, deliberate eating motions

---

## Debugging Animations

### Check Sprite Sheet Alignment

In DevTools, inspect the hare element:

```
Computed styles should show:
  background-image: url(...)
  background-position-x: -0px, -80px, -160px, etc. (looping)
  background-position-y: 0px (or --dir-offset)
  background-size: 400px 320px
```

### Verify Frame Rate

Chrome DevTools → Performance tab:
1. Record while hare animates
2. Look for frame timing (should be ~16.67ms per frame at 60 FPS)
3. If animations stutter, check for simultaneous expensive operations

### Test Direction Offsets

In browser console, manually verify direction offset calculation:

```js
const DIR_OFFSETS = { down: 0, up: -80, left: -160, right: -240 }
// direction should match the visible row (down = row 0, etc.)
```

### Inspect CSS Keyframes

DevTools → Elements → Styles:
1. Find the animation rule (e.g., `hare-walk`)
2. Verify `from` and `to` values (should span total sprite width)
3. Check `steps()` value matches frame count

---

## Adding a New Animation

**Step-by-step:**

1. **Create sprite sheet** (32×32 px source frames at any scale, import at 2.5× display scale)
2. **Calculate background-size**: (frames × 32 × 2.5) px wide, (rows × 32 × 2.5) px tall
3. **Add import to Pet.jsx**: `import hareNewState from '../assets/sprites/...'`
4. **Add sprite selection in Pet.jsx**: Map `eatState === 'new_state'` to the sprite URL
5. **Add CSS class in Pet.jsx**: Map to new CSS class name
6. **Add CSS animation in Pet.css**:
   ```css
   .hare-state-new {
     background-size: XXXpx YYYpx;
     animation: hare-new-anim Xs steps(N) [infinite|1 forwards];
   }
   @keyframes hare-new-anim {
     from { background-position-x: 0; }
     to { background-position-x: -XXXpx; }
   }
   ```
7. **Test**: Verify sprite appears, frames cycle, looping/duration match expectations

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Sprite appears stretched | background-size mismatch | Verify formula: (width × 2.5) × (height × 2.5) |
| Animation stutters | Expensive simultaneous JS | Reduce background-position update frequency |
| Direction rows incorrect | --dir-offset value wrong | Double-check DIR_OFFSETS mapping |
| Animation doesn't loop | Missing `infinite` or steps value too high | Add `infinite`, verify `steps(frameCount)` |
| Eating/drinking doesn't end | Missing `1 forwards` | Add animation duration rule: `animation: ... 1 forwards` |
| Study rows don't alternate | Y animation duration wrong | Ensure Y duration = 2× X duration for proper sync |
| Glow effect too faint | Gradient stops not optimized | Increase inner % value (e.g., 0.75 instead of 0.40) |
| Reading sprite glitchy | Frame size miscalculation | Recalculate with actual sprite dimensions |
