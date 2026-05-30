import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return error('userId is required')
    }

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user) {
      return error('User not found', 404)
    }

    const vouchers = await db.find(
      'Voucher',
      '"userId" = $1',
      [userId],
      'ORDER BY "createdAt" DESC'
    )

    const active = (vouchers as any[]).filter((v) => !v.isUsed)
    const used = (vouchers as any[]).filter((v) => v.isUsed)

    return success({
      active,
      used,
      totalActive: active.reduce((sum, v) => sum + v.amount, 0),
      totalUsed: used.reduce((sum, v) => sum + v.amount, 0),
    })
  } catch (err) {
    console.error('Vouchers error:', err)
    return error('Internal server error', 500)
  }
}
