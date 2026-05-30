'use client'

import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { dashboardApi, ApiError } from '@/lib/api'
import { formatCurrency, timeSince, formatDate, getPlanName, cn } from '@/lib/utils'
import { StatsCards } from './stats-cards'
import { FinancialCards } from './financial-cards'
import { DashboardCharts } from './charts'
import { ActivityFeed } from './activity-feed'
import { AnnouncementBanner } from './announcement-banner'
import { ComparisonWidget } from './comparison-widget'
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
  Sun,
  Moon,
  CloudSun,
  Target,
  Trophy,
  ArrowRight,
  Play,
  Shield,
  Globe,
  Lock,
  CalendarIcon,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { DashboardSkeleton } from '../ui/loading-skeletons'
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip as RechartsTooltip } from 'recharts'

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

// Greeting based on time of day
function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return { text: 'Bom dia', icon: Sun, iconClass: 'text-yellow-400' }
  if (hour >= 12 && hour < 18) return { text: 'Boa tarde', icon: CloudSun, iconClass: 'text-orange-400' }
  return { text: 'Boa noite', icon: Moon, iconClass: 'text-blue-300' }
}

// Network Health mini chart data
const networkHealthData = [
  { month: 'Jul', growth: 12 },
  { month: 'Ago', growth: 18 },
  { month: 'Set', growth: 15 },
  { month: 'Out', growth: 22 },
  { month: 'Nov', growth: 28 },
  { month: 'Dez', growth: 35 },
  { month: 'Jan', growth: 42 },
]

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

  // Quick stats for mini-bar with count-up values
  const quickStats = [
    { label: 'Ganhos Hoje', value: 'R$ 127,50', rawValue: 12750, icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Novos Indicados', value: '2', rawValue: 2, icon: UserPlus, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'CashBack Pendente', value: 'R$ 890,00', rawValue: 89000, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Pontos Hoje', value: '+5', rawValue: 5, icon: Star, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30' },
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

  // Greeting
  const greeting = getGreeting()
  const GreetingIcon = greeting.icon

  // Career milestones for "Next Milestone" card
  const careerProgress = dashboardData?.career?.progress ?? 75
  const nextRankName = dashboardData?.career?.nextRank?.name ?? 'Safira'
  const pointsNeeded = dashboardData?.career?.nextRank?.pointsNeeded ?? 8

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Visual separator */}
      <div className="border-b border-emerald-200/50 dark:border-emerald-800/30" />

      {/* Greeting Card based on time of day */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 animate-gradient-shift relative">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
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
                      <GreetingIcon className={`h-7 w-7 ${greeting.iconClass}`} />
                    </motion.span>
                    {greeting.text}, {user?.name?.split(' ')[0] || 'Usuário'}
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
                <div className="flex flex-col gap-2 gradient-border rounded-xl p-3">
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
                className={`flex items-center gap-2 ${stat.bg} border border-border rounded-lg px-3 py-2 shadow-sm card-hover`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${stat.color}`} />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                  <p className="text-sm font-bold text-foreground">{stat.value}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Visual separator */}
      <div className="border-b border-emerald-200/50 dark:border-emerald-800/30" />

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600" />
            Ações Rápidas
            <span className="flex-1 h-px bg-gradient-to-r from-emerald-400/60 to-transparent ml-2" />
          </h3>
        </div>
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
                className="group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] hover:shadow-lg"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-90 group-hover:opacity-100 transition-opacity duration-200`} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 animate-shimmer" />
                </div>
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

      {/* Visual separator */}
      <div className="border-b border-emerald-200/50 dark:border-emerald-800/30" />

      {/* Stats Cards */}
      <StatsCards data={dashboardData} />

      {/* Section Separator with visual detail */}
      <div className="section-separator" />

      {/* Data Comparison Widget */}
      <ComparisonWidget />

      {/* Network Overview + Network Health + Next Milestone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Network Overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Card className="shadow-sm h-full bg-card card-hover-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                {t('dashboard.network.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                  <Users className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{networkStats.totalSize.toLocaleString('pt-BR')}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{t('dashboard.network.total')}</p>
                </div>
                <div className="text-center p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-100 dark:border-teal-900/50">
                  <TrendingUp className="h-6 w-6 text-teal-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{networkStats.activeMembers}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{t('dashboard.network.active')}</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
                  <UserPlus className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{networkStats.newReferrals}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{t('dashboard.network.new')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Network Health Mini Widget - Line chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          <Card className="shadow-sm h-full bg-card card-hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Saúde da Rede
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-sm font-bold">+23%</span>
                </div>
                <span className="text-xs text-muted-foreground">crescimento nos últimos 6 meses</span>
              </div>
              <div className="h-[80px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={networkHealthData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="networkGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      formatter={(value: number) => [`${value} membros`, 'Crescimento']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}
                    />
                    <Line type="monotone" dataKey="growth" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: '#059669' }} animationDuration={1200} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Next Milestone Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Card className="shadow-sm h-full bg-gradient-to-br from-gray-900 to-gray-800 border-0 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-4 flex flex-col justify-between h-full relative">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Trophy className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Próximo Marco</p>
                    <p className="text-base font-bold text-white">{nextRankName}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>Progresso</span>
                    <span className="text-emerald-400 font-bold">{careerProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${careerProgress.toFixed(0)}%` }}
                      transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full relative"
                    >
                      <div className="absolute inset-0 animate-shimmer" />
                    </motion.div>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-emerald-400" />
                  <p className="text-xs text-emerald-400 font-medium">
                    Faltam {pointsNeeded} pontos
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1"
                  onClick={() => setActivePage('career')}
                >
                  Ver trilha
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Visual separator */}
      <div className="border-b border-emerald-200/50 dark:border-emerald-800/30" />

      {/* Financial Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            {t('dashboard.financial')}
            <span className="flex-1 h-px bg-gradient-to-r from-emerald-400/60 to-transparent ml-2" />
          </h3>
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

      {/* Section Separator with visual detail */}
      <div className="section-separator" />

      {/* Visual separator */}
      <div className="border-b border-emerald-200/50 dark:border-emerald-800/30" />

      {/* Activity Feed + App Download */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <ActivityFeed />

        {/* App Download Section with platform-specific hover colors */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Card className="shadow-sm h-full bg-card card-hover-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-emerald-600" />
                {t('dashboard.download.title')}
                <span className="flex-1 h-px bg-gradient-to-r from-emerald-400/60 to-transparent ml-2" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1.5 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-400 dark:hover:border-green-600 group transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                >
                  <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">Android</span>
                  <span className="text-[10px] text-muted-foreground">{t('dashboard.download.driver')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1.5 border-sky-200 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:border-sky-400 dark:hover:border-sky-600 group transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                >
                  <Apple className="h-5 w-5 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">iOS</span>
                  <span className="text-[10px] text-muted-foreground">{t('dashboard.download.driver')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1.5 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-400 dark:hover:border-green-600 group transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                >
                  <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">Android</span>
                  <span className="text-[10px] text-muted-foreground">{t('dashboard.download.passenger')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1.5 border-sky-200 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:border-sky-400 dark:hover:border-sky-600 group transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                >
                  <Apple className="h-5 w-5 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">iOS</span>
                  <span className="text-[10px] text-muted-foreground">{t('dashboard.download.passenger')}</span>
                </Button>
              </div>
              {/* Play Store badge */}
              <div className="mt-3 flex items-center justify-center gap-2 bg-muted/50 rounded-lg p-2.5">
                <Play className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] text-muted-foreground font-medium">Disponível na Google Play e App Store</span>
              </div>
              {/* Trust Badges */}
              <div className="mt-3 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-[10px] font-medium">Dados Seguros</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Globe className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-[10px] font-medium">SSL</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-[10px] font-medium">+10k</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <DashboardCharts data={dashboardData} />

      {/* Visão Geral - Mini Widgets */}
      <div className="border-b border-emerald-200/50 dark:border-emerald-800/30" />
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-emerald-600" />
          Visão Geral
          <span className="flex-1 h-px bg-gradient-to-r from-emerald-400/60 to-transparent ml-2" />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Próximos Eventos Mini Widget */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Card className="shadow-sm h-full bg-card card-hover-lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-emerald-600" />
                  Próximos Eventos
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px] ml-auto">3</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {[
                  { title: 'Webinar: Maximizar Ganhos', type: 'webinar', days: 3, color: 'bg-emerald-500' },
                  { title: 'Manutenção do Sistema', type: 'maintenance', days: 2, color: 'bg-red-500' },
                  { title: 'Promo: CashBack Dobrado', type: 'promo', days: 7, color: 'bg-amber-500' },
                ].map((event, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn('w-2 h-2 rounded-full shrink-0', event.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{event.title}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{event.type}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                      {event.days === 1 ? 'amanhã' : `${event.days}d`}
                    </span>
                  </motion.div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-emerald-600 gap-1 mt-1"
                  onClick={() => setActivePage('events')}
                >
                  Ver todos os eventos
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sua Posição Mini Widget */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Card className="shadow-sm h-full bg-gradient-to-br from-gray-900 to-gray-800 border-0 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  Sua Posição
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-center mb-3">
                  <p className="text-3xl font-bold text-white animate-count-pop">#15</p>
                  <p className="text-xs text-gray-400 mt-1">de 156 membros</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Ganhos</span>
                    <span className="text-emerald-400 font-medium">#15</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Indicações</span>
                    <span className="text-teal-400 font-medium">#12</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Pontos</span>
                    <span className="text-amber-400 font-medium">#18</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-gray-400 hover:text-amber-400 mt-3 gap-1"
                  onClick={() => setActivePage('leaderboard')}
                >
                  Ver ranking completo
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Resumo Semanal Mini Widget with Sparkline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <Card className="shadow-sm h-full bg-card card-hover-lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Resumo Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Ganhos esta semana</p>
                    <p className="text-xl font-bold text-foreground">R$ 1.250,00</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-full">
                    <TrendingUp className="h-3 w-3" />
                    +12%
                  </div>
                </div>
                {/* SVG Sparkline */}
                <div className="h-16 mb-2">
                  <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="weeklySparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="95%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <motion.path
                      d="M0,45 L33,38 L66,42 L100,30 L133,25 L166,18 L200,10"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                    <motion.path
                      d="M0,45 L33,38 L66,42 L100,30 L133,25 L166,18 L200,10 L200,60 L0,60 Z"
                      fill="url(#weeklySparkGrad)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                    />
                    {/* Data points */}
                    {[
                      { x: 0, y: 45 }, { x: 33, y: 38 }, { x: 66, y: 42 },
                      { x: 100, y: 30 }, { x: 133, y: 25 }, { x: 166, y: 18 }, { x: 200, y: 10 },
                    ].map((point, i) => (
                      <motion.circle
                        key={i}
                        cx={point.x}
                        cy={point.y}
                        r="3"
                        fill="#10b981"
                        stroke="white"
                        strokeWidth="1.5"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
                      />
                    ))}
                  </svg>
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>Seg</span>
                  <span>Ter</span>
                  <span>Qua</span>
                  <span>Qui</span>
                  <span>Sex</span>
                  <span>Sáb</span>
                  <span>Dom</span>
                </div>
                <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Média diária</span>
                  <span className="font-semibold text-foreground">R$ 178,57</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
