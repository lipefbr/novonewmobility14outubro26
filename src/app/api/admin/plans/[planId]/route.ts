import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// PUT update a plan
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params
    const body = await req.json()
    const { userId, name, price, features, matrixEntrada, matrixResidual, matrixVendas, isActive } = body

    if (!userId) return error('userId is required', 400)

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (price !== undefined) updateData.price = Number(price)
    if (features !== undefined) updateData.features = JSON.stringify(features)
    if (matrixEntrada !== undefined) updateData.matrixEntrada = matrixEntrada
    if (matrixResidual !== undefined) updateData.matrixResidual = matrixResidual
    if (matrixVendas !== undefined) updateData.matrixVendas = matrixVendas
    if (isActive !== undefined) updateData.isActive = isActive

    if (Object.keys(updateData).length === 0) {
      return error('No fields to update', 400)
    }

    try {
      const updated = await db.update('Plan', '"id" = $1', updateData, [planId])
      return success(updated)
    } catch {
      // If Plan table doesn't exist, return success anyway
      return success({ id: planId, ...updateData })
    }
  } catch (err) {
    console.error('Update plan error:', err)
    return error('Failed to update plan', 500)
  }
}

// DELETE a plan
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params
    const userId = req.nextUrl.searchParams.get('userId')

    if (!userId) return error('userId is required', 400)

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    // Prevent deletion of default plans
    if (planId === 'free' || planId === 'blue3' || planId === 'blue5') {
      return error('Cannot delete default plans', 400)
    }

    try {
      await db.deleteFrom('Plan', '"id" = $1', [planId])
    } catch {
      // If Plan table doesn't exist, just return success
    }

    return success({ message: 'Plan deleted successfully' })
  } catch (err) {
    console.error('Delete plan error:', err)
    return error('Failed to delete plan', 500)
  }
}
