'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Gift, Check, Clock, Car, ShoppingBag, Heart, Shield, Phone, Stethoscope, Fuel, UtensilsCrossed, Wrench, Home, Bike, Banknote, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { gratificationsApi } from '@/lib/api'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Types
interface GratificationItem {
  id: string
  name: string
  amount: number
  type: string
  category?: string
  isClaimed: boolean
  claimedAt?: string
  description?: string
}

interface GratificationCategory {
  name: string
  icon: any
  color: string
  items: GratificationItem[]
}

// Fallback static data (used when API returns no gratifications)
const fallbackCategories: GratificationCategory[] = [
  {
    name: 'Mobilidade',
    icon: Car,
    color: 'bg-blue-100 text-blue-600',
    items: [
      { id: '1', name: 'Equipe Mobilidade', amount: 200000, type: 'mobility_team', isClaimed: true, claimedAt: '2025-01-10' },
      { id: '2', name: 'Auxílio Combustível', amount: 50000, type: 'fuel_aid', isClaimed: false },
    ],
  },
  {
    name: 'Compras',
    icon: ShoppingBag,
    color: 'bg-purple-100 text-purple-600',
    items: [
      { id: '3', name: 'CashBack Shopping', amount: 150000, type: 'shopping', isClaimed: true, claimedAt: '2025-01-08' },
    ],
  },
  {
    name: 'Liderança',
    icon: Heart,
    color: 'bg-rose-100 text-rose-600',
    items: [
      { id: '4', name: 'Gratificação Liderança', amount: 300000, type: 'leadership', isClaimed: false },
      { id: '5', name: 'Ativação Residual', amount: 100000, type: 'residual_activation', isClaimed: false },
    ],
  },
  {
    name: 'Seguros',
    icon: Shield,
    color: 'bg-amber-100 text-amber-600',
    items: [
      { id: '6', name: 'Seguro Auto', amount: 180000, type: 'insurance_car', isClaimed: true, claimedAt: '2024-12-20' },
      { id: '7', name: 'Seguro de Vida', amount: 250000, type: 'insurance_life', isClaimed: false },
      { id: '8', name: 'Seguro Celular', amount: 30000, type: 'insurance_phone', isClaimed: false },
    ],
  },
  {
    name: 'Saúde',
    icon: Stethoscope,
    color: 'bg-emerald-100 text-emerald-600',
    items: [
      { id: '9', name: 'Telemedicina', amount: 40000, type: 'telemedicine', isClaimed: true, claimedAt: '2025-01-05' },
      { id: '10', name: 'Plano Odontológico', amount: 60000, type: 'dental', isClaimed: false },
    ],
  },
  {
    name: 'Benefícios',
    icon: Gift,
    color: 'bg-teal-100 text-teal-600',
    items: [
      { id: '11', name: 'Kit Mimo', amount: 25000, type: 'mimo_kit', isClaimed: false },
      { id: '12', name: 'Guincho', amount: 35000, type: 'tow_truck', isClaimed: false },
      { id: '13', name: 'Assistência Residencial', amount: 45000, type: 'home_assistance', isClaimed: false },
      { id: '14', name: 'Fundo Aposentadoria', amount: 500000, type: 'retirement_fund', isClaimed: false },
      { id: '15', name: 'Escolha da Moto', amount: 800000, type: 'motorcycle_choice', isClaimed: false },
    ],
  },
]

// Map API category to UI category
function mapApiCategoryToUi(category?: string): { name: string; icon: any; color: string } {
  const mapping: Record<string, { name: string; icon: any; color: string }> = {
    mobility: { name: 'Mobilidade', icon: Car, color: 'bg-blue-100 text-blue-600' },
    shopping: { name: 'Compras', icon: ShoppingBag, color: 'bg-purple-100 text-purple-600' },
    leadership: { name: 'Liderança', icon: Heart, color: 'bg-rose-100 text-rose-600' },
    insurance: { name: 'Seguros', icon: Shield, color: 'bg-amber-100 text-amber-600' },
    health: { name: 'Saúde', icon: Stethoscope, color: 'bg-emerald-100 text-emerald-600' },
    benefits: { name: 'Benefícios', icon: Gift, color: 'bg-teal-100 text-teal-600' },
  }
  return mapping[category || 'benefits'] || mapping.benefits
}

// Group API gratifications into categories
function groupByCategories(items: GratificationItem[]): GratificationCategory[] {
  const groups: Record<string, GratificationCategory> = {}

  for (const item of items) {
    const cat = mapApiCategoryToUi(item.category)
    if (!groups[cat.name]) {
      groups[cat.name] = { ...cat, items: [] }
    }
    groups[cat.name].items.push(item)
  }

  return Object.values(groups)
}

