import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error, sanitizeUser } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    const search = req.nextUrl.searchParams.get('search') || ''
    const plan = req.nextUrl.searchParams.get('plan') || 'all'
    const status = req.nextUrl.searchParams.get('status') || 'all'
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { referralCode: { contains: search } },
      ]
    }
    if (plan !== 'all') where.plan = plan
    if (status !== 'all') where.isActive = status === 'active'

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, phone: true, plan: true, isActive: true,
          referralCode: true, balanceWithdrawal: true, careerPoints: true, createdAt: true,
          referredById: true, _count: { select: { referrals: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    return success({ users, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return error('Failed to fetch users', 500)
  }
}
