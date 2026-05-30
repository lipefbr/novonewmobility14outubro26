import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const announcements = await db.find(
      'Announcement',
      '"isActive" = $1',
      [true],
      'ORDER BY "priority" DESC, "createdAt" DESC'
    )
    const now = new Date()
    const active = (announcements as any[]).filter(a => {
      if (a.startDate && new Date(a.startDate) > now) return false
      if (a.endDate && new Date(a.endDate) < now) return false
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

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user || (user as any).role !== 'admin') return error('Unauthorized', 403)

    if (!title || !message) return error('title and message are required', 400)

    const announcement = await db.insert('Announcement', {
      title,
      message,
      type: type || 'info',
      priority: priority || 'normal',
      actionLabel: actionLabel || null,
      actionUrl: actionUrl || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdBy: userId,
    })

    return success(announcement, 201)
  } catch (err) {
    return error('Failed to create announcement', 500)
  }
}
