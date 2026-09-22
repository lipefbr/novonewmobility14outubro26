// ─────────────────────────────────────────────────────────────────────────────
// Seed dos 6 tipos de documento KYC padrão (Task ID 8).
// ----------------------------------------------------------------------------
// Antes da Task 8, os 6 tipos eram hardcodeados em src/lib/kyc.ts
// (constante KYC_DOC_TYPES). Agora eles são persistidos na tabela KycDocType
// com isDefault=true — isso impede que o admin os exclua (só pode desativar
// ou editar label/descrição/ícone/ordem).
//
// Esta função é idempotente: ela só cria os tipos que ainda não existem no
// banco. Se um tipo padrão já foi criado (mesmo que editado pelo admin), ele
// NÃO é sobrescrito — o admin mantém suas edições.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '@/lib/db'

interface DefaultKycDocType {
  code: string
  label: string
  description: string
  icon: string
  isDefault: true
  isActive: boolean
  sortOrder: number
}

// Os 6 tipos padrão do KYC NewMobility (mesma ordem da constante KYC_DOC_TYPES
// em src/lib/kyc.ts — mantida para retrocompatibilidade).
export const DEFAULT_KYC_DOC_TYPES: DefaultKycDocType[] = [
  {
    code: 'cnh_front',
    label: 'CNH Frente',
    description: 'Foto nítida da frente da CNH',
    icon: 'IdCard',
    isDefault: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    code: 'cnh_back',
    label: 'CNH Verso',
    description: 'Foto nítida do verso da CNH',
    icon: 'IdCard',
    isDefault: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    code: 'rg_front',
    label: 'RG Frente',
    description: 'Foto da frente do RG (alternativa à CNH)',
    icon: 'FileText',
    isDefault: true,
    isActive: true,
    sortOrder: 3,
  },
  {
    code: 'rg_back',
    label: 'RG Verso',
    description: 'Foto do verso do RG',
    icon: 'FileText',
    isDefault: true,
    isActive: true,
    sortOrder: 4,
  },
  {
    code: 'proof_address',
    label: 'Comprovante de Endereço',
    description: 'Conta de água/luz/telefone com CEP (últimos 90 dias)',
    icon: 'MapPin',
    isDefault: true,
    isActive: true,
    sortOrder: 5,
  },
  {
    code: 'selfie_document',
    label: 'Selfie com Documento',
    description: 'Foto segurando o documento ao lado do rosto',
    icon: 'Camera',
    isDefault: true,
    isActive: true,
    sortOrder: 6,
  },
]

/**
 * Garante que os 6 tipos padrão existam na tabela KycDocType.
 *
 * Idempotente: para cada tipo padrão, faz upsert por `code`. Se a row já
 * existe, NÃO toca em label/descrição/ícone/ativo/ordem — o admin mantém
 * suas edições. Só cria o tipo se ele não existir (primeira execução em
 * uma base nova).
 *
 * Retorna o número de tipos que foram criados nesta chamada (0 se todos
 * já existiam).
 */
export async function seedKycDocTypesIfEmpty(): Promise<number> {
  let created = 0
  for (const t of DEFAULT_KYC_DOC_TYPES) {
    const existing = await prisma.kycDocType.findUnique({
      where: { code: t.code },
      select: { id: true },
    })
    if (!existing) {
      await prisma.kycDocType.create({ data: t })
      created++
    }
  }
  return created
}
