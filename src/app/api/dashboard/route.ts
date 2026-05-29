import { db } from '@/lib/db'
import { success, error, formatTimeSince, ENTRADA_LEVELS, RESIDUAL_LEVELS, CAREER_RANKS, getCareerRank, getNextRank } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return error('userId is required')
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        referrals: { select: { id: true } },
      },
    })

    if (!user) {
      return error('User not found', 404)
    }

    // Time since registration
    const timeSinceRegistration = formatTimeSince(new Date(user.createdAt))

    // Direct referral count
    const directReferralCount = user.referrals.length

    // Cashback entrada stats
    const entradaEntries = await db.cashbackEntry.findMany({ where: { userId } })
    const totalEntradaEarned = entradaEntries.reduce((sum, e) => sum + e.amount, 0)
    const entradaUsersByLevel: Record<number, number> = {}
    for (const e of entradaEntries) {
      entradaUsersByLevel[e.level] = (entradaUsersByLevel[e.level] || 0) + 1
    }
    const totalEntradaUsers = Object.values(entradaUsersByLevel).reduce((s, c) => s + c, 0)

    // Cashback residual stats
    const residualEntries = await db.cashbackResidual.findMany({ where: { userId } })
    const totalResidualEarned = residualEntries.reduce((sum, e) => sum + e.amount, 0)
    const residualUsersByLevel: Record<number, number> = {}
    for (const e of residualEntries) {
      residualUsersByLevel[e.level] = (residualUsersByLevel[e.level] || 0) + 1
    }
    const totalResidualUsers = Object.values(residualUsersByLevel).reduce((s, c) => s + c, 0)

    // Cashback vendas stats
    const vendasEntries = await db.cashbackSales.findMany({ where: { userId } })
    const totalVendasEarned = vendasEntries.reduce((sum, e) => sum + e.amount, 0)
    const vendasUsersByLevel: Record<number, number> = {}
    for (const e of vendasEntries) {
      vendasUsersByLevel[e.level] = (vendasUsersByLevel[e.level] || 0) + 1
    }
    const totalVendasUsers = Object.values(vendasUsersByLevel).reduce((s, c) => s + c, 0)

    // Recent transactions
    const recentTransactions = await db.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Career info
    const currentRank = getCareerRank(user.careerPoints)
    const nextRank = getNextRank(user.careerPoints)

    // User distribution for chart (by plan)
    const allUsers = await db.user.findMany({ select: { plan: true } })
    const usersByPlan: Record<string, number> = {}
    for (const u of allUsers) {
      usersByPlan[u.plan] = (usersByPlan[u.plan] || 0) + 1
    }

    // Revenue by category for chart
    const allTransactions = await db.transaction.findMany({
      where: { userId, status: 'approved' },
      select: { category: true, amount: true },
    })
    const revenueByCategory: Record<string, number> = {}
    for (const t of allTransactions) {
      const cat = t.category || 'other'
      revenueByCategory[cat] = (revenueByCategory[cat] || 0) + t.amount
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
