import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    const search = req.nextUrl.searchParams.get('search') || ''
    const plan = req.nextUrl.searchParams.get('plan') || 'all'
    const status = req.nextUrl.searchParams.get('status') || 'all'
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build Prisma where clause
    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { referralCode: { contains: search } },
      ]
    }
    if (plan !== 'all') {
      where.plan = plan
    }
    if (status !== 'all') {
      where.isActive = status === 'active'
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          _count: { select: { referrals: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    // Format users to match API contract (remove password)
    const usersWithCount = users.map((u) => {
      const { password: _password, referrals: _referrals, ...rest } = u
      return {
        ...rest,
        _count: { referrals: u._count.referrals },
      }
    })

    return success({ users: usersWithCount, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('Admin users GET error:', err)
    return error('Failed to fetch users', 500)
  }
}
