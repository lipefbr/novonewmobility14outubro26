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
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20'), 50)
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

    let users: any[] = []
    let total = 0

    try {
      users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true, name: true, email: true, phone: true, cpf: true, plan: true,
          isActive: true, referralCode: true, referredById: true,
          balanceWithdrawal: true, balanceMobility: true, balanceShopping: true,
          balanceFood: true, balancePharmacy: true, balanceGratification: true,
          balanceFree: true, balancePending: true,
          careerPoints: true, personalPoints: true, stars: true,
          city: true, state: true, country: true,
          bankCode: true, bankAgency: true, bankAccount: true, bankType: true,
          pixKey: true, pixEnabled: true,
          isDriver: true, isDelivery: true, role: true, userType: true,
          createdAt: true,
          _count: { select: { referrals: true } },
        },
      })
    } catch (e) {
      console.error('Admin users findMany error:', e)
    }

    try {
      total = await prisma.user.count({ where })
    } catch (e) {
      console.error('Admin users count error:', e)
    }

    return success({ users, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('Admin users GET error:', err)
    return error('Failed to fetch users', 500)
  }
}
