export function getInitials(name: string) {
  const [first, last] = name.trim().split(/\s+/)
  const firstChar = first?.charAt(0).toUpperCase() ?? ''
  const lastChar = last?.charAt(0).toUpperCase() ?? ''
  return `${firstChar}${lastChar}`.trim() || '??'
}

const PRIME_COLORS = [
  '#ef4444',
  '#2563eb',
  '#f59e0b',
  '#10b981',
  '#8b5cf6',
  '#06b6d4',
  '#db2777',
  '#14b8a6',
]

export function getAvatarColor(playerNumber: number) {
  const index = (playerNumber - 1) % PRIME_COLORS.length
  return PRIME_COLORS[index]
}
