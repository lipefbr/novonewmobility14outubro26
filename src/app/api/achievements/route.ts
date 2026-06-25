import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// GET /api/achievements?userId=X
// Public endpoint: any logged-in user can read the list of active achievements
// with their progress/unlock status computed from the user's stats.
//
// Response shape:
// {
//   achievements: [
//     {
//       id, code, name, description, icon, category, rarity,
//       pointsReward, targetValue, progress, earned, earnedDate, sortOrder
//     }
//   ],
//   summary: { earned: number, total: number, completionPct: number, points: number }
// }

interface RawAchievement {
  id: string
  code: string
  name: string
  description: string | null
  icon: string | null
  category: string
  pointsReward: number
  targetValue: number
  isActive: boolean
  sortOrder: number
}

interface UserStats {
  referralsCount: number
  cashbackTotalCents: number
  withdrawalsCount: number
  voucherCount: number
  planUpgradeCount: number
  longestStreak: number
  betsCount: number
  marketplaceOrdersCount: number
  ridesCount: number
  careerPoints: number
  monthsActive: number
  securityFeaturesEnabled: number
  createdAt: Date | null
}

// Fallback list used when the Achievement table is empty (e.g. before task 7-d
// seeds the admin-managed achievements). Matches the previous hardcoded UI list.
const FALLBACK_ACHIEVEMENTS: RawAchievement[] = [
  { id: 'fb_first_referral', code: 'first_referral', name: 'Primeira Indicação', description: 'Faça sua primeira indicação ativa', icon: 'Users', category: 'referral', pointsReward: 1, targetValue: 1, isActive: true, sortOrder: 1 },
  { id: 'fb_ten_referrals', code: 'ten_referrals', name: '10 Indicações', description: 'Conquiste 10 indicações ativas', icon: 'Users', category: 'referral', pointsReward: 5, targetValue: 10, isActive: true, sortOrder: 2 },
  { id: 'fb_fifty_referrals', code: 'fifty_referrals', name: '50 Indicações', description: 'Conquiste 50 indicações ativas', icon: 'Crown', category: 'referral', pointsReward: 25, targetValue: 50, isActive: true, sortOrder: 3 },
  { id: 'fb_cashback_1000', code: 'cashback_1000', name: 'R$ 1.000 em CashBack', description: 'Acumule R$ 1.000 em CashBack', icon: 'DollarSign', category: 'financial', pointsReward: 10, targetValue: 100000, isActive: true, sortOrder: 4 },
  { id: 'fb_cashback_5000', code: 'cashback_5000', name: 'R$ 5.000 em CashBack', description: 'Acumule R$ 5.000 em CashBack', icon: 'DollarSign', category: 'financial', pointsReward: 50, targetValue: 500000, isActive: true, sortOrder: 5 },
  { id: 'fb_first_withdrawal', code: 'first_withdrawal', name: 'Primeiro Saque', description: 'Solicite seu primeiro saque', icon: 'ArrowDownToLine', category: 'financial', pointsReward: 2, targetValue: 1, isActive: true, sortOrder: 6 },
  { id: 'fb_weekly_active', code: 'weekly_active', name: 'Ativo por 4 Semanas', description: 'Seja ativo por 4 semanas consecutivas', icon: 'Flame', category: 'engagement', pointsReward: 5, targetValue: 4, isActive: true, sortOrder: 7 },
  { id: 'fb_first_voucher', code: 'first_voucher', name: 'Primeiro Voucher', description: 'Compre seu primeiro voucher', icon: 'Gift', category: 'engagement', pointsReward: 2, targetValue: 1, isActive: true, sortOrder: 8 },
  { id: 'fb_plan_upgrade', code: 'plan_upgrade', name: 'Upgrade de Plano', description: 'Faça upgrade do seu plano', icon: 'Zap', category: 'milestone', pointsReward: 5, targetValue: 1, isActive: true, sortOrder: 9 },
  { id: 'fb_network_builder', code: 'network_builder', name: 'Construtor de Rede', description: 'Tenha 25 membros na rede', icon: 'Target', category: 'referral', pointsReward: 20, targetValue: 25, isActive: true, sortOrder: 10 },
  { id: 'fb_top_earner', code: 'top_earner', name: 'Top Ganheiro', description: 'Alcance 100 pontos de carreira', icon: 'Trophy', category: 'financial', pointsReward: 30, targetValue: 100, isActive: true, sortOrder: 11 },
  { id: 'fb_security_master', code: 'security_master', name: 'Mestre da Segurança', description: 'Complete 3 ações de segurança', icon: 'Shield', category: 'engagement', pointsReward: 15, targetValue: 3, isActive: true, sortOrder: 12 },
  { id: 'fb_career_bronze', code: 'career_bronze', name: 'Carreira Bronze', description: 'Alcance o rank Bronze na carreira', icon: 'Award', category: 'milestone', pointsReward: 10, targetValue: 50, isActive: true, sortOrder: 13 },
  { id: 'fb_loyalty_1year', code: 'loyalty_1year', name: '1 Ano de Fidelidade', description: 'Seja membro por 12 meses', icon: 'Star', category: 'milestone', pointsReward: 20, targetValue: 12, isActive: true, sortOrder: 14 },
]

function deriveRarity(targetValue: number): 'common' | 'rare' | 'epic' | 'legendary' {
  if (targetValue > 100) return 'legendary'
  if (targetValue > 10) return 'epic'
  if (targetValue > 1) return 'rare'
  return 'common'
}

function monthsSince(date: Date): number {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.floor(days / 30)
}

