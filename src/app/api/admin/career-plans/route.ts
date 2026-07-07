import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// Default career pins per client spec (Índice.docx §6).
// The plan applies to ALL users ("NÃO TEM O PLANO DE CARREIRA É PARA TODOS OS
// USUÁRIOS EM GERAL"). Each pin is a MONTHLY bonus paid every month as long
// as the user maintains that graduation.
//   - PIN SAFIRA    — Categoria 3 — R$ 2.000/mês (minPoints: 100)
//   - PIN RUBI      — Categoria 2 — R$ 3.000/mês (minPoints: 250)
//   - PIN ESMERALDA — Categoria 1 — R$ 4.000/mês (minPoints: 500)
//   - PIN DIAMANTE  — Categoria 4 — R$ 5.000/mês (minPoints: 1000)
//   - PIN IMPERIAL  — Categoria 5 — R$ 6.000/mês (minPoints: 2500)
// Note: sortOrder matches the natural progression by minPoints (1..5).
// Note: rewardType defaults to "real" (BRL). Admin can switch to "points".
const DEFAULT_CAREER_PLANS = [
  { code: 'safira',    name: 'Safira',    description: 'PIN Safira - Categoria 3 - R$ 2.000/mês ao bater meta mensal', minPoints: 100,  bonusCents: 200000, rewardType: 'real', color: '#7DD3FC', icon: '🔷', sortOrder: 1 },
  { code: 'rubi',      name: 'Rubi',      description: 'PIN Rubi - Categoria 2 - R$ 3.000/mês ao bater meta mensal',     minPoints: 250,  bonusCents: 300000, rewardType: 'real', color: '#F87171', icon: '❤️', sortOrder: 2 },
  { code: 'esmeralda', name: 'Esmeralda', description: 'PIN Esmeralda - Categoria 1 - R$ 4.000/mês ao bater meta mensal', minPoints: 500,  bonusCents: 400000, rewardType: 'real', color: '#34D399', icon: '💚', sortOrder: 3 },
  { code: 'diamante',  name: 'Diamante',  description: 'PIN Diamante - Categoria 4 - R$ 5.000/mês ao bater meta mensal',  minPoints: 1000, bonusCents: 500000, rewardType: 'real', color: '#A78BFA', icon: '💎', sortOrder: 4 },
  { code: 'imperial',  name: 'Imperial',  description: 'PIN Imperial - Categoria 5 - R$ 6.000/mês ao bater meta mensal',  minPoints: 2500, bonusCents: 600000, rewardType: 'real', color: '#FBBF24', icon: '👑', sortOrder: 5 },
]

async function seedDefaultCareerPlansIfEmpty() {
  const count = await prisma.careerPlan.count()
  if (count > 0) return
  for (const c of DEFAULT_CAREER_PLANS) {
    await prisma.careerPlan.create({ data: c })
  }
}

// GET — list all career plans
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    await seedDefaultCareerPlansIfEmpty()

    const plans = await prisma.careerPlan.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return success({ plans })
  } catch (err) {
    console.error('Admin career-plans GET error:', err)
    return error('Failed to fetch career plans', 500)
  }
}

// POST — create a new career plan
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId,
      code,
      name,
      description,
      minPoints = 0,
      bonusCents = 0,
      rewardType = 'real',
      color,
      icon,
      isActive = true,
      sortOrder = 99,
    } = body

    if (!userId) return error('userId is required', 400)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    if (!code || !name) return error('code and name are required', 400)

    // Validate rewardType — only 'real' or 'points' allowed.
    const validRewardType = rewardType === 'points' ? 'points' : 'real'

    const existing = await prisma.careerPlan.findUnique({ where: { code } })
    if (existing) return error('Já existe um plano de carreira com este código', 400)

    const created = await prisma.careerPlan.create({
      data: {
        code,
        name,
        description: description || null,
        minPoints: Number(minPoints) || 0,
        bonusCents: Number(bonusCents) || 0,
        rewardType: validRewardType,
        color: color || null,
        icon: icon || null,
        isActive: Boolean(isActive),
        sortOrder: Number(sortOrder) || 0,
      },
    })

    return success(created, 201)
  } catch (err) {
    console.error('Admin career-plans POST error:', err)
    return error('Failed to create career plan', 500)
  }
}
