'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { apiFetch } from '@/lib/api'
import {
  formatBRL,
  bucketLabel,
  type InvoiceBucket,
} from '@/lib/billing'
import { AsaasPaymentDialog } from '@/components/newmobility/payment/asaas-payment-dialog'
import {
  PaymentMethodDialog,
  paymentMethodLabel,
  type PaymentMethod,
} from '@/components/newmobility/billing/payment-method-dialog'
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  Receipt,
  ShieldAlert,
  Wallet,
} from 'lucide-react'

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface BillingInvoice {
  id: string
  userId: string
  amount: number
  type: string | null
  status: string
  dueDate: string
  paidAt: string | null
  createdAt: string
  description: string | null
  asaasPaymentId: string | null
  paymentMethod: string | null
  invoiceUrl: string | null
  bankSlipUrl: string | null
  pixCode: string | null
  pixQrCode: string | null
  // Computed by the API
  computedStatus: 'paid' | 'pending' | 'overdue'
  daysUntilDue: number
  blockWarning: boolean
  bucket: InvoiceBucket
}

interface BillingResponse {
  invoices: BillingInvoice[]
  groups: Record<InvoiceBucket, BillingInvoice[]>
  summary: {
    total: number
    pending: number
    overdue: number
    paid: number
    hasOverdue: boolean
    hasUpcoming: boolean
    hasBlocking: boolean
  }
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

// Per-bucket visual config. The icon container uses `rounded-full` per the
// project styling rules. Colors are emerald/amber/rose (NOT indigo/blue).
const BUCKET_CONFIG: Record<
  InvoiceBucket,
  {
    label: string
    icon: typeof Wallet
    iconBg: string
    iconColor: string
  }
> = {
  plan: {
    label: 'Plano Mensal',
    icon: CreditCard,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  cashback: {
    label: 'CashBack',
    icon: Wallet,
    iconBg: 'bg-amber-50 dark:bg-amber-950/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  telemedicina: {
    label: 'Telemedicina',
    icon: ShieldAlert,
    iconBg: 'bg-rose-50 dark:bg-rose-950/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  telemoby: {
    label: 'TalkMobi',
    icon: Receipt,
    iconBg: 'bg-teal-50 dark:bg-teal-950/30',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  other: {
    label: 'Outros',
    icon: FileText,
    iconBg: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-600 dark:text-gray-300',
  },
}

// Render order for the buckets in the grid.
const BUCKET_ORDER: InvoiceBucket[] = ['plan', 'cashback', 'telemedicina', 'telemoby', 'other']

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function BillingPage() {
  const { user } = useStore()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<BillingResponse | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)

  // AsaasPaymentDialog state — opened by the "Pagar" button when the invoice
  // already has an `asaasPaymentId` (otherwise we open the PaymentMethodDialog
  // below to collect PIX/Boleto/Cartão BEFORE marking it as paid).
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState<BillingInvoice | null>(null)

  // PaymentMethodDialog state — per BACK-5, clicking "Pagar" on an invoice
  // without an `asaasPaymentId` no longer marks it paid instantly. Instead
  // we open this dialog so the user picks a method + reviews the amount/due
  // date before confirming.
  const [methodDialogOpen, setMethodDialogOpen] = useState(false)
  const [methodDialogInvoice, setMethodDialogInvoice] = useState<BillingInvoice | null>(null)
  const [methodDialogLoading, setMethodDialogLoading] = useState(false)

  // --------------------------------------------------------------------------
  // Data loading
  // --------------------------------------------------------------------------
  const refresh = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      // BACK-5: Ensure the user has a pending monthly plan invoice before
      // listing. Previously, if a user had an active (non-free) plan but no
      // Invoice row was ever generated (e.g. plan was set by admin without
      // running ensure-monthly), the "Pagar Faturas" page showed nothing —
      // the user saw a "pending R$999 plan" in Meu Plano but no fatura to
      // pay. This auto-generates the missing monthly invoice (server-side
      // no-op if one already exists) right before we fetch the list.
      try {
        await apiFetch('/billing/ensure-monthly', {
          method: 'POST',
          body: JSON.stringify({ userId: user.id }),
        })
      } catch {
        // Non-fatal — the user may not have a paid plan; just continue to
        // the list fetch so they still see whatever invoices exist.
      }
      const res = await apiFetch<BillingResponse>(`/billing?userId=${user.id}`)
      setData(res)
    } catch (err) {
      console.error('Failed to load billing data', err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Fire-and-forget: trigger the 5-day reminder + auto-block check whenever
  // the user opens the billing page. Errors are silently ignored — these
  // endpoints only need to run "best effort" on page view.
  useEffect(() => {
    if (!user?.id) return
    Promise.allSettled([
      apiFetch(`/billing/notifications`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      }),
      apiFetch(`/billing/check-overdue`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      }),
    ]).catch(() => {
      /* ignore — fire and forget */
    })
  }, [user?.id])

  // --------------------------------------------------------------------------
  // Pay handler — per BACK-5, this now opens the PaymentMethodDialog BEFORE
  // marking the invoice as paid. The actual mark-as-paid call is performed
  // by `handleConfirmPayment` once the user picks PIX/Boleto/Cartão.
  // --------------------------------------------------------------------------
  const handlePay = useCallback(
    async (invoice: BillingInvoice) => {
      // If the invoice has an existing Asaas payment, open the dialog to
      // show the PIX/Boleto details (or to verify status).
      if (invoice.asaasPaymentId) {
        setPaymentInvoice(invoice)
        setPaymentDialogOpen(true)
        return
      }

      // Otherwise open the payment-method selection dialog. The user must
      // explicitly confirm a method before the invoice is marked as paid.
      setMethodDialogInvoice(invoice)
      setMethodDialogOpen(true)
    },
    []
  )

  // Called by PaymentMethodDialog when the user confirms a payment method.
  // Calls POST /api/billing/pay/[id] with the chosen paymentMethod in the
  // body. The API marks the invoice as paid AND stores paymentMethod on the
  // Invoice record (the schema already has that column).
  const handleConfirmPayment = useCallback(
    async (method: PaymentMethod) => {
      const invoice = methodDialogInvoice
      if (!invoice) return
      setMethodDialogLoading(true)
      setPayingId(invoice.id)
      try {
        await apiFetch(`/billing/pay/${invoice.id}`, {
          method: 'POST',
          body: JSON.stringify({ userId: user?.id, paymentMethod: method }),
        })
        const methodLbl = paymentMethodLabel(method) ?? method
        toast.success(`Pagamento de ${formatBRL(Number(invoice.amount) || 0)} confirmado via ${methodLbl}`, {
          description: `Fatura de ${bucketLabel(invoice.bucket)} marcada como paga.`,
        })
        setMethodDialogOpen(false)
        setMethodDialogInvoice(null)
        await refresh()
      } catch (err) {
        console.error('Failed to mark invoice as paid', err)
        toast.error('Erro ao processar pagamento', {
          description: err instanceof Error ? err.message : 'Tente novamente.',
        })
      } finally {
        setMethodDialogLoading(false)
        setPayingId(null)
      }
    },
    [methodDialogInvoice, user?.id, refresh]
  )

  const handlePaymentCreated = useCallback(() => {
    refresh()
  }, [refresh])

  // --------------------------------------------------------------------------
  // Render helpers
  // --------------------------------------------------------------------------
  const summary = data?.summary
  const invoices = data?.invoices || []
  const flatInvoices = BUCKET_ORDER.flatMap((bucket) => data?.groups?.[bucket] || [])

  // --------------------------------------------------------------------------
  // Loading state
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      </div>
    )
  }

  // --------------------------------------------------------------------------
  // Page render
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* Header                                                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Pagar Faturas
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie suas cobranças e evite bloqueios
        </p>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Monthly recurrence info banner                                   */}
      {/* ---------------------------------------------------------------- */}
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex items-start gap-3">
        <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 shrink-0">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            Cobrança mensal recorrente
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
            Sua fatura é gerada todo mês e <strong>renova automaticamente</strong> após o pagamento.
            Você precisa pagar a fatura mensalmente para manter sua conta ativa e evitar bloqueios.
            Ao pagar, a próxima fatura é gerada com vencimento em 30 dias.
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Warning banner (overdue / upcoming / blocking)                   */}
      {/* ---------------------------------------------------------------- */}
      {summary?.hasBlocking ? (
        <WarningBanner
          variant="danger"
          icon={ShieldAlert}
          title="Conta bloqueada por inadimplência"
          message="Você possui faturas vencidas há mais de 5 dias. Sua conta foi bloqueada automaticamente. Regularize os pagamentos abaixo para reativá-la."
        />
      ) : summary?.hasOverdue ? (
        <WarningBanner
          variant="danger"
          icon={AlertCircle}
          title="Você tem faturas vencidas"
          message="Pague agora para evitar o bloqueio automático da sua conta após 5 dias de atraso."
        />
      ) : summary?.hasUpcoming ? (
        <WarningBanner
          variant="warning"
          icon={AlertTriangle}
          title="Faturas próximas do vencimento"
          message="Você tem faturas que vencem nos próximos 5 dias. Antecipe o pagamento e evite transtornos."
        />
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* Quick summary chips                                              */}
      {/* ---------------------------------------------------------------- */}
      {summary && summary.total > 0 && (
        <div className="flex flex-wrap gap-2">
          <SummaryChip
            label="Pendentes"
            count={summary.pending}
            tone="amber"
          />
          <SummaryChip
            label="Vencidas"
            count={summary.overdue}
            tone="rose"
          />
          <SummaryChip
            label="Pagas"
            count={summary.paid}
            tone="emerald"
          />
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Invoice grid                                                     */}
      {/* ---------------------------------------------------------------- */}
      {flatInvoices.length === 0 ? (
        <EmptyStateCard />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flatInvoices.map((invoice, i) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onPay={handlePay}
              paying={payingId === invoice.id}
              index={i}
            />
          ))}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Asaas payment dialog                                             */}
      {/* ---------------------------------------------------------------- */}
      <AsaasPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoiceId={paymentInvoice?.id || ''}
        invoiceDescription={
          paymentInvoice?.description ||
          paymentInvoice?.type ||
          'Fatura NewMobility'
        }
        invoiceAmountCents={Math.abs(Number(paymentInvoice?.amount) || 0)}
        initialAsaasPaymentId={paymentInvoice?.asaasPaymentId || undefined}
        onPaymentCreated={handlePaymentCreated}
      />

      {/* ---------------------------------------------------------------- */}
      {/* Payment-method selection dialog (BACK-5)                         */}
      {/* Opens for invoices without an `asaasPaymentId`. The user must    */}
      {/* pick PIX / Boleto / Cartão before the invoice is marked as paid. */}
      {/* ---------------------------------------------------------------- */}
      <PaymentMethodDialog
        open={methodDialogOpen}
        onOpenChange={setMethodDialogOpen}
        invoice={methodDialogInvoice}
        bucketLabel={methodDialogInvoice ? bucketLabel(methodDialogInvoice.bucket) : undefined}
        onConfirm={handleConfirmPayment}
        loading={methodDialogLoading}
      />
    </div>
  )
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

