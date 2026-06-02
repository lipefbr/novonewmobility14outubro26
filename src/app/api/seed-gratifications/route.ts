import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  const random2 = Math.random().toString(36).substring(2, 10)
  return `c${timestamp}${random}${random2}`
}

export async function POST() {
  try {
    const now = new Date().toISOString()

    // Get main user
    const mainUser = await db.findOne('User', '"email" = $1', ['carlos.silva@email.com'])
    if (!mainUser) {
      return error('Main user not found. Run full seed first.', 404)
    }

    // Check if gratifications already exist for this user
    const existing = await db.count('Gratification', '"userId" = $1', [mainUser.id])
    if (existing > 0) {
      return success({ message: `Already have ${existing} gratifications`, skipped: true })
    }

    const gratifications = [
      { type: 'mobility_team', amount: 150000, category: 'mobility', description: 'Equipe de Mobilidade', isClaimed: false },
      { type: 'shopping', amount: 80000, category: 'shopping', description: 'Gratificação Compras', isClaimed: false },
      { type: 'leadership', amount: 200000, category: 'withdrawal', description: 'Bônus Liderança', isClaimed: false },
      { type: 'telemedicine', amount: 50000, category: 'service', description: 'Telemedicina', isClaimed: false },
      { type: 'dental', amount: 40000, category: 'service', description: 'Plano Odontológico', isClaimed: false },
      { type: 'insurance_phone', amount: 30000, category: 'service', description: 'Seguro Celular', isClaimed: false },
      { type: 'fuel_aid', amount: 60000, category: 'mobility', description: 'Auxílio Combustível', isClaimed: true },
      { type: 'insurance_car', amount: 180000, category: 'service', description: 'Seguro Auto', isClaimed: true },
      { type: 'food_ticket', amount: 45000, category: 'service', description: 'Vale Refeição', isClaimed: false },
      { type: 'mimo_kit', amount: 25000, category: 'service', description: 'Kit Mimo', isClaimed: false },
      { type: 'tow_truck', amount: 35000, category: 'mobility', description: 'Guincho', isClaimed: false },
      { type: 'home_assistance', amount: 45000, category: 'service', description: 'Assistência Residencial', isClaimed: false },
      { type: 'retirement_fund', amount: 500000, category: 'withdrawal', description: 'Fundo Aposentadoria', isClaimed: false },
      { type: 'motorcycle_choice', amount: 800000, category: 'withdrawal', description: 'Escolha da Moto', isClaimed: false },
      { type: 'residual_activation', amount: 100000, category: 'withdrawal', description: 'Ativação Residual', isClaimed: false },
    ]

    for (const g of gratifications) {
      await db.insert('Gratification', {
        id: generateId(),
        userId: mainUser.id,
        type: g.type,
        amount: g.amount,
        category: g.category,
        description: g.description,
        isClaimed: g.isClaimed,
        claimedAt: g.isClaimed ? now : null,
        createdAt: now,
      })
    }

    return success({ message: `${gratifications.length} gratifications seeded`, count: gratifications.length }, 201)
  } catch (err) {
    console.error('Gratifications seed error:', err)
    return error('Failed to seed gratifications: ' + (err instanceof Error ? err.message : String(err)), 500)
  }
}
