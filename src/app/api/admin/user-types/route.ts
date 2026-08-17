import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// ============================================================================
// /api/admin/user-types
// ----------------------------------------------------------------------------
// CRUD for the UserType table. Admin-only (requires User.role === 'admin').
//
// GET  ?userId=<adminId>     → list all user types (active + inactive)
// POST { userId, code, label, ... }  → create a new user type
//
// On first GET, seeds the 6 default types from the original hardcoded
// QUALIFICATION_OPTIONS list (motorista, passageiro, passageiro_60,
// passageiro_pcd, comercio, entregador) so existing deployments keep working.
// ============================================================================

const DEFAULT_USER_TYPES = [
  {
    code: 'motorista',
    label: 'Motorista',
    description: 'Condutor de veículo (carro/moto) que realiza corridas',
    sortOrder: 1,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: true,
    mobilePermissions: '["dashboard","wallet","ride_request","cashback","career","metas","indicacoes"]',
    color: '#3b82f6',
    icon: '🚗',
  },
  {
    code: 'passageiro',
    label: 'Passageiro',
    description: 'Usuário comum que solicita corridas',
    sortOrder: 2,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: false,
    mobilePermissions: '["dashboard","wallet","ride_request","cashback","career","indicacoes"]',
    color: '#10b981',
    icon: '👤',
  },
  {
    code: 'passageiro_60',
    label: 'Passageiro 60+',
    description: 'Passageiro com 60 anos ou mais (benefícios especiais)',
    sortOrder: 3,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: false,
    mobilePermissions: '["dashboard","wallet","ride_request","cashback","career","indicacoes"]',
    color: '#f59e0b',
    icon: '🧓',
  },
  {
    code: 'passageiro_pcd',
    label: 'Passageiro com Mobilidade Reduzida',
    description: 'Passageiro PCD com necessidades especiais de acessibilidade',
    sortOrder: 4,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: false,
    mobilePermissions: '["dashboard","wallet","ride_request","cashback","career","indicacoes"]',
    color: '#8b5cf6',
    icon: '♿',
  },
  {
    code: 'comercio',
    label: 'Comércio',
    description: 'Lojista / comerciante parceiro (recebe cashback de vendas)',
    sortOrder: 5,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: false,
    mobilePermissions: '["dashboard","wallet","store","cashback","career","indicacoes"]',
    color: '#ec4899',
    icon: '🏪',
  },
  {
    code: 'entregador',
    label: 'Entregador',
    description: 'Entregador de encomendas / food delivery',
    sortOrder: 6,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: true,
    mobilePermissions: '["dashboard","wallet","delivery","cashback","career","metas","indicacoes"]',
    color: '#f97316',
    icon: '🛵',
  },
]

async function seedDefaultUserTypesIfEmpty() {
  const count = await prisma.userType.count()
  if (count > 0) return
  for (const t of DEFAULT_USER_TYPES) {
    await prisma.userType.create({ data: t })
  }
}

async function requireAdmin(userId: string | null) {
  if (!userId) return null
  const admin = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, userType: true },
  })
  if (!admin || (admin.role !== 'admin' && admin.userType !== 'admin')) {
    return null
  }
  return admin
}

// GET — list all user types (admin view, includes inactive)
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const admin = await requireAdmin(userId)
    if (!admin) return error('Unauthorized', 403)

    await seedDefaultUserTypesIfEmpty()

    const types = await prisma.userType.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return success({ types })
  } catch (err) {
    console.error('Admin user-types GET error:', err)
    return error('Failed to fetch user types', 500)
  }
}

// POST — create a new user type
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId,
      code,
      label,
      description = null,
      isActive = true,
      sortOrder = 99,
      defaultEntradaLevel = 0,
      defaultResidualLevel = 0,
      defaultVendasLevel = 0,
      showDriverGoals = false,
      mobilePermissions = '[]',
      color = null,
      icon = null,
    } = body

    const admin = await requireAdmin(userId)
    if (!admin) return error('Unauthorized', 403)

    if (!code || !label) {
      return error('code e label são obrigatórios', 400)
    }

    // Validate mobilePermissions is valid JSON
    try {
      JSON.parse(mobilePermissions)
    } catch {
      return error('mobilePermissions deve ser um JSON array válido (ex: ["dashboard","wallet"])', 400)
    }

    const existing = await prisma.userType.findUnique({ where: { code } })
    if (existing) return error('Já existe um tipo de usuário com este código', 400)

    const created = await prisma.userType.create({
      data: {
        code,
        label,
        description: description || null,
        isActive: Boolean(isActive),
        sortOrder: Number(sortOrder) || 99,
        defaultEntradaLevel: Number(defaultEntradaLevel) || 0,
        defaultResidualLevel: Number(defaultResidualLevel) || 0,
        defaultVendasLevel: Number(defaultVendasLevel) || 0,
        showDriverGoals: Boolean(showDriverGoals),
        mobilePermissions,
        color: color || null,
        icon: icon || null,
      },
    })

    return success(created, 201)
  } catch (err) {
    console.error('Admin user-types POST error:', err)
    return error('Failed to create user type', 500)
  }
}
