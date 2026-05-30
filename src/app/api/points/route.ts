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
        pointTransactions: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!user) {
      return error('User not found', 404)
    }

    // Group points by type
    const pointsByType: Record<string, number> = {}
    for (const pt of user.pointTransactions) {
      pointsByType[pt.type] = (pointsByType[pt.type] || 0) + pt.amount
    }

    return success({
      careerPoints: user.careerPoints,
      personalPoints: user.personalPoints,
      stars: user.stars,
      pointsByType,
      history: user.pointTransactions,
    })
  } catch (err) {
    console.error('Points error:', err)
    return error('Internal server error', 500)
  }
}
