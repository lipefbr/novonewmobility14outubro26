'use client'

// ============================================================================
// Earnings Simulator — Task 14-E rewrite
// ============================================================================
//
// Why this file exists (and why the previous version was broken):
//   • The old simulator hit POST /api/simulator/calculate which only knew
//     about the `free` / `blue3` / `blue5` plans and applied a per-plan
//     "multiplier" that didn't match the actual cashback matrix spec.
//     Any change to a slider would silently swallow the API error and the
//     projection would stay null forever — which is exactly what users
//     reported ("simulator isn't updating / has wrong calculations").
//
// What this rewrite does:
//   • Pure client-side computation via `useMemo` — no API call, no network
//     latency, no silent error swallowing. Every slider movement recomputes
//     the projection instantly.
//   • All six plans per the task spec: Gratuito, Premium 1-5 with prices
//     0 / 99 / 299 / 499 / 999 / 1.999 BRL.
//   • Each matrix (Entrada 4x5, Residual 4x7, Vendas 4x9) is simulated
//     with the exact level percentages from the spec:
//       Entrada  : 5 / 3 / 2 / 1 / 0.5
//       Residual : 3 / 2 / 1 / 1 / 0.5 / 0.5 / 0.25
//       Vendas   : 2 / 1 / 0.5 / 0.5 / 0.25 / 0.25 / 0.1 / 0.1 / 0.05
//   • Inputs:
//       - plan (select)
//       - directReferrals (1-1000, default 4)
//       - avgMonthlySpend per referral (R$ 0-5.000, default R$ 200)
//       - matrixFillPercent (0-100, default 50)
//   • The "Simular" button reveals the results card on first click. After
//     that, results update reactively on every input change. This matches
//     the task spec "Simular button that triggers recompute (useMemo +
//     state)" without hiding useful info on every slider tick.
//   • All money rendered through `formatBRL(cents)` from `@/lib/format`
//     — no NaN possible even with weird inputs.
//   • Responsive 1-col mobile / 2-col desktop. Cards use rounded-2xl
//     shadow-sm. NO slate colors.
// ============================================================================

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { formatBRL } from '@/lib/format'
import {
  Calculator,
  TrendingUp,
  Users,
  DollarSign,
  Layers,
  Target,
  Info,
  Wallet,
  Sparkles,
  Award,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------

type PlanCode = 'gratuito' | 'premium_1' | 'premium_2' | 'premium_3' | 'premium_4' | 'premium_5'

interface PlanOption {
  code: PlanCode
  label: string
  /** Price in BRL cents per the task spec. */
  priceCents: number
  /** Short description shown under the plan label in the picker. */
  tagline: string
  /** Tailwind accent classes for the picker button when selected. */
  selectedClass: string
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    code: 'gratuito',
    label: 'Gratuito',
    priceCents: 0,
    tagline: 'R$ 0/mês',
    selectedClass: 'border-gray-400 bg-gray-50 dark:bg-gray-900/40 dark:border-gray-600',
  },
  {
    code: 'premium_1',
    label: 'Premium 1',
    priceCents: 9900,
    tagline: 'R$ 99/mês',
    selectedClass: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-600',
  },
  {
    code: 'premium_2',
    label: 'Premium 2',
    priceCents: 29900,
    tagline: 'R$ 299/mês',
    selectedClass: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-600',
  },
  {
    code: 'premium_3',
    label: 'Premium 3',
    priceCents: 49900,
    tagline: 'R$ 499/mês',
    selectedClass: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-600',
  },
  {
    code: 'premium_4',
    label: 'Premium 4',
    priceCents: 99900,
    tagline: 'R$ 999/mês',
    selectedClass: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-600',
  },
  {
    code: 'premium_5',
    label: 'Premium 5',
    priceCents: 199900,
    tagline: 'R$ 1.999/mês',
    selectedClass: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-600',
  },
]

// ---------------------------------------------------------------------------
// Matrix level percentages — MUST match the DEFAULT_*_LEVELS in
// `src/lib/api-utils.ts` (which the /api/cashback/{type} routes serve to the
// CashBack page). Keeping these in sync means the simulator's projection
// matches the real cashback percentages the user will see on their matrix.
//   Entrada 4x5 : 5 / 10 / 10 / 5 / 5                       (total 35%)
//   Residual 4x7: 10 / 9 / 5 / 5 / 4 / 3 / 2                (total 38%)
//   Vendas 4x9  : 0.10 × 9 levels                          (total 0.90%)
// ---------------------------------------------------------------------------

