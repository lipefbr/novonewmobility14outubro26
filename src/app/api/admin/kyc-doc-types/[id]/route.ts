import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { getSession } from '@/lib/auth'
import { ALLOWED_KYC_DOC_ICONS } from '../route'

// ============================================================================
// /api/admin/kyc-doc-types/[id]
// ----------------------------------------------------------------------------
// PUT    → edita label/descrição/ícone/ativo/ordem de um tipo existente.
//          NÃO permite editar `code` (é unique e referenciado por
//          KycDocument.docType). NÃO permite editar `isDefault` (proteção).
// DELETE → exclui fisicamente o tipo. Recusa se isDefault=true (padrões só
//          podem ser desativados, não excluídos, para preservar histórico
//          e o catálogo mínimo do KYC).
// ============================================================================

const LABEL_MAX_LEN = 80
const DESC_MAX_LEN = 280

async function requireAdmin(userId: string | null) {
  if (!userId) return null
  const admin = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, userType: true },
  })
  if (!admin) return null
  if (
    admin.role === 'admin' ||
    admin.userType === 'admin' ||
    admin.userType === 'ADMIN'
  ) {
    return admin
  }
  return null
}

// ============================================================================
// PUT
// ============================================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await getSession(req)
    if (!session) return error('Não autenticado', 401)

    let body: {
      userId?: string
      label?: string
      description?: string | null
      icon?: string
      isActive?: boolean
      sortOrder?: number
      code?: string
      isDefault?: boolean
    }
    try {
      body = (await req.json()) as typeof body
    } catch {
      return error('JSON inválido', 400)
    }

    const { userId } = body
    const admin =
      userId === session.userId
        ? await requireAdmin(session.userId)
        : await requireAdmin(userId ?? null)
    if (!admin) return error('Acesso restrito a administradores', 403)

    const existing = await prisma.kycDocType.findUnique({ where: { id } })
    if (!existing) return error('Tipo não encontrado', 404)

    // Proteção: code NÃO é editável (é unique e referenciado por
    // KycDocument.docType). Mesmo que o admin mande, ignoramos.
    if (body.code !== undefined && body.code !== existing.code) {
      return error(
        'O código (code) não pode ser editado depois de criado. Exclua o tipo e crie um novo se precisar mudar o código.',
        400,
      )
    }
    // Proteção: isDefault NÃO é editável (somente o seed define os 6 padrão).
    if (body.isDefault !== undefined && body.isDefault !== existing.isDefault) {
      return error('O flag isDefault não pode ser editado manualmente.', 400)
    }

    // Monta payload apenas com campos fornecidos.
    const data: Record<string, unknown> = {}

    if (body.label !== undefined) {
      const label = String(body.label).trim()
      if (!label) return error('label não pode ser vazio', 400)
      if (label.length > LABEL_MAX_LEN) {
        return error(
          `label deve ter no máximo ${LABEL_MAX_LEN} caracteres`,
          400,
        )
      }
      data.label = label
    }

    if (body.description !== undefined) {
      const description = String(body.description ?? '').trim()
      if (description.length > DESC_MAX_LEN) {
        return error(
          `description deve ter no máximo ${DESC_MAX_LEN} caracteres`,
          400,
        )
      }
      data.description = description || null
    }

    if (body.icon !== undefined) {
      const icon = String(body.icon).trim()
      if (!(ALLOWED_KYC_DOC_ICONS as readonly string[]).includes(icon)) {
        return error(
          `icon inválido. Permitidos: ${ALLOWED_KYC_DOC_ICONS.join(', ')}`,
          400,
        )
      }
      data.icon = icon
    }

    if (body.isActive !== undefined) {
      data.isActive = Boolean(body.isActive)
    }

    if (body.sortOrder !== undefined) {
      if (!Number.isFinite(body.sortOrder)) {
        return error('sortOrder deve ser um número', 400)
      }
      data.sortOrder = Math.max(0, Math.min(999, Math.trunc(body.sortOrder)))
    }

    if (Object.keys(data).length === 0) {
      return error('Nenhum campo para atualizar', 400)
    }

    const updated = await prisma.kycDocType.update({
      where: { id },
      data,
    })

    // AuditLog — action='kyc.doctype.update'
    try {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'kyc.doctype.update',
          entityType: 'KycDocType',
          entityId: updated.id,
          details: JSON.stringify({
            before: {
              label: existing.label,
              description: existing.description,
              icon: existing.icon,
              isActive: existing.isActive,
              sortOrder: existing.sortOrder,
            },
            after: {
              label: updated.label,
              description: updated.description,
              icon: updated.icon,
              isActive: updated.isActive,
              sortOrder: updated.sortOrder,
            },
          }),
        },
      })
    } catch (auditErr) {
      console.error('AuditLog create failed (kyc.doctype.update):', auditErr)
    }

    return success({
      id: updated.id,
      code: updated.code,
      label: updated.label,
      description: updated.description,
      icon: updated.icon,
      isDefault: updated.isDefault,
      isActive: updated.isActive,
      sortOrder: updated.sortOrder,
    })
  } catch (err) {
    console.error('PUT /api/admin/kyc-doc-types/[id] error:', err)
    return error('Erro ao atualizar tipo de documento KYC', 500)
  }
}

// ============================================================================
// DELETE — exclui fisicamente o tipo. Recusa se isDefault=true.
// ============================================================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await getSession(req)
    const userId = session?.userId ?? req.nextUrl.searchParams.get('userId')
    const admin = await requireAdmin(userId ?? null)
    if (!admin) return error('Acesso restrito a administradores', 403)

    const existing = await prisma.kycDocType.findUnique({ where: { id } })
    if (!existing) return error('Tipo não encontrado', 404)

    if (existing.isDefault) {
      return error(
        'Tipos padrão não podem ser excluídos, apenas desativados. Use o toggle "Ativo" para esconder esse tipo dos usuários.',
        400,
      )
    }

    await prisma.kycDocType.delete({ where: { id } })

    // AuditLog — action='kyc.doctype.delete'
    try {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'kyc.doctype.delete',
          entityType: 'KycDocType',
          entityId: id,
          details: JSON.stringify({
            code: existing.code,
            label: existing.label,
          }),
        },
      })
    } catch (auditErr) {
      console.error('AuditLog create failed (kyc.doctype.delete):', auditErr)
    }

    return success({ ok: true, id })
  } catch (err) {
    console.error('DELETE /api/admin/kyc-doc-types/[id] error:', err)
    return error('Erro ao excluir tipo de documento KYC', 500)
  }
}
