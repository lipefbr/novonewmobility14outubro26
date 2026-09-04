import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// ============================================================================
// /api/admin/system-settings/[id] — UPDATE and DELETE for one setting
// ============================================================================

// PUT /api/admin/system-settings/[id]
// Body: { userId, value?, description?, category? }
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { userId, value, description, category } = body

    if (!userId) return error('userId is required', 400)

    const admin = await prisma.user.findUnique({ where: { id: userId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    const existing = await prisma.systemConfig.findUnique({ where: { id } })
    if (!existing) return error('Configuração não encontrada', 404)

    const data: Record<string, unknown> = {}
    if (typeof value === 'string' && value.trim()) data.value = value.trim()
    if (description !== undefined) {
      data.description =
        typeof description === 'string' && description.trim() ? description.trim() : null
    }
    if (category !== undefined) {
      data.category =
        typeof category === 'string' && category.trim() ? category.trim() : 'geral'
    }

    if (Object.keys(data).length === 0) {
      return error('Nenhum campo para atualizar', 400)
    }

    const updated = await prisma.systemConfig.update({ where: { id }, data })

    return success({
      message: 'Configuração atualizada com sucesso',
      item: {
        id: updated.id,
        key: updated.key,
        value: updated.value,
        description: updated.description,
        category: updated.category,
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  } catch (err) {
    console.error('Admin system-settings PUT error:', err)
    return error('Failed to update system setting', 500)
  }
}

// DELETE /api/admin/system-settings/[id]?userId=<adminId>
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const admin = await prisma.user.findUnique({ where: { id: userId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    const existing = await prisma.systemConfig.findUnique({ where: { id } })
    if (!existing) return error('Configuração não encontrada', 404)

    await prisma.systemConfig.delete({ where: { id } })

    return success({ message: 'Configuração excluída com sucesso' })
  } catch (err) {
    console.error('Admin system-settings DELETE error:', err)
    return error('Failed to delete system setting', 500)
  }
}
