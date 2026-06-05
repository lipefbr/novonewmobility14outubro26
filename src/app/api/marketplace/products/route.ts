import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const featured = searchParams.get('featured')

    // Build where clause using Prisma
    const where: any = { isActive: true }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sellerName: { contains: search } },
      ]
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (featured === 'true') {
      where.isFeatured = true
    }

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      prisma.marketplaceProduct.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.marketplaceProduct.count({ where }),
    ])

    return success({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('Marketplace products error:', err)
    return error('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, description, price, originalPrice, category, imageUrl, images, stock, cashbackPercent, sellerName, tags, isFeatured } = body

    // Check admin or lojista
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || (user.role !== 'admin' && user.userType !== 'lojista')) {
      return error('Unauthorized - Admin or Lojista only', 403)
    }

    if (!name || !price || !category) {
      return error('Name, price, and category are required')
    }

    const product = await prisma.marketplaceProduct.create({
      data: {
        name,
        description: description || null,
        price,
        originalPrice: originalPrice || null,
        category,
        imageUrl: imageUrl || null,
        images: images ? JSON.stringify(images) : null,
        stock: stock || 0,
        cashbackPercent: cashbackPercent || 0,
        sellerName: sellerName || user.name,
        tags: tags ? JSON.stringify(tags) : null,
        isFeatured: isFeatured || false,
      },
    })

    return success({ product }, 201)
  } catch (err) {
    console.error('Create product error:', err)
    return error('Internal server error', 500)
  }
}
