import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    // Get or create streak
    let streak = await db.gamificationStreak.findUnique({ where: { userId } })

    if (!streak) {
      streak = await db.gamificationStreak.create({
        data: { userId, currentStreak: 1, longestStreak: 1, lastLoginDate: new Date(), totalPoints: 10 },
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
        streak = await db.gamificationStreak.update({
          where: { userId },
          data: {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, streak.longestStreak),
            lastLoginDate: new Date(),
            totalPoints: streak.totalPoints + (newStreak >= 7 ? 20 : 10),
          },
        })
      } else if (diffDays > 1) {
        // Streak broken - reset
        streak = await db.gamificationStreak.update({
          where: { userId },
          data: {
            currentStreak: 1,
            lastLoginDate: new Date(),
            totalPoints: streak.totalPoints + 5,
          },
        })
      }
    }

    // Streak rewards
    const streakRewards = [
      { days: 3, points: 10, claimed: streak.currentStreak >= 3 },
      { days: 7, points: 50, claimed: streak.currentStreak >= 7 },
      { days: 14, points: 100, claimed: streak.currentStreak >= 14 },
      { days: 30, points: 500, claimed: streak.currentStreak >= 30 },
    ]

    return success({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalPoints: streak.totalPoints,
      lastLoginDate: streak.lastLoginDate,
      streakRewards,
    })
  } catch (err) {
    return error('Failed to fetch streak', 500)
  }
}
