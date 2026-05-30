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

    const invoices = await db.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return success({ invoices })
  } catch (err) {
    console.error('Invoices error:', err)
    return error('Internal server error', 500)
  }
}
