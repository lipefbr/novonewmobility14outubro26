import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { formatBRL } from '@/lib/format'
import { seedTelemedicinaPlansIfEmpty } from '@/lib/seed-telemedicina'

/**
 * Telemedicina plans CRUD API.
 *
 *   GET    /api/telemedicina/plans              — public: lista planos ativos
 *   POST   /api/telemedicina/plans              — admin: cria um plano
 *   PUT    /api/telemedicina/plans?id=<planId>  — admin: atualiza um plano
 *   DELETE /api/telemedicina/plans?id=<planId>  — admin: soft-delete (isActive=false)
 *
 * Replica exatamente o padrão de /api/talkmobi/plans/route.ts para que o
 * admin-page.tsx (via TelemedicinaManager) possa reaproveitar a mesma UI de
 * CRUD (grid de cards + dialog) sem mudança de contrato. O GET tem o mesmo
 * shape da resposta para que o front possa consumir ambos de forma
 * transparente.
 */

interface TelemedicinaPlanDTO {
  id: string
  name: string
  dataAmount: string
  priceCents: number
  cashbackCents: number
  rewardPoints: number
  description: string | null
  features: string[]
  isPopular: boolean
  isRecommended: boolean
  sortOrder: number
  priceFormatted: string
  cashbackFormatted: string
}

/**
 * Mapeia uma linha de TelemedicinaPlan para o DTO consumido pela página. A
 * coluna `features` é JSON-encoded no DB; fazemos parse defensivo para que
 * um payload mal-formado nunca quebre a lista inteira.
 */
function toDTO(p: {
  id: string
  name: string
  dataAmount: string
  priceCents: number
  cashbackCents: number
  rewardPoints: number
  description: string | null
  features: string
  isPopular: boolean
  isRecommended: boolean
  sortOrder: number
}): TelemedicinaPlanDTO {
  let features: string[] = []
  try {
    const parsed = JSON.parse(p.features || '[]')
    if (Array.isArray(parsed)) {
      features = parsed.map((f) => String(f)).filter(Boolean)
    }
  } catch {
    features = []
  }

  return {
    id: p.id,
    name: p.name,
    dataAmount: p.dataAmount,
    priceCents: p.priceCents,
    cashbackCents: p.cashbackCents,
    rewardPoints: p.rewardPoints,
    description: p.description ?? null,
    features,
    isPopular: p.isPopular,
    isRecommended: p.isRecommended,
    sortOrder: p.sortOrder,
    priceFormatted: formatBRL(p.priceCents),
    cashbackFormatted: formatBRL(p.cashbackCents),
  }
}

async function requireAdmin(userId: string | null | undefined) {
  if (!userId) return { ok: false as const, response: error('userId is required', 400) }
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'admin') {
    return { ok: false as const, response: error('Unauthorized', 403) }
  }
  return { ok: true as const }
}

/**
 * GET /api/telemedicina/plans
 *
 * Retorna todos os planos de Telemedicina ativos ordenados por `sortOrder`,
 * com preço/cashback já formatados como strings BRL. Público — são planos
 * de marketing sem PII.
 */
export async function GET(_req: NextRequest) {
  try {
    // Auto-seed dos quatro planos canônicos se a tabela estiver vazia para
    // que a página pública de marketing nunca fique em branco em um DB
    // recém-criado. O seed é idempotente — no-op quando planos já existem.
    await seedTelemedicinaPlansIfEmpty().catch((e) =>
      console.error('Telemedicina auto-seed failed (non-fatal):', e),
    )

    const rows = await prisma.telemedicinaPlan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    const plans = rows.map(toDTO)
    return success({ plans })
  } catch (err) {
    console.error('Telemedicina plans GET error:', err)
    return error('Failed to fetch Telemedicina plans', 500)
  }
}

