import { useState, useEffect, useRef } from 'react'
import { signOut } from 'firebase/auth'
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import Pet from '../components/Pet'
import PomodoroTimer from '../components/PomodoroTimer'
import ActivityLog from '../components/ActivityLog'
import { EXP_PER_LEVEL, PLAY_EXP_REWARD, ABILITIES } from '../levelConfig'
import { WORLD_PROPS } from '../worldData'
import { useSoundManager }     from '../hooks/useSoundManager'
import { useMood }             from '../hooks/useMood'
import ShopModal, { SHOP_ITEMS, ANIMATION_ITEMS, PROGRESSION_ORDER } from '../components/ShopModal'
import './Game.css'

// ── PST date helpers ──────────────────────────────────────────
function getPSTDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
}
function getPSTISODate() {
  const d = getPSTDate()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function getWeekDates() {
  const pst = getPSTDate()
  const dow = pst.getDay() // 0=Sun
  const monday = new Date(pst)
  monday.setDate(pst.getDate() - ((dow + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    }
  })
}

const STORAGE_KEY = 'virtualpet_progression'

function loadProgression() {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    return s ? JSON.parse(s) : null
  } catch { return null }
}

const DEFAULT_PET = {
  name: 'Harold',
  hunger: 80,
  thirst: 80,
  energy: 80,
  happiness: 80,
  coins: 0,
  experience: 0,
  level: 1,
  lastLoginDate: null,
  loginStreak: 0,
  ownedItems: [],
  unlockedAreas: [0],   // area 0 (bottom-left) always unlocked
  lastFed: null,
  lastWatered: null,
  activities: [],
  lastSeenVarun: null,
  lastSeenGF: null,
  todayStudySessions: 0,
  lastStudyDate: null,
  unlockedAnimations: [],
}

