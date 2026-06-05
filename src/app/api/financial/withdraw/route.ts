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

    const user = await db.findOne('User', '"id" = $1', [userId])
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

    const currentBalance = user[balanceField] as number
    // Note: Allow negative balances - no insufficient balance check

    // Create transaction
    const transaction = await db.insert('Transaction', {
      userId,
      type: 'withdrawal',
      amount: -amountCents,
      status: 'pending',
      category: category || 'withdrawal',
      description: `Solicitação de saque - ${category || 'withdrawal'}`,
    })

    // Deduct from balance
    await db.update(
      'User',
      '"id" = $1',
      { [balanceField]: currentBalance - amountCents },
      [userId]
    )

    return success({ transaction }, 201)
  } catch (err) {
    console.error('Withdrawal error:', err)
    return error('Internal server error', 500)
  }
}
