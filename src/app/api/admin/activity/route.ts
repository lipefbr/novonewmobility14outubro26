import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// GET recent activity feed for admin dashboard
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')

    // Recent user registrations
    const recentRegistrations = await db.execute(
      `SELECT "id", "name", "email", "plan", "isActive", "createdAt"
       FROM "User"
       ORDER BY "createdAt" DESC
       LIMIT $1`,
      [limit]
    )

    // Recent plan purchases (transactions of type plan_payment)
    const recentPlanPurchases = await db.execute(
      `SELECT t."id", t."userId", t."amount", t."status", t."createdAt", t."description",
              u."name" as "userName", u."email" as "userEmail", u."plan"
       FROM "Transaction" t
       LEFT JOIN "User" u ON t."userId" = u."id"
       WHERE t."type" = 'plan_payment'
       ORDER BY t."createdAt" DESC
       LIMIT $1`,
      [limit]
    )

    // Recent withdrawals
    const recentWithdrawals = await db.execute(
      `SELECT t."id", t."userId", t."amount", t."status", t."createdAt",
              u."name" as "userName", u."email" as "userEmail"
       FROM "Transaction" t
       LEFT JOIN "User" u ON t."userId" = u."id"
       WHERE t."type" = 'withdrawal'
       ORDER BY t."createdAt" DESC
       LIMIT $1`,
      [limit]
    )

    // System health check
    let dbHealthy = false
    let lastSeedDate: string | null = null
    try {
      const testQuery = await db.execute('SELECT 1 as ok')
      dbHealthy = testQuery.length > 0
    } catch { dbHealthy = false }

    try {
      const seedRecord = await db.execute(
        `SELECT "createdAt" FROM "User" ORDER BY "createdAt" ASC LIMIT 1`
      )
      lastSeedDate = seedRecord[0]?.createdAt || null
    } catch { /* ignore */ }

    // Total user count
    const userCount = await db.count('User')
    const activeCount = await db.count('User', '"isActive" = $1', [true])
    const pendingWithdrawals = await db.execute(
      `SELECT COUNT(*)::int as count, COALESCE(SUM("amount"), 0) as total
       FROM "Transaction" WHERE "type" = 'withdrawal' AND "status" = 'pending'`
    )

    // Combine into a unified activity feed, sorted by date
    const activities: Array<{
      id: string
      type: 'registration' | 'plan_purchase' | 'withdrawal'
      title: string
      description: string
      userName: string
      userEmail: string
      amount?: number
      status?: string
      createdAt: string
      icon: string
    }> = []

    for (const u of recentRegistrations) {
      activities.push({
        id: `reg_${u.id}`,
        type: 'registration',
        title: 'Novo Cadastro',
        description: `${u.name} se cadastrou no plano ${u.plan || 'free'}`,
        userName: u.name || 'Usuário',
        userEmail: u.email || '',
        createdAt: u.createdAt,
        icon: 'user-plus',
      })
    }

    for (const p of recentPlanPurchases) {
      activities.push({
        id: `plan_${p.id}`,
        type: 'plan_purchase',
        title: 'Compra de Plano',
        description: `${p.userName || 'Usuário'} adquiriu plano ${p.plan || ''}`,
        userName: p.userName || 'Usuário',
        userEmail: p.userEmail || '',
        amount: Number(p.amount || 0),
        status: p.status,
        createdAt: p.createdAt,
        icon: 'credit-card',
      })
    }

    for (const w of recentWithdrawals) {
      activities.push({
        id: `wd_${w.id}`,
        type: 'withdrawal',
        title: 'Solicitação de Saque',
        description: `${w.userName || 'Usuário'} solicitou saque`,
        userName: w.userName || 'Usuário',
        userEmail: w.userEmail || '',
        amount: Number(w.amount || 0),
        status: w.status,
        createdAt: w.createdAt,
        icon: 'wallet',
      })
    }

    // Sort by date descending
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return success({
      activities: activities.slice(0, limit),
      systemHealth: {
        databaseConnected: dbHealthy,
        lastSeedDate,
        totalUsers: userCount,
        activeUsers: activeCount,
        pendingWithdrawals: Number(pendingWithdrawals[0]?.count || 0),
        pendingWithdrawalAmount: Number(pendingWithdrawals[0]?.total || 0),
      },
    })
  } catch (err) {
    console.error('Admin activity GET error:', err)
    return error('Failed to fetch activity data', 500)
  }
}
