import { useState, useEffect, useRef } from 'react'
import './PomodoroTimer.css'

const WORK_DURATION = 25 * 60 // 25 minutes in seconds
const BREAK_DURATION = 5 * 60 // 5 minutes

function PomodoroTimer({
  onComplete,
  userName,
  onStudyStart  = null,   // fired when work timer starts (not during break)
  onStudyPause  = null,   // fired when timer is paused
  onStudyResume = null,   // fired when timer resumes after a pause
  onStudyStop   = null,   // fired when timer is reset / session ends
  dailyGoal     = null,   // target sessions for today (2–4)
  todaySessions = 0,      // sessions completed today (from Firestore)
}) {
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      clearInterval(intervalRef.current)
      if (!isBreak) {
        // Work session completed
        setSessionsCompleted(prev => prev + 1)
        onComplete()
        if (onStudyStop) onStudyStop()   // session done → hare returns to idle
        setIsBreak(true)
        setTimeLeft(BREAK_DURATION)
        setIsRunning(false)
      } else {
        // Break completed
        setIsBreak(false)
        setTimeLeft(WORK_DURATION)
        setIsRunning(false)
      }
    }

    return () => clearInterval(intervalRef.current)
  }, [isRunning, timeLeft])

  const toggleTimer = () => {
    const nextRunning = !isRunning
    setIsRunning(nextRunning)
    if (nextRunning) {
      // Starting or resuming
      if (!isBreak) {
        // First start (studyTrigger) vs resume after pause (studyResumeTrigger).
        // We fire onStudyStart for both: Game.jsx tracks whether hare is already at tree.
        if (onStudyStart) onStudyStart()
      }
    } else {
      // Pausing
      if (!isBreak && onStudyPause) onStudyPause()
    }
  }

  const resetTimer = () => {
    clearInterval(intervalRef.current)
    setIsRunning(false)
    setIsBreak(false)
    setTimeLeft(WORK_DURATION)
    if (onStudyStop) onStudyStop()
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const totalDuration = isBreak ? BREAK_DURATION : WORK_DURATION
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100

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

      <div className="timer-ring">
        <svg viewBox="0 0 120 120" className="timer-svg">
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="8"
          />
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
          className={`timer-btn ${isRunning ? 'pause' : 'start'}`}
          onClick={toggleTimer}
        >
          {isRunning ? '⏸ Pause' : '▶ Start'}
        </button>
        <button className="timer-btn reset" onClick={resetTimer}>
          🔄 Reset
        </button>
      </div>

      <div className="sessions-count">
        🏆 Sessions completed: <strong>{sessionsCompleted}</strong>
      </div>

      <p className="pomodoro-tip">
        {isBreak
          ? 'Take a breather! Your pet appreciates your hard work.'
          : 'Complete a 25-min session to feed your pet bonus stats!'}
      </p>
    </div>
  )
}

export default PomodoroTimer
