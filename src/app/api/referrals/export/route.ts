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
      const direct = await db.user.findMany({
        where: { referredById: uid },
        select: { id: true },
      })
      const ids = direct.map(d => d.id)
      const nested = await Promise.all(ids.map(id => getAllDownline(id, depth - 1)))
      return [...ids, ...nested.flat()]
    }

    const downlineIds = await getAllDownline(userId)

    const where: Record<string, unknown> = { id: { in: downlineIds } }
    if (plan !== 'all') where.plan = plan
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const referrals = await db.user.findMany({
      where,
      select: {
        name: true, email: true, plan: true, isActive: true,
        createdAt: true, referralCode: true,
        _count: { select: { referrals: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get level info for each referral
    const userReferrals = await db.user.findMany({
      where: { referredById: userId },
      select: { id: true },
    })

    if (format === 'csv') {
      const headers = 'Nome,Email,Plano,Status,Código de Indicação,Indicados Diretos,Data de Cadastro\n'
      const rows = referrals.map(r =>
        `"${r.name}","${r.email}","${r.plan}","${r.isActive ? 'Ativo' : 'Inativo'}","${r.referralCode}",${r._count.referrals},"${new Date(r.createdAt).toLocaleDateString('pt-BR')}"`
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
