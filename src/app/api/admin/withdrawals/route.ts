import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// GET all withdrawal requests (admin view)
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    const status = req.nextUrl.searchParams.get('status') || 'all'
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const where: Record<string, unknown> = { type: 'withdrawal' }
    if (status !== 'all') {
      where.status = status
    }

    const [withdrawals, total, statsResult] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.transaction.count({ where }),
      // Stats - compute separately
      Promise.all([
        prisma.transaction.count({ where: { type: 'withdrawal', status: 'pending' } }),
        prisma.transaction.count({ where: { type: 'withdrawal', status: 'approved' } }),
        prisma.transaction.count({ where: { type: 'withdrawal', status: 'rejected' } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'withdrawal', status: 'pending' } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'withdrawal', status: { in: ['approved', 'paid'] } } }),
      ]),
    ])

    const [pendingCount, approvedCount, rejectedCount, pendingAgg, approvedAgg] = statsResult

    const formattedWithdrawals = withdrawals.map((w) => ({
      ...w,
      userName: w.user?.name || 'Usuário',
      userEmail: w.user?.email || '',
    }))

    return success({
      withdrawals: formattedWithdrawals,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        pendingCount,
        approvedCount,
        rejectedCount,
        pendingAmount: pendingAgg._sum.amount || 0,
        approvedAmount: approvedAgg._sum.amount || 0,
      },
    })
  } catch (err) {
    console.error('Get admin withdrawals error:', err)
    return error('Failed to fetch withdrawals', 500)
  }
}
