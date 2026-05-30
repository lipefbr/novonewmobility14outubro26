import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return error('userId is required')
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return error('User not found', 404)
    }

    return success({
      withdrawal: user.balanceWithdrawal,
      mobility: user.balanceMobility,
      shopping: user.balanceShopping,
      food: user.balanceFood,
      pharmacy: user.balancePharmacy,
      gratification: user.balanceGratification,
      total:
        user.balanceWithdrawal +
        user.balanceMobility +
        user.balanceShopping +
        user.balanceFood +
        user.balancePharmacy +
        user.balanceGratification,
    })
  } catch (err) {
    console.error('Balances error:', err)
    return error('Internal server error', 500)
  }
}
