'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MatrixVisualization } from './matrix-visualization'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency, cn } from '@/lib/utils'
import { DollarSign, TrendingUp, ShoppingBag, ArrowDownRight, Download, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'

const cashbackSummary = {
  entrada: {
    total: 3258000,
    lastMonth: 456000,
    lastWeek: 112000,
    pending: 89000,
  },
  residual: {
    total: 1824000,
    lastMonth: 234000,
    lastWeek: 56000,
    pending: 45000,
  },
  vendas: {
    total: 10602500,
    lastMonth: 1234000,
    lastWeek: 345000,
    pending: 678000,
  },
}

type Period = '7d' | '30d' | 'all'

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
  trend?: number
}) {
  return (
    <Card className="shadow-sm bg-card">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-base font-bold text-foreground">{formatCurrency(value)}</p>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function CashbackPage() {
  const [activeTab, setActiveTab] = useState('entrada')
  const [period, setPeriod] = useState<Period>('30d')
  const { t } = useTranslation()

  const totalEarnings = cashbackSummary.entrada.total + cashbackSummary.residual.total + cashbackSummary.vendas.total

  const getFilteredSummary = (type: 'entrada' | 'residual' | 'vendas') => {
    const s = cashbackSummary[type]
    switch (period) {
      case '7d': return { ...s, total: s.lastWeek }
      case '30d': return { ...s, total: s.lastMonth }
      case 'all': return s
    }
  }

  const currentSummary = getFilteredSummary(activeTab as 'entrada' | 'residual' | 'vendas')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('cashback.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('cashback.subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 text-xs w-fit">
          <Download className="h-3.5 w-3.5" />
          {t('cashback.downloadReport')}
        </Button>
      </div>

      {/* Total Earnings Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 shadow-lg overflow-hidden">
          <CardContent className="p-5 relative">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            <div className="relative">
              <p className="text-sm text-emerald-100 font-medium">{t('cashback.totalEarnings')}</p>
              <p className="text-3xl font-bold text-white mt-1">{formatCurrency(totalEarnings)}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="text-xs text-emerald-200">
                  <span className="font-semibold text-white">{t('cashback.entrada')}:</span> {formatCurrency(cashbackSummary.entrada.total)}
                </div>
                <div className="text-xs text-emerald-200">
                  <span className="font-semibold text-white">{t('cashback.residual')}:</span> {formatCurrency(cashbackSummary.residual.total)}
                </div>
                <div className="text-xs text-emerald-200">
                  <span className="font-semibold text-white">{t('cashback.vendas')}:</span> {formatCurrency(cashbackSummary.vendas.total)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Period Filter */}
      <div className="flex items-center gap-2">
        {[
          { key: '7d' as Period, label: t('cashback.period.7d') },
          { key: '30d' as Period, label: t('cashback.period.30d') },
          { key: 'all' as Period, label: t('cashback.period.all') },
        ].map(p => (
          <Button
            key={p.key}
            variant={period === p.key ? 'default' : 'outline'}
            size="sm"
            className={cn('text-xs h-7', period === p.key && 'bg-emerald-600 hover:bg-emerald-700 text-white')}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="entrada" className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('cashback.entrada')}</span>
          </TabsTrigger>
          <TabsTrigger value="residual" className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('cashback.residual')}</span>
          </TabsTrigger>
          <TabsTrigger value="vendas" className="flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('cashback.vendas')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entrada" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard label={t('cashback.totalAccumulated')} value={currentSummary.total} icon={DollarSign} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" trend={5} />
            <SummaryCard label={t('cashback.lastMonth')} value={cashbackSummary.entrada.lastMonth} icon={ArrowDownRight} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" trend={8} />
            <SummaryCard label={t('cashback.lastWeek')} value={cashbackSummary.entrada.lastWeek} icon={ArrowDownRight} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" trend={3} />
            <SummaryCard label={t('cashback.pending')} value={cashbackSummary.entrada.pending} icon={DollarSign} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
          </div>
          <MatrixVisualization type="entrada" />
        </TabsContent>

        <TabsContent value="residual" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard label={t('cashback.totalAccumulated')} value={currentSummary.total} icon={DollarSign} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" trend={3} />
            <SummaryCard label={t('cashback.lastMonth')} value={cashbackSummary.residual.lastMonth} icon={ArrowDownRight} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" trend={6} />
            <SummaryCard label={t('cashback.lastWeek')} value={cashbackSummary.residual.lastWeek} icon={ArrowDownRight} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" trend={2} />
            <SummaryCard label={t('cashback.pending')} value={cashbackSummary.residual.pending} icon={DollarSign} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
          </div>
          <MatrixVisualization type="residual" />
        </TabsContent>

        <TabsContent value="vendas" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard label={t('cashback.totalAccumulated')} value={currentSummary.total} icon={DollarSign} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" trend={15} />
            <SummaryCard label={t('cashback.lastMonth')} value={cashbackSummary.vendas.lastMonth} icon={ArrowDownRight} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" trend={10} />
            <SummaryCard label={t('cashback.lastWeek')} value={cashbackSummary.vendas.lastWeek} icon={ArrowDownRight} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" trend={7} />
            <SummaryCard label={t('cashback.pending')} value={cashbackSummary.vendas.pending} icon={DollarSign} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
          </div>
          <MatrixVisualization type="vendas" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
