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
