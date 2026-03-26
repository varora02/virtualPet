# 🎨 Assets Needed

Tracking all graphics, sounds, and UI assets needed for the project.
**Owner**: Varun to source/generate. Claude to implement once received.

---

## 🖼️ Graphics

### 1. Welcome Screen — Character Scene
- **Where used**: First-time login welcome popup
- **Approach options** (pick one):
  - **A — CSS sprite scene** (no new asset): Use existing sprite sheets, animate each character in CSS. Bubby sits, Harold hops, Robin flutters, Rompy lumbers in. Zero new assets, native pixel art style. ✅ Recommended.
  - **B — AI-generated illustration**: Crop 1 frame from each sprite sheet → feed to Gemini/Midjourney with prompt for a cozy pixel art group scene. Drop result as `welcome_screen.png`.
- **Characters**: Bubby (tuxedo cat), Harold the hare, Robin bird, Rompy the elephant
- **Rompy sprite**: ⏳ Varun to add — drop in `src/assets/` and tell Claude filename
- **Status**: ⏳ Awaiting direction (CSS scene vs generated image) + Rompy sprite

### 2. Login Screen Hero
- **Where used**: `Login.jsx` — current placeholder is an old elephant SVG, being replaced with Bubby
- **Approach**: Use a cropped frame from Bubby's existing sit/idle sprite sheet — no new asset needed
- **Status**: ✅ Ready to implement (just a code change, Bubby sprites already exist)
- **Size**: ~200×200px, square-ish, transparent background
- **Status**: ⏳ Needed (current placeholder is an elephant SVG)

### 3. NPC Friends Pack — Individual NPC Portrait Cards
- **Where used**: Shop "Friends" tab when Friends Pack is implemented
- **Items needed**:
  - `npc_harold_portrait.png` — Harold the hare, friendly pose, ~100×100px
  - `npc_bird_portrait.png` — Robin bird, perched pose, ~100×100px
  - `npc_rompy_portrait.png` — Rompy the elephant, gentle giant, ~100×100px (future)
- **Style**: Small illustrated card portraits, warm palette
- **Status**: ⏳ Needed (when NPC system is built)

---

## 🔊 Sounds

### 4. Night Ambient Music — `ambient_night.mp3`
- **Where used**: `useSoundManager.js` — already has an import line commented out waiting for this file
- **Description**: Calm nighttime ambient loop — crickets, soft wind, maybe distant owl. 1–3 min loop.
- **Drop location**: `src/assets/sounds/music/ambient_night.mp3`
- **Status**: ⏳ Needed (one line uncomment to activate once file exists)

### 5. Unlock / Fanfare Sound — `unlock_area.mp3`
- **Where used**: When an area or tier is purchased in shop
- **Description**: Short, satisfying "unlock" chime or magical pop. ~1–2 seconds.
- **Drop location**: `src/assets/sounds/sfx/unlock_area.mp3`
- **Note**: May already exist — confirm file is in place
- **Status**: ✅ Check if exists

### 6. Summon Sound (Future) — `summon_friends.mp3`
- **Where used**: Bubby's "Summon" ability when all NPC friends are purchased
- **Description**: Playful whistle or magical chime that signals friends appearing
- **Drop location**: `src/assets/sounds/sfx/summon_friends.mp3`
- **Status**: ⏳ Future (when NPC summon is implemented)

---

## 🃏 UI / Misc

### 7. Area Tier Upgrade Visual Overlays (Tier 2)
- **Where used**: World areas that reach tier 2 should visually look different
- **Description**: Per the TIER_DECORATION_SPEC.md, each of the 9 areas has a planned visual upgrade. Currently props appear but areas themselves don't change background feel.
- **What's needed**: Potentially new ground tile variants or overlay textures per area for tier 2 state
- **Status**: ⏳ Design decision pending — may be achievable with existing assets + CSS

---

## ✅ Already In Place

- `ambient_day.mp3` — background music, working
- All 14 SFX files (eat, drink, coin, levelup, celebrate, rest, click, toggle, open, close, error, meow, thought, campfire)
- Harold sprite sheets (walk, run, eat, drink, study, idle, victory)
- Bubby sprite sheets (walk, run, eat, drink, sit, lick, yawn, ear-scratch, workout_lift, happy_hop)
- Robin bird sprite (perch + fly)
- World props: well, tree (sm/med/lg), campfire, lamp, rocks, house, windmill, fence
- Tileset 2: flowers, grass tufts, small stones, bushes
