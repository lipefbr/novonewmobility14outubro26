'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Smartphone,
  HeartPulse,
  Check,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  Star,
  Gift,
  ArrowRight,
  Wifi,
  Clock as ClockIcon,
  ShieldCheck,
  Plus,
  Trash2,
  Loader2,
  ExternalLink,
  User,
  Users,
  MapPin,
  RefreshCw,
  CreditCard,
  Receipt,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { useStore } from '@/lib/store'
import { EmptyState } from '../ui/empty-states'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

// Telemedicina monthly price (in BRL cents). Kept in sync with
// /api/telemedicina/request/route.ts `TELEMEDICINA_PRICE_CENTS` so the UI
// and the (admin-side) review show the same number. Mirrored here as a
// constant — the API does not currently expose a GET for the price.
const TELEMEDICINA_PRICE_CENTS = 4990

const TELEMEDICINA_PRICE_BRL = (TELEMEDICINA_PRICE_CENTS / 100).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

type TelemedPaymentMethod = 'pix' | 'boleto' | 'credit_card'

const PAYMENT_METHOD_OPTIONS: { value: TelemedPaymentMethod; label: string; description: string; icon: typeof CreditCard }[] = [
  { value: 'pix', label: 'PIX', description: 'Aprovação imediata após pagamento', icon: CreditCard },
  { value: 'boleto', label: 'Boleto', description: 'Vence em 3 dias úteis', icon: Receipt },
  { value: 'credit_card', label: 'Cartão de Crédito', description: 'Cobrança automática mensal', icon: CreditCard },
]

function paymentMethodLabel(method: string | null): string | null {
  if (!method) return null
  const opt = PAYMENT_METHOD_OPTIONS.find((o) => o.value === method)
  return opt?.label ?? method
}

interface TalkMobiPlanDTO {
  id: string
  name: string
  dataAmount: string
  priceCents: number
  cashbackCents: number
  rewardPoints: number
  description: string | null
  features: string[]
  isPopular: boolean
  isRecommended: boolean
  sortOrder: number
  priceFormatted: string
  cashbackFormatted: string
}

interface ApiResponse {
  plans: TalkMobiPlanDTO[]
}

interface TelemedicinaDependent {
  name?: string
  kinship?: string
  birthDate?: string
  cpf?: string
}

