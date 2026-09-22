/**
 * KYC blocking helper.
 *
 * A user is "blocked" (cannot withdraw, graduate plan, or release cashback)
 * until an admin approves their KYC documents. The user.kycStatus field has
 * four states: 'none' | 'pending' | 'approved' | 'rejected'.
 *
 * Only 'approved' unblocks the account.
 */

export interface KycAwareUser {
  kycStatus: string
  kycRejectedReason?: string | null
  name?: string | null
}

/**
 * Returns true if the user's KYC is NOT approved (i.e. account is blocked
 * from withdrawals, plan graduation, and cashback release).
 */
export function isUserKycBlocked(user: KycAwareUser | null | undefined): boolean {
  if (!user) return true
  return user.kycStatus !== 'approved'
}

// ─────────────────────────────────────────────────────────────────────────────
// Server-side KYC approval check (used by API routes to gate state-changing
// operations: withdrawals, transfers, cashback/gratification claims, plan
// upgrades).
//
// We keep an in-memory cache per userId so that rapid successive requests
// from the same user (e.g. a double-click on "Sacar") don't all hit the DB.
// Cache TTL is 60 seconds; after that the next call re-queries the DB so an
// admin approval propagates within a minute.
//
// `prisma` is imported dynamically so that this file stays client-safe — the
// pure constants/types above (KYC_DOC_TYPES, KycAwareUser, isUserKycBlocked)
// can still be imported from client components without pulling the Prisma
// client into the browser bundle.
// ─────────────────────────────────────────────────────────────────────────────

const KYC_CACHE_TTL_MS = 60_000
const kycApprovalCache = new Map<string, { result: boolean; ts: number }>()

function isAdminUser(role: string | null | undefined, userType: string | null | undefined): boolean {
  if (role === 'admin') return true
  if (userType === 'admin' || userType === 'ADMIN') return true
  return false
}

/**
 * Returns true if the user is allowed to perform KYC-gated actions
 * (withdrawals, transfers, cashback/gratification claims, plan upgrades).
 *
 * Returns true when:
 *   - The user is an admin (role === 'admin' OR userType === 'admin'/'ADMIN')
 *   - The user's kycStatus === 'approved'
 * Returns false otherwise (including 'pending', 'rejected', 'none', or if
 * the user can't be found / DB errors out — fail-closed).
 *
 * Result is cached in-memory for 60 seconds per userId.
 */
export async function isKycApproved(userId: string): Promise<boolean> {
  if (!userId) return false

  // 1. Check in-memory cache
  const cached = kycApprovalCache.get(userId)
  if (cached && Date.now() - cached.ts < KYC_CACHE_TTL_MS) {
    return cached.result
  }

  // 2. Load user from DB (dynamic import keeps this file client-safe)
  let result = false
  try {
    const { prisma } = await import('@/lib/db')
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true, role: true, userType: true },
    })
    if (!user) {
      result = false
    } else if (isAdminUser(user.role, user.userType)) {
      result = true // admin bypass
    } else {
      result = user.kycStatus === 'approved'
    }
  } catch (err) {
    // Fail-closed: if we can't verify KYC, block the action.
    console.error('[isKycApproved] error checking KYC for user', userId, err)
    result = false
  }

  // 3. Cache and return
  kycApprovalCache.set(userId, { result, ts: Date.now() })
  return result
}

/**
 * Invalidate the cached KYC approval result for a user. Call this from admin
 * approve/reject endpoints so that the new status is reflected immediately
 * (rather than waiting up to 60s for the cache to expire).
 */
export function invalidateKycCache(userId: string): void {
  kycApprovalCache.delete(userId)
}

/**
 * Friendly PT-BR message explaining what's blocked and (if rejected) why.
 * Use this on withdrawal / graduation / cashback screens to tell the user
 * what they need to do.
 */
export function getKycBlockMessage(user: KycAwareUser | null | undefined): string {
  if (!user) {
    return 'Você precisa estar autenticado para realizar esta operação.'
  }

  switch (user.kycStatus) {
    case 'approved':
      return 'Seus documentos foram verificados. Você pode realizar saques, liberar cashback e evoluir de plano.'
    case 'pending':
      return 'Seus documentos estão em análise pela nossa equipe (geralmente 24h). Saques, liberação de cashback e evolução de plano ficarão bloqueados até a aprovação.'
    case 'rejected': {
      const reason = user.kycRejectedReason?.trim()
      if (reason) {
        return `Seus documentos foram rejeitados: ${reason}. Reenvie os documentos na aba KYC para liberar saques, cashback e evolução de plano.`
      }
      return 'Seus documentos foram rejeitados. Reenvie os documentos na aba KYC para liberar saques, cashback e evolução de plano.'
    }
    case 'none':
    default:
      return 'Envie seus documentos na aba KYC para liberar saques, cashback e evolução de plano.'
  }
}

/**
 * The 6 document types the user must upload (per the NewMobility spec).
 * Order matters: CNH frente → CNH verso → RG frente → RG verso → comprovante → selfie.
 * The selfie (user holding the document) was added per BACK-4 to fix the
 * "Tipo de documento inválido" error when uploading the selfie step.
 */
export const KYC_DOC_TYPES = [
  'cnh_front',
  'cnh_back',
  'rg_front',
  'rg_back',
  'proof_address',
  'selfie_document',
] as const

export type KycDocType = (typeof KYC_DOC_TYPES)[number]

export const KYC_DOC_LABELS: Record<KycDocType, string> = {
  cnh_front: 'CNH Frente',
  cnh_back: 'CNH Verso',
  rg_front: 'RG Frente',
  rg_back: 'RG Verso',
  proof_address: 'Comprovante de Endereço',
  selfie_document: 'Selfie com Documento',
}

