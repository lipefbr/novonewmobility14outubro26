'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency, formatDate, getStatusLabel, getStatusVariant, cn } from '@/lib/utils'
import { financialApi } from '@/lib/api'
import { FinancialSkeleton } from '../ui/loading-skeletons'
import { EmptyState } from '../ui/empty-states'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  DollarSign,
  Car,
  ShoppingBag,
  UtensilsCrossed,
  Pill,
  Gift,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  FileDown,
  Calendar,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

const mockTransactions = [
  { id: '1', type: 'cashback_entry', amount: 45000, status: 'paid', category: 'withdrawal', description: 'CashBack Entrada - Nível 2', date: '2025-01-15' },
  { id: '2', type: 'cashback_residual', amount: 23000, status: 'paid', category: 'withdrawal', description: 'CashBack Residual - Nível 3', date: '2025-01-14' },
  { id: '3', type: 'withdrawal', amount: -200000, status: 'pending', category: 'withdrawal', description: 'Saque solicitado', date: '2025-01-13' },
  { id: '4', type: 'cashback_sales', amount: 12000, status: 'paid', category: 'mobility', description: 'CashBack Vendas - Mobilidade', date: '2025-01-12' },
  { id: '5', type: 'gratification', amount: 85000, status: 'approved', category: 'gratification', description: 'Gratificação Liderança', date: '2025-01-11' },
  { id: '6', type: 'cashback_entry', amount: 15000, status: 'paid', category: 'withdrawal', description: 'CashBack Entrada - Nível 1', date: '2025-01-10' },
  { id: '7', type: 'cashback_sales', amount: 8900, status: 'paid', category: 'food', description: 'CashBack Vendas - Refeição', date: '2025-01-09' },
  { id: '8', type: 'deposit', amount: 99900, status: 'paid', category: 'withdrawal', description: 'Pagamento Plano Blue 5', date: '2025-01-08' },
  { id: '9', type: 'cashback_residual', amount: 18000, status: 'paid', category: 'withdrawal', description: 'CashBack Residual - Nível 5', date: '2025-01-07' },
  { id: '10', type: 'cashback_sales', amount: 5600, status: 'paid', category: 'pharmacy', description: 'CashBack Vendas - Farmácia', date: '2025-01-06' },
  { id: '11', type: 'withdrawal', amount: -150000, status: 'paid', category: 'withdrawal', description: 'Saque processado', date: '2025-01-05' },
  { id: '12', type: 'bonus', amount: 50000, status: 'paid', category: 'withdrawal', description: 'Bônus Indicação Direta', date: '2025-01-04' },
]

const monthlyData = [
  { month: 'Ago', ganhos: 2850000, saques: 1200000 },
  { month: 'Set', ganhos: 3100000, saques: 1500000 },
  { month: 'Out', ganhos: 2950000, saques: 1100000 },
  { month: 'Nov', ganhos: 3400000, saques: 1800000 },
  { month: 'Dez', ganhos: 3800000, saques: 2100000 },
  { month: 'Jan', ganhos: 3200000, saques: 1600000 },
]

const typeLabels: Record<string, string> = {
  cashback_entry: 'CB Entrada',
  cashback_residual: 'CB Residual',
  cashback_sales: 'CB Vendas',
  withdrawal: 'Saque',
  deposit: 'Depósito',
  gratification: 'Gratificação',
  bonus: 'Bônus',
  voucher: 'Voucher',
}

const typeIcons: Record<string, string> = {
  cashback_entry: '💰',
  cashback_residual: '📈',
  cashback_sales: '🛒',
  withdrawal: '🏦',
  deposit: '💳',
  gratification: '🎁',
  bonus: '⭐',
  voucher: '🎫',
}