interface TelemedicinaRequestDTO {
  id: string
  userId: string
  fullName: string
  cpf: string
  birthDate: string | null
  phone: string
  email: string
  dependents: TelemedicinaDependent[]
  notes: string | null
  paymentMethod: string | null
  paymentMethodLabel: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  adminNotes: string | null
  activationLink: string | null
  approvedAt: string | null
  rejectedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

interface TelemedicinaResponse {
  request: TelemedicinaRequestDTO | null
}

/**
 * Subscription request for a TalkMobi mobile plan. Created when the user
 * clicks "Assinar" on a plan card; the admin reviews it in the panel and
 * approves (attaching an activation link / ICCID) or rejects with a reason.
 * Mirrors the TelemedicinaRequestDTO contract.
 */
interface TalkMobiSubscriptionDTO {
  id: string
  userId: string
  planId: string
  planName: string
  dataAmount: string
  priceCents: number
  cashbackCents: number
  rewardPoints: number
  fullName: string
  cpf: string
  birthDate: string | null
  phone: string
  email: string
  zipCode: string | null
  street: string | null
  number: string | null
  complement: string | null
  district: string | null
  city: string | null
  state: string | null
  notes: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  adminNotes: string | null
  activationLink: string | null
  approvedAt: string | null
  rejectedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

interface TalkMobiSubscriptionResponse {
  request: TalkMobiSubscriptionDTO | null
  requests: TalkMobiSubscriptionDTO[]
}

/**
 * Hardcoded fallback catalogue shown if the API returns no plans (e.g.
 * the DB is unreachable, the table is empty, or the auto-seed in
 * /api/talkmobi/plans failed). Mirrors the four canonical plans in
 * src/lib/seed-talkmobi.ts so the user always sees something useful,
 * even on a totally broken backend. The `id` field uses the same slug
 * so React reconciliation stays stable when the API recovers.
 */
const FALLBACK_PLANS: TalkMobiPlanDTO[] = [
  {
    id: 'talkmobi-10gb',
    name: 'Plano 10 GB',
    dataAmount: '10 GB',
    priceCents: 2990,
    cashbackCents: 0,
    rewardPoints: 0,
    description: null,
    features: [
      '10 GB de internet',
      'Ligações ilimitadas',
      'SMS ilimitado',
      'App TalkMobi',
    ],
    isPopular: false,
    isRecommended: false,
    sortOrder: 1,
    priceFormatted: 'R$ 29,90',
    cashbackFormatted: 'R$ 0,00',
  },
  {
    id: 'talkmobi-20gb',
    name: 'Plano 20 GB',
    dataAmount: '20 GB',
    priceCents: 3990,
    cashbackCents: 0,
    rewardPoints: 0,
    description: null,
    features: [
      '20 GB de internet',
      'Ligações ilimitadas',
      'SMS ilimitado',
      'App TalkMobi',
      'Roaming nacional',
    ],
    isPopular: true,
    isRecommended: false,
    sortOrder: 2,
    priceFormatted: 'R$ 39,90',
    cashbackFormatted: 'R$ 0,00',
  },
  {
    id: 'talkmobi-50gb',
    name: 'Plano 50 GB',
    dataAmount: '50 GB',
    priceCents: 5990,
    cashbackCents: 0,
    rewardPoints: 0,
    description: null,
    features: [
      '50 GB de internet',
      'Ligações ilimitadas',
      'SMS ilimitado',
      'App TalkMobi',
      'Roaming nacional',
      '5G prioritário',
    ],
    isPopular: false,
    isRecommended: true,
    sortOrder: 3,
    priceFormatted: 'R$ 59,90',
    cashbackFormatted: 'R$ 0,00',
  },
  {
    id: 'talkmobi-ilimitado',
    name: 'Plano Ilimitado',
    dataAmount: 'Ilimitado',
    priceCents: 9990,
    cashbackCents: 0,
    rewardPoints: 0,
    description: null,
    features: [
      'Internet ilimitada',
      'Ligações ilimitadas',
      'SMS ilimitado',
      'App TalkMobi',
      'Roaming nacional/internacional',
      '5G prioritário',
      'Telemedicina inclusa',
    ],
    isPopular: false,
    isRecommended: false,
    sortOrder: 4,
    priceFormatted: 'R$ 99,90',
    cashbackFormatted: 'R$ 0,00',
  },
]

export function TalkMobiPage() {
  const { user } = useStore()
  const [plans, setPlans] = useState<TalkMobiPlanDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [telemedOpen, setTelemedOpen] = useState(false)
  const [telemedDetailsOpen, setTelemedDetailsOpen] = useState(false)
  const [telemedRequest, setTelemedRequest] = useState<TelemedicinaRequestDTO | null>(null)
  const [telemedLoading, setTelemedLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // ===== TalkMobi subscription state =====
  // The user's most recent subscription request across all plans, plus the
  // full list (so we can show "you already have a pending request for X"
  // if they try to subscribe to a second plan while one is in flight).
  const [subRequest, setSubRequest] = useState<TalkMobiSubscriptionDTO | null>(null)
  const [subRequests, setSubRequests] = useState<TalkMobiSubscriptionDTO[]>([])
  const [subLoading, setSubLoading] = useState(true)
  const [subSubmitting, setSubSubmitting] = useState(false)
  // Subscribe dialog open/close + the plan the user is currently subscribing to
  const [subscribeOpen, setSubscribeOpen] = useState(false)
  const [subscribePlan, setSubscribePlan] = useState<TalkMobiPlanDTO | null>(null)

  // Activation form state (Telemedicina)
  const [form, setForm] = useState({
    fullName: '',
    cpf: '',
    birthDate: '',
    phone: '',
    email: '',
    notes: '',
  })
  const [dependents, setDependents] = useState<TelemedicinaDependent[]>([])
  // Payment-method selection — required to submit. Defaults to `pix` for
  // convenience (the most common choice), but the user can change it.
  const [paymentMethod, setPaymentMethod] = useState<TelemedPaymentMethod>('pix')

  // TalkMobi subscription form state — holder + shipping address for the SIM chip
  const [subForm, setSubForm] = useState({
    fullName: '',
    cpf: '',
    birthDate: '',
    phone: '',
    email: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
    notes: '',
  })

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await apiFetch<ApiResponse>('/talkmobi/plans')
        if (cancelled || !data) return
        const apiPlans = Array.isArray(data.plans) ? data.plans : []
        if (apiPlans.length > 0) {
          setPlans(apiPlans)
        } else {
          // API responded but the table is empty / seed failed — fall
          // back to the hardcoded catalogue so the page is never blank.
          console.warn('TalkMobi API returned no plans — using hardcoded fallback.')
          setPlans(FALLBACK_PLANS)
        }
      } catch (err) {
        // Network / 500 error — also fall back to the hardcoded list so
        // the user still sees the four plans even if the backend is down.
        console.error('TalkMobi plans load failed — using hardcoded fallback:', err)
        setPlans(FALLBACK_PLANS)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Fetch the user's most recent Telemedicina activation request so we
  // can show its status (pending / approved / rejected) and, when
  // approved, the activation link the admin sent.
  useEffect(() => {
    let cancelled = false
    const loadReq = async () => {
      if (!user?.id) {
        setTelemedLoading(false)
        return
      }
      try {
        const data = await apiFetch<TelemedicinaResponse>(`/telemedicina/request?userId=${user.id}`)
        if (cancelled || !data) return
        setTelemedRequest(data.request ?? null)
        // Pre-fill the form with the existing request data (if any) so
        // the user can edit and resubmit without retyping everything.
        if (data.request) {
          setForm({
            fullName: data.request.fullName || '',
            cpf: data.request.cpf || '',
            birthDate: data.request.birthDate || '',
            phone: data.request.phone || '',
            email: data.request.email || '',
            notes: data.request.notes || '',
          })
          setDependents(Array.isArray(data.request.dependents) ? data.request.dependents : [])
          // Restore the previously chosen payment method (if any).
          const restored = data.request.paymentMethod as TelemedPaymentMethod | null
          if (restored === 'pix' || restored === 'boleto' || restored === 'credit_card') {
            setPaymentMethod(restored)
          }
        } else if (user) {
          // Pre-fill with the user's store data for convenience
          setForm((f) => ({
            ...f,
            fullName: user.name || '',
            phone: user.phone || '',
            email: user.email || '',
            cpf: user.cpf || '',
          }))
        }
      } catch (err) {
        console.error('Telemedicina request load failed:', err)
      } finally {
        if (!cancelled) setTelemedLoading(false)
      }
    }
    loadReq()
    return () => { cancelled = true }
  }, [user?.id, user?.name, user?.email, user?.phone, user?.cpf])

  // ===== Fetch the user's TalkMobi subscription request(s) =====
  // We pull the most recent one (for the status banner) plus all of them
  // (so we can detect an existing pending request for the same plan).
  useEffect(() => {
    let cancelled = false
    const loadSub = async () => {
      if (!user?.id) {
        setSubLoading(false)
        return
      }
      try {
        const data = await apiFetch<TalkMobiSubscriptionResponse>(`/talkmobi/subscribe?userId=${user.id}`)
        if (cancelled || !data) return
        setSubRequest(data.request ?? null)
        setSubRequests(data.requests ?? [])
      } catch (err) {
        console.error('TalkMobi subscription load failed:', err)
      } finally {
        if (!cancelled) setSubLoading(false)
      }
    }
    loadSub()
    return () => { cancelled = true }
  }, [user?.id])

  /**
   * Open the subscription dialog for a plan. Pre-fills the form with the
   * user's store data (name/phone/email/cpf) and, if they already have a
   * pending request for this same plan, restores their previously typed
   * values so they can edit and resubmit without retyping.
   */
  const handleSubscribe = (plan: TalkMobiPlanDTO) => {
    if (!user?.id) {
      toast.error('Você precisa estar logado para assinar um plano.')
      return
    }
    // Block free-plan users right away with a helpful message — the backend
    // enforces this too, but doing it here avoids a frustrating round-trip.
    if (user.plan === 'free' && user.role !== 'admin') {
      toast.error('Você precisa assinar um plano da NewMobility antes de contratar o TalkMobi. Acesse "Meu Plano".')
      return
    }
    setSubscribePlan(plan)
    // Look for an existing PENDING request for the SAME plan to pre-fill
    const existing = subRequests.find(
      (r) => r.planId === plan.id && r.status === 'pending',
    )
    if (existing) {
      setSubForm({
        fullName: existing.fullName || '',
        cpf: existing.cpf || '',
        birthDate: existing.birthDate || '',
        phone: existing.phone || '',
        email: existing.email || '',
        zipCode: existing.zipCode || '',
        street: existing.street || '',
        number: existing.number || '',
        complement: existing.complement || '',
        district: existing.district || '',
        city: existing.city || '',
        state: existing.state || '',
        notes: existing.notes || '',
      })
    } else {
      // Pre-fill with the user's store data for convenience
      setSubForm({
        fullName: user.name || '',
        cpf: user.cpf || '',
        birthDate: '',
        phone: user.phone || '',
        email: user.email || '',
        zipCode: '',
        street: '',
        number: '',
        complement: '',
        district: '',
        // city/state are not on the UserData interface — leave blank, the
        // user can type them once and the value is persisted in the request.
        city: '',
        state: '',
        notes: '',
      })
    }
    setSubscribeOpen(true)
  }

  /**
   * Submit the subscription request to /api/talkmobi/subscribe. The admin
   * will review it in the panel; we show a success toast and update the
   * local state so the status banner appears immediately.
   */
  const handleSubmitSubscribe = async () => {
    if (!user?.id || !subscribePlan) {
      toast.error('Usuário não autenticado ou plano inválido.')
      return
    }
    if (!subForm.fullName || !subForm.cpf || !subForm.phone || !subForm.email) {
      toast.error('Preencha todos os campos obrigatórios.')
      return
    }
    setSubSubmitting(true)
    try {
      const res = await apiFetch<{ request: TalkMobiSubscriptionDTO; message?: string }>('/talkmobi/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          planId: subscribePlan.id,
          fullName: subForm.fullName,
          cpf: subForm.cpf,
          birthDate: subForm.birthDate || undefined,
          phone: subForm.phone,
          email: subForm.email,
          zipCode: subForm.zipCode || undefined,
          street: subForm.street || undefined,
          number: subForm.number || undefined,
          complement: subForm.complement || undefined,
          district: subForm.district || undefined,
          city: subForm.city || undefined,
          state: subForm.state || undefined,
          notes: subForm.notes || undefined,
        }),
      })
      setSubRequest(res.request)
      // Refresh the full list so the "already pending" detection stays accurate
      try {
        const fresh = await apiFetch<TalkMobiSubscriptionResponse>(`/talkmobi/subscribe?userId=${user.id}`)
        if (fresh) {
          setSubRequest(fresh.request ?? null)
          setSubRequests(fresh.requests ?? [])
        }
      } catch {
        // non-fatal — the POST response already updated the primary request
      }
      setSubscribeOpen(false)
      toast.success(res.message || 'Pedido de assinatura enviado com sucesso!')
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao enviar pedido. Tente novamente.')
    } finally {
      setSubSubmitting(false)
    }
  }

