import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const adminUserId = searchParams.get('userId')
    const statusFilter = searchParams.get('status') || 'all'
    const categoryFilter = searchParams.get('category') || 'all'

    if (!adminUserId) {
      return error('userId is required')
    }

    // Verify admin
    const adminUser = await db.findOne('User', '"id" = $1', [adminUserId])
    if (!adminUser || (adminUser.role !== 'admin' && adminUser.email !== 'admin@newmobility.com')) {
      return error('Unauthorized - Admin only', 403)
    }

    // Build query conditions
    const conditions: string[] = []
    const params: any[] = []
    let paramIdx = 1

    if (statusFilter !== 'all') {
      conditions.push(`t.status = $${paramIdx}`)
      params.push(statusFilter)
      paramIdx++
    }

    if (categoryFilter !== 'all') {
      conditions.push(`t.category = $${paramIdx}`)
      params.push(categoryFilter)
      paramIdx++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get all tickets with user info and latest message
    const tickets = await db.execute(
      `SELECT t.*, u.name as "userName", u.email as "userEmail"
       FROM "Ticket" t
       LEFT JOIN "User" u ON t."userId" = u.id
       ${whereClause}
       ORDER BY t."updatedAt" DESC
       LIMIT 100`,
      params
    ) as any[]

    // For each ticket, get messages
    const ticketsWithMessages = await Promise.all(
      tickets.map(async (ticket) => {
        const messages = await db.find(
          'TicketMessage',
          '"ticketId" = $1',
          [ticket.id],
          'ORDER BY "createdAt" ASC'
        ) as any[]

        // Get the last admin reply
        const adminReplies = messages.filter((m: any) => m.isAdmin)
        const lastAdminReply = adminReplies.length > 0 ? adminReplies[adminReplies.length - 1] : null

        return {
          id: ticket.id,
          userId: ticket.userId,
          userName: ticket.userName || 'Usuário',
          userEmail: ticket.userEmail || '',
          subject: ticket.subject,
          category: ticket.category,
          status: ticket.status,
          priority: ticket.priority || 'normal',
          message: messages.length > 0 ? messages[0].message : '',
          reply: lastAdminReply ? lastAdminReply.message : undefined,
          messages: messages.map((m: any) => ({
            id: m.id,
            message: m.message,
            isAdmin: m.isAdmin,
            userId: m.userId,
            createdAt: m.createdAt,
          })),
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
        }
      })
    )

    return success({ tickets: ticketsWithMessages })
  } catch (err) {
    console.error('Admin tickets error:', err)
    return error('Internal server error', 500)
  }
}
