import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error, reaisToCents, centsToReais } from '@/lib/api-utils'

const BALANCE_FIELDS: Record<string, string> = {
  mobility: 'balanceMobility',
  shopping: 'balanceShopping',
  food: 'balanceFood',
  pharmacy: 'balancePharmacy',
  gratification: 'balanceGratification',
  withdrawal: 'balanceWithdrawal',
}

// 5% fee for non-Saque source transfers, 0% for Saque source
const TRANSFER_FEES: Record<string, number> = {
  'mobility->withdrawal': 5,
  'shopping->withdrawal': 5,
  'food->withdrawal': 5,
  'pharmacy->withdrawal': 5,
  'gratification->withdrawal': 5,
  'withdrawal->mobility': 0,
  'withdrawal->shopping': 0,
  'withdrawal->food': 0,
  'withdrawal->pharmacy': 0,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, source, destination, amount } = body

    if (!userId || !source || !destination || !amount) {
      return error('userId, source, destination e amount são obrigatórios')
    }

    if (source === destination) {
      return error('Origem e destino não podem ser iguais')
    }

    const sourceField = BALANCE_FIELDS[source]
    const destField = BALANCE_FIELDS[destination]

    if (!sourceField || !destField) {
      return error('Tipo de saldo inválido')
    }

    const amountCents = reaisToCents(amount)
    if (amountCents <= 0) {
      return error('Valor deve ser positivo')
    }

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user) {
      return error('Usuário não encontrado', 404)
    }

    const sourceBalance = (user as any)[sourceField] as number
    if (sourceBalance < amountCents) {
      return error('Saldo insuficiente')
    }

    const feeKey = `${source}->${destination}`
    const feePercent = TRANSFER_FEES[feeKey] ?? 5
    const feeCents = Math.round(amountCents * feePercent / 100)
    const netAmount = amountCents - feeCents

    if (netAmount <= 0) {
      return error('Valor insuficiente para cobrir a taxa')
    }

    // Update balances with decrement/increment using raw SQL
    await db.execute(
      `UPDATE "User" SET "${sourceField}" = "${sourceField}" - $1, "${destField}" = "${destField}" + $2 WHERE "id" = $3`,
      [amountCents, netAmount, userId]
    )

    // Create transaction records
    await db.insert('Transaction', {
      userId,
      type: 'transfer_out',
      amount: -amountCents,
      status: 'paid',
      category: source,
      description: `Transferência de ${source} para ${destination}`,
    })

    await db.insert('Transaction', {
      userId,
      type: 'transfer_in',
      amount: netAmount,
      status: 'paid',
      category: destination,
      description: `Transferência recebida de ${source} (taxa: ${feePercent}%)`,
    })

    return success({
      message: 'Transferência realizada com sucesso',
      source,
      destination,
      grossAmount: centsToReais(amountCents),
      fee: centsToReais(feeCents),
      feePercent,
      netAmount: centsToReais(netAmount),
    })
  } catch (err: any) {
    return error(err.message || 'Erro interno do servidor', 500)
  }
}
