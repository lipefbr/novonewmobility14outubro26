import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { userId } = body
    if (!userId) return error('userId is required', 400)

    await db.execute(
      `UPDATE "Notification" SET "isRead" = true WHERE "userId" = $1 AND "isRead" = false`,
      [userId]
    )

    return success({ message: 'All notifications marked as read' })
  } catch (err) {
    return error('Failed to mark all as read', 500)
  }
}
