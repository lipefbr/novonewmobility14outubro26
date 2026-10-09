import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import {
  parsePaymentFromNotes,
  parsePlanFromNotes,
  paymentMethodLabel,
  TELEMEDICINA_PRICE_CENTS,
} from '@/app/api/telemedicina/request/route'

/**
 * Admin: list Telemedicina activation requests.
 *
 *   GET /api/admin/telemedicina?userId=<adminId>&status=<pending|approved|rejected|all>&page=1&pageSize=20
 *
 * Returns the most recent request first. Includes the requesting user's
 * name/email/referralCode so the admin can identify them without an extra
 * round-trip.
 */

async function requireAdmin(userId: string | null | undefined) {
  if (!userId) return { ok: false as const, response: error('userId is required', 400) }
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'admin') {
    return { ok: false as const, response: error('Unauthorized', 403) }
  }
  return { ok: true as const }
}

export async function GET(req: NextRequest) {
  try {
    const adminId = req.nextUrl.searchParams.get('userId')
    const auth = await requireAdmin(adminId)
    if (!auth.ok) return auth.response

    const status = req.nextUrl.searchParams.get('status') || 'all'
    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get('pageSize') || '20')))

    const where: any = {}
    if (status !== 'all') where.status = status

    const [total, rows] = await Promise.all([
      prisma.telemedicinaRequest.count({ where }),
      prisma.telemedicinaRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              referralCode: true,
              phone: true,
              plan: true,
            },
          },
        },
      }),
    ])

    return success({
      requests: rows.map(serialize),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    })
  } catch (err) {
    console.error('Admin Telemedicina list error:', err)
    return error('Failed to list Telemedicina requests', 500)
  }
}

function serialize(r: any) {
  let dependents: any[] = []
  try {
    const parsed = JSON.parse(r.dependents || '[]')
    if (Array.isArray(parsed)) dependents = parsed
  } catch {
    dependents = []
  }
  // ===== Parse dos dois prefixes do notes (Task ID 4 / H-2) =====
  // Mesma lógica do serialize() em /api/telemedicina/request/route.ts:
  //  1. [Pagamento: <method>]  → no START da string
  //  2. [Plano: <name> R$ <price>]  → no restante após o payment
  // O restante final é o texto livre do usuário (limpo).
  // Sem isto, o painel admin não recebe planName/priceCents e cai no
  // fallback hardcoded "R$ 49,90" (bug H-2 reportado pelo usuário).
  const { method, notes: afterPayment } = parsePaymentFromNotes(r.notes ?? null)
  const { planName, priceCents, notes: cleanNotes } = parsePlanFromNotes(afterPayment)
  return {
    id: r.id,
    userId: r.userId,
    fullName: r.fullName,
    cpf: r.cpf,
    birthDate: r.birthDate ?? null,
    phone: r.phone,
    email: r.email,
    dependents,
    notes: cleanNotes,
    paymentMethod: method,
    paymentMethodLabel: paymentMethodLabel(method),
    planName,
    // Se não houver snapshot no notes (pedido muito antigo), caímos no preço
    // histórico default — melhor que "—" para o admin ter uma noção.
    priceCents: priceCents ?? TELEMEDICINA_PRICE_CENTS,
    status: r.status,
    adminNotes: r.adminNotes ?? null,
    activationLink: r.activationLink ?? null,
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
    rejectedAt: r.rejectedAt ? r.rejectedAt.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
    user: r.user ?? null,
  }
}
