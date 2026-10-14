'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useStore } from '@/lib/store'
import { plansApi, userApi, invoicesApi, financialApi, apiFetch } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import {
  CreditCard, Check, Star, ArrowUpRight, FileText, Calendar,
  Shield, Car, Pill, ShoppingBag, Gamepad2, Trophy, Phone,
  Heart, Zap, Gift, Users, Smartphone, Clock, Calculator, TrendingUp, Sparkles, Copy,
  Lock, Wallet, ShieldCheck, AlertCircle, Loader2, QrCode
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { toast } from 'sonner'
import { AsaasPaymentDialog } from '@/components/newmobility/payment/asaas-payment-dialog'
// Task 15-e: existing pages embedded in tabs — imported AS-IS (no rewrite).
import { EarningsSimulator } from '@/components/newmobility/simulator/earnings-simulator'
import { MinhaRedePage } from '@/components/newmobility/minha-rede/minha-rede-page'
import { getCareerRank } from '@/lib/api-utils'
// ─── Task 15-e redesign subcomponents (same folder) ──────────────────
import { MyPlanHero } from './myplan-hero'
import { MyPlanQuickActions } from './myplan-quick-actions'
import {
  PlanBenefitsSection, CashbackLadderSection, MatrixLevelsSection,
  MatrixBasesSection, UpgradeSuggestionSection, Premium5UpgradeCard,
} from './myplan-sections'
import { ConquistasTab } from './myplan-conquistas-tab'
// ─── Task 15-e shared DB-driven state shapes ─────────────────────────
import type {
  ApiPlan, EntradaDataState, MergedPlan, MyPlanTab, SimConfigState,
} from './myplan-types'

const invoiceTypeLabels: Record<string, string> = {
  plan_blue3: 'Plano Blue 3',
  plan_blue5: 'Plano Blue 5 Premium',
  upgrade: 'Upgrade de Plano',
  monthly_fee: 'Mensalidade',
  residual_entry: 'Entrada Residual',
}

// ─── Invoice helpers (Task 11) ───────────────────────────────────────
// Module-level so the cashback-vendas block check (useEffect below),
// the next-billing-date derivation and the invoice history all use the
// EXACT same bucket/paid rules — no drift between call sites.
//
// Plan-bucket invoice types per src/lib/billing.ts bucketInvoiceType:
//   'plan' | 'monthly_fee' | 'plan_*' | 'subscription' | '*upgrade*'
function isPlanBucketInvoice(rawType: string | null | undefined): boolean {
  if (!rawType) return false
  const t = String(rawType).toLowerCase()
  if (t.includes('telemed')) return false
  if (t.includes('telemoby') || t.includes('talkmobi')) return false
  if (t.includes('cashback')) return false
  if (t.includes('entrada') || t.includes('residual_entry')) return false
  if (
    t === 'plan' ||
    t.startsWith('plan_') ||
    t === 'monthly_fee' ||
    t === 'subscription' ||
    t.includes('upgrade')
  ) {
    return true
  }
  return false
}

// An invoice counts as "paid" if its status is 'paid' OR it has a
// non-empty paidAt timestamp.
function isInvoicePaid(inv: { status: string | null; paidAt: string | null }): boolean {
  return (
    inv.status === 'paid' ||
    (inv.paidAt !== null && inv.paidAt !== undefined && inv.paidAt !== '')
  )
}

// Format an invoice dueDate (ISO string or YYYY-MM-DD) as dd/MM/yyyy
// (pt-BR) WITHOUT timezone drift: slicing the calendar date part and
// parsing it as LOCAL midnight guarantees the same day is rendered in
// any timezone (a bare 'YYYY-MM-DD' would be parsed as UTC midnight and
// could render as the previous day in negative offsets like America/
// Sao_Paulo). Returns '—' for null/invalid input.
function formatDueDate(dueDate: string | null | undefined): string {
  if (!dueDate) return '—'
  const datePart = String(dueDate).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return '—'
  return formatDate(`${datePart}T00:00:00`)
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
//
// ─── Plan unlock matrix (Item 6 fix, Task 2-b) ──────────────────────
// Per the corrected business rule:
//   - Free:   no cashback matrices unlocked.
//   - Blue 3: ONLY Cashback Entrada is unlocked (3 níveis).
//             Residual and Vendas are BLOCKED. (Previously the fallback
//             said "7 níveis" for Residual which was wrong — Blue 3 does
//             NOT liberate Residual or Vendas.)
//   - Blue 5: All three matrices unlocked — 5 níveis Entrada + 7 níveis
//             Residual + 9 níveis Vendas.
//
// `cashbackSales` for Blue 5 is dynamically replaced at runtime with the
// "Cashback Vendas bloqueado — pague sua fatura para liberar" message
// when the logged-in user has an unpaid plan invoice (see
// `userHasUnpaidPlanInvoice` state below).
const FALLBACK_PLANS: MergedPlan[] = [
  {
    id: 'free',
    code: 'free',
    name: 'Gratuito',
    description: 'Plano gratuito para cadastro e indicações.',
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
    // Per Task 2-b: Blue 3 description explicitly states it ONLY
    // liberates 3 levels of Cashback Entrada (not 5, and not Residual).
    description: 'Libera 3 níveis do Cashback Entrada',
    price: 'R$ 999,90/mês',
    priceCents: 99990,
    color: 'from-teal-400 to-teal-500',
    cashbackEntrada: '3 níveis',
    // FIXED (Task 2-b): Blue 3 does NOT liberate Residual or Vendas.
    // Was previously '7 níveis' which was incorrect.
    cashbackResidual: 'Bloqueado',
    cashbackSales: 'Bloqueado',
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
    description: 'Libera 5 níveis do Cashback Entrada + 7 níveis Residual + 9 níveis Vendas.',
    price: 'R$ 999,90/mês',
    priceCents: 99990,
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

// Merge an API plan with its presentation template from FALLBACK_PLANS.
// DB-sourced fields (id/code/name/priceCents) always win; presentation
// fields (color, icon-tagged features, cashback level labels) come from
// the fallback template keyed by `code`. Unknown codes get a sensible
// default presentation.
function mergeApiPlan(apiPlan: ApiPlan): MergedPlan {
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
      description: apiPlan.description || '',
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
    // Prefer the DB-sourced description when present (admin can edit it);
    // fall back to the template description so Blue 3 always shows the
    // "Libera 3 níveis do Cashback Entrada" copy even on a fresh DB.
    description: apiPlan.description || template.description,
    price: priceLabel,
    priceCents: apiPlan.priceCents,
  }
}

// Shape of a transaction row consumed by the "Ganhos no mês" hero stat.
type MonthTxRow = {
  amount?: number | null
  type?: string | null
  category?: string | null
  createdAt?: string | null
  date?: string | null
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

  // ─── Task 15-e: internal tab state (4 tabs) ──────────────────────
  // Quick actions and the tab bar share this state — no new navigation
  // keys are created; the sidebar navigation keeps working as before.
  const [activeTab, setActiveTab] = useState<MyPlanTab>('meu-plano')

  // `plans` is the runtime source of truth for the plan comparison UI.
  // Initialised with FALLBACK_PLANS so the page renders immediately
  // (no flash of empty content); replaced with DB-sourced values once
  // /api/plans resolves.
  const [plans, setPlans] = useState<MergedPlan[]>(FALLBACK_PLANS)

  // ─── Cashback Vendas block rule (Task 2-b, Item 6 #4) ────────────
  // Cashback Vendas must NOT be liberated for users who haven't paid
  // their latest plan invoice. We fetch the user's invoices from
  // /api/invoices and check whether ANY plan-bucket invoice is in a
  // pending/overdue state. When true, the comparison table replaces
  // Blue 5's `cashbackSales` ("9 níveis") with a "Bloqueado — pague
  // sua fatura para liberar" message and a warning banner is rendered
  // at the top of the page.
  //
  // The block rule applies REGARDLESS of which plan the user is on —
  // even Blue 5 users see their Cashback Vendas blocked until they
  // settle the pending invoice.
  const [userHasUnpaidPlanInvoice, setUserHasUnpaidPlanInvoice] = useState<boolean>(false)
  const [unpaidInvoiceAmount, setUnpaidInvoiceAmount] = useState<number>(0)
  const [unpaidInvoiceDueDate, setUnpaidInvoiceDueDate] = useState<string | null>(null)

  // Task 2-e (Item 5): real invoice history state. Previously the
  // "Histórico de Faturas" section rendered a hardcoded array with a
  // fake pending R$999 plan_blue5 row — now we use the same /api/invoices
  // data the page already fetches for the cashback-vendas block check,
  // so the history section shows the user's REAL invoices (paid +
  // pending) and the "Pagar Faturas" page is the single source of truth
  // for what's actually due.
  const [userInvoices, setUserInvoices] = useState<Array<{
    id: string
    amount: number
    type: string | null
    status: string | null
    dueDate: string | null
    paidAt: string | null
  }>>([])

  // ─── Task 15-e: DB-driven config state (hero + Meu Plano sections) ─
  // simConfig ← GET /api/simulator/config (public): per-plan unlock
  // rules (SystemConfig `plan.{code}.cashback_levels_*`), matrix level
  // percentages and cashback bases (`matrix.{type}.base_cents`). All
  // admin-editable — no business numbers are hardcoded client-side.
  const [simConfig, setSimConfig] = useState<SimConfigState | null>(null)
  const [simConfigLoading, setSimConfigLoading] = useState(true)

  // entradaData ← GET /api/cashback/entrada?userId= : user-specific
  // cashback ladder (L1-L5 %, locked flags from the plan unlock rule),
  // MatrixType width/depth and per-level earnings.
  const [entradaData, setEntradaData] = useState<EntradaDataState | null>(null)
  const [entradaLoading, setEntradaLoading] = useState(true)

  // monthEarnings ← GET /api/financial/transactions?type=all : real
  // cashback earned in the CURRENT month (computed client-side, same
  // rule as the financial page: type startsWith 'cashback').
  const [monthEarnings, setMonthEarnings] = useState<number | null>(null)
  const [monthEarningsLoading, setMonthEarningsLoading] = useState(true)

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

  // ─── Task 15-e: matrix config for hero + sections ─────────────────
  // GET /api/simulator/config (public, admin-editable sources). Used for
  // the fallback cashback ladder percentages, the "Bases da Matriz" stat
  // cards and the per-plan unlock counts (Residual/Vendas).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await apiFetch<SimConfigState>('/simulator/config')
        if (cancelled || !data) return
        setSimConfig({
          plans: Array.isArray(data.plans) ? data.plans : [],
          entradaLevels: Array.isArray(data.entradaLevels) ? data.entradaLevels : [],
          residualLevels: Array.isArray(data.residualLevels) ? data.residualLevels : [],
          vendasLevels: Array.isArray(data.vendasLevels) ? data.vendasLevels : [],
          cbEntradaBaseCents: Number(data.cbEntradaBaseCents ?? 0),
          cbResidualBaseCents: Number(data.cbResidualBaseCents ?? 0),
          cbVendasBaseCents: Number(data.cbVendasBaseCents ?? 0),
          directReferralPct: Number(data.directReferralPct ?? 0),
        })
      } catch (err) {
        // Fail-open: sections degrade gracefully (— placeholders).
        console.warn('Failed to load simulator config for my-plan sections:', err)
      } finally {
        if (!cancelled) setSimConfigLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // ─── Task 15-e: user cashback ladder + matrix dims ────────────────
  // GET /api/cashback/entrada?userId= — user-specific levels (with the
  // locked flag derived from the plan unlock rule in SystemConfig),
  // MatrixType width/depth and per-level real earnings.
  useEffect(() => {
    if (!user?.id) {
      setEntradaLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await apiFetch<any>(`/cashback/entrada?userId=${user.id}`)
        if (cancelled) return
        setEntradaData({
          levels: Array.isArray(data?.levels) ? data.levels : [],
          maxUnlockedLevel: Number(data?.maxUnlockedLevel ?? 0),
          matrixWidth: Number(data?.matrixWidth ?? 0),
          matrixDepth: Number(data?.matrixDepth ?? 0),
          maxMatrixSize: Number(data?.maxMatrixSize ?? 0),
          directChildren: Number(data?.directChildren ?? 0),
          totalEarnedUnlocked: Number(data?.totalEarnedUnlocked ?? 0),
        })
      } catch (err) {
        // Fail-open: hero hides the matrix chips / ladder falls back to
        // the simulator-config percentages.
        console.warn('Failed to load cashback entrada for my-plan hero:', err)
      } finally {
        if (!cancelled) setEntradaLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  // ─── Task 15-e: real monthly income for the hero ──────────────────
  // Same computation rule as the financial page ("Ganhos do mês"):
  // sums POSITIVE cashback transactions (type/category = cashback*)
  // created in the current calendar month. Amounts are cents.
  useEffect(() => {
    if (!user?.id) {
      setMonthEarnings(0)
      setMonthEarningsLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await financialApi.getTransactions(user.id, 1, 200, 'all')
        if (cancelled) return
        const txs: MonthTxRow[] = Array.isArray(data?.transactions) ? data.transactions : []
        const now = new Date()
        const curMonth = now.getMonth()
        const curYear = now.getFullYear()
        let sum = 0
        for (const tx of txs) {
          if (tx.type === 'withdrawal' || tx.type === 'withdrawal_fee') continue
          const type = String(tx.type || '')
          const isCashback = type.startsWith('cashback') || tx.category === 'cashback'
          if (!isCashback) continue
          const d = new Date(String(tx.createdAt || tx.date || ''))
          if (isNaN(d.getTime())) continue
          if (d.getMonth() === curMonth && d.getFullYear() === curYear) {
            sum += Math.max(0, Number(tx.amount) || 0)
          }
        }
        setMonthEarnings(sum)
      } catch (err) {
        // Fail-open: hero shows R$ 0,00 instead of blocking.
        console.warn('Failed to load transactions for monthly income stat:', err)
        setMonthEarnings(0)
      } finally {
        if (!cancelled) setMonthEarningsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  // Fetch the user's invoices and determine whether they have an unpaid
  // PLAN-bucket invoice. This drives the Cashback Vendas block rule
  // (Task 2-b, Item 6 #4): if any plan-bucket invoice is pending or
  // overdue, Cashback Vendas is blocked for the user until they pay.
  useEffect(() => {
    if (!user?.id) {
      setUserHasUnpaidPlanInvoice(false)
      setUnpaidInvoiceAmount(0)
      setUnpaidInvoiceDueDate(null)
      setUserInvoices([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await invoicesApi.getList(user.id)
        if (cancelled) return
        const invoices: Array<{
          id: string
          amount: number
          type: string | null
          status: string | null
          dueDate: string | null
          paidAt: string | null
        }> = Array.isArray(data?.invoices) ? data.invoices : []

        // Task 2-e (Item 5): persist the full invoice list so the
        // "Histórico de Faturas" section can render REAL invoices instead
        // of a hardcoded fake array.
        setUserInvoices(invoices)

        // Task 11: the plan-bucket/paid rules now live in the module-level
        // helpers (isPlanBucketInvoice / isInvoicePaid) so the next-billing-
        // date derivation uses the EXACT same rules as this block check.
        // We treat an invoice as "unpaid plan invoice" when:
        //   - its bucket resolves to 'plan', AND
        //   - its status is not 'paid' AND paidAt is null.
        const unpaidPlanInvoices = invoices.filter(
          (inv) => isPlanBucketInvoice(inv.type) && !isInvoicePaid(inv)
        )

        if (unpaidPlanInvoices.length > 0) {
          // Pick the most overdue / oldest pending plan invoice to surface
          // in the warning banner.
          const sorted = [...unpaidPlanInvoices].sort((a, b) => {
            const da = a.dueDate ? new Date(a.dueDate).getTime() : 0
            const db = b.dueDate ? new Date(b.dueDate).getTime() : 0
            return da - db
          })
          const earliest = sorted[0]
          setUserHasUnpaidPlanInvoice(true)
          setUnpaidInvoiceAmount(Number(earliest?.amount) || 0)
          setUnpaidInvoiceDueDate(
            earliest?.dueDate ? String(earliest.dueDate).slice(0, 10) : null
          )
        } else {
          setUserHasUnpaidPlanInvoice(false)
          setUnpaidInvoiceAmount(0)
          setUnpaidInvoiceDueDate(null)
        }
      } catch (err) {
        // Fail-open: if the invoices fetch fails, do NOT block Cashback
        // Vendas — the user might have paid and we just can't confirm.
        // The block rule is an additional safeguard, not a hard gate.
        console.warn('Failed to load invoices for cashback vendas check:', err)
        setUserHasUnpaidPlanInvoice(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  // Derived plan list: when the user has an unpaid plan invoice, replace
  // Blue 5's cashbackSales ("9 níveis") with a "Bloqueado" indicator so
  // the comparison table reflects the Cashback Vendas block rule.
  // All other plan fields stay the same. We compute this on every render
  // (cheap — just a map over 3 plans).
  const displayedPlans = userHasUnpaidPlanInvoice
    ? plans.map((p) =>
        p.code === 'blue5'
          ? {
              ...p,
              cashbackSales: 'Bloqueado — pague sua fatura',
            }
          : p
      )
    : plans

  const currentPlanData = plans.find((p) => p.id === currentPlan) || plans[2]

  // ─── Task 15-e hero/quick-action derived values (all DB-driven) ────
  const heroLoading = entradaLoading || simConfigLoading || monthEarningsLoading
  const currentUnlocks = simConfig?.plans.find((p) => p.code === currentPlan)?.unlocks
  const nextPricedPlan = plans
    .filter((p) => p.priceCents > (currentPlanData?.priceCents ?? 0))
    .sort((a, b) => a.priceCents - b.priceCents)[0]
  const upgradeLabel = isBlue3
    ? 'Upgrade para Premium 5'
    : nextPricedPlan
      ? `Upgrade para ${nextPricedPlan.name}`
      : 'Comparar planos'

  // Quick action "Fazer Upgrade": reuses the EXISTING dialog flows —
  // Blue 3 → the Premium 5 wallet-source dialog; other plans → the
  // generic upgrade dialog for the next DB-priced plan; on top plan →
  // scroll to the upgrade/comparison section of the Meu Plano tab.
  const handleQuickUpgrade = () => {
    if (isBlue3) {
      openPremium5Dialog()
      return
    }
    if (nextPricedPlan) {
      handleCalculateUpgrade(nextPricedPlan.id)
      return
    }
    setActiveTab('meu-plano')
    setTimeout(() => {
      document.getElementById('plan-upgrade-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  // ─── Next billing date (Task 11 — no more hardcoded dates) ────────
  // Derived from the user's REAL invoices (`userInvoices`, fetched above
  // from /api/invoices): it is the EARLIEST dueDate among the user's
  // UNPAID plan-bucket invoices (plan / plan_* / monthly_fee /
  // subscription / *upgrade*). When nothing is pending we render '—'
  // instead of a fake fixed date. Rendering uses formatDueDate (dd/MM/yyyy
  // pt-BR, timezone-safe).
  const nextUnpaidPlanInvoice = [...userInvoices]
    .filter((inv) => isPlanBucketInvoice(inv.type) && !isInvoicePaid(inv))
    .sort((a, b) => {
      const da = a.dueDate ? new Date(String(a.dueDate).slice(0, 10) + 'T00:00:00').getTime() : Infinity
      const db = b.dueDate ? new Date(String(b.dueDate).slice(0, 10) + 'T00:00:00').getTime() : Infinity
      return da - db
    })[0]
  const nextBillingDate = formatDueDate(nextUnpaidPlanInvoice?.dueDate)
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
      // Task 11: the ROI fallback now derives from the REAL DB-sourced
      // plan price (plans state) instead of a hardcoded 45000/R$ 850
      // divisor. The increase estimates mirror /api/plans/calculate-
      // upgrade (blue5 unlock = entrada L4+L5 potential ≈ R$ 9.600/mês;
      // blue3 ≈ R$ 150/mês) so the fallback stays consistent with the
      // API response shape.
      const estimatedIncrease = planId === 'blue5' ? 960000 : 15000
      setUpgradeCalc({
        currentPlan: { id: currentPlan, name: planNames[currentPlan], price: currentPrice },
        targetPlan: { id: planId, name: planNames[planId], price: targetPrice },
        upgradeCost: targetPrice - currentPrice,
        monthlyDifference: targetPrice - currentPrice,
        newFeatures: planId === 'blue5' ? ['CashBack Shopping', 'Portal Gamer', 'Portal Sport Bet', 'Seguro Auto', 'Seguro de Vida', 'Telemedicina'] : ['CashBack Mobilidade', 'CashBack Farmácia'],
        estimatedMonthlyCashbackIncrease: estimatedIncrease,
        roi: targetPrice > 0 ? Math.round((estimatedIncrease / targetPrice) * 100) : 0,
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
  //      'paymentInvoice'. Backend deducts the upgrade amount instantly
  //      and unlocks entrada levels 4-5.
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Meu Plano</h2>
          <p className="text-sm text-muted-foreground">Gerencie seu plano e acompanhe suas faturas</p>
        </div>
      </div>

      {/* ─── Task 15-e: HERO — gradient summary card ──────────────────
          All values DB-driven: plan name/price (/api/plans), status
          badge (user.isActive + unpaid plan invoice), matrix chips +
          L1-L5 cashback ladder (/api/cashback/entrada), graduação
          (getCareerRank over user.careerPoints) and real current-month
          cashback income (/api/financial/transactions). */}
      <MyPlanHero
        loading={heroLoading}
        plan={currentPlanData}
        isActive={Boolean(user?.isActive)}
        hasUnpaidInvoice={userHasUnpaidPlanInvoice}
        careerRankName={careerRank.name}
        nextBillingDate={nextBillingDate}
        monthEarnings={monthEarningsLoading ? null : monthEarnings}
        entrada={entradaData}
        fallbackPercentages={simConfig?.entradaLevels}
        showUpgrade={isBlue3 || Boolean(nextPricedPlan)}
        upgradeLabel={upgradeLabel}
        onUpgrade={handleQuickUpgrade}
      />

      {/* ─── Task 15-e: QUICK ACTIONS — wire to the internal tab state */}
      <MyPlanQuickActions
        onSimulate={() => setActiveTab('simulador')}
        onNetwork={() => setActiveTab('rede')}
        onUpgrade={handleQuickUpgrade}
        upgradeLabel={upgradeLabel}
      />

      {/* ─── Cashback Vendas block warning (Task 2-b, Item 6 #4) ───
          When the user has at least one unpaid PLAN-bucket invoice,
          Cashback Vendas is blocked. Show a prominent banner so the
          user knows exactly what to do to unblock it. */}
      {userHasUnpaidPlanInvoice && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                    Cashback Vendas bloqueado — pague sua fatura para liberar
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                    Detectamos uma fatura de plano{' '}
                    {unpaidInvoiceAmount > 0 && (
                      <span className="font-semibold">
                        ({formatCurrency(unpaidInvoiceAmount)})
                      </span>
                    )}{' '}
                    {unpaidInvoiceDueDate && (
                      <>com vencimento em <span className="font-semibold">{formatDate(unpaidInvoiceDueDate)}</span>{' '}</>
                    )}
                    em aberto. O Cashback Vendas só é liberado após a
                    quitação da mensalidade. Regularize sua fatura para
                    voltar a receber as comissões da matriz de Vendas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Task 15-e: 4 TABS (Meu Plano / Simulador / Rede / Conquistas) ── */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as MyPlanTab)}
        className="w-full"
      >
        <TabsList
          className="w-full h-auto grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-2xl p-1.5 bg-muted"
          aria-label="Seções do Meu Plano"
        >
          <TabsTrigger
            value="meu-plano"
            className="gap-1.5 rounded-xl py-2.5 min-h-[44px] text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400"
          >
            <CreditCard className="h-4 w-4" aria-hidden />
            Meu Plano
          </TabsTrigger>
          <TabsTrigger
            value="simulador"
            className="gap-1.5 rounded-xl py-2.5 min-h-[44px] text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400"
          >
            <Calculator className="h-4 w-4" aria-hidden />
            Simulador
          </TabsTrigger>
          <TabsTrigger
            value="rede"
            className="gap-1.5 rounded-xl py-2.5 min-h-[44px] text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400"
          >
            <Users className="h-4 w-4" aria-hidden />
            Minha Rede
          </TabsTrigger>
          <TabsTrigger
            value="conquistas"
            className="gap-1.5 rounded-xl py-2.5 min-h-[44px] text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400"
          >
            <Trophy className="h-4 w-4" aria-hidden />
            Conquistas
          </TabsTrigger>
        </TabsList>

        {/* ═══ TAB: MEU PLANO — reorganized into clear DB-driven sections ═══ */}
        <TabsContent value="meu-plano" className="mt-4 space-y-4 sm:space-y-6 focus-visible:outline-none">
          {/* (a) Plano Atual — benefits w/ check icons + mensalidade + auto-debit */}
          <PlanBenefitsSection
            plan={currentPlanData}
            nextBillingDate={nextBillingDate}
            autoDebitEnabled={autoDebitEnabled}
            autoDebitSaving={autoDebitSaving}
            onToggleAutoDebit={handleToggleAutoDebit}
          />

          {/* (b) Cashback por Nível — visual ladder/progress (DB-driven) */}
          <CashbackLadderSection
            levels={entradaData?.levels}
            fallbackPercentages={simConfig?.entradaLevels}
            loading={entradaLoading}
          />

          {/* (c) Níveis da Matriz desbloqueados + (d) Bases da Matriz */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
            <MatrixLevelsSection
              maxUnlockedLevel={entradaData?.maxUnlockedLevel}
              unlocks={currentUnlocks}
              loading={heroLoading}
            />
            <MatrixBasesSection
              simConfig={simConfig}
              unlocks={currentUnlocks}
              loading={simConfigLoading}
            />
          </div>

          {/* (e) Sugestão de Upgrade — next DB-priced plan */}
          <UpgradeSuggestionSection
            plans={plans}
            currentPlanId={currentPlan}
            onSelect={handleCalculateUpgrade}
          />

          {/* Blue 3 → Premium 5 special flows (wallet deduction / PIX) —
              preserved exactly; only the container was restyled. */}
          {isBlue3 && (
            <Premium5UpgradeCard
              onOpenAutomaticDialog={openPremium5Dialog}
              onPayPix={handlePremium5Manual}
              processing={premium5Processing}
            />
          )}

          {/* Upgrade Simulator Slider (existing feature, kept) */}
          <Card className="rounded-2xl shadow-sm bg-card border-0">
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

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  {plans.filter(p => p.id !== 'free').map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      aria-pressed={selectedPlan === plan.id}
                      className={cn(
                        'flex-1 p-4 rounded-2xl border-2 transition-all text-center min-h-[44px]',
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
                    className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800"
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
                          {/* Task 11: dynamic from /api/plans/calculate-upgrade
                              (upgradeCalc) instead of hardcoded values. */}
                          {upgradeCalc ? `+${formatCurrency(upgradeCalc.estimatedMonthlyCashbackIncrease)}` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ROI Estimado</p>
                        <p className="text-lg font-bold text-emerald-600">
                          {/* Task 11: dynamic ROI from upgradeCalc (computed
                              server-side against the real DB plan price). */}
                          {upgradeCalc && typeof upgradeCalc.roi === 'number' ? `${upgradeCalc.roi}%` : '—'}
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
              {displayedPlans.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={`rounded-2xl shadow-sm relative overflow-hidden bg-card border-0 ${
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
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px]"
                            onClick={() => handleCalculateUpgrade(plan.id)}
                          >
                            {plan.priceCents > (displayedPlans.find((p) => p.id === currentPlan)?.priceCents || 0) ? 'Fazer Upgrade' : 'Selecionar'}
                          </Button>
                          {plan.priceCents > 0 && (
                            <Button
                              variant="outline"
                              className="w-full gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30 min-h-[44px]"
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
              <Card className="rounded-2xl shadow-sm bg-card border-0">
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 text-muted-foreground font-medium">Benefício</th>
                        {displayedPlans.map((plan) => (
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
                        {displayedPlans.map((plan) => (
                          <td key={plan.id} className="p-3 text-center text-xs font-medium">
                            {plan.cashbackEntrada === '-' ? <span className="text-muted-foreground/30">—</span>
                              : plan.cashbackEntrada === 'Bloqueado' ? (
                                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                  <Lock className="h-3 w-3" />
                                  Bloqueado
                                </span>
                              ) : <span className="text-emerald-600">{plan.cashbackEntrada}</span>}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 text-muted-foreground font-medium text-xs">CashBack Residual</td>
                        {displayedPlans.map((plan) => (
                          <td key={plan.id} className="p-3 text-center text-xs font-medium">
                            {plan.cashbackResidual === '-' ? <span className="text-muted-foreground/30">—</span>
                              : plan.cashbackResidual === 'Bloqueado' ? (
                                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                  <Lock className="h-3 w-3" />
                                  Bloqueado
                                </span>
                              ) : <span className="text-emerald-600">{plan.cashbackResidual}</span>}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b bg-muted/30">
                        <td className="p-3 text-muted-foreground font-medium text-xs">CashBack Vendas</td>
                        {displayedPlans.map((plan) => (
                          <td key={plan.id} className="p-3 text-center text-xs font-medium">
                            {plan.cashbackSales === '-' ? (
                              <span className="text-muted-foreground/30">—</span>
                            ) : plan.cashbackSales === 'Bloqueado' || plan.cashbackSales.startsWith('Bloqueado') ? (
                              <span
                                className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"
                                title="Pague sua fatura para liberar o Cashback Vendas"
                              >
                                <Lock className="h-3 w-3" />
                                {plan.cashbackSales}
                              </span>
                            ) : (
                              <span className="text-emerald-600">{plan.cashbackSales}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                      {displayedPlans[0].features.map((feature, fi) => (
                        <tr key={fi} className={`border-b ${fi % 2 === 0 ? '' : 'bg-muted/30'}`}>
                          <td className="p-3 text-muted-foreground text-xs flex items-center gap-1.5">
                            <feature.icon className="h-3.5 w-3.5 text-muted-foreground" />
                            {feature.label}
                          </td>
                          {displayedPlans.map((plan) => (
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
                        {displayedPlans.map((plan) => (
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
          <Card className="rounded-2xl shadow-sm bg-card border-0">
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
                {/* Task 2-e (Item 5): render REAL invoices from /api/invoices
                    (the previous hardcoded mock array contained a fake
                    pending R$999 plan_blue5 row). When the user has no real
                    invoices, show a friendly empty-state instead of fake
                    history. */}
                {userInvoices.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    Nenhuma fatura encontrada ainda. Suas cobranças aparecerão
                    aqui assim que forem geradas.
                  </div>
                ) : (
                  userInvoices.slice(0, 20).map((invoice, i) => {
                    const paid =
                      invoice.status === 'paid' ||
                      (invoice.paidAt !== null && invoice.paidAt !== undefined && invoice.paidAt !== '')
                    const label =
                      invoiceTypeLabels[invoice.type || ''] ||
                      invoice.type ||
                      'Fatura'
                    return (
                      <motion.div
                        key={invoice.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            paid ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Vencimento: {invoice.dueDate ? formatDate(invoice.dueDate) : '—'}
                              {paid && invoice.paidAt && <span> · Pago em: {formatDate(invoice.paidAt)}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(invoice.amount)}</p>
                          <Badge variant={paid ? 'default' : 'outline'} className="text-[10px]">
                            {paid ? 'Pago' : 'Pendente'}
                          </Badge>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB: SIMULADOR — existing component, untouched ═══ */}
        <TabsContent value="simulador" className="mt-4 focus-visible:outline-none">
          <EarningsSimulatorTab />
        </TabsContent>

        {/* ═══ TAB: REDE — existing component, untouched ═══ */}
        <TabsContent value="rede" className="mt-4 focus-visible:outline-none">
          <MinhaRedeTab />
        </TabsContent>

        {/* ═══ TAB: CONQUISTAS — achievements grid + streak mini-cards ═══ */}
        <TabsContent value="conquistas" className="mt-4 focus-visible:outline-none">
          <ConquistasTab />
        </TabsContent>
      </Tabs>

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
                      aria-pressed={paymentMethod === method.id}
                      className={`p-3 rounded-lg border text-sm text-left flex items-center gap-2 transition-colors min-h-[44px] ${
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
                    aria-pressed={premium5WalletSource === 'withdrawal'}
                    className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-colors min-h-[44px] ${
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
                    aria-pressed={premium5WalletSource === 'paymentInvoice'}
                    className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-colors min-h-[44px] ${
                      premium5WalletSource === 'paymentInvoice'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                        : 'border-border hover:border-emerald-300'
                    }`}
                  >
                    <FileText className="h-4 w-4 text-teal-600 mt-0.5" />
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
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-950/40 mb-2">
                  <Smartphone className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Pagamento via PIX</h3>
                <p className="text-xs text-muted-foreground">
                  {premium5PixData.planName} · {formatCurrency(premium5PixData.amount)}
                </p>
              </div>

              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl border-2 border-teal-200 dark:border-teal-800">
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
                  className="w-full gap-2 border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950/30"
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

// ─── Tab wrappers (Task 15-e) ─────────────────────────────────────────
// The Simulador (earnings-simulator.tsx) and Minha Rede (minha-rede-
// page.tsx) components are full pages on their own — they are embedded
// AS-IS (zero rewrites) inside a light wrapper that only normalizes
// spacing for the tab context.

function EarningsSimulatorTab() {
  return (
    <div className="space-y-4" aria-label="Simulador de ganhos">
      <EarningsSimulator />
    </div>
  )
}

function MinhaRedeTab() {
  return (
    <div className="space-y-4" aria-label="Minha rede">
      <MinhaRedePage />
    </div>
  )
}
