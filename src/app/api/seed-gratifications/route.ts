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

    // Per client spec (Índice.docx §5):
    //   - Auxílio Combustível: R$ 2.600/mês (R$100/dia × 26 dias)
    //   - Reembolso Vale Ducha: R$ 780/mês (R$30/dia × 26 dias)
    //   - Férias 6 Meses: R$ 5.000 + 10 dias
    //   - Férias 12 Meses: R$ 20.000 + 20 dias
    //   - Meta Diária Motorista: 18 corridas/dia (informational — amount 0)
    //   - Meta Mensal Motorista: 384 corridas/mês (informational — amount 0)
    //   - Prêmio CashBack Gratificação: R$ 15.000
    const gratifications = [
      { type: 'mobility_team', amount: 150000, category: 'mobility', description: 'Equipe de Mobilidade', isClaimed: false },
      { type: 'shopping', amount: 80000, category: 'shopping', description: 'Gratificação Compras', isClaimed: false },
      { type: 'leadership', amount: 200000, category: 'withdrawal', description: 'Bônus Liderança', isClaimed: false },
      { type: 'telemedicine', amount: 50000, category: 'service', description: 'Telemedicina', isClaimed: false },
      { type: 'dental', amount: 40000, category: 'service', description: 'Plano Odontológico', isClaimed: false },
      { type: 'insurance_phone', amount: 30000, category: 'service', description: 'Seguro Celular', isClaimed: false },
      // Client-spec §5 — fuel voucher raised to R$ 2.600 (R$100/dia × 26 dias)
      { type: 'fuel_aid', amount: 260000, category: 'mobility', description: 'Auxílio Combustível — R$ 2.600/mês (R$100/dia × 26 dias). Ao fechar 5º nível.', isClaimed: true },
      // Client-spec §5 — new car wash voucher (R$ 780/mês)
      { type: 'car_wash', amount: 78000, category: 'mobility', description: 'Reembolso Vale Ducha (Lava-Carro) — R$ 780/mês (R$30/dia × 26 dias). Ao fechar 5º nível.', isClaimed: false },
      { type: 'insurance_car', amount: 180000, category: 'service', description: 'Seguro Auto', isClaimed: true },
      { type: 'food_ticket', amount: 45000, category: 'service', description: 'Vale Refeição', isClaimed: false },
      { type: 'food_voucher', amount: 45000, category: 'service', description: 'Vale Alimentação', isClaimed: false },
      { type: 'mimo_kit', amount: 25000, category: 'service', description: 'Kit Mimo', isClaimed: false },
      { type: 'tow_truck', amount: 35000, category: 'mobility', description: 'Guincho', isClaimed: false },
      { type: 'home_assistance', amount: 45000, category: 'service', description: 'Assistência Residencial', isClaimed: false },
      { type: 'retirement_fund', amount: 500000, category: 'withdrawal', description: 'Fundo Aposentadoria', isClaimed: false },
      { type: 'motorcycle_choice', amount: 800000, category: 'withdrawal', description: 'Escolha da Moto', isClaimed: false },
      { type: 'residual_activation', amount: 100000, category: 'withdrawal', description: 'Ativação Residual', isClaimed: false },
      // Client-spec §5 — vacation bonuses (one-time)
      { type: 'vacation_6mo', amount: 500000, category: 'vacation', description: 'Férias 6 Meses — R$ 5.000 + 10 dias de férias. One-time aos 6 meses de cadastro ativo.', isClaimed: false },
      { type: 'vacation_12mo', amount: 2000000, category: 'vacation', description: 'Férias 12 Meses — R$ 20.000 + 20 dias de férias. One-time aos 12 meses de cadastro ativo.', isClaimed: false },
      // Client-spec §5 — driver goal informational rows (amount 0; tracking is separate)
      { type: 'driver_daily_goal', amount: 0, category: 'mobility', description: 'Meta Diária Motorista — 18 corridas/dia. Ao bater a meta no dia, sistema envia notificação push.', isClaimed: false },
      { type: 'driver_monthly_goal', amount: 0, category: 'mobility', description: 'Meta Mensal Motorista — 384 corridas/mês. Bonificação extra mensal ao bater a meta.', isClaimed: false },
      // Client-spec §5 — CashBack Gratificação prize (one-time, 1.364 users)
      { type: 'cashback_bonus_prize', amount: 1500000, category: 'prize', description: 'Prêmio CashBack Gratificação — R$ 15.000. One-time ao fechar equipe com 1.364 usuários.', isClaimed: false },
      // Client-spec §5 — physical prizes (carro, moto, casa, móveis) — amount 0, unlock via "Reivindicar"
      { type: 'prize_car', amount: 0, category: 'prize', description: 'Prêmio Carro — desbloqueado a cada nível de pontuação.', isClaimed: false },
      { type: 'prize_motorcycle', amount: 0, category: 'prize', description: 'Prêmio Moto — desbloqueado a cada nível de pontuação.', isClaimed: false },
      { type: 'prize_house', amount: 0, category: 'prize', description: 'Prêmio Casa — desbloqueado a cada nível de pontuação.', isClaimed: false },
      { type: 'prize_furniture', amount: 0, category: 'prize', description: 'Prêmio Móveis — desbloqueado a cada nível de pontuação.', isClaimed: false },
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
