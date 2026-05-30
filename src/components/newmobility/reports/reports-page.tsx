'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency } from '@/lib/utils'
import { apiFetch } from '@/lib/api'
import {
  BarChart3, TrendingUp, Users, DollarSign, PieChart, Calendar,
  Download, RefreshCw, ArrowUpRight, ArrowDownRight, Activity,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  PieChart as RPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend,
} from 'recharts'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface AnalyticsData {
  period: string
  periodDays: number
  revenueTrends: { month: string; amount: number }[]
  cashbackDistribution: { month: string; entrada: number; residual: number; vendas: number; total: number }[]
  networkGrowth: { month: string; count: number }[]
  planDistribution: { plan: string; count: number }[]
  categorySpending: { category: string; amount: number; count: number }[]
  totalNetworkSize: number
  summary: { totalRevenue: number; totalWithdrawals: number; totalCashback: number; totalTransactions: number }
}

export function ReportsPage() {
  const { t } = useTranslation()
  const { user } = useStore()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [period, setPeriod] = useState('30d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await apiFetch<AnalyticsData>(`/reports/analytics?userId=${user?.id}&period=${period}`)
      setData(result)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  const formatMonth = (m: string) => {
    const [y, mo] = m.split('-')
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return months[parseInt(mo) - 1] + '/' + y.slice(2)
  }

  const formatCents = (v: number) => formatCurrency(v)

  const revenueData = (data?.revenueTrends || []).map(d => ({ month: formatMonth(d.month), Receita: d.amount / 100 }))
  const cashbackData = (data?.cashbackDistribution || []).map(d => ({
    month: formatMonth(d.month), Entrada: d.entrada / 100, Residual: d.residual / 100, Vendas: d.vendas / 100
  }))
  const networkData = (data?.networkGrowth || []).map(d => ({ month: formatMonth(d.month), Membros: d.count }))
  const planData = (data?.planDistribution || []).map(d => ({
    name: d.plan === 'free' ? 'Gratuito' : d.plan === 'blue3' ? 'Blue 3' : 'Blue 5',
    value: d.count
  }))

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-xs" style={{ color: p.color }}>
              {p.name}: {typeof p.value === 'number' && p.value > 100 ? formatCurrency(Math.round(p.value * 100)) : p.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Relatórios e Análises
          </h2>
          <p className="text-sm text-muted-foreground">Visualize métricas e tendências do seu negócio</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] h-9">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="365d">1 ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1" onClick={loadData}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Receita Total', value: formatCents(data.summary.totalRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', trend: '+12%' },
              { label: 'Total CashBack', value: formatCents(data.summary.totalCashback), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', trend: '+8%' },
              { label: 'Total Saques', value: formatCents(data.summary.totalWithdrawals), icon: ArrowDownRight, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', trend: '-3%' },
              { label: 'Transações', value: data.summary.totalTransactions.toString(), icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', trend: '+15%' },
            ].map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`${card.bg} border-0`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <card.icon className={`h-4 w-4 ${card.color}`} />
                      <Badge variant="secondary" className={`text-[9px] ${card.trend.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
                        {card.trend}
                      </Badge>
                    </div>
                    <p className="text-lg font-bold text-foreground">{card.value}</p>
                    <p className="text-[10px] text-muted-foreground">{card.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue Trends */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600" /> Tendência de Receita</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <RTooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* CashBack Distribution */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4 text-blue-600" /> CashBack por Categoria</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashbackData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <RTooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="Entrada" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="Residual" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="Vendas" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Network Growth */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-purple-600" /> Crescimento da Rede</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={networkData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <RTooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="Membros" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Plan Distribution */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><PieChart className="h-4 w-4 text-amber-600" /> Distribuição de Planos</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  {planData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RPieChart>
                        <Pie data={planData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                          {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <RTooltip />
                        <Legend />
                      </RPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem dados suficientes</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Spending */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-600" /> Gastos por Categoria</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {data.categorySpending.map((c, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm font-bold text-foreground">{formatCents(c.amount)}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{c.category}</p>
                    <p className="text-[10px] text-muted-foreground">{c.count} transações</p>
                  </div>
                ))}
                {data.categorySpending.length === 0 && (
                  <p className="col-span-full text-sm text-muted-foreground text-center py-4">Nenhum gasto categorizado neste período</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin" />
        </div>
      )}
    </div>
  )
}
