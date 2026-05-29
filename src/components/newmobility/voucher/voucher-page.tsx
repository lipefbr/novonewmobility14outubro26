'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Ticket, Check, Clock, Car, ShoppingBag, Gift, Copy, Check as CheckIcon,
  Pill, UtensilsCrossed, ShoppingCart, Plus, QrCode, Filter, Timer, Sparkles,
  Share2, ChevronDown, ChevronUp, Star, Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { EmptyState } from '../ui/empty-states'

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

const categoryConfig: Record<VoucherCategory, { label: string; icon: React.ElementType; color: string; bgGradient: string; darkBg: string }> = {
  mobility: { label: 'Mobilidade', icon: Car, color: 'text-blue-600 dark:text-blue-400', bgGradient: 'from-blue-500 to-blue-600', darkBg: 'dark:from-blue-800 dark:to-blue-900' },
  pharmacy: { label: 'Farmácia', icon: Pill, color: 'text-rose-600 dark:text-rose-400', bgGradient: 'from-rose-500 to-rose-600', darkBg: 'dark:from-rose-800 dark:to-rose-900' },
  food: { label: 'Refeição', icon: UtensilsCrossed, color: 'text-amber-600 dark:text-amber-400', bgGradient: 'from-amber-500 to-amber-600', darkBg: 'dark:from-amber-800 dark:to-amber-900' },
  shopping: { label: 'Shopping', icon: ShoppingCart, color: 'text-emerald-600 dark:text-emerald-400', bgGradient: 'from-emerald-500 to-emerald-600', darkBg: 'dark:from-emerald-800 dark:to-emerald-900' },
}

