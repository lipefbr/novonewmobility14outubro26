'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useStore } from '@/lib/store'
import { formatCurrency, formatDate, getStatusLabel, getStatusVariant } from '@/lib/utils'
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
} from 'lucide-react'
import { motion } from 'framer-motion'

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

export function FinancialPage() {
  const { user } = useStore()
  const [filterType, setFilterType] = useState<string>('all')
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const filtered = mockTransactions.filter((t) => {
    if (filterType === 'all') return true
    return t.type === filterType
  })

  const balances = [
    { label: 'Saldo para Saque', value: user?.balanceWithdrawal || 0, icon: Wallet, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Saldo App Mobilidade', value: user?.balanceMobility || 0, icon: Car, color: 'bg-blue-100 text-blue-600' },
    { label: 'Saldo App Compras', value: user?.balanceShopping || 0, icon: ShoppingBag, color: 'bg-purple-100 text-purple-600' },
    { label: 'Saldo App Refeição', value: user?.balanceFood || 0, icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-600' },
    { label: 'Saldo App Farmácia', value: user?.balancePharmacy || 0, icon: Pill, color: 'bg-rose-100 text-rose-600' },
    { label: 'Gratificações', value: user?.balanceGratification || 0, icon: Gift, color: 'bg-amber-100 text-amber-600' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Financeiro</h2>
          <p className="text-sm text-gray-500">Gerencie seus saldos e saques</p>
        </div>
        <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              Solicitar Saque
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Saque</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <p className="text-sm text-emerald-700">Saldo disponível para saque</p>
                <p className="text-2xl font-bold text-emerald-800">
                  {formatCurrency(user?.balanceWithdrawal || 0)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Valor do Saque</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
                <p className="text-xs text-gray-500">Mínimo: R$ 50,00</p>
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setWithdrawOpen(false)}
              >
                Confirmar Solicitação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {balances.map((balance, i) => (
          <motion.div
            key={balance.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-3 rounded-lg ${balance.color}`}>
                  <balance.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{balance.label}</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(balance.value)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Transactions */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">Histórico de Transações</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cashback_entry">CB Entrada</SelectItem>
                  <SelectItem value="cashback_residual">CB Residual</SelectItem>
                  <SelectItem value="cashback_sales">CB Vendas</SelectItem>
                  <SelectItem value="withdrawal">Saques</SelectItem>
                  <SelectItem value="gratification">Gratificações</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y max-h-96 overflow-y-auto custom-scrollbar">
            {filtered.map((tx, i) => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className={`p-2 rounded-lg ${
                  tx.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}>
                  {tx.amount > 0 ? (
                    <ArrowUpFromLine className="h-4 w-4" />
                  ) : (
                    <ArrowDownToLine className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{tx.description}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {typeLabels[tx.type] || tx.type}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(tx.date)}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${tx.amount > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                  </p>
                  <Badge variant={getStatusVariant(tx.status)} className="text-[10px]">
                    {getStatusLabel(tx.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            Dados Bancários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Banco</Label>
              <p className="text-sm font-medium text-gray-900 mt-0.5">Banco do Brasil</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Tipo de Conta</Label>
              <p className="text-sm font-medium text-gray-900 mt-0.5">Conta Corrente</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Agência</Label>
              <p className="text-sm font-medium text-gray-900 mt-0.5">1234-5</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Conta</Label>
              <p className="text-sm font-medium text-gray-900 mt-0.5">67890-1</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
