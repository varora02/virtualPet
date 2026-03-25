/**
 * useBackgroundMusic — manages a looping ambient background track.
 *
 * ─── USAGE ────────────────────────────────────────────────────────────────────
 * const { musicMuted, toggleMusic } = useBackgroundMusic(isNight)
 *
 * Automatically:
 *   • Starts the day track on first user interaction (respects browser autoplay rules).
 *   • Cross-fades to the night track when isNight flips to true, and back at dawn.
 *   • Pauses/resumes when the browser tab loses/regains focus.
 *
 * ─── HOW TO ACTIVATE ─────────────────────────────────────────────────────────
 * 1. Add ambient_day.ogg and ambient_night.ogg to src/assets/sounds/music/
 * 2. Uncomment the two import lines below.
 * 3. The rest is automatic — just call useBackgroundMusic(isNight) in Game.jsx.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState, useCallback } from 'react'

import dayTrackUrl from '../assets/sounds/music/ambient_day.mp3'
// Night track: add ambient_night.mp3 to the same folder and uncomment:
// import nightTrackUrl from '../assets/sounds/music/ambient_night.mp3'

const nightTrackUrl = null   // no night track yet

const FADE_STEP_MS  = 50     // ms between each fade tick
const FADE_DURATION = 1500   // total crossfade duration (ms)
const MUSIC_VOLUME  = 0.55   // master volume for music (0–1)

export function useBackgroundMusic(isNight = false) {
  const dayRef    = useRef(null)
  const nightRef  = useRef(null)
  const startedRef = useRef(false)

  // Start muted — user must explicitly press the 🎵 button to begin music.
  // This also avoids a race condition where the first-gesture unlock fires
  // at the same moment the toggle sets musicMuted=true, preventing music
  // from ever starting.
  const [musicMuted, setMusicMuted] = useState(true)
  const musicMutedRef = useRef(true)
  useEffect(() => { musicMutedRef.current = musicMuted }, [musicMuted])

  // ── Create Audio objects once ─────────────────────────────────
  useEffect(() => {
    if (!dayTrackUrl && !nightTrackUrl) return  // no files yet — skip

    if (dayTrackUrl) {
      dayRef.current = new Audio(dayTrackUrl)
      dayRef.current.loop   = true
      dayRef.current.volume = 0
    }
    if (nightTrackUrl) {
      nightRef.current = new Audio(nightTrackUrl)
      nightRef.current.loop   = true
      nightRef.current.volume = 0
    }

    return () => {
      dayRef.current?.pause()
      nightRef.current?.pause()
    }
  }, [])

  // ── Fade helper ───────────────────────────────────────────────
  const fadeTo = (audio, target, doneCallback) => {
    if (!audio) return
    const steps    = FADE_DURATION / FADE_STEP_MS
    const delta    = (target - audio.volume) / steps
    let i = 0
    const tick = setInterval(() => {
      i++
      const next = audio.volume + delta
      audio.volume = Math.max(0, Math.min(MUSIC_VOLUME, next))
      if (i >= steps) {
        clearInterval(tick)
        audio.volume = target
        if (doneCallback) doneCallback()
      }
    }, FADE_STEP_MS)
    return tick
  }

  // ── Start on first user gesture ──────────────────────────────
  useEffect(() => {
    if (!dayTrackUrl && !nightTrackUrl) return

    const start = () => {
      if (startedRef.current || musicMutedRef.current) return
      startedRef.current = true
      const track = isNight ? nightRef.current : dayRef.current
      if (!track) return
      track.play().then(() => fadeTo(track, MUSIC_VOLUME)).catch(() => {})
      document.removeEventListener('click',      start)
      document.removeEventListener('keydown',    start)
      document.removeEventListener('touchstart', start)
    }
    document.addEventListener('click',      start, { once: true })
    document.addEventListener('keydown',    start, { once: true })
    document.addEventListener('touchstart', start, { once: true })
    return () => {
      document.removeEventListener('click',      start)
      document.removeEventListener('keydown',    start)
      document.removeEventListener('touchstart', start)
    }
  }, [])

  // ── Day ↔ night crossfade ─────────────────────────────────────
  useEffect(() => {
    if (!startedRef.current) return
    if (musicMutedRef.current) return
    const fadeOut = isNight ? dayRef.current   : nightRef.current
    const fadeIn  = isNight ? nightRef.current : dayRef.current
    if (!fadeIn) return
    fadeIn.play().catch(() => {})
    fadeTo(fadeIn,  MUSIC_VOLUME, null)
    fadeTo(fadeOut, 0, () => fadeOut?.pause())
  }, [isNight])

  // ── Pause/resume on tab visibility change ─────────────────────
  useEffect(() => {
    const handleVis = () => {
      if (!startedRef.current || musicMutedRef.current) return
      const active = isNight ? nightRef.current : dayRef.current
      if (!active) return
      if (document.visibilityState === 'hidden') active.pause()
      else active.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', handleVis)
    return () => document.removeEventListener('visibilitychange', handleVis)
  }, [isNight])

  // ── Public: toggle music on/off ───────────────────────────────
  const toggleMusic = useCallback(() => {
    // IMPORTANT: active.play() MUST be called here, synchronously inside the
    // click handler, so the browser recognises it as a user-gesture call.
    // Calling play() inside setMusicMuted(updater) breaks this because React
    // runs updaters outside the gesture context, causing a NotAllowedError.
    const next = !musicMutedRef.current
    musicMutedRef.current = next
    setMusicMuted(next)

    const active = isNight ? nightRef.current : dayRef.current
    if (!active) return
    if (next) {
      // Muting — fade out then pause
      fadeTo(active, 0, () => active.pause())
    } else {
      // Unmuting — start playback unconditionally (handles first-ever press)
      startedRef.current = true
      active.play()
        .then(() => fadeTo(active, MUSIC_VOLUME))
        .catch(err => console.warn('[useBackgroundMusic] play blocked:', err))
    }
  }, [isNight])

  return { musicMuted, toggleMusic }
}
