'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Ticket, Check, Clock, Car, ShoppingBag, Gift, Copy, Check as CheckIcon,
  Pill, UtensilsCrossed, ShoppingCart, Plus, QrCode, Filter
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

type VoucherStatus = 'active' | 'used' | 'expired'
type VoucherCategory = 'mobility' | 'pharmacy' | 'food' | 'shopping'

const mockVouchers = [
  { id: '1', code: 'NM-MOB-2025-001', amount: 5000, category: 'mobility' as VoucherCategory, expiresAt: '2025-03-15', status: 'active' as VoucherStatus, usedAt: null },
  { id: '2', code: 'NM-FAR-2025-002', amount: 10000, category: 'pharmacy' as VoucherCategory, expiresAt: '2025-02-28', status: 'active' as VoucherStatus, usedAt: null },
  { id: '3', code: 'NM-REF-2025-003', amount: 25000, category: 'food' as VoucherCategory, expiresAt: '2025-06-30', status: 'active' as VoucherStatus, usedAt: null },
  { id: '4', code: 'NM-SHO-2025-004', amount: 3000, category: 'shopping' as VoucherCategory, expiresAt: '2025-04-30', status: 'active' as VoucherStatus, usedAt: null },
  { id: '5', code: 'NM-MOB-2025-005', amount: 15000, category: 'mobility' as VoucherCategory, expiresAt: '2025-01-20', status: 'used' as VoucherStatus, usedAt: '2025-01-18' },
  { id: '6', code: 'NM-FAR-2025-006', amount: 5000, category: 'pharmacy' as VoucherCategory, expiresAt: '2025-01-10', status: 'used' as VoucherStatus, usedAt: '2025-01-08' },
  { id: '7', code: 'NM-REF-2025-007', amount: 8000, category: 'food' as VoucherCategory, expiresAt: '2024-12-31', status: 'expired' as VoucherStatus, usedAt: null },
  { id: '8', code: 'NM-SHO-2025-008', amount: 2000, category: 'shopping' as VoucherCategory, expiresAt: '2024-11-30', status: 'expired' as VoucherStatus, usedAt: null },
  { id: '9', code: 'NM-MOB-2025-009', amount: 12000, category: 'mobility' as VoucherCategory, expiresAt: '2025-05-15', status: 'active' as VoucherStatus, usedAt: null },
]

const categoryConfig: Record<VoucherCategory, { label: string; icon: React.ElementType; color: string; bgGradient: string }> = {
  mobility: { label: 'Mobilidade', icon: Car, color: 'text-blue-600', bgGradient: 'from-blue-500 to-blue-600' },
  pharmacy: { label: 'Farmácia', icon: Pill, color: 'text-rose-600', bgGradient: 'from-rose-500 to-rose-600' },
  food: { label: 'Refeição', icon: UtensilsCrossed, color: 'text-amber-600', bgGradient: 'from-amber-500 to-amber-600' },
  shopping: { label: 'Shopping', icon: ShoppingCart, color: 'text-emerald-600', bgGradient: 'from-emerald-500 to-emerald-600' },
}

