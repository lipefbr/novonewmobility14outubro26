import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { notificationId } = body
    if (!notificationId) return error('notificationId is required', 400)

    const notification = await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })

    return success(notification)
  } catch (err) {
    return error('Failed to mark notification as read', 500)
  }
}
