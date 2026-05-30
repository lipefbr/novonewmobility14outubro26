import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const notifications = await db.find(
      'Notification',
      '"userId" = $1',
      [userId],
      'ORDER BY "createdAt" DESC LIMIT 20'
    )

    const unreadCount = await db.count(
      'Notification',
      '"userId" = $1 AND "isRead" = false',
      [userId]
    )

    return success({ notifications, unreadCount })
  } catch (err) {
    return error('Failed to fetch notifications', 500)
  }
}
