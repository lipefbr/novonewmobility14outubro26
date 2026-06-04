import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, targetUserId, type, amount, category, description } = body

    if (!userId) return error('userId is required', 400)

    const admin = await db.user.findUnique({ where: { id: userId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    if (!targetUserId || !type || !amount || !category) {
      return error('targetUserId, type, amount, and category are required', 400)
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return error('amount must be a positive number', 400)
    }

    const targetUser = await db.user.findUnique({ where: { id: targetUserId } })
    if (!targetUser) return error('Target user not found', 404)

    const gratification = await db.gratification.create({
      data: {
        userId: targetUserId,
        type,
        amount,
        category,
        description: description || `Gratificação ${type} atribuída pelo admin`,
        isClaimed: false,
      },
    })

    return success(gratification, 201)
  } catch (err) {
    return error('Failed to assign gratification', 500)
  }
}
