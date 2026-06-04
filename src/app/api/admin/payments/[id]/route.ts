import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { userId, status, description } = body

    if (!userId) return error('userId is required', 400)

    const admin = await db.user.findUnique({ where: { id: userId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    if (!status || !['approved', 'paid', 'rejected'].includes(status)) {
      return error('status must be "approved", "paid", or "rejected"', 400)
    }

    const transaction = await db.transaction.findUnique({ where: { id } })
    if (!transaction) return error('Transaction not found', 404)

    const data: Record<string, unknown> = { status }
    if (description !== undefined) data.description = description

    // If rejecting a withdrawal, refund the amount
    if (status === 'rejected' && transaction.type === 'withdrawal' && transaction.status !== 'rejected') {
      // Refund to user's balanceWithdrawal
      await db.user.update({
        where: { id: transaction.userId },
        data: {
          balanceWithdrawal: {
            increment: transaction.amount,
          },
        },
      })

      // Create refund transaction
      await db.transaction.create({
        data: {
          userId: transaction.userId,
          type: 'deposit',
          amount: transaction.amount,
          status: 'approved',
          category: 'withdrawal',
          description: `[Admin] Reembolso de saque rejeitado`,
        },
      })
    }

    const updatedTransaction = await db.transaction.update({
      where: { id },
      data,
    })

    return success(updatedTransaction)
  } catch (err) {
    return error('Failed to update payment status', 500)
  }
}
