import { useState, useEffect, useRef } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import './PomodoroTimer.css'

const WORK_MIN = 25
const WORK_SEC = WORK_MIN * 60
const BREAK_SEC = 5 * 60

/**
 * PomodoroTimer — Firestore-driven shared study session timer.
 *
 * Work session state lives in Firestore (pets/shared-pet.activeSession) so
 * both users see the same timer in real-time. Break is always local — it's
 * a personal cooldown after the shared work session ends.
 *
 * Only the session starter (startedBy === userName) can pause / reset.
 * The partner can see the timer ticking but controls are disabled.
 *
 * When the timer reaches 0:
 *   - Starter: onComplete() fires → normal XP/coin reward in Game.jsx
 *   - Partner: onPartnerComplete() fires → flat coin bonus in Game.jsx
 */
function PomodoroTimer({
  db,
  userName,
  activeSession,          // { startedBy, startedAt, participants, pausedAt, totalPausedMs, status } | null
  onComplete       = null,  // starter reward — fires when work finishes
  onPartnerComplete = null, // partner reward — fires when starter's session completes
  onStudyStart     = null,
  onStudyPause     = null,
  onStudyStop      = null,
  dailyGoal        = null,
  todaySessions    = 0,
}) {
  const petDocRef = db ? doc(db, 'pets', 'shared-pet') : null

  // ── Break is always local ─────────────────────────────────────
  const [isBreak,           setIsBreak]        = useState(false)
  const [breakTimeLeft,     setBreakTimeLeft]  = useState(BREAK_SEC)
  const [breakRunning,      setBreakRunning]   = useState(false)
  const [sessionsCompleted, setSessions]       = useState(0)
  const breakIntervalRef = useRef(null)

  // Track previous Firestore status to detect transitions
  const prevStatusRef     = useRef(null)
  const completeCalledRef = useRef(false)  // guard double-fire

  // ── Derived from Firestore ────────────────────────────────────
  const sessionStatus = activeSession?.status ?? null
  const isMySession   = activeSession?.startedBy === userName
  const isParticipant = activeSession?.participants?.includes(userName) ?? false
  const partnerName   = activeSession?.participants?.find(p => p !== userName) ?? null
  const canControl    = !activeSession || isMySession

  // ── Compute remaining work seconds ───────────────────────────
  const getWorkTimeLeft = () => {
    if (!activeSession) return WORK_SEC
    const durSec     = (activeSession.durationMin || WORK_MIN) * 60
    const totalPaused = activeSession.totalPausedMs || 0

    if (!activeSession.startedAt?.toMillis) return durSec

    let elapsed = 0
    if (sessionStatus === 'running') {
      elapsed = Math.floor((Date.now() - activeSession.startedAt.toMillis() - totalPaused) / 1000)
    } else if (sessionStatus === 'paused' && activeSession.pausedAt?.toMillis) {
      elapsed = Math.floor(
        (activeSession.pausedAt.toMillis() - activeSession.startedAt.toMillis() - totalPaused) / 1000
      )
    } else if (sessionStatus === 'completed') {
      return 0
    }
    return Math.max(0, durSec - elapsed)
  }

  const [workTimeLeft, setWorkTimeLeft] = useState(WORK_SEC)

  // Tick the work timer every second while running
  useEffect(() => {
    if (sessionStatus !== 'running' || isBreak) {
      setWorkTimeLeft(getWorkTimeLeft())
      return
    }
    const id = setInterval(() => {
      const tl = getWorkTimeLeft()
      setWorkTimeLeft(tl)
      if (tl <= 0) {
        clearInterval(id)
        triggerWorkComplete()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [activeSession, sessionStatus, isBreak])

  // Snap workTimeLeft whenever session object changes (pause/resume sync)
  useEffect(() => {
    setWorkTimeLeft(getWorkTimeLeft())
  }, [activeSession])

  // ── Detect status transitions ─────────────────────────────────
  useEffect(() => {
    const prev = prevStatusRef.current
    prevStatusRef.current = sessionStatus

    if (prev === 'running' && sessionStatus === 'completed') {
      if (!isMySession && isParticipant) {
        // Partner: grant flat bonus
        onPartnerComplete?.()
      }
    }
  }, [sessionStatus])

  // ── Work complete handler ─────────────────────────────────────
  const triggerWorkComplete = () => {
    if (completeCalledRef.current) return
    completeCalledRef.current = true

    if (isMySession && petDocRef) {
      // Starter marks session completed in Firestore, then clears after 3 s
      updateDoc(petDocRef, { 'activeSession.status': 'completed' })
        .then(() => setTimeout(() => updateDoc(petDocRef, { activeSession: null }), 3000))
        .catch(console.error)
      onComplete?.()
      onStudyStop?.()
    }

    setSessions(n => n + 1)
    setIsBreak(true)
    setBreakTimeLeft(BREAK_SEC)
    setBreakRunning(false)

    // Reset guard after a beat so a fresh session can fire again
    setTimeout(() => { completeCalledRef.current = false }, 5000)
  }

  // ── Break timer (local only) ──────────────────────────────────
  useEffect(() => {
    if (breakRunning && breakTimeLeft > 0) {
      breakIntervalRef.current = setInterval(() => setBreakTimeLeft(t => t - 1), 1000)
    } else if (isBreak && breakTimeLeft === 0) {
      clearInterval(breakIntervalRef.current)
      setIsBreak(false)
      setBreakTimeLeft(BREAK_SEC)
      setBreakRunning(false)
    }
    return () => clearInterval(breakIntervalRef.current)
  }, [breakRunning, breakTimeLeft, isBreak])

  // ── Firestore writes (starter only) ──────────────────────────
  const startSession = async () => {
    if (!petDocRef) return
    await updateDoc(petDocRef, {
      activeSession: {
        startedBy:     userName,
        startedAt:     serverTimestamp(),
        durationMin:   WORK_MIN,
        participants:  [userName],
        pausedAt:      null,
        totalPausedMs: 0,
        status:        'running',
      }
    }).catch(console.error)
    onStudyStart?.()
  }

  const pauseSession = async () => {
    if (!petDocRef || !isMySession) return
    await updateDoc(petDocRef, {
      'activeSession.status':   'paused',
      'activeSession.pausedAt': serverTimestamp(),
    }).catch(console.error)
    onStudyPause?.()
  }

  const resumeSession = async () => {
    if (!petDocRef || !isMySession || !activeSession.pausedAt?.toMillis) return
    const extraPausedMs = Date.now() - activeSession.pausedAt.toMillis()
    await updateDoc(petDocRef, {
      'activeSession.status':        'running',
      'activeSession.pausedAt':      null,
      'activeSession.totalPausedMs': (activeSession.totalPausedMs || 0) + extraPausedMs,
    }).catch(console.error)
    onStudyStart?.()   // reuses handleStudyStart which handles resume internally
  }

  const stopSession = async () => {
    if (!petDocRef || !isMySession) return
    await updateDoc(petDocRef, { activeSession: null }).catch(console.error)
    onStudyStop?.()
  }

  // ── Toggle / Reset ────────────────────────────────────────────
  const handleToggle = () => {
    if (isBreak) { setBreakRunning(r => !r); return }
    if (!activeSession)                  return startSession()
    if (sessionStatus === 'running')     return pauseSession()
    if (sessionStatus === 'paused')      return resumeSession()
  }

  const handleReset = () => {
    if (isBreak) {
      clearInterval(breakIntervalRef.current)
      setIsBreak(false); setBreakTimeLeft(BREAK_SEC); setBreakRunning(false)
      return
    }
    stopSession()
  }

  // ── Render helpers ────────────────────────────────────────────
  const isRunning     = isBreak ? breakRunning : sessionStatus === 'running'
  const timeLeft      = isBreak ? breakTimeLeft : workTimeLeft
  const minutes       = Math.floor(timeLeft / 60)
  const seconds       = timeLeft % 60
  const totalDuration = isBreak ? BREAK_SEC : WORK_SEC
  const progress      = ((totalDuration - timeLeft) / totalDuration) * 100

  const startLabel = activeSession && !isBreak
    ? (sessionStatus === 'paused' ? '▶ Resume' : '▶ Start')
    : '▶ Start'

  return (
    <div className={`pomodoro ${isBreak ? 'break-mode' : 'work-mode'}`}>
      <h3 className="pomodoro-title">
        {isBreak ? '☕ Break Time' : '📚 Study Session'}
      </h3>

      {dailyGoal !== null && (
        <div className={`daily-goal${todaySessions >= dailyGoal ? ' daily-goal--done' : ''}`}>
          🎯 Today&apos;s goal: {Math.min(todaySessions, dailyGoal)}/{dailyGoal}
          {todaySessions >= dailyGoal
            ? ' 🎉 Goal reached!'
            : ` · ${dailyGoal - todaySessions} to go`}
        </div>
      )}

      {/* Partner indicator — visible to both */}
      {partnerName && !isBreak && (
        <div className="partner-studying">
          💖 {partnerName} is studying with you!
        </div>
      )}

      {/* Partner view: starter controls are grayed out */}
      {!canControl && activeSession && (
        <div className="partner-session-label">
          {activeSession.startedBy}&apos;s session
        </div>
      )}

      <div className="timer-ring">
        <svg viewBox="0 0 120 120" className="timer-svg">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke={isBreak ? '#2ecc71' : '#667eea'}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="timer-display">
          <span className="timer-time">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="timer-controls">
        <button
          className={`timer-btn ${isRunning ? 'pause' : 'start'}${!canControl ? ' disabled' : ''}`}
          onClick={canControl ? handleToggle : undefined}
          disabled={!canControl}
          title={!canControl ? `Controlled by ${activeSession?.startedBy}` : undefined}
        >
          {isRunning ? '⏸ Pause' : startLabel}
        </button>
        <button
          className={`timer-btn reset${!canControl ? ' disabled' : ''}`}
          onClick={canControl ? handleReset : undefined}
          disabled={!canControl}
        >
          🔄 Reset
        </button>
      </div>

      <div className="sessions-count">
        🏆 Sessions completed: <strong>{sessionsCompleted}</strong>
      </div>

      <p className="pomodoro-tip">
        {isBreak
          ? 'Take a breather! Bubby appreciates the hard work.'
          : 'Complete a 25-min session to earn bonus stats and coins!'}
      </p>
    </div>
  )
}

export default PomodoroTimer
