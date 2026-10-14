'use client'

// ─── My Plan — Conquistas tab (Task 15-e redesign) ────────────────────
// Two DB-driven blocks:
//   1. Streak rewards — /api/gamification/streak (same endpoint + shape
//      the Gamification page consumes; "claimed" is derived SERVER-SIDE
//      when currentStreak >= streakDays — that logic is untouched here,
//      this tab only restyles the display as day-badge mini-cards).
//   2. Achievements grid — the existing AchievementsSection component
//      (points/achievements-section.tsx) is reused AS-IS so its
//      /api/achievements loading, user?.id guard and empty states keep
//      working exactly as before.
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useStore } from '@/lib/store'
import { apiFetch } from '@/lib/api'
// ADM-7 — canonical BRL formatter: rewardType 'cashback' renders "+R$ X,XX"
// (amount in cents) and 'points' renders "+X pts". Same rule as the
// gamification page so both screens never diverge.
import { formatBRL } from '@/lib/format'
import { Check, Flame, Star, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { AchievementsSection } from '@/components/newmobility/points/achievements-section'
import type { StreakData } from './myplan-types'

function StreakCardSkeleton() {
  return (
    <Card className="rounded-2xl shadow-sm bg-card border-0" aria-busy="true" aria-label="Carregando sequência de dias">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-500" aria-hidden />
          Sequência de Dias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-24 rounded-xl" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function ConquistasTab() {
  const { user } = useStore()
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [streakLoading, setStreakLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      // Same fail-open as the gamification page: no user → no streak UI.
      setStreakLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await apiFetch<StreakData>(`/gamification/streak?userId=${user.id}`)
        if (!cancelled && data) setStreak(data)
      } catch {
        // Fail-open: keep the section empty instead of blocking the tab.
      } finally {
        if (!cancelled) setStreakLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const rewards = streak?.streakRewards ?? []

  return (
    <div className="space-y-4 sm:space-y-6" aria-label="Conquistas e sequência de dias">
      {/* Streak rewards — day-badge mini-cards */}
      {streakLoading ? (
        <StreakCardSkeleton />
      ) : rewards.length > 0 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-2xl shadow-sm bg-card border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <span className="p-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-500 shrink-0" aria-hidden>
                    <Flame className="h-4 w-4" />
                  </span>
                  Sequência de Dias
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[10px]">
                    <Flame className="h-3 w-3 mr-1" aria-hidden />
                    {streak?.currentStreak ?? 0} dias seguidos
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    <Star className="h-3 w-3 mr-1" aria-hidden />
                    {streak?.totalPoints ?? 0} pts de login
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5"
                role="list"
                aria-label="Recompensas de sequência"
              >
                {rewards.map((reward, i) => (
                  <motion.div
                    key={`${reward.days}-${i}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    role="listitem"
                    className={`relative rounded-xl border p-3 text-center transition-colors ${
                      reward.claimed
                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    {/* Day badge */}
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        reward.claimed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Flame className={`h-3 w-3 mr-1 ${reward.claimed ? 'text-white' : 'text-muted-foreground'}`} aria-hidden />
                      {reward.days} dias
                    </span>
                    {/* Points / cashback reward (ADM-7 formatting rule) */}
                    <p className={`text-sm font-bold mt-1.5 ${reward.claimed ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}>
                      {reward.rewardType === 'cashback'
                        ? `+${formatBRL(reward.amount ?? reward.points ?? 0)}`
                        : `+${reward.amount ?? reward.points ?? 0} pts`}
                    </p>
                    {reward.claimed ? (
                      <p className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                        <Check className="h-3 w-3" aria-hidden />
                        Conquistado
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Mantenha o acesso diário
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      {/* Achievements grid — existing DB-driven component (untouched) */}
      <AchievementsSection />

      {/* Fallback when both blocks are empty */}
      {!streakLoading && rewards.length === 0 && (
        <Card className="rounded-2xl shadow-sm bg-card border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="h-5 w-5 text-muted-foreground/50 shrink-0" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Acompanhe seu progresso diário para desbloquear recompensas de sequência e conquistas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
