'use client'

// ─── My Plan — "Meu Plano" tab sections (Task 15-e redesign) ──────────
// Presentational sections reorganized per the redesign spec:
//   (a) Plano Atual          — benefits list w/ check icons (DB-driven)
//   (b) Cashback por Nível   — visual ladder/progress (/api/cashback/entrada)
//   (c) Níveis da Matriz     — unlock chips (SystemConfig unlock rules via API)
//   (d) Bases da Matriz      — 3 stat cards (/api/simulator/config bases)
//   (e) Sugestão de Upgrade  — next plan by price (DB-driven)
// Plus the Blue 3 → Premium 5 special upgrade card, whose payment flows
// (wallet deduction / PIX) are preserved exactly as they were — only the
// palette was normalized to emerald/teal.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency } from '@/lib/utils'
import {
  ArrowUpRight, BadgeCheck, Calendar, Car, Check, Layers, Lock,
  Loader2, Network, Percent, ShieldCheck, ShoppingBag, Smartphone,
  Sparkles, TrendingUp, Wallet, Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type {
  EntradaLevelState, MergedPlan, PlanUnlockCounts, SimConfigState,
} from './myplan-types'

// ─── Shared section header ────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
  badge,
  action,
}: {
  icon: LucideIcon
  title: string
  badge?: string
  action?: React.ReactNode
}) {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
          <span
            className="p-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 shrink-0"
            aria-hidden
          >
            <Icon className="h-4 w-4" />
          </span>
          {title}
          {badge && (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-[10px]">
              {badge}
            </Badge>
          )}
        </CardTitle>
        {action}
      </div>
    </CardHeader>
  )
}

