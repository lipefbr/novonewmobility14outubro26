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
  ShoppingCart,
  CreditCard,
  Car,
  Shield,
  Trophy,
  Package,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, timeSince } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'cashback' | 'referral' | 'career' | 'withdrawal' | 'upgrade' | 'gratification' | 'voucher' | 'points' | 'purchase' | 'plan' | 'ride' | 'insurance'
  description: string
  detail?: string
  amount?: number
  time: string
  icon: React.ElementType
  color: string
  badge?: string
  badgeColor?: string
}

const mockActivities: ActivityItem[] = [
  { id: 'a1', type: 'cashback', description: 'CashBack Entrada recebido', detail: 'Nível 2 — Maria Santos', amount: 4500, time: new Date(Date.now() - 2 * 60 * 1000).toISOString(), icon: DollarSign, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', badge: 'Entrada', badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { id: 'a2', type: 'referral', description: 'Novo indicado cadastrado', detail: 'João Pedro ativou plano Blue 5', time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), icon: Users, color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400', badge: 'Direto', badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
  { id: 'a3', type: 'career', description: 'Progresso na carreira', detail: '+5 pontos de carreira — Rank Bronze próximo', time: new Date(Date.now() - 45 * 60 * 1000).toISOString(), icon: TrendingUp, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', badge: '+5 pts', badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { id: 'a4', type: 'withdrawal', description: 'Saque processado com sucesso', detail: 'Transferido para Banco do Brasil', amount: -50000, time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), icon: ArrowDownToLine, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', badge: 'Pago', badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { id: 'a5', type: 'upgrade', description: 'Indicado ativou plano premium', detail: 'Pedro Costa — Blue 5 Premium', time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), icon: Zap, color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', badge: 'Upgrade', badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  { id: 'a6', type: 'gratification', description: 'Gratificação Liderança creditada', detail: 'Bonus semanal por performance', amount: 25000, time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), icon: Gift, color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400', badge: 'Semanal', badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
  { id: 'a7', type: 'cashback', description: 'CashBack Residual recebido', detail: 'Nível 5 — Rede de Ana Lima', amount: 1250, time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), icon: DollarSign, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', badge: 'Residual', badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { id: 'a8', type: 'voucher', description: 'Voucher de Mobilidade comprado', detail: 'R$ 50,00 — Crédito para corridas', time: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), icon: ShoppingCart, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', badge: 'Voucher', badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { id: 'a9', type: 'points', description: 'Pontos por indicação direta', detail: '50 pontos creditados automaticamente', time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), icon: Star, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', badge: '+50 pts', badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { id: 'a10', type: 'ride', description: 'Corrida finalizada', detail: 'CashBack de R$ 3,50 creditado', amount: 350, time: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(), icon: Car, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', badge: 'Mobilidade', badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { id: 'a11', type: 'insurance', description: 'Seguro Funeral ativado', detail: 'Cobertura de R$ 5.000,00 disponível', time: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), icon: Shield, color: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400', badge: 'Seguro', badgeColor: 'bg-gray-50 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300' },
  { id: 'a12', type: 'plan', description: 'Renovação do plano confirmada', detail: 'Blue 5 Premium — Próximo ciclo', time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), icon: CreditCard, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', badge: 'Renovação', badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
]

export function ActivityFeed() {
  const { t } = useTranslation()
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivities)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  const refreshActivities = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => {
      setActivities(prev => {
        const types = ['cashback', 'referral', 'points', 'ride'] as const
        const randomType = types[Math.floor(Math.random() * types.length)]
        const newActivity: ActivityItem = {
          id: `a${Date.now()}`,
          type: randomType,
          description: randomType === 'cashback' ? 'CashBack Vendas recebido' : randomType === 'referral' ? 'Nova indicação na rede' : randomType === 'ride' ? 'Corrida finalizada' : 'Pontos creditados',
          detail: randomType === 'cashback' ? 'Shopping — Nível 3' : randomType === 'referral' ? 'Indicado direto' : randomType === 'ride' ? 'CashBack creditado' : 'Por atividade',
          amount: randomType === 'cashback' ? Math.floor(Math.random() * 5000) + 500 : randomType === 'ride' ? Math.floor(Math.random() * 500) + 100 : undefined,
          time: new Date().toISOString(),
          icon: randomType === 'cashback' ? DollarSign : randomType === 'referral' ? Users : randomType === 'ride' ? Car : Star,
          color: randomType === 'cashback' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : randomType === 'referral' ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' : randomType === 'ride' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
          badge: randomType === 'cashback' ? 'Vendas' : randomType === 'referral' ? 'Direto' : randomType === 'ride' ? 'Mobilidade' : '+' + Math.floor(Math.random() * 30 + 10) + ' pts',
          badgeColor: randomType === 'cashback' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : randomType === 'referral' ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' : randomType === 'ride' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        }
        return [newActivity, ...prev.slice(0, 11)]
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
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-card h-full border border-emerald-100/50 dark:border-emerald-900/30">
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
              className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-3.5 w-3.5 text-emerald-600', refreshing && 'animate-spin')} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0.5 max-h-96 overflow-y-auto custom-scrollbar">
          <AnimatePresence initial={false}>
            {activities.map((activity, i) => {
              const Icon = activity.icon
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.25, ease: 'easeOut' }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors group cursor-pointer"
                >
                  <div className={cn('p-2 rounded-lg shrink-0 shadow-sm', activity.color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{activity.description}</p>
                      {activity.badge && (
                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 uppercase tracking-wide', activity.badgeColor)}>
                          {activity.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {activity.detail && (
                        <p className="text-[11px] text-muted-foreground truncate">{activity.detail}</p>
                      )}
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">•</span>
                      <p className="text-[10px] text-muted-foreground shrink-0">{timeSince(activity.time)}</p>
                    </div>
                  </div>
                  {activity.amount !== undefined && activity.amount > 0 && (
                    <motion.span
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        'text-sm font-bold shrink-0',
                        'text-emerald-600 dark:text-emerald-400'
                      )}
                    >
                      +{Math.abs(activity.amount)} pts
                    </motion.span>
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
