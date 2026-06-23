import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

/**
 * Confirms a PIX payment for a plan upgrade.
 * In production, this would be called by a webhook from the bank/PSP.
 * For demo purposes, the user can manually trigger it after "paying" the PIX.
 *
 * Body: { userId, invoiceId }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, invoiceId } = body

    if (!userId || !invoiceId) {
      return error('userId and invoiceId are required')
    }

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user) {
      return error('User not found', 404)
    }

    const invoice = await db.findOne('Invoice', '"id" = $1 AND "userId" = $2', [invoiceId, userId])
    if (!invoice) {
      return error('Fatura não encontrada', 404)
    }

    if (invoice.status === 'paid') {
      return error('Esta fatura já foi paga', 400)
    }

    // Mark invoice as paid
    await db.update('Invoice', '"id" = $1', {
      status: 'paid',
      paidAt: new Date(),
    }, [invoiceId])

    // Determine plan from invoice type
    const plan = invoice.type?.replace('plan_', '') || 'blue3'

    // Apply the plan upgrade
    await db.update('User', '"id" = $1', {
      plan,
      isActive: true,
      // Set subscription status to active with next due date 30 days from now
    }, [userId])

    // Create approved transaction
    await db.insert('Transaction', {
      userId,
      type: 'deposit',
      amount: invoice.amount,
      status: 'approved',
      category: 'plan_upgrade',
      description: `Pagamento confirmado - Upgrade para ${plan === 'blue3' ? 'Blue 3' : 'Blue 5'} via PIX`,
    })

    // Update other pending plan_upgrade transactions for this user to approved
    const pendingTxs = await db.find(
      'Transaction',
      '"userId" = $1 AND "status" = $2 AND "category" = $3',
      [userId, 'pending', 'plan_upgrade']
    )
    for (const tx of pendingTxs) {
      await db.update('Transaction', '"id" = $1', {
        status: 'approved',
        description: `Pagamento confirmado - Upgrade para ${plan === 'blue3' ? 'Blue 3' : 'Blue 5'} via PIX`,
      }, [tx.id])
    }

    const updatedUser = await db.findOne('User', '"id" = $1', [userId])

    return success({
      invoice: { ...invoice, status: 'paid', paidAt: new Date() },
      user: updatedUser,
      plan,
      paid: true,
    })
  } catch (err) {
    console.error('Confirm PIX payment error:', err)
    return error('Internal server error', 500)
  }
}
