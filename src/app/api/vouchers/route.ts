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

    const now = Date.now()
    const isExpired = (v: any) =>
      !v.isUsed && v.expiresAt && new Date(v.expiresAt).getTime() < now

    const active = (vouchers as any[]).filter((v) => !v.isUsed && !isExpired(v))
    const used = (vouchers as any[]).filter((v) => v.isUsed)
    const expired = (vouchers as any[]).filter((v) => !v.isUsed && isExpired(v))

    return success({
      active,
      used,
      expired,
      totalActive: active.reduce((sum, v) => sum + (typeof v.amount === 'number' ? v.amount : 0), 0),
      totalUsed: used.reduce((sum, v) => sum + (typeof v.amount === 'number' ? v.amount : 0), 0),
      totalExpired: expired.reduce((sum, v) => sum + (typeof v.amount === 'number' ? v.amount : 0), 0),
    })
  } catch (err) {
    console.error('Vouchers error:', err)
    return error('Internal server error', 500)
  }
}
