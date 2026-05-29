import { db } from '@/lib/db'
import { success, error, RESIDUAL_LEVELS } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return error('userId is required')
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return error('User not found', 404)
    }

    // Get user's residual matrix position
    const matrixPosition = await db.matrixPosition.findFirst({
      where: { userId, matrixType: 'residual' },
    })

    // Get all residual entries
    const entries = await db.cashbackResidual.findMany({ where: { userId } })

    const earnedPerLevel: Record<number, number> = {}
    const usersPerLevel: Record<number, number> = {}
    for (const e of entries) {
      earnedPerLevel[e.level] = (earnedPerLevel[e.level] || 0) + e.amount
      usersPerLevel[e.level] = (usersPerLevel[e.level] || 0) + 1
    }

    const totalEarned = entries.reduce((sum, e) => sum + e.amount, 0)

    const levels = RESIDUAL_LEVELS.map((lvl) => ({
      level: lvl.level,
      percentage: lvl.percentage,
      currentUsers: usersPerLevel[lvl.level] || 0,
      earned: earnedPerLevel[lvl.level] || 0,
    }))

    return success({
      matrixPosition: matrixPosition
        ? {
            id: matrixPosition.id,
            level: matrixPosition.level,
            position: matrixPosition.position,
          }
        : null,
      userLevel: user.residualLevel,
      levels,
      totalEarned,
      totalUsers: Object.values(usersPerLevel).reduce((s, c) => s + c, 0),
      maxMatrixSize: 21844, // 4^0 + 4^1 + ... + 4^7
    })
  } catch (err) {
    console.error('Cashback residual error:', err)
    return error('Internal server error', 500)
  }
}
