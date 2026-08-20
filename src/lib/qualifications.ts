/**
 * Qualification options used across the platform.
 *
 * Task 2-e (Item 4): expanded the dropdown from 6 hardcoded options
 * (motorista / passageiro / passageiro_60 / passageiro_pcd / comercio /
 * entregador) to 10 business-relevant qualifications per the client spec:
 *
 *   Motorista, Entregador, Cliente, Lojista, Mototaxista, Motofretista,
 *   Motorista de App, Taxista, Caminhoneiro, Outros
 *
 * The values are stable string codes — never change them (they are
 * persisted on the User.qualification column and used by the gratifications
 * module to gate the "Metas" section). The labels are PT-BR human-readable
 * strings shown in every UI that lists qualifications:
 *
 *   - Admin "Editar Usuário" dialog (admin-users-panel.tsx)
 *   - User backoffice "Dados Pessoais" card (personal-data-section.tsx)
 *   - Self-registration dropdown (register-page.tsx)
 *
 * Legacy qualification codes (motorista / passageiro / passageiro_60 /
 * passageiro_pcd / comercio / entregador) are still recognised by
 * `qualificationLabel()` so users registered before the expansion don't
 * see a raw code in their profile.
 */
export interface QualificationOption {
  value: string
  label: string
}

export const QUALIFICATION_OPTIONS: readonly QualificationOption[] = [
  { value: 'motorista', label: 'Motorista' },
  { value: 'entregador', label: 'Entregador' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'lojista', label: 'Lojista' },
  { value: 'mototaxista', label: 'Mototaxista' },
  { value: 'motofretista', label: 'Motofretista' },
  { value: 'motorista_app', label: 'Motorista de App' },
  { value: 'taxista', label: 'Taxista' },
  { value: 'caminhoneiro', label: 'Caminhoneiro' },
  { value: 'outros', label: 'Outros' },
] as const

/**
 * Legacy qualification codes that existed before Task 2-e. Kept here so the
 * `qualificationLabel()` helper can render a friendly PT-BR label for users
 * registered under the old dropdown (instead of showing the raw code).
 */
export const LEGACY_QUALIFICATION_OPTIONS: readonly QualificationOption[] = [
  { value: 'passageiro', label: 'Passageiro' },
  { value: 'passageiro_60', label: 'Passageiro 60+' },
  { value: 'passageiro_pcd', label: 'Passageiro com Mobilidade Reduzida' },
  { value: 'comercio', label: 'Comércio' },
] as const

/**
 * Resolve a qualification code to its human-readable PT-BR label.
 *
 * Looks up the current options first, then falls back to the legacy table,
 * and finally returns the raw value (so the user always sees something).
 * Returns '—' for null/undefined so callers can render an "empty" dash.
 */
export function qualificationLabel(value?: string | null): string {
  if (!value) return '—'
  const current = QUALIFICATION_OPTIONS.find((o) => o.value === value)
  if (current) return current.label
  const legacy = LEGACY_QUALIFICATION_OPTIONS.find((o) => o.value === value)
  if (legacy) return legacy.label
  return value
}
