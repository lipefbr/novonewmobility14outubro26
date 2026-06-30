import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { getAsaasConfig, verifyWebhookToken } from '@/lib/asaas'

/**
 * POST /api/asaas/webhook
 * Public endpoint (no auth). Asaas calls this for every payment/transfer
 * event. We verify the optional `asaas-access-token` header against the
 * configured secret (if any), enforce idempotency via the AsaasWebhookEvent
 * table, then process the event.
 *
 * Asaas will retry on non-2xx responses, so we ALWAYS return 200 (even on
 * internal processing errors) and persist the error on the event row for
 * later inspection.
 *
 * Body shape (simplified):
 *   {
 *     id: "evt_xxx",           // Asaas-unique event id (idempotency key)
 *     event: "PAYMENT_RECEIVED",
 *     payment: { id: "pay_xxx", status: "RECEIVED", value: 149.90, ... },
 *     transfer: { id: "trf_xxx", status: "DONE", ... }  // for transfer events
 *   }
 */
export async function POST(req: NextRequest) {
  // 1. Verify webhook token (header `asaas-access-token`)
  const config = await getAsaasConfig()
  const token = req.headers.get('asaas-access-token')
  if (!verifyWebhookToken(token, config?.webhookSecret)) {
    return error('Unauthorized: invalid webhook token', 401)
  }

  // 2. Parse body
  let body: any
  try {
    body = await req.json()
  } catch {
    // Still 200 — Asaas shouldn't be penalized for our parse failure
    console.error('[Asaas webhook] invalid JSON body')
    return success({ received: true, error: 'invalid JSON' })
  }

  const eventId: string | undefined = body?.id
  const eventType: string = body?.event || 'UNKNOWN'
  const payment: any | undefined = body?.payment
  const paymentId: string | undefined = payment?.id
  const paymentStatus: string | undefined = payment?.status

  // 3. Idempotency — persist the event row. If the eventId already exists
  //    (unique constraint P2002), the event was already processed.
  if (!eventId) {
    // Asaas always sends an event id; if missing, log + accept
    console.warn('[Asaas webhook] event without id; processing anyway')
  }

  let eventRowId: string | null = null
  if (eventId) {
    try {
      const created = await prisma.asaasWebhookEvent.create({
        data: {
          eventId,
          event: eventType,
          paymentId: paymentId || null,
          status: paymentStatus || null,
          payload: JSON.stringify(body),
        },
      })
      eventRowId = created.id
    } catch (e: any) {
      if (e?.code === 'P2002') {
        // Duplicate event — already processed
        return success({ message: 'Event already processed' })
      }
      // Unknown DB error — log and still return 200
      console.error('[Asaas webhook] failed to persist event row:', e)
      return success({ received: true, error: 'failed to persist event' })
    }
  }

  // 4. Process the event
  try {
    await processEvent(eventType, body)
    if (eventRowId) {
      await prisma.asaasWebhookEvent.update({
        where: { id: eventRowId },
        data: { processed: true, processedAt: new Date() },
      })
    }
    return success({ received: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown processing error'
    console.error('[Asaas webhook] processing failed:', msg)
    if (eventRowId) {
      try {
        await prisma.asaasWebhookEvent.update({
          where: { id: eventRowId },
          data: { errorMessage: msg.substring(0, 2000) },
        })
      } catch {
        // best-effort
      }
    }
    // Still 200 so Asaas doesn't retry
    return success({ received: true, error: 'processing failed', detail: msg })
  }
}

/**
 * Dispatches an Asaas webhook event to the appropriate side-effects.
 * Throws on unexpected errors so the caller can persist the error message.
 */
async function processEvent(eventType: string, body: any): Promise<void> {
  const payment: any | undefined = body?.payment
  const paymentId: string | undefined = payment?.id

  switch (eventType) {
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_CONFIRMED':
      if (!paymentId) return
      await handlePaymentPaid(paymentId, payment)
      break

    case 'PAYMENT_OVERDUE':
      if (!paymentId) return
      await handleInvoiceStatus(paymentId, 'overdue')
      break

    case 'PAYMENT_REFUNDED':
    case 'PAYMENT_REFUND_REQUESTED':
      if (!paymentId) return
      await handleInvoiceStatus(paymentId, 'refunded')
      break

    // Events we acknowledge but don't act on yet:
    case 'PAYMENT_CREATED':
    case 'PAYMENT_UPDATED':
    case 'PAYMENT_DELETED':
    case 'PAYMENT_RESTORED':
    case 'PAYMENT_DUNNING_RECEIVED':
    case 'PAYMENT_CHARGEBACK_REQUESTED':
    case 'PAYMENT_CHARGEBACK_DISPUTE':
      // No status change needed
      break

    // Transfer events — kept here so we don't crash; admin transfer flows
    // poll Asaas directly for live status.
    case 'TRANSFER_CREATED':
    case 'TRANSFER_DONE':
    case 'TRANSFER_BANK_CONFIRMED':
    case 'TRANSFER_FAILED':
    case 'TRANSFER_REFUNDED':
    case 'TRANSFER_CANCELLED':
      await handleTransferEvent(body?.transfer)
      break

    default:
      console.warn('[Asaas webhook] unhandled event type:', eventType)
      break
  }
}

/**
 * PAYMENT_RECEIVED / PAYMENT_CONFIRMED handler:
 *  - Mark the linked Invoice as paid (status='paid', paidAt=now)
 *  - Record a Transaction for the payment
 *  - If the invoice is a plan_subscription/plan_upgrade, activate the plan
 *  - Credit the appropriate user balance per the spec
 */
async function handlePaymentPaid(paymentId: string, _payment: any): Promise<void> {
  const invoice = await prisma.invoice.findFirst({
    where: { asaasPaymentId: paymentId },
  })
  if (!invoice) {
    // Not our payment — silently ignore (could be from another integration)
    return
  }

  // Only transition once (avoid duplicate Transaction rows on duplicate events)
  const wasPaid = invoice.status === 'paid'

  // 1. Mark invoice paid
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: 'paid',
      paidAt: invoice.paidAt ?? new Date(),
    },
  })

  if (!wasPaid) {
    // 2. Record a Transaction row for the payment
    const txType = invoice.type?.startsWith('plan_') ? 'plan_upgrade' : 'invoice_payment'
    await prisma.transaction.create({
      data: {
        userId: invoice.userId,
        type: txType,
        amount: invoice.amount,
        status: 'completed',
        category: 'invoice_payment',
        description: `Pagamento confirmado - Fatura ${invoice.id}`,
      },
    })

    // 3. Plan activation + balance credit
    await applyPlanAndBalanceForInvoice(invoice)
  }
}

