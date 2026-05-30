import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// GET all withdrawal requests (admin view)
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    const status = req.nextUrl.searchParams.get('status') || 'all'
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build conditions
    const conditions: string[] = ['"type" = $1']
    const params: any[] = ['withdrawal']
    let paramIndex = 2

    if (status !== 'all') {
      conditions.push(`"status" = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    const withdrawals = await db.execute(
      `SELECT t.*, u."name" as "userName", u."email" as "userEmail"
       FROM "Transaction" t
       LEFT JOIN "User" u ON t."userId" = u."id"
       ${whereClause}
       ORDER BY t."createdAt" DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )

    const countResult = await db.execute(
      `SELECT COUNT(*)::int as count FROM "Transaction" ${whereClause}`,
      params
    )

    const total = countResult[0]?.count || 0

    // Stats
    const statsResult = await db.execute(
      `SELECT
        COUNT(*)::int FILTER (WHERE "status" = 'pending') as "pendingCount",
        COUNT(*)::int FILTER (WHERE "status" = 'approved') as "approvedCount",
        COUNT(*)::int FILTER (WHERE "status" = 'rejected') as "rejectedCount",
        COALESCE(SUM("amount") FILTER (WHERE "status" = 'pending'), 0) as "pendingAmount",
        COALESCE(SUM("amount") FILTER (WHERE "status" = 'approved'), 0) as "approvedAmount"
       FROM "Transaction"
       WHERE "type" = 'withdrawal'`
    )

    const stats = statsResult[0] || {
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      pendingAmount: 0,
      approvedAmount: 0,
    }

    return success({
      withdrawals,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        pendingCount: Number(stats.pendingCount),
        approvedCount: Number(stats.approvedCount),
        rejectedCount: Number(stats.rejectedCount),
        pendingAmount: Number(stats.pendingAmount),
        approvedAmount: Number(stats.approvedAmount),
      },
    })
  } catch (err) {
    console.error('Get admin withdrawals error:', err)
    return error('Failed to fetch withdrawals', 500)
  }
}
