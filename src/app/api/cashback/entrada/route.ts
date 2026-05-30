import { db } from '@/lib/db'
import { success, error, ENTRADA_LEVELS } from '@/lib/api-utils'

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

    // Get user's entrada matrix position
    const matrixPosition = await db.findOne(
      'MatrixPosition',
      '"userId" = $1 AND "matrixType" = $2',
      [userId, 'entrada']
    )

    // Get all cashback entries
    const entries = await db.find('CashbackEntry', '"userId" = $1', [userId]) as any[]

    // Calculate earned per level
    const earnedPerLevel: Record<number, number> = {}
    const usersPerLevel: Record<number, number> = {}
    for (const e of entries) {
      earnedPerLevel[e.level] = (earnedPerLevel[e.level] || 0) + e.amount
      usersPerLevel[e.level] = (usersPerLevel[e.level] || 0) + 1
    }

    const totalEarned = entries.reduce((sum, e) => sum + e.amount, 0)

    // Build level details
    const levels = ENTRADA_LEVELS.map((lvl) => ({
      level: lvl.level,
      percentage: lvl.percentage,
      maxUsers: lvl.users,
      currentUsers: usersPerLevel[lvl.level] || 0,
      earned: earnedPerLevel[lvl.level] || 0,
      fillPercentage: Math.min(((usersPerLevel[lvl.level] || 0) / lvl.users) * 100, 100),
    }))

    // Get matrix children counts
    let directChildren = 0
    if (matrixPosition) {
      directChildren = await db.count(
        'MatrixPosition',
        '"parentId" = $1 AND "matrixType" = $2',
        [(matrixPosition as any).id, 'entrada']
      )
    }

    return success({
      matrixPosition: matrixPosition
        ? {
            id: (matrixPosition as any).id,
            level: (matrixPosition as any).level,
            position: (matrixPosition as any).position,
          }
        : null,
      userLevel: user.entradaLevel,
      levels,
      totalEarned,
      totalUsers: Object.values(usersPerLevel).reduce((s, c) => s + c, 0),
      directChildren,
      maxMatrixSize: 1364, // 4+16+64+256+1024
    })
  } catch (err) {
    console.error('Cashback entrada error:', err)
    return error('Internal server error', 500)
  }
}
