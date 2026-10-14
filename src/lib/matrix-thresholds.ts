// Matrix blocking thresholds (Task 14-F).
//
// Each cashback matrix has a hard earning ceiling. When the logged-in user
// reaches the threshold, the matrix is considered "Bloqueada" and the user
// cannot earn any more from that matrix. The UI uses `getMatrixProgress()`
// to render a progress bar + an optional "Bloqueado" badge.
//
//   - Entrada matrix  → blocks at R$ 96.500,00 total earned
//                       (9.650.000 cents)
//   - Residual matrix → blocks at R$ 750.000,00 total earned
//                       (75.000.000 cents)
//   - Vendas matrix   → blocks at R$ 20.000,00 total earned
//                       (2.000.000 cents)
//
// Task 15-j — a matriz VENDAS agora é medida em DINHEIRO (R$ ganhos),
// não em quantidade de vendas. O admin grava matrix.vendas.limit_cents
// como centavos de R$ (mesmo campo "Limite" em R$ da aba Matrizes) —
// antes a API interpretava esse valor como CONTAGEM de vendas, o que
// exibia "2.000.000 vendas" no backoffice para um teto de R$ 20.000,00.
// Todas as 3 matrizes compartilham a mesma unidade (centavos) e o mesmo
// formato de label (formatCentsBrlLabel).
//
// Task 13-d — os limites acima são agora apenas FALLBACKS documentados.
// A fonte da verdade é o SystemConfig (editado na aba Matrizes do admin via
// PUT /api/admin/matrix-config):
//   - matrix.entrada.limit_cents  (default 9650000)
//   - matrix.residual.limit_cents (default 75000000)
//   - matrix.vendas.limit_cents   (default 0 = "a definir" / ilimitado;
//                                  quando > 0, é R$ em CENTAVOS)
// O servidor (/api/network/matrix-progress) lê essas keys e repassa os
// overrides para `getMatrixProgress()` — valor ausente/<= 0 → null =
// ILIMITADO (nunca bloqueia, nunca mostra teto). Os consumidores client-side
// continuam renderizando o que a API devolve; se a API não enviar overrides,
// os fallbacks abaixo são usados (compatibilidade).

export type MatrixType = 'entrada' | 'residual' | 'vendas'

export interface MatrixThresholdEntry {
  /** Cents ceiling (R$ × 100) — all matrices are money-measured (Task 15-j). */
  amountCents: number
  /** Human-friendly label of the ceiling (e.g. "R$ 96.500"). */
  label: string
  /** Measurement unit — always 'amount' (BRL cents) since Task 15-j. */
  metric: 'amount'
}

// FALLBACK defaults — usados somente quando a API não fornece overrides.
// Task 15-j — vendas alinhado ao default exibido no admin (R$ 20.000,00).
export const MATRIX_THRESHOLDS: Record<MatrixType, MatrixThresholdEntry> = {
  entrada: { amountCents: 9_650_000, label: 'R$ 96.500', metric: 'amount' },
  residual: { amountCents: 75_000_000, label: 'R$ 750.000', metric: 'amount' },
  vendas: { amountCents: 2_000_000, label: 'R$ 20.000', metric: 'amount' },
}

// Task 13-d — overrides opcionais vindos do SystemConfig (aba Matrizes).
// Campo `undefined` → usa o fallback de MATRIX_THRESHOLDS (override parcial).
// Campo `null` ou <= 0 → ILIMITADO ("a definir"): nunca bloqueia.
export interface MatrixLimitsOverride {
  entradaCents?: number | null
  residualCents?: number | null
  /** Task 15-j — renomeado de `vendasCount`: é R$ em CENTAVOS, não contagem. */
  vendasCents?: number | null
}

