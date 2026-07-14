import { useEffect, useRef, useState } from 'react'
import './App.css'
import fixtureData from './dataSource/en.1.json'
import FinalAnswerPage from './FinalAnswerPage'

type BlankPageProps = {
  onBack: () => void
  players: string[]
  onQuit: () => void
}

type Match = {
  round: string
  date: string
  time: string
  team1: string
  team2: string
}

const PICKS_STORAGE_KEY = 'top-pick-gameweek-1-picks'

function BlankPage({ onBack, players, onQuit }: BlankPageProps) {
  const matchdayOneMatches = (fixtureData.matches as Match[]).filter(
    (match) => match.round === 'Matchday 1',
  )

  const activePlayers = players.filter((player) => player.trim().length > 0)
  const availableTeams = Array.from(
    new Set(matchdayOneMatches.flatMap((match) => [match.team1, match.team2])),
  )

  const [selections, setSelections] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') {
      return {}
    }

    try {
      const storedSelections = window.localStorage.getItem(PICKS_STORAGE_KEY)
      if (!storedSelections) {
        return {}
      }

      const parsedSelections = JSON.parse(storedSelections)
      return typeof parsedSelections === 'object' && parsedSelections !== null
        ? parsedSelections
        : {}
    } catch {
      return {}
    }
  })

  const [isLeftMenuOpen, setIsLeftMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false)
  const [isQuitConfirmOpen, setIsQuitConfirmOpen] = useState(false)
  const [showFinalAnswerPage, setShowFinalAnswerPage] = useState(false)
  const leftMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.localStorage.setItem(PICKS_STORAGE_KEY, JSON.stringify(selections))
  }, [selections])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (leftMenuRef.current && !leftMenuRef.current.contains(event.target as Node)) {
        setIsLeftMenuOpen(false)
      }

      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelectionChange = (playerName: string, teamName: string) => {
    setSelections((currentSelections) => ({
      ...currentSelections,
      [playerName]: teamName,
    }))
  }

  const leaderboardEntries = activePlayers
    .map((player) => ({
      name: player,
      points: Object.values(selections).filter((selection) => selection === player).length,
    }))
    .sort((a, b) => b.points - a.points)

  const handleMenuAction = (action: 'leaderboard' | 'quit') => {
    if (action === 'leaderboard') {
      setIsLeaderboardOpen((open) => !open)
    } else {
      setIsQuitConfirmOpen(true)
    }
    setIsLeftMenuOpen(false)
  }

  const handleQuitConfirm = (confirmed: boolean) => {
    if (confirmed) {
      onQuit()
    } else {
      setIsQuitConfirmOpen(false)
    }
  }

  if (showFinalAnswerPage) {
    return <FinalAnswerPage onBack={() => setShowFinalAnswerPage(false)} />
  }

  return (
    <div className="blank-page" aria-label="blank page">
      <div className="left-menu" ref={leftMenuRef}>
        <button type="button" className="left-menu-trigger" onClick={() => setIsLeftMenuOpen((open) => !open)}>
          ☰
        </button>

        {isLeftMenuOpen && (
          <div className="left-menu-dropdown">
            <button type="button" className="menu-action" onClick={() => handleMenuAction('leaderboard')}>
              leaderboard
            </button>
            <button type="button" className="menu-action quit-action" onClick={() => handleMenuAction('quit')}>
              quit game
            </button>
          </div>
        )}

        {isLeaderboardOpen && (
          <div className="leaderboard-panel">
            <h3>Leaderboard</h3>
            <ul>
              {leaderboardEntries.map((entry, index) => (
                <li key={entry.name}>
                  <span>{index + 1}. {entry.name}</span>
                  <strong>{entry.points} pts</strong>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="user-menu" ref={userMenuRef}>
        <button type="button" className="user-menu-trigger" onClick={() => setIsUserMenuOpen((open) => !open)}>
          <span className="user-menu-icon">👤</span>
        </button>

        {isUserMenuOpen && (
          <div className="user-menu-dropdown">
            {activePlayers.length > 0 ? (
              activePlayers.map((player) => (
                <div className="user-menu-item" key={player}>
                  <span className="user-menu-avatar">👤</span>
                  <span>{player}</span>
                </div>
              ))
            ) : (
              <div className="user-menu-item">No players added</div>
            )}
          </div>
        )}
      </div>

      <div className="fixture-page">
        <div className="fixture-header">
          <h1>Gameweek 1</h1>
          <p>Pick the team you are confident will win their match out of all the games.</p>
        </div>

        <div className="fixture-grid">
          {matchdayOneMatches.map((match, index) => (
            <div className="fixture-card" key={`${match.team1}-${match.team2}-${index}`}>
              <div className="fixture-date">{match.date} • {match.time}</div>
              <div className="fixture-teams">
                <span>{match.team1}</span>
                <span className="fixture-vs">vs</span>
                <span>{match.team2}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pick-section">
          <h2>Player picks</h2>
          <p>Your selected team is saved for Gameweek 1.</p>
          <div className="pick-list">
            {activePlayers.map((player) => (
              <label className="pick-card" key={player}>
                <span>{player}</span>
                <select
                  value={selections[player] ?? ''}
                  onChange={(event) => handleSelectionChange(player, event.target.value)}
                >
                  <option value="">Pick a team</option>
                  {availableTeams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      </div>

      {isQuitConfirmOpen && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-card">
            <h3>Are you sure you want to quit?</h3>
            <div className="confirm-actions">
              <button type="button" className="confirm-yes" onClick={() => handleQuitConfirm(true)}>
                yes
              </button>
              <button type="button" className="confirm-no" onClick={() => handleQuitConfirm(false)}>
                no
              </button>
            </div>
          </div>
        </div>
      )}

      <button type="button" className="back-button" onClick={onBack}>
        back
      </button>

      <button type="button" className="final-answer-button" onClick={() => setShowFinalAnswerPage(true)}>
        final answer
      </button>
    </div>
  )
}

export default BlankPage
