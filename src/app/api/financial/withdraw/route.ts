import { db } from '@/lib/db'
import { success, error, reaisToCents } from '@/lib/api-utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, amount, category } = body

    if (!userId || !amount) {
      return error('userId and amount are required')
    }

    // Amount is expected in BRL (reais), convert to cents for storage
    // e.g., user sends 5000.00 meaning R$ 5.000,00 → stored as 500000 cents
    const amountCents = reaisToCents(amount)

    if (amountCents <= 0) {
      return error('Amount must be positive')
    }

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user) {
      return error('User not found', 404)
    }

    // Block withdrawals for free plan users (subscription not paid)
    if (user.plan === 'free' && user.role !== 'admin') {
      return error('Você precisa assinar um plano para solicitar saques. Acesse "Meu Plano" para assinar.', 403)
    }

    // Check sufficient balance based on category
    let balanceField = 'balanceWithdrawal'
    if (category === 'mobility') balanceField = 'balanceMobility'
    else if (category === 'shopping') balanceField = 'balanceShopping'
    else if (category === 'food') balanceField = 'balanceFood'
    else if (category === 'pharmacy') balanceField = 'balancePharmacy'
    else if (category === 'gratification') balanceField = 'balanceGratification'

    const currentBalance = user[balanceField] as number

    // Validate that user has a PIX key registered (required for withdrawals)
    if (!user.pixKey || String(user.pixKey).trim() === '') {
      return error('Você precisa cadastrar uma chave PIX antes de solicitar um saque. Acesse seu perfil e cadastre sua chave PIX.', 400)
    }

    // Validate sufficient balance
    if (amountCents > currentBalance) {
      return error('Saldo insuficiente para este saque', 400)
    }

    // Create transaction (status: pending -> admin approves later)
    const transaction = await db.insert('Transaction', {
      userId,
      type: 'withdrawal',
      amount: -amountCents,
      status: 'pending',
      category: category || 'withdrawal',
      description: `Solicitação de saque - ${category || 'withdrawal'} (PIX: ${user.pixKey})`,
    })

    // Deduct from balance immediately (funds held while withdrawal is pending)
    await db.update(
      'User',
      '"id" = $1',
      { [balanceField]: currentBalance - amountCents },
      [userId]
    )

    // Reload user to return updated balance
    const updatedUser = await db.findOne('User', '"id" = $1', [userId])

    return success({
      transaction,
      newBalance: updatedUser?.[balanceField] ?? currentBalance - amountCents,
      pixKey: user.pixKey,
    }, 201)
  } catch (err) {
    console.error('Withdrawal error:', err)
    return error('Internal server error', 500)
  }
}
