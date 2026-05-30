import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, plan } = body

    if (!userId || !plan) {
      return error('userId and plan are required')
    }

    if (!['blue3', 'blue5'].includes(plan)) {
      return error('Invalid plan. Must be blue3 or blue5')
    }

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user) {
      return error('User not found', 404)
    }

    // Check if it's actually an upgrade
    const planOrder: Record<string, number> = { free: 0, blue3: 1, blue5: 2 }
    if (planOrder[plan] <= (planOrder[user.plan] ?? 0)) {
      return error('Can only upgrade to a higher plan')
    }

    const planPrices: Record<string, number> = { blue3: 9700, blue5: 14700 }
    const price = planPrices[plan]

    // Create invoice
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)

    const invoice = await db.insert('Invoice', {
      userId,
      amount: price,
      type: `plan_${plan}`,
      status: 'pending',
      dueDate,
    })

    // For demo purposes, auto-approve the upgrade
    await db.update(
      'User',
      '"id" = $1',
      {
        plan,
        isActive: true,
      },
      [userId]
    )

    // Mark invoice as paid
    await db.update(
      'Invoice',
      '"id" = $1',
      {
        status: 'paid',
        paidAt: new Date(),
      },
      [(invoice as any).id]
    )

    // Create transaction
    await db.insert('Transaction', {
      userId,
      type: 'deposit',
      amount: price,
      status: 'approved',
      category: 'plan_upgrade',
      description: `Upgrade para plano ${plan === 'blue3' ? 'Blue 3' : 'Blue 5'}`,
    })

    const updatedUser = await db.findOne('User', '"id" = $1', [userId])

    return success({
      invoice,
      user: updatedUser,
    }, 201)
  } catch (err) {
    console.error('Plan upgrade error:', err)
    return error('Internal server error', 500)
  }
}
