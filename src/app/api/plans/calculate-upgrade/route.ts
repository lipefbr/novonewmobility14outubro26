import { db, prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// ─── Blue 3 → Premium 5 upgrade flow (Índice.docx §3 + §1.1) ────────────
// Prices/names are NO LONGER hardcoded — they are read from the `Plan`
// table (admin-editable via the plans CRUD) on every request, so admin
// edits propagate immediately. Task 11.
//
// `premium5` is a display-code alias for the DB's `blue5` row (client
// spec §1.1). `blue5` and `premium5` are interchangeable in the API
// surface — `premium5` is the client-spec display name.
//
// Fallbacks below are ONLY used when the Plan table is empty/unreadable.
// They mirror the DB seed values (blue3/blue5 = R$ 999,90 each) so the
// API stays consistent with /api/simulator/calculate and /api/plans.
const FALLBACK_PRICES: Record<string, number> = {
  free: 0,
  blue3: 99990, // R$ 999,90
  blue5: 99990, // R$ 999,90
}
const FALLBACK_NAMES: Record<string, string> = {
  free: 'Gratuito',
  blue3: 'Blue 3',
  blue5: 'Blue 5 Premium',
}
// Upgrade hierarchy — higher = more unlocked features. `premium5` and
// `blue5` share the same sortOrder (they're the same tier); we treat
// them as interchangeable for the "is this an upgrade?" check.
const PLAN_ORDER: Record<string, number> = { free: 0, blue3: 1, blue5: 2, premium5: 2 }

// Normalize plan codes that point to the same tier. The DB stores the
// upgrade tier as `blue5`; the client spec calls it `premium5`.
function normalizePlan(code: string): string {
  if (code === 'premium5') return 'blue5'
  return code
}

/**
 * Build the live price/name maps from the Plan table (admin-editable).
 * Falls back to the constants above when the table is empty or the
 * query fails. `premium5` mirrors `blue5` so the alias always prices
 * the same as the DB row it points to.
 */
async function loadPlanCatalog(): Promise<{
  prices: Record<string, number>
  names: Record<string, string>
}> {
  const prices: Record<string, number> = { ...FALLBACK_PRICES }
  const names: Record<string, string> = { ...FALLBACK_NAMES }
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { code: true, name: true, priceCents: true },
    })
    for (const plan of plans) {
      if (!plan?.code) continue
      if (typeof plan.priceCents === 'number' && plan.priceCents >= 0) {
        prices[plan.code] = plan.priceCents
      }
      if (plan.name) {
        names[plan.code] = plan.name
      }
    }
  } catch (err) {
    console.warn('calculate-upgrade: failed to load Plan catalog, using fallbacks:', err)
  }
  // premium5 alias mirrors blue5 (same tier per client spec §1.1)
  if (prices.blue5 !== undefined) prices.premium5 = prices.blue5
  if (names.blue5 !== undefined) names.premium5 = names.blue5
  return { prices, names }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, targetPlan } = body

    if (!userId || !targetPlan) {
      return error('userId and targetPlan are required')
    }

    if (!['blue3', 'blue5', 'premium5'].includes(targetPlan)) {
      return error('Invalid target plan. Must be blue3, blue5, or premium5')
    }

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user) {
      return error('User not found', 404)
    }

    // Live plan catalog from the DB (admin-editable prices/names)
    const { prices: PLAN_PRICES, names: PLAN_NAMES } = await loadPlanCatalog()

    const currentPlanRaw = user.plan || 'free'
    const currentPlan = normalizePlan(currentPlanRaw)
    const targetPlanNorm = normalizePlan(targetPlan)
    const currentLevel = PLAN_ORDER[currentPlan] ?? 0
    const targetLevel = PLAN_ORDER[targetPlanNorm] ?? 0

    if (targetLevel <= currentLevel) {
      return error('Target plan must be higher than current plan')
    }

    const currentPrice = PLAN_PRICES[currentPlan] || 0
    const targetPrice = PLAN_PRICES[targetPlanNorm] || 0
    const upgradeCost = targetPrice - currentPrice

    // Calculate benefits
    const benefits: Record<string, string | number> = {}

    if (currentPlan === 'free') {
      benefits.cashbackEntrada = '3 níveis (de: nenhum)'
      benefits.cashbackResidual = '7 níveis (de: nenhum)'
    } else if (currentPlan === 'blue3') {
      // Upgrading from Blue 3 → Premium 5 unlocks entrada levels 4-5
      benefits.cashbackEntrada = '5 níveis (era: 3 níveis — desbloqueia níveis 4 e 5)'
      benefits.cashbackResidual = '7 níveis (mesmo)'
      benefits.cashbackSales = '9 níveis (mesmo)'
    }

    const newFeatures: string[] = []
    if (targetPlanNorm === 'blue3' && currentPlan === 'free') {
      newFeatures.push('CashBack Mobilidade', 'CashBack Farmácia')
    }
    if (targetPlanNorm === 'blue5') {
      // Always describe the Blue 3 → Premium 5 unlock benefits, even
      // when coming from `free` (so the user sees what premium5 grants).
      if (currentPlan === 'free') {
        newFeatures.push(
          'CashBack Mobilidade',
          'CashBack Farmácia',
          'CashBack Shopping',
          'Portal Gamer',
          'Portal Sport Bet',
          'Seguro Auto',
          'Seguro de Vida',
          'Telemedicina',
          'Níveis 4 e 5 da matriz Entrada desbloqueados'
        )
      } else if (currentPlan === 'blue3') {
        newFeatures.push(
          'Níveis 4 e 5 da matriz Entrada desbloqueados',
          'Potencial de ganhos extras: R$ 1.920 (nível 4) + R$ 7.680 (nível 5)'
        )
      }
    }

    // Estimate monthly cashback increase (Blue 3 → Premium 5 unlocks
    // levels 4 and 5 of the entrada matrix; combined potential extra:
    // L4: 256 users × 5% × R$150 = R$1.920; L5: 1.024 users × 5% × R$150
    // = R$7.680. We expose the L4+L5 sum as the estimated increase.)
    const estimatedIncrease = targetPlanNorm === 'blue5'
      ? (currentPlan === 'blue3' ? 960000 : 975000) // R$9.600 (L4+L5) / R$9.750 (all levels)
      : 15000

    return success({
      currentPlan: {
        id: currentPlanRaw,
        name: PLAN_NAMES[currentPlan] || currentPlan,
        price: currentPrice,
      },
      targetPlan: {
        id: targetPlan,
        name: PLAN_NAMES[targetPlan] || targetPlan,
        price: targetPrice,
      },
      upgradeCost,
      monthlyDifference: targetPrice - currentPrice,
      benefits,
      newFeatures,
      estimatedMonthlyCashbackIncrease: estimatedIncrease,
      roi: targetPrice > 0 ? Math.round((estimatedIncrease / targetPrice) * 100) : 0,
      // Extra context for the frontend
      unlockedLevelsBefore: currentPlan === 'free' ? 0 : currentPlan === 'blue3' ? 3 : 5,
      unlockedLevelsAfter: targetPlanNorm === 'blue5' ? 5 : targetPlanNorm === 'blue3' ? 3 : 0,
      isPremium5Upgrade: currentPlan === 'blue3' && targetPlanNorm === 'blue5',
    })
  } catch (err) {
    console.error('Calculate upgrade error:', err)
    return error('Internal server error', 500)
  }
}
