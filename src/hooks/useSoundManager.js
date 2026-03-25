/**
 * useSoundManager — preloads and plays all game sound effects.
 *
 * ─── USAGE ────────────────────────────────────────────────────────────────────
 * const { play, setVolume, muted, toggleMute } = useSoundManager()
 *
 * play('eat')       // plays the eat sfx
 * play('levelup')   // plays the level-up chime
 * toggleMute()      // silences / unsilences all sfx
 *
 * ─── BROWSER AUTOPLAY RESTRICTION ────────────────────────────────────────────
 * Browsers block audio until the first user gesture (a click/tap).
 * This hook marks itself "unlocked" on the first interaction, which
 * then drains any sounds that were queued before the gesture happened.
 *
 * ─── HOW TO ADD A NEW SOUND ───────────────────────────────────────────────────
 * 1. Drop the file into src/assets/sounds/sfx/
 * 2. Import it at the top of this file: import mySoundUrl from '../assets/sounds/sfx/mysound.ogg'
 * 3. Add a key → URL entry to SOUND_MAP below.
 * 4. Call play('mySound') wherever you need it.
 *
 * ─── BACKGROUND MUSIC ─────────────────────────────────────────────────────────
 * See useBackgroundMusic.js for the ambient loop manager.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState, useCallback } from 'react'

// ── Sound asset imports ───────────────────────────────────────
// Game action sounds (Kenney Interface Sounds pack)
import eatUrl       from '../assets/sounds/sfx/eat.wav'
import drinkUrl     from '../assets/sounds/sfx/drink.wav'
import coinUrl      from '../assets/sounds/sfx/coin.wav'
import levelupUrl   from '../assets/sounds/sfx/levelup.wav'
import celebrateUrl from '../assets/sounds/sfx/celebrate.wav'
import thoughtUrl   from '../assets/sounds/sfx/thought.wav'
import restUrl      from '../assets/sounds/sfx/rest.wav'

// UI / interface sounds (Kenney Interface Sounds pack)
import clickUrl     from '../assets/sounds/sfx/click.wav'
import toggleUrl    from '../assets/sounds/sfx/toggle.wav'
import openUrl      from '../assets/sounds/sfx/open.wav'
import closeUrl     from '../assets/sounds/sfx/close.wav'
import errorUrl     from '../assets/sounds/sfx/error.wav'

// Pet & ambient sounds
import meowUrl      from '../assets/sounds/sfx/meow.mp3'
import campfireUrl  from '../assets/sounds/sfx/campfire.mp3'

/**
 * Map of sound IDs → asset URLs.
 * Keys available: eat, drink, coin, levelup, celebrate, thought, rest,
 *                 click, toggle, open, close, error, meow, campfire
 *
 * @type {Record<string, string | null>}
 */
const SOUND_MAP = {
  // Game actions
  eat:       eatUrl,
  drink:     drinkUrl,
  coin:      coinUrl,
  levelup:   levelupUrl,
  celebrate: celebrateUrl,
  thought:   thoughtUrl,
  rest:      restUrl,
  // UI interactions
  click:     clickUrl,
  toggle:    toggleUrl,
  open:      openUrl,
  close:     closeUrl,
  error:     errorUrl,
  // Pet & ambient
  meow:      meowUrl,
  campfire:  campfireUrl,
}

// Default volume for each sound (0–1). Override here or via setVolume().
const DEFAULT_VOLUME = {
  // Game actions (−20% from original)
  eat:       0.48,
  drink:     0.44,
  coin:      0.40,
  levelup:   0.60,
  celebrate: 0.52,
  thought:   0.28,
  rest:      0.36,
  // UI interactions
  click:     0.32,
  toggle:    0.32,
  open:      0.36,
  close:     0.32,
  error:     0.40,
  // Pet & ambient
  meow:      0.48,
  campfire:  0.25,   // proximity audio — keep relatively quiet
}

// ─────────────────────────────────────────────────────────────

export function useSoundManager() {
  // Pool of pre-created Audio instances keyed by sound id
  const audioPoolRef  = useRef({})
  // Has the browser unlocked audio via a user gesture?
  const unlockedRef   = useRef(false)
  // Queue of sounds that fired before the browser unlocked
  const pendingRef    = useRef([])

  const [muted,    setMuted]    = useState(false)
  const [volume,   setVolumeState] = useState(1.0)   // master volume multiplier
  const mutedRef   = useRef(false)
  const volumeRef  = useRef(1.0)

  useEffect(() => { mutedRef.current  = muted  }, [muted])
  useEffect(() => { volumeRef.current = volume }, [volume])

  // ── Preload all non-null sounds on mount ─────────────────────
  useEffect(() => {
    Object.entries(SOUND_MAP).forEach(([id, url]) => {
      if (!url) return
      try {
        const audio = new Audio(url)
        audio.preload = 'auto'
        audio.volume  = (DEFAULT_VOLUME[id] ?? 0.6) * volumeRef.current
        audioPoolRef.current[id] = audio
      } catch (e) {
        console.warn(`[useSoundManager] Failed to preload sound "${id}":`, e)
      }
    })
  }, [])

  // ── Unlock audio on first user gesture ───────────────────────
  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return
      unlockedRef.current = true
      // Drain the queue
      pendingRef.current.forEach(id => _playNow(id))
      pendingRef.current = []
      document.removeEventListener('click',     unlock)
      document.removeEventListener('keydown',   unlock)
      document.removeEventListener('touchstart', unlock)
    }
    document.addEventListener('click',      unlock, { once: true })
    document.addEventListener('keydown',    unlock, { once: true })
    document.addEventListener('touchstart', unlock, { once: true })
    return () => {
      document.removeEventListener('click',      unlock)
      document.removeEventListener('keydown',    unlock)
      document.removeEventListener('touchstart', unlock)
    }
  }, [])

  // ── Internal: actually play a sound ──────────────────────────
  const _playNow = useCallback((id) => {
    if (mutedRef.current) return
    const audio = audioPoolRef.current[id]
    if (!audio) return   // sound file not yet added — silently skip
    try {
      audio.currentTime = 0
      audio.volume = (DEFAULT_VOLUME[id] ?? 0.6) * volumeRef.current
      audio.play().catch(() => {/* ignore AbortError from rapid replays */})
    } catch (e) {
      console.warn(`[useSoundManager] Could not play "${id}":`, e)
    }
  }, [])

  // ── Public: play(id) ─────────────────────────────────────────
  const play = useCallback((id) => {
    if (!unlockedRef.current) {
      // Queue it — will fire once the browser unlocks
      pendingRef.current.push(id)
      return
    }
    _playNow(id)
  }, [_playNow])

  // ── Public: setVolume(0–1) ────────────────────────────────────
  const setVolume = useCallback((v) => {
    const clamped = Math.max(0, Math.min(1, v))
    setVolumeState(clamped)
    volumeRef.current = clamped
    // Update all live audio instances
    Object.entries(audioPoolRef.current).forEach(([id, audio]) => {
      audio.volume = (DEFAULT_VOLUME[id] ?? 0.6) * clamped
    })
  }, [])

  // ── Public: toggleMute() ──────────────────────────────────────
  const toggleMute = useCallback(() => {
    setMuted(m => {
      mutedRef.current = !m
      return !m
    })
  }, [])

  return { play, setVolume, volume, muted, toggleMute }
}
