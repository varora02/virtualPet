// Flat vector pixel-art style elephant — Rompy
// Style: chunky pixel blocks, bold outlines, limited flat color palette

function RompySVG({ mood = 'neutral', size = 120 }) {
  // Body color shifts with mood
  const body   = mood === 'critical' ? '#A0A0A0' : '#7B6FAB'
  const shadow = mood === 'critical' ? '#888888' : '#5E5490'
  const light  = mood === 'critical' ? '#C0C0C0' : '#9D92C8'
  const ear    = mood === 'critical' ? '#B8B8B8' : '#9A8FC0'
  const earIn  = mood === 'critical' ? '#D0D0D0' : '#C2B8DC'
  const outline = '#2C2240'

  // Eyes change with mood
  const eyeL = mood === 'happy'
    ? <path d="M34 47 Q38 43 42 47" fill="none" stroke={outline} strokeWidth="3" strokeLinecap="round"/>
    : mood === 'sad' || mood === 'critical'
    ? <path d="M34 43 Q38 47 42 43" fill="none" stroke={outline} strokeWidth="3" strokeLinecap="round"/>
    : <circle cx="38" cy="46" r="3" fill={outline}/>

  const eyeR = mood === 'happy'
    ? <path d="M54 47 Q58 43 62 47" fill="none" stroke={outline} strokeWidth="3" strokeLinecap="round"/>
    : mood === 'sad' || mood === 'critical'
    ? <path d="M54 43 Q58 47 62 43" fill="none" stroke={outline} strokeWidth="3" strokeLinecap="round"/>
    : <circle cx="58" cy="46" r="3" fill={outline}/>

  const mouth = mood === 'happy'
    ? <path d="M42 62 Q50 70 58 62" fill="none" stroke={outline} strokeWidth="3" strokeLinecap="round"/>
    : mood === 'critical'
    ? <path d="M42 68 Q50 62 58 68" fill="none" stroke={outline} strokeWidth="3" strokeLinecap="round"/>
    : <path d="M44 65 L56 65" stroke={outline} strokeWidth="2.5" strokeLinecap="round"/>

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
         style={{ imageRendering: 'pixelated' }}>

      {/* LEFT EAR — back layer */}
      <rect x="4"  y="32" width="22" height="28" rx="11" ry="14" fill={ear} stroke={outline} strokeWidth="2.5"/>
      <rect x="8"  y="37" width="13" height="18" rx="6"  ry="9"  fill={earIn}/>

      {/* BODY */}
      <rect x="20" y="48" width="58" height="40" rx="14" fill={shadow} stroke={outline} strokeWidth="2.5"/>
      <rect x="22" y="50" width="54" height="36" rx="12" fill={body}/>
      {/* body highlight stripe */}
      <rect x="26" y="52" width="18" height="8"  rx="4"  fill={light} opacity="0.45"/>

      {/* HEAD */}
      <rect x="16" y="20" width="66" height="52" rx="22" fill={shadow} stroke={outline} strokeWidth="2.5"/>
      <rect x="18" y="22" width="62" height="48" rx="20" fill={body}/>
      {/* head highlight */}
      <rect x="24" y="26" width="22" height="10" rx="5"  fill={light} opacity="0.4"/>

      {/* RIGHT EAR — front layer */}
      <rect x="74" y="32" width="22" height="28" rx="11" ry="14" fill={ear} stroke={outline} strokeWidth="2.5"/>
      <rect x="78" y="37" width="13" height="18" rx="6"  ry="9"  fill={earIn}/>

      {/* TRUNK */}
      <rect x="30" y="64" width="14" height="8"  rx="4"  fill={shadow} stroke={outline} strokeWidth="2"/>
      <rect x="24" y="70" width="14" height="8"  rx="4"  fill={body}   stroke={outline} strokeWidth="2"/>
      <rect x="20" y="78" width="14" height="8"  rx="4"  fill={shadow} stroke={outline} strokeWidth="2"/>
      <rect x="22" y="86" width="14" height="7"  rx="4"  fill={body}   stroke={outline} strokeWidth="2"/>
      {/* trunk tip */}
      <rect x="26" y="91" width="10" height="6"  rx="3"  fill={light}  stroke={outline} strokeWidth="1.5"/>

      {/* EYES */}
      {eyeL}
      {eyeR}
      {/* eye shine dots (only on filled circle eyes) */}
      {mood === 'neutral' && <>
        <circle cx="40" cy="44" r="1.2" fill="white"/>
        <circle cx="60" cy="44" r="1.2" fill="white"/>
      </>}

      {/* MOUTH */}
      {mouth}

      {/* CHEEK BLUSH (happy only) */}
      {mood === 'happy' && <>
        <ellipse cx="28" cy="58" rx="6" ry="4" fill="#F7A8B8" opacity="0.6"/>
        <ellipse cx="72" cy="58" rx="6" ry="4" fill="#F7A8B8" opacity="0.6"/>
      </>}

      {/* LEGS */}
      <rect x="28" y="84" width="16" height="14" rx="5" fill={shadow} stroke={outline} strokeWidth="2.5"/>
      <rect x="30" y="86" width="12" height="10" rx="4" fill={body}/>
      <rect x="56" y="84" width="16" height="14" rx="5" fill={shadow} stroke={outline} strokeWidth="2.5"/>
      <rect x="58" y="86" width="12" height="10" rx="4" fill={body}/>

      {/* TOENAILS */}
      <rect x="30" y="94" width="4" height="3" rx="1.5" fill="white" opacity="0.7"/>
      <rect x="36" y="94" width="4" height="3" rx="1.5" fill="white" opacity="0.7"/>
      <rect x="58" y="94" width="4" height="3" rx="1.5" fill="white" opacity="0.7"/>
      <rect x="64" y="94" width="4" height="3" rx="1.5" fill="white" opacity="0.7"/>

      {/* TAIL */}
      <rect x="76" y="54" width="6" height="16" rx="3" fill={body}  stroke={outline} strokeWidth="1.5"/>
      <rect x="80" y="66" width="7" height="7"  rx="3" fill={light} stroke={outline} strokeWidth="1.5"/>
    </svg>
  )
}

export default RompySVG
