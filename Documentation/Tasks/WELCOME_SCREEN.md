# Task: Welcome Screen

First-time login popup introducing Bubby, Harold, Robin, and Rompy.

---

## Overview

When a user logs in for the first time (or after a long absence), a modal popup appears showing all four characters together before the main game loads. Characters introduce themselves with a short line of dialogue, then the user taps "Let's go!" to enter the world.

---

## Blockers

- **Rompy sprite** — Varun to provide. Drop in `src/assets/` and share the filename.

---

## Approach Options

**Option A — CSS sprite scene (recommended):**
- Use existing sprite sheets for Bubby, Harold, Robin
- Animate each character in CSS (Bubby sits, Harold hops, Robin flutters on a perch)
- No new assets required except Rompy
- Stays consistent with pixel art style

**Option B — AI-generated illustration:**
- Crop 1 frame from each sprite → feed to Gemini/Midjourney with cozy pixel art group scene prompt
- Result saved as `welcome_screen.png` and used as a static image
- Less work but less interactive

---

## Implementation Notes

- Trigger: show on first login (store `welcomeSeen` flag in Firestore or localStorage)
- Component: `WelcomeModal.jsx` — overlays full screen, above all game layers (z-index > 820)
- Each character gets a name label and 1 line of dialogue
- "Let's go!" button dismisses modal and starts the game
- Robin perches on Harold's head or a branch prop in the scene
- Rompy lumbers in from the right side after the others are visible
