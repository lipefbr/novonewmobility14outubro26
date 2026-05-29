import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const announcements = await db.announcement.findMany({
      where: { isActive: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })
    const now = new Date()
    const active = announcements.filter(a => {
      if (a.startDate && a.startDate > now) return false
      if (a.endDate && a.endDate < now) return false
      return true
    })
    return success(active)
  } catch (err) {
    return error('Failed to fetch announcements', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, title, message, type, priority, actionLabel, actionUrl, startDate, endDate } = body
    if (!userId) return error('userId is required', 400)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    if (!title || !message) return error('title and message are required', 400)

    const announcement = await db.announcement.create({
      data: {
        title,
        message,
        type: type || 'info',
        priority: priority || 'normal',
        actionLabel,
        actionUrl,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdBy: userId,
      },
    })

    return success(announcement, 201)
  } catch (err) {
    return error('Failed to create announcement', 500)
  }
}
