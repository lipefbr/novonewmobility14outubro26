import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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

// Default cashback level percentages (used as fallback if SystemConfig has no entries).
// These mirror the defaults baked into the admin cashback-config route.
export const DEFAULT_ENTRADA_LEVELS: number[] = [5, 10, 10, 5, 5]
export const DEFAULT_RESIDUAL_LEVELS: number[] = [5, 5.5, 6, 6.5, 7, 7.5, 8]
export const DEFAULT_VENDAS_LEVELS: number[] = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.2]

// Backward-compat structured exports (kept so other files that still import the
// old constants — e.g. /api/simulator/calculate/route.ts — don't break).
// New code should prefer the async helpers below.
//
// The `users` per level reflects the 5-wide matrix structure (5^level).
// Percentages come from DEFAULT_*_LEVELS above and may be overridden at runtime
// by SystemConfig (admin-configurable).
export const ENTRADA_LEVELS = [
  { level: 1, percentage: DEFAULT_ENTRADA_LEVELS[0], users: 5 },
  { level: 2, percentage: DEFAULT_ENTRADA_LEVELS[1], users: 25 },
  { level: 3, percentage: DEFAULT_ENTRADA_LEVELS[2], users: 125 },
  { level: 4, percentage: DEFAULT_ENTRADA_LEVELS[3], users: 625 },
  { level: 5, percentage: DEFAULT_ENTRADA_LEVELS[4], users: 3125 },
]

export const RESIDUAL_LEVELS = [
  { level: 1, percentage: DEFAULT_RESIDUAL_LEVELS[0], users: 5 },
  { level: 2, percentage: DEFAULT_RESIDUAL_LEVELS[1], users: 25 },
  { level: 3, percentage: DEFAULT_RESIDUAL_LEVELS[2], users: 125 },
  { level: 4, percentage: DEFAULT_RESIDUAL_LEVELS[3], users: 625 },
  { level: 5, percentage: DEFAULT_RESIDUAL_LEVELS[4], users: 3125 },
  { level: 6, percentage: DEFAULT_RESIDUAL_LEVELS[5], users: 15625 },
  { level: 7, percentage: DEFAULT_RESIDUAL_LEVELS[6], users: 78125 },
]

export const VENDAS_LEVELS = [
  { level: 1, percentage: DEFAULT_VENDAS_LEVELS[0], category: 'mobility', users: 5 },
  { level: 2, percentage: DEFAULT_VENDAS_LEVELS[1], category: 'mobility', users: 25 },
  { level: 3, percentage: DEFAULT_VENDAS_LEVELS[2], category: 'mobility', users: 125 },
  { level: 4, percentage: DEFAULT_VENDAS_LEVELS[3], category: 'mobility', users: 625 },
  { level: 5, percentage: DEFAULT_VENDAS_LEVELS[4], category: 'mobility', users: 3125 },
  { level: 6, percentage: DEFAULT_VENDAS_LEVELS[5], category: 'mobility', users: 15625 },
  { level: 7, percentage: DEFAULT_VENDAS_LEVELS[6], category: 'mobility', users: 78125 },
  { level: 8, percentage: DEFAULT_VENDAS_LEVELS[7], category: 'mobility', users: 390625 },
  { level: 9, percentage: DEFAULT_VENDAS_LEVELS[8], category: 'mobility', users: 1953125 },
]

/**
 * Live cashback level percentages read from the SystemConfig table.
 * Keys are stored as `cashback_{type}_level_{n}` (1-indexed) by the admin
 * cashback-config route. Falls back to the hardcoded defaults on any error
 * or when no rows are configured.
 *
 * Returns a plain number[] of percentages indexed 0..N-1.
 */
export async function getEntradaLevels(): Promise<number[]> {
  const defaults = DEFAULT_ENTRADA_LEVELS
  try {
    const configs = await prisma.systemConfig.findMany({
      where: { key: { startsWith: 'cashback_entrada_level_' } },
    })
    if (configs.length === 0) return defaults
    // Start from defaults so partially-configured admins still get sensible values
    const levels = [...defaults]
    let hasAny = false
    for (const c of configs) {
      const idx = parseInt(c.key.replace('cashback_entrada_level_', '')) - 1
      if (idx >= 0 && idx < 5) {
        const v = parseFloat(c.value)
        if (!isNaN(v)) {
          levels[idx] = v
          hasAny = true
        }
      }
    }
    return hasAny ? levels : defaults
  } catch {
    return defaults
  }
}

export async function getResidualLevels(): Promise<number[]> {
  const defaults = DEFAULT_RESIDUAL_LEVELS
  try {
    const configs = await prisma.systemConfig.findMany({
      where: { key: { startsWith: 'cashback_residual_level_' } },
    })
    if (configs.length === 0) return defaults
    const levels = [...defaults]
    let hasAny = false
    for (const c of configs) {
      const idx = parseInt(c.key.replace('cashback_residual_level_', '')) - 1
      if (idx >= 0 && idx < 7) {
        const v = parseFloat(c.value)
        if (!isNaN(v)) {
          levels[idx] = v
          hasAny = true
        }
      }
    }
    return hasAny ? levels : defaults
  } catch {
    return defaults
  }
}

export async function getVendasLevels(): Promise<number[]> {
  const defaults = DEFAULT_VENDAS_LEVELS
  try {
    const configs = await prisma.systemConfig.findMany({
      where: { key: { startsWith: 'cashback_vendas_level_' } },
    })
    if (configs.length === 0) return defaults
    const levels = [...defaults]
    let hasAny = false
    for (const c of configs) {
      const idx = parseInt(c.key.replace('cashback_vendas_level_', '')) - 1
      if (idx >= 0 && idx < 9) {
        const v = parseFloat(c.value)
        if (!isNaN(v)) {
          levels[idx] = v
          hasAny = true
        }
      }
    }
    return hasAny ? levels : defaults
  } catch {
    return defaults
  }
}

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
