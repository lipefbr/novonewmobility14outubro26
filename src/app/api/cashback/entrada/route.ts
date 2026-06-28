import { db, prisma } from '@/lib/db'
import { success, error, getEntradaLevels } from '@/lib/api-utils'

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

    // Read live cashback percentages from SystemConfig (admin-configurable)
    const percentages = await getEntradaLevels()

    // Read matrix structural width from the MatrixType table (admin-configurable).
    // Falls back to 4 (the client-specified 4-wide matrix) if the row is missing or the lookup fails.
    let matrixWidth = 4
    let matrixDepth = 5
    try {
      const mt = await prisma.matrixType.findFirst({
        where: { matrixKind: 'entrada', isActive: true },
        orderBy: { createdAt: 'asc' },
      })
      if (mt) {
        matrixWidth = mt.width || 4
        matrixDepth = mt.depth || 5
      }
    } catch (mtErr) {
      console.warn('[Cashback entrada] Could not load MatrixType, using defaults:', mtErr)
    }

    // Build level details (matrix structural dims: width^level users per level)
    // For a 4-wide, 5-deep entrada matrix: 4, 16, 64, 256, 1024 (total 1,364)
    //
    // ─── Plan-based level gating (Índice.docx §1.1 + §3) ─────────────
    // The user's plan determines the maximum entrada level that earns
    // cashback:
    //   free        → 0 unlocked (no entrada access)
    //   blue3       → 3 unlocked (L1-L3)
    //   blue5/
    //   premium5    → 5 unlocked (L1-L5)
    // Levels above the unlock ceiling are still returned (so the UI can
    // show them as LOCKED with a "Faça upgrade" CTA), but their
    // `earned` is forced to 0 and a `locked: true` flag is set so the
    // frontend and any downstream cashback-computation logic knows to
    // skip them.
    const userPlan = user.plan || 'free'
    const isPremium = userPlan === 'premium5' || userPlan === 'blue5'
    const maxUnlockedLevel = isPremium ? 5 : userPlan === 'blue3' ? 3 : 0

    const levels = percentages.map((percentage, i) => {
      const level = i + 1
      const maxUsers = Math.pow(matrixWidth, level) // e.g. 4, 16, 64, 256, 1024
      const currentUsers = usersPerLevel[level] || 0
      const locked = level > maxUnlockedLevel
      return {
        level,
        percentage,
        maxUsers,
        currentUsers,
        // Earned is forced to 0 for locked levels (the user cannot
        // earn cashback above their plan ceiling even if the network
        // has downline at those levels).
        earned: locked ? 0 : (earnedPerLevel[level] || 0),
        fillPercentage: Math.min((currentUsers / maxUsers) * 100, 100),
        locked,
        unlocked: !locked,
      }
    })

    // Per-plan breakdown for the frontend
    const visibleLevels = levels.filter((l) => !l.locked)
    const lockedLevels = levels.filter((l) => l.locked)

    // Get matrix children counts
    let directChildren = 0
    if (matrixPosition) {
      directChildren = await db.count(
        'MatrixPosition',
        '"parentId" = $1 AND "matrixType" = $2',
        [(matrixPosition as any).id, 'entrada']
      )
    }

    // Max matrix size for an N-wide, D-deep matrix: (width^(D+1) - 1) / (width - 1)
    // Includes the user's own root position. For 4-wide, 5-deep: (4^6 - 1) / 3 = 1365
    const maxMatrixSize = matrixWidth > 1
      ? Math.floor((Math.pow(matrixWidth, matrixDepth + 1) - 1) / (matrixWidth - 1))
      : matrixDepth + 1

    // Sum of earnings only over unlocked levels (locked-level earnings
    // are 0 anyway, but this is explicit and protects against any
    // future re-introduction of historical payouts at locked levels).
    const totalEarnedUnlocked = visibleLevels.reduce((s, l) => s + l.earned, 0)

    return success({
      matrixPosition: matrixPosition
        ? {
            id: (matrixPosition as any).id,
            level: (matrixPosition as any).level,
            position: (matrixPosition as any).position,
          }
        : null,
      userLevel: user.entradaLevel,
      userPlan,
      maxUnlockedLevel,
      levels,
      visibleLevels,
      lockedLevels,
      totalEarned: totalEarnedUnlocked,
      totalEarnedUnlocked,
      totalUsers: Object.values(usersPerLevel).reduce((s, c) => s + c, 0),
      directChildren,
      maxMatrixSize,
      matrixWidth,
      matrixDepth,
    })
  } catch (err) {
    console.error('Cashback entrada error:', err)
    return error('Internal server error', 500)
  }
}
