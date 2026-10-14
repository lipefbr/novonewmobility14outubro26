import { success, error } from '@/lib/api-utils'
import {
  getEntradaLevels,
  getResidualLevels,
  getVendasLevels,
  DEFAULT_ENTRADA_LEVELS,
  DEFAULT_RESIDUAL_LEVELS,
  DEFAULT_VENDAS_LEVELS,
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'

// ============================================================================
// /api/simulator/config (GET) — Task 11
// ----------------------------------------------------------------------------
// PUBLIC (no auth) config feed for the client-side Earnings Simulator.
// Contains marketing data only — no PII, no user-specific values.
//
// Purpose: the simulator used to compute EVERYTHING from hardcoded client
// constants, so admin edits (plan prices, matrix percentages, cashback
// bases, referral %) never showed up. This endpoint exposes the same
// admin-editable sources the backend uses so the client can render live
// values:
//
//   • plans        — `Plan` table (isActive only, ordered by sortOrder)
//                    with per-plan unlocks from SystemConfig keys
//                    `plan.{code}.cashback_levels_{entrada|residual|vendas}`
//                    (the EXACT keys the admin plans panel saves — see
//                    admin-page.tsx handleSavePlan). Fallback per-code:
//                    free 0/0/0 · blue3 3/0/0 · blue5 5/7/9.
//   • *Levels      — getEntradaLevels()/getResidualLevels()/
//                    getVendasLevels() from @/lib/api-utils (SystemConfig
//                    `cashback_{type}_level_{n}`), the SAME helpers the
//                    POST /api/simulator/calculate uses.
//   • cb*Bases     — SAME SystemConfig keys as POST /api/simulator/
//                    calculate (`matrix.{entrada|residual|vendas}.base_cents`)
//                    with the SAME defaults (99900/139900/19990) so the
//                    GET and POST stay consistent.
//   • directReferralPct — SAME key as POST (`cashback.direct_referral_pct`).
// ============================================================================

// Fallbacks — mirror /api/simulator/calculate defaults (and the Plan seed).
const FALLBACK_PLANS: Array<{ code: string; label: string; priceCents: number }> = [
  { code: 'free', label: 'Gratuito', priceCents: 0 },
  { code: 'blue3', label: 'Blue 3', priceCents: 99990 },
  { code: 'blue5', label: 'Blue 5 Premium', priceCents: 99990 },
]

// Per-code unlock fallback used when the SystemConfig key for a plan is
// absent/invalid. Unknown plan codes get 0/0/0 (nothing unlocked).
function fallbackUnlocks(code: string): { entrada: number; residual: number; vendas: number } {
  switch (code) {
    case 'blue5':
      return { entrada: 5, residual: 7, vendas: 9 }
    case 'blue3':
      return { entrada: 3, residual: 0, vendas: 0 }
    default:
      return { entrada: 0, residual: 0, vendas: 0 }
  }
}

// Strict int parser — unlike `parseInt(x) || fallback`, an explicitly
// configured 0 is respected (the admin may legitimately configure 0
// unlocked levels for a plan).
function parseLevel(value: string | null | undefined, fallback: number): number {
  if (value === null || value === undefined || String(value).trim() === '') return fallback
  const v = parseInt(String(value), 10)
  return Number.isFinite(v) && v >= 0 ? v : fallback
}

async function getConfig(key: string, fallback: string): Promise<string> {
  try {
    const row = await prisma.systemConfig.findUnique({ where: { key } })
    return row?.value ?? fallback
  } catch {
    return fallback
  }
}

export async function GET() {
  try {
    // ── 1) Plans + prices from the Plan table (admin-editable) ────────
    let dbPlans: Array<{ code: string; name: string; priceCents: number }> = []
    try {
      const rows = await prisma.plan.findMany({
        // isDefault: true → apenas os tiers canônicos de upgrade (free/blue3/
        // blue5). Planos mensais add-on (matriz_residual, cash_back_de_vendas)
        // são isDefault:false e NÃO são opções de plano no simulador — mesmo
        // filtro do GET público /api/plans.
        where: { isActive: true, isDefault: true },
        orderBy: { sortOrder: 'asc' },
        select: { code: true, name: true, priceCents: true },
      })
      dbPlans = rows
        .filter((p) => p.code)
        .map((p) => ({
          code: p.code,
          name: p.name || p.code,
          priceCents: typeof p.priceCents === 'number' ? p.priceCents : 0,
        }))
    } catch (err) {
      console.warn('simulator/config: failed to load Plan table, using fallbacks:', err)
    }

    const rows =
      dbPlans.length > 0
        ? dbPlans
        : FALLBACK_PLANS.map((p) => ({ code: p.code, name: p.label, priceCents: p.priceCents }))

    // ── 2) Per-plan unlocks from SystemConfig (admin plans panel keys) ─
    // Single batched read for every plan code we end up serving.
    const unlockKeys: string[] = []
    for (const row of rows) {
      unlockKeys.push(
        `plan.${row.code}.cashback_levels_entrada`,
        `plan.${row.code}.cashback_levels_residual`,
        `plan.${row.code}.cashback_levels_vendas`
      )
    }
    const unlockRows = await prisma.systemConfig
      .findMany({ where: { key: { in: unlockKeys } } })
      .catch(() => [])
    // Explicit tuple typing (the array literal inside .map would be
    // inferred as any[] which Map's overload rejects).
    const unlockMap = new Map<string, string>()
    for (const r of unlockRows) {
      unlockMap.set(r.key, r.value)
    }

    const plans = rows.map((row) => {
      const fb = fallbackUnlocks(row.code)
      return {
        code: row.code,
        label: row.name,
        priceCents: row.priceCents,
        unlocks: {
          entrada: parseLevel(unlockMap.get(`plan.${row.code}.cashback_levels_entrada`), fb.entrada),
          residual: parseLevel(unlockMap.get(`plan.${row.code}.cashback_levels_residual`), fb.residual),
          vendas: parseLevel(unlockMap.get(`plan.${row.code}.cashback_levels_vendas`), fb.vendas),
        },
      }
    })

    // ── 3) Matrix level percentages (SystemConfig via shared helpers) ──
    const [entradaLevels, residualLevels, vendasLevels] = await Promise.all([
      getEntradaLevels(),
      getResidualLevels(),
      getVendasLevels(),
    ])

    // ── 4) Cashback bases + direct referral % — SAME keys and defaults
    //       as the POST /api/simulator/calculate endpoint ───────────────
    const entradaBaseStr = await getConfig('matrix.entrada.base_cents', '99900')
    const residualBaseStr = await getConfig('matrix.residual.base_cents', '139900')
    const vendasBaseStr = await getConfig('matrix.vendas.base_cents', '19990')
    const directPctStr = await getConfig('cashback.direct_referral_pct', '10')
    const cbEntradaBaseCents = parseInt(entradaBaseStr) || 99900
    const cbResidualBaseCents = parseInt(residualBaseStr) || 139900
    const cbVendasBaseCents = parseInt(vendasBaseStr) || 19990
    const directReferralPct = parseFloat(directPctStr) || 10

    return success({
      plans,
      entradaLevels: entradaLevels.length > 0 ? entradaLevels : DEFAULT_ENTRADA_LEVELS,
      residualLevels: residualLevels.length > 0 ? residualLevels : DEFAULT_RESIDUAL_LEVELS,
      vendasLevels: vendasLevels.length > 0 ? vendasLevels : DEFAULT_VENDAS_LEVELS,
      cbEntradaBaseCents,
      cbResidualBaseCents,
      cbVendasBaseCents,
      directReferralPct,
    })
  } catch (err) {
    console.error('Simulator config error:', err)
    return error('Internal server error', 500)
  }
}
