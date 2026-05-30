import { createHash } from 'crypto'
import { NextResponse } from 'next/server'

export const hashPassword = (password: string) =>
  createHash('sha256').update(password).digest('hex')

export const verifyPassword = (password: string, hash: string) =>
  hashPassword(password) === hash

export function generateReferralCode(name: string): string {
  const base = name
    .split(' ')
    .map((n) => n.toUpperCase())
    .slice(0, 2)
    .join('')
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${base}${num}`
}

export function success(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function centsToReais(cents: number): number {
  return cents / 100
}

export function reaisToCents(reais: number): number {
  return Math.round(reais * 100)
}

export function formatTimeSince(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const months = Math.floor(days / 30)
  const years = Math.floor(months / 12)

  if (years > 0) return `${years} ano${years > 1 ? 's' : ''}`
  if (months > 0) return `${months} mês${months > 1 ? 'es' : ''}`
  if (days > 0) return `${days} dia${days > 1 ? 's' : ''}`
  return 'Hoje'
}

// Matrix constants
export const ENTRADA_LEVELS = [
  { level: 1, percentage: 5, users: 4 },
  { level: 2, percentage: 10, users: 16 },
  { level: 3, percentage: 10, users: 64 },
  { level: 4, percentage: 5, users: 256 },
  { level: 5, percentage: 5, users: 1024 },
]

export const RESIDUAL_LEVELS = [
  { level: 1, percentage: 5 },
  { level: 2, percentage: 5.5 },
  { level: 3, percentage: 6 },
  { level: 4, percentage: 6.5 },
  { level: 5, percentage: 7 },
  { level: 6, percentage: 7.5 },
  { level: 7, percentage: 8 },
]

export const VENDAS_LEVELS = [
  { level: 1, percentage: 0.1, category: 'mobility' },
  { level: 2, percentage: 0.1, category: 'mobility' },
  { level: 3, percentage: 0.1, category: 'mobility' },
  { level: 4, percentage: 0.1, category: 'mobility' },
  { level: 5, percentage: 0.1, category: 'mobility' },
  { level: 6, percentage: 0.1, category: 'mobility' },
  { level: 7, percentage: 0.1, category: 'mobility' },
  { level: 8, percentage: 0.1, category: 'mobility' },
  { level: 9, percentage: 0.2, category: 'mobility' },
]

export const CAREER_RANKS = [
  { name: 'Associado', minPoints: 0, stars: 0 },
  { name: 'Bronze', minPoints: 10, stars: 1 },
  { name: 'Prata', minPoints: 25, stars: 2 },
  { name: 'Ouro', minPoints: 50, stars: 3 },
  { name: 'Safira', minPoints: 100, stars: 4 },
  { name: 'Diamante', minPoints: 250, stars: 5 },
]

export function getCareerRank(points: number) {
  let rank = CAREER_RANKS[0]
  for (const r of CAREER_RANKS) {
    if (points >= r.minPoints) rank = r
  }
  return rank
}

export function getNextRank(points: number) {
  for (const r of CAREER_RANKS) {
    if (points < r.minPoints) return r
  }
  return null
}

export function sanitizeUser(user: Record<string, unknown>) {
  const { password: _, ...safeUser } = user
  return safeUser
}
