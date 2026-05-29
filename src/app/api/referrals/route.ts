import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

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

    // Direct referrals
    const directReferrals = await db.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        isActive: true,
        createdAt: true,
        profileImage: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Network stats
    const totalDirect = directReferrals.length
    const activeDirect = directReferrals.filter((r) => r.isActive).length

    // Count total network (all descendants)
    async function countNetwork(parentId: string): Promise<number> {
      const children = await db.user.findMany({
        where: { referredById: parentId },
        select: { id: true },
      })
      let total = children.length
      for (const child of children) {
        total += await countNetwork(child.id)
      }
      return total
    }

    const totalNetwork = await countNetwork(userId)

    // Build simple referral tree for visualization
    async function buildTree(parentId: string, depth: number, maxDepth: number) {
      if (depth > maxDepth) return []
      const children = await db.user.findMany({
        where: { referredById: parentId },
        select: {
          id: true,
          name: true,
          plan: true,
          isActive: true,
          createdAt: true,
        },
      })
      const tree = []
      for (const child of children) {
        const subTree = await buildTree(child.id, depth + 1, maxDepth)
        tree.push({
          ...child,
          children: subTree,
        })
      }
      return tree
    }

    const referralTree = await buildTree(userId, 1, 3)

    return success({
      directReferrals,
      stats: {
        totalDirect,
        totalNetwork,
        activeDirect,
        activeNetworkPercent: totalNetwork > 0 ? Math.round((activeDirect / totalNetwork) * 100) : 0,
      },
      referralTree,
    })
  } catch (err) {
    console.error('Referrals error:', err)
    return error('Internal server error', 500)
  }
}
