import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

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

    // Query users with referral count subquery - now returning ALL fields
    const usersQuery = `
      SELECT
        u."id", u."name", u."email", u."phone", u."cpf", u."plan", u."isActive",
        u."referralCode", u."referredById",
        u."balanceWithdrawal", u."balanceMobility", u."balanceShopping",
        u."balanceFood", u."balancePharmacy", u."balanceGratification",
        u."careerPoints", u."personalPoints", u."stars",
        u."city", u."state", u."country",
        u."bankCode", u."bankAgency", u."bankAccount", u."bankType",
        u."pixKey", u."pixEnabled",
        u."isDriver", u."isDelivery", u."role",
        u."createdAt",
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
      phone: u.phone || '',
      cpf: u.cpf || '',
      plan: u.plan,
      isActive: u.isActive,
      referralCode: u.referralCode,
      referredById: u.referredById,
      balanceWithdrawal: u.balanceWithdrawal || 0,
      balanceMobility: u.balanceMobility || 0,
      balanceShopping: u.balanceShopping || 0,
      balanceFood: u.balanceFood || 0,
      balancePharmacy: u.balancePharmacy || 0,
      balanceGratification: u.balanceGratification || 0,
      careerPoints: u.careerPoints || 0,
      personalPoints: u.personalPoints || 0,
      stars: u.stars || 0,
      city: u.city || '',
      state: u.state || '',
      country: u.country || '',
      bankCode: u.bankCode || '',
      bankAgency: u.bankAgency || '',
      bankAccount: u.bankAccount || '',
      bankType: u.bankType || '',
      pixKey: u.pixKey || '',
      pixEnabled: u.pixEnabled || false,
      isDriver: u.isDriver || false,
      isDelivery: u.isDelivery || false,
      role: u.role || 'user',
      createdAt: u.createdAt,
      _count: { referrals: u.referralCount },
    }))

    return success({ users: usersWithCount, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return error('Failed to fetch users', 500)
  }
}
