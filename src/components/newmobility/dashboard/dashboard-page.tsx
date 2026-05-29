'use client'

import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { dashboardApi, ApiError } from '@/lib/api'
import { formatCurrency, timeSince, formatDate, getPlanName } from '@/lib/utils'
import { StatsCards } from './stats-cards'
import { FinancialCards } from './financial-cards'
import { DashboardCharts } from './charts'
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
} from 'lucide-react'
import { useState, useEffect } from 'react'

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
      // Bug Fix: If user not found (404), auto-logout to clear invalid session
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
        // User cancelled or share failed, fallback to copy
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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 relative">
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            <CardContent className="p-5 md:p-6 relative">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-white">
                  <h2 className="text-xl md:text-2xl font-bold">
                    👋 {t('dashboard.welcome')}, {user?.name?.split(' ')[0] || 'Usuário'}
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
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                  <Users className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{networkStats.totalSize.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground font-medium">{t('dashboard.network.total')}</p>
                </div>
                <div className="text-center p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-teal-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{networkStats.activeMembers}</p>
                  <p className="text-xs text-muted-foreground font-medium">{t('dashboard.network.active')}</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                  <UserPlus className="h-6 w-6 text-blue-600 mx-auto mb-1" />
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
                    <span>{dashboardData?.career?.progress?.toFixed(0) ?? 75}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dashboardData?.career?.progress?.toFixed(0) ?? 75}%` }}
                      transition={{ delay: 0.5, duration: 1 }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                    />
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
        <h3 className="text-lg font-bold text-foreground mb-3">{t('dashboard.financial')}</h3>
        <FinancialCards data={dashboardData} />
      </div>

      {/* Recent Activity + App Download */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          <Card className="shadow-sm h-full bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                {t('dashboard.activity.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: '1', description: 'CashBack Entrada recebido', time: '2h', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
                  { id: '2', description: 'Novo indicado: Maria Santos', time: '5h', icon: Users, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
                  { id: '3', description: 'Gratificação Liderança creditada', time: '1d', icon: TrendingUp, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
                  { id: '4', description: `Saque de R$ 500,00 processado`, time: '2d', icon: ArrowDownToLine, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
                  { id: '5', description: 'Upgrade de plano confirmado', time: '3d', icon: Zap, color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
                ].map((activity, i) => {
                  const Icon = activity.icon
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.2 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${activity.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
                  className="h-auto py-3 flex flex-col gap-1.5 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300"
                >
                  <Smartphone className="h-5 w-5 text-emerald-600" />
                  <span className="text-xs font-semibold">Android</span>
                  <span className="text-[10px] text-muted-foreground">{t('dashboard.download.driver')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1.5 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300"
                >
                  <Apple className="h-5 w-5 text-emerald-600" />
                  <span className="text-xs font-semibold">iOS</span>
                  <span className="text-[10px] text-muted-foreground">{t('dashboard.download.driver')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1.5 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300"
                >
                  <Smartphone className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-semibold">Android</span>
                  <span className="text-[10px] text-muted-foreground">{t('dashboard.download.passenger')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1.5 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300"
                >
                  <Apple className="h-5 w-5 text-blue-600" />
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
