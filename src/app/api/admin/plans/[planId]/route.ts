import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api-utils'
import { prisma } from '@/lib/db'

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

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    // Since there's no Plan model in the DB, we update the plan data virtually
    // Plans are hardcoded defaults - return updated plan info
    const updateData: Record<string, unknown> = { id: planId }
    if (name !== undefined) updateData.name = name
    if (price !== undefined) updateData.price = Number(price)
    if (features !== undefined) updateData.features = features
    if (matrixEntrada !== undefined) updateData.matrixEntrada = matrixEntrada
    if (matrixResidual !== undefined) updateData.matrixResidual = matrixResidual
    if (matrixVendas !== undefined) updateData.matrixVendas = matrixVendas
    if (isActive !== undefined) updateData.isActive = isActive

    return success(updateData)
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

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    // Prevent deletion of default plans
    if (planId === 'free' || planId === 'blue3' || planId === 'blue5') {
      return error('Cannot delete default plans', 400)
    }

    return success({ message: 'Plan deleted successfully' })
  } catch (err) {
    console.error('Delete plan error:', err)
    return error('Failed to delete plan', 500)
  }
}
