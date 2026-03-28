import { useState, useEffect, useCallback } from 'react'
import Lung from './Lung.jsx'
import './App.css'

const STORAGE_KEY = 'smoke-counter'
const SETTINGS_KEY = 'smoke-settings'
const DEFAULT_GOAL_MINUTES = 120

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { logs: [] }
    return JSON.parse(raw)
  } catch {
    return { logs: [] }
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { goalMinutes: DEFAULT_GOAL_MINUTES }
    return JSON.parse(raw)
  } catch {
    return { goalMinutes: DEFAULT_GOAL_MINUTES }
  }
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

function formatGoal(minutes) {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatElapsed(ms) {
  if (ms < 0) ms = 0
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60

  const parts = []
  if (days > 0) parts.push(<span key="d">{days}<span className="unit">d</span> </span>)
  if (days > 0 || hours > 0) parts.push(<span key="h">{hours}<span className="unit">h</span> </span>)
  parts.push(<span key="m">{mins}<span className="unit">m</span> </span>)
  parts.push(<span key="s">{secs}<span className="unit">s</span></span>)
  return parts
}

function toDateKey(ts) {
  const d = new Date(ts)
  return d.toISOString().slice(0, 10)
}

function formatDateLabel(dateStr) {
  const today = toDateKey(Date.now())
  const yesterday = toDateKey(Date.now() - 86400000)
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}

function groupByDay(logs) {
  const map = {}
  for (const ts of logs) {
    const key = toDateKey(ts)
    map[key] = (map[key] || 0) + 1
  }
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
}

function App() {
  const [data, setData] = useState(loadData)
  const [settings, setSettings] = useState(loadSettings)
  const [now, setNow] = useState(Date.now())
  const [showDash, setShowDash] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const goalMs = settings.goalMinutes * 60 * 1000

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const lastSmoke = data.logs.length > 0 ? data.logs[data.logs.length - 1] : null
  const elapsed = lastSmoke ? now - lastSmoke : null

  const handleSmoke = useCallback(() => {
    const next = { logs: [...data.logs, Date.now()] }
    saveData(next)
    setData(next)
  }, [data])

  const handleClear = useCallback(() => {
    if (window.confirm('Clear all data?')) {
      const next = { logs: [] }
      saveData(next)
      setData(next)
    }
  }, [])

  const handleGoalChange = useCallback((minutes) => {
    const next = { ...settings, goalMinutes: minutes }
    saveSettings(next)
    setSettings(next)
  }, [settings])

  const GOAL_PRESETS = [30, 60, 90, 120, 180, 240, 360, 480, 720, 1440]

  if (showSettings) {
    return (
      <div className="dashboard">
        <div className="dash-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={() => setShowSettings(false)}>&times;</button>
        </div>
        <div className="dash-content">
          <div className="settings-section">
            <div className="settings-label">Goal time between cigarettes</div>
            <div className="settings-current">{formatGoal(settings.goalMinutes)}</div>
            <div className="goal-grid">
              {GOAL_PRESETS.map((m) => (
                <button
                  key={m}
                  className={`goal-option${settings.goalMinutes === m ? ' active' : ''}`}
                  onClick={() => handleGoalChange(m)}
                >
                  {formatGoal(m)}
                </button>
              ))}
            </div>
            <div className="settings-hint">
              The lung fills up as you approach your goal. Increase it over time to smoke less.
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showDash) {
    const days = groupByDay(data.logs)
    const maxCount = days.reduce((m, [, c]) => Math.max(m, c), 0)
    const todayCount = days.find(([d]) => d === toDateKey(Date.now()))?.[1] || 0
    const avg = days.length > 0
      ? (data.logs.length / days.length).toFixed(1)
      : '0'

    return (
      <div className="dashboard">
        <div className="dash-header">
          <h2>Dashboard</h2>
          <button className="close-btn" onClick={() => setShowDash(false)}>&times;</button>
        </div>
        <div className="dash-content">
          <div className="stat-cards">
            <div className="stat-card">
              <div className="value">{data.logs.length}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="stat-card">
              <div className="value">{todayCount}</div>
              <div className="stat-label">Today</div>
            </div>
            <div className="stat-card">
              <div className="value">{avg}</div>
              <div className="stat-label">Avg / Day</div>
            </div>
            <div className="stat-card">
              <div className="value">{days.length}</div>
              <div className="stat-label">Days tracked</div>
            </div>
          </div>

          {days.length === 0 ? (
            <div className="empty-dash">No data yet</div>
          ) : (
            <div className="day-list">
              {days.map(([date, count]) => (
                <div className="day-row" key={date}>
                  <div className="day-date">{formatDateLabel(date)}</div>
                  <div className="day-bar-wrap">
                    <div
                      className="day-bar"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <div className="day-count">{count}</div>
                </div>
              ))}
            </div>
          )}

          {data.logs.length > 0 && (
            <div className="danger-zone">
              <button className="clear-btn" onClick={handleClear}>
                Clear all data
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Lung elapsedMs={elapsed} goalMs={goalMs} />

      <div className="timer-section">
        {elapsed !== null ? (
          <div className="timer">{formatElapsed(elapsed)}</div>
        ) : (
          <div className="no-data">Take your first breath</div>
        )}
      </div>

      <button className="smoke-btn" onClick={handleSmoke}>
        Smoke
      </button>

      <div className="goal-display">Goal: {formatGoal(settings.goalMinutes)}</div>

      <div className="bottom-row">
        <button className="stats-btn" onClick={() => setShowDash(true)}>
          Dashboard
        </button>
        <button className="stats-btn" onClick={() => setShowSettings(true)}>
          Settings
        </button>
      </div>

      {data.logs.length > 0 && (
        <div className="total"><span>{data.logs.length}</span> logged</div>
      )}
    </div>
  )
}

export default App
