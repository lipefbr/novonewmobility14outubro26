import { db } from '@/lib/db'
import { success, error, CAREER_RANKS, getCareerRank, getNextRank } from '@/lib/api-utils'

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
        careerMilestones: { orderBy: { pointsRequired: 'asc' } },
      },
    })

    if (!user) {
      return error('User not found', 404)
    }

    const currentRank = getCareerRank(user.careerPoints)
    const nextRank = getNextRank(user.careerPoints)
    const progress = nextRank
      ? Math.min(((user.careerPoints / nextRank.minPoints) * 100), 100)
      : 100

    // If milestones don't exist yet, create the default list
    let milestones = user.careerMilestones
    if (milestones.length === 0) {
      milestones = CAREER_RANKS.map((rank) => ({
        milestone: rank.name,
        pointsRequired: rank.minPoints,
        achieved: user.careerPoints >= rank.minPoints,
        achievedAt: user.careerPoints >= rank.minPoints ? new Date() : null,
      })) as typeof milestones
    }

    return success({
      currentRank: currentRank.name,
      currentStars: currentRank.stars,
      totalPoints: user.careerPoints,
      personalPoints: user.personalPoints,
      nextRank: nextRank
        ? {
            name: nextRank.name,
            stars: nextRank.stars,
            pointsNeeded: nextRank.minPoints - user.careerPoints,
          }
        : null,
      progress,
      milestones: milestones.map((m) => ({
        id: m.id,
        milestone: m.milestone,
        pointsRequired: m.pointsRequired,
        achieved: m.achieved,
        achievedAt: m.achievedAt,
      })),
    })
  } catch (err) {
    console.error('Career error:', err)
    return error('Internal server error', 500)
  }
}
