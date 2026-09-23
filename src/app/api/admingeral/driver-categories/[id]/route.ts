import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { requireAppAdmin } from '@/lib/admingeral-guard'

// ============================================================================
// /api/admingeral/driver-categories/[id]
// ----------------------------------------------------------------------------
// PUT    → atualiza uma categoria de motorista. NÃO permite editar `code`
//          (campo unique e referenciado por User.driverCategoryId — mudar
//          quebraria histórico e relações).
// DELETE → exclui fisicamente. Bloqueia se houver motoristas vinculados:
//          o admin deve desativar a categoria em vez de excluir, ou migrar
//          os motoristas para outra categoria antes.
// ============================================================================

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { userId, ...updateFields } = body

    const admin = await requireAppAdmin(userId)
    if (!admin) return error('Unauthorized', 403)

    const existing = await prisma.driverCategory.findUnique({ where: { id } })
    if (!existing) return error('Categoria não encontrada', 404)

    // `code` NÃO é editável — único e referenciado por User.driverCategoryId.
    // Ignoramos silenciosamente se vier no body (melhor UX do que erro 400).
    const data: Record<string, unknown> = {}
    if (updateFields.name !== undefined) {
      const name = String(updateFields.name).trim()
      if (!name) return error('name não pode ser vazio', 400)
      if (name.length > 80) return error('name deve ter no máximo 80 caracteres', 400)
      data.name = name
    }
    if (updateFields.description !== undefined) {
      data.description = updateFields.description || null
    }
    if (updateFields.sortOrder !== undefined) {
      data.sortOrder = Number(updateFields.sortOrder) || 0
    }
    if (updateFields.monthlyTripsTarget !== undefined) {
      data.monthlyTripsTarget = Number(updateFields.monthlyTripsTarget) || 0
    }
    if (updateFields.bonusCents !== undefined) {
      data.bonusCents = Number(updateFields.bonusCents) || 0
    }
    if (updateFields.maxCancellationPerMonth !== undefined) {
      data.maxCancellationPerMonth = Number(updateFields.maxCancellationPerMonth) || 0
    }
    if (updateFields.color !== undefined) {
      data.color = updateFields.color || null
    }
    if (updateFields.icon !== undefined) {
      data.icon = updateFields.icon || null
    }
    if (updateFields.isActive !== undefined) {
      data.isActive = Boolean(updateFields.isActive)
    }

    if (Object.keys(data).length === 0) {
      return error('Nenhum campo para atualizar', 400)
    }

    const updated = await prisma.driverCategory.update({ where: { id }, data })
    return success(updated)
  } catch (err) {
    console.error('[/api/admingeral/driver-categories/[id] PUT] error:', err)
    return error('Internal server error', 500)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const userId = req.nextUrl.searchParams.get('userId')

    const admin = await requireAppAdmin(userId)
    if (!admin) return error('Unauthorized', 403)

    const existing = await prisma.driverCategory.findUnique({ where: { id } })
    if (!existing) return error('Categoria não encontrada', 404)

    // Bloqueia exclusão se houver motoristas vinculados — orienta a
    // desativar a categoria em vez de excluir (mantém histórico).
    const userCount = await prisma.user.count({
      where: { driverCategoryId: id },
    })
    if (userCount > 0) {
      return error(
        `Não é possível excluir: ${userCount} motorista(s) vinculado(s) a esta categoria. Desative a categoria em vez de excluir.`,
        400,
      )
    }

    await prisma.driverCategory.delete({ where: { id } })
    return success({ deleted: true })
  } catch (err) {
    console.error('[/api/admingeral/driver-categories/[id] DELETE] error:', err)
    return error('Internal server error', 500)
  }
}
