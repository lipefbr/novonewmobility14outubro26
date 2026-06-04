import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const adminUserId = req.nextUrl.searchParams.get('userId')
    if (!adminUserId) return error('userId is required', 400)

    const admin = await db.user.findUnique({ where: { id: adminUserId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    const filterUserId = req.nextUrl.searchParams.get('filterUserId') || undefined
    const type = req.nextUrl.searchParams.get('type') || undefined
    const isClaimedStr = req.nextUrl.searchParams.get('isClaimed')
    const isClaimed = isClaimedStr !== null ? isClaimedStr === 'true' : undefined
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
    const limit = 20

    const where: Record<string, unknown> = {}
    if (filterUserId) where.userId = filterUserId
    if (type) where.type = type
    if (isClaimed !== undefined) where.isClaimed = isClaimed

    const [gratifications, total] = await Promise.all([
      db.gratification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.gratification.count({ where }),
    ])

    return success({
      gratifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    return error('Failed to fetch gratifications', 500)
  }
}
