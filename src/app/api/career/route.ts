import { db } from '@/lib/db'
import { success, error, CAREER_RANKS, getCareerRank, getNextRank } from '@/lib/api-utils'

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

    const currentRank = getCareerRank(user.careerPoints)
    const nextRank = getNextRank(user.careerPoints)
    const progress = nextRank
      ? Math.min(((user.careerPoints / nextRank.minPoints) * 100), 100)
      : 100

    // Get career milestones
    const milestones = await db.find(
      'CareerMilestone',
      '"userId" = $1',
      [userId],
      'ORDER BY "pointsRequired" ASC'
    )

    // If milestones don't exist yet, create the default list
    let milestoneData = milestones as any[]
    if (milestoneData.length === 0) {
      milestoneData = CAREER_RANKS.map((rank) => ({
        milestone: rank.name,
        pointsRequired: rank.minPoints,
        achieved: user.careerPoints >= rank.minPoints,
        achievedAt: user.careerPoints >= rank.minPoints ? new Date() : null,
      })) as any[]
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
      milestones: milestoneData.map((m: any) => ({
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
