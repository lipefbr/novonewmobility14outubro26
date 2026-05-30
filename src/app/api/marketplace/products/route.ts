import { db } from '@/lib/db'
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

    const where: any = { isActive: true }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (category && category !== 'all') {
      where.category = category
    }
    if (featured === 'true') {
      where.isFeatured = true
    }

    const [products, total] = await Promise.all([
      db.marketplaceProduct.findMany({
        where,
        orderBy: [
          { isFeatured: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.marketplaceProduct.count({ where }),
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

    // Check admin
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') {
      return error('Unauthorized - Admin only', 403)
    }

    if (!name || !price || !category) {
      return error('Name, price, and category are required')
    }

    const product = await db.marketplaceProduct.create({
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
        sellerName: sellerName || null,
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
