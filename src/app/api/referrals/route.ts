import { db, prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

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

    // Direct referrals
    const directReferrals = await db.find(
      'User',
      '"referredById" = $1',
      [userId],
      'ORDER BY "createdAt" DESC'
    ) as any[]

    // Map to select fields
    const directReferralData = directReferrals.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      plan: r.plan,
      isActive: r.isActive,
      createdAt: r.createdAt,
      profileImage: r.profileImage,
    }))

    // Network stats — direct
    const totalDirect = directReferralData.length
    const activeDirect = directReferralData.filter((r) => r.isActive).length
    const pendingDirect = totalDirect - activeDirect

    // Collect ALL network descendants (no depth limit) with their `isActive`
    // flag. This drives the accurate network-wide active/pending counts shown
    // in the "Meus Indicados" top section (Task 10). The previous code only
    // counted direct actives and computed `activeNetworkPercent` from that
    // subset, which understated the real activation rate.
    const allDescendants: { id: string; isActive: boolean }[] = []
    async function collectDescendants(parentId: string) {
      const children = await db.find(
        'User',
        '"referredById" = $1',
        [parentId]
      ) as any[]
      for (const child of children) {
        allDescendants.push({ id: child.id, isActive: !!child.isActive })
        await collectDescendants(child.id)
      }
    }
    await collectDescendants(userId)

    const totalNetwork = allDescendants.length
    const activeNetwork = allDescendants.filter((d) => d.isActive).length
    const pendingNetwork = totalNetwork - activeNetwork

    // Total referral earnings: sum of every cashback row where the CURRENT
    // user is the recipient (userId) and the source (fromUserId) is one of
    // the user's network descendants. Covers all three cashback tables
    // (entrada / residual / vendas). Amounts are stored as Int cents.
    const networkIds = allDescendants.map((d) => d.id)
    let totalEarningsCents = 0
    if (networkIds.length > 0) {
      const [entradaSum, residualSum, vendasSum] = await Promise.all([
        prisma.cashbackEntry.aggregate({
          where: { userId, fromUserId: { in: networkIds } },
          _sum: { amount: true },
        }),
        prisma.cashbackResidual.aggregate({
          where: { userId, fromUserId: { in: networkIds } },
          _sum: { amount: true },
        }),
        prisma.cashbackSales.aggregate({
          where: { userId, fromUserId: { in: networkIds } },
          _sum: { amount: true },
        }),
      ])
      totalEarningsCents =
        (entradaSum._sum.amount ?? 0) +
        (residualSum._sum.amount ?? 0) +
        (vendasSum._sum.amount ?? 0)
    }

    // Build simple referral tree for visualization
    async function buildTree(parentId: string, depth: number, maxDepth: number) {
      if (depth > maxDepth) return []
      const children = await db.find(
        'User',
        '"referredById" = $1',
        [parentId]
      ) as any[]
      const tree: any[] = []
      for (const child of children) {
        const subTree = await buildTree(child.id, depth + 1, maxDepth)
        tree.push({
          id: child.id,
          name: child.name,
          plan: child.plan,
          isActive: child.isActive,
          createdAt: child.createdAt,
          children: subTree,
        })
      }
      return tree
    }

    const referralTree = await buildTree(userId, 1, 5)

    return success({
      directReferrals: directReferralData,
      stats: {
        totalDirect,
        activeDirect,
        pendingDirect,
        totalNetwork,
        activeNetwork,
        pendingNetwork,
        activeNetworkPercent: totalNetwork > 0 ? Math.round((activeNetwork / totalNetwork) * 100) : 0,
        totalEarningsCents,
      },
      referralTree,
    })
  } catch (err) {
    console.error('Referrals error:', err)
    return error('Internal server error', 500)
  }
}
