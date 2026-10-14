import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// Allowed tables for security - only these can be browsed/modified
const ALLOWED_TABLES = [
  'user', 'transaction', 'voucher', 'invoice', 'ticket',
  'ticketMessage', 'notification', 'gratification', 'systemConfig',
  'cashbackEntry', 'cashbackResidual', 'cashbackSales',
  'matrixPosition', 'careerMilestone', 'pointTransaction',
  'announcement', 'challenge', 'userChallenge',
  'gamificationStreak', 'event', 'eventRegistration',
] as const

type AllowedTable = typeof ALLOWED_TABLES[number]

// Map table names to Prisma model delegates
function getModel(tableName: string) {
  const models: Record<string, any> = {
    user: prisma.user,
    transaction: prisma.transaction,
    voucher: prisma.voucher,
    invoice: prisma.invoice,
    ticket: prisma.ticket,
    ticketMessage: prisma.ticketMessage,
    notification: prisma.notification,
    gratification: prisma.gratification,
    systemConfig: prisma.systemConfig,
    cashbackEntry: prisma.cashbackEntry,
    cashbackResidual: prisma.cashbackResidual,
    cashbackSales: prisma.cashbackSales,
    matrixPosition: prisma.matrixPosition,
    careerMilestone: prisma.careerMilestone,
    pointTransaction: prisma.pointTransaction,
    announcement: prisma.announcement,
    challenge: prisma.challenge,
    userChallenge: prisma.userChallenge,
    gamificationStreak: prisma.gamificationStreak,
    event: prisma.event,
    eventRegistration: prisma.eventRegistration,
  }
  return models[tableName]
}

// Fields that should never be returned or edited for security
const SENSITIVE_FIELDS = ['password']

async function verifyAdmin(userId: string) {
  if (!userId) return false
  const user = await prisma.user.findUnique({ where: { id: userId } })
  return user && user.role === 'admin'
}

// GET: Browse table data with pagination and search
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId || !(await verifyAdmin(userId))) return error('Unauthorized', 403)

    const table = req.nextUrl.searchParams.get('table') as AllowedTable
    if (!table || !ALLOWED_TABLES.includes(table)) return error('Invalid table name', 400)

    const model = getModel(table)
    if (!model) return error('Table not found', 404)

    const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
    const search = req.nextUrl.searchParams.get('search') || ''
    const searchField = req.nextUrl.searchParams.get('searchField') || ''

    const skip = (page - 1) * limit

    // Build where clause for search
    let where: any = {}
    if (search && searchField) {
      where[searchField] = { contains: search }
    } else if (search) {
      // Search across string fields
      if (table === 'user') {
        where = {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { referralCode: { contains: search } },
          ]
        }
      } else if (table === 'transaction') {
        where = {
          OR: [
            { description: { contains: search } },
            { type: { contains: search } },
          ]
        }
      } else if (table === 'systemConfig') {
        where = {
          OR: [
            { key: { contains: search } },
            { value: { contains: search } },
          ]
        }
      } else {
        where = {}
      }
    }

    const [rows, total] = await Promise.all([
      model.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      model.count({ where }),
    ])

    // Remove sensitive fields
    const safeRows = rows.map((row: any) => {
      const safe = { ...row }
      for (const field of SENSITIVE_FIELDS) {
        if (safe[field]) safe[field] = '***'
      }
      return safe
    })

    return success({
      table,
      rows: safeRows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    })
  } catch (err) {
    return error('Failed to fetch data: ' + (err instanceof Error ? err.message : 'Unknown error'), 500)
  }
}

// POST: Add a new row
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, table, data } = body
    if (!userId || !(await verifyAdmin(userId))) return error('Unauthorized', 403)

    if (!table || !ALLOWED_TABLES.includes(table as AllowedTable)) return error('Invalid table name', 400)
    if (!data || typeof data !== 'object') return error('data object is required', 400)

    const model = getModel(table)
    if (!model) return error('Table not found', 404)

    // Remove id if provided (let Prisma auto-generate)
    const createData = { ...data }
    delete createData.id

    const row = await model.create({ data: createData })
    return success({ row, message: 'Row created successfully' })
  } catch (err) {
    return error('Failed to create row: ' + (err instanceof Error ? err.message : 'Unknown error'), 500)
  }
}

// PUT: Update a row
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, table, id, data } = body
    if (!userId || !(await verifyAdmin(userId))) return error('Unauthorized', 403)

    if (!table || !ALLOWED_TABLES.includes(table as AllowedTable)) return error('Invalid table name', 400)
    if (!id) return error('Row id is required', 400)
    if (!data || typeof data !== 'object') return error('data object is required', 400)

    const model = getModel(table)
    if (!model) return error('Table not found', 404)

    // Prevent updating sensitive fields
    const updateData = { ...data }
    delete updateData.id
    delete updateData.password

    const row = await model.update({ where: { id }, data: updateData })
    return success({ row, message: 'Row updated successfully' })
  } catch (err) {
    return error('Failed to update row: ' + (err instanceof Error ? err.message : 'Unknown error'), 500)
  }
}

// DELETE: Delete a row
export async function DELETE(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId || !(await verifyAdmin(userId))) return error('Unauthorized', 403)

    const table = req.nextUrl.searchParams.get('table') as AllowedTable
    const id = req.nextUrl.searchParams.get('id')

    if (!table || !ALLOWED_TABLES.includes(table)) return error('Invalid table name', 400)
    if (!id) return error('Row id is required', 400)

    const model = getModel(table)
    if (!model) return error('Table not found', 404)

    // Prevent deleting users with role admin
    if (table === 'user') {
      const target = await prisma.user.findUnique({ where: { id } })
      if (target?.role === 'admin') return error('Cannot delete admin user', 403)
    }

    await model.delete({ where: { id } })
    return success({ message: 'Row deleted successfully' })
  } catch (err) {
    return error('Failed to delete row: ' + (err instanceof Error ? err.message : 'Unknown error'), 500)
  }
}
