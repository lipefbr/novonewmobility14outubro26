import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// PUT approve or reject a withdrawal
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { userId, action, reason } = body

    if (!userId) return error('userId is required', 400)

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    if (!action || !['approve', 'reject'].includes(action)) {
      return error('action must be "approve" or "reject"', 400)
    }

    // Find the withdrawal transaction
    const transaction = await db.findOne('Transaction', '"id" = $1 AND "type" = $2', [id, 'withdrawal'])
    if (!transaction) return error('Withdrawal not found', 404)

    if ((transaction as any).status !== 'pending') {
      return error('Withdrawal is not pending', 400)
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const updateData: Record<string, unknown> = {
      status: newStatus,
    }

    const updated = await db.update('Transaction', '"id" = $1', updateData, [id])

    // If rejected, refund the user's balance
    if (action === 'reject') {
      try {
        const amount = (transaction as any).amount
        const txUserId = (transaction as any).userId
        await db.execute(
          `UPDATE "User" SET "balanceWithdrawal" = "balanceWithdrawal" + $1 WHERE "id" = $2`,
          [amount, txUserId]
        )
      } catch {
        // Ignore refund errors
      }
    }

    return success({
      ...updated,
      action: newStatus,
      reason: reason || null,
    })
  } catch (err) {
    console.error('Update withdrawal error:', err)
    return error('Failed to update withdrawal', 500)
  }
}