// Countdown timer component
function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const expiry = new Date(expiresAt)
      const diff = expiry.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('Expirado')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${mins}m`)
      } else {
        setTimeLeft(`${mins}m`)
      }
    }

    update()
    const timer = setInterval(update, 60000)
    return () => clearInterval(timer)
  }, [expiresAt])

  const isUrgent = timeLeft && !timeLeft.includes('d') && timeLeft !== 'Expirado'

  return (
    <div className={`flex items-center gap-1 text-xs font-medium ${isUrgent ? 'text-red-600 dark:text-red-400 animate-countdown-pulse' : 'text-muted-foreground'}`}>
      <Timer className="h-3 w-3" />
      <span>{timeLeft}</span>
    </div>
  )
}

export function VoucherPage() {
  const { toast } = useToast()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<VoucherStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<VoucherCategory | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = mockVouchers.filter((v) => {
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter
    return matchesStatus && matchesCategory
  })

  const activeVouchers = mockVouchers.filter((v) => v.status === 'active')
  const usedVouchers = mockVouchers.filter((v) => v.status === 'used')
  const expiredVouchers = mockVouchers.filter((v) => v.status === 'expired')
  const totalActiveValue = activeVouchers.reduce((acc, v) => acc + v.amount, 0)

  // Featured voucher (highest value active)
  const featuredVoucher = activeVouchers.length > 0
    ? activeVouchers.reduce((prev, curr) => curr.amount > prev.amount ? curr : prev)
    : null

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

  const handleShareVoucher = (code: string, amount: number) => {
    const text = `🎁 Voucher NewMobility: ${formatCurrency(amount)} - Código: ${code}`
    if (navigator.share) {
      navigator.share({ title: 'Voucher NewMobility', text })
    } else {
      navigator.clipboard.writeText(text)
      toast({ title: 'Copiado!', description: 'Link do voucher copiado' })
    }
  }

  const renderQRPattern = (id: string, color: string, branded = false) => {
    const seed = parseInt(id) || 1
    const cells = Array.from({ length: 16 }, (_, i) => {
      const filled = ((seed * (i + 1) * 7) % 11) > 3
      return filled
    })
    return (
      <div className="relative">
        {/* Branded frame */}
        {branded && (
          <div className="absolute -inset-2 rounded-xl border-2 border-emerald-400 dark:border-emerald-600 shadow-lg shadow-emerald-500/20" />
        )}
        <div className={`grid grid-cols-4 gap-0.5 ${branded ? 'w-20 h-20 p-1.5' : 'w-14 h-14 p-1'} bg-white dark:bg-gray-800 rounded-md relative`}>
          {cells.map((filled, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.02, duration: 0.15 }}
              className={`rounded-[1px] ${filled ? 'bg-gray-900 dark:bg-gray-100' : 'bg-gray-200 dark:bg-gray-600'}`}
            />
          ))}
          {/* QR scanning animation */}
          <motion.div
            className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
            animate={{ top: ['4px', branded ? '68px' : '52px', '4px'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        {branded && (
          <div className="text-center mt-1.5">
            <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">NEWMOBILITY</span>
          </div>
        )}
      </div>
    )
  }

  // Usage instructions
  const usageInstructions = [
    'Abra o app NewMobility no seu celular',
    'Vá até a seção "Vouchers" no menu',
    'Toque em "Adicionar Voucher"',
    'Digite ou cole o código do voucher',
    'Confirme e o valor será creditado na categoria correspondente',
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Voucher</h2>
          <p className="text-sm text-muted-foreground">Gerencie seus vouchers e cupons de desconto</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleBuyVoucher}>
          <Plus className="h-4 w-4" />
          Comprar Voucher
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Ticket, label: 'TOTAL', value: mockVouchers.length, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
          { icon: Check, label: 'ATIVOS', value: activeVouchers.length, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', sub: formatCurrency(totalActiveValue) },
          { icon: Clock, label: 'USADOS', value: usedVouchers.length, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
          { icon: Filter, label: 'EXPIRADOS', value: expiredVouchers.length, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="shadow-sm bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1.5 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                {stat.sub && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{stat.sub}</p>}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Featured Voucher Hero Card */}
      {featuredVoucher && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-lg border-2 border-emerald-300 dark:border-emerald-700 overflow-hidden relative gradient-border">
            <div className="absolute top-0 left-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-br-lg z-10 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              DESTAQUE
            </div>
            <div className="h-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 animate-gradient-shift" />
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                {renderQRPattern(featuredVoucher.id, featuredVoucher.category, true)}
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium">Maior Voucher Ativo</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{formatCurrency(featuredVoucher.amount)}</p>
                  <p className="text-sm font-mono text-muted-foreground mt-1">{featuredVoucher.code}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="text-[10px] gap-1">
                      {(() => { const c = categoryConfig[featuredVoucher.category]; const I = c.icon; return <><I className="h-3 w-3" />{c.label}</> })()}
                    </Badge>
                    <CountdownTimer expiresAt={featuredVoucher.expiresAt} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-xs gap-1.5 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  onClick={() => handleCopy(featuredVoucher.code, featuredVoucher.id)}
                >
                  {copiedId === featuredVoucher.id ? <CheckIcon className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedId === featuredVoucher.id ? 'Copiado!' : 'Copiar Código'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-xs gap-1.5 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  onClick={() => handleShareVoucher(featuredVoucher.code, featuredVoucher.amount)}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Compartilhar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* How to Use - Expandable Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="shadow-sm bg-card">
          <CardContent className="p-4">
            <button
              onClick={() => setExpandedId(expandedId === 'instructions' ? null : 'instructions')}
              className="w-full flex items-center justify-between text-sm font-semibold text-foreground hover:text-emerald-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-emerald-600" />
                Como Usar Seus Vouchers
              </div>
              {expandedId === 'instructions' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <AnimatePresence>
              {expandedId === 'instructions' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2">
                    {usageInstructions.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-sm text-foreground">{step}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            categoryFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Todas Categorias
        </button>
        {(Object.entries(categoryConfig) as [VoucherCategory, typeof categoryConfig[VoucherCategory]][]).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setCategoryFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              categoryFilter === key ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
                statusFilter === status ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
                <Card className={`shadow-sm overflow-hidden relative holographic ${
                  !isActive ? 'opacity-60' : 'hover:shadow-lg transition-shadow'
                } ${isExpired ? 'border-red-200 dark:border-red-800' : 'border-border'}`}>
                  <div className={`h-2 bg-gradient-to-r ${config.bgGradient} relative`}>
                    {isActive && <div className="absolute inset-0 animate-shimmer" />}
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 ${config.color}`}>
                        {renderQRPattern(voucher.id, config.bgGradient)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                          {voucher.status === 'active' && (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">Ativo</Badge>
                          )}
                          {voucher.status === 'used' && (
                            <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-[10px]">Usado</Badge>
                          )}
                          {voucher.status === 'expired' && (
                            <Badge variant="destructive" className="text-[10px]">Expirado</Badge>
                          )}
                        </div>

                        <p className="text-lg font-bold text-foreground">{formatCurrency(voucher.amount)}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">{voucher.code}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[10px] text-muted-foreground">
                            {voucher.status === 'used'
                              ? `Usado em ${voucher.usedAt ? formatDate(voucher.usedAt) : '-'}`
                              : voucher.status === 'expired'
                              ? `Expirou em ${formatDate(voucher.expiresAt)}`
                              : `Expira em ${formatDate(voucher.expiresAt)}`}
                          </p>
                          {isActive && <CountdownTimer expiresAt={voucher.expiresAt} />}
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs gap-1 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          onClick={() => handleCopy(voucher.code, voucher.id)}
                        >
                          {copiedId === voucher.id ? <CheckIcon className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          {copiedId === voucher.id ? 'Copiado!' : 'Copiar Código'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs gap-1 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          onClick={() => handleShareVoucher(voucher.code, voucher.amount)}
                        >
                          <Share2 className="h-3 w-3" />
                          Compartilhar
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
        <EmptyState
          icon={Ticket}
          title="Nenhum voucher ativo"
          description="Adquira vouchers para aproveitar descontos em mobilidade, farmácia, refeição e compras!"
          actionLabel="Comprar Voucher"
          onAction={handleBuyVoucher}
        />
      )}
    </div>
  )
}
