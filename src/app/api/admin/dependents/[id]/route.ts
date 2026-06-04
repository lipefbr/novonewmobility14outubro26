import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { userId: adminUserId, name, cpf, relationship, birthDate, phone, email, isActive } = body

    if (!adminUserId) return error('userId is required', 400)

    const admin = await db.user.findUnique({ where: { id: adminUserId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    const existing = await db.dependent.findUnique({ where: { id } })
    if (!existing) return error('Dependent not found', 404)

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (cpf !== undefined) data.cpf = cpf || null
    if (relationship !== undefined) data.relationship = relationship
    if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null
    if (phone !== undefined) data.phone = phone || null
    if (email !== undefined) data.email = email || null
    if (isActive !== undefined) data.isActive = isActive

    const updated = await db.dependent.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return success(updated)
  } catch (err) {
    return error('Failed to update dependent', 500)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const adminUserId = req.nextUrl.searchParams.get('userId')

    if (!adminUserId) return error('userId is required', 400)

    const admin = await db.user.findUnique({ where: { id: adminUserId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    const existing = await db.dependent.findUnique({ where: { id } })
    if (!existing) return error('Dependent not found', 404)

    await db.dependent.delete({ where: { id } })

    return success({ message: 'Dependent deleted successfully' })
  } catch (err) {
    return error('Failed to delete dependent', 500)
  }
}
