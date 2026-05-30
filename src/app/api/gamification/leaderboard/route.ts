import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const period = req.nextUrl.searchParams.get('period') || '30d'

    // Get top earners with referral count via subquery
    const topEarners = await db.execute(
      `SELECT u.id, u.name, u.plan, u."profileImage", u."careerPoints", u."balanceWithdrawal",
        (SELECT COUNT(*)::int FROM "User" r WHERE r."referredById" = u.id) as "directReferrals"
      FROM "User" u
      WHERE u."isActive" = true
      ORDER BY u."balanceWithdrawal" DESC
      LIMIT 20`,
      []
    ) as any[]

    const leaderboard = topEarners.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: user.name,
      plan: user.plan,
      careerPoints: user.careerPoints,
      totalEarnings: user.balanceWithdrawal,
      directReferrals: user.directReferrals,
      badge: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null,
    }))

    return success({ leaderboard, period })
  } catch (err) {
    return error('Failed to fetch leaderboard', 500)
  }
}
