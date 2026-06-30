import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

const MIN_WITHDRAWAL_CENTS = 5000 // R$ 50,00 minimum (per spec)

/**
 * POST /api/asaas/withdrawal
 * Body: {
 *   userId,
 *   amountCents,
 *   paymentMethod: 'pix' | 'bank_transfer',
 *   pixKey?,           // required if paymentMethod === 'pix'
 *   bankCode?, bankAgency?, bankAccount?, bankType?  // required if 'bank_transfer'
 * }
 *
 * Creates a pending WithdrawalRequest and holds the funds by decrementing
 * user.balanceWithdrawal immediately. The actual Asaas transfer is initiated
 * by an admin at approval time (see /api/admin/asaas/withdrawals/[id]/approve).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId,
      amountCents,
      paymentMethod,
      pixKey,
      bankCode,
      bankAgency,
      bankAccount,
      bankType,
    } = body as {
      userId?: string
      amountCents?: number
      paymentMethod?: 'pix' | 'bank_transfer'
      pixKey?: string
      bankCode?: string
      bankAgency?: string
      bankAccount?: string
      bankType?: string
    }

    if (!userId) return error('userId é obrigatório', 400)

    const amount = Math.floor(Number(amountCents))
    if (!Number.isFinite(amount) || amount <= 0) {
      return error('amountCents inválido', 400)
    }
    if (amount < MIN_WITHDRAWAL_CENTS) {
      return error(
        `Valor mínimo para saque é R$ ${(MIN_WITHDRAWAL_CENTS / 100)
          .toFixed(2)
          .replace('.', ',')}`,
        400
      )
    }

    const method = paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'pix'

    // Validate destination
    if (method === 'pix') {
      if (!pixKey || String(pixKey).trim().length < 3) {
        return error('pixKey é obrigatório para saque via PIX', 400)
      }
    } else {
      if (!bankCode || !bankAgency || !bankAccount) {
        return error(
          'bankCode, bankAgency e bankAccount são obrigatórios para saque via TED',
          400
        )
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return error('Usuário não encontrado', 404)

    if (user.balanceWithdrawal < amount) {
      return error(
        `Saldo para saque insuficiente. Disponível: ${user.balanceWithdrawal} cents, necessário: ${amount} cents.`,
        400
      )
    }

    // Hold the funds immediately (decrement balanceWithdrawal). The funds are
    // returned to the user if the admin rejects the request or the Asaas
    // transfer fails.
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { balanceWithdrawal: { decrement: amount } },
    })

    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId: user.id,
        amount,
        status: 'pending',
        paymentMethod: method,
        pixKey: method === 'pix' ? String(pixKey).trim() : null,
        bankCode: method === 'bank_transfer' ? bankCode : null,
        bankAgency: method === 'bank_transfer' ? bankAgency : null,
        bankAccount: method === 'bank_transfer' ? bankAccount : null,
        bankType: method === 'bank_transfer' ? bankType || 'CHECKING' : null,
      },
    })

    return success(
      {
        withdrawal,
        newBalanceWithdrawal: updatedUser.balanceWithdrawal,
        message: 'Solicitação de saque registrada. Aguardando aprovação do administrador.',
      },
      201
    )
  } catch (err) {
    console.error('[Asaas withdrawal POST] error:', err)
    return error('Internal server error', 500)
  }
}
