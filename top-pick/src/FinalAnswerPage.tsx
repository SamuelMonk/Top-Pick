import './App.css'
import fixtureData from './dataSource/en.1.json'

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
  onBack: () => void
  playerRecords: Record<string, PlayerRecord>
}

const CURRENT_WEEK = 'Gameweek 1'

function FinalAnswerPage({ onBack, playerRecords }: FinalAnswerPageProps) {
  const matchdayOneMatches = (fixtureData.matches as Match[]).filter(
    (match) => match.round === 'Matchday 1',
  )

  return (
    <div className="blank-page final-answer-page" aria-label="final answer page">
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
                      <span className="sidebar-avatar">👤</span>
                      <div>
                        <div className="sidebar-player-name">{player}</div>
                        <div className="sidebar-player-subtitle">
                          {record.picks[CURRENT_WEEK] ? record.picks[CURRENT_WEEK] : 'No pick'}
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
      </aside>

      <div className="fixture-page">
      <header className="final-answer-header">
        <h1>Answers!</h1>
      </header>
        <div className="fixture-header">
          <h1>Gameweek 1</h1>
          <p>Review the Matchday 1 fixtures and the points earned from your selections.</p>
        </div>

        <div className="fixture-grid">
          {matchdayOneMatches.map((match, index) => {
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

      <button type="button" className="back-button" onClick={onBack}>
        back
      </button>
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
