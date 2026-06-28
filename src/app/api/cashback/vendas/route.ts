import { db, prisma } from '@/lib/db'
import { success, error, getVendasLevels } from '@/lib/api-utils'

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

    // Read live cashback percentages from SystemConfig (admin-configurable)
    const percentages = await getVendasLevels()

    // Read matrix structural width from the MatrixType table (admin-configurable).
    // Falls back to 4 (the client-specified 4-wide matrix) if the row is missing or the lookup fails.
    let matrixWidth = 4
    let matrixDepth = 9
    try {
      const mt = await prisma.matrixType.findFirst({
        where: { matrixKind: 'vendas', isActive: true },
        orderBy: { createdAt: 'asc' },
      })
      if (mt) {
        matrixWidth = mt.width || 4
        matrixDepth = mt.depth || 9
      }
    } catch (mtErr) {
      console.warn('[Cashback vendas] Could not load MatrixType, using defaults:', mtErr)
    }

    const levels = percentages.map((percentage, i) => {
      const level = i + 1
      const maxUsers = Math.pow(matrixWidth, level)
      return {
        level,
        percentage,
        maxUsers,
        currentUsers: usersPerLevel[level] || 0,
        earned: earnedPerLevel[level] || 0,
      }
    })

    // Category breakdowns
    const categories = ['mobility', 'food', 'pharmacy', 'pet', 'shopping']
    const categoryBreakdown = categories.map((cat) => ({
      category: cat,
      earned: earnedByCategory[cat] || 0,
      percentage: totalEarned > 0 ? ((earnedByCategory[cat] || 0) / totalEarned) * 100 : 0,
    }))

    // Max matrix size for an N-wide, D-deep matrix: (width^(D+1) - 1) / (width - 1)
    // For 4-wide, 9-deep: (4^10 - 1) / 3 = 349525
    const maxMatrixSize = matrixWidth > 1
      ? Math.floor((Math.pow(matrixWidth, matrixDepth + 1) - 1) / (matrixWidth - 1))
      : matrixDepth + 1

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
      maxMatrixSize,
      matrixWidth,
      matrixDepth,
    })
  } catch (err) {
    console.error('Cashback vendas error:', err)
    return error('Internal server error', 500)
  }
}
