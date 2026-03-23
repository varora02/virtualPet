
# Tier Decoration Spec

## Overview
Each of the 9 areas in the 3×3 world grid has 3 tiers. Areas start at Tier 1 when unlocked. Tiers 2 and 3 are purchased in the shop (cost: 1 coin each during dev). Each tier spawns new decorative props into that area using assets from **craftpix tileset 2**.

## Asset Source
All decoration assets come from the craftpix tileset 2 pack located in the project.

**Available asset categories:**
- `2 Objects/4 Stone/` — 16 stone variants (1.png–16.png)
- `2 Objects/5 Grass/` — 6 grass tufts (1.png–6.png)
- `2 Objects/6 Flower/` — 12 flower variants (1.png–12.png)
- `2 Objects/7 Decor/` — Boxes (4), Dirt patches (6), Lamps (6), Logs (4), Trees (2)
- `2 Objects/8 Camp/` — 6 camp items (1.png–6.png)
- `2 Objects/9 Bush/` — 6 bush variants (1.png–6.png)
- `3 Animated Objects/1 Flag/` — 5-frame flag animation
- `3 Animated Objects/2 Campfire/` — 2-frame campfire animation

## Implementation Pattern
To add a new prop, follow the pattern in `src/worldData.js`:
1. Import the PNG asset at the top
2. Add a key → URL entry in `PROP_SRCS`
3. Add a prop entry to `WORLD_PROPS` with the correct `areaId` and `tier` field
4. The prop will automatically appear when that area reaches that tier (filtering is already wired in)

## Proposed Tier Decoration Plan (all 9 areas)

### Area 4 — Starting Meadow (center)
- **Tier 1** *(already present)*: existing grass patches, trees, water trough, campfire
- **Tier 2**: Add 2 flower clusters (Flower/3.png, Flower/7.png), 1 decorative log (Decor/Log1.png), 1 stone (Stone/4.png)
- **Tier 3**: Add animated flag (Flag/1–5.png), 1 lamp (Decor/Lamp1.png), 1 bush (Bush/3.png), dirt patch (Decor/Dirt2.png)

### Area 7 — South Field (bottom-mid, 2nd unlock)
- **Tier 1** *(on unlock)*: 2 grass tufts (Grass/1.png, Grass/4.png), 1 stone (Stone/2.png)
- **Tier 2**: 2 flowers (Flower/1.png, Flower/9.png), 1 bush (Bush/1.png), 1 log (Decor/Log3.png)
- **Tier 3**: 1 camp item (Camp/3.png), 1 lamp (Decor/Lamp3.png), 1 decorative box (Decor/Box2.png)

### Area 3 — West Field (mid-left, 3rd unlock)
- **Tier 1** *(on unlock)*: 2 stones (Stone/7.png, Stone/11.png), 1 grass tuft (Grass/2.png)
- **Tier 2**: 3 flowers (Flower/2.png, Flower/5.png, Flower/10.png), 1 bush (Bush/2.png)
- **Tier 3**: 1 tree (Decor/Tree1.png), 1 lamp (Decor/Lamp5.png), animated campfire (Camp/1.png), dirt patch (Decor/Dirt4.png)

### Area 5 — East Field (mid-right, 4th unlock)
- **Tier 1** *(on unlock)*: 2 grass tufts (Grass/3.png, Grass/5.png), 1 stone (Stone/5.png)
- **Tier 2**: 2 flowers (Flower/4.png, Flower/11.png), 1 log (Decor/Log2.png), 1 bush (Bush/4.png)
- **Tier 3**: 1 lamp (Decor/Lamp2.png), 1 camp item (Camp/5.png), 1 decorative box (Decor/Box3.png)

### Area 1 — North Field (top-mid, 5th unlock)
- **Tier 1** *(on unlock)*: 2 stones (Stone/1.png, Stone/9.png), 1 bush (Bush/5.png)
- **Tier 2**: 2 flowers (Flower/6.png, Flower/8.png), 1 grass tuft (Grass/6.png), 1 log (Decor/Log4.png)
- **Tier 3**: 1 tree (Decor/Tree2.png), 1 lamp (Decor/Lamp4.png), animated flag, dirt patch (Decor/Dirt1.png)

