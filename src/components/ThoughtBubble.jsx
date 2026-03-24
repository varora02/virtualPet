/**
 * ThoughtBubble — floats above the pet sprite as a comic-style thought bubble.
 *
 * Props:
 *   message  : string   — text to display (e.g. "I'm tired zzz 💤")
 *   petPos   : { x, y } — current pet position (top-left of sprite)
 *   petPx    : number   — sprite display size (width/height), used to centre above head
 *   zIndex   : number   — layer (default 950, above level popup at 900)
 *   visible  : boolean  — controls show/hide
 */
export default function ThoughtBubble({ message, petPos, petPx = 80, zIndex = 950, visible }) {
  if (!visible || !message) return null

  const cx = Math.round(petPos.x + petPx / 2)   // horizontal centre of sprite
  const ty = Math.round(petPos.y - 8)             // just above the sprite head

  return (
    <div
      className="thought-bubble"
      style={{
        left:   cx,
        top:    ty,
        zIndex,
      }}
      aria-live="polite"
    >
      <span className="thought-bubble__text">{message}</span>
      {/* Tail dots — three circles stepping down toward the sprite head */}
      <span className="thought-bubble__dot thought-bubble__dot--1" />
      <span className="thought-bubble__dot thought-bubble__dot--2" />
      <span className="thought-bubble__dot thought-bubble__dot--3" />
    </div>
  )
}
