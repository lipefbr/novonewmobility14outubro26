import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params
    const body = await request.json()
    const { userId, message } = body

    if (!userId || !message) {
      return error('userId and message are required')
    }

    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
    })

    if (!ticket) {
      return error('Ticket not found', 404)
    }

    if (ticket.userId !== userId) {
      return error('Ticket does not belong to this user', 403)
    }

    if (ticket.status === 'closed') {
      return error('Cannot reply to a closed ticket', 400)
    }

    const ticketMessage = await db.ticketMessage.create({
      data: {
        ticketId,
        userId,
        message,
        isAdmin: false,
      },
    })

    // Update ticket status to in_progress if it was open
    if (ticket.status === 'open') {
      await db.ticket.update({
        where: { id: ticketId },
        data: { status: 'in_progress' },
      })
    }

    return success({ message: ticketMessage }, 201)
  } catch (err) {
    console.error('Reply ticket error:', err)
    return error('Internal server error', 500)
  }
}
