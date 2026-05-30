import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error, sanitizeUser } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    const search = req.nextUrl.searchParams.get('search') || ''
    const plan = req.nextUrl.searchParams.get('plan') || 'all'
    const status = req.nextUrl.searchParams.get('status') || 'all'
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build dynamic WHERE clause
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (search) {
      conditions.push(`("name" ILIKE $${paramIndex} OR "email" ILIKE $${paramIndex} OR "referralCode" ILIKE $${paramIndex})`)
      params.push(`%${search}%`)
      paramIndex++
    }
    if (plan !== 'all') {
      conditions.push(`"plan" = $${paramIndex}`)
      params.push(plan)
      paramIndex++
    }
    if (status !== 'all') {
      conditions.push(`"isActive" = $${paramIndex}`)
      params.push(status === 'active')
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Query users with referral count subquery
    const usersQuery = `
      SELECT
        "id", "name", "email", "phone", "plan", "isActive",
        "referralCode", "balanceWithdrawal", "careerPoints", "createdAt", "referredById",
        (SELECT COUNT(*)::int FROM "User" AS r WHERE r."referredById" = u."id") AS "referralCount"
      FROM "User" AS u
      ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    const usersParams = [...params, limit, offset]

    // Count total matching users
    const countQuery = `SELECT COUNT(*)::int as count FROM "User" ${whereClause}`

    const [users, countResult] = await Promise.all([
      db.execute(usersQuery, usersParams),
      db.execute(countQuery, params),
    ])

    const total = countResult[0]?.count || 0

    // Add _count.referrals to each user to match original API contract
    const usersWithCount = (users as any[]).map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      plan: u.plan,
      isActive: u.isActive,
      referralCode: u.referralCode,
      balanceWithdrawal: u.balanceWithdrawal,
      careerPoints: u.careerPoints,
      createdAt: u.createdAt,
      referredById: u.referredById,
      _count: { referrals: u.referralCount },
    }))

    return success({ users: usersWithCount, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return error('Failed to fetch users', 500)
  }
}
