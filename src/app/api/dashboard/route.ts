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
    const directReferralCount = await db.count('User', '"referredById" = $1', [userId])

    // Cashback entrada stats
    const entradaRecords = await db.find('CashbackEntry', '"userId" = $1', [userId])
    const totalEntradaEarned = entradaRecords.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)
    const entradaUsersByLevel: Record<number, number> = {}
    let totalEntradaUsers = 0
    for (const e of entradaRecords) {
      entradaUsersByLevel[e.level] = (entradaUsersByLevel[e.level] || 0) + 1
      totalEntradaUsers++
    }

    // Cashback residual stats
    const residualRecords = await db.find('CashbackResidual', '"userId" = $1', [userId])
    const totalResidualEarned = residualRecords.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)
    const residualUsersByLevel: Record<number, number> = {}
    let totalResidualUsers = 0
    for (const e of residualRecords) {
      residualUsersByLevel[e.level] = (residualUsersByLevel[e.level] || 0) + 1
      totalResidualUsers++
    }

    // Cashback vendas stats
    const vendasRecords = await db.find('CashbackSales', '"userId" = $1', [userId])
    const totalVendasEarned = vendasRecords.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)
    const vendasUsersByLevel: Record<number, number> = {}
    let totalVendasUsers = 0
    for (const e of vendasRecords) {
      vendasUsersByLevel[e.level] = (vendasUsersByLevel[e.level] || 0) + 1
      totalVendasUsers++
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
    const allUsers = await db.find('User', '', [])
    const usersByPlan: Record<string, number> = {}
    for (const u of allUsers) {
      usersByPlan[u.plan] = (usersByPlan[u.plan] || 0) + 1
    }

    // Revenue by category for chart
    const approvedTransactions = await db.find(
      'Transaction',
      '"userId" = $1 AND "status" = $2',
      [userId, 'approved']
    )
    const revenueByCategory: Record<string, number> = {}
    for (const t of approvedTransactions) {
      const cat = t.category || 'other'
      revenueByCategory[cat] = (revenueByCategory[cat] || 0) + Number(t.amount || 0)
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
        withdrawal: user.balanceWithdrawal || 0,
        mobility: user.balanceMobility || 0,
        shopping: user.balanceShopping || 0,
        food: user.balanceFood || 0,
        pharmacy: user.balancePharmacy || 0,
        gratification: user.balanceGratification || 0,
      },
      recentTransactions,
      career: {
        currentRank: currentRank.name,
        stars: currentRank.stars,
        points: user.careerPoints || 0,
        nextRank: nextRank ? { name: nextRank.name, pointsNeeded: nextRank.minPoints - (user.careerPoints || 0) } : null,
        progress: nextRank ? ((user.careerPoints || 0) / nextRank.minPoints) * 100 : 100,
      },
      userDistribution: usersByPlan,
      revenueByCategory,
    })
  } catch (err) {
    console.error('Dashboard error:', err)
    return error('Internal server error', 500)
  }
}
