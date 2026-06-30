import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { getSession } from '@/lib/auth'
import { bucketInvoiceType } from '@/lib/billing'
import { generateVoucherForUser } from '@/lib/voucher'

// POST /api/billing/pay/[invoiceId]
// Marks an invoice as paid (status = 'paid', paidAt = now).
// For `plan`-type invoices also sets user.plan (when description carries a
// plan slug like 'blue3' / 'blue5') and user.isActive = true (un-blocks the
// user since they just regularised their account).
//
// This is a manual "mark as paid" endpoint. Real Asaas payment confirmation
// is handled elsewhere (via the Asaas webhook); this endpoint is the
// fallback used by the billing page when an invoice has no `asaasPaymentId`.
//
// Body (optional): { userId } — when supplied by an admin/system caller.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const session = await getSession(request)
    const bodyUserId = await readBodyUserId(request)
    const targetUserId = session?.userId || bodyUserId

    if (!targetUserId) {
      return error('Unauthorized', 401)
    }

    const { invoiceId } = await params
    if (!invoiceId) {
      return error('invoiceId is required', 400)
    }

    // Fetch the invoice first so we can verify ownership and apply plan rules.
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) {
      return error('Invoice not found', 404)
    }

    // Ownership check: only the invoice owner (or an admin) may mark it paid.
    const caller = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!caller) {
      return error('Caller not found', 404)
    }
    const isAdmin = caller.role === 'admin'
    if (invoice.userId !== targetUserId && !isAdmin) {
      return error('Forbidden: invoice does not belong to caller', 403)
    }

    const now = new Date()
    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'paid',
        paidAt: now,
      },
    })

    // For plan-type invoices, also activate the user and (if the description
    // carries a plan slug) bump their plan. This un-blocks accounts that
    // were auto-blocked by /api/billing/check-overdue.
    const bucket = bucketInvoiceType(invoice.type)
    if (bucket === 'plan') {
      const desc = (invoice.description || '').toLowerCase()
      let newPlan: string | null = null
      if (desc.includes('blue5') || desc.includes('blue 5') || desc.includes('premium')) {
        newPlan = 'blue5'
      } else if (desc.includes('blue3') || desc.includes('blue 3')) {
        newPlan = 'blue3'
      }

      const userData: { isActive?: boolean; plan?: string } = { isActive: true }
      if (newPlan) userData.plan = newPlan

      const updatedUser = await prisma.user.update({
        where: { id: invoice.userId },
        data: userData,
        select: { id: true, userType: true },
      })

      // --- Plan-bonus voucher (Task 14-E) ---
      // Mirror the Asaas webhook: when a plan invoice is marked paid,
      // auto-generate a fresh voucher sized to the user's userType. Best-effort
      // — never fails the parent flow.
      try {
        const userType = updatedUser.userType || 'usuario'
        await generateVoucherForUser(updatedUser.id, userType, {
          type: 'plan_bonus',
        })

        try {
          await prisma.notification.create({
            data: {
              userId: updatedUser.id,
              title: 'Bônus de plano liberado! 🎁',
              message:
                'Você recebeu um novo voucher por assinar/atualizar seu plano. Confira na aba Vouchers!',
              type: 'voucher',
            },
          })
        } catch (notifErr) {
          console.warn('[billing/pay] could not create plan-bonus notification:', notifErr)
        }
      } catch (voucherErr) {
        console.error(
          '[billing/pay] NON-CRITICAL: failed to create plan-bonus voucher:',
          voucherErr
        )
      }
    }

    return success({ invoice: updated })
  } catch (err) {
    console.error('POST /api/billing/pay/[invoiceId] error:', err)
    return error('Internal server error', 500)
  }
}

// Helper: read `userId` from the request body without disturbing the
// downstream `request.json()` call (we clone first).
async function readBodyUserId(request: Request): Promise<string | null> {
  try {
    const ct = request.headers.get('content-type') || ''
    if (!ct.includes('application/json')) return null
    const clone = request.clone()
    const body = await clone.json().catch(() => null)
    if (body && typeof body === 'object' && typeof (body as Record<string, unknown>).userId === 'string') {
      return (body as Record<string, string>).userId
    }
    return null
  } catch {
    return null
  }
}
