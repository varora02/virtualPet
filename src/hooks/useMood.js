/**
 * useMood — derives the pet's current mood from game state.
 *
 * Priority order (highest wins):
 *   excited > focused > grumpy > lonely > hungry > thirsty > sleepy > energetic > playful > content
 */
import { useMemo } from 'react'

function getPSTHour() {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  ).getHours()
}

const FIVE_MIN_MS    = 5 * 60 * 1000
const TWENTY_FOUR_H  = 24 * 60 * 60 * 1000

const MOOD_MESSAGES = {
  lonely:    ["I missed you... 🥺", "Where have you been?", "It's been so quiet..."],
  excited:   ["We leveled up!! 🎉", "WOOHOO!!"],
  grumpy:    ["I'm not happy right now... 😾", "Feed me. Now."],
  sleepy:    ["zzz... so tired...", "I could really use a nap 😴"],
  playful:   ["Let's play! 🎮", "I'm feeling bouncy today!"],
  energetic: ["I have SO much energy!", "Let's go!!  ⚡"],
  hungry:    ["My tummy is rumbling... 🍽️"],
  thirsty:   ["Water... please... 💧"],
  focused:   ["Shh... studying mode 📚"],
  content:   ["Life is good 😊", "All is well~"],
}

// Ordered from highest to lowest priority
const MOODS = [
  {
    key: 'excited', emoji: '🎉', label: 'Excited',
    check({ lastLevelUp, lastPurchase }) {
      const now = Date.now()
      return (lastLevelUp  && now - lastLevelUp  < FIVE_MIN_MS)
          || (lastPurchase && now - lastPurchase < FIVE_MIN_MS)
    },
  },
  {
    key: 'focused', emoji: '📚', label: 'Focused',
    check({ isPomodoro }) { return !!isPomodoro },
  },
  {
    key: 'grumpy', emoji: '😾', label: 'Grumpy',
    check({ hunger, thirst, happiness }) {
      return hunger < 20 || thirst < 20 || happiness < 20
    },
  },
  {
    key: 'lonely', emoji: '🥺', label: 'Lonely',
    check({ lastInteraction }) {
      if (!lastInteraction) return false
      const ts = typeof lastInteraction === 'string'
        ? new Date(lastInteraction).getTime()
        : lastInteraction
      return !isNaN(ts) && Date.now() - ts > TWENTY_FOUR_H
    },
  },
  {
    key: 'hungry', emoji: '🍽️', label: 'Hungry',
    check({ hunger }) { return hunger < 30 },
  },
  {
    key: 'thirsty', emoji: '💧', label: 'Thirsty',
    check({ thirst }) { return thirst < 30 },
  },
  {
    key: 'sleepy', emoji: '😴', label: 'Sleepy',
    check({ energy }) {
      const h = getPSTHour()
      return energy < 30 || h >= 22 || h < 7
    },
  },
  {
    key: 'energetic', emoji: '⚡', label: 'Energetic',
    check({ energy, happiness }) { return energy > 80 && happiness > 70 },
  },
  {
    key: 'playful', emoji: '🎮', label: 'Playful',
    check({ happiness }) { return happiness > 80 },
  },
  {
    key: 'content', emoji: '😊', label: 'Content',
    check() { return true },
  },
]

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * @param {{ hunger, thirst, energy, happiness, isPomodoro, lastLevelUp, lastPurchase, lastInteraction }} params
 * @returns {{ mood: string, emoji: string, label: string, message: string }}
 */
export function useMood({ hunger, thirst, energy, happiness, isPomodoro, lastLevelUp, lastPurchase, lastInteraction }) {
  return useMemo(() => {
    const params = { hunger, thirst, energy, happiness, isPomodoro, lastLevelUp, lastPurchase, lastInteraction }
    const matched = MOODS.find(m => m.check(params)) ?? MOODS[MOODS.length - 1]
    const messages = MOOD_MESSAGES[matched.key] ?? ['...']
    return {
      mood:    matched.key,
      emoji:   matched.emoji,
      label:   matched.label,
      message: pickRandom(messages),
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hunger, thirst, energy, happiness, isPomodoro, lastLevelUp, lastPurchase, lastInteraction])
}
