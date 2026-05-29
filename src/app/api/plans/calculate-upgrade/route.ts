import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

const PLAN_PRICES: Record<string, number> = { free: 0, blue3: 20000, blue5: 99900 }
const PLAN_NAMES: Record<string, string> = { free: 'Gratuito', blue3: 'Blue 3', blue5: 'Blue 5 Premium' }

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, targetPlan } = body

    if (!userId || !targetPlan) {
      return error('userId and targetPlan are required')
    }

    if (!['blue3', 'blue5'].includes(targetPlan)) {
      return error('Invalid target plan. Must be blue3 or blue5')
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return error('User not found', 404)
    }

    const currentPlan = user.plan || 'free'
    const planOrder: Record<string, number> = { free: 0, blue3: 1, blue5: 2 }
    const currentLevel = planOrder[currentPlan] ?? 0
    const targetLevel = planOrder[targetPlan] ?? 0

    if (targetLevel <= currentLevel) {
      return error('Target plan must be higher than current plan')
    }

    const currentPrice = PLAN_PRICES[currentPlan] || 0
    const targetPrice = PLAN_PRICES[targetPlan] || 0
    const upgradeCost = targetPrice - currentPrice

    // Calculate benefits
    const benefits: Record<string, string | number> = {}

    if (currentPlan === 'free') {
      benefits.cashbackEntrada = '5 níveis (de: nenhum)'
      benefits.cashbackResidual = '7 níveis (de: nenhum)'
    } else if (currentPlan === 'blue3') {
      benefits.cashbackEntrada = '5 níveis (mesmo)'
      benefits.cashbackResidual = '7 níveis (mesmo)'
      benefits.cashbackSales = '9 níveis (novo!)'
    }

    const newFeatures = []
    if (targetPlan === 'blue3' && currentPlan === 'free') {
      newFeatures.push('CashBack Mobilidade', 'CashBack Farmácia')
    }
    if (targetPlan === 'blue5') {
      if (currentPlan === 'free') {
        newFeatures.push('CashBack Mobilidade', 'CashBack Farmácia', 'CashBack Shopping', 'Portal Gamer', 'Portal Sport Bet', 'Seguro Auto', 'Seguro de Vida', 'Telemedicina')
      } else if (currentPlan === 'blue3') {
        newFeatures.push('CashBack Shopping', 'CashBack Vendas 9 níveis', 'Portal Gamer', 'Portal Sport Bet', 'Seguro Auto', 'Seguro de Vida', 'Telemedicina')
      }
    }

    // Estimate monthly cashback increase
    const estimatedIncrease = targetPlan === 'blue5' ? 45000 : 15000

    return success({
      currentPlan: {
        id: currentPlan,
        name: PLAN_NAMES[currentPlan] || currentPlan,
        price: currentPrice,
      },
      targetPlan: {
        id: targetPlan,
        name: PLAN_NAMES[targetPlan] || targetPlan,
        price: targetPrice,
      },
      upgradeCost,
      monthlyDifference: targetPrice - currentPrice,
      benefits,
      newFeatures,
      estimatedMonthlyCashbackIncrease: estimatedIncrease,
      roi: targetPrice > 0 ? Math.round((estimatedIncrease / targetPrice) * 100) : 0,
    })
  } catch (err) {
    console.error('Calculate upgrade error:', err)
    return error('Internal server error', 500)
  }
}
