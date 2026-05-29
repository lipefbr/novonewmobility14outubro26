'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import {
  DollarSign,
  Users,
  TrendingUp,
  ArrowDownToLine,
  Zap,
  Gift,
  Star,
  Award,
  RefreshCw,
  Activity,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatCurrency, timeSince } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'cashback' | 'referral' | 'career' | 'withdrawal' | 'upgrade' | 'gratification' | 'voucher' | 'points'
  description: string
  amount?: number
  time: string
  icon: React.ElementType
  color: string
}

const mockActivities: ActivityItem[] = [
  { id: 'a1', type: 'cashback', description: 'CashBack Entrada recebido - Nível 2', amount: 4500, time: new Date(Date.now() - 2 * 60 * 1000).toISOString(), icon: DollarSign, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { id: 'a2', type: 'referral', description: 'Novo indicado: Maria Santos', time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), icon: Users, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  { id: 'a3', type: 'career', description: 'Progresso: +5 pontos de carreira', time: new Date(Date.now() - 45 * 60 * 1000).toISOString(), icon: TrendingUp, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  { id: 'a4', type: 'withdrawal', description: 'Saque de R$ 500,00 processado', amount: -50000, time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), icon: ArrowDownToLine, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  { id: 'a5', type: 'upgrade', description: 'Indicado Pedro ativou plano Blue 5', time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), icon: Zap, color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
  { id: 'a6', type: 'gratification', description: 'Gratificação Liderança creditada', amount: 25000, time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), icon: Gift, color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
  { id: 'a7', type: 'cashback', description: 'CashBack Residual - Nível 5', amount: 1250, time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), icon: DollarSign, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { id: 'a8', type: 'points', description: '50 pontos por indicação direta', time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), icon: Star, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { id: 'a9', type: 'voucher', description: 'Voucher de R$ 100 disponível', time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), icon: Award, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
  { id: 'a10', type: 'referral', description: 'João Santos se cadastrou com seu link', time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), icon: Users, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
]

export function ActivityFeed() {
  const { t } = useTranslation()
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivities)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  const refreshActivities = useCallback(() => {
    setRefreshing(true)
    // Simulate refresh with slight variation
    setTimeout(() => {
      setActivities(prev => {
        // Add a new random activity at the top
        const types = ['cashback', 'referral', 'points'] as const
        const randomType = types[Math.floor(Math.random() * types.length)]
        const newActivity: ActivityItem = {
          id: `a${Date.now()}`,
          type: randomType,
          description: randomType === 'cashback' ? 'CashBack Vendas recebido' : randomType === 'referral' ? 'Nova indicação na rede' : 'Pontos creditados',
          amount: randomType === 'cashback' ? Math.floor(Math.random() * 5000) + 500 : undefined,
          time: new Date().toISOString(),
          icon: randomType === 'cashback' ? DollarSign : randomType === 'referral' ? Users : Star,
          color: randomType === 'cashback' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        }
        return [newActivity, ...prev.slice(0, 9)]
      })
      setLastRefresh(Date.now())
      setRefreshing(false)
    }, 800)
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshActivities()
    }, 30000)
    return () => clearInterval(interval)
  }, [refreshActivities])

  return (
    <Card className="shadow-sm bg-card h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            {t('dashboard.activity.title')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              Atualizado {timeSince(new Date(lastRefresh).toISOString())}
            </span>
            <button
              onClick={refreshActivities}
              className="p-1.5 rounded-lg hover:bg-muted/80 transition-colors"
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-3.5 w-3.5 text-muted-foreground', refreshing && 'animate-spin')} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
          <AnimatePresence initial={false}>
            {activities.map((activity, i) => {
              const Icon = activity.icon
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={cn('p-2 rounded-lg shrink-0', activity.color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{timeSince(activity.time)}</p>
                  </div>
                  {activity.amount !== undefined && (
                    <span className={cn(
                      'text-sm font-semibold shrink-0',
                      activity.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                    )}>
                      {activity.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(activity.amount))}
                    </span>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
