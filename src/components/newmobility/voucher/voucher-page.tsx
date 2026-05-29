'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Ticket, Check, Clock, Car, ShoppingBag, Gift, Copy, Check as CheckIcon } from 'lucide-react'
import { motion } from 'framer-motion'

const mockVouchers = [
  { id: '1', code: 'NM-MOB-2025-001', amount: 5000, type: 'mobility', expiresAt: '2025-03-15', isUsed: false, usedAt: null },
  { id: '2', code: 'NM-PAY-2025-002', amount: 10000, type: 'payment', expiresAt: '2025-02-28', isUsed: false, usedAt: null },
  { id: '3', code: 'NM-BON-2025-003', amount: 25000, type: 'bonus', expiresAt: '2025-06-30', isUsed: false, usedAt: null },
  { id: '4', code: 'NM-MOB-2025-004', amount: 3000, type: 'mobility', expiresAt: '2025-04-30', isUsed: false, usedAt: null },
  { id: '5', code: 'NM-PAY-2025-005', amount: 15000, type: 'payment', expiresAt: '2025-01-20', isUsed: true, usedAt: '2025-01-18' },
  { id: '6', code: 'NM-BON-2025-006', amount: 5000, type: 'bonus', expiresAt: '2025-01-10', isUsed: true, usedAt: '2025-01-08' },
  { id: '7', code: 'NM-MOB-2025-007', amount: 8000, type: 'mobility', expiresAt: '2024-12-31', isUsed: true, usedAt: '2024-12-28' },
]

const typeLabels: Record<string, string> = {
  mobility: 'Mobilidade',
  payment: 'Pagamento',
  bonus: 'Bônus',
}

const typeIcons: Record<string, React.ElementType> = {
  mobility: Car,
  payment: ShoppingBag,
  bonus: Gift,
}

const typeColors: Record<string, string> = {
  mobility: 'bg-blue-100 text-blue-600',
  payment: 'bg-purple-100 text-purple-600',
  bonus: 'bg-amber-100 text-amber-600',
}

export function VoucherPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const activeVouchers = mockVouchers.filter((v) => !v.isUsed)
  const usedVouchers = mockVouchers.filter((v) => v.isUsed)

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const renderVoucherCard = (voucher: typeof mockVouchers[0], i: number) => {
    const Icon = typeIcons[voucher.type]
    const isExpired = !voucher.isUsed && new Date(voucher.expiresAt) < new Date()

    return (
      <motion.div
        key={voucher.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
      >
        <Card className={`shadow-sm ${voucher.isUsed ? 'opacity-60' : ''} ${isExpired ? 'border-red-200' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${typeColors[voucher.type]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {typeLabels[voucher.type]}
                    </Badge>
                    {voucher.isUsed ? (
                      <Badge className="bg-gray-100 text-gray-600 text-[10px]">Usado</Badge>
                    ) : isExpired ? (
                      <Badge variant="destructive" className="text-[10px]">Expirado</Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Ativo</Badge>
                    )}
                  </div>
                  <p className="text-sm font-mono font-bold text-gray-900 mt-1">{voucher.code}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {voucher.isUsed
                      ? `Usado em ${voucher.usedAt ? formatDate(voucher.usedAt) : '-'}`
                      : `Expira em ${formatDate(voucher.expiresAt)}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-700">{formatCurrency(voucher.amount)}</p>
                {!voucher.isUsed && !isExpired && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 h-7 text-xs"
                    onClick={() => handleCopy(voucher.code, voucher.id)}
                  >
                    {copiedId === voucher.id ? (
                      <CheckIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    {copiedId === voucher.id ? 'Copiado!' : 'Copiar'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Voucher</h2>
        <p className="text-sm text-gray-500">Gerencie seus vouchers e cupons de desconto</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">ATIVOS</p>
              <p className="text-xl font-bold text-gray-900">{activeVouchers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">TOTAL DISPONÍVEL</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(activeVouchers.reduce((acc, v) => acc + v.amount, 0))}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gray-100 text-gray-600">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">UTILIZADOS</p>
              <p className="text-xl font-bold text-gray-900">{usedVouchers.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Voucher Tabs */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active" className="gap-1.5">
            <Ticket className="h-3.5 w-3.5" />
            Ativos ({activeVouchers.length})
          </TabsTrigger>
          <TabsTrigger value="used" className="gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Usados ({usedVouchers.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4 space-y-3">
          {activeVouchers.map((v, i) => renderVoucherCard(v, i))}
          {activeVouchers.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum voucher ativo</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="used" className="mt-4 space-y-3">
          {usedVouchers.map((v, i) => renderVoucherCard(v, i))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
