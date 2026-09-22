import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { requireAppAdmin } from '@/lib/admingeral-guard'

// ============================================================================
// /api/admingeral/driver-categories
// ----------------------------------------------------------------------------
// READ-ONLY: lista as categorias de veículo do motorista (Safira, Rubi,
// Esmeralda, Diamante, Imperial) criadas no painel NewMobility admin
// (/api/admin/driver-categories). Cada categoria tem:
//   - monthlyTripsTarget: meta mensal de corridas
//   - bonusCents: bônus pago se bater a meta no mês
//   - maxCancellationPerMonth: 0 = tolerância zero (idoso), 2 = demais
//
// Esta rota é SÓ GET — a edição (criar/editar/excluir/ativar) continua sendo
// feita no painel NewMobility admin. Aqui no admingeral o admin só vê as
// categorias para acompanhar a gestão de apps do ecossistema.
//
// GET ?userId=<adminId> → lista todas as categorias (ativas + inativas) com
//                         contagem de motoristas vinculados.
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAppAdmin(req.nextUrl.searchParams.get('userId'))
    if (!admin) return error('Unauthorized', 403)

    const categories = await prisma.driverCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { users: true } } },
    })

    return success({
      categories: categories.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        description: c.description,
        sortOrder: c.sortOrder,
        monthlyTripsTarget: c.monthlyTripsTarget,
        bonusCents: c.bonusCents,
        maxCancellationPerMonth: c.maxCancellationPerMonth,
        color: c.color,
        icon: c.icon,
        isActive: c.isActive,
        userCount: c._count.users,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    })
  } catch (err) {
    console.error('[/api/admingeral/driver-categories GET] error:', err)
    return error('Internal server error', 500)
  }
}
