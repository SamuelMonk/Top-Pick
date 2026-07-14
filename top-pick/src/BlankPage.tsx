import './App.css'
import fixtureData from './dataSource/en.1.json'

type BlankPageProps = {
  onBack: () => void
}

type Match = {
  round: string
  date: string
  time: string
  team1: string
  team2: string
}

function BlankPage({ onBack }: BlankPageProps) {
  const matchdayOneMatches = (fixtureData.matches as Match[]).filter(
    (match) => match.round === 'Matchday 1',
  )

  return (
    <div className="blank-page" aria-label="blank page">
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
      </div>

      <button type="button" className="back-button" onClick={onBack}>
        back
      </button>
    </div>
  )
}

export default BlankPage
