import { db } from '@/lib/db'
import { success, error, VENDAS_LEVELS } from '@/lib/api-utils'

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

    // Get user's vendas matrix position
    const matrixPosition = await db.findOne(
      'MatrixPosition',
      '"userId" = $1 AND "matrixType" = $2',
      [userId, 'vendas']
    )

    // Get all vendas entries
    const entries = await db.find('CashbackSales', '"userId" = $1', [userId]) as any[]

    const earnedPerLevel: Record<number, number> = {}
    const usersPerLevel: Record<number, number> = {}
    const earnedByCategory: Record<string, number> = {}
    for (const e of entries) {
      earnedPerLevel[e.level] = (earnedPerLevel[e.level] || 0) + e.amount
      usersPerLevel[e.level] = (usersPerLevel[e.level] || 0) + 1
      earnedByCategory[e.category] = (earnedByCategory[e.category] || 0) + e.amount
    }

    const totalEarned = entries.reduce((sum, e) => sum + e.amount, 0)

    const levels = VENDAS_LEVELS.map((lvl) => ({
      level: lvl.level,
      percentage: lvl.percentage,
      currentUsers: usersPerLevel[lvl.level] || 0,
      earned: earnedPerLevel[lvl.level] || 0,
    }))

    // Category breakdowns
    const categories = ['mobility', 'food', 'pharmacy', 'pet', 'shopping']
    const categoryBreakdown = categories.map((cat) => ({
      category: cat,
      earned: earnedByCategory[cat] || 0,
      percentage: totalEarned > 0 ? ((earnedByCategory[cat] || 0) / totalEarned) * 100 : 0,
    }))

    return success({
      matrixPosition: matrixPosition
        ? {
            id: (matrixPosition as any).id,
            level: (matrixPosition as any).level,
            position: (matrixPosition as any).position,
          }
        : null,
      userLevel: user.vendasLevel,
      levels,
      totalEarned,
      totalUsers: Object.values(usersPerLevel).reduce((s, c) => s + c, 0),
      categoryBreakdown,
      maxMatrixSize: 349524,
    })
  } catch (err) {
    console.error('Cashback vendas error:', err)
    return error('Internal server error', 500)
  }
}
