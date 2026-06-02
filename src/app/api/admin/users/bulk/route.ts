import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, userIds, action } = body

    if (!userId) return error('userId is required', 400)
    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user || (user as any).role !== 'admin') return error('Unauthorized', 403)

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return error('userIds array is required', 400)
    }

    if (action !== 'activate' && action !== 'deactivate') {
      return error('action must be "activate" or "deactivate"', 400)
    }

    const isActive = action === 'activate'
    const placeholders = userIds.map((_: string, i: number) => `$${i + 1}`).join(', ')
    await db.execute(
      `UPDATE "User" SET "isActive" = ${isActive}, "updatedAt" = NOW() WHERE "id" IN (${placeholders})`,
      userIds
    )

    return success({
      action,
      affectedCount: userIds.length,
      isActive,
    })
  } catch (err) {
    return error('Failed to perform bulk action', 500)
  }
}
