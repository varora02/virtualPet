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

    // Pick a cluster centre, then place 2–3 patches close together
    const clusterCount = Math.floor(Math.random() * 2) + 2   // 2 or 3 per cluster
    let clusterX, clusterY, centreAttempts = 0

    // Find a valid cluster centre far from props
    do {
      clusterX = ax + 60 + Math.random() * (AREA_W - 120)
      clusterY = ay + 30 + Math.random() * (AREA_H - 90)
      centreAttempts++
    } while (
      centreAttempts < 40 &&
      WORLD_PROPS.some(p =>
        Math.hypot(clusterX - (p.x + p.displayW / 2), clusterY - (p.y + p.displayH / 2)) < p.collisionR + 55
      )
    )

    // Place patches in a tight cluster around the centre (within ±36px)
    let placed = 0, attempts = 0
    while (placed < clusterCount && attempts < 60) {
      attempts++
      const angle  = Math.random() * Math.PI * 2
      const radius = 10 + Math.random() * 30
      const x = clusterX + Math.cos(angle) * radius
      const y = clusterY + Math.sin(angle) * radius
      if (x < ax + 30 || x > ax + AREA_W - 30) continue
      if (y < ay + 20 || y > ay + AREA_H - 50) continue
      const blocked = WORLD_PROPS.some(p =>
        Math.hypot(x + 16 - (p.x + p.displayW / 2), y + 16 - (p.y + p.displayH / 2)) < p.collisionR + 32
      )
      const tooClose = patches
        .filter(p => p.areaId === areaId)
        .some(p => Math.hypot(p.x - x, p.y - y) < 22)
      if (!blocked && !tooClose) {
        patches.push({
          id:      `grass_${areaId}_${placed}`,
          areaId,
          x:       +x.toFixed(1),
          y:       +y.toFixed(1),
          variant: placed % 3,   // 0 = default SVG, 1 = golden tile, 2 = cool tile
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
