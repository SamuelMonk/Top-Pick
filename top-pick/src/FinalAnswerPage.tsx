import { useMemo, useState } from 'react'
import './App.css'
import fixtureData from './dataSource/en.1.json'
import { getAvatarColor, getInitials } from './avatarUtils'

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

type FinalAnswerPageProps = {
  currentWeek: number
  onBack: () => void
  onQuit: () => void
  onNextGameweek: () => void
  onFinish: () => void
  playerRecords: Record<string, PlayerRecord>
  playerNumbers: Record<string, number>
}

function FinalAnswerPage({
  currentWeek,
  onBack,
  onQuit,
  onNextGameweek,
  onFinish,
  playerRecords,
  playerNumbers,
}: FinalAnswerPageProps) {
  const [isQuitConfirmOpen, setIsQuitConfirmOpen] = useState(false)
  const currentWeekLabel = `Gameweek ${currentWeek}`
  const currentRoundLabel = `Matchday ${currentWeek}`

  const weeklyMatches = (fixtureData.matches as Match[]).filter(
    (match) => match.round === currentRoundLabel,
  )

  const handleQuitConfirm = (confirmed: boolean) => {
    if (confirmed) {
      onQuit()
    } else {
      setIsQuitConfirmOpen(false)
    }
  }

  const lightningStrikes = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => ({
        id: `strike-${index}`,
        left: `${10 + Math.random() * 80}%`,
        delay: `${Math.random() * 8}s`,
        duration: `${0.8 + Math.random() * 0.7}s`,
      })),
    [],
  )

  return (
    <div className="blank-page final-answer-page" aria-label="final answer page">
      <div className="lightning-layer">
        {lightningStrikes.map((strike) => (
          <span
            key={strike.id}
            className="lightning-strike"
            style={{
              left: strike.left,
              animationDelay: strike.delay,
              animationDuration: strike.duration,
            }}
          />
        ))}
      </div>

      <button type="button" className="back-button" onClick={onBack}>
        Back
      </button>
      <aside className="top-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-title">Player scores</div>
          <ul className="sidebar-list">
            {Object.entries(playerRecords).length > 0 ? (
              Object.entries(playerRecords)
                .sort(([, a], [, b]) => b.totalPoints - a.totalPoints)
                .map(([player, record]) => (
                  <li className="sidebar-score-item" key={player}>
                    <div className="sidebar-player">
                      <span
                        className="sidebar-avatar"
                        style={{ backgroundColor: getAvatarColor(playerNumbers[player] ?? 1) }}
                      >
                        {getInitials(player)}
                      </span>
                      <div>
                        <div className="sidebar-player-subtitle">
                          {record.picks[currentWeekLabel] ? record.picks[currentWeekLabel] : 'No pick'}
                        </div>
                      </div>
                    </div>
                    <strong>{record.totalPoints} pts</strong>
                  </li>
                ))
            ) : (
              <li className="sidebar-score-item sidebar-empty">No players added</li>
            )}
          </ul>
        </div>

        {currentWeek < 38 ? (
          <button type="button" className="sidebar-submit-button" onClick={onNextGameweek}>
            Next gameweek
          </button>
        ) : (
          <button type="button" className="sidebar-submit-button" onClick={onFinish}>
            Finish
          </button>
        )}

        <button type="button" className="sidebar-quit-button" onClick={() => setIsQuitConfirmOpen(true)}>
          Quit game
        </button>
      </aside>

      <div className="fixture-page">
        <header className="final-answer-header">
          <h1>Answers!</h1>
        </header>
        <div className="fixture-header">
          <h1>{currentWeekLabel}</h1>
          <p>Review the {currentRoundLabel} fixtures and the points earned from your selections.</p>
        </div>

        <div className="fixture-grid">
          {weeklyMatches.map((match, index) => {
            const outcome = getFullTimeScore(match.score)
            const scoreText = outcome ? `${outcome[0]} - ${outcome[1]}` : 'TBD'

            return (
              <div className="fixture-card" key={`${match.team1}-${match.team2}-${index}`}>
                <div className="fixture-date">{match.date} • {match.time}</div>
                <div className="fixture-teams">
                  <span>{match.team1}</span>
                  <span className="fixture-vs">vs</span>
                  <span>{match.team2}</span>
                </div>
                <div className="fixture-score">Final score: {scoreText}</div>
              </div>
            )
          })}
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
    </div>
  )
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

export default FinalAnswerPage
