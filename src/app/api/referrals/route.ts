import { db } from '@/lib/db'
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

    // Network stats
    const totalDirect = directReferralData.length
    const activeDirect = directReferralData.filter((r) => r.isActive).length

    // Count total network (all descendants)
    async function countNetwork(parentId: string): Promise<number> {
      const children = await db.find(
        'User',
        '"referredById" = $1',
        [parentId]
      ) as any[]
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
      const children = await db.find(
        'User',
        '"referredById" = $1',
        [parentId]
      ) as any[]
      const tree = []
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
