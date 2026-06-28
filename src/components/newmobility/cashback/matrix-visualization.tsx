'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { Users, Layers, TrendingUp, Sparkles } from 'lucide-react'

// Animated counter component for total members highlight.
// Replaces the previous `AnimatedEarningsCounter` which displayed a
// monetary (R$) total — privacy requirement: no personal earnings on
// user-facing pages.
function AnimatedMemberCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true
    const duration = 1500
    const steps = 60
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return (
    <span className="font-bold tabular-nums text-2xl md:text-3xl text-white">
      {display.toLocaleString('pt-BR')}
      <span className="text-sm font-medium text-emerald-100 ml-1.5">membros</span>
    </span>
  )
}

// Tooltip component for level cards
function LevelTooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [show, setShow] = useState(false)
  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] rounded-lg whitespace-nowrap z-50 shadow-lg">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
        </div>
      )}
    </div>
  )
}

interface MatrixLevelData {
  level: number
  positions: number
  percentage: string
  totalUsers: number
  filled: number
}

interface MatrixVisualizationProps {
  type: 'entrada' | 'residual' | 'vendas'
}

// Fallback config used as the initial loading state (before the API responds)
// and as a safety net if the fetch fails. Percentages mirror the DEFAULT_*
// constants in api-utils.ts so admin-unconfigured installs still see
// sensible numbers.
// NOTE: `earnings` and `maxEarnings` were removed (privacy: no R$ on
// user-facing pages). Per-level "members" counts come from `filled`.
const FALLBACK_MATRIX_CONFIG: Record<string, {
  levels: MatrixLevelData[]
  title: string
  description: string
}> = {
  entrada: {
    levels: [
      { level: 1, positions: 5, percentage: '5%', totalUsers: 5, filled: 4 },
      { level: 2, positions: 25, percentage: '10%', totalUsers: 25, filled: 12 },
      { level: 3, positions: 125, percentage: '10%', totalUsers: 125, filled: 32 },
      { level: 4, positions: 625, percentage: '5%', totalUsers: 625, filled: 80 },
      { level: 5, positions: 3125, percentage: '5%', totalUsers: 3125, filled: 200 },
    ],
    title: 'Matriz CashBack Entrada',
    description: 'Estrutura 5x5 com 5 níveis de profundidade',
  },
  residual: {
    levels: [
      { level: 1, positions: 5, percentage: '5%', totalUsers: 5, filled: 4 },
      { level: 2, positions: 25, percentage: '5.5%', totalUsers: 25, filled: 12 },
      { level: 3, positions: 125, percentage: '6%', totalUsers: 125, filled: 30 },
      { level: 4, positions: 625, percentage: '6.5%', totalUsers: 625, filled: 60 },
      { level: 5, positions: 3125, percentage: '7%', totalUsers: 3125, filled: 100 },
      { level: 6, positions: 15625, percentage: '7.5%', totalUsers: 15625, filled: 200 },
      { level: 7, positions: 78125, percentage: '8%', totalUsers: 78125, filled: 400 },
    ],
    title: 'Matriz CashBack Residual',
    description: 'Estrutura 5x7 com 7 níveis de profundidade',
  },
  vendas: {
    levels: [
      { level: 1, positions: 5, percentage: '0.10%', totalUsers: 5, filled: 4 },
      { level: 2, positions: 25, percentage: '0.10%', totalUsers: 25, filled: 14 },
      { level: 3, positions: 125, percentage: '0.10%', totalUsers: 125, filled: 40 },
      { level: 4, positions: 625, percentage: '0.10%', totalUsers: 625, filled: 100 },
      { level: 5, positions: 3125, percentage: '0.10%', totalUsers: 3125, filled: 250 },
      { level: 6, positions: 15625, percentage: '0.10%', totalUsers: 15625, filled: 600 },
      { level: 7, positions: 78125, percentage: '0.10%', totalUsers: 78125, filled: 1200 },
      { level: 8, positions: 390625, percentage: '0.10%', totalUsers: 390625, filled: 3000 },
      { level: 9, positions: 1953125, percentage: '0.20%', totalUsers: 1953125, filled: 8000 },
    ],
    title: 'Matriz CashBack Vendas',
    description: 'Estrutura 5x9 com 9 níveis de profundidade',
  },
}

