import { db, prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { getSession } from '@/lib/auth'
import {
  MATRIX_THRESHOLDS,
  getMatrixProgress,
  type MatrixLimitsOverride,
  type MatrixType,
} from '@/lib/matrix-thresholds'

// Task 14-F — Per-matrix blocking progress for the logged-in user.
//
// Returns the 3 matrix progress objects (entrada / residual / vendas) with:
//   - current value (cents for amount metrics, integer count for count metrics)
//   - threshold (max)
//   - percentage (0..100, clamped)
//   - isBlocked flag (true when current >= threshold)
//   - remaining units
//   - thresholdLabel (e.g. "R$ 96.500")
//
// Strictly per-user — every sum is filtered by `session.userId`.
//
// Task 13-d — os limites NÃO são mais hardcoded. A fonte é o SystemConfig
// (editado na aba Matrizes do admin via PUT /api/admin/matrix-config):
//   - matrix.entrada.limit_cents  (default 9650000 = R$ 96.500,00)
//   - matrix.residual.limit_cents (default 75000000 = R$ 750.000,00)
//   - matrix.vendas.limit_cents   (default 0 = "a definir" → ilimitado)
// Valor ausente, não-numérico ou <= 0 → null = ILIMITADO (nunca bloqueia).
// A resposta expõe `limits` (aditivo) para os consumidores client-side e os
// objetos de `progress` já vêm calculados com esses limites aplicados.

// Keys do SystemConfig lidas por matriz (mesmas keys gravadas pelo admin).
const LIMIT_KEYS: Record<MatrixType, string> = {
  entrada: 'matrix.entrada.limit_cents',
  residual: 'matrix.residual.limit_cents',
  vendas: 'matrix.vendas.limit_cents',
}

// Task 13-d — carrega os 3 limites do SystemConfig.
// Retorna null por matriz quando ausente/inválido/<= 0 → ilimitado ("a definir").
async function loadMatrixLimits(): Promise<{
  entradaCents: number | null
  residualCents: number | null
  vendasCount: number | null
}> {
  const result = {
    entradaCents: null as number | null,
    residualCents: null as number | null,
    vendasCount: null as number | null,
  }
  try {
    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: Object.values(LIMIT_KEYS) } },
    })
    for (const cfg of configs) {
      // Fail-open: qualquer valor ausente/inválido/<= 0 = ilimitado.
      const parsed = parseInt(cfg.value, 10)
      if (!Number.isFinite(parsed) || parsed <= 0) continue
      if (cfg.key === LIMIT_KEYS.entrada) result.entradaCents = parsed
      else if (cfg.key === LIMIT_KEYS.residual) result.residualCents = parsed
      else if (cfg.key === LIMIT_KEYS.vendas) result.vendasCount = parsed
    }
  } catch (e) {
    // Nunca bloquear usuário por falha de leitura de config → tudo ilimitado.
    console.warn('[matrix-progress] Falha ao ler limites do SystemConfig:', e)
  }
  return result
}

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) return error('Unauthorized', 401)

    const userId = session.userId

    // Pull the user's OWN cashback records for each matrix type.
    // Entrada + Residual are summed in cents; Vendas is summed in count
    // (each CashbackSales row = one sale).
    const [entradaRecords, residualRecords, vendasRecords, limits] = await Promise.all([
      db.find('CashbackEntry', '"userId" = $1', [userId]),
      db.find('CashbackResidual', '"userId" = $1', [userId]),
      db.find('CashbackSales', '"userId" = $1', [userId]),
      loadMatrixLimits(),
    ])

    const entradaEarned = (entradaRecords as Array<{ amount?: number }>).reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0,
    )
    const residualEarned = (residualRecords as Array<{ amount?: number }>).reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0,
    )
    const vendasCount = vendasRecords.length
    const vendasAmount = (vendasRecords as Array<{ amount?: number }>).reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0,
    )

    const matrixTypes: MatrixType[] = ['entrada', 'residual', 'vendas']
    const progress = matrixTypes.map((type) => {
      const currentValue =
        type === 'entrada'
          ? entradaEarned
          : type === 'residual'
            ? residualEarned
            : vendasCount
      // Task 13-d — override por tipo (null no campo = ilimitado).
      const override: MatrixLimitsOverride =
        type === 'entrada'
          ? { entradaCents: limits.entradaCents }
          : type === 'residual'
            ? { residualCents: limits.residualCents }
            : { vendasCount: limits.vendasCount }
      const p = getMatrixProgress(type, currentValue, override)
      return {
        type,
        metric: p.metric,
        current: p.current,
        threshold: p.threshold,
        thresholdLabel: p.thresholdLabel,
        pct: p.pct,
        isBlocked: p.isBlocked,
        remaining: p.remaining,
        // Task 13-d — flag aditivo: matriz sem limite configurado ("a definir").
        unlimited: p.unlimited === true,
        // Convenience for the vendas matrix: also return the total R$ amount
        // earned (count metric, but the UI can still show "R$ X vendidos").
        amountLabel:
          type === 'vendas'
            ? vendasAmount
            : type === 'entrada'
              ? entradaEarned
              : residualEarned,
      }
    })

    return success({
      // Mantido por compatibilidade — valores FALLBACK documentados.
      thresholds: MATRIX_THRESHOLDS,
      // Task 13-d — limites reais do SystemConfig (null = ilimitado).
      limits,
      progress,
    })
  } catch (err) {
    console.error('Matrix progress error:', err)
    return error('Internal server error', 500)
  }
}