export function GratificationsPage() {
  const { user, updateUser } = useStore()
  const [categories, setCategories] = useState<GratificationCategory[]>(fallbackCategories)
  const [isLoading, setIsLoading] = useState(true)
  const [isUsingFallback, setIsUsingFallback] = useState(true)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [selectedGratification, setSelectedGratification] = useState<GratificationItem | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)

  // Fetch gratifications from API
  const fetchGratifications = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const data = await gratificationsApi.getList(user.id)
      const apiGratifications: GratificationItem[] = [
        ...(data.available || []).map((g: any) => ({
          id: g.id,
          name: g.type || g.name || 'Gratificação',
          amount: g.amount || 0,
          type: g.type || '',
          category: g.category || 'benefits',
          isClaimed: false,
          description: g.description,
        })),
        ...(data.claimed || []).map((g: any) => ({
          id: g.id,
          name: g.type || g.name || 'Gratificação',
          amount: g.amount || 0,
          type: g.type || '',
          category: g.category || 'benefits',
          isClaimed: true,
          claimedAt: g.claimedAt,
          description: g.description,
        })),
      ]

      if (apiGratifications.length > 0) {
        const grouped = groupByCategories(apiGratifications)
        setCategories(grouped)
        setIsUsingFallback(false)
      } else {
        // API returned empty - use fallback
        setCategories(fallbackCategories)
        setIsUsingFallback(true)
      }
    } catch (err) {
      console.error('[Gratifications] Error fetching gratifications:', err)
      // On error, use fallback data
      setCategories(fallbackCategories)
      setIsUsingFallback(true)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchGratifications()
  }, [fetchGratifications])

  // Open claim dialog
  const handleClaimClick = (item: GratificationItem) => {
    setSelectedGratification(item)
    setClaimDialogOpen(true)
  }

  // Claim gratification
  const handleClaim = async (claimType: 'balance' | 'prize') => {
    if (!selectedGratification || !user?.id) return

    setIsClaiming(true)
    setClaimingId(selectedGratification.id)

    try {
      const result = await gratificationsApi.claim(user.id, selectedGratification.id, claimType)

      // Update local state - mark as claimed
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: cat.items.map((item) =>
            item.id === selectedGratification.id
              ? { ...item, isClaimed: true, claimedAt: new Date().toISOString() }
              : item
          ),
        }))
      )

      // Update user balance in store if claimed as balance
      if (claimType === 'balance' && result.balanceField && result.newBalance !== undefined) {
        updateUser({ [result.balanceField]: result.newBalance } as any)
      }

      // Show success toast
      if (claimType === 'balance') {
        toast.success('Gratificação adicionada ao saldo!', {
          description: `${selectedGratification.name}: ${formatCurrency(selectedGratification.amount)} creditados.`,
        })
      } else {
        toast.success('Solicitação de prêmio enviada!', {
          description: `Acompanhe o status pelo suporte. Ticket #${result.ticketId || ''}`,
        })
      }

      setClaimDialogOpen(false)
      setSelectedGratification(null)
    } catch (err: any) {
      console.error('[Gratifications] Error claiming gratification:', err)
      toast.error('Erro ao reivindicar gratificação', {
        description: err?.message || 'Tente novamente mais tarde.',
      })
    } finally {
      setIsClaiming(false)
      setClaimingId(null)
    }
  }

  // Compute summary stats
  const allItems = categories.flatMap((c) => c.items)
  const claimedCount = allItems.filter((i) => i.isClaimed).length
  const totalAvailable = allItems.filter((i) => !i.isClaimed).reduce((acc, i) => acc + i.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Gratificações</h2>
        <p className="text-sm text-gray-500">Gerencie suas gratificações e benefícios disponíveis</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">DISPONÍVEIS</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalAvailable)}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">REIVINDICADAS</p>
                <p className="text-lg font-bold text-gray-900">{claimedCount}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">PENDENTES</p>
                <p className="text-lg font-bold text-gray-900">{allItems.length - claimedCount}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-500">Carregando gratificações...</span>
        </div>
      )}

      {/* Fallback Notice */}
      {!isLoading && isUsingFallback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="shadow-sm border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Gratificações de demonstração</p>
                <p className="text-xs text-amber-600">As gratificações serão carregadas da sua conta quando disponíveis.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Gratification Categories */}
      {!isLoading && categories.map((category, ci) => (
        <motion.div
          key={category.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ci * 0.08 }}
        >
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${category.color}`}>
                  <category.icon className="h-4 w-4" />
                </div>
                {category.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {category.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.isClaimed ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        {item.isClaimed && item.claimedAt && (
                          <p className="text-xs text-gray-500">Reivindicado em {formatDate(item.claimedAt)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-emerald-700">
                        {formatCurrency(item.amount)}
                      </span>
                      {item.isClaimed ? (
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Reivindicado</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleClaimClick(item)}
                          disabled={claimingId === item.id}
                        >
                          {claimingId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Reivindicar'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Claim Type Dialog */}
      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reivindicar Gratificação</DialogTitle>
            <DialogDescription>
              Como você deseja receber{' '}
              <span className="font-semibold text-emerald-700">
                {selectedGratification ? formatCurrency(selectedGratification.amount) : ''}
              </span>
              {selectedGratification ? ` — ${selectedGratification.name}` : ''}?
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            <Button
              variant="outline"
              className="h-auto py-4 px-4 flex items-center gap-4 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400 transition-all"
              onClick={() => handleClaim('balance')}
              disabled={isClaiming}
            >
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                <Banknote className="h-5 w-5" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-gray-900">Adicionar ao Saldo</p>
                <p className="text-xs text-gray-500">O valor será creditado na sua carteira</p>
              </div>
              {isClaiming && <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />}
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 px-4 flex items-center gap-4 border-amber-200 hover:bg-amber-50 hover:border-amber-400 transition-all"
              onClick={() => handleClaim('prize')}
              disabled={isClaiming}
            >
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                <Gift className="h-5 w-5" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-gray-900">Solicitar Prêmio</p>
                <p className="text-xs text-gray-500">Solicite o prêmio físico/digital da plataforma</p>
              </div>
              {isClaiming && <Loader2 className="h-4 w-4 animate-spin text-amber-600" />}
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setClaimDialogOpen(false)
                setSelectedGratification(null)
              }}
              disabled={isClaiming}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
