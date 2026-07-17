export type WeatherParticleType = 'sun' | 'cloud' | 'rain' | 'snow' | 'mist' | 'none'

export type WeatherTheme = {
  id: string
  label: string
  description: string
  background: string
  overlay: string
  accent: string
  panelBackground: string
  textColor: string
  particleType: WeatherParticleType
  particleCount: number
}

const weatherThemeCache = new Map<string, WeatherTheme>()

function createTheme(config: Omit<WeatherTheme, 'id'> & { id: string }): WeatherTheme {
  return config
}

const seasonalThemes: Record<number, WeatherTheme> = {
  1: createTheme({
    id: 'winter',
    label: 'Winter',
    description: 'Snowy skies and crisp air',
    background: 'linear-gradient(135deg, #07111f 0%, #132c40 42%, #274b66 100%)',
    overlay: 'linear-gradient(120deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 100%)',
    accent: '#dbeafe',
    panelBackground: 'rgba(7, 17, 31, 0.8)',
    textColor: '#f8fafc',
    particleType: 'snow',
    particleCount: 16,
  }),
  2: createTheme({
    id: 'cold-clouds',
    label: 'Cold clouds',
    description: 'Short days and cloudy skies',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 42%, #334155 100%)',
    overlay: 'linear-gradient(120deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 100%)',
    accent: '#e2e8f0',
    panelBackground: 'rgba(15, 23, 42, 0.8)',
    textColor: '#f8fafc',
    particleType: 'mist',
    particleCount: 12,
  }),
  3: createTheme({
    id: 'spring-showers',
    label: 'Spring showers',
    description: 'Bright clouds and passing showers',
    background: 'linear-gradient(135deg, #112f34 0%, #256d6f 46%, #3b82f6 100%)',
    overlay: 'linear-gradient(120deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 100%)',
    accent: '#fef3c7',
    panelBackground: 'rgba(17, 47, 52, 0.8)',
    textColor: '#f8fafc',
    particleType: 'rain',
    particleCount: 18,
  }),
  4: createTheme({
    id: 'spring-bright',
    label: 'Spring light',
    description: 'Gentle sunshine and fresh colour',
    background: 'linear-gradient(135deg, #4c7b6b 0%, #79b3a9 48%, #fef3c7 100%)',
    overlay: 'linear-gradient(120deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 100%)',
    accent: '#f59e0b',
    panelBackground: 'rgba(76, 123, 107, 0.78)',
    textColor: '#0f172a',
    particleType: 'cloud',
    particleCount: 8,
  }),
  5: createTheme({
    id: 'spring-sun',
    label: 'May sunshine',
    description: 'Vibrant skies and warm light',
    background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 42%, #86efac 100%)',
    overlay: 'linear-gradient(120deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 100%)',
    accent: '#fef3c7',
    panelBackground: 'rgba(29, 78, 216, 0.8)',
    textColor: '#f8fafc',
    particleType: 'sun',
    particleCount: 1,
  }),
  6: createTheme({
    id: 'summer-clear',
    label: 'Summer clear',
    description: 'Blue skies and strong sunshine',
    background: 'linear-gradient(135deg, #0f4c81 0%, #1d4ed8 48%, #fbbf24 100%)',
    overlay: 'linear-gradient(120deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 100%)',
    accent: '#fde68a',
    panelBackground: 'rgba(15, 76, 129, 0.8)',
    textColor: '#f8fafc',
    particleType: 'sun',
    particleCount: 1,
  }),
  7: createTheme({
    id: 'summer-peak',
    label: 'Peak summer',
    description: 'Bright sunshine and long daylight',
    background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 35%, #fef3c7 100%)',
    overlay: 'linear-gradient(120deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 100%)',
    accent: '#f59e0b',
    panelBackground: 'rgba(15, 118, 110, 0.8)',
    textColor: '#0f172a',
    particleType: 'sun',
    particleCount: 1,
  }),
  8: createTheme({
    id: 'summer-warm',
    label: 'Late summer',
    description: 'Warm daylight and clear horizons',
    background: 'linear-gradient(135deg, #2c6e49 0%, #4ade80 46%, #fef3c7 100%)',
    overlay: 'linear-gradient(120deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 100%)',
    accent: '#fef3c7',
    panelBackground: 'rgba(44, 110, 73, 0.78)',
    textColor: '#052e16',
    particleType: 'sun',
    particleCount: 1,
  }),
  9: createTheme({
    id: 'autumn',
    label: 'Autumn',
    description: 'Partly cloudy skies and warm gold tones',
    background: 'linear-gradient(135deg, #713f12 0%, #c2410c 40%, #f59e0b 100%)',
    overlay: 'linear-gradient(120deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)',
    accent: '#fef3c7',
    panelBackground: 'rgba(113, 63, 18, 0.82)',
    textColor: '#fefce8',
    particleType: 'cloud',
    particleCount: 7,
  }),
  10: createTheme({
    id: 'autumn-clouds',
    label: 'October clouds',
    description: 'Cool mist and shifting clouds',
    background: 'linear-gradient(135deg, #4b5563 0%, #64748b 45%, #cbd5e1 100%)',
    overlay: 'linear-gradient(120deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 100%)',
    accent: '#f8fafc',
    panelBackground: 'rgba(75, 85, 99, 0.8)',
    textColor: '#f8fafc',
    particleType: 'mist',
    particleCount: 10,
  }),
  11: createTheme({
    id: 'winter-mist',
    label: 'November gloom',
    description: 'Cloudy skies, mist and light rain',
    background: 'linear-gradient(135deg, #1f2937 0%, #334155 44%, #64748b 100%)',
    overlay: 'linear-gradient(120deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 100%)',
    accent: '#bfdbfe',
    panelBackground: 'rgba(31, 41, 55, 0.8)',
    textColor: '#f8fafc',
    particleType: 'rain',
    particleCount: 16,
  }),
  12: createTheme({
    id: 'winter',
    label: 'Winter',
    description: 'Dark skies and wintery atmosphere',
    background: 'linear-gradient(135deg, #020617 0%, #111827 48%, #1d4ed8 100%)',
    overlay: 'linear-gradient(120deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 100%)',
    accent: '#dbeafe',
    panelBackground: 'rgba(2, 6, 23, 0.82)',
    textColor: '#f8fafc',
    particleType: 'snow',
    particleCount: 18,
  }),
}

