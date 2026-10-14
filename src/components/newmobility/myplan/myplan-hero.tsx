'use client'

// ─── My Plan HERO (Task 15-e) ─────────────────────────────────────────
// Gradient hero card (emerald-500 → teal-600) that summarizes the
// member's plan. ALL values are DB-driven state passed by myplan-page:
//   • plan name/price        → /api/plans (merged over FALLBACK_PLANS)
//   • status badge           → user.isActive + unpaid plan-invoice check
//   • matrix size / directs  → /api/cashback/entrada (MatrixType width/depth)
//   • cashback ladder        → /api/cashback/entrada levels (L1-L5 %)
//   • monthly income         → real cashback transactions of the current
//                              month (financialApi.getTransactions)
// Shows a skeleton while the fetches resolve (same loading pattern as
// the rest of the app). No hardcoded business numbers.
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import {
  ArrowUpRight, Calendar, Check, CreditCard, Lock, Network,
  Trophy, Users, Wallet,
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { EntradaDataState, MergedPlan } from './myplan-types'

type MyPlanHeroProps = {
  loading: boolean
  plan?: MergedPlan
  isActive: boolean
  hasUnpaidInvoice: boolean
  careerRankName: string
  nextBillingDate: string
  /** Real cashback earned in the current month (cents) — null while loading. */
  monthEarnings: number | null
  /** /api/cashback/entrada state (levels, matrixWidth/Depth, etc.). */
  entrada?: EntradaDataState | null
  /** Fallback percentages from /api/simulator/config when the entrada API fails. */
  fallbackPercentages?: number[]
  showUpgrade: boolean
  upgradeLabel: string
  onUpgrade: () => void
}

function StatusBadge({ isActive, hasUnpaidInvoice }: { isActive: boolean; hasUnpaidInvoice: boolean }) {
  if (hasUnpaidInvoice) {
    return (
      <Badge className="bg-amber-400/95 text-amber-950 border-0 shadow-sm">
        <Calendar className="h-3 w-3 mr-1" aria-hidden />
        Pendente — fatura em aberto
      </Badge>
    )
  }
  if (isActive) {
    return (
      <Badge className="bg-white/20 text-white border border-white/30 backdrop-blur-sm">
        <Check className="h-3 w-3 mr-1" aria-hidden />
        Ativo
      </Badge>
    )
  }
  return (
    <Badge className="bg-white/10 text-white/90 border border-white/20 backdrop-blur-sm">
      Pendente
    </Badge>
  )
}

// Compact L1-L5 cashback percentage badges. Locked levels show a lock
// icon and reduced opacity (data from /api/cashback/entrada; the
// fallback percentages have no lock info so they render unlocked).
function CashbackLadderBadges({
  entrada,
  fallbackPercentages,
}: {
  entrada?: EntradaDataState | null
  fallbackPercentages?: number[]
}) {
  if (entrada?.levels && entrada.levels.length > 0) {
    return (
      <>
        {entrada.levels.map((lvl) => (
          <span
            key={lvl.level}
            title={
              lvl.locked
                ? `Nível ${lvl.level} bloqueado — faça upgrade para liberar`
                : `Nível ${lvl.level}: ${lvl.percentage}% de cashback`
            }
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
              lvl.locked
                ? 'bg-black/15 text-white/60 border-white/10'
                : 'bg-white/15 text-white border-white/25'
            }`}
          >
            {lvl.locked ? (
              <Lock className="h-2.5 w-2.5" aria-hidden />
            ) : (
              <span className="font-bold" aria-hidden>L{lvl.level}</span>
            )}
            {lvl.percentage}%
          </span>
        ))}
      </>
    )
  }
  if (fallbackPercentages && fallbackPercentages.length > 0) {
    return (
      <>
        {fallbackPercentages.map((pct, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-white/15 text-white border border-white/25"
          >
            <span className="font-bold" aria-hidden>L{i + 1}</span>
            {pct}%
          </span>
        ))}
      </>
    )
  }
  return null
}

function HeroChip({ icon: Icon, children }: { icon: typeof Users; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-2.5 py-1 text-[11px] font-medium text-white/95">
      <Icon className="h-3 w-3" aria-hidden />
      {children}
    </span>
  )
}

export function MyPlanHeroSkeleton() {
  return (
    <div
      className="rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10 p-4 sm:p-6 space-y-4"
      aria-busy="true"
      aria-label="Carregando resumo do plano"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-52" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-32 rounded-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-16 rounded-full" />
        ))}
      </div>
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>
    </div>
  )
}

export function MyPlanHero({
  loading,
  plan,
  isActive,
  hasUnpaidInvoice,
  careerRankName,
  nextBillingDate,
  monthEarnings,
  entrada,
  fallbackPercentages,
  showUpgrade,
  upgradeLabel,
  onUpgrade,
}: MyPlanHeroProps) {
  if (loading) {
    return <MyPlanHeroSkeleton />
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label="Resumo do meu plano"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-600 shadow-sm">
        {/* Decorative soft circles */}
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/10" aria-hidden />
        <div className="absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-teal-300/20" aria-hidden />

        <div className="relative p-4 sm:p-6 text-white">
          {/* Top row: label + status */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-white/15 border border-white/20" aria-hidden>
                  <CreditCard className="h-3.5 w-3.5" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-50/90">
                  Plano Atual
                </span>
              </div>
              <h2 className="mt-1.5 text-xl sm:text-2xl font-bold leading-tight truncate">
                {plan?.name ?? '—'}
              </h2>
              <p className="text-emerald-50/95 text-base font-semibold mt-0.5">
                {plan?.price ?? '—'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge isActive={isActive} hasUnpaidInvoice={hasUnpaidInvoice} />
              {showUpgrade && (
                <Button
                  size="sm"
                  className="mt-1 bg-white text-emerald-700 hover:bg-emerald-50 gap-1 min-h-[36px] shadow-sm"
                  onClick={onUpgrade}
                  aria-label={upgradeLabel}
                >
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                  {upgradeLabel}
                </Button>
              )}
            </div>
          </div>

          {/* Chips: matrix size + max directs + graduação */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {entrada && entrada.matrixWidth > 0 && (
              <HeroChip icon={Network}>
                Matriz {entrada.matrixWidth}×{entrada.matrixDepth}
              </HeroChip>
            )}
            {entrada && entrada.matrixWidth > 0 && (
              <HeroChip icon={Users}>
                Até {entrada.matrixWidth} diretos por posição
              </HeroChip>
            )}
            <HeroChip icon={Trophy}>Graduação: {careerRankName}</HeroChip>
          </div>

          {/* Cashback ladder L1-L5 */}
          <div
            className="flex flex-wrap items-center gap-1.5 mt-3"
            role="list"
            aria-label="Níveis de cashback do plano"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-50/80 mr-1">
              Cashback entrada:
            </span>
            <CashbackLadderBadges entrada={entrada} fallbackPercentages={fallbackPercentages} />
          </div>

          {/* Bottom row: monthly income + next billing */}
          <div className="mt-4 pt-3.5 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1.5 rounded-lg bg-white/15 border border-white/20 shrink-0" aria-hidden>
                <Wallet className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-emerald-50/80 font-semibold">
                  Ganhos no mês
                </p>
                <p className="text-sm sm:text-base font-bold tabular-nums">
                  {monthEarnings === null ? (
                    <span className="inline-block h-4 w-24 rounded bg-white/20 align-middle" aria-label="Carregando ganhos do mês" />
                  ) : (
                    formatCurrency(monthEarnings)
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-50/90">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              <span>
                Próxima cobrança: <strong className="text-white">{nextBillingDate}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