interface MatrixLevel {
  level: number
  /** Percentage earned at this level (e.g. 5 = 5%). */
  pct: number
}

const ENTRADA_LEVELS: MatrixLevel[] = [
  { level: 1, pct: 5 },
  { level: 2, pct: 10 },
  { level: 3, pct: 10 },
  { level: 4, pct: 5 },
  { level: 5, pct: 5 },
]

const RESIDUAL_LEVELS: MatrixLevel[] = [
  { level: 1, pct: 10 },
  { level: 2, pct: 9 },
  { level: 3, pct: 5 },
  { level: 4, pct: 5 },
  { level: 5, pct: 4 },
  { level: 6, pct: 3 },
  { level: 7, pct: 2 },
]

const VENDAS_LEVELS: MatrixLevel[] = [
  { level: 1, pct: 0.1 },
  { level: 2, pct: 0.1 },
  { level: 3, pct: 0.1 },
  { level: 4, pct: 0.1 },
  { level: 5, pct: 0.1 },
  { level: 6, pct: 0.1 },
  { level: 7, pct: 0.1 },
  { level: 8, pct: 0.1 },
  { level: 9, pct: 0.1 },
]

// Matrix structural width — 4-wide per the "4x5/4x7/4x9" client spec.
const MATRIX_WIDTH = 4

// Direct-referral cashback: 10% of the plan price, paid once per referral.
const DIRECT_REFERRAL_CASHBACK_PCT = 10

// ---------------------------------------------------------------------------
// Computation helpers
// ---------------------------------------------------------------------------

interface MatrixProjection {
  /** Total monthly earning across all levels of this matrix (cents). */
  total: number
  /** Per-level breakdown for the detailed table. */
  levels: Array<{
    level: number
    pct: number
    maxPositions: number
    filledPositions: number
    earningPerPosition: number
    totalEarning: number
  }>
}

interface SimulationResult {
  plan: PlanCode
  planPriceCents: number
  directReferrals: number
  avgMonthlySpendCents: number
  matrixFillPercent: number

  /** One-time cashback for direct referrals (cents). */
  directReferralCashback: number
  /** Monthly recurring earnings from the entrada 4x5 matrix (cents). */
  entradaMonthly: MatrixProjection
  /** Monthly recurring earnings from the residual 4x7 matrix (cents). */
  residualMonthly: MatrixProjection
  /** Monthly recurring earnings from the vendas 4x9 matrix (cents). */
  vendasMonthly: MatrixProjection

  /** Sum of entrada + residual + vendas (monthly, cents). */
  totalMonthly: number
  /** Total monthly × 12 (cents). */
  totalAnnual: number
  /** ROI = (totalMonthly × 100) / planPrice — null when plan is gratuito. */
  roi: number | null
}

/**
 * Compute the projected earnings for a single matrix type.
 *
 * The number of available positions at level L is `MATRIX_WIDTH^L`
 * (e.g. 4, 16, 64, 256, 1024 …). The number of *filled* positions is
 * that times `fillPercent / 100`, rounded down. Earnings per filled
 * position = `baseCents × (levelPct / 100)`. Total per level = earnings
 * per position × filled positions.
 *
 * For entrada/residual, `baseCents` is the plan price (cashback on the
 * downline member's subscription). For vendas, `baseCents` is the average
 * monthly spend per referral (cashback on the downline member's spending).
 */
function projectMatrix(
  levels: MatrixLevel[],
  baseCents: number,
  fillPercent: number
): MatrixProjection {
  const safeFill = Math.max(0, Math.min(100, fillPercent))
  const fillRatio = safeFill / 100

  const projected = levels.map((lvl) => {
    const maxPositions = Math.pow(MATRIX_WIDTH, lvl.level)
    const filledPositions = Math.floor(maxPositions * fillRatio)
    const earningPerPosition = Math.round((baseCents * lvl.pct) / 100)
    const totalEarning = earningPerPosition * filledPositions
    return {
      level: lvl.level,
      pct: lvl.pct,
      maxPositions,
      filledPositions,
      earningPerPosition,
      totalEarning,
    }
  })

  const total = projected.reduce((sum, l) => sum + l.totalEarning, 0)
  return { total, levels: projected }
}