function parseDate(date?: string): Date | null {
  if (!date) {
    return null
  }

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getMonth(date?: string): number {
  const parsed = parseDate(date)
  if (!parsed) {
    return new Date().getMonth() + 1
  }

  return parsed.getMonth() + 1
}

export function getSeasonalWeatherTheme(date?: string): WeatherTheme {
  return seasonalThemes[getMonth(date)] ?? seasonalThemes[8]
}

function mapHistoricalWeatherToTheme(temperatureAvg: number, precipitationAvg: number, cloudCoverAvg: number): WeatherTheme {
  if (temperatureAvg <= 0 || precipitationAvg >= 10) {
    return seasonalThemes[1]
  }

  if (temperatureAvg <= 5 && precipitationAvg >= 4) {
    return seasonalThemes[2]
  }

  if (cloudCoverAvg >= 80 && precipitationAvg >= 4) {
    return seasonalThemes[11]
  }

  if (temperatureAvg >= 24 && cloudCoverAvg <= 35) {
    return seasonalThemes[6]
  }

  if (temperatureAvg >= 18 && cloudCoverAvg <= 45) {
    return seasonalThemes[8]
  }

  if (precipitationAvg >= 6 && cloudCoverAvg >= 60) {
    return seasonalThemes[3]
  }

  if (cloudCoverAvg >= 70) {
    return seasonalThemes[10]
  }

  return seasonalThemes[8]
}

export async function resolveWeatherTheme(date?: string): Promise<WeatherTheme> {
  const referenceDate = parseDate(date)
  if (!referenceDate) {
    return getSeasonalWeatherTheme(date)
  }

  const cacheKey = formatDate(referenceDate)
  const cachedTheme = weatherThemeCache.get(cacheKey)
  if (cachedTheme) {
    return cachedTheme
  }

  const fallbackTheme = getSeasonalWeatherTheme(date)
  const historicalDate = new Date(referenceDate)
  historicalDate.setFullYear(historicalDate.getFullYear() - 1)

  const startDate = formatDate(new Date(historicalDate.getTime() - 3 * 24 * 60 * 60 * 1000))
  const endDate = formatDate(new Date(historicalDate.getTime() + 3 * 24 * 60 * 60 * 1000))

  try {
    const response = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=51.5072&longitude=-0.1276&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean,precipitation_sum,cloud_cover_mean&timezone=UTC`,
    )

    if (!response.ok) {
      throw new Error(`Weather API failed with ${response.status}`)
    }

    const data = await response.json()
    const dailyData = Array.isArray(data?.daily?.time) ? data.daily.time : []
    const temperatures = Array.isArray(data?.daily?.temperature_2m_mean) ? data.daily.temperature_2m_mean : []
    const precipitation = Array.isArray(data?.daily?.precipitation_sum) ? data.daily.precipitation_sum : []
    const cloudCover = Array.isArray(data?.daily?.cloud_cover_mean) ? data.daily.cloud_cover_mean : []

    const validEntries: Array<{ temperature: number; precipitation: number; cloudCover: number }> = dailyData.map((_: unknown, index: number) => ({
      temperature: Number(temperatures[index] ?? 0),
      precipitation: Number(precipitation[index] ?? 0),
      cloudCover: Number(cloudCover[index] ?? 0),
    }))

    if (validEntries.length === 0) {
      throw new Error('Weather API returned no data')
    }

    const temperatureAvg = validEntries.reduce((sum: number, entry: { temperature: number; precipitation: number; cloudCover: number }) => sum + entry.temperature, 0) / validEntries.length
    const precipitationAvg = validEntries.reduce((sum: number, entry: { temperature: number; precipitation: number; cloudCover: number }) => sum + entry.precipitation, 0) / validEntries.length
    const cloudCoverAvg = validEntries.reduce((sum: number, entry: { temperature: number; precipitation: number; cloudCover: number }) => sum + entry.cloudCover, 0) / validEntries.length

    const theme = mapHistoricalWeatherToTheme(temperatureAvg, precipitationAvg, cloudCoverAvg)
    weatherThemeCache.set(cacheKey, theme)
    return theme
  } catch {
    weatherThemeCache.set(cacheKey, fallbackTheme)
    return fallbackTheme
  }
}
