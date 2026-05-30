import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// Default configs to seed if missing
const DEFAULT_CONFIGS = [
  { key: 'cashback_entrada_pct', value: '35', description: 'CashBack Entrada percentage' },
  { key: 'cashback_residual_pct', value: '45', description: 'CashBack Residual percentage' },
  { key: 'cashback_vendas_pct', value: '0.9', description: 'CashBack Vendas percentage' },
  { key: 'min_withdrawal', value: '5000', description: 'Minimum withdrawal amount in cents' },
  { key: 'max_withdrawal', value: '500000', description: 'Maximum withdrawal amount in cents' },
  { key: 'withdrawal_fee_pct', value: '2', description: 'Withdrawal fee percentage' },
]

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    const configs = await db.find('SystemConfig')
    const configMap: Record<string, string> = {}
    for (const c of configs as any[]) {
      configMap[c.key] = c.value
    }

    // Seed missing default configs using PostgreSQL upsert
    for (const def of DEFAULT_CONFIGS) {
      if (!configMap[def.key]) {
        await db.execute(
          `INSERT INTO "SystemConfig" ("id", "key", "value", "description", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, NOW())
           ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value"`,
          [def.key, def.value, def.description]
        )
        configMap[def.key] = def.value
      }
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

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    if (!configs || typeof configs !== 'object') return error('configs object is required', 400)

    // Upsert each config using PostgreSQL INSERT ... ON CONFLICT
    const updates = Object.entries(configs).map(([key, value]) =>
      db.execute(
        `INSERT INTO "SystemConfig" ("id", "key", "value", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, NOW())
         ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW()`,
        [key, String(value)]
      )
    )

    await Promise.all(updates)
    return success({ message: 'Configuration updated successfully' })
  } catch (err) {
    return error('Failed to update config', 500)
  }
}