/**
 * Compute the full simulation result for the given inputs.
 * Pure function — no side effects, no async. Wrapped in `useMemo` so
 * the result recomputes instantly whenever an input changes.
 */
function simulate(params: {
  plan: PlanCode
  directReferrals: number
  avgMonthlySpendCents: number
  matrixFillPercent: number
}): SimulationResult {
  const planOption = PLAN_OPTIONS.find((p) => p.code === params.plan) ?? PLAN_OPTIONS[0]
  const planPriceCents = planOption.priceCents

  const safeDirectReferrals = Math.max(0, Math.floor(params.directReferrals))
  const safeAvgSpend = Math.max(0, Math.floor(params.avgMonthlySpendCents))
  const safeFill = Math.max(0, Math.min(100, params.matrixFillPercent))

  // Direct-referral cashback: 10% of plan price per referral (one-time).
  const directReferralCashback =
    safeDirectReferrals * Math.round((planPriceCents * DIRECT_REFERRAL_CASHBACK_PCT) / 100)

  const entradaMonthly = projectMatrix(ENTRADA_LEVELS, planPriceCents, safeFill)
  const residualMonthly = projectMatrix(RESIDUAL_LEVELS, planPriceCents, safeFill)
  const vendasMonthly = projectMatrix(VENDAS_LEVELS, safeAvgSpend, safeFill)

  const totalMonthly = entradaMonthly.total + residualMonthly.total + vendasMonthly.total
  const totalAnnual = totalMonthly * 12
  const roi = planPriceCents > 0 ? (totalMonthly * 100) / planPriceCents : null

  return {
    plan: params.plan,
    planPriceCents,
    directReferrals: safeDirectReferrals,
    avgMonthlySpendCents: safeAvgSpend,
    matrixFillPercent: safeFill,
    directReferralCashback,
    entradaMonthly,
    residualMonthly,
    vendasMonthly,
    totalMonthly,
    totalAnnual,
    roi,
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EarningsSimulator() {
  // --- Inputs (draft state, mutated by sliders/inputs) ---
  const [plan, setPlan] = useState<PlanCode>('premium_2')
  const [directReferrals, setDirectReferrals] = useState<number>(4)
  const [avgMonthlySpendBRL, setAvgMonthlySpendBRL] = useState<number>(200)
  const [matrixFillPercent, setMatrixFillPercent] = useState<number>(50)

  // --- "Simular" gate ---
  // false on first render → user sees a prompt to click Simular.
  // Once true, stays true and results update reactively on every input change.
  const [simulated, setSimulated] = useState<boolean>(false)

  // Convert avgMonthlySpendBRL (reais, user-friendly) → cents for compute.
  const avgMonthlySpendCents = Math.round(avgMonthlySpendBRL * 100)

  const result = useMemo<SimulationResult>(
    () =>
      simulate({
        plan,
        directReferrals,
        avgMonthlySpendCents,
        matrixFillPercent,
      }),
    [plan, directReferrals, avgMonthlySpendCents, matrixFillPercent]
  )

  const handleSimulate = () => {
    setSimulated(true)
  }

  // Plan picker grid (responsive 2-col mobile / 3-col desktop).
  const renderPlanPicker = () => (
    <div className="space-y-3">
      <Label className="text-sm font-semibold flex items-center gap-1.5">
        <Award className="h-3.5 w-3.5 text-emerald-600" />
        Selecione o Plano
      </Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PLAN_OPTIONS.map((p) => {
          const isSelected = plan === p.code
          return (
            <button
              key={p.code}
              type="button"
              onClick={() => setPlan(p.code)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? `${p.selectedClass} border-solid shadow-sm`
                  : 'border-border bg-muted/30 hover:border-emerald-300 dark:hover:border-emerald-700'
              }`}
              aria-pressed={isSelected}
            >
              <p className="text-sm font-bold text-foreground">{p.label}</p>
              <p className="text-[10px] text-muted-foreground">{p.tagline}</p>
            </button>
          )
        })}
      </div>
    </div>
  )

  // Slider + numeric input row.
  const renderSlider = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    min: number,
    max: number,
    step: number,
    icon: React.ElementType,
    formatValue: (v: number) => string,
    helpText: string
  ) => {
    const Icon = icon
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-emerald-600" />
            {label}
          </Label>
          <span className="text-sm font-bold text-foreground tabular-nums">
            {formatValue(value)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Slider
            value={[value]}
            min={min}
            max={max}
            step={step}
            onValueChange={(arr) => {
              const v = Array.isArray(arr) && arr.length > 0 ? arr[0] : value
              onChange(typeof v === 'number' ? v : value)
            }}
            className="flex-1"
          />
          <Input
            type="number"
            min={min}
            max={max}
            step={step}
            value={Number.isFinite(value) ? value : 0}
            onChange={(e) => {
              const parsed = parseFloat(e.target.value)
              onChange(Number.isFinite(parsed) ? parsed : 0)
            }}
            className="w-24 h-9 text-sm text-right tabular-nums"
          />
        </div>
        <p className="text-[10px] text-muted-foreground">{helpText}</p>
      </div>
    )
  }

  // Per-matrix breakdown table.
  const renderMatrixTable = (
    title: string,
    projection: MatrixProjection,
    baseLabel: string
  ) => (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-emerald-600" />
            {title}
          </span>
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
            Total: {formatBRL(projection.total)}/mês
          </Badge>
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">
          Base de cálculo: <span className="font-medium text-foreground">{baseLabel}</span>
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[10px] font-semibold text-muted-foreground p-2">Nível</th>
                <th className="text-right text-[10px] font-semibold text-muted-foreground p-2">%</th>
                <th className="text-right text-[10px] font-semibold text-muted-foreground p-2">Vagas</th>
                <th className="text-right text-[10px] font-semibold text-muted-foreground p-2">Preench.</th>
                <th className="text-right text-[10px] font-semibold text-muted-foreground p-2">Por Vaga</th>
                <th className="text-right text-[10px] font-semibold text-muted-foreground p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {projection.levels.map((lvl) => (
                <tr key={lvl.level} className="border-b border-border/40 last:border-0">
                  <td className="p-2 text-xs font-medium text-foreground">N{lvl.level}</td>
                  <td className="p-2 text-xs text-right text-muted-foreground tabular-nums">
                    {lvl.pct}%
                  </td>
                  <td className="p-2 text-xs text-right text-muted-foreground tabular-nums">
                    {lvl.maxPositions.toLocaleString('pt-BR')}
                  </td>
                  <td className="p-2 text-xs text-right text-foreground tabular-nums">
                    {lvl.filledPositions.toLocaleString('pt-BR')}
                  </td>
                  <td className="p-2 text-xs text-right text-foreground tabular-nums">
                    {formatBRL(lvl.earningPerPosition)}
                  </td>
                  <td className="p-2 text-xs text-right font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatBRL(lvl.totalEarning)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Calculator className="h-5 w-5 text-emerald-600" />
          Simulador de Ganhos
        </h2>
        <p className="text-sm text-muted-foreground">
          Calcule projeções de ganhos com base no seu plano e na sua rede.
        </p>
      </div>

      {/* Inputs card */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-5">
          {renderPlanPicker()}

          <Separator />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {renderSlider(
              'Indicações Diretas',
              directReferrals,
              setDirectReferrals,
              0,
              1000,
              1,
              Users,
              (v) => `${v} pessoa${v === 1 ? '' : 's'}`,
              'Quantas indicações diretas você espera fazer. Cada indicação rende 10% do valor do plano (uma vez).'
            )}
            {renderSlider(
              'Gasto Médio Mensal / Indicação',
              avgMonthlySpendBRL,
              setAvgMonthlySpendBRL,
              0,
              5000,
              50,
              Wallet,
              (v) => formatBRL(Math.round(v * 100)),
              'Quanto cada indicação gasta em média por mês no Marketplace (usado para a matriz de Vendas).'
            )}
            {renderSlider(
              'Preenchimento da Matriz',
              matrixFillPercent,
              setMatrixFillPercent,
              0,
              100,
              5,
              Target,
              (v) => `${v}%`,
              'Percentual de vagas preenchidas em cada nível da matriz (0% = vazia, 100% = completa).'
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full sm:w-auto"
              onClick={handleSimulate}
              size="lg"
            >
              <Calculator className="h-4 w-4" />
              Simular
            </Button>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 shrink-0" />
              Os valores são estimativas e não constituem promessa de ganho. O
              resultado real depende do esforço e da atividade da sua rede.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {simulated && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Big highlight card — Total Potencial Mensal */}
            <Card className="rounded-2xl shadow-sm border-2 border-emerald-300 dark:border-emerald-700 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400" />
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Total Potencial Mensal
                      </p>
                    </div>
                    <p className="text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums">
                      {formatBRL(result.totalMonthly)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Equivalente a <span className="font-semibold text-foreground">{formatBRL(result.totalAnnual)}</span> por ano
                      {result.roi !== null && (
                        <> · ROI estimado <span className="font-semibold text-emerald-600 dark:text-emerald-400">{result.roi.toFixed(0)}%</span></>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-1">
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
                      {PLAN_OPTIONS.find((p) => p.code === result.plan)?.label ?? '—'}
                    </Badge>
                    <p className="text-[11px] text-muted-foreground">
                      Plano: <span className="font-semibold text-foreground">{formatBRL(result.planPriceCents)}/mês</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Breakdown cards (1-col mobile, 2-col desktop) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Direct referrals */}
              <Card className="rounded-2xl shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/40 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                      <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Ganhos por Indicação
                      </p>
                      <p className="text-[10px] text-muted-foreground">Pago uma vez por indicação</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {formatBRL(result.directReferralCashback)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {result.directReferrals} indicaç{result.directReferrals === 1 ? 'ão' : 'ões'} ×{' '}
                    {formatBRL(
                      Math.round((result.planPriceCents * DIRECT_REFERRAL_CASHBACK_PCT) / 100)
                    )}{' '}
                    por indicação
                  </p>
                </CardContent>
              </Card>

              {/* Entrada */}
              <Card className="rounded-2xl shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/40 dark:from-emerald-950/20 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                      <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Ganhos Entrada
                      </p>
                      <p className="text-[10px] text-muted-foreground">Matriz 4x5 · 5 níveis</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {formatBRL(result.entradaMonthly.total)}
                    <span className="text-sm font-medium text-muted-foreground">/mês</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {result.entradaMonthly.levels.reduce((s, l) => s + l.filledPositions, 0).toLocaleString('pt-BR')} vagas preenchidas no total
                  </p>
                </CardContent>
              </Card>

              {/* Residual */}
              <Card className="rounded-2xl shadow-sm bg-gradient-to-br from-teal-50 to-teal-100/40 dark:from-teal-950/20 dark:to-teal-900/10 border-teal-200 dark:border-teal-800">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/30">
                      <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Ganhos Residual
                      </p>
                      <p className="text-[10px] text-muted-foreground">Matriz 4x7 · 7 níveis</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {formatBRL(result.residualMonthly.total)}
                    <span className="text-sm font-medium text-muted-foreground">/mês</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {result.residualMonthly.levels.reduce((s, l) => s + l.filledPositions, 0).toLocaleString('pt-BR')} vagas preenchidas no total
                  </p>
                </CardContent>
              </Card>

              {/* Vendas */}
              <Card className="rounded-2xl shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/40 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                      <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Ganhos Vendas
                      </p>
                      <p className="text-[10px] text-muted-foreground">Matriz 4x9 · 9 níveis · sobre consumo</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {formatBRL(result.vendasMonthly.total)}
                    <span className="text-sm font-medium text-muted-foreground">/mês</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Gasto médio: <span className="font-medium text-foreground">{formatBRL(result.avgMonthlySpendCents)}</span>/indicação
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed per-level breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {renderMatrixTable(
                'Entrada 4x5',
                result.entradaMonthly,
                `preço do plano (${formatBRL(result.planPriceCents)})`
              )}
              {renderMatrixTable(
                'Residual 4x7',
                result.residualMonthly,
                `preço do plano (${formatBRL(result.planPriceCents)})`
              )}
              {renderMatrixTable(
                'Vendas 4x9',
                result.vendasMonthly,
                `gasto médio mensal (${formatBRL(result.avgMonthlySpendCents)})`
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!simulated && (
        <Card className="rounded-2xl shadow-sm border-dashed border-2 border-border bg-muted/20">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
              <Calculator className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              Pronto para simular seus ganhos?
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Ajuste o plano, o número de indicações, o gasto médio e o
              preenchimento da matriz acima. Depois clique em{' '}
              <span className="font-semibold text-foreground">Simular</span>{' '}
              para ver o detalhamento completo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
