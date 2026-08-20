import { success, error } from '@/lib/api-utils'

// ============================================================================
// POST /api/simulator/calculate — Task 2-b (Item 13) rewrite
// ============================================================================
//
// Why this rewrite exists:
//   The previous version of this route used a per-plan "multiplier" that
//   didn't match the actual cashback matrix spec, and used placeholder
//   plan prices (R$ 99 / R$ 199) that did not correspond to any real
//   NewMobility plan tier. The client-side simulator
//   (`src/components/newmobility/simulator/earnings-simulator.tsx`) was
//   already rewritten to use the ACTUAL NewMobility plan tiers and the
//   FIXED CashBack base values; this route now mirrors that logic so any
//   client that still hits the API gets consistent numbers.
//
// Plans (per Task 2-b / Item 13):
//   - gratuito : R$ 0/mês      — no cashback matrices unlocked.
//   - blue3    : R$ 999,90/mês — unlocks 3 níveis of Cashback Entrada
//                                 (Residual and Vendas NOT unlocked).
//   - blue5    : R$ 999,90/mês — unlocks 5 níveis Entrada + 7 níveis
//                                 Residual + 9 níveis Vendas.
//
// CashBack base values (BACK-13):
//   - Entrada  base = R$ 999,00   (99900 cents)
//   - Residual base = R$ 1.399,00 (139900 cents)
//   - Vendas   base = R$ 199,90   (19990 cents)
//
// Direct-referral cashback = 10% of the plan mensalidade (R$ 99,99 per
// referral for both Blue 3 and Blue 5). For Gratuito, 0.
//
// ROI = (totalMonthlyEarnings / mensalidade) × 100. For Gratuito, 0
// (no mensalidade to divide by).
// ============================================================================

// Plan prices in BRL cents.
const PLAN_PRICES: Record<string, number> = {
  free: 0,
  blue3: 99990, // R$ 999,90
  blue5: 99990, // R$ 999,90
}

// Plan display names.
const PLAN_NAMES: Record<string, string> = {
  free: 'Gratuito',
  blue3: 'Blue 3',
  blue5: 'Blue 5 Premium',
}

// Per-plan matrix unlock configuration: how many levels of each matrix
// the plan liberates. Drives the projection loop so Blue 3 only computes
// 3 levels of Entrada (Residual and Vendas are 0) while Blue 5 computes
// all three matrices in full.
const PLAN_UNLOCKS: Record<string, { entrada: number; residual: number; vendas: number }> = {
  free: { entrada: 0, residual: 0, vendas: 0 },
  blue3: { entrada: 3, residual: 0, vendas: 0 },
  blue5: { entrada: 5, residual: 7, vendas: 9 },
}

// Fixed CashBack base values per matrix (in BRL cents). Each level's
// earning = baseCents × (levelPct / 100). These are POOL sizes — they do
// NOT depend on the user's plan tier or average spend.
const CB_ENTRADA_BASE_CENTS = 99900 // R$ 999,00
const CB_RESIDUAL_BASE_CENTS = 139900 // R$ 1.399,00
const CB_VENDAS_BASE_CENTS = 19990 // R$ 199,90

// Matrix structural width — 4-wide per the "4x5/4x7/4x9" client spec.
const MATRIX_WIDTH = 4

// Direct-referral cashback: 10% of the plan mensalidade, paid once per
// referral.
const DIRECT_REFERRAL_CASHBACK_PCT = 10

// Matrix level percentages per the client spec (mirrors DEFAULT_*_LEVELS
// in src/lib/api-utils.ts):
//   Entrada 4x5 : 5 / 10 / 10 / 5 / 5                       (total 35%)
//   Residual 4x7: 10 / 9 / 5 / 5 / 4 / 3 / 2                (total 38%)
//   Vendas 4x9  : 0.10 × 9 levels                          (total 0.90%)
const ENTRADA_LEVEL_PCTS: number[] = [5, 10, 10, 5, 5]
const RESIDUAL_LEVEL_PCTS: number[] = [10, 9, 5, 5, 4, 3, 2]
const VENDAS_LEVEL_PCTS: number[] = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]

// Project a single matrix: for each unlocked level, compute the number
// of available positions (MATRIX_WIDTH^level), the filled positions
// (maxPositions × fillRatio, floored), the per-position earning
// (baseCents × pct / 100), and the total per level.
interface MatrixLevelProjection {
  level: number
  percentage: number
  maxUsers: number
  projectedUsers: number
  earningPerUser: number
  totalEarning: number
}

