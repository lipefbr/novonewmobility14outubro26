import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

const DEFAULT_PLANS = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    features: ['Cadastro gratuito', 'Indicação de usuários'],
    matrixEntrada: '-',
    matrixResidual: '-',
    matrixVendas: '-',
    isActive: true,
  },
  {
    id: 'blue3',
    name: 'Blue 3',
    price: 9700,
    features: [
      'Cashback Entrada (matriz 4x5)',
      'Cashback Residual (matriz 4x7)',
      'Cashback Vendas (matriz 4x9)',
      'App Mobilidade',
      'App Refeição',
      'App Farmácia',
      'App Compras',
      'Gratificações disponíveis',
      'Plano de Carreira',
    ],
    matrixEntrada: '4x5',
    matrixResidual: '4x7',
    matrixVendas: '4x9',
    isActive: true,
  },
  {
    id: 'blue5',
    name: 'Blue 5',
    price: 14700,
    features: [
      'Tudo do plano Blue 3',
      'Gratificações exclusivas',
      'Prioridade no suporte',
      'Bônus de adesão aumentado',
      'App Pet',
      'Seguro telefone',
      'Telemedicina',
      'Assistência funerária',
    ],
    matrixEntrada: '4x5',
    matrixResidual: '4x7',
    matrixVendas: '4x9',
    isActive: true,
  },
]

// GET all plans (admin view) - returns defaults with user counts
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    // Get user count per plan - use findMany instead of groupBy for SQLite compat
    let planGroups: { plan: string }[] = []
    try {
      planGroups = await prisma.user.findMany({ select: { plan: true } })
    } catch { /* ignore */ }

    const planCountMap: Record<string, number> = {}
    for (const u of planGroups) {
      planCountMap[u.plan] = (planCountMap[u.plan] || 0) + 1
    }

    const plansWithCount = DEFAULT_PLANS.map((p) => ({
      ...p,
      userCount: planCountMap[p.id] || 0,
    }))

    return success({ plans: plansWithCount })
  } catch (err) {
    console.error('Get plans error:', err)
    return error('Failed to fetch plans', 500)
  }
}

// POST create a new plan (returns it as a virtual plan - not stored in DB since no Plan model)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, name, price, features, matrixEntrada, matrixResidual, matrixVendas } = body

    if (!userId) return error('userId is required', 400)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    if (!name || price === undefined) return error('name and price are required', 400)

    // Generate a plan ID from name
    const planId = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

    const newPlan = {
      id: planId,
      name,
      price: Number(price),
      features: features || [],
      matrixEntrada: matrixEntrada || '-',
      matrixResidual: matrixResidual || '-',
      matrixVendas: matrixVendas || '-',
      isActive: true,
      userCount: 0,
    }

    return success(newPlan)
  } catch (err) {
    console.error('Create plan error:', err)
    return error('Failed to create plan', 500)
  }
}