// Titles/descriptions are static (they describe the matrix structure, not config)
const MATRIX_META: Record<string, { title: string; description: string }> = {
  entrada: { title: 'Matriz CashBack Entrada', description: 'Estrutura 5x5 com 5 níveis de profundidade' },
  residual: { title: 'Matriz CashBack Residual', description: 'Estrutura 5x7 com 7 níveis de profundidade' },
  vendas: { title: 'Matriz CashBack Vendas', description: 'Estrutura 5x9 com 9 níveis de profundidade' },
}

// Format a numeric percentage like 5 -> "5%", 5.5 -> "5.5%", 0.1 -> "0.10%", 0.2 -> "0.20%"
function formatPercentage(value: number): string {
  if (value < 1) {
    // Pad to 2 decimal places for sub-1% values (matches original "0.10%" / "0.20%" style)
    return `${value.toFixed(2)}%`
  }
  // Whole or decimal percentages: trim trailing zeros (10 -> "10%", 5.5 -> "5.5%")
  const trimmed = `${value}`.replace(/\.0+$/, '')
  return `${trimmed}%`
}

const levelColors = [
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-amber-500',
  'bg-orange-500',
  'bg-rose-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
]

const levelGradientColors = [
  'from-emerald-400 to-emerald-600',
  'from-teal-400 to-teal-600',
  'from-cyan-400 to-cyan-600',
  'from-amber-400 to-amber-600',
  'from-orange-400 to-orange-600',
  'from-rose-400 to-rose-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-indigo-400 to-indigo-600',
]

