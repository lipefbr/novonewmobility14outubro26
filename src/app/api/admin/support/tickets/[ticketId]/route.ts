import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params
    const body = await request.json()
    const { userId, status } = body

    if (!userId) {
      return error('userId is required')
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

    // Update ticket status
    const validStatuses = ['open', 'in_progress', 'answered', 'resolved', 'closed']
    if (status && !validStatuses.includes(status)) {
      return error('Invalid status')
    }

    const updateData: Record<string, any> = {}
    if (status) updateData.status = status

    const updatedTicket = await db.update(
      'Ticket',
      '"id" = $1',
      updateData,
      [ticketId]
    )

    return success({ ticket: updatedTicket })
  } catch (err) {
    console.error('Admin update ticket error:', err)
    return error('Internal server error', 500)
  }
}
