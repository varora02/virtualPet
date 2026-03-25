/**
 * spriteUtils — shared helpers for sprite sheet layout and depth-sorted z-index.
 *
 * These are pure functions (no React state) shared by Pet, BirdSpawner,
 * WanderingNPC, and any future NPC that needs direction-based sprite rows
 * or foot-position z-depth.
 */

/**
 * Returns a direction → background-position-Y offset map for a sprite sheet
 * whose rows are ordered: down, up, left, right (standard 4-dir layout).
 *
 * @param {number}  pxSize       Displayed height of one frame (= one row's height).
 * @param {boolean} eastWestOnly When true, returns only { right: 0, left: -pxSize }
 *                               for 2-row sheets (e.g. cat eat / sit / jump).
 *                               'down' and 'up' fall back to row 0 (right).
 * @returns {Record<string, number>}
 *
 * Usage:
 *   const rows = directionOffsets(80)
 *   // { down: 0, up: -80, left: -160, right: -240 }
 *
 *   const ewRows = directionOffsets(80, true)
 *   // { right: 0, left: -80, down: 0, up: 0 }
 */
export function directionOffsets(pxSize, eastWestOnly = false) {
  if (eastWestOnly) {
    return { right: 0, left: -pxSize, down: 0, up: 0 }
  }
  return {
    down:  0,
    up:   -pxSize,
    left: -pxSize * 2,
    right: -pxSize * 3,
  }
}

/**
 * Depth-sort z-index: entities lower on screen (higher Y) render in front.
 * The foot of the sprite is at posY + pxSize, so z increases with that sum.
 *
 * @param {number} posY    Top-left Y position of the sprite (world px).
 * @param {number} pxSize  Displayed height of the sprite (px).
 * @param {number} zBase   Base z-index constant (import Z_BASE from worldConfig).
 * @param {number} boost   Optional extra offset (e.g. +120 for Bubby while drinking).
 * @returns {number}
 *
 * Usage:
 *   const z = footDepthZ(petPos.y, HARE_PX, Z_BASE)
 */
export function footDepthZ(posY, pxSize, zBase, boost = 0) {
  return zBase + Math.round(posY + pxSize) + boost
}
