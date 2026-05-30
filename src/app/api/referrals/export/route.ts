import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const format = req.nextUrl.searchParams.get('format') || 'csv'
    const plan = req.nextUrl.searchParams.get('plan') || 'all'
    const status = req.nextUrl.searchParams.get('status') || 'all'

    // Get the user's downline recursively (up to 10 levels)
    const getAllDownline = async (uid: string, depth = 10): Promise<string[]> => {
      if (depth <= 0) return []
      const direct = await db.find(
        'User',
        '"referredById" = $1',
        [uid]
      ) as any[]
      const ids = direct.map(d => d.id)
      const nested = await Promise.all(ids.map(id => getAllDownline(id, depth - 1)))
      return [...ids, ...nested.flat()]
    }

    const downlineIds = await getAllDownline(userId)

    // Build WHERE clause dynamically
    const conditions: string[] = []
    const params: any[] = []
    let paramIdx = 1

    conditions.push(`"id" = ANY($${paramIdx})`)
    params.push(downlineIds.length > 0 ? downlineIds : ['__none__'])
    paramIdx++

    if (plan !== 'all') {
      conditions.push(`"plan" = $${paramIdx}`)
      params.push(plan)
      paramIdx++
    }
    if (status === 'active') {
      conditions.push('"isActive" = true')
    }
    if (status === 'inactive') {
      conditions.push('"isActive" = false')
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get referrals with referral count via subquery
    const referrals = await db.execute(
      `SELECT u."name", u."email", u."plan", u."isActive", u."createdAt", u."referralCode",
        (SELECT COUNT(*)::int FROM "User" r WHERE r."referredById" = u.id) as "directReferrals"
      FROM "User" u
      ${whereClause}
      ORDER BY u."createdAt" DESC`,
      params
    ) as any[]

    if (format === 'csv') {
      const headers = 'Nome,Email,Plano,Status,Código de Indicação,Indicados Diretos,Data de Cadastro\n'
      const rows = referrals.map(r =>
        `"${r.name}","${r.email}","${r.plan}","${r.isActive ? 'Ativo' : 'Inativo'}","${r.referralCode}",${r.directReferrals},"${new Date(r.createdAt).toLocaleDateString('pt-BR')}"`
      ).join('\n')

      return new Response(headers + rows, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename=referrals-export.csv',
        },
      })
    }

    return success({ referrals, total: referrals.length })
  } catch (err) {
    return error('Failed to export referrals', 500)
  }
}
