import { useState, useEffect, useRef } from 'react'
import rompyUrl    from '../assets/svgs/rompy.svg'
import grassUrl    from '../assets/svgs/grass.svg'
import butterflyUrl from '../assets/svgs/butterfly.svg'
import bgDay    from '../assets/svgs/background3.svg'
import bgNight  from '../assets/svgs/background2.svg'
import './Pet.css'

const WALK_SPEED  = 0.18
const WALK_LEFT   = 10
const WALK_RIGHT  = 70
const GRASS_X     = 62   // % from left where the grass food sits

function Pet({ pet, hasInteracted = false, feedTrigger = 0, restTrigger = 0 }) {
  const [petX, setPetX]               = useState(18)
  const [facingRight, setFacingRight] = useState(true)
  // 'idle' | 'going' | 'eating' | 'resting'
  const [eatState, setEatState]       = useState('idle')
  const [grassVisible, setGrassVisible] = useState(true)

  const dirRef      = useRef(1)
  const eatStateRef = useRef('idle')
  const petXRef     = useRef(18)

  const avgStat = (pet.hunger + pet.thirst + pet.energy + pet.happiness) / 4
  const mood = avgStat >= 80 ? 'happy' : avgStat >= 50 ? 'neutral' : avgStat >= 25 ? 'sad' : 'critical'

  // Is Rompy too tired to move?
  const isTired = pet.energy <= 0

  // Keep petXRef in sync for use inside the interval
  useEffect(() => { petXRef.current = petX }, [petX])

  // When Feed is pressed, walk Rompy to the grass
  useEffect(() => {
    if (feedTrigger === 0) return
    if (!grassVisible) return
    if (eatStateRef.current !== 'idle') return
    if (isTired) return  // too tired to eat

    eatStateRef.current = 'going'
    setEatState('going')

    if (petXRef.current < GRASS_X) {
      dirRef.current = 1
      setFacingRight(true)
    } else {
      dirRef.current = -1
      setFacingRight(false)
    }
  }, [feedTrigger])

  // When Rest is pressed, stand still for 5 seconds
  useEffect(() => {
    if (restTrigger === 0) return
    eatStateRef.current = 'resting'
    setEatState('resting')
    setTimeout(() => {
      eatStateRef.current = 'idle'
      setEatState('idle')
    }, 5000)
  }, [restTrigger])

  // Main walk loop
  useEffect(() => {
    const id = setInterval(() => {
      setPetX(prev => {
        const state = eatStateRef.current

        // Frozen states
        if (state === 'eating')  return prev
        if (state === 'resting') return prev
        if (isTired)             return prev  // energy = 0 → no movement

        if (state === 'going') {
          const next = prev + dirRef.current * WALK_SPEED * 2
          const arrived = Math.abs(next - GRASS_X) < 1.5

          if (arrived) {
            eatStateRef.current = 'eating'
            setEatState('eating')
            setGrassVisible(false)

            setTimeout(() => {
              eatStateRef.current = 'idle'
              setEatState('idle')
              dirRef.current = -1
              setFacingRight(false)
              setTimeout(() => setGrassVisible(true), 45000)
            }, 2500)

            return GRASS_X
          }
          return next
        }

        // Normal idle walk
        const next = prev + dirRef.current * WALK_SPEED
        if (next >= WALK_RIGHT) { dirRef.current = -1; setFacingRight(false); return WALK_RIGHT }
        if (next <= WALK_LEFT)  { dirRef.current =  1; setFacingRight(true);  return WALK_LEFT  }
        return next
      })
    }, 50)
    return () => clearInterval(id)
  }, [isTired])

  const bgSrc = mood === 'critical' ? bgNight : bgDay

  return (
    <div className={`world-scene mood-${mood}`}>

      {/* Background */}
      <img src={bgSrc} className="world-bg" alt="" aria-hidden="true" />

      {/* Butterfly decoration */}
      <img src={butterflyUrl} alt="" aria-hidden="true" className="world-butterfly" />

      {/* Grass food object */}
      {grassVisible && (
        <img
          src={grassUrl}
          alt="grass"
          className="world-grass"
          style={{ left: `${GRASS_X}%` }}
        />
      )}

      {/* Rompy */}
      <img
        src={rompyUrl}
        alt="Rompy"
        className={[
          'rompy-walker',
          `mood-filter-${mood}`,
          eatState === 'eating'  ? 'rompy-eating'  : '',
          eatState === 'resting' ? 'rompy-resting' : '',
          isTired                ? 'rompy-tired'   : '',
        ].filter(Boolean).join(' ')}
        style={{ left: `${petX}%`, transform: `scaleX(${facingRight ? -1 : 1})` }}
      />
    </div>
  )
}

export default Pet
