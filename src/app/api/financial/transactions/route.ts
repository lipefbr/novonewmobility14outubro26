import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const type = searchParams.get('type') || 'all'

    if (!userId) {
      return error('userId is required')
    }

    const where: Record<string, unknown> = { userId }
    if (type && type !== 'all') {
      where.type = type
    }

    const total = await db.transaction.count({ where })

    const transactions = await db.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return success({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('Transactions error:', err)
    return error('Internal server error', 500)
  }
}