export interface MatrixProgress {
  /** Percentage of the threshold already reached (0..100, clamped). */
  pct: number
  /** True when `currentValue >= threshold` — matrix is blocked. */
  isBlocked: boolean
  /** Remaining BRL cents until the threshold is hit. */
  remaining: number
  /** Human-friendly label of the threshold (e.g. "R$ 96.500"). */
  thresholdLabel: string
  /** The threshold's measurement unit (always 'amount' — Task 15-j). */
  metric: 'amount'
  /** The raw ceiling value in BRL cents. */
  threshold: number
  /** The current value passed in. */
  current: number
  /** Task 13-d — true quando a matriz não tem limite configurado ("a definir"). */
  unlimited?: boolean
}

// Task 13-d — label dinâmico em R$ a partir de centavos (ex.: 9650000 → "R$ 96.500").
// Task 15-j — usado pelas 3 matrizes (vendas incluída: teto em dinheiro).
function formatCentsBrlLabel(cents: number): string {
  const reais = cents / 100
  return `R$ ${reais.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

interface ResolvedCeiling {
  max: number
  label: string
  unlimited: boolean
}

// Task 13-d — resolve o teto efetivo: override do SystemConfig > fallback.
// null / <= 0 / não-numérico no override = ilimitado (nunca bloqueia).
function resolveCeiling(
  matrixType: MatrixType,
  limits?: MatrixLimitsOverride,
): ResolvedCeiling {
  const fallback = MATRIX_THRESHOLDS[matrixType]
  const fallbackMax = fallback.amountCents

  if (limits) {
    const override =
      matrixType === 'entrada'
        ? limits.entradaCents
        : matrixType === 'residual'
          ? limits.residualCents
          : limits.vendasCents

    // Campo presente no override (inclui null) → SystemConfig é a fonte.
    if (override !== undefined) {
      if (override === null || !Number.isFinite(override) || override <= 0) {
        // "A definir" — matriz ilimitada: nunca bloqueia, sem teto exibido.
        return { max: 0, label: 'A definir', unlimited: true }
      }
      // Task 15-j — todas as matrizes são dinheiro: label sempre em R$.
      return {
        max: override,
        label: formatCentsBrlLabel(override),
        unlimited: false,
      }
    }
  }

  // Sem override para este tipo → mantém o fallback documentado.
  return { max: fallbackMax, label: fallback.label, unlimited: false }
}

/**
 * Compute the progress towards a matrix's blocking threshold.
 *
 * @param matrixType   Which matrix to look up.
 * @param currentValue Current accumulated value for the logged-in user, in
 *                       BRL CENTS for all three matrices (Task 15-j — vendas
 *                       comparava contagem de vendas com um teto em centavos;
 *                       agora compara R$ ganhos vs R$ de teto).
 *                       Non-numeric / negative inputs are coerced to 0.
 * @param limits       Task 13-d — overrides vindos do SystemConfig (opcional).
 *                       null/<= 0 = ilimitado (nunca bloqueia). Ausente =
 *                       fallback MATRIX_THRESHOLDS.
 */
export function getMatrixProgress(
  matrixType: MatrixType,
  currentValue: number,
  limits?: MatrixLimitsOverride,
): MatrixProgress {
  const threshold = MATRIX_THRESHOLDS[matrixType]
  const ceiling = resolveCeiling(matrixType, limits)
  const max = ceiling.max

  const current =
    typeof currentValue === 'number' && !isNaN(currentValue) && isFinite(currentValue)
      ? Math.max(0, currentValue)
      : 0

  // Matriz ilimitada: progresso 0%, nunca bloqueada, nada restante a exibir.
  if (ceiling.unlimited) {
    return {
      pct: 0,
      isBlocked: false,
      remaining: 0,
      thresholdLabel: ceiling.label,
      metric: threshold.metric,
      threshold: 0,
      current,
      unlimited: true,
    }
  }

  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0
  const isBlocked = current >= max && max > 0
  const remaining = Math.max(0, max - current)

  return {
    pct,
    isBlocked,
    remaining,
    thresholdLabel: ceiling.label,
    metric: threshold.metric,
    threshold: max,
    current,
  }
}
