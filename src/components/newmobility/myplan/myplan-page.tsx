'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { plansApi, userApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  CreditCard, Check, Star, ArrowUpRight, FileText, Calendar,
  Shield, Car, Pill, ShoppingBag, Gamepad2, Trophy, Phone,
  Heart, Zap, Gift, Users, Smartphone, Clock, Calculator, TrendingUp, Sparkles, Copy,
  Lock, Wallet, ShieldCheck, ChevronRight, AlertCircle, Loader2, QrCode
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { toast } from 'sonner'
import { AsaasPaymentDialog } from '@/components/newmobility/payment/asaas-payment-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { getCareerRank } from '@/lib/api-utils'

const mockInvoices = [
  { id: '1', type: 'plan_blue5', amount: 99900, status: 'paid', dueDate: '2025-01-05', paidAt: '2025-01-03' },
  { id: '2', type: 'plan_blue5', amount: 99900, status: 'paid', dueDate: '2024-12-05', paidAt: '2024-12-04' },
  { id: '3', type: 'plan_blue5', amount: 99900, status: 'paid', dueDate: '2024-11-05', paidAt: '2024-11-05' },
  { id: '4', type: 'plan_blue5', amount: 99900, status: 'pending', dueDate: '2025-02-05', paidAt: null },
  { id: '5', type: 'residual_entry', amount: 20000, status: 'paid', dueDate: '2024-10-15', paidAt: '2024-10-14' },
]

const invoiceTypeLabels: Record<string, string> = {
  plan_blue3: 'Plano Blue 3',
  plan_blue5: 'Plano Blue 5 Premium',
  upgrade: 'Upgrade de Plano',
  monthly_fee: 'Mensalidade',
  residual_entry: 'Entrada Residual',
}

// Initial loading-state fallback. These values are ONLY used until the
// `/api/plans` fetch resolves (and as a graceful fallback if the API
// is unreachable). Once the API responds, the `plans` state is rebuilt
// from the DB-sourced values — so admin edits to plan prices/names in
// the Plan table propagate to this page automatically.
//
// Presentation-only fields that the DB does not model (color gradient,
// cashback level labels, and the icon-tagged feature list) are kept here
// as a per-code template and merged with the API response at runtime.
const FALLBACK_PLANS = [
  {
    id: 'free',
    code: 'free',
    name: 'Gratuito',
    price: 'Grátis',
    priceCents: 0,
    color: 'from-gray-400 to-gray-500',
    cashbackEntrada: '-',
    cashbackResidual: '-',
    cashbackSales: '-',
    features: [
      { icon: Smartphone, label: 'App Mobilidade', included: true },
      { icon: Gift, label: 'Voucher Bem-Vindo', included: true },
      { icon: Car, label: 'CashBack Mobilidade', included: false },
      { icon: Pill, label: 'CashBack Farmácia', included: false },
      { icon: ShoppingBag, label: 'CashBack Shopping', included: false },
      { icon: Gamepad2, label: 'Portal Gamer', included: false },
      { icon: Trophy, label: 'Portal Sport Bet', included: false },
      { icon: Shield, label: 'Seguro Auto', included: false },
      { icon: Heart, label: 'Seguro de Vida', included: false },
      { icon: Phone, label: 'Telemedicina', included: false },
    ],
  },
  {
    id: 'blue3',
    code: 'blue3',
    name: 'Blue 3',
    price: 'R$ 97,00/mês',
    priceCents: 9700,
    color: 'from-teal-400 to-teal-500',
    cashbackEntrada: '5 níveis',
    cashbackResidual: '7 níveis',
    cashbackSales: '-',
    features: [
      { icon: Smartphone, label: 'App Mobilidade', included: true },
      { icon: Gift, label: 'Voucher Bem-Vindo', included: true },
      { icon: Car, label: 'CashBack Mobilidade', included: true },
      { icon: Pill, label: 'CashBack Farmácia', included: true },
      { icon: ShoppingBag, label: 'CashBack Shopping', included: false },
      { icon: Gamepad2, label: 'Portal Gamer', included: false },
      { icon: Trophy, label: 'Portal Sport Bet', included: false },
      { icon: Shield, label: 'Seguro Auto', included: false },
      { icon: Heart, label: 'Seguro de Vida', included: false },
      { icon: Phone, label: 'Telemedicina', included: false },
    ],
  },
  {
    id: 'blue5',
    code: 'blue5',
    name: 'Blue 5 Premium',
    price: 'R$ 147,00/mês',
    priceCents: 14700,
    color: 'from-emerald-600 to-emerald-700',
    popular: true,
    cashbackEntrada: '5 níveis',
    cashbackResidual: '7 níveis',
    cashbackSales: '9 níveis',
    features: [
      { icon: Smartphone, label: 'App Mobilidade', included: true },
      { icon: Gift, label: 'Voucher Bem-Vindo', included: true },
      { icon: Car, label: 'CashBack Mobilidade', included: true },
      { icon: Pill, label: 'CashBack Farmácia', included: true },
      { icon: ShoppingBag, label: 'CashBack Shopping', included: true },
      { icon: Gamepad2, label: 'Portal Gamer', included: true },
      { icon: Trophy, label: 'Portal Sport Bet', included: true },
      { icon: Shield, label: 'Seguro Auto', included: true },
      { icon: Heart, label: 'Seguro de Vida', included: true },
      { icon: Phone, label: 'Telemedicina', included: true },
    ],
  },
]

// Shape returned by /api/plans
type ApiPlan = {
  id: string
  code: string
  name: string
  price: number
  priceCents: number
  description: string
  features: string[]
  level: number
  isActive: boolean
  isDefault: boolean
  sortOrder: number
  matrixEntrada: string
  matrixResidual: string
  matrixVendas: string
}

