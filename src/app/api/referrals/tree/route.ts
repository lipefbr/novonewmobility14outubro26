import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const depth = parseInt(searchParams.get('depth') || '5', 10)

    if (!userId) {
      return error('userId is required')
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return error('User not found', 404)
    }

    // Build nested referral tree
    async function buildTree(parentId: string, currentDepth: number, maxDepth: number) {
      if (currentDepth > maxDepth) return []

      const children = await db.user.findMany({
        where: { referredById: parentId },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          isActive: true,
          createdAt: true,
          profileImage: true,
          stars: true,
          referralCode: true,
        },
      })

      const tree = []
      for (const child of children) {
        const subTree = await buildTree(child.id, currentDepth + 1, maxDepth)
        tree.push({
          id: child.id,
          name: child.name,
          email: child.email,
          plan: child.plan,
          isActive: child.isActive,
          createdAt: child.createdAt,
          profileImage: child.profileImage,
          stars: child.stars,
          referralCode: child.referralCode,
          children: subTree,
          _depth: currentDepth,
        })
      }
      return tree
    }

    const tree = await buildTree(userId, 1, depth)

    // Count nodes
    function countNodes(nodes: typeof tree): number {
      let count = 0
      for (const node of nodes) {
        count += 1
        count += countNodes(node.children)
      }
      return count
    }

    return success({
      rootUser: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        referralCode: user.referralCode,
        stars: user.stars,
      },
      tree,
      totalNodes: countNodes(tree),
      maxDepth: depth,
    })
  } catch (err) {
    console.error('Referral tree error:', err)
    return error('Internal server error', 500)
  }
}
