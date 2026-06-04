import { prisma } from '@/lib/db'
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
    const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } })
    if (!adminUser || (adminUser.role !== 'admin' && adminUser.email !== 'admin@newmobility.com')) {
      return error('Unauthorized - Admin only', 403)
    }

    // Build Prisma where clause
    const where: Record<string, unknown> = {}
    if (statusFilter !== 'all') {
      where.status = statusFilter
    }
    if (categoryFilter !== 'all') {
      where.category = categoryFilter
    }

    // Get all tickets with user info and messages
    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: {
        user: { select: { name: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })

    const ticketsWithMessages = tickets.map((ticket) => {
      // Get the last admin reply
      const adminReplies = ticket.messages.filter((m) => m.isAdmin)
      const lastAdminReply = adminReplies.length > 0 ? adminReplies[adminReplies.length - 1] : null

      return {
        id: ticket.id,
        userId: ticket.userId,
        userName: ticket.user?.name || 'Usuário',
        userEmail: ticket.user?.email || '',
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        priority: ticket.priority || 'normal',
        message: ticket.messages.length > 0 ? ticket.messages[0].message : '',
        reply: lastAdminReply ? lastAdminReply.message : undefined,
        messages: ticket.messages.map((m) => ({
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

    return success({ tickets: ticketsWithMessages })
  } catch (err) {
    console.error('Admin tickets error:', err)
    return error('Internal server error', 500)
  }
}
