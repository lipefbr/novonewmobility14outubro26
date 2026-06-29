import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// Matrix type config: depth limits + level metadata
const MATRIX_CONFIG: Record<string, {
  levels: { level: number; percentage: number; capacity: number }[]
  maxDepth: number
  label: string
}> = {
  // "Direta" = entry matrix (4x5, 5 levels)
  direta: {
    maxDepth: 5,
    label: 'Matriz de Entrada',
    levels: [
      { level: 1, percentage: 5, capacity: 4 },
      { level: 2, percentage: 10, capacity: 16 },
      { level: 3, percentage: 10, capacity: 64 },
      { level: 4, percentage: 5, capacity: 256 },
      { level: 5, percentage: 5, capacity: 1024 },
    ],
  },
  // Residual matrix (4x7, 7 levels)
  residual: {
    maxDepth: 7,
    label: 'Matriz Residual',
    levels: [
      { level: 1, percentage: 5, capacity: 4 },
      { level: 2, percentage: 5.5, capacity: 16 },
      { level: 3, percentage: 6, capacity: 64 },
      { level: 4, percentage: 6.5, capacity: 256 },
      { level: 5, percentage: 7, capacity: 1024 },
      { level: 6, percentage: 7.5, capacity: 4096 },
      { level: 7, percentage: 8, capacity: 16384 },
    ],
  },
  // Vendas matrix (4x9, 9 levels)
  vendas: {
    maxDepth: 9,
    label: 'Matriz de Vendas',
    levels: [
      { level: 1, percentage: 0.1, capacity: 4 },
      { level: 2, percentage: 0.1, capacity: 16 },
      { level: 3, percentage: 0.1, capacity: 64 },
      { level: 4, percentage: 0.1, capacity: 256 },
      { level: 5, percentage: 0.1, capacity: 1024 },
      { level: 6, percentage: 0.1, capacity: 4096 },
      { level: 7, percentage: 0.1, capacity: 16384 },
      { level: 8, percentage: 0.1, capacity: 65536 },
      { level: 9, percentage: 0.2, capacity: 262144 },
    ],
  },
}

interface TreeNode {
  id: string
  name: string
  email: string
  plan: string
  isActive: boolean
  referralCode: string | null
  profileImage: string | null
  stars: number
  createdAt: string
  level: number
  children: TreeNode[]
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const { type: matrixType } = await params

    if (!userId) {
      return error('userId is required')
    }

    const config = MATRIX_CONFIG[matrixType]
    if (!config) {
      return error('Invalid matrix type. Use: direta, residual, or vendas', 400)
    }

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user) {
      return error('User not found', 404)
    }

    // Recursively build tree from User.referredById, capping at maxDepth
    async function buildTree(parentId: string, currentDepth: number, maxDepth: number): Promise<TreeNode[]> {
      if (currentDepth > maxDepth) return []

      const children = await db.find(
        'User',
        '"referredById" = $1',
        [parentId],
        'ORDER BY "createdAt" ASC'
      ) as any[]

      const tree: TreeNode[] = []
      for (const child of children) {
        const subTree = await buildTree(child.id, currentDepth + 1, maxDepth)
        tree.push({
          id: child.id,
          name: child.name,
          email: child.email,
          plan: child.plan,
          isActive: child.isActive,
          referralCode: child.referralCode,
          profileImage: child.profileImage,
          stars: child.stars || 0,
          createdAt: child.createdAt?.toISOString?.() ?? new Date(child.createdAt).toISOString(),
          level: currentDepth,
          children: subTree,
        })
      }
      return tree
    }

    const tree = await buildTree(userId, 1, config.maxDepth)

    // Build per-level stats
    const levelMap: Record<number, { users: number }> = {}
    function walk(nodes: TreeNode[]) {
      for (const n of nodes) {
        const cur = levelMap[n.level] || { users: 0 }
        cur.users += 1
        levelMap[n.level] = cur
        if (n.children.length > 0) walk(n.children)
      }
    }
    walk(tree)

    const levels = config.levels.map(lv => ({
      level: lv.level,
      percentage: lv.percentage,
      capacity: lv.capacity,
      currentUsers: levelMap[lv.level]?.users || 0,
      fillPercentage: Math.min(((levelMap[lv.level]?.users || 0) / lv.capacity) * 100, 100),
    }))

    // Total counts
    function countNodes(nodes: TreeNode[]): number {
      let count = 0
      for (const n of nodes) {
        count += 1
        count += countNodes(n.children)
      }
      return count
    }
    const totalUsers = countNodes(tree)

    // Direct children (level 1 only)
    const directReferrals = levelMap[1]?.users || 0

    return success({
      type: matrixType,
      label: config.label,
      maxDepth: config.maxDepth,
      rootUser: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        referralCode: user.referralCode,
        stars: user.stars || 0,
      },
      tree,
      levels,
      totalUsers,
      directReferrals,
      maxMatrixSize: config.levels.reduce((sum, l) => sum + l.capacity, 0),
    })
  } catch (err) {
    console.error('Minha Rede error:', err)
    return error('Internal server error', 500)
  }
}
