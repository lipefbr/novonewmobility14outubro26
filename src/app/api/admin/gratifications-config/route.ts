import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// BACK-7 — Admin config for the "Metas Motorista / Entregador" benefit target.
//
// We persist a single Gratification row whose `type` is 'driver_goals_config'.
// The `targetQualification` field (already on the Gratification schema) holds
// one of:
//   - 'motorista'  → only motoristas see the driver-goals card
//   - 'entregador' → only entregadores see the card
//   - 'ambos'      → motoristas AND entregadores see the card (default)
//
// NOTE on the foreign key: the Gratification model has `userId` referencing
// User, so the config row must be owned by a real user. We use the requesting
// admin's userId when first creating the row; thereafter we look it up by
// `type` only (so any admin can read/update it regardless of who created it).
// The row's `amount` is 0 — it's a config record, not a real payout.

const CONFIG_TYPE = 'driver_goals_config'
const VALID_TARGETS = ['motorista', 'entregador', 'ambos'] as const
type TargetQualification = (typeof VALID_TARGETS)[number]

const DEFAULT_TARGET: TargetQualification = 'ambos'

function normalizeTarget(value: unknown): TargetQualification {
  return (VALID_TARGETS as readonly string[]).includes(value as string)
    ? (value as TargetQualification)
    : DEFAULT_TARGET
}

// GET /api/admin/gratifications-config?userId=<adminId>
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const admin = await prisma.user.findUnique({ where: { id: userId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    const row = await prisma.gratification.findFirst({
      where: { type: CONFIG_TYPE },
    })

    const targetQualification = normalizeTarget(row?.targetQualification)

    return success({
      targetQualification,
      // Always also echo the allowed options so the admin UI can render them.
      options: VALID_TARGETS.map((v) => ({
        value: v,
        label:
          v === 'motorista'
            ? 'Motorista'
            : v === 'entregador'
              ? 'Entregador'
              : 'Ambos',
      })),
    })
  } catch (err) {
    console.error('Admin gratifications-config GET error:', err)
    return error('Failed to fetch gratifications configuration', 500)
  }
}

// PUT /api/admin/gratifications-config
// Body: { userId, targetQualification: 'motorista' | 'entregador' | 'ambos' }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, targetQualification } = body

    if (!userId) return error('userId is required', 400)

    const admin = await prisma.user.findUnique({ where: { id: userId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    const normalized = normalizeTarget(targetQualification)

    // Upsert the single config row. findFirst + update/create keeps the logic
    // robust against multiple rows being created accidentally. The admin's
    // userId is used as the FK owner only on first creation; thereafter the
    // row is looked up by `type` so any admin can update it.
    const existing = await prisma.gratification.findFirst({
      where: { type: CONFIG_TYPE },
    })

    if (existing) {
      const updated = await prisma.gratification.update({
        where: { id: existing.id },
        data: { targetQualification: normalized },
      })
      return success({
        message: 'Configuração de metas atualizada com sucesso',
        targetQualification: updated.targetQualification,
      })
    }

    const created = await prisma.gratification.create({
      data: {
        type: CONFIG_TYPE,
        userId, // FK owner — only used at creation time.
        amount: 0,
        category: 'system_config',
        description:
          'Configuração do benefício Metas Motorista/Entregador (alvo de qualificação).',
        targetQualification: normalized,
      },
    })

    return success({
      message: 'Configuração de metas criada com sucesso',
      targetQualification: created.targetQualification,
    })
  } catch (err) {
    console.error('Admin gratifications-config PUT error:', err)
    return error('Failed to update gratifications configuration', 500)
  }
}
