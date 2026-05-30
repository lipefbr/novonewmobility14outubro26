import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, gratificationId } = body

    if (!userId || !gratificationId) {
      return error('userId and gratificationId are required')
    }

    const gratification = await db.findOne('Gratification', '"id" = $1', [gratificationId])

    if (!gratification) {
      return error('Gratification not found', 404)
    }

    if (gratification.userId !== userId) {
      return error('Gratification does not belong to this user', 403)
    }

    if (gratification.isClaimed) {
      return error('Gratification already claimed', 400)
    }

    // Mark as claimed
    const updated = await db.update(
      'Gratification',
      '"id" = $1',
      {
        isClaimed: true,
        claimedAt: new Date(),
      },
      [gratificationId]
    )

    // Add to appropriate balance based on category
    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user) {
      return error('User not found', 404)
    }

    let balanceField = 'balanceGratification'
    if (gratification.category === 'mobility') balanceField = 'balanceMobility'
    else if (gratification.category === 'shopping') balanceField = 'balanceShopping'
    else if (gratification.category === 'withdrawal') balanceField = 'balanceWithdrawal'

    const currentBalance = (user as any)[balanceField] as number
    await db.update(
      'User',
      '"id" = $1',
      { [balanceField]: currentBalance + gratification.amount },
      [userId]
    )

    // Create transaction
    await db.insert('Transaction', {
      userId,
      type: 'gratification',
      amount: gratification.amount,
      status: 'approved',
      category: 'gratification',
      description: `Gratificação resgatada: ${gratification.type}`,
    })

    return success({ gratification: updated })
  } catch (err) {
    console.error('Claim gratification error:', err)
    return error('Internal server error', 500)
  }
}
