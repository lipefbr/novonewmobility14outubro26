// ─── Shared types for the My Plan page redesign (Task 15-e) ──────────
// The page is 100% DB-driven (Tasks 11/14): plans come from /api/plans
// (merged over presentation templates), the cashback ladder + matrix
// dimensions come from /api/cashback/entrada, and the matrix bases /
// per-plan unlock rules come from /api/simulator/config. These types
// describe ONLY the runtime state shapes — no business numbers live here.
import type { LucideIcon } from 'lucide-react'

// Shape of a plan row after mergeApiPlan() (DB fields win over template).
export type MergedPlan = {
  id: string
  code: string
  name: string
  description: string
  price: string
  priceCents: number
  color: string
  cashbackEntrada: string
  cashbackResidual: string
  cashbackSales: string
  popular?: boolean
  features: Array<{ icon: LucideIcon; label: string; included: boolean }>
}

// Shape returned by /api/plans (raw, before merge).
export type ApiPlan = {
  id: string
  code: string
  name: string
  price: number
  priceCents: number
  description: string
  features: string[]
  level: number
  isActive: boolean
  isDefault: boolean
  sortOrder: number
  matrixEntrada: string
  matrixResidual: string
  matrixVendas: string
}

// Per-plan unlock counts (SystemConfig `plan.{code}.cashback_levels_*`).
export type PlanUnlockCounts = { entrada: number; residual: number; vendas: number }

// One plan row from /api/simulator/config.
export type SimConfigPlan = {
  code: string
  label: string
  priceCents: number
  unlocks: PlanUnlockCounts
}

// Aggregated /api/simulator/config state (DB-driven matrix bases +
// level percentages + per-plan unlocks). Null while loading / on error.
export type SimConfigState = {
  plans: SimConfigPlan[]
  entradaLevels: number[]
  residualLevels: number[]
  vendasLevels: number[]
  cbEntradaBaseCents: number
  cbResidualBaseCents: number
  cbVendasBaseCents: number
  directReferralPct: number
}

// One entry of the `levels` array returned by /api/cashback/entrada.
export type EntradaLevelState = {
  level: number
  percentage: number
  maxUsers: number
  currentUsers: number
  earned: number
  fillPercentage: number
  locked: boolean
  unlocked: boolean
}

// Fields of the /api/cashback/entrada response consumed by this page.
export type EntradaDataState = {
  levels: EntradaLevelState[]
  maxUnlockedLevel: number
  matrixWidth: number
  matrixDepth: number
  maxMatrixSize: number
  directChildren: number
  totalEarnedUnlocked: number
}

// Shape returned by /api/gamification/streak (same shape the gamification
// page consumes). `claimed` is derived server-side (currentStreak >= days).
export type StreakReward = {
  days: number
  points: number
  amount: number
  rewardType: 'points' | 'cashback'
  claimed: boolean
}

export type StreakData = {
  currentStreak: number
  longestStreak: number
  totalPoints: number
  streakRewards: StreakReward[]
}

// The 4 internal tabs of the redesigned page.
export type MyPlanTab = 'meu-plano' | 'simulador' | 'rede' | 'conquistas'
