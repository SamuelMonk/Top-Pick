import { useEffect, useState } from 'react'
import './App.css'
import fixtureData from './dataSource/en.1.json'

type BlankPageProps = {
  onBack: () => void
  players: string[]
}

type Match = {
  round: string
  date: string
  time: string
  team1: string
  team2: string
}

const PICKS_STORAGE_KEY = 'top-pick-gameweek-1-picks'

function BlankPage({ onBack, players }: BlankPageProps) {
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

  useEffect(() => {
    window.localStorage.setItem(PICKS_STORAGE_KEY, JSON.stringify(selections))
  }, [selections])

  const handleSelectionChange = (playerName: string, teamName: string) => {
    setSelections((currentSelections) => ({
      ...currentSelections,
      [playerName]: teamName,
    }))
  }

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

      <button type="button" className="back-button" onClick={onBack}>
        back
      </button>
    </div>
  )
}

export default BlankPage
