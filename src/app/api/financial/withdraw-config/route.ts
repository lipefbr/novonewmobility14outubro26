import { success } from '@/lib/api-utils'
import { prisma } from '@/lib/db'

// ============================================================================
// /api/financial/withdraw-config (GET) — Task 13-c
// ----------------------------------------------------------------------------
// PUBLIC (no auth) config feed for the member-facing withdrawal rules — same
// spirit as /api/simulator/config (Task 11): rules/marketing data only, no
// PII, no user-specific values.
//
// Reads the SAME SystemConfig keys (saque.*) with the SAME parsing and
// defaults as the enforcing backend POST /api/financial/withdraw
// (getWithdrawalConfig, Task 12). Mirroring the parsing on purpose: what the
// member sees in the UI must always match what the server enforces.
//
//   • saque.min_cents              → minCents (default 5000)
//   • saque.max_cents              → maxDailyCents (default 500000)
//   • saque.fee_pct                → feePct (default 2)
//   • saque.fee_free_days          → freeDays/freeDaysLabel (default [5,6,7,8])
//   • saque.processing_time_hours  → processingTimeHours (default 48)
//   • saque.max_daily_withdrawals  → maxDailyWithdrawals (default 3)
//
// Nunca retorna 500: se o banco falhar, degrada com os defaults — endpoint
// de config não pode quebrar a página do membro.
// ============================================================================

const DEFAULT_MIN_CENTS = 5000         // R$ 50,00
const DEFAULT_MAX_DAILY_CENTS = 500000 // R$ 5.000,00
const DEFAULT_FEE_PCT = 2              // 2%
const DEFAULT_FREE_DAYS = [5, 6, 7, 8]
const DEFAULT_PROCESSING_HOURS = 48    // 48h
const DEFAULT_MAX_DAILY_WITHDRAWALS = 3

// Réplica de parseFreeDays de src/app/api/financial/withdraw/route.ts (Task 12).
// Duplicado de propósito: importar de um route.ts acoplaria duas rotas;
// o helper tem 10 linhas e é estável (valida 1-31, fallback default).
function parseFreeDays(raw: string | undefined): number[] {
  if (!raw) return DEFAULT_FREE_DAYS
  const parts = raw.split(',').map(s => parseInt(s.trim(), 10))
  const days = parts.filter(n => Number.isFinite(n) && n >= 1 && n <= 31)
  return days.length ? days : DEFAULT_FREE_DAYS
}

// Réplica de formatFreeDaysLabel do withdraw/route.ts: "5-8" se contíguo,
// senão "5,6,7,8" (mesmo formato que o backend grava nas descriptions).
function formatFreeDaysLabel(freeDays: number[]): string {
  if (!freeDays.length) return '—'
  const sorted = [...freeDays].sort((a, b) => a - b)
  let isContiguous = true
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) { isContiguous = false; break }
  }
  if (isContiguous && sorted.length > 1) return `${sorted[0]}-${sorted[sorted.length - 1]}`
  return sorted.join(', ')
}

export async function GET() {
  // Defaults = mesmo comportamento do backend quando a key não existe no
  // SystemConfig (ou o banco está indisponível).
  let minCents = DEFAULT_MIN_CENTS
  let maxDailyCents = DEFAULT_MAX_DAILY_CENTS
  let feePct = DEFAULT_FEE_PCT
  let freeDays = DEFAULT_FREE_DAYS
  let processingTimeHours = DEFAULT_PROCESSING_HOURS
  let maxDailyWithdrawals = DEFAULT_MAX_DAILY_WITHDRAWALS

  try {
    const configs = await prisma.systemConfig.findMany({
      where: { key: { startsWith: 'saque.' } },
    })
    const map: Record<string, string> = {}
    configs.forEach(c => { map[c.key] = c.value })

    // Mesma semântica de parse do withdraw/route.ts (parseInt/parseFloat || default).
    minCents = parseInt(map['saque.min_cents'] || '') || DEFAULT_MIN_CENTS
    maxDailyCents = parseInt(map['saque.max_cents'] || '') || DEFAULT_MAX_DAILY_CENTS
    feePct = parseFloat(map['saque.fee_pct'] || '') || DEFAULT_FEE_PCT
    freeDays = parseFreeDays(map['saque.fee_free_days'])
    processingTimeHours = parseInt(map['saque.processing_time_hours'] || '') || DEFAULT_PROCESSING_HOURS
    maxDailyWithdrawals = parseInt(map['saque.max_daily_withdrawals'] || '') || DEFAULT_MAX_DAILY_WITHDRAWALS
  } catch (err) {
    // Degrada com os defaults acima — config endpoint nunca deve dar 500.
    console.warn('withdraw-config: falha ao ler SystemConfig, usando defaults:', err)
  }

  return success({
    minCents,
    maxDailyCents,
    feePct,
    freeDays,
    freeDaysLabel: formatFreeDaysLabel(freeDays),
    processingTimeHours,
    maxDailyWithdrawals,
  })
}
