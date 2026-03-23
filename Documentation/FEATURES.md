# Features Guide

## Pet Care System

Your virtual hare has four primary stats that fluctuate over time:

- **Hunger** (0–100): Decreases as the pet plays and studies. Restored by eating grass patches.
- **Thirst** (0–100): Decreases over time. Restored by drinking from the water area.
- **Energy** (0–100): Decreases during study sessions and active play. Restored by resting in sheltered spots.
- **Happiness** (0–100): Increases through interactions (feeding, studying together, reaching milestones). Affected by neglect.

### Mood System

The hare's mood is derived from the average of all four stats:
- **Happy** (≥80): Walks with a spring in their step.
- **Neutral** (50–79): Normal behavior.
- **Sad** (25–49): Slower movement, less engaged.
- **Critical** (<25): The hare will seek out a tree and rest (dying-walk state) until stats recover.

---

## Core Interactions

### 1. Feeding (Interactive Grass Patches)

**How it works:**
- 1–2 grass patches spawn randomly in each unlocked area.
- Click the "Feed" button in the sidebar or double-click a patch.
- The hare walks to the nearest grass patch and eats (4-second animation).
- Once consumed, the patch disappears and reappears after 45 seconds.

**Visual feedback:**
- Hare sprite switches to eating animation (smaller sprite, 4 frames, 4 seconds total).
- Hunger stat increases by ~25 points.

### 2. Watering

**How it works:**
- Click the "Water" button to send the hare to the water trough area.
- The hare runs to the nearest unlocked water interactive prop.
- Drinks for 4 seconds (drinking animation).
- Thirst stat fully restores.

**Visual feedback:**
- Hare sprite switches to drinking animation (4 frames, 4 seconds).

### 3. Resting

**How it works:**
- Click the "Rest" button to send the hare to a shelter.
- The hare runs to the nearest rest interactive prop (currently trees with shelters).
- Rests for 5 seconds (idle pose with slight bobbing).
- Energy increases significantly.

**Visual feedback:**
- Hare sprite switches to resting animation (4 frames, 1.2-second loop, 5 seconds total rest).

### 4. Studying (Pomodoro Integration)

**How it works:**
- Use the Pomodoro timer widget to start a 25-minute work session.
- When you click ▶ **Start**, the hare walks to the nearest unlocked tree and enters study mode.
- The hare displays the reading sprite, alternating between two focused reading poses every 6 seconds.
- Click ⏸ **Pause**: The hare switches to a closed-book pose (row 1 of the reading sprite) and awaits your resume.
- Click ▶ **Resume**: The hare returns to the active reading loop (rows 3 & 4).
- Click 🔄 **Reset** or let the timer finish: The hare returns to idle and you earn bonus happiness + experience.
- After a work session, a 5-minute break timer starts (hare continues wandering freely).

**Timing:**
- Active study: Each row displays for 6 seconds (alternating rows 3 ↔ 4).
- Reading frames: 6 frames per row, cycling every 6 seconds.
- Frame rate: ~1 frame per second.

**Mood impact:**
- Studying **increases happiness** and **decreases energy**.
- Completing a full 25-minute session grants **bonus stats and XP** (level progression).

---

## Level System

### Experience & Leveling

- Each action (feeding, watering, resting, completing study sessions) grants experience points.
- Complete study sessions grant **bonus XP** (~10 points) compared to basic interactions.
- When you accumulate enough XP, the hare levels up.

**Level-up animation:**
- The hare flashes with a golden glow while staying in idle pose.
- A popup appears above the hare showing: ⭐ Level N, current XP / required XP.
- Duration: ~2 seconds of visual feedback.

### Experience Formula

- Base XP per interaction: 10–15 points depending on action type.
- Bonus XP for completing a 25-min study session: +10 points.
- XP per level: Configurable (default 100 points).

---

## Abilities & Special Features

### Ghost Bud

When unlocked, a translucent white-tinted copy of the hare follows 90px to the right and 10px above.

**Activation:**
- Unlocked when reaching a certain level (configurable).
- Toggle on/off via the sidebar "Ghost Bud" checkbox.

**Purpose:**
- Cosmetic companion; mirrors all hare movements and animations.
- Adds visual depth and personality to the pet.

---

## World & Area System

### The 3×3 World Grid

The world is divided into 9 areas arranged in a 3×3 grid:

```
TL(6)  TM(7)  TR(8)    ← Top row
ML(3)  MM(4)  MR(5)    ← Middle row
BL(0)  BM(1)  BR(2)    ← Bottom row (hare spawns in BL)
```

Each area is 7 tiles wide × 4 tiles tall (448×256 pixels).

### Area Unlocking

