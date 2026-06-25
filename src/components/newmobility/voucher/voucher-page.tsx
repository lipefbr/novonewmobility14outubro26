'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Ticket, Check, Clock, Car, ShoppingBag, Gift, Copy, Check as CheckIcon,
  Pill, UtensilsCrossed, ShoppingCart, Plus, QrCode, Filter, Timer, Sparkles,
  Share2, ChevronDown, ChevronUp, Star, Info, TrendingUp, Zap, Store, CreditCard, Wallet,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { useStore } from '@/lib/store'
import { vouchersApi } from '@/lib/api'
import { EmptyState } from '../ui/empty-states'

type VoucherStatus = 'active' | 'used' | 'expired'
type VoucherCategory = 'mobility' | 'pharmacy' | 'food' | 'shopping'

interface Voucher {
  id: string
  code: string
  amount: number
  category: VoucherCategory
  type?: string
  expiresAt: string
  status: VoucherStatus
  usedAt: string | null
  usedAmount: number
}

// Map a voucher `type` from the API to a UI category for display.
function typeToCategory(type: string | undefined): VoucherCategory {
  switch (type) {
    case 'mobility': return 'mobility'
    case 'food': return 'food'
    case 'pharmacy': return 'pharmacy'
    case 'shopping': return 'shopping'
    default: return 'shopping'
  }
}

// Derive a UI status string from raw voucher fields
function deriveStatus(v: { isUsed: boolean; expiresAt: string | null }): VoucherStatus {
  if (v.isUsed) return 'used'
  if (v.expiresAt) {
    const expiry = new Date(v.expiresAt).getTime()
    if (!isNaN(expiry) && expiry < Date.now()) return 'expired'
  }
  return 'active'
}

const mockVouchers: Voucher[] = []

const categoryConfig: Record<VoucherCategory, { label: string; icon: React.ElementType; color: string; bgGradient: string; darkBg: string }> = {
  mobility: { label: 'Mobilidade', icon: Car, color: 'text-blue-600 dark:text-blue-400', bgGradient: 'from-blue-500 to-blue-600', darkBg: 'dark:from-blue-800 dark:to-blue-900' },
  pharmacy: { label: 'Farmácia', icon: Pill, color: 'text-rose-600 dark:text-rose-400', bgGradient: 'from-rose-500 to-rose-600', darkBg: 'dark:from-rose-800 dark:to-rose-900' },
  food: { label: 'Refeição', icon: UtensilsCrossed, color: 'text-amber-600 dark:text-amber-400', bgGradient: 'from-amber-500 to-amber-600', darkBg: 'dark:from-amber-800 dark:to-amber-900' },
  shopping: { label: 'Shopping', icon: ShoppingCart, color: 'text-emerald-600 dark:text-emerald-400', bgGradient: 'from-emerald-500 to-emerald-600', darkBg: 'dark:from-emerald-800 dark:to-emerald-900' },
}

// Voucher amounts available for purchase (in cents)
const voucherAmounts = [
  { label: 'R$ 25,00', value: 2500 },
  { label: 'R$ 50,00', value: 5000 },
  { label: 'R$ 100,00', value: 10000 },
  { label: 'R$ 200,00', value: 20000 },
  { label: 'R$ 500,00', value: 50000 },
]

// Popular categories with usage count
const popularCategories = [
  { category: 'Mobilidade' as const, icon: Car, usage: 3420, color: 'bg-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-700 dark:text-blue-400', growth: '+18%' },
  { category: 'Refeição' as const, icon: UtensilsCrossed, usage: 2890, color: 'bg-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-700 dark:text-amber-400', growth: '+12%' },
  { category: 'Farmácia' as const, icon: Pill, usage: 2150, color: 'bg-rose-500', lightBg: 'bg-rose-50 dark:bg-rose-950/30', textColor: 'text-rose-700 dark:text-rose-400', growth: '+9%' },
  { category: 'Shopping' as const, icon: ShoppingCart, usage: 1680, color: 'bg-emerald-500', lightBg: 'bg-emerald-50 dark:bg-emerald-950/30', textColor: 'text-emerald-700 dark:text-emerald-400', growth: '+15%' },
]