// ─── (a) Plano Atual ──────────────────────────────────────────────────
export function PlanBenefitsSection({
  plan,
  nextBillingDate,
  autoDebitEnabled,
  autoDebitSaving,
  onToggleAutoDebit,
}: {
  plan?: MergedPlan
  nextBillingDate: string
  autoDebitEnabled: boolean
  autoDebitSaving: boolean
  onToggleAutoDebit: (checked: boolean) => void
}) {
  if (!plan) return null
  const included = plan.features.filter((f) => f.included)
  const excluded = plan.features.filter((f) => !f.included)

  return (
    <Card className="rounded-2xl shadow-sm bg-card border-0">
      <SectionHeader
        icon={BadgeCheck}
        title="Plano Atual"
        badge={plan.name}
        action={
          <p className="text-right">
            <span className="block text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
              Mensalidade
            </span>
            <span className="block text-lg font-bold text-foreground leading-tight">
              {formatCurrency(plan.priceCents)}
            </span>
          </p>
        }
      />
      <CardContent className="space-y-4">
        {plan.description && (
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        )}

        {/* Benefits — DB-driven feature list, included first */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Benefícios inclusos
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {included.map((feature, i) => {
              const Icon = feature.icon
              return (
                <li
                  key={`inc-${i}`}
                  className="flex items-center gap-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-2.5 min-h-[44px]"
                >
                  <span
                    className="p-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0"
                    aria-hidden
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{feature.label}</span>
                  <Check className="h-4 w-4 text-emerald-500 ml-auto shrink-0" aria-label="Incluído" />
                </li>
              )
            })}
          </ul>
          {excluded.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide mb-2">
                Não incluso no seu plano
              </p>
              <div className="flex flex-wrap gap-1.5">
                {excluded.map((feature, i) => {
                  const Icon = feature.icon
                  return (
                    <span
                      key={`exc-${i}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground"
                    >
                      <Icon className="h-3 w-3" aria-hidden />
                      {feature.label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Billing footer: próxima cobrança + débito automático (existing logic) */}
        <div className="pt-3.5 border-t border-border flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
            Próxima cobrança: <strong className="text-foreground">{nextBillingDate}</strong>
          </div>

          {/* ─── Auto-debit opt-in (Task 13-B §4) — logic preserved ── */}
          <label
            htmlFor="auto-debit-toggle"
            className="flex items-start gap-3 cursor-pointer rounded-xl border border-border bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              id="auto-debit-toggle"
              checked={autoDebitEnabled}
              onCheckedChange={(v) => onToggleAutoDebit(Boolean(v))}
              disabled={autoDebitSaving}
              className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
            />
            <span className="flex-1">
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                Autorizar débito automático
                {autoDebitSaving && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden />
                )}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5 block">
                Se possuir saldo, a mensalidade será descontada automaticamente. Caso não tenha
                saldo, você poderá transferir de outro saldo interno para pagar.
              </span>
            </span>
          </label>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── (b) Cashback por Nível — visual ladder ──────────────────────────
export function CashbackLadderSection({
  levels,
  fallbackPercentages,
  loading,
}: {
  levels?: EntradaLevelState[]
  fallbackPercentages?: number[]
  loading: boolean
}) {
  return (
    <Card className="rounded-2xl shadow-sm bg-card border-0">
      <SectionHeader
        icon={Percent}
        title="Cashback por Nível"
        badge="Matriz de Entrada"
      />
      <CardContent>
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Carregando níveis de cashback">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-7 w-12 rounded-lg" />
                <Skeleton className="h-2.5 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : levels && levels.length > 0 ? (
          <ol className="space-y-2.5" aria-label="Escada de cashback por nível">
            {levels.map((lvl) => (
              <li
                key={lvl.level}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                  lvl.locked
                    ? 'border-border bg-muted/30'
                    : 'border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20'
                )}
              >
                {/* Level chip */}
                <span
                  className={cn(
                    'inline-flex min-w-[46px] items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-bold shrink-0',
                    lvl.locked
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                  )}
                >
                  {lvl.locked && <Lock className="h-3 w-3" aria-hidden />}
                  L{lvl.level}
                </span>

                {/* Percentage + progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 text-xs mb-1">
                    <span className={cn('font-bold', lvl.locked ? 'text-muted-foreground' : 'text-emerald-700 dark:text-emerald-400')}>
                      {lvl.percentage}% de cashback
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {lvl.currentUsers}/{lvl.maxUsers} posições
                    </span>
                  </div>
                  <Progress
                    value={lvl.fillPercentage}
                    className="h-1.5"
                    aria-label={`Nível ${lvl.level}: ${lvl.fillPercentage.toFixed(0)}% ocupado`}
                  />
                </div>

                {/* Real earned (forced 0 by the API for locked levels) */}
                <span className="text-right shrink-0 min-w-[72px]">
                  <span className="block text-[10px] text-muted-foreground">recebido</span>
                  <span className={cn('block text-sm font-bold tabular-nums', lvl.locked ? 'text-muted-foreground' : 'text-foreground')}>
                    {formatCurrency(lvl.earned)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        ) : fallbackPercentages && fallbackPercentages.length > 0 ? (
          // /api/cashback/entrada failed — degrade to the DB-driven
          // percentages from /api/simulator/config (no fill/earned data).
          <div className="flex flex-wrap gap-2" aria-label="Percentuais de cashback por nível">
            {fallbackPercentages.map((pct, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
              >
                <span className="font-bold" aria-hidden>L{i + 1}</span>
                {pct}%
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Não foi possível carregar os níveis de cashback agora. Tente recarregar a página.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── (c) Níveis da Matriz desbloqueados — unlock chips ───────────────
export function MatrixLevelsSection({
  maxUnlockedLevel,
  unlocks,
  loading,
}: {
  /** Unlock ceiling from /api/cashback/entrada (SystemConfig per-plan rule). */
  maxUnlockedLevel?: number
  /** Current plan unlock counts from /api/simulator/config. */
  unlocks?: PlanUnlockCounts
  loading: boolean
}) {
  const entradaUnlocked = maxUnlockedLevel ?? unlocks?.entrada
  return (
    <Card className="rounded-2xl shadow-sm bg-card border-0">
      <SectionHeader icon={Layers} title="Níveis da Matriz" badge="Desbloqueados" />
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex flex-wrap gap-2" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Entrada L1-L5 unlock chips — visual LEVEL_UNLOCK_RULES from state */}
            <div className="flex flex-wrap gap-2" role="list" aria-label="Níveis de entrada desbloqueados">
              {Array.from({ length: 5 }).map((_, i) => {
                const level = i + 1
                const unlocked = typeof entradaUnlocked === 'number' && level <= entradaUnlocked
                return (
                  <span
                    key={level}
                    role="listitem"
                    title={
                      unlocked
                        ? `Nível ${level} desbloqueado`
                        : `Nível ${level} bloqueado — libere com upgrade de plano`
                    }
                    className={cn(
                      'inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors',
                      unlocked
                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                        : 'border-border bg-muted/40 text-muted-foreground'
                    )}
                  >
                    {unlocked ? (
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Lock className="h-3.5 w-3.5" aria-hidden />
                    )}
                    Nível {level}
                  </span>
                )
              })}
            </div>

            {/* Residual / Vendas unlock counts for the current plan */}
            {unlocks && (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    <TrendingUp className="h-3 w-3" aria-hidden />
                    Residual
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {unlocks.residual > 0 ? `${unlocks.residual} níveis liberados` : 'Bloqueado'}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    <ShoppingBag className="h-3 w-3" aria-hidden />
                    Vendas
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {unlocks.vendas > 0 ? `${unlocks.vendas} níveis liberados` : 'Bloqueado'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── (d) Bases da Matriz — 3 small stat cards ────────────────────────
export function MatrixBasesSection({
  simConfig,
  unlocks,
  loading,
}: {
  simConfig?: SimConfigState | null
  unlocks?: PlanUnlockCounts
  loading: boolean
}) {
  const bases: Array<{ key: string; label: string; icon: LucideIcon; base?: number; levels?: number }> = [
    { key: 'entrada', label: 'Entrada', icon: Car, base: simConfig?.cbEntradaBaseCents, levels: unlocks?.entrada },
    { key: 'residual', label: 'Residual', icon: TrendingUp, base: simConfig?.cbResidualBaseCents, levels: unlocks?.residual },
    { key: 'vendas', label: 'Vendas', icon: ShoppingBag, base: simConfig?.cbVendasBaseCents, levels: unlocks?.vendas },
  ]

  return (
    <Card className="rounded-2xl shadow-sm bg-card border-0">
      <SectionHeader icon={Network} title="Bases da Matriz" />
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-busy="true">
            {bases.map((b) => (
              <Skeleton key={b.key} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {bases.map((b) => {
              const Icon = b.icon
              return (
                <div
                  key={b.key}
                  className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/10 p-3.5"
                >
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    <Icon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    {b.label}
                  </p>
                  <p className="text-lg font-bold text-foreground mt-1 tabular-nums leading-tight">
                    {typeof b.base === 'number' ? formatCurrency(b.base) : '—'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Base de cashback
                    {typeof b.levels === 'number' && b.levels > 0 ? ` · ${b.levels} níveis` : ''}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── (e) Sugestão de Upgrade — next plan by price (DB-driven) ────────
export function UpgradeSuggestionSection({
  plans,
  currentPlanId,
  onSelect,
}: {
  plans: MergedPlan[]
  currentPlanId: string
  onSelect: (planId: string) => void
}) {
  const current = plans.find((p) => p.id === currentPlanId)
  const next = plans
    .filter((p) => p.id !== currentPlanId && p.priceCents > (current?.priceCents ?? 0))
    .sort((a, b) => a.priceCents - b.priceCents)[0]

  return (
    <Card className="rounded-2xl shadow-sm bg-card border-0" id="plan-upgrade-section">
      <SectionHeader
        icon={Sparkles}
        title="Sugestão de Upgrade"
        badge={next ? 'Próximo plano' : 'Completo'}
      />
      <CardContent>
        {!next ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
            <span className="p-2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden>
              <BadgeCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">Você já está no plano mais completo</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aproveite todos os benefícios do {current?.name ?? 'seu plano'} e acompanhe seus ganhos.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/10 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('inline-block bg-gradient-to-r text-white px-3 py-1 rounded-lg text-sm font-bold', next.color)}>
                    {next.name}
                  </span>
                  <span className="text-sm font-bold text-foreground">{next.price}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {next.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {next.features
                    .filter((f) => f.included && !current?.features.find((cf) => cf.label === f.label && cf.included))
                    .slice(0, 4)
                    .map((f, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-black/20 border border-emerald-100 dark:border-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400"
                      >
                        <Check className="h-2.5 w-2.5" aria-hidden />
                        {f.label}
                      </span>
                    ))}
                </div>
              </div>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 min-h-[44px] shrink-0"
                onClick={() => onSelect(next.id)}
                aria-label={`Fazer upgrade para o plano ${next.name}`}
              >
                <ArrowUpRight className="h-4 w-4" aria-hidden />
                Ver Upgrade
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Blue 3 → Premium 5 upgrade card (special payment flows) ─────────
// Content/logic preserved from the previous layout (Índice.docx §3);
// only the visual container changed. The two payment paths (automatic
// wallet deduction via openPremium5Dialog and manual PIX via
// handlePremium5Manual) are the ONLY entry points to those APIs, so
// they must keep working exactly as before.
export function Premium5UpgradeCard({
  onOpenAutomaticDialog,
  onPayPix,
  processing,
}: {
  onOpenAutomaticDialog: () => void
  onPayPix: () => void
  processing: boolean
}) {
  return (
    <Card className="rounded-2xl shadow-sm bg-card border-0 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-500" aria-hidden />
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0" aria-hidden>
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Fazer Upgrade para Premium 5 — R$ 850,00
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Desbloqueie os níveis 4 e 5 da matriz Entrada e potencialize seus ganhos.
            </p>
          </div>
          <Badge className="bg-amber-500 text-white border-0 shrink-0">Premium 5</Badge>
        </div>

        {/* Two payment paths */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-emerald-600" aria-hidden />
              <p className="text-sm font-bold text-foreground">Descontar Automaticamente</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Debita R$ 850,00 da carteira escolhida e ativa o upgrade imediatamente.
            </p>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1 min-h-[44px]"
              onClick={onOpenAutomaticDialog}
            >
              <Zap className="h-4 w-4" aria-hidden />
              Descontar Fatura Automática
            </Button>
          </div>

          <div className="rounded-xl p-4 border border-teal-100 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/20">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-4 w-4 text-teal-600" aria-hidden />
              <p className="text-sm font-bold text-foreground">Pagar via PIX</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Gere uma fatura de R$ 850,00 e pague via PIX. Ativação após confirmação.
            </p>
            <Button
              variant="outline"
              className="w-full border-teal-500 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30 gap-1 min-h-[44px]"
              onClick={onPayPix}
              disabled={processing}
            >
              <Smartphone className="h-4 w-4" aria-hidden />
              Pagar via PIX
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground mt-3 flex items-start gap-1.5">
          <ShieldCheck className="h-3 w-3 shrink-0 mt-0.5" aria-hidden />
          Após o upgrade, apenas a mensalidade recorrente de R$ 999,90 permanece no backoffice.
        </p>
      </CardContent>
    </Card>
  )
}
