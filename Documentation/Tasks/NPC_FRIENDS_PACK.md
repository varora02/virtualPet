# Task: NPC Friends Pack

Harold as a wandering NPC, Robin with upgraded behaviors, Rompy wiring.

---

## Overview

After all 9 world areas are purchased, the "NPC Friends Pack" becomes available in the shop. Players buy individual NPC companions; each purchased NPC begins appearing in the world autonomously. When all friends are purchased, the "Summon" ability unlocks.

---

## Blockers

- **Rompy sprite** — Varun to provide before Rompy can be wired in.
- **Pond/mud patch world asset** — Rompy's in-world behavior needs a water feature to gravitate toward.

---

## Harold (Hare) NPC

**Current state:** Harold's sprites and CSS classes fully exist in `Pet.jsx` (dead code). He needs to be extracted into `HaroldNPC.jsx`.

Implementation steps:
- Create `HaroldNPC.jsx` using `WanderingNPC.jsx` as base movement
- Harold wanders MM(4) and adjacent areas autonomously
- Grazes at grass patches (eat animation, doesn't consume them for the player)
- Reacts to Bubby approaching within ~90px — scurries a short distance away
- Clickable: gives a small coin/reward, displays a dialogue bubble

---

## Robin (Bird) Upgrades

**Current state:** Phase machine works (fly in → perch → fly out). Spook-on-approach works.

Upgrade steps:
- Add look-around animation while perching (new sprite row or separate file)
- Add preen animation (grooms feathers)
- Add chirp sound on perch
- Make Robin "landable" at more prop tops (currently limited perch targets)
- As part of Summon: Robin lands on Bubby's back or a nearby prop and stays for the summon duration

---

## Rompy (Elephant)

**Blocked on sprite.** Once Varun provides the file:
- Wire sprite into `RompyNPC.jsx`
- Define `ROMPY_PX` constant and CSS animation classes
- Add a pond/mud patch prop to an area (TR or new dedicated area)
- Rompy lumbers toward water feature, plays splash/roll animation
- Clickable: rewards coins, plays trumpet sound

---

## Summon Ability

- Unlocks in shop after all 3 NPCs are purchased
- Bubby plays a special animation (whistle or dance — `pet-summon` class)
- All NPCs immediately "arrive": Harold hops over, Robin lands nearby, Rompy lumbers in
- Group moment lasts ~5 seconds, then NPCs return to normal wandering
- Plays `summon_friends.mp3` (see `ASSETS.md → Sounds — Need`)
