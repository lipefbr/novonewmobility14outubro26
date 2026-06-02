import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
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

    const admin = await db.findOne('User', '"id" = $1', [adminId])
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    // Get the target user
    const targetUser = await db.findOne('User', '"id" = $1', [id])
    if (!targetUser) return error('User not found', 404)

    // Build referral tree recursively up to 3 levels
    const buildTree = async (userId: string, level: number): Promise<any> => {
      if (level > 3) return null

      const user = await db.findOne('User', '"id" = $1', [userId])
      if (!user) return null

      const directReferrals = await db.execute(
        `SELECT "id", "name", "email", "plan", "isActive", "createdAt", "balanceWithdrawal"
         FROM "User"
         WHERE "referredById" = $1
         ORDER BY "createdAt" DESC`,
        [userId]
      )

      const children = []
      for (const ref of directReferrals) {
        const child = await buildTree(ref.id, level + 1)
        if (child) children.push(child)
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        isActive: user.isActive,
        referralCode: user.referralCode,
        balanceWithdrawal: user.balanceWithdrawal || 0,
        createdAt: user.createdAt,
        level,
        referralCount: directReferrals.length,
        children,
      }
    }

    const tree = await buildTree(id, 0)

    // Also count totals per level
    const levelCounts = await db.execute(
      `WITH RECURSIVE ref_tree AS (
        SELECT "id", "referredById", 1 as level
        FROM "User"
        WHERE "referredById" = $1
        UNION ALL
        SELECT u."id", u."referredById", rt.level + 1
        FROM "User" u
        INNER JOIN ref_tree rt ON u."referredById" = rt."id"
        WHERE rt.level < 3
      )
      SELECT level, COUNT(*)::int as count
      FROM ref_tree
      GROUP BY level
      ORDER BY level`,
      [id]
    )

    return success({
      tree,
      levelCounts: levelCounts.map((l: any) => ({
        level: l.level,
        count: l.count,
      })),
    })
  } catch (err) {
    console.error('Admin user tree GET error:', err)
    return error('Failed to fetch user tree', 500)
  }
}