- The hare starts with only the **Bottom-Left (BL, area 0)** unlocked.
- As you progress (accumulate XP/level up), new areas unlock automatically.
- Unlocked areas are indicated by the absence of fences.
- The hare cannot move into locked areas (fences block movement at edges).

### Paths & Navigation

An L-shaped dirt path connects areas TL → TM → MM → MR, making traversal intuitive. The path consists of 4 tile types:
- **Horizontal**: Ground_path_41
- **Vertical**: Ground_path_38
- **Corner L→D**: Ground_path_30 (left to down)
- **Corner D→R**: Ground_path_34 (down to right)

---

## Interactive Props in the World

### Trees (Rest & Study)

- **Interactive type:** `rest`
- **Count:** Multiple trees scattered across TL, TM, ML, MM, MR areas.
- **Function:** When the hare uses the "Rest" button or starts a study session, it targets the nearest accessible tree.
- **Visual:** Tall sprites with depth-sorted shadow.

### Water Trough / Water Source

- **Interactive type:** `water`
- **Location:** Typically in the MR (Middle-Right) area.
- **Function:** Target for the "Water" button.
- **Visual:** Detailed prop with glow effect at night.

### Campfire

- **Interactive type:** None (decorative).
- **Location:** Visible in certain areas.
- **Function:** Provides a warm glow at night (emits light with radial-gradient CSS animation).
- **Visual:** Animated 6-frame sprite with flickering effect.

### Decorative Elements

- **Grass tufts & flowers:** Non-interactive, add ambiance.
- **Shadows:** Beneath taller props for depth perception.

---

## Night & Day Cycle

The world transitions between day and night based on **Pacific Standard Time (PST)**:

- **Night:** 16:00 (4 PM) to 03:00 (3 AM).
- **Day:** 03:00 (3 AM) to 16:00 (4 PM).

### Night Features

- Entire scene darkens with an overlay (background: `rgba(10, 20, 60, 0.55)`).
- Light sources (campfire, water trough) emit warm glows (z-index above overlay).
- Hare's sprite brightness/saturation may be adjusted to match atmosphere.
- Glows use `mix-blend-mode: screen` for realistic light blending.

---

## Grass Patch Mechanics

### Spawning & Visibility

- When an area unlocks, 1–2 grass patches are automatically added.
- Patches appear at random positions, avoiding collision radii of existing props.
- Each patch is a small SVG (58×58 px) with a subtle hover effect.

### Consumption & Replenishment

- When the hare eats a patch, it becomes invisible immediately.
- After 45 seconds, the patch reappears (visual transition with opacity).
- Multiple patches can exist in the same area; the hare targets the nearest.

---

## Session Management

### Starting a Game

1. Enter your name in the sidebar.
2. Click "Start Game" — the hare spawns in the bottom-left area.
3. All stats begin at 50 (neutral).

### Pausing

- Click the "⏸ Pause" button to halt all movement and animations.
- The hare freezes in place; timers continue internally.
- Click "▶ Resume" to continue from where you left off.

### Resetting

- Click "🔄 Reset Game" to return to the initial state.
- All stats reset to 50, level resets to 1, and the hare returns to the spawn point.
- Only unlocked areas persist (re-locking happens on hard reset if implemented).

---

## Sidebar Controls

The right sidebar displays:

- **Pet stats:** Hunger, Thirst, Energy, Happiness (as progress bars).
- **Action buttons:** Feed, Water, Rest (trigger immediate hare behaviors).
- **Pomodoro timer:** 25-min work / 5-min break display and controls.
- **Ghost Bud toggle:** Enable/disable the companion feature.
- **Game controls:** Start, Pause, Reset buttons.
- **Pet info:** Name, current level, XP progress.

---

## Stat Decay Over Time

Stats decrease on different schedules:

- **Hunger:** Decreases while the hare moves or studies (~1 point per 10 seconds of activity).
- **Thirst:** Decreases slowly over time (~1 point per 30 seconds).
- **Energy:** Decreases during study sessions and active running (~1 point per 5 seconds during study).
- **Happiness:** Decreases if stats drop too low or the hare is idle for extended periods.

The exact decay rates are configurable in `Game.jsx` via the simulation loop.

---

## Tips for Engagement

1. **Balance care:** Rotate between feeding, watering, and resting to keep all stats high.
2. **Study regularly:** Complete Pomodoro sessions for bonus XP and happiness boosts.
3. **Explore:** Unlock new areas by leveling up to discover new props and resting spots.
4. **Watch the mood:** A happy hare (avg stat ≥80) animates more cheerfully and engages more readily with interactions.
5. **Study at night:** Schedule study sessions to see the campfire and water trough glows in action.
