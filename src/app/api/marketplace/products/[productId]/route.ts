import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const product = await prisma.marketplaceProduct.findUnique({
      where: { id: productId },
    })
    if (!product) {
      return error('Product not found', 404)
    }
    return success({ product })
  } catch (err) {
    console.error('Get product error:', err)
    return error('Internal server error', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const body = await request.json()
    const { userId, ...data } = body

    // Check admin or lojista
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || (user.role !== 'admin' && user.userType !== 'lojista')) {
      return error('Unauthorized - Admin or Lojista only', 403)
    }

    const updateData: Record<string, any> = {}
    const allowedFields = ['name', 'description', 'price', 'originalPrice', 'category', 'imageUrl', 'images', 'stock', 'cashbackPercent', 'sellerName', 'tags', 'isFeatured', 'isActive', 'rating', 'reviewCount']
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'images' || field === 'tags') {
          updateData[field] = JSON.stringify(data[field])
        } else {
          updateData[field] = data[field]
        }
      }
    }

    const product = await prisma.marketplaceProduct.update({
      where: { id: productId },
      data: updateData,
    })

    return success({ product })
  } catch (err) {
    console.error('Update product error:', err)
    return error('Internal server error', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    // Check admin or lojista
    const user = await prisma.user.findUnique({ where: { id: userId || '' } })
    if (!user || (user.role !== 'admin' && user.userType !== 'lojista')) {
      return error('Unauthorized - Admin or Lojista only', 403)
    }

    await prisma.marketplaceProduct.update({
      where: { id: productId },
      data: { isActive: false },
    })

    return success({ message: 'Product deactivated' })
  } catch (err) {
    console.error('Delete product error:', err)
    return error('Internal server error', 500)
  }
}
