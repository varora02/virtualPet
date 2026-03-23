/**
 * WorldProps — renders all world prop objects onto the tile map.
 *
 * This component is intentionally thin: it imports data from worldData.js
 * and renders it. All prop definitions, asset maps, and position helpers
 * live in src/worldData.js — edit there to add/move/remove props.
 *
 * ─── RENDERING RULES ─────────────────────────────────────────────────────────
 * isDecor props  → fixed z-index 3 (above tiles, behind all props + hare)
 * normal props   → z = Z_BASE + Math.round(y + displayH)  ("foot position" rule)
 * animated props → rendered as <div> with CSS background animation (animClass)
 * static props   → rendered as <img>
 *
 * Night glows are NOT rendered here — Pet.jsx owns them (it knows if isNight).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Z_BASE } from '../worldConfig.js'
import { WORLD_PROPS, PROP_SRCS } from '../worldData.js'

export default function WorldProps({ worldProps = WORLD_PROPS }) {
  return (
    <>
      {worldProps.map(prop => {
        const zIndex = prop.isDecor
          ? 3
          : Z_BASE + Math.round(prop.y + prop.displayH)

        const base = {
          position:       'absolute',
          left:           prop.x,
          top:            prop.y,
          width:          prop.displayW,
          height:         prop.displayH,
          zIndex,
          pointerEvents:  'none',
          userSelect:     'none',
          imageRendering: 'pixelated',
        }

        if (prop.animated) {
          return (
            <div
              key={prop.id}
              className={prop.animClass}
              style={{
                ...base,
                backgroundImage:  `url(${PROP_SRCS[prop.type]})`,
                backgroundRepeat: 'no-repeat',
              }}
            />
          )
        }

        return (
          <img
            key={prop.id}
            src={PROP_SRCS[prop.type]}
            alt=""
            draggable={false}
            style={base}
          />
        )
      })}
    </>
  )
}

// Re-export for consumers that need the data (Pet.jsx, etc.)
export { WORLD_PROPS } from '../worldData.js'