/**
 * POST /api/telemedicina/plans  (admin only)
 *
 * Cria um novo plano. O caller pode passar `features` tanto como array JSON
 * quanto como string JSON pré-codificada — normalizamos para string para
 * armazenar.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId,
      id,
      name,
      dataAmount,
      priceCents,
      cashbackCents = 0,
      rewardPoints = 0,
      description = null,
      features = [],
      isPopular = false,
      isRecommended = false,
      isActive = true,
      sortOrder = 0,
    } = body ?? {}

    // userId também pode vir como query param (ex.: quando o caller não quer
    // misturar auth e payload) — faz fallback para ele.
    const auth = await requireAdmin(userId ?? req.nextUrl.searchParams.get('userId'))
    if (!auth.ok) return auth.response

    if (!name || !dataAmount || priceCents === undefined) {
      return error('name, dataAmount and priceCents are required', 400)
    }
    const price = Number(priceCents)
    if (!Number.isFinite(price) || price < 0) {
      return error('priceCents must be a non-negative number', 400)
    }

    // Permite passar tanto string[] quanto uma string já codificada.
    const featuresString = Array.isArray(features)
      ? JSON.stringify(features)
      : typeof features === 'string' && features.trim().startsWith('[')
        ? features
        : JSON.stringify([])

    const planId = id || `telemed-${slugify(name)}-${Date.now().toString(36)}`

    const created = await prisma.telemedicinaPlan.create({
      data: {
        id: planId,
        name: String(name),
        dataAmount: String(dataAmount),
        priceCents: price,
        cashbackCents: Number(cashbackCents) || 0,
        rewardPoints: Number(rewardPoints) || 0,
        description: description ?? null,
        features: featuresString,
        isPopular: Boolean(isPopular),
        isRecommended: Boolean(isRecommended),
        isActive: Boolean(isActive),
        sortOrder: Number(sortOrder) || 0,
      },
    })

    return success(toDTO(created), 201)
  } catch (err) {
    console.error('Telemedicina plans POST error:', err)
    return error('Failed to create Telemedicina plan', 500)
  }
}

/**
 * PUT /api/telemedicina/plans?id=<planId>  (admin only)
 *
 * Atualiza qualquer subconjunto de campos do plano. `features` pode ser
 * passado como string[] ou como string pré-codificada.
 */
export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return error('id query param is required', 400)

    const body = await req.json()
    const auth = await requireAdmin(body?.userId ?? req.nextUrl.searchParams.get('userId'))
    if (!auth.ok) return auth.response

    const existing = await prisma.telemedicinaPlan.findUnique({ where: { id } })
    if (!existing) return error('Telemedicina plan not found', 404)

    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = String(body.name)
    if (body.dataAmount !== undefined) data.dataAmount = String(body.dataAmount)
    if (body.priceCents !== undefined) {
      const price = Number(body.priceCents)
      if (!Number.isFinite(price) || price < 0) {
        return error('priceCents must be a non-negative number', 400)
      }
      data.priceCents = price
    }
    if (body.cashbackCents !== undefined) {
      data.cashbackCents = Number(body.cashbackCents) || 0
    }
    if (body.rewardPoints !== undefined) {
      data.rewardPoints = Number(body.rewardPoints) || 0
    }
    if (body.description !== undefined) {
      data.description = body.description ?? null
    }
    if (body.features !== undefined) {
      data.features = Array.isArray(body.features)
        ? JSON.stringify(body.features)
        : typeof body.features === 'string' && body.features.trim().startsWith('[')
          ? body.features
          : JSON.stringify([])
    }
    if (body.isPopular !== undefined) data.isPopular = Boolean(body.isPopular)
    if (body.isRecommended !== undefined) data.isRecommended = Boolean(body.isRecommended)
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0

    const updated = await prisma.telemedicinaPlan.update({ where: { id }, data })
    return success(toDTO(updated))
  } catch (err) {
    console.error('Telemedicina plans PUT error:', err)
    return error('Failed to update Telemedicina plan', 500)
  }
}

/**
 * DELETE /api/telemedicina/plans?id=<planId>  (admin only)
 *
 * Soft-deleta o plano setando `isActive = false`. Nunca fazemos hard-delete
 * porque pedidos/faturas podem referenciar o id.
 */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return error('id query param is required', 400)

    const userId = req.nextUrl.searchParams.get('userId')
    const auth = await requireAdmin(userId)
    if (!auth.ok) return auth.response

    const existing = await prisma.telemedicinaPlan.findUnique({ where: { id } })
    if (!existing) return error('Telemedicina plan not found', 404)

    const updated = await prisma.telemedicinaPlan.update({
      where: { id },
      data: { isActive: false },
    })
    return success({ id: updated.id, isActive: updated.isActive })
  } catch (err) {
    console.error('Telemedicina plans DELETE error:', err)
    return error('Failed to delete Telemedicina plan', 500)
  }
}

function slugify(s: string): string {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}