  const handleAddDependent = () => {
    setDependents((d) => [...d, { name: '', kinship: '', birthDate: '', cpf: '' }])
  }

  const handleRemoveDependent = (idx: number) => {
    setDependents((d) => d.filter((_, i) => i !== idx))
  }

  const handleDependentChange = (idx: number, field: keyof TelemedicinaDependent, value: string) => {
    setDependents((d) => d.map((dep, i) => (i === idx ? { ...dep, [field]: value } : dep)))
  }

  const handleSubmitTelemed = async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado.')
      return
    }
    if (!form.fullName || !form.cpf || !form.phone || !form.email) {
      toast.error('Preencha todos os campos obrigatórios.')
      return
    }
    if (!paymentMethod) {
      toast.error('Selecione a forma de pagamento.')
      return
    }
    setSubmitting(true)
    try {
      const res = await apiFetch<{ request: TelemedicinaRequestDTO; message?: string }>('/telemedicina/request', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          fullName: form.fullName,
          cpf: form.cpf,
          birthDate: form.birthDate || undefined,
          phone: form.phone,
          email: form.email,
          dependents,
          notes: form.notes || undefined,
          paymentMethod,
        }),
      })
      setTelemedRequest(res.request)
      setTelemedOpen(false)
      // Per BACK-2: the admin will approve and then send the actual
      // payment link (PIX / Boleto / Cartão) to the user.
      const methodLabel = paymentMethodLabel(paymentMethod) ?? paymentMethod
      toast.success(
        res.message ||
          `Pedido enviado! Após aprovação do admin, você receberá o link de pagamento ${methodLabel}.`,
        {
          description: `Pagamento via ${methodLabel} · ${TELEMEDICINA_PRICE_BRL}/mês`,
        },
      )
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao enviar pedido. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <Smartphone className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" />
          TalkMobi + Telemedicina
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Planos de celular e saúde para sua família
        </p>
      </div>

      {/* ===== TalkMobi Plans Section ===== */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Wifi className="h-4 w-4" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-foreground">
            Planos TalkMobi
          </h3>
          {subRequest && (
            <Badge
              variant="outline"
              className={
                subRequest.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 text-[11px]'
                  : subRequest.status === 'pending'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800 text-[11px]'
                    : subRequest.status === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800 text-[11px]'
                      : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800 text-[11px]'
              }
            >
              {subRequest.status === 'approved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {subRequest.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
              {subRequest.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
              {subRequest.status === 'approved'
                ? `${subRequest.planName} ativo`
                : subRequest.status === 'pending'
                  ? `${subRequest.planName} em análise`
                  : subRequest.status === 'rejected'
                    ? `${subRequest.planName} recusado`
                    : 'Cancelado'}
            </Badge>
          )}
        </div>

        {/* ===== SUBSCRIPTION STATUS BANNER =====
            Mirrors the Telemedicina status cards: pending → "in review",
            approved → activation link, rejected → reason + resubmit. */}
        {subRequest?.status === 'approved' && (
          <Card className="rounded-2xl shadow-sm overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
            <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <h4 className="text-base md:text-lg font-bold text-emerald-800 dark:text-emerald-300">
                    {subRequest.planName} ativado! 🎉
                  </h4>
                  <p className="text-xs md:text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    Seu plano TalkMobi <strong>{subRequest.dataAmount}</strong> foi aprovado.
                    {subRequest.activationLink
                      ? ' Use o link de ativação abaixo para começar a usar agora mesmo.'
                      : ' Abra o app TalkMobi ou aguarde o contato da equipe para finalizar a ativação.'}
                  </p>
                  {subRequest.activationLink && (
                    <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-white/60 dark:bg-white/5 border border-emerald-200 dark:border-emerald-800">
                      <ExternalLink className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <a
                        href={subRequest.activationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs md:text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline truncate flex-1 min-w-0"
                      >
                        {subRequest.activationLink}
                      </a>
                    </div>
                  )}
                  {subRequest.adminNotes && (
                    <p className="text-[11px] md:text-xs text-emerald-700/80 dark:text-emerald-400/80 italic mt-1">
                      Obs. do administrador: {subRequest.adminNotes}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {subRequest?.status === 'pending' && (
          <Card className="rounded-2xl shadow-sm overflow-hidden bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800">
            <div className="h-1 bg-gradient-to-r from-amber-400 to-yellow-400" />
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                <div className="p-3 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 shrink-0">
                  <Clock className="h-6 w-6 md:h-7 md:w-7 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <h4 className="text-base md:text-lg font-bold text-amber-800 dark:text-amber-300">
                    Pedido do {subRequest.planName} em análise
                  </h4>
                  <p className="text-xs md:text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                    Recebemos seu pedido de assinatura para o plano <strong>{subRequest.planName}</strong> ({subRequest.dataAmount}).
                    Nossa equipe está analisando e em breve você receberá o link de ativação aqui mesmo e nas notificações.
                  </p>
                </div>
                {/* Re-open the form pre-filled so the user can correct typos while waiting */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const plan = plans.find((p) => p.id === subRequest.planId)
                    if (plan) handleSubscribe(plan)
                  }}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/40 w-full md:w-auto shrink-0"
                >
                  Editar Pedido
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {subRequest?.status === 'rejected' && (
          <Card className="rounded-2xl shadow-sm overflow-hidden bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 border-rose-200 dark:border-rose-800">
            <div className="h-1 bg-gradient-to-r from-rose-400 to-red-400" />
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                <div className="p-3 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 shrink-0">
                  <XCircle className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <h4 className="text-base md:text-lg font-bold text-rose-800 dark:text-rose-300">
                    Pedido do {subRequest.planName} não aprovado
                  </h4>
                  <p className="text-xs md:text-sm text-rose-700 dark:text-rose-400 leading-relaxed">
                    {subRequest.adminNotes
                      ? `Motivo: ${subRequest.adminNotes}`
                      : 'Seu pedido de assinatura TalkMobi não foi aprovado. Entre em contato com o suporte se tiver dúvidas, ou ajuste as informações e solicite novamente.'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const plan = plans.find((p) => p.id === subRequest.planId)
                    if (plan) handleSubscribe(plan)
                  }}
                  className="border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40 w-full md:w-auto shrink-0"
                >
                  Solicitar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="rounded-2xl shadow-sm">
                <CardContent className="p-4 md:p-6 space-y-3 animate-pulse">
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-6 w-32 bg-muted rounded" />
                  <div className="h-10 w-full bg-muted rounded" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-muted rounded" />
                    <div className="h-3 w-3/4 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <Card className="rounded-2xl shadow-sm bg-card">
            <CardContent className="p-6 md:p-10">
              <EmptyState
                icon={Smartphone}
                title="Nenhum plano TalkMobi disponível"
                description="Os planos de celular serão exibidos aqui assim que o time comercial publicá-los. Volte em breve!"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx, duration: 0.3 }}
              >
                <Card
                  className={`rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full ${
                    plan.isPopular
                      ? 'ring-2 ring-emerald-500/40 dark:ring-emerald-500/30'
                      : ''
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                      <Star className="h-3 w-3 fill-white" />
                      POPULAR
                    </div>
                  )}
                  {plan.isRecommended && !plan.isPopular && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      RECOMENDADO
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <CardTitle className="text-base md:text-lg font-bold text-foreground">
                      {plan.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan.dataAmount} de internet
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col gap-3">
                    {/* Price */}
                    <div>
                      <span className="text-2xl md:text-3xl font-bold text-foreground">
                        {plan.priceFormatted}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">/mês</span>
                    </div>

                    {/* Cashback + Reward Points */}
                    <div className="flex flex-wrap gap-2">
                      {plan.cashbackCents > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 text-[11px]"
                        >
                          <Gift className="h-3 w-3 mr-1" />
                          {plan.cashbackFormatted} de cashback
                        </Badge>
                      )}
                      {plan.rewardPoints > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800 text-[11px]"
                        >
                          <Star className="h-3 w-3 mr-1" />
                          +{plan.rewardPoints} pontos
                        </Badge>
                      )}
                    </div>

                    {/* Features */}
                    {plan.features.length > 0 && (
                      <ul className="space-y-1.5 mt-1">
                        {plan.features.slice(0, 6).map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs md:text-sm text-foreground/80">
                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Subscribe button pinned to bottom */}
                    <div className="mt-auto pt-3">
                      <Button
                        type="button"
                        onClick={() => handleSubscribe(plan)}
                        className={`w-full gap-1.5 ${
                          plan.isPopular
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : ''
                        }`}
                      >
                        Assinar
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ===== Telemedicina Section ===== */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <HeartPulse className="h-4 w-4" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-foreground">
            Telemedicina
          </h3>
          {telemedRequest && (
            <Badge
              variant="outline"
              className={
                telemedRequest.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 text-[11px]'
                  : telemedRequest.status === 'pending'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800 text-[11px]'
                    : telemedRequest.status === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800 text-[11px]'
                      : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800 text-[11px]'
              }
            >
              {telemedRequest.status === 'approved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {telemedRequest.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
              {telemedRequest.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
              {telemedRequest.status === 'approved'
                ? 'Ativado'
                : telemedRequest.status === 'pending'
                  ? 'Em análise'
                  : telemedRequest.status === 'rejected'
                    ? 'Recusado'
                    : 'Cancelado'}
            </Badge>
          )}
        </div>

        {/* ===== STATUS: APPROVED — show activation link the admin sent ===== */}
        {telemedRequest?.status === 'approved' && (
          <Card className="rounded-2xl shadow-sm overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
            <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <h4 className="text-base md:text-lg font-bold text-emerald-800 dark:text-emerald-300">
                    Telemedicina ativada! 🎉
                  </h4>
                  <p className="text-xs md:text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    Seu acesso à Telemedicina foi aprovado. Use o link de acesso
                    abaixo para começar a usar o serviço agora mesmo.
                  </p>
                  {telemedRequest.activationLink && (
                    <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-white/60 dark:bg-white/5 border border-emerald-200 dark:border-emerald-800">
                      <ExternalLink className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <a
                        href={telemedRequest.activationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs md:text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline truncate flex-1 min-w-0"
                      >
                        {telemedRequest.activationLink}
                      </a>
                    </div>
                  )}
                  {telemedRequest.adminNotes && (
                    <p className="text-[11px] md:text-xs text-emerald-700/80 dark:text-emerald-400/80 italic mt-1">
                      Obs. do administrador: {telemedRequest.adminNotes}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTelemedDetailsOpen(true)}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40 w-full md:w-auto shrink-0"
                >
                  Saiba Mais
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== STATUS: PENDING — show "in review" card ===== */}
        {telemedRequest?.status === 'pending' && (
          <Card className="rounded-2xl shadow-sm overflow-hidden bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800">
            <div className="h-1 bg-gradient-to-r from-amber-400 to-yellow-400" />
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                <div className="p-3 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 shrink-0">
                  <Clock className="h-6 w-6 md:h-7 md:w-7 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <h4 className="text-base md:text-lg font-bold text-amber-800 dark:text-amber-300">
                    Pedido em análise
                  </h4>
                  <p className="text-xs md:text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                    Recebemos seu pedido de ativação da Telemedicina. Nossa
                    equipe está analisando e em breve você receberá o link de
                    acesso aqui mesmo e nas notificações.
                  </p>
                  {telemedRequest.dependents && telemedRequest.dependents.length > 0 && (
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                      {telemedRequest.dependents.length} dependente{telemedRequest.dependents.length === 1 ? '' : 's'} incluído{telemedRequest.dependents.length === 1 ? '' : 's'}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/60 dark:bg-white/5 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-amber-800 dark:text-amber-300 font-medium">
                      <CreditCard className="h-3 w-3" />
                      {TELEMEDICINA_PRICE_BRL}/mês
                    </span>
                    {telemedRequest.paymentMethodLabel && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/60 dark:bg-white/5 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-amber-800 dark:text-amber-300 font-medium">
                        Pagamento via {telemedRequest.paymentMethodLabel}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTelemedOpen(true)}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/40 w-full md:w-auto shrink-0"
                >
                  Editar Pedido
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== STATUS: REJECTED — show rejection reason + resubmit ===== */}
        {telemedRequest?.status === 'rejected' && (
          <Card className="rounded-2xl shadow-sm overflow-hidden bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 border-rose-200 dark:border-rose-800">
            <div className="h-1 bg-gradient-to-r from-rose-400 to-red-400" />
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                <div className="p-3 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 shrink-0">
                  <XCircle className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <h4 className="text-base md:text-lg font-bold text-rose-800 dark:text-rose-300">
                    Pedido não aprovado
                  </h4>
                  <p className="text-xs md:text-sm text-rose-700 dark:text-rose-400 leading-relaxed">
                    {telemedRequest.adminNotes
                      ? `Motivo: ${telemedRequest.adminNotes}`
                      : 'Seu pedido de Telemedicina não foi aprovado. Entre em contato com o suporte se tiver dúvidas, ou ajuste as informações e solicite novamente.'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTelemedOpen(true)}
                  className="border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40 w-full md:w-auto shrink-0"
                >
                  Solicitar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== DEFAULT (no request or cancelled) — marketing card + CTA ===== */}
        {(!telemedRequest || telemedRequest.status === 'cancelled') && (
          <Card className="rounded-2xl shadow-sm overflow-hidden bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-800">
            <div className="h-1 bg-gradient-to-r from-rose-400 to-pink-400" />
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                <div className="p-3 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 shrink-0">
                  <HeartPulse className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <h4 className="text-base md:text-lg font-bold text-rose-800 dark:text-rose-300">
                    Saúde 24h para toda a família
                  </h4>
                  <p className="text-xs md:text-sm text-rose-700 dark:text-rose-400 leading-relaxed">
                    Consultas médicas online ilimitadas, suporte psicológico,
                    receitas digitais e descontos em farmácias e clínicas
                    parceiras — tudo pelo app NewMobility.
                  </p>
                  <div className="flex flex-wrap gap-3 text-[11px] md:text-xs text-rose-700 dark:text-rose-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Disponível 24h
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Sem custo por consulta
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
                  <Button
                    type="button"
                    className="bg-rose-600 hover:bg-rose-700 text-white w-full md:w-auto gap-1.5"
                    onClick={() => setTelemedOpen(true)}
                  >
                    <HeartPulse className="h-4 w-4" />
                    Quero Ativar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTelemedDetailsOpen(true)}
                    className="border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40 w-full md:w-auto"
                  >
                    Saiba Mais
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ===== Telemedicina Details Dialog (informational) ===== */}
      <Dialog open={telemedDetailsOpen} onOpenChange={setTelemedDetailsOpen}>
        <DialogContent className="rounded-2xl shadow-lg sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 shrink-0">
                <HeartPulse className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base md:text-lg">
                Telemedicina NewMobility
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-foreground/80">
              Cuidado completo para você e sua família, direto pelo app.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-2 text-sm text-foreground/90 py-2">
            {[
              'Consultas médicas online ilimitadas com profissionais generalistas e especialistas',
              'Suporte psicológico com até 4 sessões por mês',
              'Receitas digitais e atestados emitidos em tempo real',
              'Descontos exclusivos em farmácias e clínicas parceiras',
              'Orientação pediátrica e gerontológica 24h',
              'Acompanhamento de doenças crônicas (hipertensão, diabetes, etc.)',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTelemedDetailsOpen(false)} className="w-full sm:w-auto">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Telemedicina Activation Form Dialog =====
          User fills in their holder info + dependents + optional notes.
          On submit, POST /api/telemedicina/request creates/updates the
          request. Admin reviews → approve (sends activationLink) / reject. */}
      <Dialog open={telemedOpen} onOpenChange={setTelemedOpen}>
        <DialogContent className="rounded-2xl shadow-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 shrink-0">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base md:text-lg">
                  {telemedRequest?.status === 'pending' ? 'Editar Pedido de Telemedicina' : 'Ativar Telemedicina'}
                </DialogTitle>
                <DialogDescription className="text-xs text-foreground/70">
                  Preencha seus dados e os dependentes. Nossa equipe irá analisar e enviar o link de acesso.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* ===== Price banner =====
                Per BACK-2: the user must see the price and choose a payment
                method BEFORE submitting the activation request. */}
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 shrink-0">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-300">
                    Valor da ativação
                  </p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 leading-tight">
                    {TELEMEDICINA_PRICE_BRL}
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300 ml-1">/mês</span>
                  </p>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                    Cobrança mensal recorrente · Cancele quando quiser
                  </p>
                </div>
              </div>
            </div>

            {/* Holder info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <User className="h-4 w-4 text-rose-600" />
                Dados do Titular
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="telemed-fullName" className="text-xs">Nome completo *</Label>
                  <Input
                    id="telemed-fullName"
                    value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    placeholder="Seu nome completo"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telemed-cpf" className="text-xs">CPF *</Label>
                  <Input
                    id="telemed-cpf"
                    value={form.cpf}
                    onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
                    placeholder="000.000.000-00"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telemed-birthDate" className="text-xs">Data de nascimento</Label>
                  <Input
                    id="telemed-birthDate"
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telemed-phone" className="text-xs">Telefone / WhatsApp *</Label>
                  <Input
                    id="telemed-phone"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telemed-email" className="text-xs">E-mail *</Label>
                <Input
                  id="telemed-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="voce@email.com"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Dependents */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="h-4 w-4 text-rose-600" />
                  Dependentes
                  <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddDependent}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>
              {dependents.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Nenhum dependente adicionado. Clique em "Adicionar" para incluir familiares.
                </p>
              ) : (
                <div className="space-y-2">
                  {dependents.map((dep, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end p-2 rounded-lg bg-muted/30 border border-border">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Nome</Label>
                        <Input
                          value={dep.name || ''}
                          onChange={(e) => handleDependentChange(idx, 'name', e.target.value)}
                          placeholder="Nome do dependente"
                          className="text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Parentesco</Label>
                        <Input
                          value={dep.kinship || ''}
                          onChange={(e) => handleDependentChange(idx, 'kinship', e.target.value)}
                          placeholder="Filho(a), Cônjuge..."
                          className="text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Data de nasc.</Label>
                        <Input
                          type="date"
                          value={dep.birthDate || ''}
                          onChange={(e) => handleDependentChange(idx, 'birthDate', e.target.value)}
                          className="text-xs h-9"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDependent(idx)}
                        className="h-9 w-9 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
                        aria-label="Remover dependente"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <Label htmlFor="telemed-notes" className="text-xs">Observações (opcional)</Label>
              <Textarea
                id="telemed-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Alguma informação médica relevante que queira compartilhar com nossa equipe..."
                className="text-sm min-h-[70px] resize-y"
              />
            </div>

            {/* ===== Payment method selector (BACK-2) ===== */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                Forma de Pagamento *
              </div>
              <p className="text-[11px] text-muted-foreground -mt-1">
                Após aprovação do admin, você receberá o link de pagamento pela forma escolhida.
              </p>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as TelemedPaymentMethod)}
                className="grid gap-2"
              >
                {PAYMENT_METHOD_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  const checked = paymentMethod === opt.value
                  return (
                    <Label
                      key={opt.value}
                      htmlFor={`telemed-pay-${opt.value}`}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        checked
                          ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/30'
                          : 'border-border hover:bg-muted/40'
                      }`}
                    >
                      <RadioGroupItem
                        id={`telemed-pay-${opt.value}`}
                        value={opt.value}
                        className="mt-0.5 data-[state=checked]:border-emerald-600 data-[state=checked]:text-emerald-600"
                      />
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${checked ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{opt.label}</p>
                        <p className="text-[11px] text-muted-foreground">{opt.description}</p>
                      </div>
                    </Label>
                  )
                })}
              </RadioGroup>
            </div>

            {/* ===== Summary (BACK-2) ===== */}
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-300">
                Resumo
              </p>
              <p className="text-xs text-foreground">
                <span className="font-semibold">Ativação Telemedicina</span>
                <span className="mx-1.5 text-muted-foreground">·</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">{TELEMEDICINA_PRICE_BRL}/mês</span>
                <span className="mx-1.5 text-muted-foreground">·</span>
                <span>Pagamento via <span className="font-semibold">{paymentMethodLabel(paymentMethod)}</span></span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Você será notificado quando o admin aprovar e enviar o link de pagamento.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setTelemedOpen(false)} className="w-full sm:w-auto" disabled={submitting}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto gap-2"
              onClick={handleSubmitTelemed}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirmar e Pagar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== TalkMobi Subscription Form Dialog =====
          User fills in holder info + shipping address for the SIM chip.
          On submit, POST /api/talkmobi/subscribe creates/updates the
          subscription request. Admin reviews in the panel → approve (sends
          activationLink / ICCID) / reject. */}
      <Dialog open={subscribeOpen} onOpenChange={setSubscribeOpen}>
        <DialogContent className="rounded-2xl shadow-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base md:text-lg">
                  {subRequest?.status === 'pending' && subscribePlan?.id === subRequest.planId
                    ? `Editar Pedido — ${subscribePlan?.name ?? ''}`
                    : `Assinar ${subscribePlan?.name ?? 'Plano TalkMobi'}`}
                </DialogTitle>
                <DialogDescription className="text-xs text-foreground/70">
                  {subscribePlan
                    ? `${subscribePlan.dataAmount} · ${subscribePlan.priceFormatted}/mês. Preencha seus dados para que nossa equipe processe a ativação.`
                    : 'Preencha seus dados para que nossa equipe processe a ativação.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Holder info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <User className="h-4 w-4 text-emerald-600" />
                Dados do Titular
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sub-fullName" className="text-xs">Nome completo *</Label>
                  <Input
                    id="sub-fullName"
                    value={subForm.fullName}
                    onChange={(e) => setSubForm((f) => ({ ...f, fullName: e.target.value }))}
                    placeholder="Seu nome completo"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sub-cpf" className="text-xs">CPF *</Label>
                  <Input
                    id="sub-cpf"
                    value={subForm.cpf}
                    onChange={(e) => setSubForm((f) => ({ ...f, cpf: e.target.value }))}
                    placeholder="000.000.000-00"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sub-birthDate" className="text-xs">Data de nascimento</Label>
                  <Input
                    id="sub-birthDate"
                    type="date"
                    value={subForm.birthDate}
                    onChange={(e) => setSubForm((f) => ({ ...f, birthDate: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sub-phone" className="text-xs">Telefone / WhatsApp *</Label>
                  <Input
                    id="sub-phone"
                    value={subForm.phone}
                    onChange={(e) => setSubForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sub-email" className="text-xs">E-mail *</Label>
                <Input
                  id="sub-email"
                  type="email"
                  value={subForm.email}
                  onChange={(e) => setSubForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="voce@email.com"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Shipping address for the SIM chip (optional) */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-emerald-600" />
                Endereço de Entrega do Chip
                <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="sub-zipCode" className="text-xs">CEP</Label>
                  <Input
                    id="sub-zipCode"
                    value={subForm.zipCode}
                    onChange={(e) => setSubForm((f) => ({ ...f, zipCode: e.target.value }))}
                    placeholder="00000-000"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="sub-street" className="text-xs">Rua / Avenida</Label>
                  <Input
                    id="sub-street"
                    value={subForm.street}
                    onChange={(e) => setSubForm((f) => ({ ...f, street: e.target.value }))}
                    placeholder="Rua Exemplo"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sub-number" className="text-xs">Número</Label>
                  <Input
                    id="sub-number"
                    value={subForm.number}
                    onChange={(e) => setSubForm((f) => ({ ...f, number: e.target.value }))}
                    placeholder="123"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="sub-complement" className="text-xs">Complemento</Label>
                  <Input
                    id="sub-complement"
                    value={subForm.complement}
                    onChange={(e) => setSubForm((f) => ({ ...f, complement: e.target.value }))}
                    placeholder="Apto 4"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="sub-district" className="text-xs">Bairro</Label>
                  <Input
                    id="sub-district"
                    value={subForm.district}
                    onChange={(e) => setSubForm((f) => ({ ...f, district: e.target.value }))}
                    placeholder="Centro"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="sub-city" className="text-xs">Cidade</Label>
                  <Input
                    id="sub-city"
                    value={subForm.city}
                    onChange={(e) => setSubForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="São Paulo"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sub-state" className="text-xs">UF</Label>
                  <Input
                    id="sub-state"
                    value={subForm.state}
                    onChange={(e) => setSubForm((f) => ({ ...f, state: e.target.value.toUpperCase().slice(0, 2) }))}
                    placeholder="SP"
                    maxLength={2}
                    className="text-sm uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <Label htmlFor="sub-notes" className="text-xs">Observações (opcional)</Label>
              <Textarea
                id="sub-notes"
                value={subForm.notes}
                onChange={(e) => setSubForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Ex: prefiro receber o chip à tarde / quero manter meu número atual..."
                className="text-sm min-h-[70px] resize-y"
              />
            </div>

            {/* Price summary */}
            {subscribePlan && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{subscribePlan.name} · {subscribePlan.dataAmount}</p>
                    <p className="text-[10px] text-muted-foreground">Pagamento processado pela equipe após ativação</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 shrink-0">{subscribePlan.priceFormatted}<span className="text-[10px] text-muted-foreground font-normal">/mês</span></p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setSubscribeOpen(false)} className="w-full sm:w-auto" disabled={subSubmitting}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto gap-2"
              onClick={handleSubmitSubscribe}
              disabled={subSubmitting}
            >
              {subSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {subRequest?.status === 'pending' && subscribePlan?.id === subRequest.planId
                    ? 'Atualizar Pedido'
                    : 'Enviar Pedido'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
