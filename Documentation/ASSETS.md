# Assets

> Complete inventory of all visual and audio assets — what's wired up, what's needed.

---

## Sprites — Have (Wired Up)

### Bubby (Tuxedo Cat)
All files in `src/assets/sprites/`:
- `cat_walk_east.png`, `cat_walk_west.png` — 8 frames, 56×56 px native
- `cat_run_east.png`, `cat_run_west.png` — 6 frames
- `cat_eat_*.png` — 7 frames
- `cat_drink_south.png` — 6 frames
- `cat_sit_*.png` — 8 frames
- `cat_lick_south.png` — 12 frames
- `cat_yawn_south.png` — 11 frames
- `cat_idle.png` — 8 frames (ear-scratch; 32×80px native, different from 56×56 standard)
- `cat_stand.png` — 8 frames (dumbbell lift; shop unlock Lv4)
- `cat_jump_*.png` — 8 frames (happy hop; shop unlock Lv7)

### Harold (Hare)
All files in `src/assets/sprites/`:
- `Hare_Walk_with_shadow.png` — 5 frames × 4 rows (160×128 px)
- `Hare_Run_with_shadow.png` — 6 frames × 4 rows (192×128 px)
- `Hare_Eating.png` — 5 frames (351×80 px)
- `Hare_Drinking.png` — 4 frames (416×80 px)
- `Hare_Idle.png` — 4 frames (128×128 px)
- `Hare_Death.png` — 6 frames × 4 rows (192×128 px)
- `Hare_reading_with_shadow.png` — 6 frames × 4 rows (1024×682 px)

### Blue Robin (Bird)
In `src/assets/sprites/bird/`:
- `bird_fly_east.png` — 9 frames
- `bird_fly_west.png` — 9 frames
- `bird_perch.png` — 5 frames

---

## World Props — Have (Wired Up)

In `src/assets/` (various subdirs):
- `prop_well.png` — interactive water source (area BL)
- `prop_campfire2.png` — 6-frame animated campfire (area MM)
- `prop_lamp1.png` — lamp (areas BM and TL)
- Tree sprites: small, medium, large variants (all 9 areas + forest cluster in TR)
- Shadow sprites from `craftpix tileset2 / 2 Objects / 1 Shadow /`: shadow_2 through shadow_6
- Decor grass tufts from `craftpix tileset2 / 2 Objects / 5 Grass /`: 1.png–6.png
- Decor flowers from `craftpix tileset2 / 2 Objects / 6 Flower /`: 1.png–12.png
- Rocks and stones from `craftpix tileset2 / 2 Objects / 4 Stone /`
- Bushes from `craftpix tileset2 / 2 Objects / 9 Bush /`

### Tileset2 Assets Available (for Tier Upgrades)
All in `craftpix tileset2 / 2 Objects /`:
- `4 Stone/` — 16 variants (1.png–16.png)
- `5 Grass/` — 6 grass tufts (1.png–6.png)
- `6 Flower/` — 12 flower variants (1.png–12.png)
- `7 Decor/` — boxes (4), dirt patches (6), lamps (6), logs (4), trees (2)
- `8 Camp/` — 6 camp items (1.png–6.png)
- `9 Bush/` — 6 bush variants (1.png–6.png)

Animated (in `3 Animated Objects /`):
- `1 Flag/` — 5-frame flag animation
- `2 Campfire/` — 6-frame campfire animation

---

## Background / Scene SVGs — Have

In `src/assets/svgs/` (source drop: `VirtualPet/svgs/`):
- `background3.svg` — world scene daytime background ✅ wired
- `background2.svg` — world scene critical/night mood ✅ wired
- `grass.svg` — ground strip texture ✅ wired
- `rompy.svg` — old Harold/hare SVG (legacy name; replaced by pixel sprite sheets)
- `background1.svg` — rich wide scene ⚠️ 6.6MB — needs optimization before use

---

## Sounds — Have (Wired Up)

All sounds managed by `useSoundManager.js`.

### SFX (in `src/assets/sounds/sfx/`)
| File | Trigger |
|------|---------|
| `eat.mp3` | Feed interaction |
| `drink.mp3` | Water interaction |
| `play.mp3` | Play interaction |
| `rest.mp3` | Rest interaction |
| `coin.mp3` | Coin earned |
| `celebrate.mp3` | Study completion stretch popup |
| `levelup.mp3` | Level-up event |
| `open.mp3` | Drawer/panel opens |
| `close.mp3` | Drawer/panel closes |
| `toggle.mp3` | Toggle switches |
| `meow.mp3` | Clicking Bubby |
| `cat_purr.mp3` | After playing with Bubby |
| `campfire.mp3` | Bubby wanders near campfire |
| `unlock_area.mp3` | Area/tier purchased in shop |
| `timer_finish.mp3` | Pomodoro session completes |

