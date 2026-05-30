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

    // Build WHERE clause
    const conditions: string[] = ['"isActive" = true']
    const params: any[] = []
    let paramIdx = 1

    if (search) {
      conditions.push(`("name" ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`)
      params.push(`%${search}%`)
      paramIdx++
    }
    if (category && category !== 'all') {
      conditions.push(`category = $${paramIdx}`)
      params.push(category)
      paramIdx++
    }
    if (featured === 'true') {
      conditions.push('"isFeatured" = true')
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const offset = (page - 1) * limit

    const [products, countResult] = await Promise.all([
      db.execute(
        `SELECT * FROM "MarketplaceProduct" ${whereClause}
         ORDER BY "isFeatured" DESC, "createdAt" DESC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset]
      ),
      db.execute(
        `SELECT COUNT(*)::int as count FROM "MarketplaceProduct" ${whereClause}`,
        params
      ),
    ])

    const total = (countResult as any[])?.[0]?.count ?? 0

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
    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user || user.role !== 'admin') {
      return error('Unauthorized - Admin only', 403)
    }

    if (!name || !price || !category) {
      return error('Name, price, and category are required')
    }

    const product = await db.insert('MarketplaceProduct', {
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
    })

    return success({ product }, 201)
  } catch (err) {
    console.error('Create product error:', err)
    return error('Internal server error', 500)
  }
}