// ─────────────────────────────────────────────────────────────────────────────
// Task ID 7 — Configuração admin: quais tipos de documento são exigidos.
//
// A chave SystemConfig `kyc.required_doc_types` guarda um JSON array de
// strings (codes de tipos que existem na tabela KycDocType) com os tipos que
// o admin marcou como obrigatórios. Se a chave NÃO existir, retornamos TODOS
// os tipos ativos da tabela KycDocType (default histórico — mantém o
// comportamento anterior à Task 7, com o acréscimo da Task 8 que tornou o
// catálogo editável).
//
// Um array vazio significa "nenhum documento exigido" — o KYC torna-se
// opcional (usuário pode sacar sem enviar nada).
// ─────────────────────────────────────────────────────────────────────────────

export const KYC_REQUIRED_DOC_TYPES_KEY = 'kyc.required_doc_types'

// ─────────────────────────────────────────────────────────────────────────────
// Task ID 8 — Catálogo editável de tipos de documento KYC.
//
// `getAllKycDocTypes()` lê a tabela KycDocType e retorna a lista completa de
// tipos (ativos e inativos). A API admin usa para mostrar o grid editável.
// O painel do usuário e a validação de upload filtram por isActive=true.
//
// Mantemos a constante KYC_DOC_TYPES e o mapa KYC_DOC_LABELS exportados
// como fallback — outros arquivos ainda os importam e não devem quebrar.
// ─────────────────────────────────────────────────────────────────────────────

export interface KycDocTypeRow {
  id: string
  code: string
  label: string
  description: string | null
  icon: string
  isDefault: boolean
  isActive: boolean
  sortOrder: number
}

/**
 * Lê TODOS os tipos de documento KYC do banco (ativos e inativos),
 * ordenados por sortOrder asc, createdAt asc. Chama `seedKycDocTypesIfEmpty()`
 * antes da query para garantir que os 6 padrão existam em bases novas.
 *
 * Retorna array vazio se houver qualquer erro (fail-safe).
 */
export async function getAllKycDocTypes(): Promise<KycDocTypeRow[]> {
  try {
    const { prisma } = await import('@/lib/db')
    // Idempotente: cria os 6 padrão se a tabela estiver vazia.
    try {
      const { seedKycDocTypesIfEmpty } = await import('@/lib/seed-kyc-doc-types')
      await seedKycDocTypesIfEmpty()
    } catch (seedErr) {
      console.error('[getAllKycDocTypes] seed failed:', seedErr)
    }

    const rows = await prisma.kycDocType.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      label: r.label,
      description: r.description,
      icon: r.icon,
      isDefault: r.isDefault,
      isActive: r.isActive,
      sortOrder: r.sortOrder,
    }))
  } catch (err) {
    console.error('[getAllKycDocTypes] erro ao ler tipos KYC:', err)
    return []
  }
}

/**
 * Lê a config admin `kyc.required_doc_types` e devolve a lista de tipos
 * de documento que o usuário precisa enviar. Faz fallback para TODOS os
 * tipos ativos do banco se a chave não existir (default histórico).
 *
 * Após a Task 8, o catálogo veio do banco. Esta função cruza a config
 * admin (array de codes) com a lista de tipos ATIVOS do banco — assim,
 * se o admin desativar um tipo que ainda está marcado como exigido, ele
 * automaticamente deixa de ser exigido (não aparece para o usuário).
 *
 * Retorna `{ requiredDocTypes, isConfigured }`:
 *   - `requiredDocTypes: string[]` — pode ser vazio (admin desmarcou tudo
 *     OU todos os exigidos foram desativados).
 *   - `isConfigured: boolean` — true se a chave existe no banco. Útil para o
 *     POST decidir entre aceitar qualquer tipo ativo (default) ou só os exigidos.
 */
export async function getRequiredKycDocTypes(): Promise<{
  requiredDocTypes: string[]
  isConfigured: boolean
}> {
  try {
    const { prisma } = await import('@/lib/db')

    // Carrega lista de tipos ATIVOS do banco (codes) — usado para filtrar.
    const activeRows = await prisma.kycDocType.findMany({
      where: { isActive: true },
      select: { code: true },
    })
    const activeCodes = new Set(activeRows.map((r) => r.code))
    const activeCodeList = activeRows.map((r) => r.code)

    const row = await prisma.systemConfig.findUnique({
      where: { key: KYC_REQUIRED_DOC_TYPES_KEY },
      select: { value: true },
    })
    if (!row || !row.value) {
      // Default histórico: TODOS os tipos ativos do banco.
      return { requiredDocTypes: activeCodeList, isConfigured: false }
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(row.value)
    } catch {
      console.warn(
        '[getRequiredKycDocTypes] valor não é JSON válido, usando default. value=',
        row.value
      )
      return { requiredDocTypes: activeCodeList, isConfigured: false }
    }
    if (!Array.isArray(parsed)) {
      return { requiredDocTypes: activeCodeList, isConfigured: false }
    }
    // Filtra itens inválidos (não-string, ou que não existem no banco, ou
    // que foram desativados). Remove duplicatas preservando a ordem do admin.
    const seen = new Set<string>()
    const filtered: string[] = []
    for (const item of parsed) {
      if (typeof item === 'string' && activeCodes.has(item) && !seen.has(item)) {
        seen.add(item)
        filtered.push(item)
      }
    }
    return { requiredDocTypes: filtered, isConfigured: true }
  } catch (err) {
    console.error('[getRequiredKycDocTypes] erro ao ler config KYC:', err)
    // Fail-safe: retorna os 6 hardcodeados (fallback da constante estática).
    return { requiredDocTypes: [...KYC_DOC_TYPES], isConfigured: false }
  }
}
