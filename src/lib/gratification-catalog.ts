/**
 * Task 15-f — Fonte única do catálogo de gratificações (client spec §5).
 *
 * Antes o catálogo estático (STATIC_FALLBACK_GRATIFICATIONS) vivia dentro de
 * /api/gratifications/route.ts, então o claim não conseguia resolver itens de
 * catálogo (ids sintéticos `catalog_<type>_<idx>` gerados no front) — toda
 * reivindicação de catálogo caía em 404 → toast "Erro ao reivindicar
 * gratificação".
 *
 * Este lib exporta:
 *  - STATIC_FALLBACK_GRATIFICATIONS: catálogo base (mesmos 7 itens da spec);
 *  - getCatalogGratifications(): catálogo + overlay das edições do admin
 *    (SystemConfig `metas.benefit.{type}.name|.amount|.description`, helpers
 *    compartilhados com /api/gratifications-config — Task 13-e);
 *  - getCatalogItem(type): um item específico pelo `type` (usado pelo claim).
 *
 * Não importar deste arquivo em componentes client — ele puxa o Prisma via
 * gratifications-config/route (server-only).
 */

import { applyBenefitOverlay, loadBenefitOverlay } from '@/app/api/gratifications-config/route'

export interface GratificationCatalogItem {
  type: string
  name: string
  amount: number
  category: string
  description: string
}

// Catálogo base da spec (Índice.docx §5) — MESMOS valores de antes da
// movimentação (eram a const STATIC_FALLBACK_GRATIFICATIONS dentro da rota).
// O DB rows por usuário (Gratification) têm precedência no UI; este catálogo
// representa o que a plataforma OFERECE, sempre disponível para exibição.
export const STATIC_FALLBACK_GRATIFICATIONS: readonly GratificationCatalogItem[] = [
  {
    type: 'fuel_aid',
    name: 'Auxílio Combustível',
    amount: 260000, // R$ 2.600 (R$100/dia × 26 dias)
    category: 'mobility',
    description:
      'R$ 2.600/mês (R$100/dia × 26 dias). Pago no fim do mês após pagamento da fatura. Qualificação: ao fechar o 5º nível.',
  },
  {
    type: 'car_wash',
    name: 'Reembolso Vale Ducha (Lava-Carro)',
    amount: 78000, // R$ 780 (R$30/dia × 26 dias)
    category: 'mobility',
    description:
      'R$ 780/mês (R$30/dia × 26 dias). Pago diário ou no fim do mês após fatura. Qualificação: ao fechar o 5º nível.',
  },
  {
    type: 'vacation_6mo',
    name: 'Férias 6 Meses',
    amount: 500000, // R$ 5.000 + 10 dias
    category: 'vacation',
    description: 'R$ 5.000 + 10 dias de férias. Único aos 6 meses de cadastro ativo.',
  },
  {
    type: 'vacation_12mo',
    name: 'Férias 12 Meses',
    amount: 2000000, // R$ 20.000 + 20 dias
    category: 'vacation',
    description: 'R$ 20.000 + 20 dias de férias. Único aos 12 meses de cadastro ativo.',
  },
  {
    type: 'driver_daily_goal',
    name: 'Meta Diária Motorista',
    amount: 0,
    category: 'mobility',
    description:
      '18 corridas/dia — Motorista/Entregador ativo. Ao bater a meta no dia, o sistema envia notificação push avisando que aquele dia teve a meta batida.',
  },
  {
    type: 'driver_monthly_goal',
    name: 'Meta Mensal Motorista',
    amount: 0,
    category: 'mobility',
    description:
      '384 corridas/mês (18 corridas × ~21 dias úteis). Bonificação extra mensal ao bater a meta — Motorista/Entregador ativo.',
  },
  {
    type: 'cashback_bonus_prize',
    name: 'Prêmio CashBack Gratificação',
    amount: 1500000, // R$ 15.000
    category: 'prize',
    description: 'R$ 15.000 — Único ao fechar equipe com 1.364 usuários.',
  },
]

/**
 * Catálogo completo com o overlay das edições do admin aplicado
 * (nome/valor/descrição reais gravados em SystemConfig). Fail-open: em erro
 * de banco devolve o catálogo estático (mesma política de /api/gratifications).
 */
export async function getCatalogGratifications(): Promise<GratificationCatalogItem[]> {
  try {
    const overlay = await loadBenefitOverlay()
    return applyBenefitOverlay(STATIC_FALLBACK_GRATIFICATIONS, overlay)
  } catch {
    return [...STATIC_FALLBACK_GRATIFICATIONS]
  }
}

/**
 * Resolve UM item do catálogo pelo `type` (com overlay do admin aplicado).
 * Retorna null quando o type não existe no catálogo — o claim devolve 404
 * com mensagem específica nesse caso.
 */
export async function getCatalogItem(type: string): Promise<GratificationCatalogItem | null> {
  const t = (type || '').trim()
  if (!t) return null
  const catalog = await getCatalogGratifications()
  return catalog.find((c) => c.type === t) ?? null
}