/**
 * Updates the user's plan and credits the appropriate balance when a plan
 * invoice is paid. Looks up the Plan by code extracted from invoice.type
 * (e.g. `plan_blue3` → code `blue3`).
 */
async function applyPlanAndBalanceForInvoice(invoice: {
  id: string
  userId: string
  amount: number
  type: string
}): Promise<void> {
  const t = invoice.type || ''
  const isPlanInvoice =
    t.startsWith('plan_') &&
    (t.includes('subscription') || t.includes('upgrade') || t.includes('_'))

  // Extract plan code from types like `plan_blue3`, `plan_subscription_blue3`, `plan_upgrade_blue3`
  let planCode: string | null = null
  if (isPlanInvoice) {
    const parts = t.split('_') // ['plan', 'blue3'] or ['plan', 'subscription', 'blue3']
    const code = parts.length >= 2 ? parts[parts.length - 1] : null
    if (code) planCode = code
  }

  // Plan activation
  if (planCode) {
    const plan = await prisma.plan.findUnique({ where: { code: planCode } })
    if (plan) {
      await prisma.user.update({
        where: { id: invoice.userId },
        data: {
          planId: plan.id,
          plan: plan.code,
          isActive: true,
        },
      })
    }
  }

  // Balance credit per spec (e.g. plan_upgrade → balanceWithdrawal += amount)
  // The exact wallet is inferred from invoice.type. We credit balanceWithdrawal
  // for plan payments (the user now has withdrawable balance equal to what
  // they paid — this matches the spec's literal example).
  if (t.includes('plan')) {
    await prisma.user.update({
      where: { id: invoice.userId },
      data: { balanceWithdrawal: { increment: invoice.amount } },
    })
  }
}

/**
 * Generic invoice status update for OVERDUE / REFUNDED events.
 */
async function handleInvoiceStatus(
  paymentId: string,
  newStatus: 'overdue' | 'refunded'
): Promise<void> {
  const invoice = await prisma.invoice.findFirst({
    where: { asaasPaymentId: paymentId },
  })
  if (!invoice) return
  if (invoice.status === newStatus) return
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: newStatus },
  })
}

/**
 * Transfer event handler — currently only syncs our WithdrawalRequest row
 * status if the transfer is linked to one of ours via externalReference.
 */
async function handleTransferEvent(transfer: any): Promise<void> {
  if (!transfer) return
  const externalRef: string | undefined = transfer.externalReference
  const status: string | undefined = transfer.status
  if (!externalRef || !status) return

  const wr = await prisma.withdrawalRequest.findUnique({
    where: { id: externalRef },
  })
  if (!wr || !wr.asaasTransferId) return

  // Map Asaas transfer status → our withdrawal status
  const mapped =
    status === 'DONE' || status === 'BANK_CONFIRMED'
      ? 'paid'
      : status === 'FAILED' || status === 'BANK_FAILED'
        ? 'failed'
        : status === 'REFUNDED' || status === 'CANCELLED'
          ? 'rejected'
          : wr.status

  const patch: { asaasStatus: string; status?: string; paidAt?: Date } = {
    asaasStatus: status,
  }
  if (mapped !== wr.status) {
    patch.status = mapped
    if (mapped === 'paid') patch.paidAt = new Date()
  }

  await prisma.withdrawalRequest.update({
    where: { id: wr.id },
    data: patch,
  })
}
