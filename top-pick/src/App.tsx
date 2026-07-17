import { useEffect, useState } from 'react'
import './App.css'
import BlankPage from './BlankPage'
import { getAvatarColor, getInitials } from './avatarUtils'
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

type PlayerName = {
  firstName: string
  lastName: string
}

const STORAGE_KEY = 'top-pick-players'

function getInitialPlayers() {
  if (typeof window === 'undefined') {
    return [{ firstName: '', lastName: '' }]
  }

  try {
    const storedPlayers = window.localStorage.getItem(STORAGE_KEY)
    if (!storedPlayers) {
      return [{ firstName: '', lastName: '' }]
    }

    const parsedPlayers = JSON.parse(storedPlayers)
    if (!Array.isArray(parsedPlayers)) {
      return [{ firstName: '', lastName: '' }]
    }

    if (parsedPlayers.length === 0) {
      return []
    }

    return parsedPlayers.map((player: unknown) => {
      if (typeof player === 'string') {
        const [firstName, ...rest] = player.trim().split(/\s+/)
        return {
          firstName: firstName ?? '',
          lastName: rest.join(' ') ?? '',
        }
      }

      if (
        typeof player === 'object' &&
        player !== null &&
        'firstName' in player &&
        'lastName' in player
      ) {
        return {
          firstName: String((player as any).firstName ?? ''),
          lastName: String((player as any).lastName ?? ''),
        }
      }

      return { firstName: '', lastName: '' }
    })
  } catch {
    return [{ firstName: '', lastName: '' }]
  }
}

function App() {
  const [players, setPlayers] = useState<PlayerName[]>(getInitialPlayers)
  const [showBlankPage, setShowBlankPage] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
  }, [players])

  const handlePlayerChange = (index: number, field: keyof PlayerName, value: string) => {
    setPlayers((currentPlayers) => {
      const nextPlayers = [...currentPlayers]
      nextPlayers[index] = {
        ...nextPlayers[index],
        [field]: value,
      }
      return nextPlayers
    })
  }

  const handleAddPlayer = () => {
    if (players.length < 8) {
      setPlayers((currentPlayers) => [...currentPlayers, { firstName: '', lastName: '' }])
    }
  }

  const handleRemovePlayer = () => {
    if (players.length > 1) {
      setPlayers((currentPlayers) => currentPlayers.slice(0, -1))
    }
  }

  const isValidPlayerName = (player: PlayerName) => {
    return player.firstName.trim().length > 0 && player.lastName.trim().length > 0
  }

  const allPlayersFilled = players.length > 0 && players.every(isValidPlayerName)

  if (showBlankPage) {
    const playerNumbers = Object.fromEntries(
      players.map((player, index) => [`${player.firstName} ${player.lastName}`, index + 1]),
    )

    return (
      <BlankPage
        onBack={() => setShowBlankPage(false)}
        players={players.map((player) => `${player.firstName} ${player.lastName}`)}
        playerNumbers={playerNumbers}
        onQuit={() => {
          setPlayers([])
          setShowBlankPage(false)
        }}
      />
    )
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

      <header className="landing-header">
        <h1>Top-Pick</h1>
        <p className="landing-subheader">The ultimate football prediction game</p>
      </header>

      <main className="intro-panel">
        <div className="player-list">
          {players.map((playerName, index) => (
            <div className="player-row" key={`player-${index}`}>
              <div
                className={`avatar-circle${index === 0 ? '' : ' avatar-circle-small'}`}
                aria-hidden="true"
                style={{ backgroundColor: getAvatarColor(index + 1) }}
              >
                <span className="avatar-initials">
                  {getInitials(`${playerName.firstName} ${playerName.lastName}`)}
                </span>
              </div>

              <div className="name-inputs">
                <label className="username-field" htmlFor={`player-${index}-first`}>
                  <input
                    id={`player-${index}-first`}
                    type="text"
                    value={playerName.firstName}
                    onChange={(event) => handlePlayerChange(index, 'firstName', event.target.value)}
                    placeholder="first name"
                    autoComplete="off"
                  />
                </label>
                <label className="username-field" htmlFor={`player-${index}-last`}>
                  <input
                    id={`player-${index}-last`}
                    type="text"
                    value={playerName.lastName}
                    onChange={(event) => handlePlayerChange(index, 'lastName', event.target.value)}
                    placeholder="surname"
                    autoComplete="off"
                  />
                </label>
              </div>
              {!isValidPlayerName(playerName) &&
                (playerName.firstName.trim().length > 0 || playerName.lastName.trim().length > 0) && (
                  <div className="username-hint">Please enter first name and surname.</div>
                )}
            </div>
          ))}
        </div>

        <div className="action-buttons">
          {players.length < 8 && (
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
