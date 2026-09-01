import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// ============================================================================
// /api/admin/matrix-config — Manage matrix configuration (sales limit, etc.)
// ----------------------------------------------------------------------------
// Item 2: Admin can define the "Limite de Vendas" (sales limit) for the
// sales matrix. Stored on SystemConfig under key 'matrix.vendas.salesLimit'.
// Category: 'matrizes'.
//
// Also supports audit logging: every change to the sales limit creates an
// AuditLog entry recording who changed it, when, the previous value, and
// the new value.
// ============================================================================

const SALES_LIMIT_KEY = 'matrix.vendas.salesLimit'
const SALES_LIMIT_CATEGORY = 'matrizes'

// GET /api/admin/matrix-config?userId=<adminId>
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const admin = await prisma.user.findUnique({ where: { id: userId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    // Fetch the sales limit from SystemConfig
    const config = await prisma.systemConfig.findUnique({
      where: { key: SALES_LIMIT_KEY },
    })

    const salesLimit = config ? parseInt(config.value, 10) : 1000 // default: 1000 sales

    // Fetch audit history for sales limit changes (last 20)
    const auditLogs = await prisma.auditLog.findMany({
      where: { action: 'matrix.vendas.salesLimit.update' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { name: true, email: true } } },
    })

    const history = auditLogs.map(log => {
      let details: { previousValue?: number; newValue?: number } = {}
      try { details = JSON.parse(log.details || '{}') } catch { /* ignore */ }
      return {
        id: log.id,
        adminName: log.user?.name || 'Sistema',
        adminEmail: log.user?.email || '',
        previousValue: details.previousValue,
        newValue: details.newValue,
        timestamp: log.createdAt.toISOString(),
      }
    })

    return success({
      salesLimit,
      description: config?.description || 'Limite de vendas da Matriz de Vendas (usado como teto para cálculo de comissões/cashback).',
      history,
    })
  } catch (err) {
    console.error('matrix-config GET error:', err)
    return error('Failed to fetch matrix config', 500)
  }
}

// PUT /api/admin/matrix-config
// Body: { userId, salesLimit: number }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, salesLimit } = body

    if (!userId) return error('userId is required', 400)

    const admin = await prisma.user.findUnique({ where: { id: userId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    // Validate: must be a positive integer
    const parsed = Number(salesLimit)
    if (!Number.isFinite(parsed) || parsed < 1 || !Number.isInteger(parsed)) {
      return error('Limite de vendas deve ser um número inteiro positivo', 400)
    }

    // Fetch the current value (for audit log)
    const existing = await prisma.systemConfig.findUnique({
      where: { key: SALES_LIMIT_KEY },
    })
    const previousValue = existing ? parseInt(existing.value, 10) : null

    // Upsert the sales limit
    const updated = await prisma.systemConfig.upsert({
      where: { key: SALES_LIMIT_KEY },
      update: {
        value: String(parsed),
        description: 'Limite de vendas da Matriz de Vendas (usado como teto para cálculo de comissões/cashback).',
        category: SALES_LIMIT_CATEGORY,
      },
      create: {
        key: SALES_LIMIT_KEY,
        value: String(parsed),
        description: 'Limite de vendas da Matriz de Vendas (usado como teto para cálculo de comissões/cashback).',
        category: SALES_LIMIT_CATEGORY,
      },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'matrix.vendas.salesLimit.update',
        entityType: 'SystemConfig',
        entityId: updated.id,
        details: JSON.stringify({
          previousValue,
          newValue: parsed,
        }),
      },
    })

    return success({
      message: 'Limite de vendas atualizado com sucesso',
      salesLimit: parsed,
      previousValue,
    })
  } catch (err) {
    console.error('matrix-config PUT error:', err)
    return error('Failed to update matrix config', 500)
  }
}
