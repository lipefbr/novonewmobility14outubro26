import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const admin = await prisma.user.findUnique({ where: { id: userId } })
    if (!admin || (admin.role !== 'admin' && admin.email !== 'admin@newmobility.com' && admin.email !== 'carlos.silva@email.com')) {
      return error('Unauthorized', 403)
    }

    // 1. Overview stats - use Prisma aggregation
    const [
      revenueAgg,
      platformBalanceAgg,
      pendingWithdrawalsAgg,
      approvedWithdrawalsAgg,
      totalCashbackAgg,
      circulationAgg,
    ] = await Promise.all([
      // Total revenue: sum of deposit + plan_payment transactions
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: { in: ['deposit', 'plan_payment'] }, status: { in: ['paid', 'approved'] } },
      }),
      // Total platform balance: sum of all user balanceWithdrawal
      prisma.user.aggregate({ _sum: { balanceWithdrawal: true } }),
      // Pending withdrawals
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'withdrawal', status: 'pending' },
      }),
      // Approved withdrawals
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'withdrawal', status: { in: ['approved', 'paid'] } },
      }),
      // Total cashback distributed
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: { in: ['cashback_entry', 'cashback_residual', 'cashback_sales'] }, status: { in: ['paid', 'approved'] } },
      }),
      // Total in circulation: sum of all user balances
      prisma.user.aggregate({
        _sum: {
          balanceWithdrawal: true,
          balanceMobility: true,
          balanceShopping: true,
          balanceFood: true,
          balancePharmacy: true,
          balanceGratification: true,
        },
      }),
    ])

    const circ = circulationAgg._sum
    const totalInCirculation =
      (circ.balanceWithdrawal || 0) +
      (circ.balanceMobility || 0) +
      (circ.balanceShopping || 0) +
      (circ.balanceFood || 0) +
      (circ.balancePharmacy || 0) +
      (circ.balanceGratification || 0)

    const overview = {
      totalRevenue: revenueAgg._sum.amount || 0,
      totalPlatformBalance: platformBalanceAgg._sum.balanceWithdrawal || 0,
      pendingWithdrawals: pendingWithdrawalsAgg._sum.amount || 0,
      approvedWithdrawals: approvedWithdrawalsAgg._sum.amount || 0,
      totalCashback: totalCashbackAgg._sum.amount || 0,
      totalInCirculation,
    }

    // 2. Recent transactions (last 50) with user info
    const recentTransactionsRaw = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { name: true, email: true } },
      },
    })

    const recentTransactions = recentTransactionsRaw.map((t) => ({
      id: t.id,
      userId: t.userId,
      userName: t.user?.name || 'Usuário',
      userEmail: t.user?.email || '',
      type: t.type,
      amount: t.amount,
      status: t.status,
      category: t.category || '',
      description: t.description || '',
      createdAt: t.createdAt,
    }))

    // 3. Monthly revenue for last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyTx = await prisma.transaction.findMany({
      where: {
        type: { in: ['deposit', 'plan_payment'] },
        status: { in: ['paid', 'approved'] },
        createdAt: { gte: sixMonthsAgo },
      },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: 'desc' },
    })

    // Group by month in JS
    const monthMap: Record<string, number> = {}
    for (const tx of monthlyTx) {
      const month = tx.createdAt.toISOString().slice(0, 7) // YYYY-MM
      monthMap[month] = (monthMap[month] || 0) + tx.amount
    }
    const monthlyRevenue = Object.entries(monthMap)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => b.month.localeCompare(a.month))

    // 4. Category breakdown
    const categoryTx = await prisma.transaction.findMany({
      where: { status: { in: ['paid', 'approved'] } },
      select: { category: true, amount: true },
    })

    const catMap: Record<string, number> = {}
    for (const tx of categoryTx) {
      const cat = tx.category || 'other'
      catMap[cat] = (catMap[cat] || 0) + tx.amount
    }
    const categoryBreakdown = Object.entries(catMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)

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
