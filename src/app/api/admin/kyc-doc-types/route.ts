import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { getSession } from '@/lib/auth'
import { seedKycDocTypesIfEmpty } from '@/lib/seed-kyc-doc-types'

// ============================================================================
// /api/admin/kyc-doc-types
// ----------------------------------------------------------------------------
// CRUD para o catálogo de tipos de documento KYC (Task ID 8).
//
// Antes da Task 8, os 6 tipos eram hardcodeados em src/lib/kyc.ts. Agora são
// persistidos na tabela KycDocType — o admin pode:
//   - editar label/descrição/ícone/ordem/ativo dos 6 padrão (isDefault=true);
//   - criar novos tipos customizados (ex: passport, income_proof);
//   - excluir tipos customizados (isDefault=false NÃO pode ser excluído,
//     só desativado — protege histórico de KycDocument.docType).
//
// GET  ?userId=<adminId>     → lista TODOS os tipos (ativos e inativos).
// POST { userId, code, label, ... }  → cria novo tipo customizado.
// ============================================================================

// Ícones lucide-react permitidos para tipos de documento. O admin só pode
// escolher entre estes (validação server-side). O nome é armazenado como
// string e mapeado para o componente no client (admin-kyc-config-panel.tsx
// e kyc-page.tsx usam o mesmo ICON_MAP).
export const ALLOWED_KYC_DOC_ICONS = [
  'IdCard',
  'FileText',
  'MapPin',
  'Camera',
  'CreditCard',
  'User',
  'Briefcase',
  'Home',
  'Car',
  'Plane',
  'Award',
  'ShieldCheck',
] as const

const CODE_REGEX = /^[a-z0-9_]+$/ // só minúsculas, dígitos, underscore
const CODE_MAX_LEN = 40
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
// GET — lista TODOS os tipos (ativos e inativos) ordenados por sortOrder.
// ============================================================================
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    const userId = session?.userId ?? req.nextUrl.searchParams.get('userId')
    const admin = await requireAdmin(userId ?? null)
    if (!admin) return error('Acesso restrito a administradores', 403)

    // Idempotente: cria os 6 tipos padrão se a tabela estiver vazia (ou
    // faltarem alguns). Tolerante a tabelas recém-criadas.
    try {
      await seedKycDocTypesIfEmpty()
    } catch (seedErr) {
      console.error('[kyc-doc-types] seed failed:', seedErr)
    }

    const types = await prisma.kycDocType.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return success({
      types: types.map((t) => ({
        id: t.id,
        code: t.code,
        label: t.label,
        description: t.description,
        icon: t.icon,
        isDefault: t.isDefault,
        isActive: t.isActive,
        sortOrder: t.sortOrder,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    })
  } catch (err) {
    console.error('GET /api/admin/kyc-doc-types error:', err)
    return error('Erro ao listar tipos de documento KYC', 500)
  }
}

// ============================================================================
// POST — cria um novo tipo customizado.
// Body: { userId, code, label, description?, icon?, isActive?, sortOrder? }
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) return error('Não autenticado', 401)

    let body: {
      userId?: string
      code?: string
      label?: string
      description?: string | null
      icon?: string
      isActive?: boolean
      sortOrder?: number
    }
    try {
      body = (await req.json()) as typeof body
    } catch {
      return error('JSON inválido', 400)
    }

    const { userId } = body
    // Re-validar admin pelo body (defesa em profundidade).
    const admin =
      userId === session.userId
        ? await requireAdmin(session.userId)
        : await requireAdmin(userId ?? null)
    if (!admin) return error('Acesso restrito a administradores', 403)

    const code = (body.code ?? '').trim().toLowerCase()
    const label = (body.label ?? '').trim()
    const description = (body.description ?? '').trim()
    const icon = (body.icon ?? '').trim() || 'FileText'
    const isActive = body.isActive !== false // default true
    const sortOrder = Number.isFinite(body.sortOrder)
      ? Math.max(0, Math.min(999, Math.trunc(body.sortOrder as number)))
      : 99

    // Validações
    if (!code) return error('code é obrigatório', 400)
    if (code.length > CODE_MAX_LEN) {
      return error(`code deve ter no máximo ${CODE_MAX_LEN} caracteres`, 400)
    }
    if (!CODE_REGEX.test(code)) {
      return error(
        'code só pode conter letras minúsculas, dígitos e underscore (_)',
        400
      )
    }
    if (!label) return error('label é obrigatório', 400)
    if (label.length > LABEL_MAX_LEN) {
      return error(`label deve ter no máximo ${LABEL_MAX_LEN} caracteres`, 400)
    }
    if (description.length > DESC_MAX_LEN) {
      return error(
        `description deve ter no máximo ${DESC_MAX_LEN} caracteres`,
        400
      )
    }
    if (!(ALLOWED_KYC_DOC_ICONS as readonly string[]).includes(icon)) {
      return error(
        `icon inválido. Permitidos: ${ALLOWED_KYC_DOC_ICONS.join(', ')}`,
        400
      )
    }

    // code único (case-insensitive — já normalizamos p/ minúsculas)
    const existing = await prisma.kycDocType.findUnique({
      where: { code },
      select: { id: true },
    })
    if (existing) {
      return error(`Já existe um tipo de documento com o code "${code}"`, 400)
    }

    const created = await prisma.kycDocType.create({
      data: {
        code,
        label,
        description: description || null,
        icon,
        // isDefault sempre false — tipos criados via API NÃO podem ser
        // excluídos pelo admin por padrão... espera, o oposto: isDefault=false
        // SIGNIFICA que podem ser excluídos. Tipos padrão (isDefault=true) são
        // só os 6 hardcodeados que vêm do seed.
        isDefault: false,
        isActive,
        sortOrder,
      },
    })

    // AuditLog — action='kyc.doctype.create'
    try {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'kyc.doctype.create',
          entityType: 'KycDocType',
          entityId: created.id,
          details: JSON.stringify({
            code,
            label,
            description: description || null,
            icon,
            isActive,
            sortOrder,
          }),
        },
      })
    } catch (auditErr) {
      console.error('AuditLog create failed (kyc.doctype.create):', auditErr)
    }

    return success(
      {
        id: created.id,
        code: created.code,
        label: created.label,
        description: created.description,
        icon: created.icon,
        isDefault: created.isDefault,
        isActive: created.isActive,
        sortOrder: created.sortOrder,
      },
      201
    )
  } catch (err) {
    console.error('POST /api/admin/kyc-doc-types error:', err)
    return error('Erro ao criar tipo de documento KYC', 500)
  }
}
