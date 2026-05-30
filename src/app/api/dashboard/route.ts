import { db } from '@/lib/db'
import { success, error, formatTimeSince, getCareerRank, getNextRank } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return error('userId is required')
    }

    const user = await db.findOne('User', '"id" = $1', [userId])

    if (!user) {
      return error('User not found', 404)
    }

    // Time since registration
    const timeSinceRegistration = formatTimeSince(new Date(user.createdAt))

    // Direct referral count
    const referralCountResult = await db.execute(
      'SELECT COUNT(*)::int as count FROM "User" WHERE "referredById" = $1',
      [userId]
    )
    const directReferralCount = referralCountResult[0]?.count || 0

    // Cashback entrada stats - use SQL aggregation for efficiency
    const entradaStats = await db.execute(
      'SELECT COALESCE(SUM("amount"), 0) as total, "level", COUNT(*)::int as cnt FROM "CashbackEntry" WHERE "userId" = $1 GROUP BY "level"',
      [userId]
    )
    const totalEntradaEarned = (entradaStats as any[]).reduce((sum: number, e: any) => sum + Number(e.total), 0)
    const entradaUsersByLevel: Record<number, number> = {}
    let totalEntradaUsers = 0
    for (const e of entradaStats as any[]) {
      entradaUsersByLevel[e.level] = e.cnt
      totalEntradaUsers += e.cnt
    }

    // Cashback residual stats
    const residualStats = await db.execute(
      'SELECT COALESCE(SUM("amount"), 0) as total, "level", COUNT(*)::int as cnt FROM "CashbackResidual" WHERE "userId" = $1 GROUP BY "level"',
      [userId]
    )
    const totalResidualEarned = (residualStats as any[]).reduce((sum: number, e: any) => sum + Number(e.total), 0)
    const residualUsersByLevel: Record<number, number> = {}
    let totalResidualUsers = 0
    for (const e of residualStats as any[]) {
      residualUsersByLevel[e.level] = e.cnt
      totalResidualUsers += e.cnt
    }

    // Cashback vendas stats
    const vendasStats = await db.execute(
      'SELECT COALESCE(SUM("amount"), 0) as total, "level", COUNT(*)::int as cnt FROM "CashbackSales" WHERE "userId" = $1 GROUP BY "level"',
      [userId]
    )
    const totalVendasEarned = (vendasStats as any[]).reduce((sum: number, e: any) => sum + Number(e.total), 0)
    const vendasUsersByLevel: Record<number, number> = {}
    let totalVendasUsers = 0
    for (const e of vendasStats as any[]) {
      vendasUsersByLevel[e.level] = e.cnt
      totalVendasUsers += e.cnt
    }

    // Recent transactions
    const recentTransactions = await db.find(
      'Transaction',
      '"userId" = $1',
      [userId],
      'ORDER BY "createdAt" DESC LIMIT 10'
    )

    // Career info
    const currentRank = getCareerRank(user.careerPoints)
    const nextRank = getNextRank(user.careerPoints)

    // User distribution for chart (by plan)
    const planDistribution = await db.execute(
      'SELECT "plan", COUNT(*)::int as count FROM "User" GROUP BY "plan"'
    )
    const usersByPlan: Record<string, number> = {}
    for (const u of planDistribution as any[]) {
      usersByPlan[u.plan] = u.count
    }

    // Revenue by category for chart
    const categoryRevenue = await db.execute(
      'SELECT COALESCE("category", \'other\') as cat, SUM("amount") as total FROM "Transaction" WHERE "userId" = $1 AND "status" = $2 GROUP BY "category"',
      [userId, 'approved']
    )
    const revenueByCategory: Record<string, number> = {}
    for (const t of categoryRevenue as any[]) {
      revenueByCategory[t.cat] = Number(t.total)
    }

    return success({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        plan: user.plan,
        referralCode: user.referralCode,
        language: user.language,
        isActive: user.isActive,
        profileImage: user.profileImage,
        isDriver: user.isDriver,
        stars: user.stars,
        timeSinceRegistration,
      },
      directReferralCount,
      cashbackEntrada: {
        totalUsers: totalEntradaUsers,
        totalEarned: totalEntradaEarned,
        byLevel: entradaUsersByLevel,
      },
      cashbackResidual: {
        totalUsers: totalResidualUsers,
        totalEarned: totalResidualEarned,
        byLevel: residualUsersByLevel,
      },
      cashbackVendas: {
        totalUsers: totalVendasUsers,
        totalEarned: totalVendasEarned,
        byLevel: vendasUsersByLevel,
      },
      balances: {
        withdrawal: user.balanceWithdrawal,
        mobility: user.balanceMobility,
        shopping: user.balanceShopping,
        food: user.balanceFood,
        pharmacy: user.balancePharmacy,
        gratification: user.balanceGratification,
      },
      recentTransactions,
      career: {
        currentRank: currentRank.name,
        stars: currentRank.stars,
        points: user.careerPoints,
        nextRank: nextRank ? { name: nextRank.name, pointsNeeded: nextRank.minPoints - user.careerPoints } : null,
        progress: nextRank ? (user.careerPoints / nextRank.minPoints) * 100 : 100,
      },
      userDistribution: usersByPlan,
      revenueByCategory,
    })
  } catch (err) {
    console.error('Dashboard error:', err)
    return error('Internal server error', 500)
  }
}
