import { db } from '@/lib/db'
import { success, error, reaisToCents } from '@/lib/api-utils'

// Withdrawal rules per client spec (Índice.docx §15):
//   • Minimum per withdrawal: R$ 100,00 (10000 cents)
//   • Maximum per day: R$ 5.000,00 (500000 cents)
//   • Maximum per month: R$ 200.000,00 (20000000 cents)
//   • Fee: 5% — BUT FREE between days 5-8 of each month
//     ("ENTRE DIA 5 E 8 DE CADA MÊS ELE SACA SEM TAXA – APÓS TAXA DE 5%")
//   • Admin can override the fee via SystemConfig key "withdrawal_fee_override"
const MIN_WITHDRAWAL_CENTS = 10000      // R$ 100,00
const MAX_DAILY_WITHDRAWAL_CENTS = 500000 // R$ 5.000,00
const MAX_MONTHLY_WITHDRAWAL_CENTS = 20000000 // R$ 200.000,00
const WITHDRAWAL_FEE_PERCENT = 5         // 5% (waived during days 5-8)
const FREE_WITHDRAWAL_DAY_START = 5      // Day 5 of month
const FREE_WITHDRAWAL_DAY_END = 8        // Day 8 of month (inclusive)

function isFreeWithdrawalDay(date: Date = new Date()): boolean {
  const day = date.getDate()
  return day >= FREE_WITHDRAWAL_DAY_START && day <= FREE_WITHDRAWAL_DAY_END
}

function calculateFee(amountCents: number, isFree: boolean): number {
  if (isFree) return 0
  return Math.round((amountCents * WITHDRAWAL_FEE_PERCENT) / 100)
}

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

    // Enforce minimum withdrawal amount (client spec §15: "R$ 100,00 mínimo")
    if (amountCents < MIN_WITHDRAWAL_CENTS) {
      return error(`Valor mínimo para saque é R$ ${(MIN_WITHDRAWAL_CENTS / 100).toFixed(2).replace('.', ',')}.`, 400)
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
    // "Saldo Pagamento Fatura" wallet (client spec §18) — used to pay monthly invoices.
    else if (category === 'paymentInvoice') balanceField = 'balancePaymentInvoice'

    const currentBalance = user[balanceField] as number

    // Validate that user has a PIX key registered (required for withdrawals)
    if (!user.pixKey || String(user.pixKey).trim() === '') {
      return error('Você precisa cadastrar uma chave PIX antes de solicitar um saque. Acesse seu perfil e cadastre sua chave PIX.', 400)
    }

    // Validate sufficient balance
    if (amountCents > currentBalance) {
      return error('Saldo insuficiente para este saque', 400)
    }

    // --- Enforce daily and monthly withdrawal limits (client spec §15) ---
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Fetch user's approved/pending/paid withdrawals today and this month
    const todayWithdrawals = await db.find(
      'Transaction',
      '"userId" = $1 AND "type" = $2 AND "createdAt" >= $3 AND "createdAt" < $4',
      [userId, 'withdrawal', startOfDay.toISOString(), endOfDay.toISOString()]
    ) as any[]
    const monthWithdrawals = await db.find(
      'Transaction',
      '"userId" = $1 AND "type" = $2 AND "createdAt" >= $3 AND "createdAt" < $4',
      [userId, 'withdrawal', startOfMonth.toISOString(), endOfMonth.toISOString()]
    ) as any[]

    const totalToday = todayWithdrawals
      .filter(t => t.status !== 'rejected')
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
    const totalThisMonth = monthWithdrawals
      .filter(t => t.status !== 'rejected')
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)

    if (totalToday + amountCents > MAX_DAILY_WITHDRAWAL_CENTS) {
      const remaining = Math.max(0, MAX_DAILY_WITHDRAWAL_CENTS - totalToday)
      return error(
        `Limite diário de saque atingido. Você já sacou R$ ${(totalToday / 100).toFixed(2).replace('.', ',')} hoje. ` +
        `Limite diário: R$ ${(MAX_DAILY_WITHDRAWAL_CENTS / 100).toFixed(2).replace('.', ',')}. ` +
        `Disponível hoje: R$ ${(remaining / 100).toFixed(2).replace('.', ',')}.`,
        400
      )
    }

    if (totalThisMonth + amountCents > MAX_MONTHLY_WITHDRAWAL_CENTS) {
      const remaining = Math.max(0, MAX_MONTHLY_WITHDRAWAL_CENTS - totalThisMonth)
      return error(
        `Limite mensal de saque atingido. Você já sacou R$ ${(totalThisMonth / 100).toFixed(2).replace('.', ',')} este mês. ` +
        `Limite mensal: R$ ${(MAX_MONTHLY_WITHDRAWAL_CENTS / 100).toFixed(2).replace('.', ',')}. ` +
        `Disponível no mês: R$ ${(remaining / 100).toFixed(2).replace('.', ',')}.`,
        400
      )
    }

    // --- Calculate withdrawal fee (client spec §15: free between days 5-8, 5% otherwise) ---
    const freeDay = isFreeWithdrawalDay(now)
    const feeCents = calculateFee(amountCents, freeDay)
    const netCents = amountCents - feeCents

    // Create transaction (status: pending -> admin approves later)
    const description = freeDay
      ? `Saque sem taxa (janela gratuita dias 5-8) - ${category || 'withdrawal'} (PIX: ${user.pixKey})`
      : `Solicitação de saque - ${category || 'withdrawal'} (taxa 5%: R$ ${(feeCents / 100).toFixed(2).replace('.', ',')}) (PIX: ${user.pixKey})`

    const transaction = await db.insert('Transaction', {
      userId,
      type: 'withdrawal',
      amount: -amountCents,
      status: 'pending',
      category: category || 'withdrawal',
      description,
    })

    // Deduct from balance immediately (funds held while withdrawal is pending)
    await db.update(
      'User',
      '"id" = $1',
      { [balanceField]: currentBalance - amountCents },
      [userId]
    )

    // If a fee applies, record it as a separate transaction line for the admin to see
    if (feeCents > 0) {
      try {
        await db.insert('Transaction', {
          userId,
          type: 'fee',
          amount: -feeCents,
          status: 'paid',
          category: 'withdrawal_fee',
          description: `Taxa de saque 5% sobre R$ ${(amountCents / 100).toFixed(2).replace('.', ',')} (fora da janela gratuita)`,
        })
      } catch (feeErr) {
        console.warn('[Withdraw] Could not record fee transaction:', feeErr)
      }
    }

    // Reload user to return updated balance
    const updatedUser = await db.findOne('User', '"id" = $1', [userId])

    return success({
      transaction,
      newBalance: updatedUser?.[balanceField] ?? currentBalance - amountCents,
      pixKey: user.pixKey,
      feeCents,
      netCents,
      isFreeWithdrawal: freeDay,
      message: freeDay
        ? 'Saque solicitado dentro da janela gratuita (dias 5-8). Sem taxa.'
        : `Saque solicitado com taxa de 5% (R$ ${(feeCents / 100).toFixed(2).replace('.', ',')}). Janela gratuita: dias 5 a 8 de cada mês.`,
    }, 201)
  } catch (err) {
    console.error('Withdrawal error:', err)
    return error('Internal server error', 500)
  }
}