// Merge an API plan with its presentation template from FALLBACK_PLANS.
// DB-sourced fields (id/code/name/priceCents) always win; presentation
// fields (color, icon-tagged features, cashback level labels) come from
// the fallback template keyed by `code`. Unknown codes get a sensible
// default presentation.
function mergeApiPlan(apiPlan: ApiPlan) {
  const template = FALLBACK_PLANS.find(
    (p) => p.code === apiPlan.code || p.id === apiPlan.code || p.id === apiPlan.id
  )
  const priceLabel =
    apiPlan.priceCents > 0
      ? `R$ ${(apiPlan.priceCents / 100).toFixed(2).replace('.', ',')}/mês`
      : 'Grátis'
  if (!template) {
    return {
      id: apiPlan.code || apiPlan.id,
      code: apiPlan.code,
      name: apiPlan.name,
      price: priceLabel,
      priceCents: apiPlan.priceCents,
      color: 'from-emerald-500 to-emerald-600',
      cashbackEntrada: apiPlan.matrixEntrada && apiPlan.matrixEntrada !== '-' ? apiPlan.matrixEntrada : '-',
      cashbackResidual: apiPlan.matrixResidual && apiPlan.matrixResidual !== '-' ? apiPlan.matrixResidual : '-',
      cashbackSales: apiPlan.matrixVendas && apiPlan.matrixVendas !== '-' ? apiPlan.matrixVendas : '-',
      features: [
        { icon: Smartphone, label: 'App Mobilidade', included: true },
        { icon: Gift, label: 'Voucher Bem-Vindo', included: true },
        { icon: Car, label: 'CashBack Mobilidade', included: apiPlan.priceCents > 0 },
        { icon: Pill, label: 'CashBack Farmácia', included: apiPlan.priceCents > 0 },
        { icon: ShoppingBag, label: 'CashBack Shopping', included: false },
        { icon: Gamepad2, label: 'Portal Gamer', included: false },
        { icon: Trophy, label: 'Portal Sport Bet', included: false },
        { icon: Shield, label: 'Seguro Auto', included: false },
        { icon: Heart, label: 'Seguro de Vida', included: false },
        { icon: Phone, label: 'Telemedicina', included: false },
      ],
    }
  }
  return {
    ...template,
    id: apiPlan.code || apiPlan.id,
    code: apiPlan.code,
    name: apiPlan.name,
    price: priceLabel,
    priceCents: apiPlan.priceCents,
  }
}