// Countdown timer component with urgency color transitions
function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [daysLeft, setDaysLeft] = useState(999)

  useEffect(() => {
    const update = () => {
      if (!expiresAt) {
        setTimeLeft('Sem validade')
        setDaysLeft(999)
        return
      }
      const now = new Date()
      const expiry = new Date(expiresAt)
      const diff = expiry.getTime() - now.getTime()

      if (isNaN(diff)) {
        setTimeLeft('Sem validade')
        setDaysLeft(999)
        return
      }

      if (diff <= 0) {
        setTimeLeft('Expirado')
        setDaysLeft(0)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setDaysLeft(days)

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

  // Urgency color logic: green >30, yellow 7-30, red <7
  const urgencyClass = useMemo(() => {
    if (timeLeft === 'Expirado') return 'text-gray-400'
    if (timeLeft === 'Sem validade' || daysLeft === 999) return 'text-emerald-600 dark:text-emerald-400'
    if (daysLeft > 30) return 'text-emerald-600 dark:text-emerald-400'
    if (daysLeft >= 7) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400 animate-countdown-pulse'
  }, [daysLeft, timeLeft])

  const timerIconClass = useMemo(() => {
    if (timeLeft === 'Expirado') return 'text-gray-400'
    if (timeLeft === 'Sem validade' || daysLeft === 999) return 'text-emerald-600 dark:text-emerald-400'
    if (daysLeft > 30) return 'text-emerald-600 dark:text-emerald-400'
    if (daysLeft >= 7) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }, [daysLeft, timeLeft])

  return (
    <div className={`flex items-center gap-1 text-xs font-medium ${urgencyClass}`}>
      <Timer className={`h-3 w-3 ${timerIconClass}`} />
      <span>{timeLeft}</span>
      {daysLeft < 7 && daysLeft > 0 && (
        <span className="text-[9px] opacity-70 ml-0.5">urgente</span>
      )}
    </div>
  )
}

export function VoucherPage() {
  const { toast } = useToast()
  const { setActivePage, user, updateUser } = useStore()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<VoucherStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<VoucherCategory | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers)
  const [loading, setLoading] = useState(true)

  // Purchase dialog state
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<VoucherCategory | null>(null)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [purchaseStep, setPurchaseStep] = useState<'category' | 'amount' | 'confirm'>('category')
  const [isPurchasing, setIsPurchasing] = useState(false)

  // Redeem (Adicionar Voucher) dialog state
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false)
  const [redeemCode, setRedeemCode] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(false)

  const fetchVouchers = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    try {
      const data = await vouchersApi.getList(user.id)
      const rawActive = (data?.active as any[]) || []
      const rawUsed = (data?.used as any[]) || []
      const rawExpired = (data?.expired as any[]) || []
      const mapRow = (r: any, status: VoucherStatus): Voucher => ({
        id: r.id,
        code: r.code,
        amount: typeof r.amount === 'number' ? r.amount : 0,
        type: r.type,
        category: typeToCategory(r.type),
        expiresAt: r.expiresAt || '',
        status,
        usedAt: r.usedAt || null,
        usedAmount: 0,
      })
      // The API now classifies vouchers into active/used/expired. If the API
      // response omits `expired` (older versions), we derive the status from
      // each voucher's `expiresAt` field as a safety net.
      const active: Voucher[] = []
      const expired: Voucher[] = []
      for (const r of rawActive) {
        const derived = deriveStatus({ isUsed: false, expiresAt: r.expiresAt })
        if (derived === 'expired') {
          expired.push(mapRow(r, 'expired'))
        } else {
          active.push(mapRow(r, 'active'))
        }
      }
      // Append any explicitly-returned expired vouchers from the API
      for (const r of rawExpired) {
        expired.push(mapRow(r, 'expired'))
      }
      const used = rawUsed.map((r) => mapRow(r, 'used'))
      setVouchers([...active, ...used, ...expired])
    } catch (err) {
      console.error('Failed to fetch vouchers:', err)
      // Show empty state on error instead of mock data
      setVouchers([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchVouchers()
  }, [fetchVouchers])

  const filtered = vouchers.filter((v) => {
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter
    return matchesStatus && matchesCategory
  })

  const activeVouchers = vouchers.filter((v) => v.status === 'active')
  const usedVouchers = vouchers.filter((v) => v.status === 'used')
  const expiredVouchers = vouchers.filter((v) => v.status === 'expired')
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
    setSelectedCategory(null)
    setSelectedAmount(null)
    setPurchaseStep('category')
    setPurchaseDialogOpen(true)
  }

  const handleOpenRedeem = () => {
    setRedeemCode('')
    setRedeemDialogOpen(true)
  }

  const handleRedeem = async () => {
    if (!user?.id) return
    const code = redeemCode.trim()
    if (!code) {
      toast({ title: 'Informe o código', description: 'Digite ou cole o código do voucher.' })
      return
    }
    setIsRedeeming(true)
    try {
      const result = await vouchersApi.redeem(user.id, code)
      toast({
        title: 'Voucher resgatado! 🎉',
        description: `${formatCurrency(result?.creditedAmount || 0)} creditado em ${result?.balanceName || 'sua conta'}.`,
      })
      setRedeemDialogOpen(false)
      setRedeemCode('')
      // Refresh voucher list
      fetchVouchers()
      // Update user balances in the global store so other pages reflect the change
      if (result?.user) {
        updateUser({
          balanceWithdrawal: result.user.balanceWithdrawal,
          balanceMobility: result.user.balanceMobility,
          balanceShopping: result.user.balanceShopping,
          balanceFood: result.user.balanceFood,
          balancePharmacy: result.user.balancePharmacy,
          balanceGratification: result.user.balanceGratification,
        })
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao resgatar voucher',
        description: err?.message || 'Não foi possível resgatar o voucher. Verifique o código e tente novamente.',
      })
    } finally {
      setIsRedeeming(false)
    }
  }

  const handleBrowseMarketplace = () => {
    setPurchaseDialogOpen(false)
    setActivePage('marketplace')
    toast({
      title: 'Marketplace',
      description: 'Navegue pelo Marketplace para comprar vouchers e produtos!',
    })
  }

  const handleConfirmPurchase = async () => {
    if (!selectedCategory || !selectedAmount) return

    setIsPurchasing(true)

    // Simulate purchase delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Generate a voucher code
    const categoryPrefixes: Record<VoucherCategory, string> = {
      mobility: 'MOB', pharmacy: 'FAR', food: 'REF', shopping: 'SHO',
    }
    const prefix = categoryPrefixes[selectedCategory]
    const code = `NM-${prefix}-2025-${String(Math.floor(100 + Math.random() * 900))}`
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const newVoucher: Voucher = {
      id: String(Date.now()),
      code,
      amount: selectedAmount,
      category: selectedCategory,
      expiresAt,
      status: 'active',
      usedAt: null,
      usedAmount: 0,
    }

    setVouchers(prev => [newVoucher, ...prev])
    setIsPurchasing(false)
    setPurchaseDialogOpen(false)

    toast({
      title: 'Voucher comprado com sucesso! 🎉',
      description: `Voucher ${categoryConfig[selectedCategory].label} de ${formatCurrency(selectedAmount)} adicionado à sua conta. Código: ${code}`,
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
        <div className={`grid grid-cols-4 gap-0.5 ${branded ? 'w-20 h-20 p-1.5' : 'w-14 h-14 p-1'} bg-white dark:bg-gray-800 rounded-md relative overflow-hidden`}>
          {cells.map((filled, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.02, duration: 0.15 }}
              className={`rounded-[1px] ${filled ? 'bg-gray-900 dark:bg-gray-100' : 'bg-gray-200 dark:bg-gray-600'}`}
            />
          ))}
          {/* QR scanning animation - smoother with glow effect */}
          <motion.div
            className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
            style={{ boxShadow: '0 0 8px 2px rgba(52, 211, 153, 0.4)' }}
            animate={{ top: ['4px', branded ? '68px' : '52px', '4px'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
          />
          {/* Subtle glow overlay */}
          <motion.div
            className="absolute left-1 right-1 h-4 bg-gradient-to-b from-emerald-400/10 to-transparent pointer-events-none"
            animate={{ top: ['0px', branded ? '64px' : '48px', '0px'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-foreground">Voucher</h2>
          <p className="text-sm text-muted-foreground">Gerencie seus vouchers e cupons de desconto</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={handleOpenRedeem}>
            <Ticket className="h-4 w-4" />
            Adicionar Voucher
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleBuyVoucher}>
            <Plus className="h-4 w-4" />
            Comprar Voucher
          </Button>
        </div>
      </div>

      {/* Redeem (Adicionar Voucher) Dialog */}
      <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Ticket className="h-4 w-4 text-emerald-600" />
              </div>
              Adicionar Voucher
            </DialogTitle>
            <DialogDescription>
              Digite ou cole o código do voucher para creditá-lo na sua conta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              autoFocus
              placeholder="Ex.: VOUCHER-ABCD-1234"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isRedeeming && redeemCode.trim()) {
                  handleRedeem()
                }
              }}
              className="font-mono uppercase"
              disabled={isRedeeming}
            />
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>O valor será creditado na categoria correspondente ao tipo do voucher (Mobilidade, Refeição, Farmácia, Compras, Gratificação ou Saque).</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRedeemDialogOpen(false)}
              disabled={isRedeeming}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              onClick={handleRedeem}
              disabled={isRedeeming || !redeemCode.trim()}
            >
              {isRedeeming ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Resgatando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Resgatar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Ticket className="h-4 w-4 text-emerald-600" />
              </div>
              Comprar Voucher
            </DialogTitle>
            <DialogDescription>
              {purchaseStep === 'category' && 'Escolha a categoria do voucher'}
              {purchaseStep === 'amount' && 'Selecione o valor do voucher'}
              {purchaseStep === 'confirm' && 'Confirme sua compra'}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Category Selection */}
          {purchaseStep === 'category' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(categoryConfig) as [VoucherCategory, typeof categoryConfig[VoucherCategory]][]).map(([key, config]) => {
                  const Icon = config.icon
                  const isSelected = selectedCategory === key
                  return (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedCategory(key)
                        setPurchaseStep('amount')
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-md'
                          : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm'
                      }`}
                    >
                      <div className={`p-2 rounded-lg w-fit mb-2 ${
                        key === 'mobility' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        key === 'pharmacy' ? 'bg-rose-100 dark:bg-rose-900/30' :
                        key === 'food' ? 'bg-amber-100 dark:bg-amber-900/30' :
                        'bg-emerald-100 dark:bg-emerald-900/30'
                      }`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <p className="font-semibold text-sm text-foreground">{config.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {key === 'mobility' && 'Corridas e viagens'}
                        {key === 'pharmacy' && 'Medicamentos e saúde'}
                        {key === 'food' && 'Restaurantes parceiros'}
                        {key === 'shopping' && 'Compras e lojas'}
                      </p>
                    </motion.button>
                  )
                })}
              </div>

              <div className="border-t border-border pt-3">
                <button
                  onClick={handleBrowseMarketplace}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors text-sm font-medium"
                >
                  <Store className="h-4 w-4" />
                  Explorar Marketplace
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Amount Selection */}
          {purchaseStep === 'amount' && selectedCategory && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                {(() => {
                  const config = categoryConfig[selectedCategory]
                  const Icon = config.icon
                  return (
                    <>
                      <div className={`p-1.5 rounded-lg ${
                        selectedCategory === 'mobility' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        selectedCategory === 'pharmacy' ? 'bg-rose-100 dark:bg-rose-900/30' :
                        selectedCategory === 'food' ? 'bg-amber-100 dark:bg-amber-900/30' :
                        'bg-emerald-100 dark:bg-emerald-900/30'
                      }`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <span className="text-sm font-medium text-foreground">{config.label}</span>
                    </>
                  )
                })()}
                <button
                  onClick={() => setPurchaseStep('category')}
                  className="ml-auto text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Alterar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {voucherAmounts.map((amt) => {
                  const isSelected = selectedAmount === amt.value
                  return (
                    <motion.button
                      key={amt.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedAmount(amt.value)
                        setPurchaseStep('confirm')
                      }}
                      className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                          : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                      }`}
                    >
                      <p className="text-base font-bold text-foreground">{amt.label}</p>
                    </motion.button>
                  )
                })}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => setPurchaseStep('category')}
              >
                Voltar
              </Button>
            </div>
          )}

          {/* Step 3: Confirm Purchase */}
          {purchaseStep === 'confirm' && selectedCategory && selectedAmount && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                  {(() => {
                    const config = categoryConfig[selectedCategory]
                    const Icon = config.icon
                    return (
                      <div className={`p-2.5 rounded-xl ${
                        selectedCategory === 'mobility' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        selectedCategory === 'pharmacy' ? 'bg-rose-100 dark:bg-rose-900/30' :
                        selectedCategory === 'food' ? 'bg-amber-100 dark:bg-amber-900/30' :
                        'bg-emerald-100 dark:bg-emerald-900/30'
                      }`}>
                        <Icon className={`h-6 w-6 ${config.color}`} />
                      </div>
                    )
                  })()}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Categoria</p>
                    <p className="font-semibold text-foreground">{categoryConfig[selectedCategory].label}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-muted-foreground">Valor</span>
                </div>
                <span className="text-xl font-bold text-foreground">
                  {formatCurrency(selectedAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-muted-foreground">Pagamento</span>
                </div>
                <span className="text-sm font-medium text-foreground">Saldo disponível</span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <Info className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  O voucher será creditado na categoria {categoryConfig[selectedCategory].label} e válido por 90 dias.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPurchaseStep('amount')}
                  disabled={isPurchasing}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={handleConfirmPurchase}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirmar Compra
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Ticket, label: 'TOTAL', value: vouchers.length, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
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

      {/* Vouchers Populares Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Card className="shadow-sm bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Vouchers Populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {popularCategories.map((cat, i) => {
                const CatIcon = cat.icon
                const maxUsage = Math.max(...popularCategories.map(c => c.usage))
                const barWidth = Math.round((cat.usage / maxUsage) * 100)
                return (
                  <motion.div
                    key={cat.category}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`p-3 rounded-lg border ${cat.lightBg} border-border hover:shadow-md transition-all duration-200 cursor-pointer group`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm group-hover:scale-105 transition-transform">
                        <CatIcon className="h-4 w-4 text-emerald-600" />
                      </div>
                      <Badge variant="outline" className="text-[9px] ml-auto text-emerald-600 border-emerald-200 dark:border-emerald-800">
                        {cat.growth}
                      </Badge>
                    </div>
                    <p className="text-sm font-bold text-foreground">{cat.category}</p>
                    <p className={`text-lg font-bold ${cat.textColor} mt-0.5`}>{cat.usage.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-muted-foreground">usos este mês</p>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${cat.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
                  {/* Usage Progress Bar */}
                  {featuredVoucher.usedAmount > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">Valor utilizado</span>
                        <span className="font-medium text-foreground">{formatCurrency(featuredVoucher.usedAmount)} / {formatCurrency(featuredVoucher.amount)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round((featuredVoucher.usedAmount / featuredVoucher.amount) * 100)}%` }}
                          transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{Math.round((featuredVoucher.usedAmount / featuredVoucher.amount) * 100)}% utilizado</p>
                    </div>
                  )}
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

      {/* Recommended Vouchers Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <Card className="shadow-sm bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Vouchers Recomendados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: 'CashBack Mobilidade', desc: 'Use em corridas e viagens', amount: 'R$ 25,00', category: 'Mobilidade', icon: Car, color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50' },
                { name: 'Farmácia Popular', desc: 'Desconto em medicamentos', amount: 'R$ 50,00', category: 'Farmácia', icon: Pill, color: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50' },
                { name: 'Refeição Executiva', desc: 'Restaurantes parceiros', amount: 'R$ 30,00', category: 'Refeição', icon: UtensilsCrossed, color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50' },
              ].map((rec, i) => {
                const RecIcon = rec.icon
                return (
                  <motion.div
                    key={rec.name}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-3 rounded-lg border ${rec.color} card-hover cursor-pointer`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-gray-800">
                        <RecIcon className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{rec.category}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{rec.name}</p>
                    <p className="text-[10px] text-muted-foreground">{rec.desc}</p>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">{rec.amount}</p>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
            all: vouchers.length,
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
            const usagePercent = voucher.amount > 0 ? Math.round((voucher.usedAmount / voucher.amount) * 100) : 0

            return (
              <motion.div
                key={voucher.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
              >
                <Card
                  className={`shadow-sm overflow-hidden relative group ${
                    !isActive ? 'opacity-60' : 'hover:shadow-lg transition-all duration-200 card-hover-lift'
                  } ${isExpired ? 'border-red-200 dark:border-red-800' : 'border-border'}`}
                  onMouseEnter={() => setHoveredId(voucher.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Holographic shine effect on active vouchers - sweeps across on hover */}
                  {isActive && (
                    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                      <motion.div
                        className="absolute inset-0"
                        initial={{ x: '-100%' }}
                        animate={hoveredId === voucher.id ? { x: '100%' } : { x: '-100%' }}
                        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                        style={{
                          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.15) 55%, transparent 70%)',
                        }}
                      />
                    </div>
                  )}

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
                              ? `Expirou em ${voucher.expiresAt ? formatDate(voucher.expiresAt) : '-'}`
                              : voucher.expiresAt
                              ? `Expira em ${formatDate(voucher.expiresAt)}`
                              : 'Sem data de validade'}
                          </p>
                          {isActive && <CountdownTimer expiresAt={voucher.expiresAt} />}
                        </div>

                        {/* Usage Progress Bar */}
                        {isActive && voucher.usedAmount > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-[9px] mb-0.5">
                              <span className="text-muted-foreground">Utilizado</span>
                              <span className="font-medium text-foreground">{formatCurrency(voucher.usedAmount)}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${
                                  usagePercent > 80 ? 'bg-gradient-to-r from-amber-400 to-red-500' :
                                  usagePercent > 50 ? 'bg-gradient-to-r from-emerald-400 to-amber-400' :
                                  'bg-gradient-to-r from-emerald-400 to-emerald-600'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${usagePercent}%` }}
                                transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                              />
                            </div>
                            <p className="text-[8px] text-muted-foreground mt-0.5">{usagePercent}% utilizado</p>
                          </div>
                        )}
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

      {filtered.length === 0 && !loading && (
        <EmptyState
          icon={Ticket}
          title="Nenhum voucher ativo"
          description="Adicione um voucher com o código recebido ou compre um novo voucher para aproveitar descontos em mobilidade, farmácia, refeição e compras!"
          actionLabel="Adicionar Voucher"
          onAction={handleOpenRedeem}
        />
      )}

      {loading && (
        <Card className="shadow-sm bg-card">
          <CardContent className="p-8 flex items-center justify-center">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="h-5 w-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-sm">Carregando vouchers...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
