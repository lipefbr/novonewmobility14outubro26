import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// Task 3: in-memory cache (30s). The /admin/dashboard endpoint previously
// ran ~28 sequential Prisma queries (including 12 inside a 6-month loop),
// which on Neon Postgres could exceed the 10s frontend timeout — especially
// during cold-starts.
const DASHBOARD_CACHE_TTL_MS = 30_000
let cachedDashboard: { data: any; ts: number } | null = null

export async function GET(req: NextRequest) {
  try {
    const adminUserId = req.nextUrl.searchParams.get('userId')
    if (!adminUserId) return error('userId is required', 400)

    const admin = await prisma.user.findUnique({ where: { id: adminUserId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    // Serve cached payload if still fresh.
    if (cachedDashboard && Date.now() - cachedDashboard.ts < DASHBOARD_CACHE_TTL_MS) {
      return success(cachedDashboard.data)
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    // First day of the month 5 months ago — start of the 6-month window
    // (current month + previous 5).
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    // Run all independent queries in PARALLEL (was sequential). Each query
    // resolves to a safe fallback on error so one failure does not break
    // the whole response.
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      revenueAgg,
      pendingWdAgg,
      cashbackAgg,
      planGroups,
      recentTransactions,
      topEarners,
      thisMonthUsers,
      lastMonthUsers,
      monthlyUsersRaw,
      monthlyRevenueRaw,
      pendingWithdrawalsList,
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.user.count({ where: { isActive: true } }).catch(() => 0),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }).catch(() => 0),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'paid', type: { in: ['deposit', 'cashback_entry', 'cashback_residual', 'cashback_sales', 'gratification', 'bonus'] } },
      }).catch(() => ({ _sum: { amount: null } })),
      prisma.transaction.aggregate({
        _sum: { amount: true }, _count: true,
        where: { type: 'withdrawal', status: 'pending' },
      }).catch(() => ({ _sum: { amount: null }, _count: 0 })),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: { in: ['cashback_entry', 'cashback_residual', 'cashback_sales'] }, status: 'approved' },
      }).catch(() => ({ _sum: { amount: null } })),
      // Postgres supports native groupBy — far cheaper than findMany + manual
      // aggregation over the full users table.
      prisma.user.groupBy({
        by: ['plan'],
        _count: { _all: true },
      }).catch(() => []),
      prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }).catch(() => []),
      prisma.user.findMany({
        take: 10,
        orderBy: { balanceWithdrawal: 'desc' },
        select: { id: true, name: true, email: true, plan: true, balanceWithdrawal: true, careerPoints: true },
      }).catch(() => []),
      prisma.user.count({ where: { createdAt: { gte: thisMonthStart } } }).catch(() => 0),
      prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }).catch(() => 0),
      // Single query for the whole 6-month window — replaces the previous
      // 6-iteration loop with 12 sequential queries.
      prisma.user.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }).catch(() => []),
      prisma.transaction.findMany({
        where: {
          status: 'paid',
          createdAt: { gte: sixMonthsAgo },
          type: { in: ['deposit', 'bonus'] },
        },
        select: { amount: true, createdAt: true },
      }).catch(() => []),
      prisma.transaction.findMany({
        where: { type: 'withdrawal', status: 'pending' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }).catch(() => []),
    ])

    const totalRevenue = revenueAgg._sum.amount || 0
    const pendingWithdrawals = pendingWdAgg._sum.amount || 0
    const pendingWithdrawalsCount = pendingWdAgg._count || 0
    const totalCashbackDistributed = cashbackAgg._sum.amount || 0
    const planDistribution = (planGroups as any[])
      .map((g) => ({ plan: g.plan, count: g._count?._all ?? 0 }))

    const monthlyGrowth = lastMonthUsers > 0
      ? Number((((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100).toFixed(1))
      : 100

    // Aggregate the 6-month window in memory: group rows by 'YYYY-MM' bucket.
    // Build the buckets up-front so months with zero activity still appear.
    const monthlyGrowthData: { month: string; newUsers: number; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthlyGrowthData.push({
        month: monthStart.toISOString().slice(0, 7),
        newUsers: 0,
        revenue: 0,
      })
    }
    const bucketMap = new Map(monthlyGrowthData.map((b) => [b.month, b]))
    for (const u of monthlyUsersRaw as { createdAt: Date }[]) {
      const key = u.createdAt.toISOString().slice(0, 7)
      const bucket = bucketMap.get(key)
      if (bucket) bucket.newUsers += 1
    }
    for (const t of monthlyRevenueRaw as { amount: number; createdAt: Date }[]) {
      const key = t.createdAt.toISOString().slice(0, 7)
      const bucket = bucketMap.get(key)
      if (bucket) bucket.revenue += t.amount || 0
    }

    const data = {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      newUsersToday,
      totalRevenue,
      pendingWithdrawals,
      pendingWithdrawalsCount,
      totalCashbackDistributed,
      planDistribution,
      recentTransactions,
      topEarners,
      monthlyGrowth,
      monthlyGrowthData,
      pendingWithdrawalsList,
    }

    cachedDashboard = { data, ts: Date.now() }

    return success(data)
  } catch (err) {
    console.error('Admin dashboard GET error:', err)
    return error('Failed to fetch dashboard data', 500)
  }
}
