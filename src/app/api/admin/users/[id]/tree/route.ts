import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// GET referral tree for a user (up to 3 levels deep)
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

    // Get the target user
    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) return error('User not found', 404)

    // Build referral tree recursively up to 3 levels
    const buildTree = async (userId: string, level: number): Promise<any> => {
      if (level > 3) return null

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, plan: true, isActive: true, referralCode: true, balanceWithdrawal: true, createdAt: true },
      })
      if (!user) return null

      const directReferrals = await prisma.user.findMany({
        where: { referredById: userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, plan: true, isActive: true, balanceWithdrawal: true, createdAt: true },
      })

      const children = []
      for (const ref of directReferrals) {
        const child = await buildTree(ref.id, level + 1)
        if (child) children.push(child)
      }

      return {
        ...user,
        level,
        referralCount: directReferrals.length,
        children,
      }
    }

    const tree = await buildTree(id, 0)

    // Count totals per level using iterative approach
    const levelCounts: { level: number; count: number }[] = []
    let currentLevelIds = [id]
    for (let lvl = 1; lvl <= 3; lvl++) {
      const referrals = await prisma.user.findMany({
        where: { referredById: { in: currentLevelIds } },
        select: { id: true },
      })
      if (referrals.length > 0) {
        levelCounts.push({ level: lvl, count: referrals.length })
        currentLevelIds = referrals.map(r => r.id)
      } else {
        break
      }
    }

    return success({
      tree,
      levelCounts,
    })
  } catch (err) {
    console.error('Admin user tree GET error:', err)
    return error('Failed to fetch user tree', 500)
  }
}
