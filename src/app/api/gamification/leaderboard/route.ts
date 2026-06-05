import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const period = req.nextUrl.searchParams.get('period') || '30d'

    // Get top earners with referral count via Prisma _count
    const topEarnersRaw = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        plan: true,
        profileImage: true,
        careerPoints: true,
        balanceWithdrawal: true,
        _count: { select: { referrals: true } },
      },
      orderBy: { balanceWithdrawal: 'desc' },
      take: 20,
    })

    const leaderboard = topEarnersRaw.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: user.name,
      plan: user.plan,
      careerPoints: user.careerPoints,
      totalEarnings: user.balanceWithdrawal,
      directReferrals: user._count.referrals,
      badge: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null,
    }))

    return success({ leaderboard, period })
  } catch (err) {
    return error('Failed to fetch leaderboard', 500)
  }
}
