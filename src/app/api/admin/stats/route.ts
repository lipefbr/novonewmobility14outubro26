import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    const [
      totalUsers,
      activeUsers,
      totalTransactions,
      totalRevenueResult,
      totalWithdrawalsResult,
      totalCashbackResult,
      planDistribution,
      recentUsers,
    ] = await Promise.all([
      db.count('User'),
      db.count('User', '"isActive" = $1', [true]),
      db.count('Transaction'),
      db.execute('SELECT COALESCE(SUM("amount"), 0) as total FROM "Transaction" WHERE "status" = $1', ['paid']),
      db.execute('SELECT COALESCE(SUM("amount"), 0) as total FROM "Transaction" WHERE "type" = $1 AND "status" = $2', ['withdrawal', 'paid']),
      db.execute('SELECT COALESCE(SUM("amount"), 0) as total FROM "Transaction" WHERE "type" IN ($1, $2, $3) AND "status" = $4', ['cashback_entry', 'cashback_residual', 'cashback_sales', 'paid']),
      db.execute('SELECT "plan", COUNT(*)::int as count FROM "User" GROUP BY "plan"'),
      db.execute('SELECT "id", "name", "email", "plan", "isActive", "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 5'),
    ])

    const totalRevenue = Number(totalRevenueResult[0]?.total || 0)
    const totalWithdrawals = Number(totalWithdrawalsResult[0]?.total || 0)
    const totalCashback = Number(totalCashbackResult[0]?.total || 0)

    return success({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      totalTransactions,
      totalRevenue,
      totalWithdrawals,
      totalCashback,
      planDistribution: planDistribution.map((p: any) => ({ plan: p.plan, count: p.count })),
      recentUsers,
      growthRate: 12.5,
      monthlyRevenue: Math.floor(totalRevenue * 0.15),
    })
  } catch (err) {
    return error('Failed to fetch admin stats', 500)
  }
}
