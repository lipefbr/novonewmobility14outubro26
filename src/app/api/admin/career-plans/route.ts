import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

const DEFAULT_CAREER_PLANS = [
  { code: 'bronze', name: 'Bronze', description: 'Nível inicial do plano de carreira.', minPoints: 0, bonusCents: 0, color: '#cd7f32', icon: '🥉', sortOrder: 1 },
  { code: 'prata', name: 'Prata', description: 'Nível intermediário do plano de carreira.', minPoints: 100, bonusCents: 5000, color: '#c0c0c0', icon: '🥈', sortOrder: 2 },
  { code: 'ouro', name: 'Ouro', description: 'Nível avançado do plano de carreira.', minPoints: 500, bonusCents: 25000, color: '#ffd700', icon: '🥇', sortOrder: 3 },
  { code: 'diamante', name: 'Diamante', description: 'Nível premium do plano de carreira.', minPoints: 1000, bonusCents: 75000, color: '#b9f2ff', icon: '💎', sortOrder: 4 },
  { code: 'black', name: 'Black', description: 'Nível máximo do plano de carreira.', minPoints: 5000, bonusCents: 250000, color: '#000000', icon: '👑', sortOrder: 5 },
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
      color,
      icon,
      isActive = true,
      sortOrder = 99,
    } = body

    if (!userId) return error('userId is required', 400)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    if (!code || !name) return error('code and name are required', 400)

    const existing = await prisma.careerPlan.findUnique({ where: { code } })
    if (existing) return error('Já existe um plano de carreira com este código', 400)

    const created = await prisma.careerPlan.create({
      data: {
        code,
        name,
        description: description || null,
        minPoints: Number(minPoints) || 0,
        bonusCents: Number(bonusCents) || 0,
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
