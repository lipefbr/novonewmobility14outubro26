'use client'

import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { dashboardApi, ApiError } from '@/lib/api'
import { formatCurrency, timeSince, formatDate, getPlanName } from '@/lib/utils'
import { StatsCards } from './stats-cards'
import { FinancialCards } from './financial-cards'
import { DashboardCharts } from './charts'
import { ActivityFeed } from './activity-feed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
  Copy,
  Link2,
  Smartphone,
  Apple,
  Check,
  Share2,
  UserPlus,
  FileText,
  ArrowDownToLine,
  Ticket,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Activity,
  Zap,
  Eye,
  Star,
  Gift,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { DashboardSkeleton } from '../ui/loading-skeletons'

interface DashboardData {
  user: any
  directReferrals: number
  directReferralCount: number
  cashbackEntrada: { totalUsers: number; totalEarned: number }
  cashbackResidual: { totalUsers: number; totalEarned: number }
  cashbackVendas: { totalUsers: number; totalEarned: number }
  balances: any
  recentTransactions: any[]
  career: any
  userDistribution: any
  revenueByCategory: any
}

export function DashboardPage() {
  const { user, logout, setActivePage } = useStore()
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const quickActions = [
    { label: t('dashboard.quick.indicate'), icon: UserPlus, color: 'from-emerald-500 to-emerald-600', page: 'referrals' as const },
    { label: t('dashboard.quick.statement'), icon: FileText, color: 'from-teal-500 to-teal-600', page: 'financial' as const },
    { label: t('dashboard.quick.withdraw'), icon: ArrowDownToLine, color: 'from-amber-500 to-amber-600', page: 'financial' as const },
    { label: t('dashboard.quick.voucher'), icon: Ticket, color: 'from-purple-500 to-purple-600', page: 'voucher' as const },
  ]

  useEffect(() => {
    if (user?.id) {
      loadDashboard()
    }
  }, [user?.id])

  const loadDashboard = async () => {
    try {
      const data = await dashboardApi.getData(user!.id)
      setDashboardData(data)
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 404) {
        logout()
        return
      }
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${user?.referralCode || 'USER'}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NewMobility - CashBack',
          text: `Use meu link de indicação e ganhe CashBack!`,
          url: referralLink,
        })
      } catch {
        handleCopyLink()
      }
    } else {
      handleCopyLink()
    }
  }

  const networkStats = {
    totalSize: dashboardData?.cashbackEntrada?.totalUsers 
      ? (dashboardData.cashbackEntrada.totalUsers + dashboardData.cashbackResidual?.totalUsers + dashboardData.cashbackVendas?.totalUsers) 
      : 1364,
    activeMembers: dashboardData?.directReferralCount ?? dashboardData?.directReferrals ?? 4,
    newReferrals: Math.max(1, Math.floor((dashboardData?.directReferralCount ?? dashboardData?.directReferrals ?? 4) * 0.3)),
  }

  // Quick stats for mini-bar
  const quickStats = [
    { label: 'Ganhos Hoje', value: 'R$ 127,50', icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Novos Indicados', value: '2', icon: UserPlus, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'CashBack Pendente', value: 'R$ 890,00', icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Pontos Hoje', value: '+5', icon: Star, color: 'text-purple-600 dark:text-purple-400' },
  ]

  // Activity timeline with more detail
  const activityItems = [
    { id: '1', description: 'CashBack Entrada recebido', detail: 'R$ 45,00 — Nível 2', time: '2h atrás', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { id: '2', description: 'Novo indicado: Maria Santos', detail: 'Plano Blue 5', time: '5h atrás', icon: Users, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { id: '3', description: 'Gratificação Liderança creditada', detail: 'R$ 85,00', time: '1 dia', icon: TrendingUp, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { id: '4', description: 'Saque de R$ 500,00 processado', detail: 'Conta Bancária', time: '2 dias', icon: ArrowDownToLine, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    { id: '5', description: 'Upgrade de plano confirmado', detail: 'Blue 5 Premium', time: '3 dias', icon: Zap, color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
    { id: '6', description: 'Voucher R$25 comprado', detail: 'Mobilidade', time: '4 dias', icon: Gift, color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
  ]

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section - Animated Gradient Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 animate-gradient-shift relative">
            {/* Animated pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            {/* Shimmer overlay */}
            <div className="absolute inset-0 animate-shimmer" />
            <CardContent className="p-5 md:p-6 relative">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-white">
                  <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                      transition={{ delay: 0.5, duration: 0.8, ease: 'easeInOut' }}
                      className="inline-block"
                    >
                      👋
                    </motion.span>
                    {t('dashboard.welcome')}, {user?.name?.split(' ')[0] || 'Usuário'}
                  </h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-emerald-100 text-sm">
                    <span>{t('dashboard.since')}: {user?.createdAt ? formatDate(user.createdAt) : '-'}</span>
                    <span className="hidden sm:inline">|</span>
                    <span className="font-medium text-white">{user?.createdAt ? timeSince(user.createdAt) : '-'}</span>
                    <Badge variant="secondary" className="w-fit bg-white/20 text-white border-0">
                      {getPlanName(user?.plan || 'free')}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2">
                    <Link2 className="h-4 w-4 text-emerald-200 shrink-0" />
                    <span className="text-sm text-white truncate max-w-[200px] md:max-w-[260px]">
                      🔗 {t('dashboard.referral.link')}:
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                    <span className="text-sm font-mono text-white font-medium truncate flex-1">
                      {referralLink}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyLink}
                      className="h-7 px-2 text-emerald-200 hover:text-white hover:bg-white/15"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShareLink}
                      className="h-7 px-2 text-emerald-200 hover:text-white hover:bg-white/15"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* Quick Stats Mini-Bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {quickStats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 + i * 0.03, duration: 0.2 }}
                className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 shadow-sm"
              >
                <Icon className={`h-4 w-4 shrink-0 ${stat.color}`} />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                  <p className="text-sm font-bold text-foreground animate-pulse-soft">{stat.value}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon
            return (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.2 }}
                onClick={() => setActivePage(action.page)}
                className="group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-90`} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <div className="relative">
                  <div className="p-2 rounded-lg bg-white/20 w-fit mb-2">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-white">{action.label}</span>
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <StatsCards data={dashboardData} />

      {/* Network Overview + Plan Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Network Overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-sm h-full bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                {t('dashboard.network.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                  <Users className="h-7 w-7 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{networkStats.totalSize.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground font-medium">{t('dashboard.network.total')}</p>
                </div>
                <div className="text-center p-4 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-100 dark:border-teal-900/50">
                  <TrendingUp className="h-7 w-7 text-teal-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{networkStats.activeMembers}</p>
                  <p className="text-xs text-muted-foreground font-medium">{t('dashboard.network.active')}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
                  <UserPlus className="h-7 w-7 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{networkStats.newReferrals}</p>
                  <p className="text-xs text-muted-foreground font-medium">{t('dashboard.network.new')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Plan Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Card className="shadow-sm h-full bg-gradient-to-br from-gray-900 to-gray-800 border-0">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{t('dashboard.plan.current')}</p>
                <p className="text-lg font-bold text-white mt-1">{getPlanName(user?.plan || 'free')}</p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{t('dashboard.plan.progress')}</span>
                    <span className="text-emerald-400 font-bold">{dashboardData?.career?.progress?.toFixed(0) ?? 75}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dashboardData?.career?.progress?.toFixed(0) ?? 75}%` }}
                      transition={{ delay: 0.5, duration: 1 }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full relative"
                    >
                      <div className="absolute inset-0 animate-shimmer" />
                    </motion.div>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-emerald-400 font-medium">
                  {dashboardData?.career?.nextRank 
                    ? `${t('dashboard.plan.next')}: ${dashboardData.career.nextRank.name}` 
                    : t('dashboard.plan.maxRank')}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {dashboardData?.career?.nextRank 
                    ? t('dashboard.plan.pointsLeft', { points: dashboardData.career.nextRank.pointsNeeded })
                    : t('dashboard.plan.keepGoing')}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Financial Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-foreground">{t('dashboard.financial')}</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-emerald-600 gap-1"
            onClick={() => setActivePage('financial')}
          >
            <Eye className="h-3.5 w-3.5" />
            Ver tudo
          </Button>
        </div>
        <FinancialCards data={dashboardData} />
      </div>

      {/* Activity Feed + App Download */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <ActivityFeed />

        {/* App Download Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Card className="shadow-sm h-full bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-emerald-600" />
                {t('dashboard.download.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1.5 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 group"
                >
                  <Smartphone className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">Android</span>
                  <span className="text-[10px] text-muted-foreground">{t('dashboard.download.driver')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1.5 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 group"
                >
                  <Apple className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">iOS</span>
                  <span className="text-[10px] text-muted-foreground">{t('dashboard.download.driver')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1.5 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 group"
                >
                  <Smartphone className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">Android</span>
                  <span className="text-[10px] text-muted-foreground">{t('dashboard.download.passenger')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1.5 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 group"
                >
                  <Apple className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">iOS</span>
                  <span className="text-[10px] text-muted-foreground">{t('dashboard.download.passenger')}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <DashboardCharts data={dashboardData} />
    </div>
  )
}
