import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

const VALID_MATRIX_TYPES = ['entrada', 'residual', 'vendas']
const MAX_DEPTH = 5

interface MatrixNode {
  id: string
  userId: string | null
  userName: string | null
  userEmail: string | null
  level: number
  position: number
  isFilled: boolean
  parentId: string | null
  children: MatrixNode[]
}

// GET /api/admin/users/[id]/matrix?userId=X&matrixType=entrada
// Returns the matrix tree for a user (starting at level 0 for that user), down 5 levels.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const adminId = req.nextUrl.searchParams.get('userId')
    if (!adminId) return error('userId is required', 400)

    const admin = await prisma.user.findUnique({ where: { id: adminId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    const matrixType = req.nextUrl.searchParams.get('matrixType') || 'entrada'
    if (!VALID_MATRIX_TYPES.includes(matrixType)) {
      return error(`matrixType must be one of: ${VALID_MATRIX_TYPES.join(', ')}`, 400)
    }

    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) return error('User not found', 404)

    // Find the user's root position in this matrix
    const rootPositions = await prisma.matrixPosition.findMany({
      where: { userId: id, matrixType },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    if (rootPositions.length === 0) {
      return success({
        tree: null,
        stats: {
          totalPositions: 0,
          filledPositions: 0,
          emptyPositions: 0,
          totalLevels: 0,
          levelCounts: [],
        },
      })
    }

    // Track visited ids to prevent cycles
    const visited = new Set<string>()
    const levelCountsMap: Record<number, number> = {}
    let totalPositions = 0
    let filledPositions = 0

    const buildNode = async (
      positionId: string,
      level: number
    ): Promise<MatrixNode | null> => {
      if (level > MAX_DEPTH) return null
      if (visited.has(positionId)) return null
      visited.add(positionId)

      const pos = await prisma.matrixPosition.findUnique({
        where: { id: positionId },
        include: { user: { select: { id: true, name: true, email: true } } },
      })
      if (!pos) return null

      totalPositions += 1
      if (pos.isFilled) filledPositions += 1
      levelCountsMap[level] = (levelCountsMap[level] || 0) + 1

      // Find direct children
      const childPositions = await prisma.matrixPosition.findMany({
        where: { parentId: positionId, matrixType },
        orderBy: { position: 'asc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      })

      const children: MatrixNode[] = []
      for (const child of childPositions) {
        const childNode = await buildNode(child.id, level + 1)
        if (childNode) children.push(childNode)
      }

      return {
        id: pos.id,
        userId: pos.userId,
        userName: pos.user?.name || null,
        userEmail: pos.user?.email || null,
        level,
        position: pos.position,
        isFilled: pos.isFilled,
        parentId: pos.parentId,
        children,
      }
    }

    // Use the first root position as the tree root (level 0)
    const root = rootPositions[0]
    const tree = await buildNode(root.id, 0)

    const levelCounts = Object.entries(levelCountsMap)
      .map(([level, count]) => ({ level: parseInt(level), count }))
      .sort((a, b) => a.level - b.level)

    const totalLevels = levelCounts.length

    return success({
      tree,
      stats: {
        totalPositions,
        filledPositions,
        emptyPositions: totalPositions - filledPositions,
        totalLevels,
        levelCounts,
      },
    })
  } catch (err) {
    console.error('Admin user matrix GET error:', err)
    return error('Failed to fetch matrix tree', 500)
  }
}
