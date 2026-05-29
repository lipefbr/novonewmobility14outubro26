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

    const tickets = await db.ticket.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return success({ tickets })
  } catch (err) {
    console.error('Tickets error:', err)
    return error('Internal server error', 500)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, subject, category, message } = body

    if (!userId || !subject || !category || !message) {
      return error('userId, subject, category, and message are required')
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return error('User not found', 404)
    }

    const ticket = await db.ticket.create({
      data: {
        userId,
        subject,
        category,
        status: 'open',
        messages: {
          create: {
            userId,
            message,
            isAdmin: false,
          },
        },
      },
      include: {
        messages: true,
      },
    })

    return success({ ticket }, 201)
  } catch (err) {
    console.error('Create ticket error:', err)
    return error('Internal server error', 500)
  }
}
