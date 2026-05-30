import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return error('userId is required')
    }

    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!ticket) {
      return error('Ticket not found', 404)
    }

    if (ticket.userId !== userId) {
      return error('Ticket does not belong to this user', 403)
    }

    return success({ ticket })
  } catch (err) {
    console.error('Ticket detail error:', err)
    return error('Internal server error', 500)
  }
}
