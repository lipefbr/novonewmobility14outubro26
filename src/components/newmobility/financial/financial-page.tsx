'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency, formatDate, getStatusLabel, getStatusVariant, cn } from '@/lib/utils'
import { financialApi } from '@/lib/api'
import { FinancialSkeleton } from '../ui/loading-skeletons'
import { EmptyState } from '../ui/empty-states'
import { InvoiceViewer } from './invoice-viewer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  DollarSign,
  Car,
  ShoppingBag,
  UtensilsCrossed,
  Pill,
  Gift,
  Star,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  FileDown,
  Calendar,
  Send,
  Clock,
  ArrowRightLeft,
  CircleDot,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Ban,
  Info,
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
  transfer_out: 'Transferência Envio',
  transfer_in: 'Transferência Recebido',
  transfer: 'Transferência',
}

// Color-coded transaction type icon config (Lucide icons with colors)
const typeIconConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  cashback_entry: { icon: ArrowDownLeft, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  cashback_residual: { icon: ArrowDownLeft, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30' },
  cashback_sales: { icon: RotateCcw, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  withdrawal: { icon: ArrowUpRight, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  deposit: { icon: ArrowDownLeft, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  gratification: { icon: ArrowDownLeft, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  bonus: { icon: ArrowDownLeft, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  voucher: { icon: RotateCcw, color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
  transfer_out: { icon: ArrowRightLeft, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  transfer_in: { icon: ArrowRightLeft, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30' },
  transfer: { icon: ArrowRightLeft, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
}

// Enhanced status icon config with background colors
const statusConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  paid: { icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Concluído' },
  approved: { icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Aprovado' },
  pending: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', label: 'Pendente' },
  failed: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', label: 'Falhou' },
  rejected: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', label: 'Rejeitado' },
}

// Color-coded transaction type badge config
const typeBadgeConfig: Record<string, { bg: string; text: string; border: string }> = {
  cashback_entry: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  cashback_residual: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' },
  cashback_sales: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  withdrawal: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  deposit: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  gratification: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  bonus: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
  voucher: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
  transfer_out: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  transfer_in: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' },
  transfer: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' },
}

// Transaction type filter chips with icons
const filterChips = [
  { key: 'all', label: 'Todos', icon: Filter },
  { key: 'cashback_entry', label: 'CB Entrada', icon: DollarSign },
  { key: 'cashback_residual', label: 'CB Residual', icon: TrendingUp },
  { key: 'cashback_sales', label: 'CB Vendas', icon: ShoppingBag },
  { key: 'withdrawal', label: 'Saques', icon: ArrowDownToLine },
  { key: 'gratification', label: 'Gratificações', icon: Gift },
  { key: 'bonus', label: 'Bônus', icon: Star },
  { key: 'transfer', label: 'Transferências', icon: ArrowRightLeft },
]

// Animated counter
function AnimatedBalance({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0)
  const hasAnimated = useRef(false)
  useEffect(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true
    const duration = 1500
    const steps = 50
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) { setDisplay(value); clearInterval(timer) }
      else setDisplay(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])
  return <span className={className}>{formatCurrency(display)}</span>
}

// Mock withdrawal history
const mockWithdrawals = [
  { id: 'wd_001', amount: 200000, status: 'completed', requestedAt: '2025-01-13T10:30:00Z', processedAt: '2025-01-14T14:22:00Z', completedAt: '2025-01-16T09:00:00Z', estimatedCompletion: null, fee: 350, bankInfo: 'Banco do Brasil - Ag 1234-5 / CC 67890-1' },
  { id: 'wd_002', amount: 150000, status: 'completed', requestedAt: '2024-12-20T15:45:00Z', processedAt: '2024-12-21T08:30:00Z', completedAt: '2024-12-23T11:15:00Z', estimatedCompletion: null, fee: 350, bankInfo: 'Banco do Brasil - Ag 1234-5 / CC 67890-1' },
  { id: 'wd_003', amount: 500000, status: 'processing', requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), processedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), completedAt: null, estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), fee: 850, bankInfo: 'Banco do Brasil - Ag 1234-5 / CC 67890-1' },
  { id: 'wd_004', amount: 100000, status: 'requested', requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), processedAt: null, completedAt: null, estimatedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), fee: 350, bankInfo: 'Banco do Brasil - Ag 1234-5 / CC 67890-1' },
  { id: 'wd_005', amount: 75000, status: 'rejected', requestedAt: '2024-11-10T09:00:00Z', processedAt: '2024-11-10T16:45:00Z', completedAt: null, estimatedCompletion: null, fee: 0, bankInfo: 'Banco do Brasil - Ag 1234-5 / CC 67890-1' },
]

const withdrawalStatusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  requested: { label: 'Solicitado', icon: Clock, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  processing: { label: 'Processando', icon: Loader2, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  completed: { label: 'Concluído', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  rejected: { label: 'Rejeitado', icon: XCircle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export function FinancialPage() {
  const { user, updateUser } = useStore()
  const { t } = useTranslation()
  const [filterType, setFilterType] = useState<string>('all')
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [exportStartDate, setExportStartDate] = useState('')
  const [exportEndDate, setExportEndDate] = useState('')
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [financialTab, setFinancialTab] = useState('transactions')
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferSource, setTransferSource] = useState('mobility')
  const [transferDestination, setTransferDestination] = useState('withdrawal')
  const [transferAmount, setTransferAmount] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null)

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

  // Balance breakdown pie chart data
  const totalBalance = balances.reduce((acc, b) => acc + b.value, 0)
  const pieData = balances.map((b) => ({
    name: b.label,
    value: b.value,
    color: b.gradient.includes('emerald') ? '#059669' : b.gradient.includes('blue') ? '#3b82f6' : b.gradient.includes('purple') ? '#8b5cf6' : b.gradient.includes('orange') ? '#f97316' : b.gradient.includes('rose') ? '#f43f5e' : '#f59e0b',
  }))

  // Pending transactions
  const pendingTransactions = mockTransactions.filter((tx) => tx.status === 'pending')

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

  // 5% fee for non-Saque source transfers, 0% for Saque source
  const TRANSFER_FEES: Record<string, number> = {
    'mobility->withdrawal': 5, 'shopping->withdrawal': 5, 'food->withdrawal': 5,
    'pharmacy->withdrawal': 5, 'gratification->withdrawal': 5, 'withdrawal->mobility': 0,
    'withdrawal->shopping': 0, 'withdrawal->food': 0, 'withdrawal->pharmacy': 0,
  }
  const balanceLabels: Record<string, string> = {
    withdrawal: t('financial.balance.withdrawal'), mobility: t('financial.balance.mobility'),
    shopping: t('financial.balance.shopping'), food: t('financial.balance.food'),
    pharmacy: t('financial.balance.pharmacy'), gratification: t('financial.balance.gratification'),
  }
  const balanceValues: Record<string, number> = {
    withdrawal: user?.balanceWithdrawal || 0, mobility: user?.balanceMobility || 0,
    shopping: user?.balanceShopping || 0, food: user?.balanceFood || 0,
    pharmacy: user?.balancePharmacy || 0, gratification: user?.balanceGratification || 0,
  }
  const feeKey = `${transferSource}->${transferDestination}`
  const feePercent = TRANSFER_FEES[feeKey] ?? 5
  const amountNum = Number(transferAmount) || 0
  const feeAmount = Math.round(amountNum * feePercent / 100)
  const netAmount = amountNum - feeAmount

  const handleTransfer = async () => {
    if (!user?.id || !transferAmount || !transferSource || !transferDestination) return
    if (transferSource === transferDestination) { toast.error(t('transfer.sameBalance')); return }
    if (amountNum > (balanceValues[transferSource] || 0)) { toast.error(t('transfer.insufficientFunds')); return }
    try {
      const { transferApi } = await import('@/lib/api')
      await transferApi.transfer(user.id, transferSource, transferDestination, amountNum)
      toast.success(t('transfer.success'))
      setTransferOpen(false)
      setTransferAmount('')
    } catch (err: any) {
      toast.error(err.message || 'Erro na transferência')
    }
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
      {/* Header with Quick Transfer */}
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
          <Button variant="outline" size="sm" className="gap-2 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={() => setTransferOpen(true)}>
            <ArrowRightLeft className="h-3.5 w-3.5" />
            {t('transfer.title')}
          </Button>
          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => setWithdrawOpen(true)}>
              <ArrowDownToLine className="h-4 w-4" />
              {t('financial.withdraw')}
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ArrowDownToLine className="h-5 w-5 text-emerald-600" />
                  {t('financial.withdraw')}
                </DialogTitle>
                <DialogDescription className="sr-only">Dialog to request a withdrawal from your account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                    <span className="text-xs font-medium text-foreground">Valor</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-emerald-200 dark:bg-emerald-800" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">2</div>
                    <span className="text-xs font-medium text-muted-foreground">Confirmar</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-muted" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">3</div>
                    <span className="text-xs font-medium text-muted-foreground">Pronto</span>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 text-center border border-emerald-100 dark:border-emerald-900/50">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">{t('financial.availableForWithdrawal')}</p>
                  <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                    {formatCurrency(user?.balanceWithdrawal || 0)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">{t('financial.withdrawAmount')} <span className="text-[10px] text-muted-foreground font-normal">(valor em R$)</span></Label>
                  {/* Quick amount presets */}
                  <div className="flex gap-2 flex-wrap">
                    {[50, 100, 250, 500, 1000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setWithdrawAmount(String(amount))}
                        className="px-3 py-1 rounded-full text-xs font-medium border border-border hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 transition-colors"
                      >
                        R$ {amount.toLocaleString('pt-BR')}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="pl-10"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{t('financial.minimumWithdrawal')}</p>
                </div>
                {/* Fee calculation display */}
                {withdrawAmount && Number(withdrawAmount) > 0 && (() => {
                  const withdrawCents = Math.round(Number(withdrawAmount) * 100)
                  const FEE_PERCENT = 2
                  const feeCents = Math.round(withdrawCents * FEE_PERCENT / 100)
                  const netCents = withdrawCents - feeCents
                  const currentBalance = user?.balanceWithdrawal || 0
                  const newBalance = currentBalance - withdrawCents
                  return (
                    <div className="bg-gradient-to-b from-muted/50 to-muted/30 rounded-lg p-3 space-y-2 border border-border">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Info className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-semibold text-foreground">Resumo do saque</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Valor solicitado</span>
                        <span className="text-foreground font-medium">{formatCurrency(withdrawCents)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Taxa de processamento ({FEE_PERCENT}%)</span>
                        <span className="text-red-600 dark:text-red-400 font-medium">-{formatCurrency(feeCents)}</span>
                      </div>
                      <div className="h-px bg-border" />
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground font-semibold">Você receberá</span>
                        <span className={cn(
                          'font-bold text-base',
                          netCents > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        )}>{formatCurrency(netCents)}</span>
                      </div>
                      {newBalance < 0 && (
                        <div className="mt-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2">
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                            ⚠️ Seu saldo ficará negativo: {formatCurrency(newBalance)}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })()}
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={async () => {
                    if (!user?.id || !withdrawAmount || Number(withdrawAmount) <= 0) return
                    try {
                      const withdrawCents = Math.round(Number(withdrawAmount) * 100)
                      await financialApi.withdraw(user.id, withdrawCents, 'withdrawal')
                      // Update store balance immediately so negative balance is visible
                      const currentBalance = user?.balanceWithdrawal || 0
                      updateUser({ balanceWithdrawal: currentBalance - withdrawCents })
                      setWithdrawOpen(false)
                      setWithdrawAmount('')
                      toast.success('Saque solicitado com sucesso!')
                    } catch (err: any) {
                      toast.error(err.message || 'Erro ao solicitar saque')
                    }
                  }}
                >
                  {t('financial.confirmWithdrawal')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Balance Overview Hero with Pie Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="shadow-lg border-0 bg-gradient-to-r from-gray-900 to-gray-800 overflow-hidden relative">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='20' cy='20' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
          }} />
          <CardContent className="p-5 md:p-6 relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400 font-medium">Saldo Total</p>
                <AnimatedBalance value={totalBalance} className="text-3xl md:text-4xl font-bold text-white" />
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 bg-emerald-500/20 rounded-full px-2.5 py-1">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">+5.2%</span>
                  </div>
                  <span className="text-xs text-gray-400">vs. mês anterior</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-[100px] w-[100px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={45} paddingAngle={2} dataKey="value" animationDuration={1000}>
                        {pieData.map((entry, index) => (
                          <Cell key={`pie-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-1.5">
                  {pieData.slice(0, 4).map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] text-gray-300 truncate max-w-[100px]">{item.name}</span>
                      <span className="text-[10px] font-bold text-white">{((item.value / totalBalance) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-emerald-500 shadow-sm bg-card card-hover-lift">
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
          <Card className="border-l-4 border-l-amber-500 shadow-sm bg-card card-hover-lift">
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
          <Card className="border-l-4 border-l-teal-500 shadow-sm bg-card card-hover-lift">
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

      {/* Pending Transactions Section with pulsing dot */}
      {pendingTransactions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-sm bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <CircleDot className="h-4 w-4 animate-pulse" />
                Transações Pendentes
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[10px]">{pendingTransactions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-amber-100 dark:border-amber-900/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      {formatCurrency(Math.abs(tx.amount))}
                    </p>
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[10px]">
                      Processando
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

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

      {/* Balance Cards with gradient top border accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {balances.map((balance, i) => (
          <motion.div
            key={balance.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="shadow-sm overflow-hidden bg-card card-hover-lift relative">
              {/* Gradient top border accent */}
              <div className={cn('h-1 bg-gradient-to-r', balance.gradient)} />
              <div className="flex">
                <div className={cn('w-1.5 bg-gradient-to-b', balance.gradient)} />
                <div className={cn('absolute inset-0 opacity-[0.03] bg-gradient-to-br pointer-events-none', balance.gradient)} />
                <CardContent className="p-4 flex items-center gap-3 flex-1 relative">
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

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-emerald-600" />
              Exportar Relatório
            </DialogTitle>
            <DialogDescription className="sr-only">Dialog to export financial transactions as CSV</DialogDescription>
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

      {/* Withdrawal History & Invoices Tabs */}
      <Tabs value={financialTab} onValueChange={setFinancialTab}>
        <TabsList>
          <TabsTrigger value="transactions" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('financial.transactions')}</span>
            <span className="sm:hidden">Transações</span>
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <ArrowDownToLine className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('withdrawals.title')}</span>
            <span className="sm:hidden">Saques</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('invoice.title')}</span>
            <span className="sm:hidden">Faturas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          {/* Transaction Type Filter Chips */}
          <div className="flex gap-2 flex-wrap mb-4">
            {filterChips.map((chip) => {
              const Icon = chip.icon
              const isActive = filterType === chip.key
              return (
                <button
                  key={chip.key}
                  onClick={() => setFilterType(chip.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {chip.label}
                </button>
              )
            })}
          </div>

          <Card className="shadow-sm bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground">{t('financial.transactions')}</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-600" onClick={handleExportCSV}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border max-h-96 overflow-y-auto custom-scrollbar">
                {filtered.map((tx, i) => {
                  const isPositive = tx.amount > 0
                  const isPending = tx.status === 'pending'
                  const txIconCfg = typeIconConfig[tx.type]
                  const txStatusCfg = statusConfig[tx.status]
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {/* Color-coded transaction type icon */}
                        {txIconCfg ? (
                          <div className={`p-1.5 rounded-lg ${txIconCfg.bgColor} ${txIconCfg.color}`}>
                            <txIconCfg.icon className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className={`p-1.5 rounded-lg ${isPositive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'}`}>
                            {isPositive ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                          </div>
                        )}
                        {/* Status indicator with background */}
                        {txStatusCfg && (
                          <div className={`p-0.5 rounded-full ${txStatusCfg.bgColor}`}>
                            <txStatusCfg.icon className={`h-3 w-3 ${txStatusCfg.color} ${isPending ? 'animate-pulse' : ''}`} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{tx.description}</span>
                          {/* Color-coded type badge */}
                          {(() => {
                            const badgeCfg = typeBadgeConfig[tx.type]
                            return badgeCfg ? (
                              <Badge className={`text-[10px] shrink-0 hidden sm:inline-flex border ${badgeCfg.bg} ${badgeCfg.text} ${badgeCfg.border}`}>
                                {typeLabels[tx.type] || tx.type}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] shrink-0 hidden sm:inline-flex">
                                {typeLabels[tx.type] || tx.type}
                              </Badge>
                            )
                          })()}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(tx.date)}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1.5 justify-end">
                          <p className={`text-sm font-semibold ${isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {isPositive ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                          </p>
                        </div>
                        {/* Status badge with enhanced colors */}
                        {txStatusCfg ? (
                          <Badge className={`text-[10px] border ${txStatusCfg.bgColor} ${txStatusCfg.color}`}>
                            {txStatusCfg.label}
                          </Badge>
                        ) : (
                          <Badge variant={getStatusVariant(tx.status)} className="text-[10px]">
                            {getStatusLabel(tx.status)}
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="mt-4">
          <Card className="shadow-sm bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
                {t('withdrawals.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {mockWithdrawals.map((wd, i) => {
                  const config = withdrawalStatusConfig[wd.status] || withdrawalStatusConfig.requested
                  const StatusIcon = config.icon
                  const isPending = wd.status === 'requested' || wd.status === 'processing'
                  return (
                    <motion.div
                      key={wd.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[10px] gap-1 ${config.color}`}>
                            <StatusIcon className={`h-3 w-3 ${wd.status === 'processing' ? 'animate-spin' : ''}`} />
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">#{wd.id.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-foreground">{formatCurrency(wd.amount)}</p>
                          {isPending && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-7 gap-1"
                              onClick={() => toast.success(t('withdrawals.cancelled'))}
                            >
                              <Ban className="h-3 w-3" />
                              {t('withdrawals.cancel')}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Status Timeline */}
                      <div className="flex items-center gap-1 mt-3">
                        <div className={`flex items-center gap-1.5 text-[10px] ${wd.requestedAt ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
                          <div className={`w-3 h-3 rounded-full ${wd.requestedAt ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                          {t('withdrawals.requested')}
                        </div>
                        <div className={`flex-1 h-0.5 ${wd.processedAt ? 'bg-emerald-400' : 'bg-muted-foreground/20'}`} />
                        <div className={`flex items-center gap-1.5 text-[10px] ${wd.processedAt ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
                          <div className={`w-3 h-3 rounded-full ${wd.processedAt ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                          {t('withdrawals.processing')}
                        </div>
                        <div className={`flex-1 h-0.5 ${(wd.completedAt || wd.status === 'rejected') ? 'bg-emerald-400' : 'bg-muted-foreground/20'}`} />
                        <div className={`flex items-center gap-1.5 text-[10px] ${wd.completedAt ? 'text-emerald-600 dark:text-emerald-400 font-medium' : wd.status === 'rejected' ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                          <div className={`w-3 h-3 rounded-full ${wd.completedAt ? 'bg-emerald-500' : wd.status === 'rejected' ? 'bg-red-500' : 'bg-muted-foreground/30'}`} />
                          {wd.status === 'rejected' ? t('withdrawals.rejected') : t('withdrawals.completed')}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                        <span>{t('withdrawals.requestedAt')}: {new Date(wd.requestedAt).toLocaleDateString('pt-BR')}</span>
                        {wd.estimatedCompletion && isPending && (
                          <span className="text-amber-600 dark:text-amber-400">
                            {t('withdrawals.estimated')}: {new Date(wd.estimatedCompletion).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        <span>{t('withdrawals.fee')}: {formatCurrency(wd.fee)}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <InvoiceViewer />
        </TabsContent>
      </Tabs>

      {/* Enhanced Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-emerald-600" />
              {t('transfer.title')}
            </DialogTitle>
            <DialogDescription className="sr-only">Dialog to transfer funds between balance types</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Source → Destination flow indicator */}
            <div className="flex items-center justify-center gap-3 py-3">
              <div className="flex-1 rounded-lg border border-border p-3 text-center bg-muted/30">
                <p className="text-[10px] text-muted-foreground mb-1">Origem</p>
                <p className="text-sm font-bold text-foreground">{balanceLabels[transferSource]}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{formatCurrency(balanceValues[transferSource] || 0)}</p>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <motion.div
                  animate={{ x: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                >
                  <ArrowRightLeft className="h-5 w-5 text-emerald-600" />
                </motion.div>
                <span className="text-[9px] text-muted-foreground animate-arrow-flow">transferir</span>
              </div>
              <div className="flex-1 rounded-lg border border-border p-3 text-center bg-muted/30">
                <p className="text-[10px] text-muted-foreground mb-1">Destino</p>
                <p className="text-sm font-bold text-foreground">{balanceLabels[transferDestination]}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{formatCurrency(balanceValues[transferDestination] || 0)}</p>
              </div>
            </div>

            {/* Source select */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <ArrowUpFromLine className="h-3 w-3" />
                De (origem)
              </Label>
              <Select value={transferSource} onValueChange={setTransferSource}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(balanceLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label} ({formatCurrency(balanceValues[key] || 0)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Destination select */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <ArrowDownToLine className="h-3 w-3" />
                Para (destino)
              </Label>
              <Select value={transferDestination} onValueChange={setTransferDestination}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(balanceLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-xs">{t('financial.withdrawAmount')}</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </div>

            {/* Fee calculation with animated counter */}
            {amountNum > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gradient-to-b from-muted/50 to-muted/30 rounded-lg p-3 space-y-2 border border-border overflow-hidden"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Info className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">Resumo da transferência</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="text-foreground font-medium">{formatCurrency(amountNum)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Taxa ({feePercent}%)</span>
                  <span className="text-red-600 dark:text-red-400 font-medium animate-count-pop">-{formatCurrency(feeAmount)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-sm">
                  <span className="text-foreground font-semibold">Destino receberá</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base">{formatCurrency(netAmount)}</span>
                </div>
              </motion.div>
            )}

            {/* Balance preview after transfer */}
            {amountNum > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 space-y-2 border border-emerald-100 dark:border-emerald-900/50 overflow-hidden"
              >
                <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Saldos após transferência</p>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400">{balanceLabels[transferSource]}</span>
                  <span className="font-medium text-foreground">{formatCurrency(Math.max(0, (balanceValues[transferSource] || 0) - amountNum))}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400">{balanceLabels[transferDestination]}</span>
                  <span className="font-medium text-foreground">{formatCurrency((balanceValues[transferDestination] || 0) + netAmount)}</span>
                </div>
              </motion.div>
            )}

            {transferSource === transferDestination && (
              <p className="text-xs text-red-500 font-medium text-center">Selecione origem e destino diferentes</p>
            )}

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleTransfer}
              disabled={transferSource === transferDestination || amountNum <= 0 || amountNum > (balanceValues[transferSource] || 0)}
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Confirmar Transferência
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