export function FinancialPage() {
  const { user } = useStore()
  const { t } = useTranslation()
  const [filterType, setFilterType] = useState<string>('all')
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [exportStartDate, setExportStartDate] = useState('')
  const [exportEndDate, setExportEndDate] = useState('')
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return <FinancialSkeleton />
  }

  const filtered = mockTransactions.filter((tx) => {
    if (filterType === 'all') return true
    return tx.type === filterType
  })

  const totalEarnedThisMonth = 3200000
  const totalWithdrawn = 1600000
  const availableBalance = user?.balanceWithdrawal || 0

  const balances = [
    { label: t('financial.balance.withdrawal'), value: user?.balanceWithdrawal || 0, icon: Wallet, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', gradient: 'from-emerald-500 to-emerald-600', change: 5 },
    { label: t('financial.balance.mobility'), value: user?.balanceMobility || 0, icon: Car, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', gradient: 'from-blue-500 to-blue-600', change: -2 },
    { label: t('financial.balance.shopping'), value: user?.balanceShopping || 0, icon: ShoppingBag, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', gradient: 'from-purple-500 to-purple-600', change: 8 },
    { label: t('financial.balance.food'), value: user?.balanceFood || 0, icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', gradient: 'from-orange-500 to-orange-600', change: 3 },
    { label: t('financial.balance.pharmacy'), value: user?.balancePharmacy || 0, icon: Pill, color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', gradient: 'from-rose-500 to-rose-600', change: 6 },
    { label: t('financial.balance.gratification'), value: user?.balanceGratification || 0, icon: Gift, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', gradient: 'from-amber-500 to-amber-600', change: 12 },
  ]

  const handleExportCSV = () => {
    const headers = 'Data,Descrição,Tipo,Valor,Status\n'
    const rows = filtered.map(tx => 
      `${tx.date},"${tx.description}",${typeLabels[tx.type] || tx.type},${tx.amount / 100},${getStatusLabel(tx.status)}`
    ).join('\n')
    const csv = headers + rows
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'extrato_newmobility.csv'
    link.click()
  }

  const handleServerExport = () => {
    if (!user?.id) return
    const url = financialApi.getExportUrl(user.id, 'csv', exportStartDate || undefined, exportEndDate || undefined, filterType)
    window.open(url, '_blank')
    setExportDialogOpen(false)
    toast.success('Exportação iniciada!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('financial.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('financial.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setExportDialogOpen(true)}>
            <FileDown className="h-3.5 w-3.5" />
            {t('financial.exportCsv')}
          </Button>
          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => setWithdrawOpen(true)}>
              <ArrowDownToLine className="h-4 w-4" />
              {t('financial.withdraw')}
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('financial.withdraw')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 text-center">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">{t('financial.availableForWithdrawal')}</p>
                  <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                    {formatCurrency(user?.balanceWithdrawal || 0)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>{t('financial.withdrawAmount')}</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{t('financial.minimumWithdrawal')}</p>
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => { setWithdrawOpen(false); toast.success('Saque solicitado com sucesso!') }}
                >
                  {t('financial.confirmWithdrawal')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-emerald-500 shadow-sm bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{t('financial.quickStats.earnedMonth')}</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(totalEarnedThisMonth)}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5" />
                  +5%
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500 shadow-sm bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{t('financial.quickStats.withdrawn')}</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(totalWithdrawn)}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                  <TrendingDown className="h-3.5 w-3.5" />
                  -3%
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-teal-500 shadow-sm bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{t('financial.quickStats.available')}</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(availableBalance)}</p>
                </div>
                <div className="p-2 rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Mini Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Card className="shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              {t('financial.earningsVsWithdrawals')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] md:h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorGanhos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSaques" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                    tickFormatter={(value) => `R$${(value / 100000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`R$ ${(value / 100).toLocaleString('pt-BR')}`, '']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="ganhos" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorGanhos)" name="Ganhos" />
                  <Area type="monotone" dataKey="saques" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorSaques)" name="Saques" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Balance Cards with gradient left borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {balances.map((balance, i) => (
          <motion.div
            key={balance.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="shadow-sm overflow-hidden bg-card">
              <div className="flex">
                <div className={cn('w-1.5 bg-gradient-to-b', balance.gradient)} />
                <CardContent className="p-4 flex items-center gap-3 flex-1">
                  <div className={`p-3 rounded-lg ${balance.color}`}>
                    <balance.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium">{balance.label}</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(balance.value)}</p>
                  </div>
                  <div className={cn(
                    'flex items-center gap-0.5 text-xs font-semibold',
                    balance.change >= 0 ? 'text-emerald-600' : 'text-red-500'
                  )}>
                    {balance.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {balance.change >= 0 ? '+' : ''}{balance.change}%
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Transactions */}
      <Card className="shadow-sm bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground">{t('financial.transactions')}</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('general.all')}</SelectItem>
                  <SelectItem value="cashback_entry">CB Entrada</SelectItem>
                  <SelectItem value="cashback_residual">CB Residual</SelectItem>
                  <SelectItem value="cashback_sales">CB Vendas</SelectItem>
                  <SelectItem value="withdrawal">Saques</SelectItem>
                  <SelectItem value="gratification">Gratificações</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-600" onClick={handleExportCSV}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border max-h-96 overflow-y-auto custom-scrollbar">
            {filtered.map((tx, i) => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-base">{typeIcons[tx.type] || '📋'}</span>
                  <div className={`p-1.5 rounded-lg ${
                    tx.amount > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                  }`}>
                    {tx.amount > 0 ? (
                      <ArrowUpFromLine className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownToLine className="h-3.5 w-3.5" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{tx.description}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0 hidden sm:inline-flex">
                      {typeLabels[tx.type] || tx.type}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(tx.date)}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${tx.amount > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                  </p>
                  <Badge variant={getStatusVariant(tx.status)} className="text-[10px]">
                    {getStatusLabel(tx.status)}
                  </Badge>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <EmptyState
                icon={Wallet}
                title="Nenhuma transação encontrada"
                description="Suas transações aparecerão aqui assim que houver movimentação na sua conta."
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-emerald-600" />
              Exportar Relatório
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Exporte suas transações em formato CSV com filtros de data e tipo.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Data inicial
                </Label>
                <Input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Data final
                </Label>
                <Input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Tipo de transação</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="cashback_entry">CB Entrada</SelectItem>
                  <SelectItem value="cashback_residual">CB Residual</SelectItem>
                  <SelectItem value="cashback_sales">CB Vendas</SelectItem>
                  <SelectItem value="withdrawal">Saques</SelectItem>
                  <SelectItem value="gratification">Gratificações</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                💡 Dica: Deixe as datas em branco para exportar todas as transações do período.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleExportCSV}
              >
                <Download className="h-4 w-4" />
                Exportar local
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                onClick={handleServerExport}
              >
                <FileDown className="h-4 w-4" />
                Exportar do servidor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bank Details */}
      <Card className="shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            {t('financial.bankDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Banco</Label>
              <p className="text-sm font-medium text-foreground mt-0.5">Banco do Brasil</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tipo de Conta</Label>
              <p className="text-sm font-medium text-foreground mt-0.5">Conta Corrente</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Agência</Label>
              <p className="text-sm font-medium text-foreground mt-0.5">1234-5</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Conta</Label>
              <p className="text-sm font-medium text-foreground mt-0.5">67890-1</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