function Game({ user }) {
  const _saved = loadProgression()
  // Area 0 (BL) always starts at tier 1; player upgrades it before unlocking area 1
  const [areaTiers, setAreaTiers] = useState(_saved?.areaTiers ?? { 0: 1 })

  const [pet, setPet]                   = useState(DEFAULT_PET)
  const [petKey, setPetKey]             = useState(0)   // increment → forces Pet remount → respawn at SPAWN_X/Y
  const [loading, setLoading]           = useState(true)
  const [activePet, setActivePet]       = useState(() =>
    localStorage.getItem('activePet') || 'harold'
  )
  const [showActions, setShowActions]   = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [feedTrigger,        setFeedTrigger]        = useState(0)
  const [restTrigger,        setRestTrigger]        = useState(0)
  const [waterTrigger,       setWaterTrigger]       = useState(0)
  const [studyTrigger,       setStudyTrigger]       = useState(0)
  const [studyPauseTrigger,  setStudyPauseTrigger]  = useState(0)
  const [studyResumeTrigger, setStudyResumeTrigger] = useState(0)
  const [studyStopTrigger,   setStudyStopTrigger]   = useState(0)
  const [celebrateTrigger,   setCelebrateTrigger]   = useState(0)
  const [greetTrigger,       setGreetTrigger]       = useState(0)
  const [workoutTrigger,     setWorkoutTrigger]     = useState(0)
  const studyStartedRef = useRef(false)  // true once hare has been sent to a tree
  const [showStretchPopup, setShowStretchPopup] = useState(false)
  const [showShop, setShowShop]         = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [upgradedArea, setUpgradedArea] = useState(null)  // areaId that just upgraded → flash

  // ── Thought bubble state ──────────────────────────────────────
  // { message: string, key: number } | null
  // key increments on each new thought to force CSS re-animation even for repeated messages.
  const [thoughtBubble,    setThoughtBubble]    = useState(null)
  const thoughtTimerRef                         = useRef(null)
  const thoughtKeyRef                           = useRef(0)

  // ── Level-up & popup state ────────────────────────────────────
  const [isLevelingUp, setIsLevelingUp]   = useState(false)
  const [showLevelPopup, setShowLevelPopup] = useState(false)

  // ── Ability state ─────────────────────────────────────────────
  const [ghostBudActive, setGhostBudActive] = useState(false)
  const ghostBudTimerRef = useRef(null)
  // Flash fires AFTER the shop closes — store the areaId here during purchase,
  // then trigger setUpgradedArea when the modal's onClose fires.
  const pendingFlashAreaRef = useRef(null)

  // ── Mood system state ─────────────────────────────────────────
  const [lastLevelUp,      setLastLevelUp]      = useState(null)   // Date.now() on level-up
  const [lastPurchase,     setLastPurchase]      = useState(null)   // Date.now() on shop purchase
  const [isPomodoroActive, setIsPomodoroActive]  = useState(false)
  const hasShownLoginThoughtRef = useRef(false)
  const prevMoodRef             = useRef(null)

  // ── Sound manager ─────────────────────────────────────────────
  const { play, stop } = useSoundManager()

  // ── Background music (ambient_day lives in the sound pool, loops forever)
  // Music starts muted; user presses 🔇 to turn it on.
  const [musicMuted, setMusicMuted] = useState(true)
  const toggleMusic = () => {
    if (musicMuted) {
      play('ambient_day')   // first call on this Audio instance — browser allows
      setMusicMuted(false)  // because this runs directly inside a click handler
    } else {
      stop('ambient_day')
      setMusicMuted(true)
    }
  }

  const hasCheckedDaily                 = useRef(false)
  const hasCheckedNotif                 = useRef(false)
  const petRef                          = useRef(pet)
  useEffect(() => { petRef.current = pet }, [pet])

  // ── Workout check-in state ────────────────────────────────────
  const [workoutData,       setWorkoutData]       = useState({ varun: {}, leena: {} })
  const [showWorkoutPopup,  setShowWorkoutPopup]  = useState(false)
  const workoutDataRef      = useRef({ varun: {}, leena: {} })
  const hasShownWorkoutRef  = useRef(false)
  useEffect(() => { workoutDataRef.current = workoutData }, [workoutData])

  // Persist active pet choice
  useEffect(() => {
    localStorage.setItem('activePet', activePet)
    setPetKey(k => k + 1)  // remount so pet respawns fresh on switch
  }, [activePet])

  // ── "While you were away" notification banner ─────────────────
  const [notifBanner, setNotifBanner]   = useState(null)  // null or string message

  // ── Persist local progression to localStorage ─────────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      areaTiers,
      unlockedAreas: pet.unlockedAreas || [0],
      coins: pet.coins || 0,
    }))
  }, [areaTiers, pet.unlockedAreas, pet.coins])

  const userName = user.email.includes('varun') ? 'Varun'
                 : user.email.includes('leena') ? 'Leena'
                 : (user.displayName || user.email.split('@')[0] || 'Tester')

  // ── "While you were away" banner logic ────────────────────────
  // Reads the other user's recent activities vs our lastSeen timestamp,
  // shows a banner, then stamps our lastSeen to now in Firestore.
  // Called once on first Firestore load AND on every tab-visibility change.
  function checkAndShowNotif(petData) {
    const mySeenKey  = userName === 'Varun' ? 'lastSeenVarun' : userName === 'Leena' ? 'lastSeenGF' : `lastSeen_${userName}`
    const otherUser  = userName === 'Varun' ? 'Leena' : 'Varun'
    const lastSeen   = petData[mySeenKey]   // ISO string or null
    const activities = petData.activities || []

    // Find activity from the other user that happened after our last visit
    const newActivity = activities.filter(a => {
      if (a.user !== otherUser) return false
      if (!lastSeen) return false   // first ever visit — no banner, just stamp
      return new Date(a.timestamp) > new Date(lastSeen)
    })

    const studySessions = newActivity.filter(a =>
      a.text.includes('finished a study session')
    ).length
    const totalActions = newActivity.length

    if (totalActions > 0) {
      const msg = studySessions > 0
        ? `${otherUser} completed ${studySessions} study session${studySessions !== 1 ? 's' : ''} while you were away! 📚`
        : `${otherUser} was active while you were away (${totalActions} update${totalActions !== 1 ? 's' : ''})!`
      setNotifBanner(msg)
    }

    // Always stamp our lastSeen so next visit compares from now
    const petDocRef = doc(db, 'pets', 'shared-pet')
    updateDoc(petDocRef, { [mySeenKey]: new Date().toISOString() })
  }

  // Compute level from experience (level 1 = 0–99 exp, level 2 = 100–199, etc.)
  const computeLevel = (exp) => Math.floor((exp || 0) / EXP_PER_LEVEL) + 1

  // Real-time listener
  useEffect(() => {
    const petRef = doc(db, 'pets', 'shared-pet')

    const unsubscribe = onSnapshot(petRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        if (data.name === 'Ellie') {
          updateDoc(petRef, { name: 'Harold' })
          data.name = 'Harold'
        }
        setPet({ ...DEFAULT_PET, ...data })

        // "While you were away" — check once on first load
        if (!hasCheckedNotif.current) {
          hasCheckedNotif.current = true
          checkAndShowNotif(data)
        }

        // Daily login streak — fires once per calendar day, first time pet loads
        if (!hasCheckedDaily.current) {
          hasCheckedDaily.current = true
          const today = new Date().toDateString()
          if (data.lastLoginDate !== today) {
            // Calculate streak: consecutive day = yesterday's date?
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayStr = yesterday.toDateString()
            const prevStreak = data.loginStreak || 0
            const newStreak = data.lastLoginDate === yesterdayStr ? prevStreak + 1 : 1
            updateDoc(petRef, {
              lastLoginDate: today,
              loginStreak: newStreak,
              activities: arrayUnion({
                text: `${userName} logged in — 🔥 ${newStreak} day streak!`,
                user: userName,
                timestamp: new Date().toISOString()
              })
            })
          }
        }
      } else {
        setDoc(petRef, { ...DEFAULT_PET, createdAt: serverTimestamp() })
      }
      setLoading(false)
    }, (error) => {
      console.error('Firestore error:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // ── Workout Firestore listener ────────────────────────────────
  useEffect(() => {
    const workoutsRef = doc(db, 'workouts', 'shared-workouts')
    const unsub = onSnapshot(workoutsRef, (snap) => {
      const data = snap.exists()
        ? { varun: snap.data().varun || {}, leena: snap.data().leena || {} }
        : { varun: {}, leena: {} }
      setWorkoutData(data)
      workoutDataRef.current = data
      // Show popup on first load if past 6pm PST and today not yet logged
      maybeShowWorkoutPopup(data)
    })
    return () => unsub()
  }, [])

  function maybeShowWorkoutPopup(data) {
    if (hasShownWorkoutRef.current) return
    const pst = getPSTDate()
    if (pst.getHours() < 18) return
    const todayISO = getPSTISODate()
    const userKey = userName === 'Varun' ? 'varun' : userName === 'Leena' ? 'leena' : userName.toLowerCase().replace(/\s+/g, '_')
    if ((data[userKey] || {})[todayISO]) return   // already answered
    hasShownWorkoutRef.current = true
    setShowWorkoutPopup(true)
  }

  const handleWorkoutResponse = async (answer) => {
    const todayISO = getPSTISODate()
    const userKey = userName === 'Varun' ? 'varun' : userName === 'Leena' ? 'leena' : userName.toLowerCase().replace(/\s+/g, '_')
    const workoutsRef = doc(db, 'workouts', 'shared-workouts')
    try {
      await updateDoc(workoutsRef, { [`${userKey}.${todayISO}`]: answer })
    } catch {
      // Document doesn't exist yet — create it
      await setDoc(workoutsRef, { varun: {}, leena: {}, [userKey]: { [todayISO]: answer } })
    }
    if (answer === 'yes') setWorkoutTrigger(n => n + 1)   // trigger dumbbell-lift anim if unlocked
    setShowWorkoutPopup(false)
  }

  // ── Tab visibility → "while you were away" banner + Bubby greet ─
  const activePetRef = useRef(activePet)
  useEffect(() => { activePetRef.current = activePet }, [activePet])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAndShowNotif(petRef.current)
        // Bubby runs to center of her area and licks her paw as a greeting
        if (activePetRef.current === 'bubby') {
          setGreetTrigger(n => n + 1)
        }
        // Workout popup check (uses refs so no stale closure issues)
        maybeShowWorkoutPopup(workoutDataRef.current)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Local stat decay
  useEffect(() => {
    const decay = setInterval(() => {
      setPet(prev => ({
        ...prev,
        hunger:    Math.max(0, prev.hunger    - 0.5),
        thirst:    Math.max(0, prev.thirst    - 0.7),
        energy:    Math.max(0, prev.energy    - 0.3),
        happiness: Math.max(0, prev.happiness - 0.4)
      }))
    }, 30000)
    return () => clearInterval(decay)
  }, [])

  // updatePet: coinDelta defaults to 0
  const updatePet = async (updates, activityText, coinDelta = 0) => {
    const petRef = doc(db, 'pets', 'shared-pet')
    setHasInteracted(true)
    const activity = { text: activityText, user: userName, timestamp: new Date().toISOString() }
    try {
      const coinUpdates = coinDelta !== 0
        ? { coins: Math.max(0, (pet.coins || 0) + coinDelta) }
        : {}
      await updateDoc(petRef, { ...updates, ...coinUpdates, activities: arrayUnion(activity), lastInteraction: new Date().toISOString() })
    } catch (err) {
      console.error('Error updating pet:', err)
    }
  }

  // ── Thought bubble helper ─────────────────────────────────────
  // Shows a thought bubble above the pet for ~2 s then clears it.
  const triggerThought = (message) => {
    clearTimeout(thoughtTimerRef.current)
    thoughtKeyRef.current += 1
    setThoughtBubble({ message, key: thoughtKeyRef.current })
    play('thought')
    thoughtTimerRef.current = setTimeout(() => setThoughtBubble(null), 2100)
  }

  // Shows a mood thought bubble (4 s duration — used on login and mood change).
  const triggerMoodThought = (message) => {
    clearTimeout(thoughtTimerRef.current)
    thoughtKeyRef.current += 1
    setThoughtBubble({ message, key: thoughtKeyRef.current })
    play('thought')
    thoughtTimerRef.current = setTimeout(() => setThoughtBubble(null), 4000)
  }

  // Spontaneous thoughts when hunger or thirst drops below 20 %.
  // Fires ~every 20–35 s while the condition holds; clears when fed/watered.
  useEffect(() => {
    const HUNGRY_THRESHOLD = 20
    const THIRSTY_THRESHOLD = 20
    if (pet.hunger >= HUNGRY_THRESHOLD && pet.thirst >= THIRSTY_THRESHOLD) return
    const messages = []
    if (pet.hunger < HUNGRY_THRESHOLD) messages.push('My tummy is grumbling... 🌿')
    if (pet.thirst < THIRSTY_THRESHOLD) messages.push("So thirsty... 💧")
    const pick = messages[Math.floor(Math.random() * messages.length)]
    const delay = 5000 + Math.random() * 15000  // first bubble after 5–20 s
    const t = setTimeout(() => triggerThought(pick), delay)
    return () => clearTimeout(t)
  }, [pet.hunger, pet.thirst])

  const feedPet = () => {
    if (pet.energy <= 20) { triggerThought("Too sleepy to eat... 😴"); return }
    // Just send the hare toward grass — hunger only updates via onAte
    // when the hare actually arrives and finishes eating.
    if (pet.hunger >= 100) return
    setFeedTrigger(n => n + 1)
  }

  // Called by Pet.jsx when the hare completes eating a grass patch.
  // Uses petRef so the value of hunger is always current (not stale closure).
  // Hunger rises by 50 (50% of max) per meal; only fires when real grass was eaten.
  const handleAte = () => {
    const p = petRef.current
    play('eat')
    play('coin')
    updatePet(
      { hunger: Math.min(100, p.hunger + 50), happiness: Math.min(100, p.happiness + 5) },
      `${userName} fed ${p.name} +1 🪙`,
      1
    )
  }

  const waterPet = () => {
    if (pet.energy <= 20) { triggerThought("I'm tired... zzz 💤"); return }
    if (pet.thirst >= 100) return
    play('drink')
    play('coin')
    setWaterTrigger(n => n + 1)
    updatePet(
      { thirst: Math.min(100, pet.thirst + 25), happiness: Math.min(100, pet.happiness + 3) },
      `${userName} gave ${pet.name} water +1 🪙`,
      1
    )
  }

  const playWithPet = async () => {
    if (pet.energy < 10) return

    const currentExp   = pet.experience || 0
    const currentLevel = pet.level || 1
    const newExp       = currentExp + PLAY_EXP_REWARD
    const newLevel     = computeLevel(newExp)
    const didLevelUp   = newLevel > currentLevel

    const statUpdates = {
      happiness:  Math.min(100, pet.happiness + 15),
      energy:     Math.max(0,   pet.energy    - 10),
      hunger:     Math.max(0,   pet.hunger    - 5),
      thirst:     Math.max(0,   pet.thirst    - 8),
      experience: newExp,
      level:      newLevel,
    }

    const activityText = didLevelUp
      ? `${userName} played with ${pet.name} — Level Up! ⭐ Now level ${newLevel}! +1 🪙`
      : `${userName} played with ${pet.name} +1 🪙`

    await updatePet(statUpdates, activityText, 1)

    play('celebrate')
    play('coin')
    if (didLevelUp) play('levelup')
    if (activePet === 'bubby') {
      setTimeout(() => play('cat_purr'), 800)   // start purr 0.8s after play
      setTimeout(() => stop('cat_purr'), 3800)  // stop after ~3s of purring
    }
    setCelebrateTrigger(n => n + 1)   // trigger run→jump animation for Bubby / victory lap for Harold

    if (didLevelUp) {
      setIsLevelingUp(true)
      setLastLevelUp(Date.now())
    }
  }

  // Called by Pet after the 2s level-up flash animation ends
  const handleLevelUpComplete = () => {
    setIsLevelingUp(false)
  }

  // Called when user clicks the hare — show level popup & pause movement
  const handlePetClick = () => {
    if (activePet === 'bubby') play('meow')
    else play('click')
    setShowLevelPopup(true)
  }

  const closeLevelPopup = () => {
    setShowLevelPopup(false)
  }

  const restPet = () => {
    if (pet.energy >= 100) return
    play('rest')
    setRestTrigger(n => n + 1)   // signal Pet to stand still 5s
    updatePet(
      { energy: Math.min(100, pet.energy + 30) },
      `${userName} let ${pet.name} rest +1 🪙`,
      1
    )
  }

  const onPomodoroComplete = () => {
    setIsPomodoroActive(false)
    setHasInteracted(true)
    const today = new Date().toDateString()
    const prevSessions = (pet.lastStudyDate === today) ? (pet.todayStudySessions || 0) : 0
    const newTodaySessions = prevSessions + 1
    updatePet(
      {
        hunger: Math.min(100, pet.hunger + 15),
        happiness: Math.min(100, pet.happiness + 20),
        energy: Math.min(100, pet.energy + 10),
        todayStudySessions: newTodaySessions,
        lastStudyDate: today,
      },
      `${userName} finished a study session — ${pet.name} is proud +10 🪙`,
      10
    )
    // Post-session celebrations
    play('timer_finish')
    play('celebrate')
    play('coin')
    setShowStretchPopup(true)
    setCelebrateTrigger(n => n + 1)
  }

  // ── Study (Pomodoro) hare callbacks ───────────────────────────
  // onStudyStart fires when the timer starts/resumes (work phase only).
  // studyStartedRef tracks whether the hare has already reached a study tree
  // (so subsequent resumes use studyResumeTrigger, not studyTrigger).
  const handleStudyStart = () => {
    setIsPomodoroActive(true)
    if (!studyStartedRef.current) {
      studyStartedRef.current = true
      setStudyTrigger(n => n + 1)   // hare walks to nearest tree
    } else {
      setStudyResumeTrigger(n => n + 1)   // hare already at tree → resume rows 3+4
    }
  }
  const handleStudyPause = () => {
    setIsPomodoroActive(false)
    setStudyPauseTrigger(n => n + 1)
  }
  const handleStudyStop = () => {
    setIsPomodoroActive(false)
    studyStartedRef.current = false
    setStudyStopTrigger(n => n + 1)   // hare returns to idle wander
  }

  const handleStretchYes = () => {
    play('celebrate')
    play('coin')
    updatePet(
      {
        energy:    Math.min(100, pet.energy    + 15),
        happiness: Math.min(100, pet.happiness + 10),
      },
      `${userName} stretched — great break! +15 energy, +10 happiness +5 🪙`,
      5
    )
    setShowStretchPopup(false)
  }

  // ── Ability handlers ──────────────────────────────────────────

  /**
   * useAbility: dispatches the correct handler for a given ability id.
   * Add new cases here as more abilities are introduced.
   */
  const useAbility = (abilityId) => {
    switch (abilityId) {
      case 'ghost_bud':
        activateGhostBud()
        break
      default:
        console.warn(`Unknown ability: ${abilityId}`)
    }
  }

  const activateGhostBud = () => {
    const ability = ABILITIES.find(a => a.id === 'ghost_bud')
    if (!ability) return
    if (ghostBudActive) return  // already active
    setGhostBudActive(true)
    if (ghostBudTimerRef.current) clearTimeout(ghostBudTimerRef.current)
    ghostBudTimerRef.current = setTimeout(() => {
      setGhostBudActive(false)
    }, ability.duration)
  }

  const buyItem = async (itemId) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId)
    if (!item) return
    if ((pet.coins || 0) < item.cost) return

    const isAreaItem = itemId.startsWith('area_')
    const areaId     = isAreaItem ? parseInt(itemId.split('_')[1]) : null
    const unlocked   = pet.unlockedAreas || [0]

    if (isAreaItem) {
      if (unlocked.includes(areaId)) return                  // already unlocked
      if (areaId > 0 && !unlocked.includes(areaId - 1)) return  // must unlock in order
    } else {
      if ((pet.ownedItems || []).includes(itemId)) return
    }

    const petRef = doc(db, 'pets', 'shared-pet')
    try {
      const itemUpdate = isAreaItem
        ? { unlockedAreas: arrayUnion(areaId) }
        : { ownedItems: arrayUnion(itemId) }
      await updateDoc(petRef, {
        coins: (pet.coins || 0) - item.cost,
        ...itemUpdate,
        activities: arrayUnion({
          text: `${userName} unlocked ${item.name} for Harold! 🛍`,
          user: userName,
          timestamp: new Date().toISOString()
        })
      })
      play('coin')
      setLastPurchase(Date.now())
    } catch (err) {
      console.error('Error buying item:', err)
    }
  }

  const buyAnimation = async (animId) => {
    const anim = ANIMATION_ITEMS.find(a => a.id === animId)
    if (!anim) return
    if ((pet.coins || 0) < anim.cost) return
    if (currentLevel < anim.requiredLevel) return
    if ((pet.unlockedAnimations || []).includes(animId)) return
    const petRef = doc(db, 'pets', 'shared-pet')
    try {
      await updateDoc(petRef, {
        coins: (pet.coins || 0) - anim.cost,
        unlockedAnimations: arrayUnion(animId),
        activities: arrayUnion({
          text: `${userName} unlocked ${anim.name} for Bubby! 🎉`,
          user: userName,
          timestamp: new Date().toISOString()
        })
      })
      play('coin')
      setLastPurchase(Date.now())
    } catch (err) {
      console.error('Error buying animation:', err)
    }
  }

  // ── Tier progression ──────────────────────────────────────────
  // Area 0 (BL) is always tier 1 from the start. Progression:
  //   Upgrade area 0 T1→T2, then unlock area 1 at T1, upgrade T1→T2, unlock area 2, etc.
  //   After all 9 areas reach T2 AND all 9 are in Firestore unlockedAreas: offer the path unlock.
  //
  // We require BOTH conditions to prevent stale localStorage data from unlocking
  // the path early when Firestore hasn't confirmed all regions are actually unlocked.
  const MAX_TIER = 2
  const allAreasMaxed = PROGRESSION_ORDER.every(id => (areaTiers[id] ?? 0) >= MAX_TIER)
  const allAreasFirestoreUnlocked = PROGRESSION_ORDER.every(id =>
    id === 0 || (pet.unlockedAreas || [0]).includes(id)
  )
  const canUnlockPath = allAreasMaxed && allAreasFirestoreUnlocked
  const pathUnlocked  = pet.pathUnlocked === true

  function getNextUpgrade() {
    for (let i = 0; i < PROGRESSION_ORDER.length; i++) {
      const areaId     = PROGRESSION_ORDER[i]
      const tier       = areaTiers[areaId] ?? 0
      // Area 0 is pre-unlocked — if somehow tier is 0, treat it as tier 1
      const effectiveTier = (i === 0 && tier === 0) ? 1 : tier
      const isUnlocked    = effectiveTier > 0

      if (!isUnlocked) {
        // Area not yet unlocked — only show if previous area is at MAX_TIER
        const prevArea = PROGRESSION_ORDER[i - 1]
        if ((areaTiers[prevArea] ?? 0) < MAX_TIER) break  // previous not maxed, stop here
        return { type: 'unlock', areaId, cost: 1 }
      }
      if (effectiveTier < MAX_TIER) {
        return { type: 'tier', areaId, fromTier: effectiveTier, toTier: effectiveTier + 1, cost: 1 }
      }
    }
    // All areas at MAX_TIER in both local state AND Firestore — offer the path
    if (canUnlockPath && !pathUnlocked) {
      return { type: 'path', cost: 1 }
    }
    return null
  }

  const handleProgressionPurchase = async () => {
    const next = getNextUpgrade()
    if (!next) return
    if ((pet.coins || 0) < next.cost) return
    const petRef = doc(db, 'pets', 'shared-pet')
    try {
      const areaUpdate = next.type === 'unlock'
        ? { unlockedAreas: arrayUnion(next.areaId) }
        : next.type === 'path'
          ? { pathUnlocked: true }
          : {}
      const activityText = next.type === 'unlock'
        ? `${userName} unlocked area ${next.areaId}! 🗺️`
        : next.type === 'path'
          ? `${userName} unlocked the world path! 🛤️`
          : `${userName} upgraded area ${next.areaId} to tier ${next.toTier}! ⭐`
      await updateDoc(petRef, {
        coins: (pet.coins || 0) - next.cost,
        ...areaUpdate,
        activities: arrayUnion({ text: activityText, user: userName, timestamp: new Date().toISOString() })
      })
      play('coin')
      play('unlock_area')
      setLastPurchase(Date.now())
      if (next.type === 'unlock') {
        setAreaTiers(prev => ({ ...prev, [next.areaId]: 1 }))
        pendingFlashAreaRef.current = next.areaId   // fires when shop closes
      } else if (next.type === 'tier') {
        setAreaTiers(prev => ({ ...prev, [next.areaId]: next.toTier }))
        pendingFlashAreaRef.current = next.areaId   // fires when shop closes
      }
      // path: pathUnlocked derives from areaTiers in Firestore; pet state will update via onSnapshot
    } catch (err) {
      console.error('Progression purchase error:', err)
    }
  }

  const clearActivity = async () => {
    const petRef = doc(db, 'pets', 'shared-pet')
    try { await updateDoc(petRef, { activities: [] }) }
    catch (err) { console.error('Error clearing activity:', err) }
  }

  const resetGame = async () => {
    const petDocRef     = doc(db, 'pets',     'shared-pet')
    const workoutsRef   = doc(db, 'workouts', 'shared-workouts')
    try {
      await setDoc(petDocRef,   { ...DEFAULT_PET, createdAt: serverTimestamp() })
      await setDoc(workoutsRef, { varun: {}, leena: {} })
      // Reset local tier state and wipe persisted progression from localStorage
      setAreaTiers({ 0: 1 })
      localStorage.removeItem(STORAGE_KEY)
      setShowResetConfirm(false)
      setGhostBudActive(false)
      setIsLevelingUp(false)
      studyStartedRef.current = false
      hasShownWorkoutRef.current = false   // allow popup to re-appear after reset
      setPetKey(k => k + 1)   // force Pet remount → hare respawns in BL area
    } catch (err) {
      console.error('Reset error:', err)
    }
  }

  const handleLogout = async () => {
    try { await signOut(auth) }
    catch (err) { console.error('Logout error:', err) }
  }

  // ── Mood hook ─────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { mood, emoji: moodEmoji, label: moodLabel, message: moodMessage } = useMood({
    hunger:          pet.hunger,
    thirst:          pet.thirst,
    energy:          pet.energy,
    happiness:       pet.happiness,
    isPomodoro:      isPomodoroActive,
    lastLevelUp,
    lastPurchase,
    lastInteraction: pet.lastInteraction ?? null,
  })

  // ── Show thought bubble on first login ────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (loading) return
    if (hasShownLoginThoughtRef.current) return
    hasShownLoginThoughtRef.current = true
    const t = setTimeout(() => triggerMoodThought(moodMessage), 1500)
    return () => clearTimeout(t)
  // moodMessage intentionally excluded — we want the message captured at login time
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  // ── Re-trigger thought bubble when mood changes to 'lonely' ──
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (loading) return
    if (!hasShownLoginThoughtRef.current) return
    if (mood === 'lonely' && prevMoodRef.current !== 'lonely') {
      triggerMoodThought(moodMessage)
    }
    prevMoodRef.current = mood
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, loading])

  if (loading) {
    return (
      <div className="loading-screen">
        <p className="loading-text">Finding Harold...</p>
      </div>
    )
  }

  const currentLevel = pet.level || 1
  const currentExp   = pet.experience || 0
  const expInLevel   = currentExp % EXP_PER_LEVEL
  const expPct       = Math.round((expInLevel / EXP_PER_LEVEL) * 100)

  // ── Daily study goal (seeded by date, changes each day) ──────
  const _today = new Date()
  const _seed  = _today.getFullYear() * 10000 + (_today.getMonth() + 1) * 100 + _today.getDate()
  const dailyGoal = 2 + (_seed % 3)  // 2, 3, or 4 depending on the day
  const todayStr  = _today.toDateString()
  const todaySessions = (pet.lastStudyDate === todayStr) ? (pet.todayStudySessions || 0) : 0

  // Show tier-1 props for any area that's Firestore-unlocked but not yet in the new tier system.
  const visibleProps = WORLD_PROPS.filter(p => {
    const areaTier = areaTiers[p.areaId] ?? ((pet.unlockedAreas || [0]).includes(p.areaId) ? 1 : 0)
    return (p.tier ?? 1) <= areaTier
  })

  return (
    <div className="game">

      {/* Header */}
      <header className="game-header">
        <h1 className="game-title">Virtual Pet v1</h1>
        <div className="header-right">
          <span className="coin-badge">🪙 {pet.coins || 0}</span>
          <span className="streak-badge" title="Login streak">🔥 {pet.loginStreak || 0}</span>
          <span className="user-badge">
            {userName === 'Varun' ? '💙' : userName === 'Leena' ? '💖' : '🧪'} {userName}
          </span>
          <button
            className="pet-toggle-btn"
            onClick={() => setActivePet(p => p === 'harold' ? 'bubby' : 'harold')}
            title="Switch active pet"
          >
            {activePet === 'harold' ? '🐱 Play as Bubby' : '🐰 Play as Harold'}
          </button>
          <button
            className="music-toggle-btn"
            onClick={toggleMusic}
            title={musicMuted ? 'Turn on music' : 'Turn off music'}
          >{musicMuted ? '🔇' : '🎵'}</button>
          <button className="reset-btn" onClick={() => setShowResetConfirm(true)} title="Reset game state">↺ Reset</button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="reset-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="reset-modal" onClick={e => e.stopPropagation()}>
            <h3 className="reset-modal-title">Reset Game?</h3>
            <p className="reset-modal-body">
              This will reset all stats, coins, owned items and unlocked areas back to defaults. Cannot be undone.
            </p>
            <div className="reset-modal-actions">
              <button className="reset-confirm-btn" onClick={resetGame}>Yes, Reset</button>
              <button className="reset-cancel-btn" onClick={() => setShowResetConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* "While you were away" notification banner */}
      {notifBanner && (
        <div className="notif-banner" role="status">
          <span className="notif-banner-msg">{notifBanner}</span>
          <button
            className="notif-banner-close"
            aria-label="Dismiss"
            onClick={() => setNotifBanner(null)}
          >✕</button>
        </div>
      )}

      {/* World — constrained + centered */}
      <div className="world-full">
        <Pet
          key={petKey}
          pet={pet}
          hasInteracted={hasInteracted}
          feedTrigger={feedTrigger}
          restTrigger={restTrigger}
          waterTrigger={waterTrigger}
          studyTrigger={studyTrigger}
          studyPauseTrigger={studyPauseTrigger}
          studyResumeTrigger={studyResumeTrigger}
          studyStopTrigger={studyStopTrigger}
          celebrateTrigger={celebrateTrigger}
          unlockedAreas={pet.unlockedAreas || [0]}
          visibleProps={visibleProps}
          onAte={handleAte}
          level={currentLevel}
          isLevelingUp={isLevelingUp}
          onLevelUpComplete={handleLevelUpComplete}
          onPetClick={handlePetClick}
          isPaused={showLevelPopup || showWorkoutPopup}
          ghostBudActive={ghostBudActive}
          showLevelPopup={showLevelPopup}
          onCloseLevelPopup={closeLevelPopup}
          expInLevel={expInLevel}
          expPct={expPct}
          expPerLevel={EXP_PER_LEVEL}
          pathVisible={pet.pathUnlocked === true}
          areaTiers={areaTiers}
          upgradedArea={upgradedArea}
          petType={activePet}
          petHunger={pet.hunger}
          greetTrigger={greetTrigger}
          workoutTrigger={workoutTrigger}
          thoughtBubble={thoughtBubble}
          unlockedAnimations={pet.unlockedAnimations || []}
        />
      </div>

      {/* Bottom panels */}
      <div className="game-bottom">

        {/* Left: circular stats + actions + shop toggles */}
        <div className="stats-panel">
          <div className="circ-stats">
            <CircStat label="Hunger"    value={pet.hunger}    color="#e74c3c" emoji="🍎" />
            <CircStat label="Thirst"    value={pet.thirst}    color="#3498db" emoji="💧" />
            <CircStat label="Energy"    value={pet.energy}    color="#f39c12" emoji="⚡" />
            <CircStat label="Happiness" value={pet.happiness} color="#2ecc71" emoji="💚" />
          </div>
          <div className="mood-badge">
            <span className="mood-badge-emoji">{moodEmoji}</span>
            <span className="mood-badge-label">{moodLabel}</span>
          </div>

          <div className="actions-section">
            <button className="actions-toggle-btn" onClick={() => { play('toggle'); setShowActions(s => !s) }}>
              {showActions ? '▲ Close' : '🎮 Interact with Harold'}
            </button>
            {showActions && (
              <div className="actions-container">
                {/* Core actions */}
                <div className="actions">
                  <button className="action-btn feed"  onClick={feedPet}>🍎 Feed</button>
                  <button className="action-btn water" onClick={waterPet}>💧 Water</button>
                  <button className="action-btn play"  onClick={playWithPet}>🎾 Play</button>
                  <button className="action-btn rest"  onClick={restPet}>😴 Rest</button>
                </div>

                {/* Abilities section */}
                {ABILITIES.length > 0 && (
                  <div className="abilities-section">
                    <div className="abilities-label">✨ Abilities</div>
                    <div className="abilities-list">
                      {ABILITIES.map(ability => {
                        const unlocked = currentLevel >= ability.requiredLevel
                        const isActive = ability.id === 'ghost_bud' && ghostBudActive
                        return (
                          <div
                            key={ability.id}
                            className={`ability-item${unlocked ? '' : ' ability-locked'}${isActive ? ' ability-active' : ''}`}
                          >
                            <span className="ability-icon">{unlocked ? ability.icon : '🔒'}</span>
                            <div className="ability-info">
                              <span className="ability-name">{ability.name}</span>
                              <span className="ability-desc">
                                {unlocked
                                  ? (isActive ? 'Active…' : ability.desc)
                                  : `Unlocks at level ${ability.requiredLevel}`}
                              </span>
                            </div>
                            <button
                              className={`ability-btn${unlocked && !isActive ? '' : ' disabled'}`}
                              onClick={() => unlocked && !isActive && useAbility(ability.id)}
                              disabled={!unlocked || isActive}
                            >
                              {isActive ? '✓ Active' : unlocked ? 'Use' : `Lv.${ability.requiredLevel}`}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Shop button — opens modal */}
          <div className="shop-section">
            <button className="shop-toggle-btn" onClick={() => { play('open'); setShowShop(true) }}>
              🛍 Shop  ·  🪙 {pet.coins || 0}
            </button>
          </div>
        </div>

        {/* Right: Pomodoro + Activity toggle */}
        <div className="right-panel">
          <PomodoroTimer
            onComplete={onPomodoroComplete}
            userName={userName}
            onStudyStart={handleStudyStart}
            onStudyPause={handleStudyPause}
            onStudyStop={handleStudyStop}
            dailyGoal={dailyGoal}
            todaySessions={todaySessions}
          />

          <WorkoutGrid workoutData={workoutData} />

          <div className="activity-section">
            <div className="activity-header-row">
              <button className="activity-toggle-btn" onClick={() => setShowActivity(s => !s)}>
                {showActivity ? '▲ Hide Log' : '📋 Activity Log'}
              </button>
              {showActivity && (pet.activities?.length > 0) && (
                <button className="clear-activity-btn" onClick={clearActivity}>Clear</button>
              )}
            </div>
            {showActivity && <ActivityLog activities={pet.activities || []} />}
          </div>
        </div>

      </div>

      {/* ── Stretch Popup ──────────────────────────────────────── */}
      {showStretchPopup && (
        <div className="stretch-overlay" onClick={() => setShowStretchPopup(false)}>
          <div className="stretch-modal" onClick={e => e.stopPropagation()}>
            <div className="stretch-harold">🐰</div>
            <h3 className="stretch-title">Harold wants to stretch!</h3>
            <p className="stretch-body">Did you stand up and take a breather?</p>
            <div className="stretch-actions">
              <button className="stretch-btn stretch-yes" onClick={handleStretchYes}>
                Yes! 🙆 <span className="stretch-bonus">+15 energy · +10 happiness · +5 🪙</span>
              </button>
              <button className="stretch-btn stretch-no" onClick={() => setShowStretchPopup(false)}>
                Not yet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Workout Check-in Popup (from Bubby) ───────────────── */}
      {showWorkoutPopup && (
        <div className="workout-overlay">
          <div className="workout-modal">
            <div className="workout-bubby">🐱</div>
            <h3 className="workout-title">Bubby wants to know…</h3>
            <p className="workout-body">Did you work out today?</p>
            <div className="workout-actions">
              <button className="workout-btn workout-yes" onClick={() => handleWorkoutResponse('yes')}>
                Yes! 💪
              </button>
              <button className="workout-btn workout-no" onClick={() => handleWorkoutResponse('no')}>
                Not today 😔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Shop Modal ─────────────────────────────────────────── */}
      {showShop && (
        <ShopModal
          pet={pet}
          coins={pet.coins || 0}
          areaTiers={areaTiers}
          unlockedAreas={pet.unlockedAreas || [0]}
          getNextUpgrade={getNextUpgrade}
          canUnlockPath={canUnlockPath}
          onBuy={handleProgressionPurchase}
          pathUnlocked={pet.pathUnlocked === true}
          onBuyItem={buyItem}
          onBuyAnimation={buyAnimation}
          currentLevel={currentLevel}
          onClose={() => {
            play('close')
            setShowShop(false)
            // Trigger upgrade flash now that the shop is closed
            if (pendingFlashAreaRef.current !== null) {
              setUpgradedArea(pendingFlashAreaRef.current)
              pendingFlashAreaRef.current = null
              setTimeout(() => setUpgradedArea(null), 3000)
            }
          }}
        />
      )}
    </div>
  )
}

// ── Workout weekly grid ───────────────────────────────────────────────────────
function WorkoutGrid({ workoutData }) {
  const weekDates = getWeekDates()

  const renderCell = (log, iso) => {
    const val = (log || {})[iso]
    if (val === 'yes') return '✓'
    if (val === 'no')  return '✗'
    return ''
  }

  const cellClass = (log, iso) => {
    const val = (log || {})[iso]
    return `workout-cell ${val === 'yes' ? 'yes' : val === 'no' ? 'no' : 'empty'}`
  }

  return (
    <div className="workout-grid-section">
      <div className="workout-grid-title">💪 Weekly Workouts</div>
      <table className="workout-grid-table">
        <thead>
          <tr>
            <th className="workout-grid-name-col"></th>
            {weekDates.map(({ label }) => (
              <th key={label} className="workout-grid-day-hdr">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { key: 'varun', label: 'Varun' },
            { key: 'leena', label: 'Leena' },
            ...Object.keys(workoutData || {})
              .filter(k => k !== 'varun' && k !== 'leena')
              .map(k => ({ key: k, label: `🧪 ${k.charAt(0).toUpperCase() + k.slice(1)}` }))
          ].map(({ key, label }) => (
            <tr key={key}>
              <td className="workout-grid-name-col">{label}</td>
              {weekDates.map(({ iso }) => (
                <td key={iso} className={cellClass(workoutData[key], iso)}>
                  {renderCell(workoutData[key], iso)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Circular progress stat
function CircStat({ label, value, color, emoji }) {
  const r    = 22
  const circ = 2 * Math.PI * r
  const pct  = Math.max(0, Math.min(100, value))
  const offset = circ * (1 - pct / 100)

  return (
    <div className="circ-stat">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#E8E8E8" strokeWidth="6" />
        <circle
          cx="32" cy="32" r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '32px 32px', transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x="32" y="37" textAnchor="middle" fontSize="18" dominantBaseline="middle">{emoji}</text>
      </svg>
      <span className="circ-label">{label}</span>
      <span className="circ-value">{Math.round(pct)}%</span>
    </div>
  )
}

export default Game
