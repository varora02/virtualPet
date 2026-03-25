/**
 * levelConfig.js — single source of truth for the pet's level system and abilities.
 *
 * ─── HOW TO TWEAK LEVELING ────────────────────────────────────────────────────
 *   EXP_PER_LEVEL    : experience points required to advance one level.
 *   PLAY_EXP_REWARD  : exp awarded each time the user clicks "Play".
 *
 * ─── HOW TO ADD A NEW ABILITY ───────────────────────────────────────────────
 *  Add an entry to the ABILITIES array:
 *    id            : unique string identifier (no spaces)
 *    name          : display name shown in the UI
 *    icon          : emoji displayed on the ability button
 *    desc          : short description shown in the abilities panel
 *    requiredLevel : integer level at which the ability unlocks
 *    duration      : milliseconds the effect lasts (omit / null for permanent)
 *    type          : 'summon' | 'buff' | 'visual' — consumed by ability handlers
 *
 *  Example:
 *    {
 *      id: 'speed_boost',
 *      name: 'Speed Boost',
 *      icon: '⚡',
 *      desc: 'Harold dashes around at double speed for 10 seconds.',
 *      requiredLevel: 3,
 *      duration: 10000,
 *      type: 'buff',
 *    },
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Experience points required to advance one level */
export const EXP_PER_LEVEL = 100

/** Exp gained each time the user clicks "Play" */
export const PLAY_EXP_REWARD = 10

/**
 * All abilities, ordered by unlock level.
 * The abilities panel renders them in this order.
 */
export const ABILITIES = [
  {
    id: 'ghost_bud',
    name: 'Ghost Bud',
    icon: '👻',
    desc: 'Summon a translucent ghost hare that mirrors your pet for 15 seconds.',
    requiredLevel: 2,
    duration: 15000,   // ms
    type: 'summon',
  },

  // ── Add new abilities below ──────────────────────────────────────────────────
  // {
  //   id: 'example_ability',
  //   name: 'Example Ability',
  //   icon: '✨',
  //   desc: 'Does something cool.',
  //   requiredLevel: 3,
  //   duration: 10000,
  //   type: 'visual',
  // },
]
