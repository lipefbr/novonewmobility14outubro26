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

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return error('User not found', 404)
    }

    // Check if it's actually an upgrade
    const planOrder = { free: 0, blue3: 1, blue5: 2 }
    if (planOrder[plan as keyof typeof planOrder] <= planOrder[user.plan as keyof typeof planOrder]) {
      return error('Can only upgrade to a higher plan')
    }

    const planPrices: Record<string, number> = { blue3: 9700, blue5: 14700 }
    const price = planPrices[plan]

    // Create invoice
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)

    const invoice = await db.invoice.create({
      data: {
        userId,
        amount: price,
        type: `plan_${plan}`,
        status: 'pending',
        dueDate,
      },
    })

    // For demo purposes, auto-approve the upgrade
    await db.user.update({
      where: { id: userId },
      data: {
        plan,
        isActive: true,
      },
    })

    // Mark invoice as paid
    await db.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
    })

    // Create transaction
    await db.transaction.create({
      data: {
        userId,
        type: 'deposit',
        amount: price,
        status: 'approved',
        category: 'plan_upgrade',
        description: `Upgrade para plano ${plan === 'blue3' ? 'Blue 3' : 'Blue 5'}`,
      },
    })

    const updatedUser = await db.user.findUnique({ where: { id: userId } })

    return success({
      invoice,
      user: updatedUser,
    }, 201)
  } catch (err) {
    console.error('Plan upgrade error:', err)
    return error('Internal server error', 500)
  }
}
