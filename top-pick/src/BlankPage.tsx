import { useEffect, useState } from 'react'
import './App.css'
import fixtureData from './dataSource/en.1.json'
import FinalAnswerPage from './FinalAnswerPage'
import { getAvatarColor, getInitials } from './avatarUtils'

type BlankPageProps = {
  onBack: () => void
  players: string[]
  playerNumbers: Record<string, number>
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

type FootballBall = {
  id: string
  left: string
  size: number
  duration: number
  delay: number
}

type PageHistoryEntry = {
  page: 'selection' | 'finalAnswer' | 'finish'
  week: number
}

const PICKS_STORAGE_KEY_PREFIX = 'top-pick-gameweek'
const PLAYER_RECORDS_STORAGE_KEY = 'top-pick-player-records'

function getPickStorageKey(week: number) {
  return `${PICKS_STORAGE_KEY_PREFIX}-${week}-picks`
}

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

function createFootballBall(): FootballBall {
  return {
    id: `football-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    left: `${10 + Math.random() * 80}%`,
    size: 26 + Math.random() * 24,
    duration: 5 + Math.random() * 4,
    delay: Math.random() * 4,
  }
}

function BlankPage({ onBack, players, playerNumbers, onQuit }: BlankPageProps) {
  const [footballBalls, setFootballBalls] = useState<FootballBall[]>(() =>
    Array.from({ length: 5 }, () => createFootballBall()),
  )
  const [currentWeek, setCurrentWeek] = useState(1)
  const [currentPage, setCurrentPage] = useState<'selection' | 'finalAnswer' | 'finish'>('selection')
  const [viewHistory, setViewHistory] = useState<PageHistoryEntry[]>([])
  const currentWeekLabel = `Gameweek ${currentWeek}`
  const currentRoundLabel = `Matchday ${currentWeek}`

  const handleBallEnd = (id: string) => {
    setFootballBalls((currentBalls) =>
      currentBalls.map((ball) => (ball.id === id ? createFootballBall() : ball)),
    )
  }

  const weeklyMatches = (fixtureData.matches as Match[]).filter(
    (match) => match.round === currentRoundLabel,
  )

  const activePlayers = players.filter((player) => player.trim().length > 0)
  const availableTeams = Array.from(
    new Set(weeklyMatches.flatMap((match) => [match.team1, match.team2])),
  ).sort((a, b) => a.localeCompare(b))

  const getUsedTeamsForPlayer = (player: string) => {
    const playerRecord = playerRecords[player]
    if (!playerRecord) {
      return new Set<string>()
    }

    return new Set(
      Object.entries(playerRecord.picks)
        .filter(([weekLabel]) => weekLabel !== currentWeekLabel)
        .map(([, team]) => team),
    )
  }

  const getAvailableTeamsForPlayer = (player: string) => {
    const usedTeams = getUsedTeamsForPlayer(player)
    const filteredTeams = availableTeams.filter((team) => !usedTeams.has(team))
    return filteredTeams.length > 0 ? filteredTeams : availableTeams
  }

  const [selections, setSelections] = useState<Record<string, string>>({})
  const [areSelectionsLoaded, setAreSelectionsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const storedSelections = window.localStorage.getItem(getPickStorageKey(currentWeek))
    if (!storedSelections) {
      setSelections({})
      setAreSelectionsLoaded(true)
      return
    }

    try {
      const parsedSelections = JSON.parse(storedSelections)
      setSelections(
        typeof parsedSelections === 'object' && parsedSelections !== null ? parsedSelections : {},
      )
    } catch {
      setSelections({})
    }
    setAreSelectionsLoaded(true)
  }, [currentWeek])

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

  useEffect(() => {
    const timeouts = new Set<number>()
    const scheduleBall = (ball: FootballBall) => {
      const timeout = window.setTimeout(() => {
        setFootballBalls((currentBalls) =>
          currentBalls
            .filter((item) => item.id !== ball.id)
            .concat(createFootballBall()),
        )
      }, (ball.duration + ball.delay) * 1000)
      timeouts.add(timeout)
    }

    footballBalls.forEach(scheduleBall)
    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout))
    }
  }, [footballBalls])

  useEffect(() => {
    if (!areSelectionsLoaded || typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(getPickStorageKey(currentWeek), JSON.stringify(selections))
  }, [selections, currentWeek, areSelectionsLoaded])

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

  const allPlayersChosen = activePlayers.every((player) => selections[player]?.length > 0)

  const lockInFinalAnswers = () => {
    const updatedRecords = { ...playerRecords }

    activePlayers.forEach((player) => {
      const playerTeam = selections[player] ?? ''
      const existingRecord = updatedRecords[player] ?? {
        picks: {},
        pointsByWeek: {},
        totalPoints: 0,
      }

      const previousWeekPoints = existingRecord.pointsByWeek[currentWeekLabel] ?? 0
      const weekPoints = weeklyMatches.reduce((sum, match) => {
        return sum + computePlayerPoints(playerTeam, match)
      }, 0)

      updatedRecords[player] = {
        picks: {
          ...existingRecord.picks,
          [currentWeekLabel]: playerTeam,
        },
        pointsByWeek: {
          ...existingRecord.pointsByWeek,
          [currentWeekLabel]: weekPoints,
        },
        totalPoints: existingRecord.totalPoints - previousWeekPoints + weekPoints,
      }
    })

    setPlayerRecords(updatedRecords)
    setViewHistory((currentHistory) => [...currentHistory, { page: 'selection', week: currentWeek }])
    setCurrentPage('finalAnswer')
  }

  const clearAllWeekPicks = () => {
    if (typeof window === 'undefined') {
      return
    }

    Object.keys(window.localStorage).forEach((key) => {
      if (key.startsWith(PICKS_STORAGE_KEY_PREFIX)) {
        window.localStorage.removeItem(key)
      }
    })
  }

  const handleQuitConfirm = (confirmed: boolean) => {
    if (confirmed) {
      clearAllWeekPicks()
      window.localStorage.removeItem(PLAYER_RECORDS_STORAGE_KEY)
      setSelections({})
      setPlayerRecords({})
      setCurrentWeek(1)
      setCurrentPage('selection')
      setViewHistory([])
      setAreSelectionsLoaded(false)
      onQuit()
    } else {
      setIsQuitConfirmOpen(false)
    }
  }

  const handleBlankBack = () => {
    if (viewHistory.length > 0) {
      const previous = viewHistory[viewHistory.length - 1]
      setViewHistory((currentHistory) => currentHistory.slice(0, -1))
      setCurrentWeek(previous.week)
      setCurrentPage(previous.page)
      setAreSelectionsLoaded(false)
      return
    }

    onBack()
  }

  const handleAdvanceWeek = () => {
    setViewHistory((currentHistory) => [
      ...currentHistory,
      { page: 'finalAnswer', week: currentWeek },
    ])
    setCurrentWeek((value) => value + 1)
    setCurrentPage('selection')
    setSelections({})
    setAreSelectionsLoaded(false)
  }

  const handleFinishPage = () => {
    setViewHistory((currentHistory) => [
      ...currentHistory,
      { page: 'finalAnswer', week: currentWeek },
    ])
    setCurrentPage('finish')
  }

  const handleBack = () => {
    if (viewHistory.length > 0) {
      const previous = viewHistory[viewHistory.length - 1]
      setViewHistory((currentHistory) => currentHistory.slice(0, -1))
      setCurrentWeek(previous.week)
      setCurrentPage(previous.page)
      setAreSelectionsLoaded(false)
      return
    }

    onBack()
  }

  if (currentPage === 'finalAnswer') {
    return (
      <FinalAnswerPage
        currentWeek={currentWeek}
        onBack={handleBack}
        onQuit={onQuit}
        onNextGameweek={handleAdvanceWeek}
        onFinish={handleFinishPage}
        playerRecords={playerRecords}
        playerNumbers={playerNumbers}
      />
    )
  }

  if (currentPage === 'finish') {
    const leaderboardEntries = Object.entries(playerRecords)
      .sort(([, a], [, b]) => b.totalPoints - a.totalPoints)

    return (
      <div className="blank-page finish-page" aria-label="finish page">
        <aside className="top-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-title">Final leaderboard</div>
            <ul className="sidebar-list">
              {leaderboardEntries.length > 0 ? (
                leaderboardEntries.map(([player, record]) => (
                  <li className="sidebar-score-item" key={player}>
                    <div className="sidebar-player">
                      <span className="sidebar-avatar">{getInitials(player)}</span>
                      <div>
                        <div className="sidebar-player-name">{player}</div>
                        <div className="sidebar-player-subtitle">
                          {record.totalPoints} pts
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="sidebar-score-item sidebar-empty">No players added</li>
              )}
            </ul>
          </div>
        </aside>

        <div className="fixture-page">
          <div className="fixture-header">
            <h1>Season complete</h1>
            <p>You have reached the final page after gameweek 38.</p>
          </div>

          <div className="fixture-grid finish-grid">
            <div className="fixture-card">
              <h2>Thank you for playing!</h2>
              <p>Review your final points and head back to the landing page when you're ready.</p>
            </div>
          </div>

          <button type="button" className="continue-button" onClick={onQuit}>
            go home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="blank-page" aria-label="blank page">
      <div className="football-background">
        {footballBalls.map((ball) => (
          <span
            key={ball.id}
            className="football-ball"
            style={{
              left: ball.left,
              width: `${ball.size}px`,
              height: `${ball.size}px`,
              animationDuration: `${ball.duration}s`,
              animationDelay: `${ball.delay}s`,
            }}
            onAnimationEnd={() => handleBallEnd(ball.id)}
          />
        ))}
      </div>
      <aside className="top-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-title">Players</div>
          <ul className="sidebar-list">
            {leaderboardEntries.length > 0 ? (
              leaderboardEntries.map((entry) => {
                const playerAvailableTeams = getAvailableTeamsForPlayer(entry.name)
                return (
                  <li className="sidebar-score-item" key={entry.name}>
                    <div className="sidebar-player">
                      <span
                        className="sidebar-avatar"
                        style={{ backgroundColor: getAvatarColor(playerNumbers[entry.name] ?? 1) }}
                      >
                        {getInitials(entry.name)}
                      </span>
                    </div>

                    <div className="sidebar-select-wrapper">
                      <select
                        className="sidebar-select"
                        value={selections[entry.name] ?? ''}
                        onChange={(event) => handleSelectionChange(entry.name, event.target.value)}
                      >
                        <option value="">Pick a team</option>
                        {playerAvailableTeams.map((team) => (
                          <option key={team} value={team}>
                            {team}
                          </option>
                        ))}
                      </select>
                    </div>

                    <strong>{entry.points} pts</strong>
                  </li>
                )
              })
            ) : (
              <li className="sidebar-score-item sidebar-empty">No players added</li>
            )}
          </ul>
        </div>

        <button
          type="button"
          className="sidebar-submit-button"
          onClick={lockInFinalAnswers}
          disabled={!allPlayersChosen}
        >
          submit
        </button>

        <button type="button" className="sidebar-quit-button" onClick={() => setIsQuitConfirmOpen(true)}>
          quit game
        </button>
      </aside>

      <div className="fixture-page">
        <div className="fixture-header">
          <h1>{currentWeekLabel}</h1>
          <p>Pick the team you are confident will win their match out of all the games.</p>
        </div>

        <div className="fixture-grid">
          {weeklyMatches.map((match, index) => (
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

      <button type="button" className="back-button" onClick={handleBlankBack}>
        back
      </button>
    </div>
  )
}

export default BlankPage