export function MatrixVisualization({ type }: MatrixVisualizationProps) {
  const { user } = useStore()
  const [config, setConfig] = useState(FALLBACK_MATRIX_CONFIG[type])

  // Fetch live cashback levels (admin-configured percentages) from the
  // cashback API, AND fetch the real per-level network member counts
  // from /api/dashboard (whose `byLevel` is computed from the actual
  // referral tree by `countNetworkDescendants`). The cashback API's
  // per-level `currentUsers` is derived from CashbackEntry
  // transactions (0 for users who haven't received payouts yet) —
  // not useful for a per-level "members" display, so we override it
  // with the dashboard's `byLevel` data.
  // Falls back to FALLBACK_MATRIX_CONFIG on any error.
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    Promise.all([
      fetch(`/api/cashback/${type}?userId=${user.id}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`/api/dashboard?userId=${user.id}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([cashbackData, dashboardData]) => {
      if (cancelled || !cashbackData || !Array.isArray(cashbackData.levels)) return

      // The dashboard's per-matrix byLevel map has the REAL network
      // descendant count at each level (1-indexed).
      const byLevelKey =
        type === 'entrada' ? 'cashbackEntrada' :
        type === 'residual' ? 'cashbackResidual' :
        'cashbackVendas'
      const byLevel: Record<string, number> = dashboardData?.[byLevelKey]?.byLevel ?? {}

      const meta = MATRIX_META[type] ?? { title: type, description: '' }
      const levels: MatrixLevelData[] = cashbackData.levels.map((lvl: any, i: number) => {
        const levelNum = lvl.level ?? i + 1
        const positions = Math.pow(5, levelNum) // structural matrix dim (5-wide)
        // Prefer the dashboard's byLevel count (real network size at
        // this level); fall back to the cashback API's currentUsers
        // (count of CashbackEntry transactions at this level) if the
        // dashboard data isn't available.
        const filled =
          typeof byLevel[String(levelNum)] === 'number'
            ? byLevel[String(levelNum)]
            : (typeof lvl.currentUsers === 'number' ? lvl.currentUsers : 0)
        const percentageStr = formatPercentage(
          typeof lvl.percentage === 'number' ? lvl.percentage : 0
        )
        return {
          level: levelNum,
          positions,
          percentage: percentageStr,
          totalUsers: positions,
          filled,
        }
      })

      setConfig({
        levels,
        title: meta.title,
        description: meta.description,
      })
    })

    return () => {
      cancelled = true
    }
  }, [type, user?.id])

  const totalUsers = config.levels.reduce((sum, l) => sum + l.filled, 0)
  const totalCapacity = config.levels.reduce((sum, l) => sum + l.positions, 0)
  const maxMembers = Math.max(...config.levels.map(l => l.filled), 0)

  return (
    <div className="space-y-5">
      {/* Total Members Highlight Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 shadow-lg overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }} />
          <div className="absolute inset-0 animate-shimmer" />
          <CardContent className="p-4 md:p-5 relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-emerald-200" />
                <p className="text-sm text-emerald-100 font-medium">Total de Membros - {config.title}</p>
              </div>
              <AnimatedMemberCounter value={totalUsers} />
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                <p className="text-[10px] text-emerald-200 uppercase tracking-wide">Capacidade</p>
                <p className="text-lg font-bold text-white">{totalCapacity.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                <p className="text-[10px] text-emerald-200 uppercase tracking-wide">Níveis</p>
                <p className="text-sm font-bold text-white">{config.levels.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="bg-card shadow-sm">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Total Membros</p>
                <p className="text-sm font-bold text-foreground">{totalUsers.toLocaleString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="bg-card shadow-sm">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Capacidade</p>
                <p className="text-sm font-bold text-foreground">{totalCapacity.toLocaleString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card shadow-sm">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Máx. no Nível</p>
                <p className="text-sm font-bold text-foreground">{maxMembers.toLocaleString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="bg-card shadow-sm">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Níveis</p>
                <p className="text-sm font-bold text-foreground">{config.levels.length}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Horizontal stacked bar with background pattern — now shows member distribution by level */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="bg-card shadow-sm overflow-hidden relative">
          {/* Subtle grid background pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }} />
          <CardContent className="p-4 relative">
            <p className="text-xs font-medium text-muted-foreground mb-2">Proporção de Membros por Nível</p>
            <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
              {config.levels.map((lvl, i) => {
                const widthPct = totalUsers > 0 ? (lvl.filled / totalUsers) * 100 : 0
                return (
                  <motion.div
                    key={lvl.level}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(widthPct, 0.5)}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
                    className={cn('rounded-sm bg-gradient-to-r', levelGradientColors[i % levelGradientColors.length])}
                    title={`Nível ${lvl.level}: ${lvl.filled} membros`}
                  />
                )
              })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {config.levels.map((lvl, i) => (
                <span key={lvl.level} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className={cn('w-2 h-2 rounded-sm shrink-0', levelColors[i % levelColors.length])} />
                  N{lvl.level}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="bg-card shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Nível</TableHead>
                  <TableHead className="text-right">Membros</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">%</TableHead>
                  <TableHead className="text-right">Capacidade</TableHead>
                  <TableHead className="w-32 hidden md:table-cell">Progresso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.levels.map((lvl, i) => {
                  const fillPct = Math.round((lvl.filled / lvl.positions) * 100)
                  const membersPct = maxMembers > 0 ? Math.round((lvl.filled / maxMembers) * 100) : 0
                  return (
                    <TableRow key={lvl.level}>
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-white text-xs font-bold', levelColors[i % levelColors.length])}>
                          N{lvl.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {lvl.filled.toLocaleString('pt-BR')}
                        <span className="block text-[10px] font-normal text-muted-foreground">{membersPct}% do pico</span>
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell text-muted-foreground">
                        {lvl.percentage}
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {lvl.positions.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${fillPct}%` }}
                              transition={{ delay: 0.3 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
                              className={cn('h-full rounded-full bg-gradient-to-r', levelGradientColors[i % levelGradientColors.length])}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-8 text-right">{fillPct}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Card Grid with hover tooltips and card elevation */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {config.levels.map((lvl, i) => {
            const fillPct = Math.round((lvl.filled / lvl.positions) * 100)
            return (
              <motion.div
                key={lvl.level}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.05, type: 'spring', stiffness: 200 }}
              >
                <LevelTooltip content={`Nível ${lvl.level}: ${lvl.filled}/${lvl.positions} membros · ${lvl.percentage}`}>
                  <Card className="shadow-sm bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className={cn('text-white text-xs', levelColors[i % levelColors.length])}>
                          Nível {lvl.level}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{lvl.percentage}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Membros</p>
                          <p className="text-sm font-bold text-foreground">
                            {lvl.filled.toLocaleString('pt-BR')}<span className="text-muted-foreground font-normal">/{lvl.positions.toLocaleString('pt-BR')}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Ocupação</p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {fillPct}%
                          </p>
                        </div>
                        {/* Gradient progress bar */}
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${fillPct}%` }}
                            transition={{ delay: 0.5 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                            className={cn('h-full rounded-full bg-gradient-to-r', levelGradientColors[i % levelGradientColors.length])}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </LevelTooltip>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