### Music (in `src/assets/sounds/music/`)
| File | Usage |
|------|-------|
| `ambient_day.mp3` | Background music, toggle with 🔇 button |

---

## Sounds — Need

| File | Drop Location | Notes |
|------|---------------|-------|
| `ambient_night.mp3` | `src/assets/sounds/music/` | Calm nighttime loop — crickets, soft wind, optional distant owl. 1–3 min loop. One line uncomment in `useSoundManager.js` activates it once the file exists. |
| `summon_friends.mp3` | `src/assets/sounds/sfx/` | Future — playful whistle/chime for the Summon ability when all NPC friends are purchased. |

---

## Sprites — Need

| Asset | Drop Location | Notes |
|-------|---------------|-------|
| **`cat_study.png`** | `src/assets/sprites/` | Bubby's study animation — **needed now**. Currently he just uses the sit animation during study sessions. See pixel lab prompt below. |
| **`rompy_study.png`** | `src/assets/sprites/` | Rompy studying — 4–6 frame loop, seated with book. Appears during shared sessions. See prompt below. |
| **`rompy_celebrate.png`** | `src/assets/sprites/` | Rompy wave/jump — 4–6 frames. Plays on shared session complete. |
| **`rompy_idle.png`** | `src/assets/sprites/` | Rompy breathing idle — 2–4 frames. |
| Rompy walk/run sheets | `src/assets/sprites/` | For HaroldNPC-style wandering. Design pending. |
| NPC portrait cards | `src/assets/ui/` | For shop "Friends" tab: `npc_harold_portrait.png`, `npc_bird_portrait.png`, `npc_rompy_portrait.png` (~100×100 px each). |

### Pixel Lab Prompts

**`cat_study.png` — Bubby studying:**
> Top-down 2D pixel art sprite sheet, tuxedo cat (black and white fur, white chest, green eyes) sitting upright reading a small open book held in both paws, head slightly tilted down toward the book, tail wrapped around. 6 frames horizontal strip, subtle page-flick or ear-twitch every 2–3 frames to show he's engaged. Native frame size: 56×56 px. Transparent background, black outline, muted warm palette, no anti-aliasing, pixelated style. Single row sheet: 336×56 px total.

**`rompy_study.png` — Rompy studying:**
> Top-down 2D pixel art sprite sheet, cute round elephant character named Rompy, sitting cross-legged with a small open book balanced on his knees, trunk curled gently, large friendly eyes. 4-frame loop — subtle trunk sway + page turn every other frame. Native frame: 56×56 px. Transparent background, warm earthy palette, soft outlines. Single row: 224×56 px.

**`rompy_celebrate.png` — Rompy celebrating:**
> Top-down 2D pixel art sprite sheet, cute round elephant Rompy doing a happy wave — trunk raised, one foot up, big smile. 5 frames: neutral → raise trunk → peak wave → lower → neutral. Native 56×56 px, transparent background, same palette as rompy_study. Sheet: 280×56 px.

**`rompy_idle.png` — Rompy idle breathing:**
> Top-down 2D pixel art, cute round elephant Rompy standing still, 3-frame gentle breathing loop (belly slightly expands/contracts). Native 56×56 px, transparent background. Sheet: 168×56 px.

---

## UI Assets — Have / Need

### Welcome Screen
- **Approach A (recommended):** CSS sprite scene — use existing sprite sheets, animate each character in CSS. Zero new assets required.
- **Approach B:** AI-generated illustration — crop 1 frame from each sprite → Gemini/Midjourney with cozy pixel art group scene prompt → `welcome_screen.png`.
- **Rompy:** Required for welcome screen regardless of approach (Varun to provide).

### Tier 2 Area Visuals
- Visual upgrades when areas reach tier 2 are achievable with existing tileset2 assets + CSS.
- Potentially new ground tile variants or overlay textures per area — design decision pending.

---

## SVG Asset Wishlist (Future)

These are nice-to-have additions; none are blocking current features.

**V2.0 (house system):**
- Room backgrounds: `room_living.svg`, `room_bedroom.svg`, `room_kitchen.svg`, `room_garden.svg`, `room_study.svg`
- UI icons: `coin.svg`, `star.svg`, `heart.svg`, `trophy.svg`, `lock.svg`, `shop_bag.svg`

**V2.2 (seasonal):**
- `background_snow.svg`, `background_rain.svg`, `background_autumn.svg`
- Seasonal character variants (scarf, raincoat)
