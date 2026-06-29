import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// PUT — update a career plan
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      userId,
      name,
      description,
      minPoints,
      bonusCents,
      color,
      icon,
      isActive,
      sortOrder,
    } = body

    if (!userId) return error('userId is required', 400)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    const existing = await prisma.careerPlan.findUnique({ where: { id } })
    if (!existing) return error('Career plan not found', 404)

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description || null
    if (minPoints !== undefined) data.minPoints = Number(minPoints) || 0
    if (bonusCents !== undefined) data.bonusCents = Number(bonusCents) || 0
    if (color !== undefined) data.color = color || null
    if (icon !== undefined) data.icon = icon || null
    if (isActive !== undefined) data.isActive = Boolean(isActive)
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder) || 0

    const updated = await prisma.careerPlan.update({ where: { id }, data })
    return success(updated)
  } catch (err) {
    console.error('Admin career-plans PUT error:', err)
    return error('Failed to update career plan', 500)
  }
}

// DELETE — delete a career plan
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    const existing = await prisma.careerPlan.findUnique({ where: { id } })
    if (!existing) return error('Career plan not found', 404)

    await prisma.careerPlan.delete({ where: { id } })
    return success({ message: 'Career plan deleted successfully' })
  } catch (err) {
    console.error('Admin career-plans DELETE error:', err)
    return error('Failed to delete career plan', 500)
  }
}
