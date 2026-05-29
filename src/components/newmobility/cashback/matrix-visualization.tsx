'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'

interface MatrixNodeProps {
  level: number
  position: number
  totalPositions: number
  percentage: string
  filled: boolean
  isCurrentUser?: boolean
  delay?: number
}

export function MatrixNode({
  level,
  position,
  totalPositions,
  percentage,
  filled,
  isCurrentUser,
  delay = 0,
}: MatrixNodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        'matrix-node flex flex-col items-center justify-center rounded-lg border-2 p-1.5 md:p-2 text-center min-h-[52px] md:min-h-[64px]',
        isCurrentUser
          ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
          : filled
          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
          : 'border-dashed border-gray-300 bg-gray-50 text-gray-400'
      )}
    >
      <div className={cn(
        'w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center mb-0.5',
        isCurrentUser
          ? 'bg-white/30'
          : filled
          ? 'bg-emerald-200'
          : 'bg-gray-200'
      )}>
        <User className="h-3 w-3 md:h-3.5 md:w-3.5" />
      </div>
      <span className={cn(
        'text-[10px] md:text-xs font-bold',
        isCurrentUser ? 'text-white' : 'text-emerald-700'
      )}>
        {percentage}
      </span>
    </motion.div>
  )
}

interface MatrixLevelProps {
  level: number
  positions: number
  percentage: string
  totalUsers: number
  filledCount: number
  currentUserPosition?: number
}

export function MatrixLevel({
  level,
  positions,
  percentage,
  totalUsers,
  filledCount,
  currentUserPosition,
}: MatrixLevelProps) {
  const nodes = Array.from({ length: positions }, (_, i) => ({
    level,
    position: i,
    filled: i < filledCount,
    isCurrentUser: currentUserPosition === i,
  }))

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold text-gray-700 bg-emerald-100 px-2 py-0.5 rounded">
          Nível {level}
        </span>
        <span className="text-xs text-gray-500">
          {percentage} • {filledCount}/{positions} posições
        </span>
        <span className="text-xs text-gray-400">
          ({totalUsers.toLocaleString('pt-BR')} usuários no total)
        </span>
      </div>
      <div className={cn(
        'grid gap-1.5 md:gap-2',
        positions <= 4 ? 'grid-cols-2 sm:grid-cols-4' :
        positions <= 8 ? 'grid-cols-4 sm:grid-cols-8' :
        positions <= 16 ? 'grid-cols-4 sm:grid-cols-8 md:grid-cols-16' :
        'grid-cols-4 sm:grid-cols-8 md:grid-cols-16'
      )}>
        {nodes.map((node, i) => (
          <MatrixNode
            key={`${node.level}-${node.position}`}
            level={node.level}
            position={node.position}
            totalPositions={positions}
            percentage={percentage}
            filled={node.filled}
            isCurrentUser={node.isCurrentUser}
            delay={i * 0.03 + level * 0.1}
          />
        ))}
      </div>
    </div>
  )
}

interface MatrixVisualizationProps {
  type: 'entrada' | 'residual' | 'vendas'
}

const matrixConfig = {
  entrada: {
    levels: [
      { level: 1, positions: 4, percentage: '5%', totalUsers: 4, filled: 4 },
      { level: 2, positions: 16, percentage: '10%', totalUsers: 16, filled: 12 },
      { level: 3, positions: 64, percentage: '10%', totalUsers: 64, filled: 32 },
      { level: 4, positions: 256, percentage: '5%', totalUsers: 256, filled: 80 },
      { level: 5, positions: 1024, percentage: '5%', totalUsers: 1024, filled: 200 },
    ],
    title: 'Matriz CashBack Entrada',
    description: 'Estrutura 4x5 com 5 níveis de profundidade',
    maxEarnings: 'R$ 32.580,00',
  },
  residual: {
    levels: [
      { level: 1, positions: 4, percentage: '5%', totalUsers: 4, filled: 4 },
      { level: 2, positions: 16, percentage: '5.5%', totalUsers: 16, filled: 12 },
      { level: 3, positions: 64, percentage: '6%', totalUsers: 64, filled: 30 },
      { level: 4, positions: 256, percentage: '6.5%', totalUsers: 256, filled: 60 },
      { level: 5, positions: 1024, percentage: '7%', totalUsers: 1024, filled: 100 },
      { level: 6, positions: 4096, percentage: '7.5%', totalUsers: 4096, filled: 200 },
      { level: 7, positions: 16384, percentage: '8%', totalUsers: 16384, filled: 400 },
    ],
    title: 'Matriz CashBack Residual',
    description: 'Estrutura 4x7 com 7 níveis de profundidade',
    maxEarnings: 'R$ 18.240,00',
  },
  vendas: {
    levels: [
      { level: 1, positions: 4, percentage: '0.10%', totalUsers: 4, filled: 4 },
      { level: 2, positions: 16, percentage: '0.10%', totalUsers: 16, filled: 14 },
      { level: 3, positions: 64, percentage: '0.10%', totalUsers: 64, filled: 40 },
      { level: 4, positions: 256, percentage: '0.10%', totalUsers: 256, filled: 100 },
      { level: 5, positions: 1024, percentage: '0.10%', totalUsers: 1024, filled: 250 },
      { level: 6, positions: 4096, percentage: '0.10%', totalUsers: 4096, filled: 600 },
      { level: 7, positions: 16384, percentage: '0.10%', totalUsers: 16384, filled: 1200 },
      { level: 8, positions: 65536, percentage: '0.10%', totalUsers: 65536, filled: 3000 },
      { level: 9, positions: 262144, percentage: '0.20%', totalUsers: 262144, filled: 8000 },
    ],
    title: 'Matriz CashBack Vendas',
    description: 'Estrutura 4x9 com 9 níveis de profundidade',
    maxEarnings: 'R$ 106.025,00',
  },
}

export function MatrixVisualization({ type }: MatrixVisualizationProps) {
  const config = matrixConfig[type]

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h4 className="font-bold text-emerald-900">{config.title}</h4>
              <p className="text-sm text-emerald-700">{config.description}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-emerald-600">Ganhos máximos potenciais</span>
              <p className="text-xl font-bold text-emerald-700">{config.maxEarnings}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current user position indicator */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-emerald-500 bg-emerald-500" />
          <span className="text-xs text-gray-600">Você</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-emerald-300 bg-emerald-50" />
          <span className="text-xs text-gray-600">Preenchido</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-dashed border-gray-300 bg-gray-50" />
          <span className="text-xs text-gray-600">Vazio</span>
        </div>
      </div>

      {/* Matrix levels */}
      <div className="space-y-2">
        {config.levels.map((lvl) => (
          <MatrixLevel
            key={lvl.level}
            level={lvl.level}
            positions={lvl.positions}
            percentage={lvl.percentage}
            totalUsers={lvl.totalUsers}
            filledCount={lvl.filled}
            currentUserPosition={lvl.level === 1 ? 0 : undefined}
          />
        ))}
      </div>
    </div>
  )
}