// Map an achievement code to the user's current progress value.
// Uses substring matching to handle both snake_case and numeric-prefix variants
// (e.g. "ten_referrals" vs "10_referrals" vs "100_referrals").
function progressForCode(code: string, stats: UserStats): number {
  const c = code.toLowerCase()
  // Order matters: more specific checks first.
  if (c.includes('cashback')) return stats.cashbackTotalCents
  if (c.includes('withdraw') || c.includes('saque')) return stats.withdrawalsCount
  if (c.includes('voucher')) return stats.voucherCount
  if (c.includes('plan_upgrade') || c.includes('upgrade') || c.includes('plan'))
    return stats.planUpgradeCount
  if (c.includes('marketplace') || c.includes('purchase') || c.includes('compra'))
    return stats.marketplaceOrdersCount
  if (c.includes('ride') || c.includes('corrida')) return stats.ridesCount
  if (c.includes('bet_streak') || c.includes('login_streak') || c.includes('streak') || c.includes('weekly_active'))
    return stats.longestStreak
  if (c.includes('bet') || c.includes('aposta') || c.includes('game_win') || c.includes('victory'))
    return stats.betsCount
  if (c.includes('career') || c.includes('top_earner')) return stats.careerPoints
  if (c.includes('loyalty') || c.includes('fidelity') || c.includes('ano') || c.includes('mes'))
    return stats.monthsActive
  if (c.includes('security') || c.includes('seguran')) return stats.securityFeaturesEnabled
  // Referral / indication checks last (so "first_referral" doesn't catch "first_bet").
  if (c.includes('referral') || c.includes('indic') || c.includes('network'))
    return stats.referralsCount
  return 0
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        careerPoints: true,
        personalPoints: true,
        stars: true,
        totalRides: true,
        pixEnabled: true,
        createdAt: true,
        phone: true,
        email: true,
      },
    })
    if (!user) return error('User not found', 404)

    // Batch all stats in parallel for performance.
    const [
      referralsCount,
      cashbackAgg,
      withdrawalsCount,
      voucherCount,
      planUpgradeCount,
      streak,
      betsCount,
      marketplaceOrdersCount,
      securityConfigs,
    ] = await Promise.all([
      prisma.user.count({ where: { referredById: userId } }),
      prisma.cashbackEntry.aggregate({ _sum: { amount: true }, where: { userId } }),
      prisma.transaction.count({ where: { userId, type: 'withdrawal', status: 'approved' } }),
      prisma.voucher.count({ where: { userId } }),
      prisma.transaction.count({ where: { userId, type: 'plan_upgrade', status: 'approved' } }),
      prisma.gamificationStreak.findUnique({ where: { userId } }),
      prisma.bet.count({ where: { userId } }),
      prisma.marketplaceOrder.count({ where: { userId } }),
      prisma.systemConfig.findMany({
        where: {
          key: {
            in: [
              `2fa_enabled_${userId}`,
              `phone_verify_${userId}`,
              `email_verify_${userId}`,
            ],
          },
        },
      }),
    ])

    // Count enabled security features (2FA enabled, phone verified, email verified, PIX enabled).
    let securityFeaturesEnabled = 0
    if (user.pixEnabled) securityFeaturesEnabled++
    for (const cfg of securityConfigs) {
      if (cfg.key === `2fa_enabled_${userId}` && cfg.value === 'true') {
        securityFeaturesEnabled++
        continue
      }
      try {
        const parsed = JSON.parse(cfg.value)
        if (parsed && parsed.verified === true) securityFeaturesEnabled++
      } catch {
        // ignore malformed JSON
      }
    }

    const stats: UserStats = {
      referralsCount,
      cashbackTotalCents: cashbackAgg._sum.amount ?? 0,
      withdrawalsCount,
      voucherCount,
      planUpgradeCount,
      longestStreak: streak?.longestStreak ?? 0,
      betsCount,
      marketplaceOrdersCount,
      ridesCount: user.totalRides ?? 0,
      careerPoints: user.careerPoints ?? 0,
      monthsActive: user.createdAt ? monthsSince(user.createdAt) : 0,
      securityFeaturesEnabled,
      createdAt: user.createdAt,
    }

    // Load active achievements from DB; fall back to hardcoded list if empty.
    let dbAchievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    const source: RawAchievement[] =
      dbAchievements.length > 0
        ? (dbAchievements as unknown as RawAchievement[])
        : FALLBACK_ACHIEVEMENTS

    const achievements = source.map((a) => {
      const targetValue = a.targetValue || 1
      // Don't cap progress so users can see "7 / 1" or "3258000 / 5000000" —
      // the UI formats this appropriately and clamps the progress bar to 100%.
      const progress = Math.max(0, progressForCode(a.code, stats))
      const earned = progress >= targetValue
      const rarity = deriveRarity(targetValue)
      return {
        id: a.id,
        code: a.code,
        name: a.name,
        description: a.description ?? '',
        icon: a.icon ?? 'Award',
        category: a.category || 'general',
        rarity,
        pointsReward: a.pointsReward ?? 0,
        targetValue,
        progress,
        earned,
        earnedDate: earned ? new Date().toISOString() : null,
        sortOrder: a.sortOrder ?? 0,
      }
    })

    const earnedCount = achievements.filter((a) => a.earned).length
    const total = achievements.length
    const points = achievements.reduce(
      (acc, a) => acc + (a.earned ? a.pointsReward : 0),
      0
    )
    const completionPct = total > 0 ? Math.round((earnedCount / total) * 100) : 0

    return success({
      achievements,
      summary: {
        earned: earnedCount,
        total,
        completionPct,
        points,
      },
    })
  } catch (err) {
    console.error('Achievements GET error:', err)
    return error('Failed to fetch achievements', 500)
  }
}
