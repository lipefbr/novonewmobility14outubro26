import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

async function requireAdmin(userId: string | null) {
  if (!userId) return null
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'admin') return null
  return user
}

// GET /api/admin/matrix-types/[id]?userId=...
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = req.nextUrl.searchParams.get('userId')
    if (!(await requireAdmin(userId))) return error('Unauthorized', 403)

    const mt = await prisma.matrixType.findUnique({
      where: { id },
      include: { levels: { orderBy: { level: 'asc' } } },
    })
    if (!mt) return error('Matrix type not found', 404)
    return success(mt)
  } catch (err) {
    console.error('Get matrix type error:', err)
    return error('Failed to fetch matrix type', 500)
  }
}

// PUT /api/admin/matrix-types/[id]
// Body: { userId, name?, width?, depth?, description?, color?, isActive?, levels?: [{level, percentage, fixedBonusCents?}] }
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { userId, name, width, depth, description, color, isActive, levels } = body
    if (!(await requireAdmin(userId))) return error('Unauthorized', 403)

    const existing = await prisma.matrixType.findUnique({ where: { id } })
    if (!existing) return error('Matrix type not found', 404)

    const data: Record<string, unknown> = {}
    if (typeof name === 'string' && name.trim()) data.name = name.trim()
    if (width !== undefined) {
      const w = Number(width)
      if (w < 1 || w > 20) return error('width must be between 1 and 20', 400)
      data.width = w
    }
    if (depth !== undefined) {
      const d = Number(depth)
      if (d < 1 || d > 20) return error('depth must be between 1 and 20', 400)
      data.depth = d
    }
    if (description !== undefined) data.description = description || null
    if (color !== undefined) data.color = color || null
    if (typeof isActive === 'boolean') data.isActive = isActive

    // Replace levels if provided
    if (Array.isArray(levels)) {
      const d = Number(depth) || existing.depth
      const validated = levels
        .filter((l: any) => Number.isInteger(Number(l.level)) && Number(l.level) >= 1 && Number(l.level) <= d)
        .map((l: any) => ({
          level: Number(l.level),
          percentage: Math.max(0, Math.min(100, Number(l.percentage) || 0)),
          fixedBonusCents: Math.max(0, Math.floor(Number(l.fixedBonusCents) || 0)),
        }))

      await prisma.matrixLevelEarning.deleteMany({ where: { matrixTypeId: id } })
      if (validated.length) {
        data.levels = {
          create: validated,
        }
      }
    }

    const updated = await prisma.matrixType.update({
      where: { id },
      data,
      include: { levels: { orderBy: { level: 'asc' } } },
    })

    return success(updated)
  } catch (err) {
    console.error('Update matrix type error:', err)
    return error('Failed to update matrix type', 500)
  }
}

// DELETE /api/admin/matrix-types/[id]?userId=...
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = req.nextUrl.searchParams.get('userId')
    if (!(await requireAdmin(userId))) return error('Unauthorized', 403)

    // Check no plans reference this matrix type before deleting
    const referencing = await prisma.plan.count({
      where: {
        OR: [{ matrixEntradaId: id }, { matrixResidualId: id }, { matrixVendasId: id }],
      },
    })
    if (referencing > 0) {
      return error('Cannot delete: this matrix type is referenced by one or more plans. Remove the reference first.', 409)
    }

    await prisma.matrixType.delete({ where: { id } })
    return success({ deleted: true })
  } catch (err) {
    console.error('Delete matrix type error:', err)
    return error('Failed to delete matrix type', 500)
  }
}
