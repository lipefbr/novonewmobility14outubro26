import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { getSession } from '@/lib/auth'
import {
  KYC_REQUIRED_DOC_TYPES_KEY,
  getRequiredKycDocTypes,
  getAllKycDocTypes,
} from '@/lib/kyc'

/**
 * GET /api/admin/kyc-config
 *
 * Retorna a lista de tipos de documento exigidos no KYC (config admin) e a
 * lista completa de tipos ATIVOS do banco (Task ID 8 — catálogo editável)
 * com label/descrição/ícone para o painel admin montar os checkboxes.
 *
 * Query: ?userId=<adminId> (ou header Authorization via getSession).
 *
 * Task ID 8: allDocTypes agora vem do banco (getAllKycDocTypes) em vez de
 * KYC_DOC_TYPES hardcodeado. Só retornamos tipos isActive=true — o painel
 * de checkboxes só mostra tipos que o usuário pode exigir.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    const userId = session?.userId ?? req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId é obrigatório', 400)

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, userType: true },
    })
    const isAdmin =
      admin?.role === 'admin' ||
      admin?.userType === 'admin' ||
      admin?.userType === 'ADMIN'
    if (!isAdmin) return error('Acesso restrito a administradores', 403)

    const { requiredDocTypes, isConfigured } = await getRequiredKycDocTypes()

    // Task ID 8 — allDocTypes vem do banco. Filtramos para ATIVOS, pois o
    // painel de checkboxes só deve oferecer tipos que o usuário pode exigir.
    const allRows = await getAllKycDocTypes()
    const allDocTypes = allRows
      .filter((r) => r.isActive)
      .map((r) => ({
        id: r.id,
        type: r.code,
        label: r.label,
        description: r.description ?? '',
        icon: r.icon,
        isDefault: r.isDefault,
        sortOrder: r.sortOrder,
      }))

    return success({
      requiredDocTypes,
      isConfigured,
      allDocTypes,
    })
  } catch (err) {
    console.error('GET /api/admin/kyc-config error:', err)
    return error('Erro ao buscar configuração KYC', 500)
  }
}

/**
 * PUT /api/admin/kyc-config
 *
 * Body: { userId, requiredDocTypes: string[] }
 *
 * Salva em SystemConfig.kyc.required_doc_types (JSON array). Aceita array
 * vazio (KYC opcional). Valida que cada item é um code que existe no banco
 * E está ativo (Task ID 8).
 * Cria AuditLog (action='kyc.config.update').
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) return error('Não autenticado', 401)
    if (session.role !== 'admin') {
      // Permite também userType admin (mesmo critério do GET)
      const admin = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { userType: true },
      })
      const isAdminType =
        admin?.userType === 'admin' || admin?.userType === 'ADMIN'
      if (!isAdminType) return error('Acesso restrito a administradores', 403)
    }

    let body: { userId?: string; requiredDocTypes?: unknown }
    try {
      body = (await req.json()) as typeof body
    } catch {
      return error('JSON inválido', 400)
    }

    const { userId } = body
    if (!userId) return error('userId é obrigatório', 400)

    // Re-validar admin pelo body (defesa em profundidade — alguns clientes
    // enviam userId no body e não no header de sessão).
    if (userId !== session.userId) {
      const admin = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, userType: true },
      })
      const isAdmin =
        admin?.role === 'admin' ||
        admin?.userType === 'admin' ||
        admin?.userType === 'ADMIN'
      if (!isAdmin) return error('Acesso restrito a administradores', 403)
    }

    const { requiredDocTypes } = body
    if (!Array.isArray(requiredDocTypes)) {
      return error('requiredDocTypes deve ser um array de strings', 400)
    }

    // Task ID 8 — valida cada code contra os tipos ATIVOS do banco.
    // Rejeita silenciosamente duplicatas (mantém a primeira ocorrência).
    const activeRows = await prisma.kycDocType.findMany({
      where: { isActive: true },
      select: { code: true },
    })
    const activeCodes = new Set(activeRows.map((r) => r.code))
    const seen = new Set<string>()
    const sanitized: string[] = []
    for (const item of requiredDocTypes) {
      if (typeof item === 'string' && activeCodes.has(item) && !seen.has(item)) {
        seen.add(item)
        sanitized.push(item)
      }
    }
    // NOTA: sanitized pode ser vazio aqui — é o cenário "KYC opcional".

    const value = JSON.stringify(sanitized)

    // Carrega valor antigo (para AuditLog before/after).
    const previous = await prisma.systemConfig.findUnique({
      where: { key: KYC_REQUIRED_DOC_TYPES_KEY },
      select: { value: true },
    })

    await prisma.systemConfig.upsert({
      where: { key: KYC_REQUIRED_DOC_TYPES_KEY },
      update: {
        value,
        description:
          'Lista de tipos de documento obrigatórios para KYC (JSON array)',
        category: 'kyc',
      },
      create: {
        key: KYC_REQUIRED_DOC_TYPES_KEY,
        value,
        description:
          'Lista de tipos de documento obrigatórios para KYC (JSON array)',
        category: 'kyc',
      },
    })

    // AuditLog — action='kyc.config.update'. O schema real do AuditLog usa
    // apenas userId/action/entityType/entityId/details/ipAddress/userAgent.
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'kyc.config.update',
          entityType: 'SystemConfig',
          entityId: KYC_REQUIRED_DOC_TYPES_KEY,
          details: JSON.stringify({
            before: previous?.value ?? null,
            after: value,
            requiredDocTypes: sanitized,
            count: sanitized.length,
          }),
        },
      })
    } catch (auditErr) {
      console.error('AuditLog create failed (kyc.config.update):', auditErr)
    }

    return success({
      saved: true,
      requiredDocTypes: sanitized,
      message:
        sanitized.length === 0
          ? 'Configuração salva. Nenhum documento será exigido — o KYC agora é opcional.'
          : `Configuração salva. ${sanitized.length} documento(s) obrigatório(s).`,
    })
  } catch (err) {
    console.error('PUT /api/admin/kyc-config error:', err)
    return error('Erro ao salvar configuração KYC', 500)
  }
}
