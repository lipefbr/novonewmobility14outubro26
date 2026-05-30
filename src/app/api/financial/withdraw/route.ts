import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, amount, category } = body

    if (!userId || !amount) {
      return error('userId and amount are required')
    }

    const amountCents = Math.round(amount)

    if (amountCents <= 0) {
      return error('Amount must be positive')
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return error('User not found', 404)
    }

    // Check sufficient balance based on category
    let balanceField = 'balanceWithdrawal'
    if (category === 'mobility') balanceField = 'balanceMobility'
    else if (category === 'shopping') balanceField = 'balanceShopping'
    else if (category === 'food') balanceField = 'balanceFood'
    else if (category === 'pharmacy') balanceField = 'balancePharmacy'
    else if (category === 'gratification') balanceField = 'balanceGratification'

    const currentBalance = user[balanceField as keyof typeof user] as number
    if (currentBalance < amountCents) {
      return error('Insufficient balance', 400)
    }

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        userId,
        type: 'withdrawal',
        amount: -amountCents,
        status: 'pending',
        category: category || 'withdrawal',
        description: `Solicitação de saque - ${category || 'withdrawal'}`,
      },
    })

    // Deduct from balance
    await db.user.update({
      where: { id: userId },
      data: {
        [balanceField]: currentBalance - amountCents,
      },
    })

    return success({ transaction }, 201)
  } catch (err) {
    console.error('Withdrawal error:', err)
    return error('Internal server error', 500)
  }
}
