import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    // Get or create streak
    let streak = await db.findOne('GamificationStreak', '"userId" = $1', [userId]) as any

    if (!streak) {
      streak = await db.insert('GamificationStreak', {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastLoginDate: new Date(),
        totalPoints: 10,
      })
    }

    // Check if streak should be updated
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastLogin = streak.lastLoginDate ? new Date(streak.lastLoginDate) : null
    if (lastLogin) {
      lastLogin.setHours(0, 0, 0, 0)
      const diffDays = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        // Consecutive day - increment streak
        const newStreak = streak.currentStreak + 1
        streak = await db.update(
          'GamificationStreak',
          '"userId" = $1',
          {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, streak.longestStreak),
            lastLoginDate: new Date(),
            totalPoints: streak.totalPoints + (newStreak >= 7 ? 20 : 10),
          },
          [userId]
        )
      } else if (diffDays > 1) {
        // Streak broken - reset
        streak = await db.update(
          'GamificationStreak',
          '"userId" = $1',
          {
            currentStreak: 1,
            lastLoginDate: new Date(),
            totalPoints: streak.totalPoints + 5,
          },
          [userId]
        )
      }
    }

    // Streak rewards
    const streakRewards = [
      { days: 3, points: 10, claimed: (streak as any).currentStreak >= 3 },
      { days: 7, points: 50, claimed: (streak as any).currentStreak >= 7 },
      { days: 14, points: 100, claimed: (streak as any).currentStreak >= 14 },
      { days: 30, points: 500, claimed: (streak as any).currentStreak >= 30 },
    ]

    return success({
      currentStreak: (streak as any).currentStreak,
      longestStreak: (streak as any).longestStreak,
      totalPoints: (streak as any).totalPoints,
      lastLoginDate: (streak as any).lastLoginDate,
      streakRewards,
    })
  } catch (err) {
    return error('Failed to fetch streak', 500)
  }
}
