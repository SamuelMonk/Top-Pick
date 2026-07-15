import { useEffect, useState } from 'react'
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
  score?: unknown
}

type PlayerRecord = {
  picks: Record<string, string>
  pointsByWeek: Record<string, number>
  totalPoints: number
}

const PICKS_STORAGE_KEY = 'top-pick-gameweek-1-picks'
const PLAYER_RECORDS_STORAGE_KEY = 'top-pick-player-records'
const CURRENT_WEEK = 'Gameweek 1'

function getFullTimeScore(score: unknown): [number, number] | null {
  if (Array.isArray(score) && score.length >= 2) {
    return [Number(score[0]), Number(score[1])]
  }

  if (typeof score === 'object' && score !== null && 'ft' in score) {
    const ft = (score as any).ft
    if (Array.isArray(ft) && ft.length >= 2) {
      return [Number(ft[0]), Number(ft[1])]
    }
  }

  return null
}

function getMatchOutcome(match: Match) {
  const score = getFullTimeScore(match.score)
  if (!score) {
    return null
  }

  const [home, away] = score
  if (home === away) {
    return { home, away, result: 'draw' as const, scoreText: `${home} - ${away}` }
  }

  return {
    home,
    away,
    result: home > away ? 'home' as const : 'away' as const,
    scoreText: `${home} - ${away}`,
  }
}

function computePlayerPoints(playerTeam: string, match: Match) {
  if (!playerTeam || (playerTeam !== match.team1 && playerTeam !== match.team2)) {
    return 0
  }

  const outcome = getMatchOutcome(match)
  if (!outcome) {
    return 0
  }

  if (outcome.result === 'draw') {
    return 1
  }

  if (playerTeam === match.team1 && outcome.result === 'home') {
    return 3
  }

  if (playerTeam === match.team2 && outcome.result === 'away') {
    return 3
  }

  return 0
}

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

  const [playerRecords, setPlayerRecords] = useState<Record<string, PlayerRecord>>(() => {
    if (typeof window === 'undefined') {
      return {}
    }

    try {
      const stored = window.localStorage.getItem(PLAYER_RECORDS_STORAGE_KEY)
      if (!stored) {
        return {}
      }

      const parsed = JSON.parse(stored)
      return typeof parsed === 'object' && parsed !== null ? parsed : {}
    } catch {
      return {}
    }
  })

  const [isQuitConfirmOpen, setIsQuitConfirmOpen] = useState(false)
  const [showFinalAnswerPage, setShowFinalAnswerPage] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(PICKS_STORAGE_KEY, JSON.stringify(selections))
  }, [selections])

  useEffect(() => {
    window.localStorage.setItem(PLAYER_RECORDS_STORAGE_KEY, JSON.stringify(playerRecords))
  }, [playerRecords])

  const handleSelectionChange = (playerName: string, teamName: string) => {
    setSelections((currentSelections) => ({
      ...currentSelections,
      [playerName]: teamName,
    }))
  }

  const leaderboardEntries = activePlayers
    .map((player) => {
      const record = playerRecords[player]
      return {
        name: player,
        points: record ? record.totalPoints : 0,
      }
    })
    .sort((a, b) => b.points - a.points)

  const lockInFinalAnswers = () => {
    const updatedRecords = { ...playerRecords }

    activePlayers.forEach((player) => {
      const playerTeam = selections[player] ?? ''
      const existingRecord = updatedRecords[player] ?? {
        picks: {},
        pointsByWeek: {},
        totalPoints: 0,
      }

      const previousWeekPoints = existingRecord.pointsByWeek[CURRENT_WEEK] ?? 0
      const weekPoints = matchdayOneMatches.reduce((sum, match) => {
        return sum + computePlayerPoints(playerTeam, match)
      }, 0)

      updatedRecords[player] = {
        picks: {
          ...existingRecord.picks,
          [CURRENT_WEEK]: playerTeam,
        },
        pointsByWeek: {
          ...existingRecord.pointsByWeek,
          [CURRENT_WEEK]: weekPoints,
        },
        totalPoints: existingRecord.totalPoints - previousWeekPoints + weekPoints,
      }
    })

    setPlayerRecords(updatedRecords)
    setShowFinalAnswerPage(true)
  }

  const handleQuitConfirm = (confirmed: boolean) => {
    if (confirmed) {
      window.localStorage.removeItem(PICKS_STORAGE_KEY)
      window.localStorage.removeItem(PLAYER_RECORDS_STORAGE_KEY)
      setSelections({})
      setPlayerRecords({})
      setShowFinalAnswerPage(false)
      onQuit()
    } else {
      setIsQuitConfirmOpen(false)
    }
  }

  if (showFinalAnswerPage) {
    return (
      <FinalAnswerPage
        onBack={() => setShowFinalAnswerPage(false)}
        playerRecords={playerRecords}
      />
    )
  }

  return (
    <div className="blank-page" aria-label="blank page">
      <aside className="top-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-title">Player scores</div>
          <ul className="sidebar-list">
            {leaderboardEntries.length > 0 ? (
              leaderboardEntries.map((entry) => (
                <li className="sidebar-score-item" key={entry.name}>
                  <div className="sidebar-player">
                    <span className="sidebar-avatar">👤</span>
                    <div>
                      <div className="sidebar-player-name">{entry.name}</div>
                      <div className="sidebar-player-subtitle">
                        {selections[entry.name] ? 'Pick saved' : 'No pick yet'}
                      </div>
                    </div>
                  </div>
                  <strong>{entry.points} pts</strong>
                </li>
              ))
            ) : (
              <li className="sidebar-score-item sidebar-empty">No players added</li>
            )}
          </ul>
        </div>

        <button type="button" className="sidebar-quit-button" onClick={() => setIsQuitConfirmOpen(true)}>
          quit game
        </button>
      </aside>

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

      <button type="button" className="final-answer-button" onClick={lockInFinalAnswers}>
        final answer
      </button>
    </div>
  )
}

export default BlankPage
