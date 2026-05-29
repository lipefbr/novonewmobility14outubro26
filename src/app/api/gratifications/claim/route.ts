import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, gratificationId } = body

    if (!userId || !gratificationId) {
      return error('userId and gratificationId are required')
    }

    const gratification = await db.gratification.findUnique({
      where: { id: gratificationId },
    })

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
    const updated = await db.gratification.update({
      where: { id: gratificationId },
      data: {
        isClaimed: true,
        claimedAt: new Date(),
      },
    })

    // Add to appropriate balance based on category
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return error('User not found', 404)
    }

    let balanceField = 'balanceGratification'
    if (gratification.category === 'mobility') balanceField = 'balanceMobility'
    else if (gratification.category === 'shopping') balanceField = 'balanceShopping'
    else if (gratification.category === 'withdrawal') balanceField = 'balanceWithdrawal'

    await db.user.update({
      where: { id: userId },
      data: {
        [balanceField]: (user[balanceField as keyof typeof user] as number) + gratification.amount,
      },
    })

    // Create transaction
    await db.transaction.create({
      data: {
        userId,
        type: 'gratification',
        amount: gratification.amount,
        status: 'approved',
        category: 'gratification',
        description: `Gratificação resgatada: ${gratification.type}`,
      },
    })

    return success({ gratification: updated })
  } catch (err) {
    console.error('Claim gratification error:', err)
    return error('Internal server error', 500)
  }
}