export function MyPlanPage() {
  const { user, updateUser } = useStore()
  const { toast } = useToast()
  // Normalize the user's plan: blue5/premium5 are the same tier
  // (Premium 5 per client spec §1.1). The store may carry either code;
  // we treat them identically.
  const rawPlan = user?.plan || 'blue5'
  const currentPlan = rawPlan === 'premium5' ? 'blue5' : rawPlan
  const isPremium5 = currentPlan === 'blue5'
  const isBlue3 = currentPlan === 'blue3'

  // `plans` is the runtime source of truth for the plan comparison UI.
  // Initialised with FALLBACK_PLANS so the page renders immediately
  // (no flash of empty content); replaced with DB-sourced values once
  // /api/plans resolves.
  const [plans, setPlans] = useState(FALLBACK_PLANS)

  // Premium 5 upgrade dialog state
  const [premium5DialogOpen, setPremium5DialogOpen] = useState(false)
  const [premium5WalletSource, setPremium5WalletSource] = useState<'withdrawal' | 'paymentInvoice'>('withdrawal')
  const [premium5Step, setPremium5Step] = useState<'choose' | 'pix' | 'success'>('choose')
  const [premium5Processing, setPremium5Processing] = useState(false)
  const [premium5PixData, setPremium5PixData] = useState<any>(null)
  const [premium5Copied, setPremium5Copied] = useState(false)

  // ─── Asaas direct payment (PIX/Boleto) for plan subscription ─────
  // Opens the AsaasPaymentDialog with a freshly-created Invoice. Used by
  // the "Assinar" buttons in the Comparação de Planos cards/table for
  // NON-free plans that the user is not currently on.
  const [asaasDialogOpen, setAsaasDialogOpen] = useState(false)
  const [asaasInvoiceId, setAsaasInvoiceId] = useState<string>('')
  const [asaasInvoiceDescription, setAsaasInvoiceDescription] = useState<string>('')
  const [asaasInvoiceAmount, setAsaasInvoiceAmount] = useState<number>(0)
  const [asaasInitialPaymentId, setAsaasInitialPaymentId] = useState<string | undefined>(undefined)
  const [assaasCreatingInvoice, setAsaasCreatingInvoice] = useState(false)

  // ─── Auto-debit opt-in (Task 13-B §4) ─────────────────────────────
  // Local mirror of `user.autoDebitEnabled`. When toggled, persists to the
  // User table via PUT /api/user/profile and updates the Zustand store so
  // the preference survives page reloads. Initialized from the user store
  // so SSR/hydration matches what the API returned at login.
  const [autoDebitEnabled, setAutoDebitEnabled] = useState<boolean>(
    Boolean(user?.autoDebitEnabled)
  )
  const [autoDebitSaving, setAutoDebitSaving] = useState(false)

  // Keep local state in sync if the user store changes (e.g. after another
  // tab toggles it). Without this, the checkbox would stay stale.
  useEffect(() => {
    setAutoDebitEnabled(Boolean(user?.autoDebitEnabled))
  }, [user?.autoDebitEnabled])

  const handleToggleAutoDebit = async (checked: boolean) => {
    if (!user?.id) return
    setAutoDebitEnabled(checked)
    setAutoDebitSaving(true)
    try {
      const fresh = await userApi.updateProfile(user.id, { autoDebitEnabled: checked })
      // Update the global store so the preference survives navigation
      if (fresh && typeof fresh === 'object') {
        updateUser({ autoDebitEnabled: checked })
      }
      toast({
        title: checked ? 'Débito automático ativado' : 'Débito automático desativado',
        description: checked
          ? 'A mensalidade será descontada automaticamente do seu saldo.'
          : 'Você precisará pagar a mensalidade manualmente.',
      })
    } catch (err: any) {
      // Revert on error
      setAutoDebitEnabled(!checked)
      toast({
        title: 'Erro ao salvar preferência',
        description: err?.message || 'Tente novamente mais tarde',
        variant: 'destructive',
      })
    } finally {
      setAutoDebitSaving(false)
    }
  }

  // ─── Dynamic graduation (Task 13-B §5) ───────────────────────────
  // Graduation is derived from the logged-in user's career points, NOT
  // hardcoded. Falls back to 'Associado' when the user has no points or
  // when the user object is missing (e.g. still loading).
  const careerRank = getCareerRank(user?.careerPoints ?? 0)

  // Fetch plans from the API on mount so admin edits to the Plan table
  // (prices, names, active flags) propagate to the My Plan page.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await plansApi.getList()
        if (cancelled) return
        const apiPlans: ApiPlan[] = Array.isArray(data?.plans) ? data.plans : []
        if (apiPlans.length > 0) {
          setPlans(apiPlans.map(mergeApiPlan))
        }
      } catch (err) {
        // Keep FALLBACK_PLANS on error — the page still works.
        console.warn('Failed to load plans from API, using fallback:', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const currentPlanData = plans.find((p) => p.id === currentPlan) || plans[2]
  const nextBillingDate = '05/02/2025'
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>('blue5')
  const [upgradeCalc, setUpgradeCalc] = useState<any>(null)
  const [calcLoading, setCalcLoading] = useState(false)
  const [upgradeStep, setUpgradeStep] = useState<'calculate' | 'confirm' | 'pix_payment' | 'success'>('calculate')
  const [paymentMethod, setPaymentMethod] = useState<string>('pix')
  const [pixPaymentData, setPixPaymentData] = useState<any>(null)
  const [pixCopied, setPixCopied] = useState(false)
  const [confirmingPix, setConfirmingPix] = useState(false)

  const handleCalculateUpgrade = async (planId: string) => {
    if (!user?.id) return
    setSelectedPlan(planId)
    setCalcLoading(true)
    setUpgradeStep('calculate')
    setPixPaymentData(null)
    setUpgradeDialogOpen(true)

    try {
      const data = await plansApi.calculateUpgrade(user.id, planId)
      setUpgradeCalc(data)
    } catch (err) {
      // Fallback to local calculation — uses the API-fetched `plans`
      // state so the fallback prices also respect admin edits.
      const planPrices: Record<string, number> = plans.reduce(
        (acc, p) => {
          acc[p.id] = p.priceCents
          return acc
        },
        {} as Record<string, number>
      )
      const planNames: Record<string, string> = plans.reduce(
        (acc, p) => {
          acc[p.id] = p.name
          return acc
        },
        {} as Record<string, string>
      )
      const currentPrice = planPrices[currentPlan] || 0
      const targetPrice = planPrices[planId] || 0
      setUpgradeCalc({
        currentPlan: { id: currentPlan, name: planNames[currentPlan], price: currentPrice },
        targetPlan: { id: planId, name: planNames[planId], price: targetPrice },
        upgradeCost: targetPrice - currentPrice,
        monthlyDifference: targetPrice - currentPrice,
        newFeatures: planId === 'blue5' ? ['CashBack Shopping', 'Portal Gamer', 'Portal Sport Bet', 'Seguro Auto', 'Seguro de Vida', 'Telemedicina'] : ['CashBack Mobilidade', 'CashBack Farmácia'],
        estimatedMonthlyCashbackIncrease: planId === 'blue5' ? 45000 : 15000,
        roi: targetPrice > 0 ? Math.round((45000 / targetPrice) * 100) : 0,
      })
    } finally {
      setCalcLoading(false)
    }
  }

  const handleConfirmUpgrade = async () => {
    if (!user?.id) return
    try {
      if (paymentMethod === 'pix') {
        // Generate PIX code on screen - don't auto-approve
        const data = await plansApi.upgrade(user.id, selectedPlan, 'pix')
        setPixPaymentData(data)
        setUpgradeStep('pix_payment')
        toast({ title: 'PIX gerado!', description: 'Pague o PIX para confirmar seu upgrade' })
      } else if (paymentMethod === 'balance') {
        // Pay with balance - auto-approved
        const data = await plansApi.upgrade(user.id, selectedPlan, 'balance')
        if (data.paid) {
          if (data.user) {
            updateUser({
              plan: selectedPlan,
              isActive: true,
              balanceFree: data.user.balanceFree,
            })
          }
          setUpgradeStep('success')
          toast({ title: 'Upgrade realizado com sucesso!', description: `Seu plano foi atualizado para ${upgradeCalc?.targetPlan?.name || selectedPlan}` })
        }
      } else {
        toast({ title: 'Método indisponível', description: 'Por enquanto apenas PIX e Saldo estão disponíveis', variant: 'destructive' })
      }
    } catch (err: any) {
      toast({ title: 'Erro ao realizar upgrade', description: err?.message || 'Tente novamente mais tarde', variant: 'destructive' })
    }
  }

  const handleConfirmPixPayment = async () => {
    if (!user?.id || !pixPaymentData?.invoice?.id) return
    setConfirmingPix(true)
    try {
      const data = await plansApi.confirmPixPayment(user.id, pixPaymentData.invoice.id)
      if (data.paid) {
        // Update the user store with new plan
        if (data.user) {
          updateUser({
            plan: data.plan || selectedPlan,
            isActive: true,
          })
        }
        setUpgradeStep('success')
        toast({ title: 'Pagamento confirmado!', description: `Seu plano foi atualizado para ${upgradeCalc?.targetPlan?.name || selectedPlan}` })
      }
    } catch (err: any) {
      toast({ title: 'Erro ao confirmar pagamento', description: err?.message || 'Tente novamente', variant: 'destructive' })
    } finally {
      setConfirmingPix(false)
    }
  }

  // ─── Premium 5 upgrade handlers (Índice.docx §3) ─────────────────
  // Two paths:
  //   1. "Descontar Automaticamente" — POST /api/plans/upgrade with
  //      paymentMethod: 'automatic' and walletSource: 'withdrawal' |
  //      'paymentInvoice'. Backend deducts R$ 850,00 instantly and
  //      unlocks entrada levels 4-5.
  //   2. "Pagar via PIX"             — POST /api/plans/upgrade with
  //      paymentMethod: 'manual'. Backend creates a pending invoice
  //      and returns a PIX BR Code. User pays externally then calls
  //      /api/plans/confirm-pix to confirm.
  const handlePremium5Automatic = async () => {
    if (!user?.id) return
    setPremium5Processing(true)
    try {
      const res = await fetch('/api/plans/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fromPlan: 'blue3',
          toPlan: 'premium5',
          paymentMethod: 'automatic',
          walletSource: premium5WalletSource,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || data?.message || 'Falha no upgrade')
      }
      // Refresh the user store with the new plan + balances
      if (data.user) {
        updateUser({
          plan: 'blue5',
          isActive: true,
          balanceWithdrawal: data.user.balanceWithdrawal,
          balancePaymentInvoice: data.user.balancePaymentInvoice,
        })
      }
      setPremium5Step('success')
      toast({
        title: 'Upgrade realizado com sucesso!',
        description: 'Seu plano foi atualizado para Premium 5. Níveis 4 e 5 da matriz Entrada desbloqueados!',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao realizar upgrade',
        description: err?.message || 'Tente novamente mais tarde',
        variant: 'destructive',
      })
    } finally {
      setPremium5Processing(false)
    }
  }

  const handlePremium5Manual = async () => {
    if (!user?.id) return
    setPremium5Processing(true)
    try {
      const res = await fetch('/api/plans/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fromPlan: 'blue3',
          toPlan: 'premium5',
          paymentMethod: 'manual',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || data?.message || 'Falha ao gerar PIX')
      }
      setPremium5PixData(data.data || data)
      setPremium5Step('pix')
      toast({
        title: 'PIX gerado!',
        description: 'Pague o PIX para confirmar seu upgrade para Premium 5',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar PIX',
        description: err?.message || 'Tente novamente mais tarde',
        variant: 'destructive',
      })
    } finally {
      setPremium5Processing(false)
    }
  }

  const handlePremium5ConfirmPix = async () => {
    if (!user?.id || !premium5PixData?.invoice?.id) return
    setPremium5Processing(true)
    try {
      const data = await plansApi.confirmPixPayment(user.id, premium5PixData.invoice.id)
      if (data.paid) {
        if (data.user) {
          updateUser({ plan: 'blue5', isActive: true })
        }
        setPremium5Step('success')
        toast({
          title: 'Pagamento confirmado!',
          description: 'Seu plano foi atualizado para Premium 5. Níveis 4 e 5 da matriz Entrada desbloqueados!',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao confirmar pagamento',
        description: err?.message || 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setPremium5Processing(false)
    }
  }

  const openPremium5Dialog = () => {
    setPremium5Step('choose')
    setPremium5PixData(null)
    setPremium5DialogOpen(true)
  }

  // ─── Asaas direct subscription flow ─────────────────────────────
  // Creates a pending Invoice for the selected plan (type 'plan_subscription')
  // and opens the AsaasPaymentDialog so the user can pay via PIX or Boleto.
  // Only invoked for NON-free plans (priceCents > 0).
  const handleAssinarPlan = async (planId: string) => {
    if (!user?.id) {
      toast({ title: 'Usuário não autenticado', variant: 'destructive' })
      return
    }
    const plan = plans.find((p) => p.id === planId)
    if (!plan || plan.priceCents <= 0) return

    setAsaasCreatingInvoice(true)
    try {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 3)

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: plan.priceCents,
          type: 'plan_subscription',
          dueDate: dueDate.toISOString(),
          description: `Assinatura do plano ${plan.name}`,
        }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok || !data?.invoice?.id) {
        throw new Error(data?.error || 'Falha ao criar fatura')
      }

      setAsaasInvoiceId(data.invoice.id)
      setAsaasInvoiceDescription(`Assinatura do plano ${plan.name}`)
      setAsaasInvoiceAmount(plan.priceCents)
      setAsaasInitialPaymentId(undefined)
      setAsaasDialogOpen(true)
    } catch (err: any) {
      toast({
        title: 'Erro ao iniciar pagamento',
        description: err?.message || 'Tente novamente mais tarde',
        variant: 'destructive',
      })
    } finally {
      setAsaasCreatingInvoice(false)
    }
  }

  // Refresh the logged-in user's data from the API after a payment is created
  // (so the plan/balances reflect the new invoice / payment).
  const handleAsaasPaymentCreated = async () => {
    if (!user?.id) return
    try {
      const fresh = await userApi.getProfile(user.id)
      if (fresh?.user) {
        updateUser(fresh.user)
      } else if (fresh && fresh.id) {
        updateUser(fresh)
      }
    } catch {
      // Silent — the dialog already shows the payment details.
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Meu Plano</h2>
        <p className="text-sm text-muted-foreground">Gerencie seu plano e acompanhe suas faturas</p>
      </div>

      {/* Current Plan Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 border-0 shadow-lg overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-50" />
          <CardContent className="p-6 text-white relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  <span className="text-emerald-200 text-sm">Plano Atual</span>
                </div>
                <h3 className="text-2xl font-bold mt-1">{currentPlanData?.name}</h3>
                <p className="text-emerald-200 text-lg">{currentPlanData?.price}</p>
                {/* Graduação dinâmica (Task 13-B §5): derived from the
                    logged-in user's careerPoints via getCareerRank — NOT
                    hardcoded. Shows the jewel pin name (Associado / Safira /
                    Rubi / Esmeralda / Diamante / Imperial). */}
                <div className="flex items-center gap-2 mt-2">
                  <Trophy className="h-4 w-4 text-emerald-200" />
                  <span className="text-emerald-200 text-sm">
                    Graduação: <strong className="text-white">{careerRank.name}</strong>
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/20 text-white border-0">
                    <Check className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                  <span className="text-xs text-emerald-200 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Próxima cobrança: {nextBillingDate}
                  </span>
                </div>
                {currentPlan !== 'blue5' && (
                  <Button className="bg-white text-emerald-700 hover:bg-emerald-50 gap-1" onClick={() => handleCalculateUpgrade('blue5')}>
                    <ArrowUpRight className="h-4 w-4" />
                    Upgrade para Premium 5
                  </Button>
                )}
              </div>
            </div>

            {/* Benefits */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs text-emerald-200 mb-2">Benefícios inclusos:</p>
              <div className="flex flex-wrap gap-2">
                {currentPlanData.features.filter((f) => f.included).map((feature, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1">
                    <feature.icon className="h-3 w-3 text-emerald-200" />
                    <span className="text-[11px] text-white">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Blue 3 → Premium 5 Upgrade Card (Índice.docx §3) ───────
          Shown only when user is on Blue 3. Lists the unlocked
          benefits (entrada levels 4-5 + R$9.600 extra earnings
          potential) and offers two payment paths: automatic wallet
          deduction or manual PIX. */}
      {isBlue3 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">
                    Fazer Upgrade para Premium 5 — R$ 850,00
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Desbloqueie os níveis 4 e 5 da matriz Entrada e potencialize seus ganhos.
                  </p>
                </div>
                <Badge className="bg-amber-500 text-white border-0">Premium 5</Badge>
              </div>

              {/* Benefits unlocked */}
              <div className="bg-white/70 dark:bg-black/20 rounded-xl p-4 mb-4 border border-amber-100 dark:border-amber-900">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Benefícios desbloqueados
                </p>
                <ul className="space-y-1.5 text-sm text-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Níveis 4 e 5 da matriz Entrada desbloqueados (de 3 para 5 níveis de comissões)</span>
                  </li>
                  {/*
                    Potenciais dos níveis 4 e 5 (Task 13-B §1):
                    Matriz 4-wide → Level N = 4^N posições.
                      - Nível 4: 4^4 = 256 posições × R$ 50,00 = R$ 12.800,00
                      - Nível 5: 4^5 = 1.024 posições × R$ 50,00 = R$ 51.200,00
                    O valor por posição (R$ 50) reflete a comissão fixa por
                    indicação direta no nível (configurável via MatrixLevelEarning).
                  */}
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Potencial de ganhos extras no nível 4: <strong>R$ 12.800,00</strong> (256 posições × R$ 50)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Potencial de ganhos extras no nível 5: <strong>R$ 51.200,00</strong> (1.024 posições × R$ 50)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Mensalidade: <strong>R$ 999,90</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Sem prazo — faça o upgrade quando atingir o nível e quiser receber as comissões</span>
                  </li>
                </ul>
              </div>

              {/* Two payment paths */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white dark:bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-bold text-foreground">Descontar Automaticamente</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Debita R$ 850,00 da carteira escolhida e ativa o upgrade imediatamente.
                  </p>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    onClick={openPremium5Dialog}
                  >
                    <Zap className="h-4 w-4" />
                    Descontar Fatura Automática
                  </Button>
                </div>

                <div className="bg-white dark:bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-bold text-foreground">Pagar via PIX</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Gere uma fatura de R$ 850,00 e pague via PIX. Ativação após confirmação.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-1"
                    onClick={handlePremium5Manual}
                    disabled={premium5Processing}
                  >
                    <Smartphone className="h-4 w-4" />
                    Pagar via PIX
                  </Button>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground mt-3 flex items-start gap-1.5">
                <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                Após o upgrade, apenas a mensalidade recorrente de R$ 999,90 permanece no backoffice.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Premium 5 active confirmation card — shown when user is on Premium 5 */}
      {isPremium5 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-500 text-white shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-foreground">Plano Premium 5 Ativo</h3>
                    <Badge className="bg-purple-500 text-white border-0">5 níveis desbloqueados</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Todos os 5 níveis da matriz Entrada estão desbloqueados. Você recebe comissões dos níveis 1 ao 5.
                  </p>
                  {/*
                    Potenciais dos níveis 4 e 5 — Task 13-B §1:
                    Matriz 4-wide → Level N = 4^N posições.
                      - Nível 4: 4^4 = 256 posições × R$ 50,00 = R$ 12.800,00
                      - Nível 5: 4^5 = 1.024 posições × R$ 50,00 = R$ 51.200,00
                  */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-xs">
                    <div className="bg-white/70 dark:bg-black/20 rounded-lg p-2 border border-purple-100 dark:border-purple-900">
                      <p className="text-muted-foreground">Nível 4 potencial</p>
                      <p className="font-bold text-foreground">R$ 12.800,00</p>
                    </div>
                    <div className="bg-white/70 dark:bg-black/20 rounded-lg p-2 border border-purple-100 dark:border-purple-900">
                      <p className="text-muted-foreground">Nível 5 potencial</p>
                      <p className="font-bold text-foreground">R$ 51.200,00</p>
                    </div>
                    <div className="bg-white/70 dark:bg-black/20 rounded-lg p-2 border border-purple-100 dark:border-purple-900">
                      <p className="text-muted-foreground">Mensalidade</p>
                      <p className="font-bold text-foreground">R$ 999,90</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recurring monthly invoice card — Task 13-B §2: a SINGLE charge,
          no split breakdown. Premium 5 = R$ 999,90; Blue 3 = R$ 150,00;
          Free = R$ 0,00. */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-sm bg-card">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  Mensalidade
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isPremium5
                    ? 'Mensalidade Premium 5'
                    : isBlue3
                    ? 'Mensalidade Blue 3'
                    : 'Sem mensalidade no plano gratuito'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Valor</p>
                <p className="text-lg font-bold text-foreground">
                  {isPremium5 ? 'R$ 999,90' : isBlue3 ? 'R$ 150,00' : 'R$ 0,00'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Vencimento</p>
                <p className="text-sm font-medium text-foreground">{nextBillingDate}</p>
              </div>
              <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                Pendente
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Auto-debit opt-in (Task 13-B §4) ─────────────────────────
          When checked, the system will attempt to deduct the monthly fee
          from the user's internal balances on the due date. If no balance
          is available, the user is prompted to transfer from another
          internal wallet. Stored on User.autoDebitEnabled. */}
      {(isPremium5 || isBlue3) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-sm bg-card">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="auto-debit-toggle"
                    className="flex items-start gap-3 cursor-pointer"
                  >
                    <Checkbox
                      id="auto-debit-toggle"
                      checked={autoDebitEnabled}
                      onCheckedChange={(v) => handleToggleAutoDebit(Boolean(v))}
                      disabled={autoDebitSaving}
                      className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground flex items-center gap-2">
                        Autorizar débito automático
                        {autoDebitSaving && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Se possuir saldo, a mensalidade será descontada automaticamente. Caso não tenha saldo, você poderá transferir de outro saldo interno para pagar.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Plan Comparison Slider */}
      <Card className="shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-600" />
            Simulador de Upgrade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Plano atual: <strong className="text-foreground">{currentPlanData?.name}</strong></span>
              <span className="text-muted-foreground font-medium">Simular upgrade para: <strong className="text-emerald-600">{plans.find((p) => p.id === selectedPlan)?.name || 'Selecione'}</strong></span>
            </div>
            
            <div className="flex items-center gap-4">
              {plans.filter(p => p.id !== 'free').map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    'flex-1 p-4 rounded-xl border-2 transition-all text-center',
                    selectedPlan === plan.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 shadow-sm'
                      : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                  )}
                >
                  <div className={`inline-block bg-gradient-to-r ${plan.color} text-white px-3 py-1 rounded-lg text-sm font-bold mb-2`}>
                    {plan.name}
                  </div>
                  <p className="text-lg font-bold text-foreground">{plan.price}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan.cashbackEntrada !== '-' ? `${plan.cashbackEntrada} Entrada` : 'Sem CB Entrada'}
                  </p>
                </button>
              ))}
            </div>

            {selectedPlan && selectedPlan !== currentPlan && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Estimativa de Upgrade
                  </span>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    onClick={() => handleCalculateUpgrade(selectedPlan)}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Calcular
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Custo do Upgrade</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(
                        Math.max(
                          0,
                          (plans.find((p) => p.id === selectedPlan)?.priceCents || 0) -
                            (plans.find((p) => p.id === currentPlan)?.priceCents || 0)
                        )
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Diferença Mensal</p>
                    <p className="text-lg font-bold text-foreground">
                      +{formatCurrency(
                        Math.max(
                          0,
                          (plans.find((p) => p.id === selectedPlan)?.priceCents || 0) -
                            (plans.find((p) => p.id === currentPlan)?.priceCents || 0)
                        )
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CB Estimado+/mês</p>
                    <p className="text-lg font-bold text-emerald-600">
                      +{selectedPlan === 'blue5' ? 'R$ 450,00' : 'R$ 150,00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ROI Estimado</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {selectedPlan === 'blue5' ? '45%' : '75%'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison Table */}
      <div>
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <Star className="h-4 w-4 text-emerald-600" />
          Comparação de Planos
        </h3>
        {/* Mobile: Cards view */}
        <div className="grid grid-cols-1 md:hidden gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`shadow-sm relative overflow-hidden bg-card ${
                currentPlan === plan.id ? 'ring-2 ring-emerald-500' : ''
              }`}>
                {plan.popular && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-emerald-600 text-white text-[10px]">POPULAR</Badge>
                  </div>
                )}
                <CardContent className="p-5">
                  <div className={`inline-block bg-gradient-to-r ${plan.color} text-white px-3 py-1 rounded-lg text-sm font-bold mb-3`}>
                    {plan.name}
                  </div>
                  <p className="text-xl font-bold text-foreground mb-4">{plan.price}</p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, fi) => (
                      <li key={fi} className={`flex items-center gap-2 text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {feature.included ? (
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <span className="h-4 w-4 shrink-0 text-muted-foreground/30">—</span>
                        )}
                        {feature.label}
                      </li>
                    ))}
                  </ul>
                  {currentPlan === plan.id ? (
                    <div className="mt-4 text-center text-sm text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/30 py-2 rounded-lg">
                      Seu plano atual
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleCalculateUpgrade(plan.id)}
                      >
                        {plan.priceCents > (plans.find((p) => p.id === currentPlan)?.priceCents || 0) ? 'Fazer Upgrade' : 'Selecionar'}
                      </Button>
                      {plan.priceCents > 0 && (
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                          disabled={assaasCreatingInvoice}
                          onClick={() => handleAssinarPlan(plan.id)}
                        >
                          {assaasCreatingInvoice ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <QrCode className="h-4 w-4" />
                          )}
                          Assinar (PIX / Boleto)
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Desktop: Table view */}
        <div className="hidden md:block overflow-x-auto">
          <Card className="shadow-sm bg-card">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 text-muted-foreground font-medium">Benefício</th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="p-4 text-center min-w-[160px]">
                        <div className={`inline-block bg-gradient-to-r ${plan.color} text-white px-3 py-1 rounded-lg text-xs font-bold`}>
                          {plan.name}
                        </div>
                        <p className="font-bold text-foreground mt-2">{plan.price}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-muted/30">
                    <td className="p-3 text-muted-foreground font-medium text-xs">CashBack Entrada</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="p-3 text-center text-xs font-medium">
                        {plan.cashbackEntrada === '-' ? <span className="text-muted-foreground/30">—</span> : <span className="text-emerald-600">{plan.cashbackEntrada}</span>}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-muted-foreground font-medium text-xs">CashBack Residual</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="p-3 text-center text-xs font-medium">
                        {plan.cashbackResidual === '-' ? <span className="text-muted-foreground/30">—</span> : <span className="text-emerald-600">{plan.cashbackResidual}</span>}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b bg-muted/30">
                    <td className="p-3 text-muted-foreground font-medium text-xs">CashBack Vendas</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="p-3 text-center text-xs font-medium">
                        {plan.cashbackSales === '-' ? <span className="text-muted-foreground/30">—</span> : <span className="text-emerald-600">{plan.cashbackSales}</span>}
                      </td>
                    ))}
                  </tr>
                  {plans[0].features.map((feature, fi) => (
                    <tr key={fi} className={`border-b ${fi % 2 === 0 ? '' : 'bg-muted/30'}`}>
                      <td className="p-3 text-muted-foreground text-xs flex items-center gap-1.5">
                        <feature.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {feature.label}
                      </td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="p-3 text-center">
                          {plan.features[fi].included ? (
                            <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="p-4" />
                    {plans.map((plan) => (
                      <td key={plan.id} className="p-4 text-center">
                        {currentPlan === plan.id ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Plano Atual</Badge>
                        ) : (
                          <div className="flex flex-col gap-2 items-stretch">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleCalculateUpgrade(plan.id)}
                            >
                              Selecionar
                            </Button>
                            {plan.priceCents > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                disabled={assaasCreatingInvoice}
                                onClick={() => handleAssinarPlan(plan.id)}
                              >
                                {assaasCreatingInvoice ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <QrCode className="h-3.5 w-3.5" />
                                )}
                                Assinar
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment History */}
      <Card className="shadow-sm bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              Histórico de Faturas
            </CardTitle>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Próxima cobrança: {nextBillingDate}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border max-h-72 overflow-y-auto custom-scrollbar">
            {mockInvoices.map((invoice, i) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {invoiceTypeLabels[invoice.type] || invoice.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vencimento: {formatDate(invoice.dueDate)}
                      {invoice.paidAt && <span> · Pago em: {formatDate(invoice.paidAt)}</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(invoice.amount)}</p>
                  <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'} className="text-[10px]">
                    {invoice.status === 'paid' ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Upgrade de Plano
            </DialogTitle>
            <DialogDescription className="sr-only">Dialog to calculate and confirm a plan upgrade</DialogDescription>
          </DialogHeader>
          
          {upgradeStep === 'calculate' && (
            <div className="space-y-4 py-4">
              {calcLoading ? (
                <div className="flex items-center justify-center py-8">
                  <span className="h-6 w-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                </div>
              ) : upgradeCalc ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <Badge variant="outline" className="text-xs">{upgradeCalc.currentPlan.name}</Badge>
                      <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(upgradeCalc.currentPlan.price)}</p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                    <div className="text-center">
                      <Badge className="bg-emerald-600 text-white text-xs">{upgradeCalc.targetPlan.name}</Badge>
                      <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(upgradeCalc.targetPlan.price)}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Custo do upgrade:</span>
                      <span className="font-bold text-foreground">{formatCurrency(upgradeCalc.upgradeCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CB estimado +/mês:</span>
                      <span className="font-bold text-emerald-600">+{formatCurrency(upgradeCalc.estimatedMonthlyCashbackIncrease)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ROI estimado:</span>
                      <span className="font-bold text-emerald-600">{upgradeCalc.roi}%</span>
                    </div>
                  </div>

                  {upgradeCalc.newFeatures?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-2">Novos benefícios:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {upgradeCalc.newFeatures.map((f: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <Check className="h-2.5 w-2.5 mr-1" />
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setUpgradeStep('confirm')}
                  >
                    Continuar com Upgrade
                  </Button>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-4">Selecione um plano para calcular</p>
              )}
            </div>
          )}

          {upgradeStep === 'confirm' && (
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">⚠️ Confirme o Upgrade</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Você será cobrado {upgradeCalc ? formatCurrency(upgradeCalc.upgradeCost) : ''} para o upgrade para {upgradeCalc?.targetPlan?.name}.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Método de pagamento:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'credit_card', label: 'Cartão de Crédito', icon: '💳' },
                    { id: 'boleto', label: 'Boleto', icon: '📄' },
                    { id: 'pix', label: 'PIX', icon: '📱' },
                    { id: 'balance', label: 'Saldo em Conta', icon: '💰' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-3 rounded-lg border text-sm text-left flex items-center gap-2 transition-colors ${
                        paymentMethod === method.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-foreground'
                          : 'border-border hover:border-emerald-300 text-muted-foreground'
                      }`}
                    >
                      <span>{method.icon}</span>
                      <span className="text-xs font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setUpgradeStep('calculate')}>
                  Voltar
                </Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleConfirmUpgrade}>
                  Confirmar Upgrade
                </Button>
              </div>
            </div>
          )}

          {upgradeStep === 'pix_payment' && pixPaymentData && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 mb-2">
                  <Smartphone className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Pagamento via PIX</h3>
                <p className="text-xs text-muted-foreground">
                  {pixPaymentData.planName} · {formatCurrency(pixPaymentData.amount)}
                </p>
              </div>

              {/* QR Code (visual placeholder using the PIX code as data) */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
                  {/* Use a QR code service URL with the PIX code as data */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixPaymentData.pixCode)}`}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              {/* PIX Copia e Cola */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">PIX Copia e Cola:</p>
                <div className="bg-muted rounded-lg p-3 border border-border">
                  <p className="text-[11px] font-mono text-foreground break-all line-clamp-3">
                    {pixPaymentData.pixCode}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                  onClick={() => {
                    navigator.clipboard.writeText(pixPaymentData.pixCode)
                    setPixCopied(true)
                    setTimeout(() => setPixCopied(false), 2000)
                  }}
                >
                  {pixCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {pixCopied ? 'Copiado!' : 'Copiar código PIX'}
                </Button>
              </div>

              {/* Instructions */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">Como pagar:</p>
                <ol className="text-[11px] text-emerald-700 dark:text-emerald-400 space-y-1 list-decimal list-inside">
                  {(pixPaymentData.instructions || []).map((inst: string, i: number) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ol>
              </div>

              {/* TXID */}
              <div className="text-center text-[11px] text-muted-foreground">
                <span>TXID: </span>
                <span className="font-mono">{pixPaymentData.pixTxid}</span>
              </div>

              {/* Confirm payment button */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-center">
                <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">
                  Após pagar o PIX no seu banco, clique no botão abaixo para confirmar o pagamento e ativar seu plano.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setUpgradeStep('confirm')}>
                  Voltar
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  disabled={confirmingPix}
                  onClick={handleConfirmPixPayment}
                >
                  {confirmingPix ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Já paguei - Confirmar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {upgradeStep === 'success' && (
            <div className="py-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <Check className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-bold text-foreground mb-2">Upgrade Realizado!</h3>
              <p className="text-sm text-muted-foreground">
                Seu plano foi atualizado com sucesso para {upgradeCalc?.targetPlan?.name || selectedPlan}.
              </p>
              <Button
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => { setUpgradeDialogOpen(false); setUpgradeStep('calculate') }}
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Premium 5 Upgrade Dialog (Índice.docx §3) ─────────────
          Wallet-source picker + automatic deduction confirmation,
          OR PIX generation/confirmation flow. */}
      <Dialog open={premium5DialogOpen} onOpenChange={setPremium5DialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Upgrade para Premium 5 — R$ 850,00
            </DialogTitle>
            <DialogDescription className="sr-only">Escolha a carteira para débito automático do upgrade Premium 5</DialogDescription>
          </DialogHeader>

          {premium5Step === 'choose' && (
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                  Descontar Fatura Automática
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                  Escolha de qual carteira debitar R$ 850,00. Após a confirmação, os níveis 4 e 5 da matriz Entrada serão desbloqueados imediatamente.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Carteira para débito:</p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setPremium5WalletSource('withdrawal')}
                    className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-colors ${
                      premium5WalletSource === 'withdrawal'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                        : 'border-border hover:border-emerald-300'
                    }`}
                  >
                    <Wallet className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Saldo para Saque</p>
                      <p className="text-[11px] text-muted-foreground">Debita R$ 850,00 do seu saldo liberado para saque.</p>
                    </div>
                    {premium5WalletSource === 'withdrawal' && (
                      <Check className="h-4 w-4 text-emerald-600 mt-0.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setPremium5WalletSource('paymentInvoice')}
                    className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-colors ${
                      premium5WalletSource === 'paymentInvoice'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                        : 'border-border hover:border-emerald-300'
                    }`}
                  >
                    <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Saldo para Faturas</p>
                      <p className="text-[11px] text-muted-foreground">Debita R$ 850,00 do seu saldo destinado a faturas.</p>
                    </div>
                    {premium5WalletSource === 'paymentInvoice' && (
                      <Check className="h-4 w-4 text-emerald-600 mt-0.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPremium5DialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={handlePremium5Automatic}
                  disabled={premium5Processing}
                >
                  {premium5Processing ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Confirmar e Desbloquear
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {premium5Step === 'pix' && premium5PixData && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/40 mb-2">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Pagamento via PIX</h3>
                <p className="text-xs text-muted-foreground">
                  {premium5PixData.planName} · {formatCurrency(premium5PixData.amount)}
                </p>
              </div>

              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(premium5PixData.pixCode)}`}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">PIX Copia e Cola:</p>
                <div className="bg-muted rounded-lg p-3 border border-border">
                  <p className="text-[11px] font-mono text-foreground break-all line-clamp-3">
                    {premium5PixData.pixCode}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30"
                  onClick={() => {
                    navigator.clipboard.writeText(premium5PixData.pixCode)
                    setPremium5Copied(true)
                    setTimeout(() => setPremium5Copied(false), 2000)
                  }}
                >
                  {premium5Copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {premium5Copied ? 'Copiado!' : 'Copiar código PIX'}
                </Button>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-center">
                <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">
                  Após pagar o PIX no seu banco, clique no botão abaixo para confirmar o pagamento e ativar o Premium 5.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setPremium5Step('choose')}>
                  Voltar
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  disabled={premium5Processing}
                  onClick={handlePremium5ConfirmPix}
                >
                  {premium5Processing ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Já paguei - Confirmar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {premium5Step === 'success' && (
            <div className="py-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <ShieldCheck className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-bold text-foreground mb-2">Premium 5 Ativado!</h3>
              <p className="text-sm text-muted-foreground">
                Seu plano foi atualizado com sucesso. Os níveis 4 e 5 da matriz Entrada foram desbloqueados.
              </p>
              <Button
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => { setPremium5DialogOpen(false); setPremium5Step('choose') }}
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Asaas Payment Dialog (PIX / Boleto) ───────────────────
          Opened by the "Assinar (PIX / Boleto)" buttons in the Comparação
          de Planos section. Creates a fresh invoice via /api/invoices and
          lets the user pay through the Asaas gateway. */}
      <AsaasPaymentDialog
        open={asaasDialogOpen}
        onOpenChange={setAsaasDialogOpen}
        invoiceId={asaasInvoiceId}
        invoiceDescription={asaasInvoiceDescription}
        invoiceAmountCents={asaasInvoiceAmount}
        initialAsaasPaymentId={asaasInitialPaymentId}
        onPaymentCreated={handleAsaasPaymentCreated}
      />
    </div>
  )
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ')
}
