/**
 * useGrassPatches — manages edible grass patch state.
 *
 * ─── RESPONSIBILITIES ─────────────────────────────────────────────────────────
 * • Generates 1–2 grass patches per unlocked area on mount.
 * • Detects when new areas unlock and appends patches for them.
 * • Exposes helpers to hide a patch (eaten) and restore it (replenish).
 *
 * ─── HOW TO USE ───────────────────────────────────────────────────────────────
 *   const { grassPatches, grassPatchesRef, hideGrassPatch, restoreGrassPatch }
 *     = useGrassPatches(unlockedAreas)
 *
 *   // hide patch at index i (hare just ate it):
 *   hideGrassPatch(i)
 *   // restore it 45 s later:
 *   setTimeout(() => restoreGrassPatch(i), 45000)
 *
 * ─── EXTENSIBILITY ────────────────────────────────────────────────────────────
 * To add more food types (e.g. berries, mushrooms):
 * • Create a sibling hook (e.g. useBerryClusters) following the same pattern.
 * • Collision check in makeGrassPatchesForAreas references WORLD_PROPS, so
 *   new prop types with collisionR > 0 are automatically avoided.
 * • The grass spawn radius constants (40, 58, 20, 74) are local to
 *   makeGrassPatchesForAreas — adjust them if your food item is a different size.
 */

import { useState, useEffect, useRef } from 'react'
import { AREA_W, AREA_H, HARE_PX } from '../worldConfig.js'
import { WORLD_PROPS } from '../worldData.js'

// ── Grass-patch spawn logic ───────────────────────────────────
/**
 * Generate 1–2 edible grass patches per area.
 * Avoids prop collision radii and keeps patches spread out (min 72 px apart).
 * Returns an array of patch objects: { id, areaId, x, y, visible }.
 */
function makeGrassPatchesForAreas(areas) {
  const patches = []
  areas.forEach(areaId => {
    const col       = areaId % 3
    const screenRow = 2 - Math.floor(areaId / 3)
    const ax = col * AREA_W, ay = screenRow * AREA_H
    const count = Math.floor(Math.random() * 2) + 1   // 1 or 2 per area
    let placed = 0, attempts = 0
    while (placed < count && attempts < 80) {
      attempts++
      const x = ax + 40 + Math.random() * (AREA_W - 58 - 40)
      const y = ay + 20 + Math.random() * (AREA_H - 74)
      // Reject if inside any prop's collision radius
      const blocked = WORLD_PROPS.some(p =>
        Math.hypot(x + 29 - (p.x + p.displayW / 2), y + 29 - (p.y + p.displayH / 2)) < p.collisionR + 40
      )
      // Keep patches spread within the same area
      const tooClose = patches
        .filter(p => p.areaId === areaId)
        .some(p => Math.hypot(p.x - x, p.y - y) < 72)
      if (!blocked && !tooClose) {
        patches.push({
          id:      `grass_${areaId}_${placed}`,
          areaId,
          x:       +x.toFixed(1),
          y:       +y.toFixed(1),
          visible: true,
        })
        placed++
      }
    }
  })
  return patches
}

// ─────────────────────────────────────────────────────────────

/**
 * @param {number[]} unlockedAreas  Array of area IDs the hare can enter.
 */
export function useGrassPatches(unlockedAreas) {
  const [grassPatches, setGrassPatches] = useState(
    () => makeGrassPatchesForAreas(unlockedAreas)
  )

  // Stable ref so movement loop can read patches without re-subscribing
  const grassPatchesRef  = useRef(grassPatches)
  const prevUnlockedRef  = useRef(unlockedAreas)

  useEffect(() => { grassPatchesRef.current = grassPatches }, [grassPatches])

  // Generate new patches when new areas unlock
  useEffect(() => {
    const prev = prevUnlockedRef.current
    const newlyUnlocked = unlockedAreas.filter(id => !prev.includes(id))
    if (newlyUnlocked.length > 0) {
      const newPatches = makeGrassPatchesForAreas(newlyUnlocked)
      setGrassPatches(ps => [...ps, ...newPatches])
    }
    prevUnlockedRef.current = unlockedAreas
  }, [unlockedAreas])

  /** Hide patch at index i (hare just ate it). */
  const hideGrassPatch = (i) =>
    setGrassPatches(ps => ps.map((g, idx) => idx === i ? { ...g, visible: false } : g))

  /** Restore patch at index i (replenish after eating). */
  const restoreGrassPatch = (i) =>
    setGrassPatches(ps => ps.map((g, idx) => idx === i ? { ...g, visible: true } : g))

  return { grassPatches, grassPatchesRef, hideGrassPatch, restoreGrassPatch }
}
