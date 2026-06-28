import { db, prisma } from '@/lib/db'
import { success, error, formatTimeSince } from '@/lib/api-utils'

// Count all descendants in the referral tree (recursive, up to 9 levels deep).
// Returns the total number of descendants, a per-level breakdown, and the
// count of descendants that are currently active.
async function countNetworkDescendants(userId: string): Promise<{
  total: number
  byLevel: Record<number, number>
  activeTotal: number
}> {
  const byLevel: Record<number, number> = {}
  let total = 0
  let activeTotal = 0
  let currentLevel: string[] = [userId]

  for (let level = 1; level <= 9; level++) {
    if (currentLevel.length === 0) break
    const children = await db.find(
      'User',
      '"referredById" IN $1',
      [currentLevel]
    ) as any[]
    if (children.length === 0) break
    byLevel[level] = children.length
    total += children.length
    activeTotal += children.filter((c) => c.isActive === true).length
    currentLevel = children.map((c) => c.id)
  }

  return { total, byLevel, activeTotal }
}

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

    // Direct referrals (used for active-direct and new-this-month counts)
    const directReferrals = await db.find('User', '"referredById" = $1', [userId]) as any[]
    const activeDirect = directReferrals.filter((r) => r.isActive === true).length

    // New referrals created in the current calendar month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const newReferrals = directReferrals.filter(
      (r) => new Date(r.createdAt) >= startOfMonth
    ).length

    // Walk the entire referral network (up to 9 levels deep) and count
    // descendants by level. This drives the Cashback matrix user counts
    // (Entrada = 5 levels, Residual = 7 levels, Vendas = 9 levels) and the
    // Visão Rede / Membros Ativos widgets.
    const network = await countNetworkDescendants(userId)

    const entradaLevels = [1, 2, 3, 4, 5]
    const residualLevels = [1, 2, 3, 4, 5, 6, 7]
    const vendasLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9]

    const sumByLevels = (levels: number[]) =>
      levels.reduce((sum, lvl) => sum + (network.byLevel[lvl] || 0), 0)
    const pickByLevels = (levels: number[]): Record<number, number> => {
      const out: Record<number, number> = {}
      for (const lvl of levels) out[lvl] = network.byLevel[lvl] || 0
      return out
    }

    const totalEntradaUsers = sumByLevels(entradaLevels)
    const totalResidualUsers = sumByLevels(residualLevels)
    const totalVendasUsers = sumByLevels(vendasLevels)
    const entradaUsersByLevel = pickByLevels(entradaLevels)
    const residualUsersByLevel = pickByLevels(residualLevels)
    const vendasUsersByLevel = pickByLevels(vendasLevels)

    // Cashback earned (kept for internal use / backwards compatibility)
    const entradaRecords = await db.find('CashbackEntry', '"userId" = $1', [userId])
    const totalEntradaEarned = entradaRecords.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)

    const residualRecords = await db.find('CashbackResidual', '"userId" = $1', [userId])
    const totalResidualEarned = residualRecords.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)

    const vendasRecords = await db.find('CashbackSales', '"userId" = $1', [userId])
    const totalVendasEarned = vendasRecords.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)

    // Recent transactions
    const recentTransactions = await db.find(
      'Transaction',
      '"userId" = $1',
      [userId],
      'ORDER BY "createdAt" DESC LIMIT 10'
    )

    // Career info — read from the admin-managed CareerPlan table so admin
    // edits propagate to the dashboard too. Mirrors the logic in
    // /api/career/route.ts.
    const careerPoints = Number(user.careerPoints || 0)
    const careerPlans = await prisma.careerPlan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })
    let currentCareerPlan: typeof careerPlans[number] | null = null
    for (const p of careerPlans) {
      if (careerPoints >= p.minPoints) currentCareerPlan = p
    }
    const hasAchievedAnyCareer = currentCareerPlan !== null
    const nextCareerPlan = hasAchievedAnyCareer
      ? (careerPlans.find((p) => careerPoints < p.minPoints) || null)
      : (careerPlans[0] || null)
    const careerProgress = nextCareerPlan
      ? Math.min(((careerPoints / nextCareerPlan.minPoints) * 100), 100)
      : 100

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
      network: {
        totalSize: network.total,
        activeMembers: activeDirect,
        newReferrals,
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
        currentRank: currentCareerPlan?.name ?? 'Associado',
        stars: currentCareerPlan?.sortOrder ?? 0,
        points: careerPoints,
        nextRank: nextCareerPlan
          ? { name: nextCareerPlan.name, pointsNeeded: Math.max(nextCareerPlan.minPoints - careerPoints, 0) }
          : null,
        progress: careerProgress,
      },
      userDistribution: usersByPlan,
      revenueByCategory,
    })
  } catch (err) {
    console.error('Dashboard error:', err)
    return error('Internal server error', 500)
  }
}
