import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const adminUserId = req.nextUrl.searchParams.get('userId')
    if (!adminUserId) return error('userId is required', 400)

    const admin = await db.user.findUnique({ where: { id: adminUserId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Core stats
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      totalRevenueResult,
      pendingWithdrawalsResult,
      totalCashbackResult,
      planDistribution,
      recentTransactions,
      topEarners,
      thisMonthUsers,
      lastMonthUsers,
    ] = await Promise.all([
      // Total users
      db.user.count(),

      // Active users
      db.user.count({ where: { isActive: true } }),

      // New users today
      db.user.count({ where: { createdAt: { gte: todayStart } } }),

      // Total revenue (sum of all paid transaction amounts)
      db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: 'paid',
          type: { in: ['deposit', 'cashback_entry', 'cashback_residual', 'cashback_sales', 'gratification', 'bonus'] },
        },
      }),

      // Pending withdrawals
      db.transaction.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { type: 'withdrawal', status: 'pending' },
      }),

      // Total cashback distributed
      db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: { in: ['cashback_entry', 'cashback_residual', 'cashback_sales'] },
          status: 'approved',
        },
      }),

      // Plan distribution
      db.user.groupBy({
        by: ['plan'],
        _count: { plan: true },
      }),

      // Recent transactions (last 10)
      db.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),

      // Top earners (users with highest balanceWithdrawal)
      db.user.findMany({
        take: 10,
        orderBy: { balanceWithdrawal: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          balanceWithdrawal: true,
          careerPoints: true,
        },
      }),

      // This month users count for growth calculation
      db.user.count({ where: { createdAt: { gte: thisMonthStart } } }),

      // Last month users count for growth calculation
      db.user.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
    ])

    // Monthly growth calculation
    const monthlyGrowth = lastMonthUsers > 0
      ? Number((((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100).toFixed(1))
      : 100

    // Monthly growth data (last 6 months)
    const monthlyGrowthData = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthUsers = await db.user.count({
        where: { createdAt: { gte: monthStart, lt: monthEnd } },
      })
      const monthRevenue = await db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: 'paid',
          createdAt: { gte: monthStart, lt: monthEnd },
          type: { in: ['deposit', 'bonus'] },
        },
      })
      monthlyGrowthData.push({
        month: monthStart.toISOString().slice(0, 7),
        newUsers: monthUsers,
        revenue: monthRevenue._sum.amount || 0,
      })
    }

    // Pending withdrawals list
    const pendingWithdrawalsList = await db.transaction.findMany({
      where: { type: 'withdrawal', status: 'pending' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return success({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      newUsersToday,
      totalRevenue: totalRevenueResult._sum.amount || 0,
      pendingWithdrawals: pendingWithdrawalsResult._sum.amount || 0,
      pendingWithdrawalsCount: pendingWithdrawalsResult._count,
      totalCashbackDistributed: totalCashbackResult._sum.amount || 0,
      planDistribution: planDistribution.map((p) => ({
        plan: p.plan,
        count: p._count.plan,
      })),
      recentTransactions,
      topEarners,
      monthlyGrowth,
      monthlyGrowthData,
      pendingWithdrawalsList,
    })
  } catch (err) {
    return error('Failed to fetch dashboard data', 500)
  }
}
