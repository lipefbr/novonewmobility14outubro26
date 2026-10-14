import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
// Task 15-f — o catálogo estático (STATIC_FALLBACK_GRATIFICATIONS) e a
// montagem com overlay das edições do admin (Task 13-e) foram movidos para
// src/lib/gratification-catalog.ts, fonte única compartilhada com o claim
// (que precisa resolver ids sintéticos `catalog_<type>_<idx>` do front).
import { getCatalogGratifications } from '@/lib/gratification-catalog'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return error('userId is required')
    }

    const user = await db.findOne('User', '"id" = $1', [userId])

    if (!user) {
      return error('User not found', 404)
    }

    const gratifications = await db.find(
      'Gratification',
      '"userId" = $1',
      [userId],
      'ORDER BY "createdAt" DESC'
    ) as any[]

    const available = gratifications.filter((g) => !g.isClaimed)
    const claimed = gratifications.filter((g) => g.isClaimed)

    // BACK-7 — driver goals are gated by qualification.
    //
    // The admin sets a single config row (type='driver_goals_config') whose
    // `targetQualification` is one of:
    //   - 'motorista'  → only motoristas see the card
    //   - 'entregador' → only entregadores see the card
    //   - 'ambos'      → motoristas AND entregadores see the card
    //
    // The user must ALSO have either:
    //   - user.qualification matching the configured target, OR
    //   - the isDriver / isDelivery boolean flag set (legacy/manual override).
    //
    // When the user is not eligible, we return `driverGoals: null` so the UI
    // can hide the card. When they ARE eligible, we compute progress from
    // user.totalRides (we don't track per-day rides separately, so we use a
    // reasonable fraction of totalRides for the daily counter).
    const configRow = await db.findOne(
      'Gratification',
      '"type" = $1',
      ['driver_goals_config']
    ) as any

    const targetQualification: string = configRow?.targetQualification || 'ambos'

    const userQualification: string = (user as any)?.qualification || ''
    const userIsDriver: boolean = Boolean((user as any)?.isDriver)
    const userIsDelivery: boolean = Boolean((user as any)?.isDelivery)
    const totalRides: number = (user as any)?.totalRides || 0

    const matchesQualification =
      targetQualification === 'ambos'
        ? userQualification === 'motorista' || userQualification === 'entregador'
        : userQualification === targetQualification

    const isEligibleForDriverGoals =
      matchesQualification || userIsDriver || userIsDelivery

    // Compute driver goal-tracking info (per client spec §6):
    //   - Daily ride goal: 18 rides/day
    //   - Monthly ride goal: 384 rides/month (18 × ~21 dias úteis)
    // We don't track per-day rides in a separate table yet, so daily rides
    // is estimated as a fraction of totalRides (rolling window). The monthly
    // counter uses totalRides directly capped at the monthly goal.
    const DAILY_GOAL = 18
    const MONTHLY_GOAL = 384
    const dailyRides = Math.min(totalRides % DAILY_GOAL, DAILY_GOAL)
    const monthlyRides = Math.min(totalRides, MONTHLY_GOAL)

    const driverGoals = isEligibleForDriverGoals
      ? {
          dailyGoal: DAILY_GOAL,
          monthlyGoal: MONTHLY_GOAL,
          dailyRides,
          monthlyRides,
          dailyGoalReached: dailyRides >= DAILY_GOAL,
          monthlyGoalReached: monthlyRides >= MONTHLY_GOAL,
        }
      : null

    // Task 13-e/15-f — catálogo estático + overlay das edições do admin
    // (nome/valor/descrição REAL configurado, não mais o seed antigo),
    // agora via fonte única em src/lib/gratification-catalog.ts.
    const catalog = await getCatalogGratifications()

    return success({
      available,
      claimed,
      totalEarned: gratifications.reduce((sum, g) => sum + g.amount, 0),
      totalClaimed: claimed.reduce((sum, g) => sum + g.amount, 0),
      // Static catalog — always returned so the UI can show the full
      // gratification catalog (fuel voucher, car wash, vacations, driver
      // goals, cashback prize) even when no per-user rows exist yet.
      // Task 13-e — agora com o overlay das edições do admin aplicado.
      catalog,
      driverGoals,
    })
  } catch (err) {
    console.error('Gratifications error:', err)
    return error('Internal server error', 500)
  }
}
