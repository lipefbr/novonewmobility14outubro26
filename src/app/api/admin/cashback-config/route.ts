import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

const MATRIX_TYPES = ['entrada', 'residual', 'vendas'] as const
type MatrixType = (typeof MATRIX_TYPES)[number]

// Default cashback configuration (percentages per level per matrix type)
const DEFAULT_CONFIG: Record<MatrixType, Record<string, number>> = {
  entrada: { level1: 5, level2: 10, level3: 10, level4: 5, level5: 5 },
  residual: { level1: 5, level2: 5.5, level3: 6, level4: 6.5, level5: 7, level6: 7.5, level7: 8 },
  vendas: {
    level1: 0.1,
    level2: 0.1,
    level3: 0.1,
    level4: 0.1,
    level5: 0.1,
    level6: 0.1,
    level7: 0.1,
    level8: 0.1,
    level9: 0.2,
  },
}

// Default number of levels per matrix type
const LEVEL_COUNT: Record<MatrixType, number> = {
  entrada: 5,
  residual: 7,
  vendas: 9,
}

function configKey(type: MatrixType, levelKey: string): string {
  // levelKey is like 'level1' -> '1'
  const n = levelKey.replace(/[^0-9]/g, '')
  return `cashback_${type}_level_${n}`
}

// GET /api/admin/cashback-config?userId=X
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const admin = await prisma.user.findUnique({ where: { id: userId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    // Load all cashback_*_level_* keys
    const rows = await prisma.systemConfig.findMany({
      where: { key: { contains: 'cashback_' } },
    })
    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.value

    const result: Record<string, Record<string, number>> = {}
    for (const type of MATRIX_TYPES) {
      const levels: Record<string, number> = {}
      for (let i = 1; i <= LEVEL_COUNT[type]; i++) {
        const key = `cashback_${type}_level_${i}`
        const fallback = DEFAULT_CONFIG[type][`level${i}`]
        const raw = map[key] ?? String(fallback)
        const parsed = parseFloat(raw)
        levels[`level${i}`] = isNaN(parsed) ? fallback : parsed
      }
      result[type] = levels
    }

    return success({ ...result, raw: map })
  } catch (err) {
    console.error('Admin cashback-config GET error:', err)
    return error('Failed to fetch cashback configuration', 500)
  }
}

// PUT /api/admin/cashback-config body { userId, configs }
// configs shape: { entrada: { level1: 10, ... }, residual: {...}, vendas: {...} }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, configs } = body

    if (!userId) return error('userId is required', 400)

    const admin = await prisma.user.findUnique({ where: { id: userId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    if (!configs || typeof configs !== 'object') {
      return error('configs object is required', 400)
    }

    const updates: Promise<unknown>[] = []

    for (const type of MATRIX_TYPES) {
      const typeConfig = (configs as Record<string, Record<string, number>>)[type]
      if (!typeConfig || typeof typeConfig !== 'object') continue

      for (const [levelKey, value] of Object.entries(typeConfig)) {
        if (typeof value !== 'number' || isNaN(value)) continue
        const key = configKey(type, levelKey)
        updates.push(
          prisma.systemConfig.upsert({
            where: { key },
            update: { value: String(value) },
            create: {
              key,
              value: String(value),
              description: `CashBack ${type} level ${levelKey.replace(/[^0-9]/g, '')} percentage`,
            },
          })
        )
      }
    }

    await Promise.all(updates)

    return success({ message: 'Cashback configuration updated successfully', updated: updates.length })
  } catch (err) {
    console.error('Admin cashback-config PUT error:', err)
    return error('Failed to update cashback configuration', 500)
  }
}