### Area 6 — South-West Corner (6th unlock)
- **Tier 1** *(on unlock)*: 2 stones (Stone/3.png, Stone/13.png), 1 grass (Grass/1.png)
- **Tier 2**: 3 flowers (Flower/3.png, Flower/7.png, Flower/12.png), 1 bush (Bush/6.png)
- **Tier 3**: 1 camp set (Camp/2.png, Camp/4.png), 1 lamp (Decor/Lamp6.png), dirt patch (Decor/Dirt5.png)

### Area 8 — South-East Corner (7th unlock)
- **Tier 1** *(on unlock)*: 2 grass tufts (Grass/2.png, Grass/4.png), 1 stone (Stone/6.png)
- **Tier 2**: 2 flowers (Flower/1.png, Flower/9.png), 1 log (Decor/Log1.png), 1 bush (Bush/3.png)
- **Tier 3**: 1 decorative box (Decor/Box1.png), 1 lamp (Decor/Lamp2.png), animated campfire, dirt patch (Decor/Dirt3.png)

### Area 0 — North-West Corner (8th unlock)
- **Tier 1** *(on unlock)*: 2 stones (Stone/8.png, Stone/14.png), 1 bush (Bush/1.png)
- **Tier 2**: 3 flowers (Flower/2.png, Flower/5.png, Flower/11.png), 1 grass (Grass/5.png)
- **Tier 3**: 1 tree (Decor/Tree1.png), animated flag, 1 lamp (Decor/Lamp1.png), dirt patch (Decor/Dirt6.png)

### Area 2 — North-East Corner (9th unlock, final)
- **Tier 1** *(on unlock)*: 2 grass tufts (Grass/3.png, Grass/6.png), 1 stone (Stone/10.png)
- **Tier 2**: 2 flowers (Flower/4.png, Flower/6.png), 1 bush (Bush/2.png), 1 log (Decor/Log3.png)
- **Tier 3**: 1 camp set (Camp/1.png, Camp/6.png), 1 lamp (Decor/Lamp3.png), 1 decorative box (Decor/Box4.png), dirt patch (Decor/Dirt2.png)

## How to Implement
A new chat with access to the codebase should:
1. Read `WORLD_SYSTEM.md` and `src/worldData.js` first
2. Copy tileset assets into `src/assets/tileset2/` (preserving subfolder structure)
3. Import and add each asset to `PROP_SRCS` in `worldData.js`
4. Add prop entries to `WORLD_PROPS` per the plan above, with correct `areaId`, `tier`, `x`, `y`, `displayW`, `displayH`, and `collisionR: 0` (decorations are non-blocking)
5. Use `WORLD_SYSTEM.md` area coordinate helpers to place props within area boundaries
6. The tier filtering is already wired — no other files need changing

## How to Test Tiers (Dev)
1. Run `npm run dev`
2. Open the app — all costs are set to 1 coin during development
3. Earn a coin by completing a study session (or temporarily add coins via browser console: find the React state and manually set coins)
4. Open the Shop → Progression Roadmap
5. Buy "Tier 2" for Starting Meadow (cost: 1 coin) — new decorations should appear in area 4
6. Buy "Tier 3" — more decorations appear
7. Buy the next area unlock — area 7 opens at Tier 1
8. Continue down the roadmap

## Notes for Implementer
- Prop positions (x, y) need to be set within each area's pixel bounds. Use the area coordinate formula from WORLD_SYSTEM.md: `areaCol = areaId % 3`, `areaRow = Math.floor(areaId / 3)`, then `x = areaCol * AREA_W + offset`, `y = areaRow * AREA_H + offset`
- Keep decorations away from interactive props (trees, trough, campfire) — use `collisionR: 0` and place them in open space
- Animated props (flag, campfire) need `animated: true` and `animClass` pointing to a CSS keyframe animation
- The user will finalize exact positions and may swap specific asset choices — this spec is a starting blueprint
