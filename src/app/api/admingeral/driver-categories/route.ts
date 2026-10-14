import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { requireAppAdmin } from '@/lib/admingeral-guard'

// ============================================================================
// /api/admingeral/driver-categories
// ----------------------------------------------------------------------------
// CRUD para categorias de veículo do motorista (Safira, Rubi, Esmeralda,
// Diamante, Imperial). Cada categoria tem:
//   - monthlyTripsTarget: meta mensal de corridas
//   - bonusCents: bônus pago se bater a meta no mês
//   - maxCancellationPerMonth: 0 = tolerância zero (idoso), 2 = demais
//
// Antes (Task 9) era READ-ONLY — a edição ficava no painel NewMobility admin.
// Agora (Task 10) o admin do ecossistema consegue CRUD completo direto aqui.
//
// GET  ?userId=<adminId>  → lista todas (ativas + inativas) com userCount.
// POST { userId, code, name, description?, ... }  → cria nova categoria.
// ============================================================================

const CODE_REGEX = /^[a-z0-9_]+$/

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId,
      code,
      name,
      description = null,
      sortOrder = 99,
      monthlyTripsTarget = 0,
      bonusCents = 0,
      maxCancellationPerMonth = 2,
      color = null,
      icon = null,
      isActive = true,
    } = body

    const admin = await requireAppAdmin(userId)
    if (!admin) return error('Unauthorized', 403)

    // Validação: code obrigatório, regex [a-z0-9_]+, máximo 40 chars
    if (!code || typeof code !== 'string') {
      return error('code é obrigatório', 400)
    }
    const normalizedCode = code.toLowerCase().trim()
    if (normalizedCode.length > 40) {
      return error('code deve ter no máximo 40 caracteres', 400)
    }
    if (!CODE_REGEX.test(normalizedCode)) {
      return error('code deve conter apenas letras minúsculas, números e underline (_)', 400)
    }

    // Validação: name obrigatório, máximo 80 chars
    if (!name || typeof name !== 'string' || !name.trim()) {
      return error('name é obrigatório', 400)
    }
    const trimmedName = name.trim()
    if (trimmedName.length > 80) {
      return error('name deve ter no máximo 80 caracteres', 400)
    }

    // Code único (case-insensitive) — Prisma unique é case-sensitive no SQLite,
    // então fazemos a verificação manual em lowercase.
    const existing = await prisma.driverCategory.findFirst({
      where: { code: { equals: normalizedCode } },
    })
    if (existing) {
      return error('Já existe uma categoria com este código', 400)
    }

    const created = await prisma.driverCategory.create({
      data: {
        code: normalizedCode,
        name: trimmedName,
        description: description || null,
        sortOrder: Number(sortOrder) || 99,
        monthlyTripsTarget: Number(monthlyTripsTarget) || 0,
        bonusCents: Number(bonusCents) || 0,
        maxCancellationPerMonth: Number(maxCancellationPerMonth) || 0,
        color: color || null,
        icon: icon || null,
        isActive: Boolean(isActive),
      },
    })

    return success(created, 201)
  } catch (err) {
    console.error('[/api/admingeral/driver-categories POST] error:', err)
    return error('Internal server error', 500)
  }
}
