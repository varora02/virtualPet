# NPCs

> All non-player characters: current status, sprite info, planned behaviors.

---

## Harold (Hare)

**Status:** Dead code — sprite and CSS classes exist in `Pet.jsx` / `Pet.css` but Harold is currently dormant. Planned as a wandering NPC in MM(4) once the NPC Friends Pack ships.

**Background:** Harold was the original main pet character before Bubby (tuxedo cat) became the primary pet. His sprite sheets and animation states are fully implemented; he just needs to be re-wired as an independent NPC rather than the player's pet.

### Sprite Info
- Source frames: 32×32 px, displayed at 80×80 px (2.5×)
- Direction rows: down=row0, up=row1, left=row2, right=row3
- `--dir-offset` CSS variable drives row selection
- Full animation table: see `PET_ANIMATIONS.md → Harold`

### CSS Classes
- `hare-walker` — container with position tracking
- `hare-state-walk` — idle wander (5 frames, 0.55s)
- `hare-state-run` — moving to target (6 frames, 0.4s)
- `hare-state-eat` — eating at grass (5 frames, 4s, one-shot)
- `hare-state-drink` — drinking at well (4 frames, 4s, one-shot)
- `hare-state-rest` — resting at tree (4 frames, 1.2s)
- `hare-state-study` / `hare-state-study-pause` — reading animations
- `hare-state-dead` — tired/dying walk (6 frames, stops at frame 5)
- `hare-levelup` — golden flash overlay on idle sprite

### Planned NPC Behavior
- Wanders area MM(4) and adjacent unlocked areas autonomously.
- Grazes near grass patches (walks to them, plays eat animation).
- Reacts to Bubby's presence — looks up, hops away if she gets too close.
- Interactable: clicking Harold gives a small item/coin reward or triggers a friendly interaction.
- NPC movement will use `WanderingNPC.jsx` as the base component.

### Planned Items / Interactions
- Click → gives a small coin or XP reward ("Harold left you a treat!")
- Proximity to Bubby → scurries a short distance away
- Grazing → standard eat animation at grass patches (doesn't consume them for the player)

---

## Robin (Blue Bird)

**Status:** Fully implemented. Managed by `BirdSpawner.jsx`.

**Role:** Ambient life. Flies in occasionally, perches, breathes, then flies off. Purely decorative today; future upgrade will add more behaviors.

### Sprite Info
- Source frames: 56×56 px, displayed at 84×84 px (1.5×)
- Files: `bird/bird_fly_east.png` (9 frames), `bird/bird_fly_west.png` (9 frames), `bird/bird_perch.png` (5 frames)
- CSS: `bird-fly` (1.08s steps(9) infinite), `bird-perch` (6s steps(5) infinite — very slow chest breathe)

### Current Behavior (Phase Machine)
```
appear → flying_in → perching → flying_out → (cooldown) → repeat
```
- Flies in from a random edge of the world.
- Picks a perch target (prop top or tree canopy).
- Perches with the slow chest-breathing animation.
- Spooks and flies off if Bubby approaches within 90px.
- Cooldown between appearances: randomized interval.

### Planned Upgrades (NPC Friends Pack)
- Look-around animation while perching.
- Preen animation (grooms feathers).
- Chirp sound on perch.
- Can be "called" to perch nearby as part of the Summon ability.

---

## Rompy (Elephant)

**Status:** Reserved name and slot. Sprite to be provided by Varun. No code exists yet.

**Role:** Third NPC companion. Will appear on the welcome screen alongside Bubby, Harold, and Robin. In-world presence requires a pond/mud patch world asset (not yet built).

### Sprite Info
- Sprite file: TBD — Varun to provide, drop in `src/assets/`
- Expected: large character, needs its own `ROMPY_PX` constant and CSS class prefix
- For full visual and personality spec: see `Rompy_Roadmap.docx` and `Rompy_Tier_Design.docx`

### Planned Behavior
- Lumbers in from the edge of the world (slow, heavy walk cycle).
- Frequents a water/mud patch area (world asset TBD, likely in a new area or TR).
- Gentle giant personality — large collision radius, slow movement speed.
- Interactable: rewards player with coins or stat boosts on click.
- Requires Rompy's world asset (pond/mud patch) before full NPC behavior can be built.

### Planned Items / Interactions
- Click → splashes/trumpets, gives reward
- Mud patch interaction — plays a "splash/roll" animation at the water feature
- Part of the Summon ability when all NPC friends are purchased

---

## WanderingNPC.jsx

**Status:** Exists as a generic NPC movement component.

**Purpose:** Provides reusable wander/movement logic that Harold (and future NPCs) will use. Handles:
- Random wander target selection within a set of allowed areas.
- Collision avoidance against `WORLD_PROPS` collision radii.
- Direction tracking for sprite row selection.
- Basic state machine: `idle_wander → going_target → at_target → idle_wander`.

Harold's NPC implementation will extend this with interaction callbacks and reaction-to-Bubby logic.

---

## NPC Friends Pack (Planned Feature)

Unlockable after all 9 world areas are purchased. Friends Pack available in the shop — buy individual NPC companions.

NPCs appear based on conditions (time of day, stats, world events) and drift in/out naturally.

**Summon ability** — unlocks when ALL friends are purchased. Bubby whistles and all NPCs emerge together for a special group moment.

**Starter NPCs in the pack:**
1. Harold the Hare — wanders, grazes, reacts to Bubby.
2. Robin Bird — existing ambient behavior + upgraded preen/chirp.

**Future NPC:**
3. Rompy the Elephant — requires pond world asset.

For full implementation plan: see `Tasks/NPC_FRIENDS_PACK.md`.
