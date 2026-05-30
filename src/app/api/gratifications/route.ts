import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return error('userId is required')
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        gratifications: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!user) {
      return error('User not found', 404)
    }

    const available = user.gratifications.filter((g) => !g.isClaimed)
    const claimed = user.gratifications.filter((g) => g.isClaimed)

    return success({
      available,
      claimed,
      totalEarned: user.gratifications.reduce((sum, g) => sum + g.amount, 0),
      totalClaimed: claimed.reduce((sum, g) => sum + g.amount, 0),
    })
  } catch (err) {
    console.error('Gratifications error:', err)
    return error('Internal server error', 500)
  }
}
