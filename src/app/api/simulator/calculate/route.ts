import { success, error } from '@/lib/api-utils'
import { ENTRADA_LEVELS, RESIDUAL_LEVELS, VENDAS_LEVELS } from '@/lib/api-utils'

const PLAN_MULTIPLIERS: Record<string, number> = {
  free: 0,
  blue3: 0.6,
  blue5: 1.0,
}

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  blue3: 9900,
  blue5: 19900,
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { plan, directReferrals } = body

    if (!plan || !PLAN_MULTIPLIERS[plan]) return error('Invalid plan. Use: free, blue3, blue5', 400)
    if (!directReferrals || directReferrals < 1) return error('directReferrals must be at least 1', 400)

    const multiplier = PLAN_MULTIPLIERS[plan]
    const planPrice = PLAN_PRICES[plan]

    // Calculate Entrada 4x5 matrix projections
    const entradaProjections = ENTRADA_LEVELS.map(level => {
      const totalUsersAtLevel = Math.min(level.users, directReferrals * Math.pow(4, level.level - 1) / directReferrals)
      const actualUsers = Math.min(level.users, Math.floor(directReferrals * Math.pow(4, level.level - 1)))
      const earningPerUser = planPrice * (level.percentage / 100) * multiplier
      const levelEarning = earningPerUser * actualUsers
      return {
        level: level.level,
        percentage: level.percentage,
        maxUsers: level.users,
        projectedUsers: actualUsers,
        earningPerUser: earningPerUser,
        totalEarning: levelEarning,
      }
    })

    // Calculate Residual 4x7 projections
    const residualProjections = RESIDUAL_LEVELS.map(level => {
      const usersAtLevel = Math.floor(directReferrals * Math.pow(4, level.level - 1))
      const earningPerUser = planPrice * (level.percentage / 100) * multiplier * 0.3
      const levelEarning = earningPerUser * usersAtLevel
      return {
        level: level.level,
        percentage: level.percentage,
        projectedUsers: usersAtLevel,
        earningPerUser,
        totalEarning: levelEarning,
      }
    })

    // Calculate Vendas 4x9 projections
    const vendasProjections = VENDAS_LEVELS.map(level => {
      const usersAtLevel = Math.floor(directReferrals * Math.pow(4, level.level - 1))
      const avgSpend = 50000 // R$ 500 monthly average spend per user
      const earningPerUser = avgSpend * (level.percentage / 100) * multiplier
      const levelEarning = earningPerUser * usersAtLevel
      return {
        level: level.level,
        percentage: level.percentage,
        projectedUsers: usersAtLevel,
        earningPerUser,
        totalEarning: levelEarning,
      }
    })

    const totalEntrada = entradaProjections.reduce((sum, l) => sum + l.totalEarning, 0)
    const totalResidual = residualProjections.reduce((sum, l) => sum + l.totalEarning, 0)
    const totalVendas = vendasProjections.reduce((sum, l) => sum + l.totalEarning, 0)
    const totalMonthly = totalEntrada + totalResidual + totalVendas

    return success({
      plan,
      directReferrals,
      planPrice,
      multiplier,
      entrada: { levels: entradaProjections, total: totalEntrada },
      residual: { levels: residualProjections, total: totalResidual },
      vendas: { levels: vendasProjections, total: totalVendas },
      totalMonthly,
      totalAnnual: totalMonthly * 12,
      roi: planPrice > 0 ? ((totalMonthly * 100) / planPrice) : 0,
      comparisons: Object.entries(PLAN_MULTIPLIERS).filter(([p]) => p !== 'free').map(([p, m]) => {
        const pm = PLAN_PRICES[p]
        const eTotal = ENTRADA_LEVELS.reduce((s, l) => s + (pm * (l.percentage / 100) * m * Math.floor(directReferrals * Math.pow(4, l.level - 1))), 0)
        const rTotal = RESIDUAL_LEVELS.reduce((s, l) => s + (pm * (l.percentage / 100) * m * 0.3 * Math.floor(directReferrals * Math.pow(4, l.level - 1))), 0)
        const vTotal = VENDAS_LEVELS.reduce((s, l) => s + (50000 * (l.percentage / 100) * m * Math.floor(directReferrals * Math.pow(4, l.level - 1))), 0)
        const monthly = eTotal + rTotal + vTotal
        return { plan: p, monthlyTotal: monthly, annualTotal: monthly * 12, roi: pm > 0 ? ((monthly * 100) / pm) : 0 }
      }),
    })
  } catch (err) {
    return error('Failed to calculate projections', 500)
  }
}
