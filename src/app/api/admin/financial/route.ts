import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const admin = await db.findOne('User', '"id" = $1', [userId])
    if (!admin || (admin.role !== 'admin' && admin.email !== 'admin@newmobility.com' && admin.email !== 'carlos.silva@email.com')) {
      return error('Unauthorized', 403)
    }

    // 1. Overview stats
    const [
      totalRevenueResult,
      totalPlatformBalanceResult,
      pendingWithdrawalsResult,
      approvedWithdrawalsResult,
      totalCashbackResult,
      totalInCirculationResult,
    ] = await Promise.all([
      // Total revenue: sum of deposit + plan_payment type transactions
      db.execute('SELECT COALESCE(SUM("amount"), 0) as total FROM "Transaction" WHERE "type" IN ($1, $2) AND "status" IN ($3, $4)', ['deposit', 'plan_payment', 'paid', 'approved']),
      // Total platform balance: sum of all user balanceWithdrawal
      db.execute('SELECT COALESCE(SUM("balanceWithdrawal"), 0) as total FROM "User"'),
      // Pending withdrawals
      db.execute('SELECT COALESCE(SUM("amount"), 0) as total FROM "Transaction" WHERE "type" = $1 AND "status" = $2', ['withdrawal', 'pending']),
      // Approved withdrawals
      db.execute('SELECT COALESCE(SUM("amount"), 0) as total FROM "Transaction" WHERE "type" = $1 AND "status" IN ($2, $3)', ['withdrawal', 'approved', 'paid']),
      // Total cashback distributed (from cashback tables)
      db.execute('SELECT COALESCE(SUM("amount"), 0) as total FROM "Transaction" WHERE "type" IN ($1, $2, $3) AND "status" IN ($4, $5)', ['cashback_entry', 'cashback_residual', 'cashback_sales', 'paid', 'approved']),
      // Total in circulation: sum of all user balances
      db.execute('SELECT COALESCE(SUM("balanceWithdrawal" + "balanceMobility" + "balanceShopping" + "balanceFood" + "balancePharmacy" + "balanceGratification"), 0) as total FROM "User"'),
    ])

    const overview = {
      totalRevenue: Number(totalRevenueResult[0]?.total || 0),
      totalPlatformBalance: Number(totalPlatformBalanceResult[0]?.total || 0),
      pendingWithdrawals: Number(pendingWithdrawalsResult[0]?.total || 0),
      approvedWithdrawals: Number(approvedWithdrawalsResult[0]?.total || 0),
      totalCashback: Number(totalCashbackResult[0]?.total || 0),
      totalInCirculation: Number(totalInCirculationResult[0]?.total || 0),
    }

    // 2. Recent transactions (last 50)
    const recentTransactionsRaw = await db.execute(
      `SELECT t."id", t."userId", t."type", t."amount", t."status", t."category", t."description", t."createdAt",
              u."name" as "userName", u."email" as "userEmail"
       FROM "Transaction" t
       LEFT JOIN "User" u ON t."userId" = u."id"
       ORDER BY t."createdAt" DESC
       LIMIT 50`
    )

    const recentTransactions = recentTransactionsRaw.map((t: any) => ({
      id: t.id,
      userId: t.userId,
      userName: t.userName || 'Usuário',
      userEmail: t.userEmail || '',
      type: t.type,
      amount: Number(t.amount || 0),
      status: t.status,
      category: t.category || '',
      description: t.description || '',
      createdAt: t.createdAt,
    }))

    // 3. Monthly revenue for last 6 months
    const monthlyRevenueRaw = await db.execute(
      `SELECT TO_CHAR("createdAt", 'YYYY-MM') as month,
              COALESCE(SUM("amount"), 0) as revenue
       FROM "Transaction"
       WHERE "type" IN ('deposit', 'plan_payment')
         AND "status" IN ('paid', 'approved')
         AND "createdAt" >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
       ORDER BY month DESC`
    )

    const monthlyRevenue = monthlyRevenueRaw.map((m: any) => ({
      month: m.month,
      revenue: Number(m.revenue || 0),
    }))

    // 4. Category breakdown
    const categoryBreakdownRaw = await db.execute(
      `SELECT COALESCE("category", 'other') as category,
              COALESCE(SUM("amount"), 0) as amount
       FROM "Transaction"
       WHERE "status" IN ('paid', 'approved')
       GROUP BY COALESCE("category", 'other')
       ORDER BY amount DESC`
    )

    const categoryBreakdown = categoryBreakdownRaw.map((c: any) => ({
      category: c.category,
      amount: Number(c.amount || 0),
    }))

    return success({
      overview,
      recentTransactions,
      monthlyRevenue,
      categoryBreakdown,
    })
  } catch (err) {
    console.error('Admin financial GET error:', err)
    return error('Failed to fetch financial data', 500)
  }
}
