'use client'

// ─── My Plan QUICK ACTIONS (Task 15-e) ────────────────────────────────
// Prominent action row below the hero. Buttons wire to the page's
// EXISTING internal tab state / dialogs — no new navigation keys:
//   • "Simular Ganhos"  → switches to the Simulador tab
//   • "Ver Minha Rede"  → switches to the Rede tab
//   • "Fazer Upgrade"   → opens the existing upgrade dialog flow (or
//                         scrolls to the upgrade section when the user
//                         is already on the top plan)
// 44px+ touch targets, ARIA labels on the icon-only affordances.
import { Calculator, ChevronRight, Network, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type QuickAction = {
  key: string
  label: string
  description: string
  icon: LucideIcon
  onClick: () => void
  ariaLabel: string
}

export function MyPlanQuickActions({
  onSimulate,
  onNetwork,
  onUpgrade,
  upgradeLabel,
}: {
  onSimulate: () => void
  onNetwork: () => void
  onUpgrade: () => void
  upgradeLabel: string
}) {
  const actions: QuickAction[] = [
    {
      key: 'simulate',
      label: 'Simular Ganhos',
      description: 'Projete seus rendimentos na matriz',
      icon: Calculator,
      onClick: onSimulate,
      ariaLabel: 'Abrir simulador de ganhos',
    },
    {
      key: 'network',
      label: 'Ver Minha Rede',
      description: 'Acompanhe sua downline e matrizes',
      icon: Network,
      onClick: onNetwork,
      ariaLabel: 'Abrir minha rede',
    },
    {
      key: 'upgrade',
      label: 'Fazer Upgrade',
      description: upgradeLabel,
      icon: Sparkles,
      onClick: onUpgrade,
      ariaLabel: `Fazer upgrade de plano — ${upgradeLabel}`,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="group" aria-label="Ações rápidas do plano">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            aria-label={action.ariaLabel}
            className="group flex min-h-[44px] items-center gap-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-card p-3.5 text-left shadow-sm transition-all duration-200 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
          >
            <span
              className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shrink-0 transition-transform duration-200 group-hover:scale-105"
              aria-hidden
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-foreground leading-tight">
                {action.label}
              </span>
              <span className="block text-xs text-muted-foreground truncate">
                {action.description}
              </span>
            </span>
            <ChevronRight
              className="h-4 w-4 text-muted-foreground/50 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-emerald-600"
              aria-hidden
            />
          </button>
        )
      })}
    </div>
  )
}
