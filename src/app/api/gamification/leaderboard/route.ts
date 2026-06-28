import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const period = req.nextUrl.searchParams.get('period') || '30d'

    // Privacy-aware leaderboard: rank by referral count and career points
    // (no monetary values are exposed across users).
    const topUsersRaw = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        plan: true,
        profileImage: true,
        careerPoints: true,
        personalPoints: true,
        _count: { select: { referrals: true } },
      },
      orderBy: { careerPoints: 'desc' },
      take: 20,
    })

    const leaderboard = topUsersRaw.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: user.name,
      plan: user.plan,
      careerPoints: user.careerPoints + user.personalPoints,
      directReferrals: user._count.referrals,
      badge: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null,
    }))

    return success({ leaderboard, period })
  } catch (err) {
    return error('Failed to fetch leaderboard', 500)
  }
}
