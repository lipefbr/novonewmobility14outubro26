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

    // Verify admin
    const adminUser = await db.findOne('User', '"id" = $1', [userId])
    if (!adminUser || (adminUser.role !== 'admin' && adminUser.email !== 'admin@newmobility.com')) {
      return error('Unauthorized - Admin only', 403)
    }

    const ticket = await db.findOne('Ticket', '"id" = $1', [ticketId])
    if (!ticket) {
      return error('Ticket not found', 404)
    }

    if ((ticket as any).status === 'closed') {
      return error('Cannot reply to a closed ticket', 400)
    }

    // Create admin reply message
    const ticketMessage = await db.insert('TicketMessage', {
      ticketId,
      userId,
      message,
      isAdmin: true,
    })

    // Update ticket status to 'answered'
    await db.update(
      'Ticket',
      '"id" = $1',
      { status: 'answered' },
      [ticketId]
    )

    return success({ message: ticketMessage }, 201)
  } catch (err) {
    console.error('Admin reply ticket error:', err)
    return error('Internal server error', 500)
  }
}
