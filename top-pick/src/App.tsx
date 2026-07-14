import { useEffect, useState } from 'react'
import './App.css'
import BlankPage from './BlankPage'
import arsenalLogo from './assets/PremLogos/arsenal-fc-logo-brandlogos.net_dg0swy04j.svg'
import manCityLogo from './assets/PremLogos/manchester-city-fc-logo-TitlM7Ic_brandlogos.net.svg'
import chelseaLogo from './assets/PremLogos/chelsea-fc-logo-brandlogos.net_p77lkji67.svg'
import liverpoolLogo from './assets/PremLogos/Liverpool_FC-OH4lAkDDD_brandlogos.net.svg'
import manUnitedLogo from './assets/PremLogos/manchester-united-f.c.-logo-brandlogos.net_iid5xrlqp.svg'
import spursLogo from './assets/PremLogos/Tottenham_Hotspur_F.C.-logo-brandlogos-2c3500.svg'
import astonVillaLogo from './assets/PremLogos/aston-villa-fc-logo-brandlogos.net_5amnmudz6.svg'
import newcastleLogo from './assets/PremLogos/newcastle-united-fc-logo-brandlogos.net_y5ex852l4.svg'

const clubs = [
  { name: 'Arsenal', logo: arsenalLogo, top: '8%', left: '8%', rotate: '-12deg', delay: '0s', duration: '9s', colors: ['#EF0107', '#FFFFFF'] },
  { name: 'Manchester City', logo: manCityLogo, top: '18%', left: '78%', rotate: '14deg', delay: '1s', duration: '10s', colors: ['#6CABDD', '#1C2C5B'] },
  { name: 'Chelsea', logo: chelseaLogo, top: '28%', left: '20%', rotate: '-8deg', delay: '2s', duration: '8s', colors: ['#034694', '#FFFFFF'] },
  { name: 'Liverpool', logo: liverpoolLogo, top: '38%', left: '85%', rotate: '10deg', delay: '3s', duration: '11s', colors: ['#C8102E', '#00B2A9'] },
  { name: 'Manchester United', logo: manUnitedLogo, top: '54%', left: '10%', rotate: '-16deg', delay: '1.5s', duration: '9s', colors: ['#DA020E', '#FFE500'] },
  { name: 'Tottenham Hotspur', logo: spursLogo, top: '62%', left: '78%', rotate: '18deg', delay: '4s', duration: '10s', colors: ['#132257', '#FFFFFF'] },
  { name: 'Aston Villa', logo: astonVillaLogo, top: '76%', left: '14%', rotate: '-10deg', delay: '2.5s', duration: '8s', colors: ['#670E36', '#95BFE5'] },
  { name: 'Newcastle United', logo: newcastleLogo, top: '82%', left: '84%', rotate: '12deg', delay: '3.5s', duration: '9s', colors: ['#241F20', '#FFFFFF'] },
]

const STORAGE_KEY = 'top-pick-players'

function getInitialPlayers() {
  if (typeof window === 'undefined') {
    return ['']
  }

  try {
    const storedPlayers = window.localStorage.getItem(STORAGE_KEY)
    if (!storedPlayers) {
      return ['']
    }

    const parsedPlayers = JSON.parse(storedPlayers)
    return Array.isArray(parsedPlayers) && parsedPlayers.length > 0 ? parsedPlayers : ['']
  } catch {
    return ['']
  }
}

function App() {
  const [players, setPlayers] = useState<string[]>(getInitialPlayers)
  const [showBlankPage, setShowBlankPage] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
  }, [players])

  const handlePlayerChange = (index: number, value: string) => {
    setPlayers((currentPlayers) => {
      const nextPlayers = [...currentPlayers]
      nextPlayers[index] = value
      return nextPlayers
    })
  }

  const handleAddPlayer = () => {
    if (players.length < 4) {
      setPlayers((currentPlayers) => [...currentPlayers, ''])
    }
  }

  const handleRemovePlayer = () => {
    if (players.length > 1) {
      setPlayers((currentPlayers) => currentPlayers.slice(0, -1))
    }
  }

  const allPlayersFilled = players.every((player) => player.trim().length > 0)

  if (showBlankPage) {
    return <BlankPage onBack={() => setShowBlankPage(false)} />
  }

  return (
    <div className="landing-shell">
      <div className="logo-cloud" aria-hidden="true">
        {clubs.map((club) => (
          <div
            key={club.name}
            className="club-badge"
            style={{
              top: club.top,
              left: club.left,
              transform: `rotate(${club.rotate})`,
              background: `linear-gradient(135deg, ${club.colors[0]}, ${club.colors[1]})`,
              animationDelay: club.delay,
              animationDuration: club.duration,
            }}
          >
            <img src={club.logo} alt={`${club.name} logo`} />
          </div>
        ))}
      </div>

      <main className="intro-panel">
        <div className="player-list">
          {players.map((playerName, index) => (
            <div className="player-row" key={`player-${index}`}>
              <div className={`avatar-circle${index === 0 ? '' : ' avatar-circle-small'}`} aria-hidden="true">
                <svg viewBox="0 0 64 64" role="img" focusable="false">
                  <circle cx="32" cy="32" r="30" fill="rgba(255,255,255,0.16)" />
                  <circle cx="32" cy="24" r="10" fill="#fdf7e8" />
                  <path
                    d="M18 50c2-9 10-14 14-14s12 5 14 14"
                    fill="#fdf7e8"
                  />
                </svg>
              </div>

              <label className="username-field" htmlFor={`player-${index}`}>
                <input
                  id={`player-${index}`}
                  type="text"
                  value={playerName}
                  onChange={(event) => handlePlayerChange(index, event.target.value)}
                  placeholder={index === 0 ? 'enter username' : `player ${index + 1} username`}
                  autoComplete="off"
                />
              </label>
            </div>
          ))}
        </div>

        <div className="action-buttons">
          {players.length < 4 && (
            <button type="button" className="add-player-button" onClick={handleAddPlayer}>
              add a player
            </button>
          )}

          {players.length > 1 && (
            <button type="button" className="remove-player-button" onClick={handleRemovePlayer}>
              remove player
            </button>
          )}
        </div>

        {allPlayersFilled && (
          <button type="button" className="continue-button" onClick={() => setShowBlankPage(true)}>
            continue
          </button>
        )}
      </main>
    </div>
  )
}

export default App
