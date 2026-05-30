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
    const { userId, name, email, plan, isActive, balanceWithdrawal } = body

    if (!userId) return error('userId is required', 400)

    // Verify admin
    const admin = await db.findOne('User', '"id" = $1', [userId])
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    // Verify target user exists
    const targetUser = await db.findOne('User', '"id" = $1', [id])
    if (!targetUser) return error('User not found', 404)

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (plan !== undefined) updateData.plan = plan
    if (isActive !== undefined) updateData.isActive = isActive
    if (balanceWithdrawal !== undefined) updateData.balanceWithdrawal = balanceWithdrawal

    if (Object.keys(updateData).length === 0) {
      return error('No fields to update', 400)
    }

    const updated = await db.update('User', '"id" = $1', updateData, [id])

    // Remove password from response
    const { password: _, ...safeUser } = updated as Record<string, unknown>

    return success(safeUser)
  } catch (err) {
    console.error('Update user error:', err)
    return error('Failed to update user', 500)
  }
}