function WarningBanner({
  variant,
  icon: Icon,
  title,
  message,
}: {
  variant: 'danger' | 'warning'
  icon: typeof AlertCircle
  title: string
  message: string
}) {
  const palette =
    variant === 'danger'
      ? {
          wrap: 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900',
          iconWrap: 'bg-rose-100 dark:bg-rose-900/60',
          iconColor: 'text-rose-600 dark:text-rose-400',
          title: 'text-rose-900 dark:text-rose-200',
          text: 'text-rose-700 dark:text-rose-300',
        }
      : {
          wrap: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900',
          iconWrap: 'bg-amber-100 dark:bg-amber-900/60',
          iconColor: 'text-amber-600 dark:text-amber-400',
          title: 'text-amber-900 dark:text-amber-200',
          text: 'text-amber-700 dark:text-amber-300',
        }

  return (
    <Card className={`rounded-2xl shadow-sm border ${palette.wrap}`}>
      <CardContent className="p-4 flex items-start gap-3">
        <div
          className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${palette.iconWrap} ${palette.iconColor}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <p className={`text-sm font-semibold ${palette.title}`}>{title}</p>
          <p className={`text-xs sm:text-sm ${palette.text} leading-relaxed`}>
            {message}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryChip({
  label,
  count,
  tone,
}: {
  label: string
  count: number
  tone: 'amber' | 'rose' | 'emerald'
}) {
  const palette =
    tone === 'amber'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
      : tone === 'rose'
        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'

  if (count === 0) return null

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${palette}`}
    >
      <span className="font-bold tabular-nums">{count}</span>
      <span>{label}</span>
    </span>
  )
}

function EmptyStateCard() {
  return (
    <Card className="rounded-2xl shadow-sm border bg-card">
      <CardContent className="p-8 sm:p-12 text-center space-y-3">
        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Nenhuma fatura pendente 🎉
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Você está em dia com seus pagamentos. Novas cobranças aparecerão
          aqui assim que forem geradas.
        </p>
      </CardContent>
    </Card>
  )
}

function InvoiceCard({
  invoice,
  onPay,
  paying,
  index,
}: {
  invoice: BillingInvoice
  onPay: (inv: BillingInvoice) => void
  paying: boolean
  index: number
}) {
  const cfg = BUCKET_CONFIG[invoice.bucket] || BUCKET_CONFIG.other
  const Icon = cfg.icon

  const status = invoice.computedStatus
  const paymentMethodLbl = paymentMethodLabel(invoice.paymentMethod)
  const statusBadge =
    status === 'paid' ? (
      <div className="flex flex-col items-end gap-1">
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100">
          Pago
        </Badge>
        {paymentMethodLbl && (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 text-[10px] gap-1"
            title="Forma de pagamento utilizada"
          >
            <CreditCard className="h-3 w-3" />
            Pago via {paymentMethodLbl}
          </Badge>
        )}
      </div>
    ) : status === 'overdue' ? (
      <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100">
        Vencido
      </Badge>
    ) : (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100">
        Pendente
      </Badge>
    )

  // Days-until-due label (only relevant for pending / overdue).
  const daysLabel = (() => {
    if (status === 'paid') return null
    const d = invoice.daysUntilDue
    if (d > 0) return `Vence em ${d} dia${d === 1 ? '' : 's'}`
    if (d === 0) return 'Vence hoje'
    const overdue = Math.abs(d)
    return `Vencida há ${overdue} dia${overdue === 1 ? '' : 's'}`
  })()

  const amountStr = formatBRL(Number(invoice.amount) || 0)
  const dueStr = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('pt-BR')
    : '—'

  const isPayable = status === 'pending' || status === 'overdue'
  const hasAsaasPayment = !!invoice.asaasPaymentId
  const payLabel = hasAsaasPayment ? 'Ver Pagamento' : 'Pagar'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.32), duration: 0.25 }}
    >
      <Card
        className={`rounded-2xl shadow-sm border bg-card overflow-hidden ${
          invoice.blockWarning ? 'ring-2 ring-rose-300 dark:ring-rose-800' : ''
        }`}
      >
        <CardContent className="p-5 space-y-4">
          {/* Top row: icon + label + status badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`shrink-0 h-11 w-11 rounded-full flex items-center justify-center ${cfg.iconBg} ${cfg.iconColor}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {cfg.label}
                </p>
                {invoice.description ? (
                  <p className="text-xs text-muted-foreground truncate">
                    {invoice.description}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground truncate">
                    Fatura mensal
                  </p>
                )}
              </div>
            </div>
            {statusBadge}
          </div>

          {/* Amount + due date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 dark:bg-muted/20 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Valor
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {amountStr}
              </p>
            </div>
            <div className="bg-muted/40 dark:bg-muted/20 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Vencimento
              </p>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {dueStr}
              </p>
            </div>
          </div>

          {/* Days hint */}
          {daysLabel && (
            <div
              className={`flex items-center gap-1.5 text-xs ${
                status === 'overdue'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {status === 'overdue' ? (
                <AlertCircle className="h-3.5 w-3.5" />
              ) : (
                <Clock className="h-3.5 w-3.5" />
              )}
              <span className="font-medium">{daysLabel}</span>
              {invoice.blockWarning && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                  <ShieldAlert className="h-3 w-3" />
                  Bloqueio ativo
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {isPayable ? (
              <Button
                onClick={() => onPay(invoice)}
                disabled={paying}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5"
                size="sm"
              >
                {paying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : hasAsaasPayment ? (
                  <FileText className="h-3.5 w-3.5" />
                ) : (
                  <CreditCard className="h-3.5 w-3.5" />
                )}
                {paying ? 'Processando…' : payLabel}
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              >
                <a
                  href={`/api/invoices/${invoice.id}/pdf?userId=${invoice.userId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Ver Comprovante
                </a>
              </Button>
            )}

            {isPayable && (
              <a
                href={`/api/invoices/${invoice.id}/pdf?userId=${invoice.userId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground hover:underline ml-auto"
              >
                Ver comprovante
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
