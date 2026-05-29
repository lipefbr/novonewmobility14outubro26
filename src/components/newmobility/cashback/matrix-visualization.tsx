'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { formatCurrency, cn } from '@/lib/utils'
import { Users, DollarSign, TrendingUp, Layers } from 'lucide-react'

interface MatrixLevelData {
  level: number
  positions: number
  percentage: string
  totalUsers: number
  filled: number
  earnings: number
}

interface MatrixVisualizationProps {
  type: 'entrada' | 'residual' | 'vendas'
}

const matrixConfig: Record<string, {
  levels: MatrixLevelData[]
  title: string
  description: string
  maxEarnings: string
}> = {
  entrada: {
    levels: [
      { level: 1, positions: 4, percentage: '5%', totalUsers: 4, filled: 4, earnings: 65000 },
      { level: 2, positions: 16, percentage: '10%', totalUsers: 16, filled: 12, earnings: 195000 },
      { level: 3, positions: 64, percentage: '10%', totalUsers: 64, filled: 32, earnings: 520000 },
      { level: 4, positions: 256, percentage: '5%', totalUsers: 256, filled: 80, earnings: 650000 },
      { level: 5, positions: 1024, percentage: '5%', totalUsers: 1024, filled: 200, earnings: 1828000 },
    ],
    title: 'Matriz CashBack Entrada',
    description: 'Estrutura 4x5 com 5 níveis de profundidade',
    maxEarnings: 'R$ 32.580,00',
  },
  residual: {
    levels: [
      { level: 1, positions: 4, percentage: '5%', totalUsers: 4, filled: 4, earnings: 45000 },
      { level: 2, positions: 16, percentage: '5.5%', totalUsers: 16, filled: 12, earnings: 98000 },
      { level: 3, positions: 64, percentage: '6%', totalUsers: 64, filled: 30, earnings: 215000 },
      { level: 4, positions: 256, percentage: '6.5%', totalUsers: 256, filled: 60, earnings: 468000 },
      { level: 5, positions: 1024, percentage: '7%', totalUsers: 1024, filled: 100, earnings: 320000 },
      { level: 6, positions: 4096, percentage: '7.5%', totalUsers: 4096, filled: 200, earnings: 390000 },
      { level: 7, positions: 16384, percentage: '8%', totalUsers: 16384, filled: 400, earnings: 288000 },
    ],
    title: 'Matriz CashBack Residual',
    description: 'Estrutura 4x7 com 7 níveis de profundidade',
    maxEarnings: 'R$ 18.240,00',
  },
  vendas: {
    levels: [
      { level: 1, positions: 4, percentage: '0.10%', totalUsers: 4, filled: 4, earnings: 12000 },
      { level: 2, positions: 16, percentage: '0.10%', totalUsers: 16, filled: 14, earnings: 48000 },
      { level: 3, positions: 64, percentage: '0.10%', totalUsers: 64, filled: 40, earnings: 192000 },
      { level: 4, positions: 256, percentage: '0.10%', totalUsers: 256, filled: 100, earnings: 640000 },
      { level: 5, positions: 1024, percentage: '0.10%', totalUsers: 1024, filled: 250, earnings: 1600000 },
      { level: 6, positions: 4096, percentage: '0.10%', totalUsers: 4096, filled: 600, earnings: 2560000 },
      { level: 7, positions: 16384, percentage: '0.10%', totalUsers: 16384, filled: 1200, earnings: 2560000 },
      { level: 8, positions: 65536, percentage: '0.10%', totalUsers: 65536, filled: 3000, earnings: 1200000 },
      { level: 9, positions: 262144, percentage: '0.20%', totalUsers: 262144, filled: 8000, earnings: 2378000 },
    ],
    title: 'Matriz CashBack Vendas',
    description: 'Estrutura 4x9 com 9 níveis de profundidade',
    maxEarnings: 'R$ 106.025,00',
  },
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

export function MatrixVisualization({ type }: MatrixVisualizationProps) {
  const config = matrixConfig[type]
  const totalUsers = config.levels.reduce((sum, l) => sum + l.filled, 0)
  const totalEarnings = config.levels.reduce((sum, l) => sum + l.earnings, 0)
  const maxEarnings = Math.max(...config.levels.map(l => l.earnings))

  return (
    <div className="space-y-5">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="bg-card shadow-sm">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Total Usuários</p>
                <p className="text-sm font-bold text-foreground">{totalUsers.toLocaleString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="bg-card shadow-sm">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Total Ganhos</p>
                <p className="text-sm font-bold text-foreground">{formatCurrency(totalEarnings)}</p>
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
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Ganho Máx.</p>
                <p className="text-sm font-bold text-foreground">{config.maxEarnings}</p>
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

      {/* Horizontal stacked bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="bg-card shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Proporção de Ganhos por Nível</p>
            <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
              {config.levels.map((lvl, i) => {
                const widthPct = totalEarnings > 0 ? (lvl.earnings / totalEarnings) * 100 : 0
                return (
                  <motion.div
                    key={lvl.level}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(widthPct, 0.5)}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
                    className={cn('rounded-sm', levelColors[i % levelColors.length])}
                    title={`Nível ${lvl.level}: ${formatCurrency(lvl.earnings)}`}
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
                  <TableHead className="text-right">Usuários</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">%</TableHead>
                  <TableHead className="text-right">Ganhos (R$)</TableHead>
                  <TableHead className="w-32 hidden md:table-cell">Progresso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.levels.map((lvl, i) => {
                  const fillPct = Math.round((lvl.filled / lvl.positions) * 100)
                  const earningsPct = maxEarnings > 0 ? Math.round((lvl.earnings / maxEarnings) * 100) : 0
                  return (
                    <TableRow key={lvl.level}>
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-white text-xs font-bold', levelColors[i % levelColors.length])}>
                          N{lvl.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        <span className="text-foreground">{lvl.filled}</span>
                        <span className="text-muted-foreground">/{lvl.positions}</span>
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell text-muted-foreground">
                        {lvl.percentage}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(lvl.earnings)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Progress value={fillPct} className="h-2 flex-1" />
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

      {/* Card Grid */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {config.levels.map((lvl, i) => {
            const fillPct = Math.round((lvl.filled / lvl.positions) * 100)
            return (
              <motion.div
                key={lvl.level}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.04 }}
              >
                <Card className="shadow-sm bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className={cn('text-white text-xs', levelColors[i % levelColors.length])}>
                        Nível {lvl.level}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{lvl.percentage}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Usuários</p>
                        <p className="text-sm font-bold text-foreground">
                          {lvl.filled}<span className="text-muted-foreground font-normal">/{lvl.positions}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Ganhos</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(lvl.earnings)}
                        </p>
                      </div>
                      <Progress value={fillPct} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
