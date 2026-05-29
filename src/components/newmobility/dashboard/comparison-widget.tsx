'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, DollarSign, Users, Star, ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface ComparisonData {
  labelKey: string
  currentValue: number
  previousValue: number
  format: 'currency' | 'number' | 'percent'
  icon: React.ElementType
  sparklineData: number[]
}

const comparisonData: ComparisonData[] = [
  {
    labelKey: 'comparison.cashbackEarnings',
    currentValue: 3258000,
    previousValue: 2890000,
    format: 'currency',
    icon: DollarSign,
    sparklineData: [18, 22, 19, 25, 28, 24, 30, 32],
  },
  {
    labelKey: 'comparison.newReferrals',
    currentValue: 6,
    previousValue: 4,
    format: 'number',
    icon: Users,
    sparklineData: [3, 2, 4, 3, 5, 4, 6, 6],
  },
  {
    labelKey: 'comparison.pointsEarned',
    currentValue: 42,
    previousValue: 35,
    format: 'number',
    icon: Star,
    sparklineData: [28, 30, 32, 33, 35, 38, 40, 42],
  },
  {
    labelKey: 'comparison.withdrawals',
    currentValue: 350000,
    previousValue: 500000,
    format: 'currency',
    icon: ArrowUpRight,
    sparklineData: [50, 45, 42, 48, 40, 38, 35, 35],
  },
]

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 80
  const height = 28

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((value - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `0,${height} ${points} ${width},${height}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <defs>
        <linearGradient id={`spark-grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-grad-${color})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ComparisonWidget() {
  const { t } = useTranslation()

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency': return formatCurrency(value)
      case 'percent': return `${value}%`
      default: return value.toString()
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {comparisonData.map((item, i) => {
        const change = item.previousValue > 0
          ? ((item.currentValue - item.previousValue) / item.previousValue) * 100
          : 0
        const isPositive = change > 0
        const isNeutral = change === 0
        const sparkColor = isPositive ? '#059669' : isNeutral ? '#6b7280' : '#dc2626'

        const Icon = item.icon

        return (
          <motion.div
            key={item.labelKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="shadow-sm bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${
                      isPositive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' :
                      isNeutral ? 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                      'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{t(item.labelKey)}</span>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-lg font-bold text-foreground">{formatValue(item.currentValue, item.format)}</p>
                    <div className={`flex items-center gap-1 text-xs font-semibold ${
                      isPositive ? 'text-emerald-600 dark:text-emerald-400' :
                      isNeutral ? 'text-gray-500' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {isPositive ? <TrendingUp className="h-3 w-3" /> :
                       isNeutral ? <Minus className="h-3 w-3" /> :
                       <TrendingDown className="h-3 w-3" />}
                      {isPositive ? '+' : ''}{change.toFixed(1)}%
                      <span className="text-muted-foreground font-normal">{t('comparison.vsLastMonth')}</span>
                    </div>
                  </div>
                  <MiniSparkline data={item.sparklineData} color={sparkColor} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