function projectMatrix(
  levelPcts: number[],
  unlockedLevels: number,
  baseCents: number,
  fillPercent: number
): { levels: MatrixLevelProjection[]; total: number } {
  const safeFill = Math.max(0, Math.min(100, fillPercent))
  const fillRatio = safeFill / 100
  const levelsToCompute = Math.max(0, Math.min(levelPcts.length, unlockedLevels))

  const levels: MatrixLevelProjection[] = []
  for (let i = 0; i < levelsToCompute; i++) {
    const level = i + 1
    const pct = levelPcts[i]
    const maxPositions = Math.pow(MATRIX_WIDTH, level)
    const filledPositions = Math.floor(maxPositions * fillRatio)
    const earningPerPosition = Math.round((baseCents * pct) / 100)
    const totalEarning = earningPerPosition * filledPositions
    levels.push({
      level,
      percentage: pct,
      maxUsers: maxPositions,
      projectedUsers: filledPositions,
      earningPerUser: earningPerPosition,
      totalEarning,
    })
  }

  const total = levels.reduce((sum, l) => sum + l.totalEarning, 0)
  return { levels, total }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { plan, directReferrals, matrixFillPercent = 50 } = body

    if (!plan || !(plan in PLAN_PRICES)) {
      return error('Invalid plan. Use: free, blue3, or blue5', 400)
    }
    if (directReferrals === undefined || directReferrals < 0) {
      return error('directReferrals must be a non-negative number', 400)
    }

    const planPrice = PLAN_PRICES[plan]
    const unlocks = PLAN_UNLOCKS[plan]
    const safeDirectReferrals = Math.max(0, Math.floor(Number(directReferrals)))
    const safeFill = Math.max(0, Math.min(100, Number(matrixFillPercent)))

    // Direct-referral cashback: 10% of plan mensalidade per referral
    // (one-time). For Gratuito (price=0) this is 0.
    const perReferralCashback = Math.round((planPrice * DIRECT_REFERRAL_CASHBACK_PCT) / 100)
    const directReferralCashback = safeDirectReferrals * perReferralCashback

    // Project each matrix only for the levels the plan unlocks.
    const entrada = projectMatrix(
      ENTRADA_LEVEL_PCTS,
      unlocks.entrada,
      CB_ENTRADA_BASE_CENTS,
      safeFill
    )
    const residual = projectMatrix(
      RESIDUAL_LEVEL_PCTS,
      unlocks.residual,
      CB_RESIDUAL_BASE_CENTS,
      safeFill
    )
    const vendas = projectMatrix(
      VENDAS_LEVEL_PCTS,
      unlocks.vendas,
      CB_VENDAS_BASE_CENTS,
      safeFill
    )

    const totalEntrada = entrada.total
    const totalResidual = residual.total
    const totalVendas = vendas.total
    const totalMonthly = totalEntrada + totalResidual + totalVendas
    const totalAnnual = totalMonthly * 12
    const roi = planPrice > 0 ? (totalMonthly * 100) / planPrice : 0

    // Per-plan comparison summary so the client can render a "compare
    // plans" section without re-fetching. We project each plan with the
    // same (directReferrals, fillPercent) inputs.
    const comparisons = (['blue3', 'blue5'] as const).map((p) => {
      const u = PLAN_UNLOCKS[p]
      const pm = PLAN_PRICES[p]
      const e = projectMatrix(ENTRADA_LEVEL_PCTS, u.entrada, CB_ENTRADA_BASE_CENTS, safeFill)
      const r = projectMatrix(RESIDUAL_LEVEL_PCTS, u.residual, CB_RESIDUAL_BASE_CENTS, safeFill)
      const v = projectMatrix(VENDAS_LEVEL_PCTS, u.vendas, CB_VENDAS_BASE_CENTS, safeFill)
      const monthly = e.total + r.total + v.total
      return {
        plan: p,
        planName: PLAN_NAMES[p],
        monthlyTotal: monthly,
        annualTotal: monthly * 12,
        roi: pm > 0 ? (monthly * 100) / pm : 0,
      }
    })

    return success({
      plan,
      planName: PLAN_NAMES[plan],
      directReferrals: safeDirectReferrals,
      matrixFillPercent: safeFill,
      planPrice,
      perReferralCashback,
      directReferralCashback,
      entrada: { levels: entrada.levels, total: totalEntrada },
      residual: { levels: residual.levels, total: totalResidual },
      vendas: { levels: vendas.levels, total: totalVendas },
      totalMonthly,
      totalAnnual,
      roi,
      // CashBack base values surfaced for client display.
      cashbackBases: {
        entrada: CB_ENTRADA_BASE_CENTS,
        residual: CB_RESIDUAL_BASE_CENTS,
        vendas: CB_VENDAS_BASE_CENTS,
      },
      comparisons,
    })
  } catch (err) {
    console.error('Simulator calculate error:', err)
    return error('Failed to calculate projections', 500)
  }
}
