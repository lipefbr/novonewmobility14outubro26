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
 * The 5 document types the user must upload (per the NewMobility spec).
 * Order matters: CNH frente → CNH verso → RG frente → RG verso → comprovante.
 */
export const KYC_DOC_TYPES = [
  'cnh_front',
  'cnh_back',
  'rg_front',
  'rg_back',
  'proof_address',
] as const

export type KycDocType = (typeof KYC_DOC_TYPES)[number]

export const KYC_DOC_LABELS: Record<KycDocType, string> = {
  cnh_front: 'CNH Frente',
  cnh_back: 'CNH Verso',
  rg_front: 'RG Frente',
  rg_back: 'RG Verso',
  proof_address: 'Comprovante de Endereço',
}
