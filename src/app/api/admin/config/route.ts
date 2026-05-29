import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    const configs = await db.systemConfig.findMany()
    const configMap: Record<string, string> = {}
    configs.forEach(c => { configMap[c.key] = c.value })

    if (!configMap['cashback_entrada_pct']) {
      await db.systemConfig.upsert({ where: { key: 'cashback_entrada_pct' }, update: {}, create: { key: 'cashback_entrada_pct', value: '35', description: 'CashBack Entrada percentage' } })
      configMap['cashback_entrada_pct'] = '35'
    }
    if (!configMap['cashback_residual_pct']) {
      await db.systemConfig.upsert({ where: { key: 'cashback_residual_pct' }, update: {}, create: { key: 'cashback_residual_pct', value: '45', description: 'CashBack Residual percentage' } })
      configMap['cashback_residual_pct'] = '45'
    }
    if (!configMap['cashback_vendas_pct']) {
      await db.systemConfig.upsert({ where: { key: 'cashback_vendas_pct' }, update: {}, create: { key: 'cashback_vendas_pct', value: '0.9', description: 'CashBack Vendas percentage' } })
      configMap['cashback_vendas_pct'] = '0.9'
    }
    if (!configMap['min_withdrawal']) {
      await db.systemConfig.upsert({ where: { key: 'min_withdrawal' }, update: {}, create: { key: 'min_withdrawal', value: '5000', description: 'Minimum withdrawal amount in cents' } })
      configMap['min_withdrawal'] = '5000'
    }
    if (!configMap['max_withdrawal']) {
      await db.systemConfig.upsert({ where: { key: 'max_withdrawal' }, update: {}, create: { key: 'max_withdrawal', value: '500000', description: 'Maximum withdrawal amount in cents' } })
      configMap['max_withdrawal'] = '500000'
    }
    if (!configMap['withdrawal_fee_pct']) {
      await db.systemConfig.upsert({ where: { key: 'withdrawal_fee_pct' }, update: {}, create: { key: 'withdrawal_fee_pct', value: '2', description: 'Withdrawal fee percentage' } })
      configMap['withdrawal_fee_pct'] = '2'
    }

    return success(configMap)
  } catch (err) {
    return error('Failed to fetch config', 500)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, configs } = body
    if (!userId) return error('userId is required', 400)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    if (!configs || typeof configs !== 'object') return error('configs object is required', 400)

    const updates = Object.entries(configs).map(([key, value]) =>
      db.systemConfig.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )

    await Promise.all(updates)
    return success({ message: 'Configuration updated successfully' })
  } catch (err) {
    return error('Failed to update config', 500)
  }
}