export function VoucherPage() {
  const { toast } = useToast()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<VoucherStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<VoucherCategory | 'all'>('all')

  const filtered = mockVouchers.filter((v) => {
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter
    return matchesStatus && matchesCategory
  })

  const activeVouchers = mockVouchers.filter((v) => v.status === 'active')
  const usedVouchers = mockVouchers.filter((v) => v.status === 'used')
  const expiredVouchers = mockVouchers.filter((v) => v.status === 'expired')
  const totalActiveValue = activeVouchers.reduce((acc, v) => acc + v.amount, 0)

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const handleBuyVoucher = () => {
    toast({
      title: 'Em breve',
      description: 'A compra de vouchers será disponibilizada em breve!',
    })
  }

  const renderQRPattern = (id: string) => {
    // Generate a deterministic pattern based on the id
    const seed = parseInt(id) || 1
    const cells = Array.from({ length: 9 }, (_, i) => {
      const filled = ((seed * (i + 1) * 7) % 11) > 4
      return filled
    })
    return (
      <div className="grid grid-cols-3 gap-0.5 w-12 h-12">
        {cells.map((filled, i) => (
          <div
            key={i}
            className={`rounded-[1px] ${filled ? 'bg-current opacity-30' : 'bg-current opacity-10'}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Voucher</h2>
          <p className="text-sm text-gray-500">Gerencie seus vouchers e cupons de desconto</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleBuyVoucher}>
          <Plus className="h-4 w-4" />
          Comprar Voucher
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Ticket, label: 'TOTAL', value: mockVouchers.length, color: 'bg-gray-100 text-gray-600' },
          { icon: Check, label: 'ATIVOS', value: activeVouchers.length, color: 'bg-emerald-100 text-emerald-600', sub: formatCurrency(totalActiveValue) },
          { icon: Clock, label: 'USADOS', value: usedVouchers.length, color: 'bg-blue-100 text-blue-600' },
          { icon: Filter, label: 'EXPIRADOS', value: expiredVouchers.length, color: 'bg-red-100 text-red-600' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1.5 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.sub && <p className="text-xs text-emerald-600 font-medium">{stat.sub}</p>}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            categoryFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todas Categorias
        </button>
        {(Object.entries(categoryConfig) as [VoucherCategory, typeof categoryConfig[VoucherCategory]][]).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setCategoryFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              categoryFilter === key ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <config.icon className="h-3 w-3" />
            {config.label}
          </button>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {(['all', 'active', 'used', 'expired'] as const).map((status) => {
          const labels: Record<string, string> = { all: 'Todos', active: 'Ativos', used: 'Usados', expired: 'Expirados' }
          const counts: Record<string, number> = {
            all: mockVouchers.length,
            active: activeVouchers.length,
            used: usedVouchers.length,
            expired: expiredVouchers.length,
          }
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === status ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {labels[status]} ({counts[status]})
            </button>
          )
        })}
      </div>

      {/* Voucher Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((voucher, i) => {
            const config = categoryConfig[voucher.category]
            const Icon = config.icon
            const isActive = voucher.status === 'active'
            const isExpired = voucher.status === 'expired'

            return (
              <motion.div
                key={voucher.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={`shadow-sm overflow-hidden relative ${
                  !isActive ? 'opacity-60' : ''
                } ${isExpired ? 'border-red-200' : 'border-gray-200'}`}>
                  {/* Top color bar */}
                  <div className={`h-2 bg-gradient-to-r ${config.bgGradient}`} />

                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* QR-style pattern */}
                      <div className={`${config.color} shrink-0`}>
                        {renderQRPattern(voucher.id)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                          {voucher.status === 'active' && (
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Ativo</Badge>
                          )}
                          {voucher.status === 'used' && (
                            <Badge className="bg-gray-100 text-gray-600 text-[10px]">Usado</Badge>
                          )}
                          {voucher.status === 'expired' && (
                            <Badge variant="destructive" className="text-[10px]">Expirado</Badge>
                          )}
                        </div>

                        <p className="text-lg font-bold text-gray-900">{formatCurrency(voucher.amount)}</p>
                        <p className="text-xs font-mono text-gray-500 mt-0.5">{voucher.code}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {voucher.status === 'used'
                            ? `Usado em ${voucher.usedAt ? formatDate(voucher.usedAt) : '-'}`
                            : voucher.status === 'expired'
                            ? `Expirou em ${formatDate(voucher.expiresAt)}`
                            : `Expira em ${formatDate(voucher.expiresAt)}`}
                        </p>
                      </div>
                    </div>

                    {isActive && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs gap-1"
                          onClick={() => handleCopy(voucher.code, voucher.id)}
                        >
                          {copiedId === voucher.id ? (
                            <CheckIcon className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {copiedId === voucher.id ? 'Copiado!' : 'Copiar Código'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs gap-1"
                        >
                          <QrCode className="h-3 w-3" />
                          Ver QR Code
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum voucher encontrado</p>
        </div>
      )}
    </div>
  )
}
