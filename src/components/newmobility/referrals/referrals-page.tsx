'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency, formatDate, getStatusLabel, getStatusVariant, getPlanName } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { ReferralsSkeleton } from '../ui/loading-skeletons'
import { EmptyState } from '../ui/empty-states'
import {
  Users, UserPlus, UserCheck, TrendingUp, Search, Link2, Copy, Check as CheckIcon,
  Share2, Eye, ChevronDown, ChevronUp, Calendar, CreditCard, Award, ArrowUpRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const mockReferrals = [
  { id: '1', name: 'Ana Paula Santos', date: '2024-11-15', status: 'active', plan: 'blue5', level: 1, cashback: 125000, email: 'ana.santos@email.com' },
  { id: '2', name: 'Roberto Ferreira', date: '2024-10-22', status: 'active', plan: 'blue3', level: 1, cashback: 89000, email: 'roberto.f@email.com' },
  { id: '3', name: 'Maria Clara Costa', date: '2024-09-05', status: 'active', plan: 'blue5', level: 1, cashback: 234000, email: 'maria.cc@email.com' },
  { id: '4', name: 'João Pedro Lima', date: '2024-08-18', status: 'inactive', plan: 'blue3', level: 1, cashback: 45000, email: 'jp.lima@email.com' },
  { id: '5', name: 'Lucas Mendes', date: '2024-12-01', status: 'active', plan: 'blue5', level: 2, cashback: 67000, email: 'lucas.m@email.com' },
  { id: '6', name: 'Fernanda Oliveira', date: '2024-07-10', status: 'active', plan: 'blue3', level: 2, cashback: 156000, email: 'fer.oliveira@email.com' },
  { id: '7', name: 'Ricardo Souza', date: '2024-06-15', status: 'active', plan: 'blue5', level: 2, cashback: 312000, email: 'ricardo.s@email.com' },
  { id: '8', name: 'Patricia Alves', date: '2024-05-20', status: 'inactive', plan: 'free', level: 2, cashback: 12000, email: 'pat.alves@email.com' },
  { id: '9', name: 'Bruno Carvalho', date: '2024-11-28', status: 'active', plan: 'blue3', level: 3, cashback: 78000, email: 'bruno.c@email.com' },
  { id: '10', name: 'Camila Rodrigues', date: '2024-10-15', status: 'active', plan: 'blue5', level: 3, cashback: 198000, email: 'camila.r@email.com' },
  { id: '11', name: 'Diego Martins', date: '2024-09-22', status: 'active', plan: 'blue3', level: 3, cashback: 95000, email: 'diego.m@email.com' },
  { id: '12', name: 'Elisa Barbosa', date: '2024-08-30', status: 'active', plan: 'blue5', level: 4, cashback: 445000, email: 'elisa.b@email.com' },
  { id: '13', name: 'Thiago Nascimento', date: '2025-01-10', status: 'active', plan: 'blue3', level: 1, cashback: 32000, email: 'thiago.n@email.com' },
  { id: '14', name: 'Carla Ferreira', date: '2025-01-18', status: 'active', plan: 'blue5', level: 1, cashback: 15000, email: 'carla.f@email.com' },
  { id: '15', name: 'Marcos Ribeiro', date: '2025-02-01', status: 'active', plan: 'blue3', level: 3, cashback: 50000, email: 'marcos.r@email.com' },
  { id: '16', name: 'Juliana Santos', date: '2025-02-05', status: 'active', plan: 'blue5', level: 4, cashback: 88000, email: 'juliana.s@email.com' },
]

export function ReferralsPage() {
  const { t } = useTranslation()
  const { user } = useStore()
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [detailReferral, setDetailReferral] = useState<typeof mockReferrals[0] | null>(null)
  const [showAllLevels, setShowAllLevels] = useState(false)
  const [loading, setLoading] = useState(true)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return <ReferralsSkeleton />
  }

  const referralLink = `https://newmobility.com.br/ref/${user?.referralCode || 'USER2025'}`

  const filtered = mockReferrals.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchesLevel = levelFilter === null || r.level === levelFilter
    return matchesSearch && matchesLevel
  })

  const totalDirect = mockReferrals.filter((r) => r.level === 1).length
  const totalNetwork = mockReferrals.length
  const activeCount = mockReferrals.filter((r) => r.status === 'active').length
  const newThisMonth = mockReferrals.filter((r) => {
    const d = new Date(r.date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const conversionRate = Math.round((activeCount / totalNetwork) * 100)

  const levelCounts = Array.from({ length: 7 }, (_, i) => i + 1).map((lvl) => ({
    level: lvl,
    count: mockReferrals.filter((r) => r.level === lvl).length,
  }))

  const maxLevelWithData = Math.max(...mockReferrals.map((r) => r.level))
  const visibleLevels = showAllLevels ? levelCounts : levelCounts.slice(0, 4)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'NewMobility - Indique e Ganhe',
        text: `Use meu código ${user?.referralCode || 'USER2025'} e ganhe CashBack!`,
        url: referralLink,
      })
    } else {
      handleCopyLink()
    }
  }

  const planBadgeColor = (plan: string) => {
    switch (plan) {
      case 'blue5': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'blue3': return 'bg-teal-100 text-teal-700 border-teal-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">{t('referrals.title')}</h2>
        <p className="text-sm text-gray-500">Gerencie e acompanhe sua rede de indicações</p>
      </div>

      {/* Referral Link Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-sm border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-gray-900">Link de Indicação</h3>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 bg-white rounded-lg border border-emerald-200 px-4 py-2.5 text-sm font-mono text-gray-700 truncate">
                {referralLink}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-300 hover:bg-emerald-50 gap-1.5"
                onClick={handleCopyLink}
              >
                {copied ? <CheckIcon className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied ? t('general.copied') : t('general.copy')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-300 hover:bg-emerald-50 gap-1.5"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                {t('general.share')}
              </Button>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Código: <strong className="text-emerald-700">{user?.referralCode || 'USER2025'}</strong></span>
              <span>Compartilhe e ganhe CashBack por cada indicação ativa!</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: UserPlus, label: 'INDICAÇÕES DIRETAS', value: totalDirect, color: 'bg-emerald-100 text-emerald-600', trend: '+2 este mês' },
          { icon: Users, label: 'TOTAL DA REDE', value: totalNetwork, color: 'bg-teal-100 text-teal-600', trend: `+${newThisMonth} novos` },
          { icon: UserCheck, label: 'NOVOS ESTE MÊS', value: newThisMonth, color: 'bg-amber-100 text-amber-600', trend: 'Crescendo!' },
          { icon: TrendingUp, label: 'TAXA CONVERSÃO', value: `${conversionRate}%`, color: 'bg-rose-100 text-rose-600', trend: 'Ativos/Total' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-[10px] text-gray-500 font-medium">{stat.label}</p>
                <p className="text-[10px] text-emerald-600 font-medium mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Network Tree Visualization */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            Visualização da Rede
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2">
            {/* You - Root Node */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-lg border-4 border-emerald-200">
                Você
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white text-[8px] flex items-center justify-center border-2 border-white font-bold">
                {totalNetwork}
              </div>
            </div>

            {/* Connector Lines */}
            <div className="w-px h-6 bg-gradient-to-b from-emerald-400 to-gray-300" />
            <div className="hidden sm:flex w-64 h-px bg-gray-300" />
            
            {/* Level Nodes */}
            {Array.from({ length: maxLevelWithData }, (_, idx) => {
              const lvl = idx + 1
              const lvlData = mockReferrals.filter((r) => r.level === lvl)
              const lvlActive = lvlData.filter((r) => r.status === 'active').length
              return (
                <div key={lvl} className="w-full">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
                    <span className="text-xs text-gray-500 font-medium px-2">
                      Nível {lvl} — {lvlData.length} {lvlData.length === 1 ? 'membro' : 'membros'}
                      <span className="text-emerald-600 ml-1">({lvlActive} ativos)</span>
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {lvlData.map((r) => (
                      <motion.div
                        key={r.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.1 + Math.random() * 0.1 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold border-2 cursor-pointer hover:scale-110 transition-transform ${
                          r.status === 'active'
                            ? r.plan === 'blue5'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                              : r.plan === 'blue3'
                              ? 'bg-teal-100 text-teal-700 border-teal-300'
                              : 'bg-gray-100 text-gray-700 border-gray-300'
                            : 'bg-red-50 text-red-400 border-red-200 opacity-50'
                        }`}
                        title={r.name}
                        onClick={() => setDetailReferral(r)}
                      >
                        {r.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </motion.div>
                    ))}
                  </div>
                  {lvl < maxLevelWithData && (
                    <div className="flex justify-center mt-2">
                      <div className="w-px h-4 bg-gray-200" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Níveis da Rede */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-600" />
              Níveis da Rede
            </CardTitle>
            {maxLevelWithData > 4 && (
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setShowAllLevels(!showAllLevels)}>
                {showAllLevels ? 'Ver menos' : 'Ver todos'}
                {showAllLevels ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <AnimatePresence>
              {visibleLevels.map((lvl, i) => {
                const barWidth = totalNetwork > 0 ? Math.max((lvl.count / totalNetwork) * 100, 8) : 8
                return (
                  <motion.div
                    key={lvl.level}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-gray-50 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">Nível {lvl.level}</span>
                      <span className="text-sm font-bold text-gray-900">{lvl.count}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {lvl.count === 1 ? '1 usuário' : `${lvl.count} usuários`}
                    </p>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[null, 1, 2, 3, 4].map((level) => (
            <button
              key={level ?? 'all'}
              onClick={() => setLevelFilter(level)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                levelFilter === level
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {level === null ? 'Todos' : `Nível ${level}`}
            </button>
          ))}
        </div>
      </div>

      {/* Referral List */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="divide-y max-h-96 overflow-y-auto custom-scrollbar">
            {filtered.map((referral, i) => (
              <motion.div
                key={referral.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
              >
                <Avatar className="h-10 w-10 border-2 border-emerald-100">
                  <AvatarFallback className="bg-emerald-50 text-emerald-700 text-sm font-medium">
                    {referral.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900 truncate">{referral.name}</span>
                    <Badge className={`text-[10px] border ${planBadgeColor(referral.plan)}`}>
                      {getPlanName(referral.plan)}
                    </Badge>
                    <Badge variant={getStatusVariant(referral.status)} className="text-[10px]">
                      {getStatusLabel(referral.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{formatDate(referral.date)}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-emerald-600 font-medium">Nível {referral.level}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">{formatCurrency(referral.cashback)}</p>
                    <p className="text-[10px] text-gray-400">CashBack gerado</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-emerald-600"
                    onClick={() => setDetailReferral(referral)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <EmptyState
                icon={Users}
                title="Nenhum indicado ainda"
                description="Compartilhe seu link de indicação e comece a construir sua rede para ganhar CashBack!"
                actionLabel="Compartilhar link"
                onAction={handleShare}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailReferral} onOpenChange={() => setDetailReferral(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Indicado</DialogTitle>
          </DialogHeader>
          {detailReferral && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-emerald-200">
                  <AvatarFallback className="bg-emerald-50 text-emerald-700 text-lg font-medium">
                    {detailReferral.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-gray-900">{detailReferral.name}</h3>
                  <p className="text-sm text-gray-500">{detailReferral.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-[10px] border ${planBadgeColor(detailReferral.plan)}`}>
                      {getPlanName(detailReferral.plan)}
                    </Badge>
                    <Badge variant={getStatusVariant(detailReferral.status)} className="text-[10px]">
                      {getStatusLabel(detailReferral.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Entrada</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(detailReferral.date)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowUpRight className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Nível</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Nível {detailReferral.level}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs text-emerald-600">CashBack Gerado</span>
                  </div>
                  <p className="text-sm font-semibold text-emerald-700">{formatCurrency(detailReferral.cashback)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Plano</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{getPlanName(detailReferral.plan)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
