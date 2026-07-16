import { useEffect, useMemo, useState, useRef } from 'react'
import './App.css'
import fixtureData from './dataSource/en.1.json'
import FinalAnswerPage from './FinalAnswerPage'
import { getAvatarColor, getInitials } from './avatarUtils'
import football1 from './assets/Footballs/football-svgrepo-com.svg'
import football2 from './assets/Footballs/football-ball-svgrepo-com.svg'
import football3 from './assets/Footballs/football-2-svgrepo-com.svg'
import trophyImage from './assets/PremLeague_Trophy.png'

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

type PhysicsFootball = {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  size: number
  svgIndex: number
  rotation: number
}

type PageHistoryEntry = {
  page: 'selection' | 'finalAnswer' | 'finish'
  week: number
}

const PICKS_STORAGE_KEY_PREFIX = 'top-pick-gameweek'
const PLAYER_RECORDS_STORAGE_KEY = 'top-pick-player-records'
const GRAVITY = 0.5
const BOUNCE_DAMPING = 0.75
const FRICTION = 0.99
const FOOTBALL_SVGS = [football1, football2, football3]

function getPickStorageKey(week: number) {
  return `${PICKS_STORAGE_KEY_PREFIX}-${week}-picks`
}

function createPhysicsFootball(width: number): PhysicsFootball {
  const size = 40 + Math.random() * 30
  return {
    id: `football-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    x: Math.random() * (width - size),
    y: -size,
    vx: (Math.random() - 0.5) * 2,
    vy: 0,
    size,
    svgIndex: Math.floor(Math.random() * FOOTBALL_SVGS.length),
    rotation: 0,
  }
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

function BlankPage({ onBack, players, playerNumbers, onQuit }: BlankPageProps) {
  const [currentWeek, setCurrentWeek] = useState(1)
  const [currentPage, setCurrentPage] = useState<'selection' | 'finalAnswer' | 'finish'>('selection')
  const [viewHistory, setViewHistory] = useState<PageHistoryEntry[]>([])
  const [footballBalls, setFootballBalls] = useState<PhysicsFootball[]>(() =>
    Array.from({ length: 8 }, () => createPhysicsFootball(window.innerWidth)),
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const footballsRef = useRef<PhysicsFootball[]>(footballBalls)

  const currentWeekLabel = `Gameweek ${currentWeek}`
  const currentRoundLabel = `Matchday ${currentWeek}`

  // Physics simulation
  useEffect(() => {
    footballsRef.current = footballBalls
  }, [footballBalls])

  // Reset footballs whenever the selection page becomes active or the gameweek changes
  useEffect(() => {
    if (currentPage !== 'selection' || !containerRef.current) {
      return
    }

    setFootballBalls(
      Array.from({ length: 8 }, () => createPhysicsFootball(containerRef.current!.clientWidth)),
    )
  }, [currentWeek, currentPage])

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const updatePhysics = () => {
      // Validate container dimensions
      if (container.clientWidth <= 0 || container.clientHeight <= 0) {
        animationRef.current = requestAnimationFrame(updatePhysics)
        return
      }

      setFootballBalls((prevBalls) => {
        const updated = prevBalls.map((ball) => {
          let { x, y, vx, vy, rotation } = ball
          const { size } = ball

          // Apply gravity
          vy += GRAVITY

          // Apply friction
          vx *= FRICTION
          vy *= FRICTION

          // Update position
          x += vx
          y += vy

          // Update rotation based on velocity
          rotation += Math.sqrt(vx * vx + vy * vy) * 2

          // Bounce off walls
          if (x <= 0) {
            x = 0
            vx = Math.abs(vx) * BOUNCE_DAMPING
          } else if (x + size >= container.clientWidth) {
            x = container.clientWidth - size
            vx = -Math.abs(vx) * BOUNCE_DAMPING
          }

          // Bounce off bottom
          if (y + size >= container.clientHeight) {
            y = container.clientHeight - size
            vy = -Math.abs(vy) * BOUNCE_DAMPING
          }

          // Remove if fallen too far down (will be replaced by new ones)
          if (y > container.clientHeight + 100) {
            return {
              ...ball,
              x: Math.random() * (container.clientWidth - size),
              y: -size,
              vx: (Math.random() - 0.5) * 2,
              vy: 0,
              rotation: 0,
            }
          }

          return { ...ball, x, y, vx, vy, rotation }
        })

        // Collision detection between footballs
        for (let i = 0; i < updated.length; i++) {
          for (let j = i + 1; j < updated.length; j++) {
            const ballA = updated[i]
            const ballB = updated[j]
            const dx = ballB.x - ballA.x
            const dy = ballB.y - ballA.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const minDistance = (ballA.size + ballB.size) / 2

            if (distance < minDistance) {
              // Collision detected
              const angle = Math.atan2(dy, dx)
              const sin = Math.sin(angle)
              const cos = Math.cos(angle)

              // Swap velocities along collision axis
              const temp = ballA.vx * cos + ballA.vy * sin
              ballA.vx = (ballB.vx * cos + ballB.vy * sin) * BOUNCE_DAMPING
              ballA.vy = temp * BOUNCE_DAMPING

              ballB.vx = (temp) * BOUNCE_DAMPING
              ballB.vy = (ballA.vx * cos + ballA.vy * sin) * BOUNCE_DAMPING

              // Separate balls to avoid sticking
              const overlap = (minDistance - distance) / 2 + 1
              ballA.x -= overlap * cos
              ballA.y -= overlap * sin
              ballB.x += overlap * cos
              ballB.y += overlap * sin
            }
          }
        }

        return updated
      })

      animationRef.current = requestAnimationFrame(updatePhysics)
    }

    animationRef.current = requestAnimationFrame(updatePhysics)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Spawn new footballs every 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      setFootballBalls((prevBalls) => {
        if (!containerRef.current) return prevBalls
        
        const newBalls = Array.from({ length: 3 }, () => 
          createPhysicsFootball(containerRef.current!.clientWidth)
        )
        const combined = [...prevBalls, ...newBalls]
        
        // Keep max 100 footballs on screen
        if (combined.length > 100) {
          return combined.slice(combined.length - 100)
        }
        return combined
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const weeklyMatches = (fixtureData.matches as Match[]).filter(
    (match) => match.round === currentRoundLabel,
  )

  const activePlayers = players.filter((player) => player.trim().length > 0)

  const availableTeams = Array.from(
    new Set(weeklyMatches.flatMap((match) => [match.team1, match.team2])),
  ).sort((a, b) => a.localeCompare(b))

  const parseWeekNumber = (weekLabel: string) => {
    const match = weekLabel.match(/Gameweek\s*(\d+)/i)
    return match ? Number(match[1]) : null
  }

  const isSameSeasonHalf = (weekNumber: number, currentWeekNumber: number) =>
    currentWeekNumber <= 20 ? weekNumber <= 20 : weekNumber >= 21

  const getUsedTeamsForPlayer = (player: string) => {
    const playerRecord = playerRecords[player]
    if (!playerRecord) {
      return new Set<string>()
    }

    const currentWeekNumber = parseWeekNumber(currentWeekLabel)
    return new Set(
      Object.entries(playerRecord.picks)
        .filter(([weekLabel]) => {
          const weekNumber = parseWeekNumber(weekLabel)
          return (
            weekLabel !== currentWeekLabel &&
            weekNumber !== null &&
            currentWeekNumber !== null &&
            isSameSeasonHalf(weekNumber, currentWeekNumber)
          )
        })
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const activePlayerSet = new Set(activePlayers)
    let hasStaleRecords = false
    const filteredRecords = Object.keys(playerRecords).reduce((nextRecords, player) => {
      if (activePlayerSet.has(player)) {
        nextRecords[player] = playerRecords[player]
      } else {
        hasStaleRecords = true
      }
      return nextRecords
    }, {} as Record<string, PlayerRecord>)

    if (hasStaleRecords) {
      setPlayerRecords(filteredRecords)
    }

    const filteredSelections = Object.entries(selections).reduce(
      (nextSelections, [player, team]) => {
        if (activePlayerSet.has(player)) {
          nextSelections[player] = team
        }
        return nextSelections
      },
      {} as Record<string, string>,
    )

    if (Object.keys(filteredSelections).length !== Object.keys(selections).length) {
      setSelections(filteredSelections)
      window.localStorage.setItem(getPickStorageKey(currentWeek), JSON.stringify(filteredSelections))
    }
  }, [activePlayers, currentWeek, playerRecords, selections])

  const [isQuitConfirmOpen, setIsQuitConfirmOpen] = useState(false)
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false)

  const handleFinishConfirm = (confirmed: boolean) => {
    if (confirmed) {
      handleFinishPage()
    }
    setIsFinishConfirmOpen(false)
  }

  const finishFireworks = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        id: `firework-${index}`,
        left: `${10 + Math.random() * 80}%`,
        top: `${6 + Math.random() * 24}%`,
        delay: `${Math.random() * 3}s`,
        duration: `${1.8 + Math.random() * 1.4}s`,
        color: ['#f59e0b', '#ef4444', '#22c55e', '#60a5fa', '#a855f7'][index % 5],
      })),
    [],
  )

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
      // Clear all localStorage game data FIRST before resetting state
      clearAllWeekPicks()
      window.localStorage.removeItem(PLAYER_RECORDS_STORAGE_KEY)
      
      // Explicitly clear the current week's selections storage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(getPickStorageKey(currentWeek))
      }
      
      // Reset local state AFTER clearing localStorage
      setSelections({})
      setPlayerRecords({})
      setAreSelectionsLoaded(false)
      setCurrentWeek(1)
      setCurrentPage('selection')
      setViewHistory([])
      
      // Return to App which will reset player names
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

    // Clear all game data when going home
    clearAllWeekPicks()
    window.localStorage.removeItem(PLAYER_RECORDS_STORAGE_KEY)
    setSelections({})
    setPlayerRecords({})
    setCurrentWeek(1)
    setCurrentPage('selection')
    setViewHistory([])
    setAreSelectionsLoaded(false)
    onBack()
  }

  const handleAdvanceWeek = () => {
    setViewHistory((currentHistory) => [
      ...currentHistory,
      { page: 'finalAnswer', week: currentWeek },
    ])
    setCurrentWeek((value) => value + 1)
    setFootballBalls(
      Array.from({ length: 8 }, () =>
        createPhysicsFootball(containerRef.current?.clientWidth ?? window.innerWidth),
      ),
    )
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

    const topThree = leaderboardEntries.slice(0, 3)
    const getRankColor = (index: number) => {
      if (index === 0) return '#FFD700'
      if (index === 1) return '#C0C0C0'
      if (index === 2) return '#CD7F32'
      return '#E0E0E0'
    }

    return (
      <div className="blank-page finish-page" aria-label="finish page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '24px', padding: '32px 24px', flexWrap: 'wrap' }}>
        <div style={{
          width: 'min(380px, 38vw)',
          borderRadius: '28px',
          padding: '28px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.35)',
          color: '#f8fafc',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.8rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Leaderboard
            </h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button style={{ padding: '8px 14px', fontSize: '0.85rem', border: 'none', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', color: '#f8fafc', cursor: 'pointer' }}>Today</button>
              <button style={{ padding: '8px 14px', fontSize: '0.85rem', border: 'none', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', color: '#f8fafc', cursor: 'pointer' }}>Week</button>
              <button style={{ padding: '8px 14px', fontSize: '0.85rem', border: 'none', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', color: '#f8fafc', cursor: 'pointer' }}>Month</button>
            </div>
          </div>

          {/* Top 3 Players */}
          {topThree.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px', alignItems: 'flex-end' }}>
              {topThree.map(([player, record], index) => (
                <div key={player} style={{ textAlign: 'center', flexBasis: index === 0 ? '40%' : '30%', order: index === 0 ? 2 : index === 1 ? 1 : 3 }}>
                  {index === 0 && <div style={{ fontSize: '28px', marginBottom: '4px' }}>👑</div>}
                  <div style={{
                    width: index === 0 ? '70px' : '60px',
                    height: index === 0 ? '70px' : '60px',
                    borderRadius: '50%',
                    backgroundColor: getAvatarColor(playerNumbers[player] ?? 1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                    fontSize: index === 0 ? '1.4rem' : '1.2rem',
                    fontWeight: '800',
                    color: '#fff',
                    boxShadow: `0 4px 12px ${getRankColor(index)}80`,
                  }}>
                    {getInitials(player)}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#e2e8f0' }}>{player}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: getRankColor(index), marginTop: '4px' }}>
                    {record.totalPoints} pts
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All Players List */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.14)', paddingTop: '16px' }}>
            {leaderboardEntries.length > 0 ? (
              leaderboardEntries.map((entry, index) => (
                <div
                  key={entry[0]}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    marginBottom: '8px',
                    borderRadius: '12px',
                    backgroundColor: index === 0 ? 'rgba(255, 215, 0, 0.15)' : index === 1 ? 'rgba(192, 192, 192, 0.15)' : index === 2 ? 'rgba(205, 127, 50, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: getRankColor(index),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: '800',
                    color: index === 0 ? '#000' : '#fff',
                    minWidth: '32px',
                  }}>
                    {index + 1}
                  </div>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: getAvatarColor(playerNumbers[entry[0]] ?? 1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: '800',
                    color: '#fff',
                  }}>
                    {getInitials(entry[0])}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>{entry[0]}</span>
                      {index === 0 && (
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#facc15', textTransform: 'uppercase' }}>
                          Winner
                        </span>
                      )}
                      {index === 1 && (
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#60a5fa', textTransform: 'uppercase' }}>
                          Champions League
                        </span>
                      )}
                      {index === leaderboardEntries.length - 1 && leaderboardEntries.length > 1 && (
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#ef4444', textTransform: 'uppercase' }}>
                          relegated
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: getRankColor(index) }}>
                    {entry[1].totalPoints} pts
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>No players yet</div>
            )}
          </div>

          {/* Go Home Button */}
          <button
            type="button"
            onClick={onQuit}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '20px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: 'pointer',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Go Home
          </button>
        </div>

        <div className="finish-image-panel">
          <img
            className="finish-trophy-image"
            src={trophyImage}
            alt="Trophy"
          />
        </div>

        <div className="finish-fireworks-layer" aria-hidden="true">
          {finishFireworks.map((firework) => (
            <span
              key={firework.id}
              className="finish-firework"
              style={{
                left: firework.left,
                top: firework.top,
                animationDelay: firework.delay,
                animationDuration: firework.duration,
                color: firework.color,
              }}
            />
          ))}
        </div>

        <div className="finish-confetti-layer" aria-hidden="true">
          <div className="finish-confetti-group left">
            <span className="finish-confetti-piece piece-1" />
            <span className="finish-confetti-piece piece-2" />
            <span className="finish-confetti-piece piece-3" />
            <span className="finish-confetti-piece piece-4" />
            <span className="finish-confetti-piece piece-5" />
            <span className="finish-confetti-piece piece-6" />
          </div>
          <div className="finish-confetti-group right">
            <span className="finish-confetti-piece piece-1" />
            <span className="finish-confetti-piece piece-2" />
            <span className="finish-confetti-piece piece-3" />
            <span className="finish-confetti-piece piece-4" />
            <span className="finish-confetti-piece piece-5" />
            <span className="finish-confetti-piece piece-6" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="blank-page" ref={containerRef} aria-label="blank page">
      <div className="football-background">
        {footballBalls.map((ball) => (
          <img
            key={ball.id}
            src={FOOTBALL_SVGS[ball.svgIndex]}
            alt="football"
            style={{
              position: 'absolute',
              left: `${ball.x}px`,
              top: `${ball.y}px`,
              width: `${ball.size}px`,
              height: `${ball.size}px`,
              transform: `rotate(${ball.rotation}deg)`,
              zIndex: 0,
            }}
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

        <button type="button" className="sidebar-quit-button" onClick={() => setIsFinishConfirmOpen(true)}>
          finish and see results
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

      {isFinishConfirmOpen && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-card">
            <h3>Ready to finish and see results?</h3>
            <div className="confirm-actions">
              <button type="button" className="confirm-yes" onClick={() => handleFinishConfirm(true)}>
                yes
              </button>
              <button type="button" className="confirm-no" onClick={() => handleFinishConfirm(false)}>
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
