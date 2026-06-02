import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    if (!userId) {
      return error('userId is required')
    }

    // Build conditions
    const conditions: string[] = ['"userId" = $1']
    const params: any[] = [userId]
    let paramIdx = 2

    if (status && status !== 'all') {
      conditions.push(`status = $${paramIdx}`)
      params.push(status)
      paramIdx++
    }

    const orders = await db.find(
      'MarketplaceOrder',
      conditions.join(' AND '),
      params,
      'ORDER BY "createdAt" DESC'
    ) as any[]

    // For each order, get items with product info
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db.execute(
          `SELECT oi.*, mp.name as "productName", mp."imageUrl", mp.category
           FROM "MarketplaceOrderItem" oi
           LEFT JOIN "MarketplaceProduct" mp ON oi."productId" = mp.id
           WHERE oi."orderId" = $1`,
          [order.id]
        )
        return {
          ...order,
          items,
        }
      })
    )

    return success({ orders: ordersWithItems })
  } catch (err) {
    console.error('Marketplace orders error:', err)
    return error('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, items, shippingAddress, paymentMethod } = body

    if (!userId || !items || items.length === 0) {
      return error('userId and items are required')
    }

    // Get user
    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user) {
      return error('User not found', 404)
    }

    // Get products and calculate total
    let totalAmount = 0
    let totalCashback = 0
    const orderItemsData: any[] = []

    for (const item of items) {
      const product = await db.findOne('MarketplaceProduct', '"id" = $1', [item.productId]) as any
      if (!product || !product.isActive) {
        return error(`Product ${item.productId} not available`, 400)
      }
      if (product.stock < item.quantity) {
        return error(`Insufficient stock for ${product.name}`, 400)
      }

      const itemTotal = product.price * item.quantity
      const itemCashback = Math.round(itemTotal * (product.cashbackPercent / 100))
      totalAmount += itemTotal
      totalCashback += itemCashback

      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        cashbackPercent: product.cashbackPercent,
        userId,
      })

      // Decrease stock
      await db.update(
        'MarketplaceProduct',
        '"id" = $1',
        { stock: product.stock - item.quantity },
        [product.id]
      )
    }

    // Create order
    const order = await db.insert('MarketplaceOrder', {
      userId,
      totalAmount,
      cashbackEarned: totalCashback,
      shippingAddress: shippingAddress || null,
      paymentMethod: paymentMethod || null,
      status: paymentMethod === 'balance' ? 'processing' : 'pending',
    })

    // Create order items
    for (const itemData of orderItemsData) {
      await db.insert('MarketplaceOrderItem', {
        orderId: (order as any).id,
        ...itemData,
      })
    }

    // If paying with balance, deduct from user
    if (paymentMethod === 'balance' && user.balanceWithdrawal >= totalAmount) {
      await db.update(
        'User',
        '"id" = $1',
        {
          balanceWithdrawal: user.balanceWithdrawal - totalAmount,
          balanceGratification: user.balanceGratification + totalCashback,
        },
        [userId]
      )

      await db.update(
        'MarketplaceOrder',
        '"id" = $1',
        { status: 'processing', paidAt: new Date() },
        [(order as any).id]
      )

      // Create transaction
      await db.insert('Transaction', {
        userId,
        type: 'marketplace_purchase',
        amount: -totalAmount,
        status: 'approved',
        category: 'marketplace',
        description: `Compra no Marketplace - Pedido #${(order as any).id.slice(-8)}`,
      })

      // Create cashback transaction
      if (totalCashback > 0) {
        await db.insert('Transaction', {
          userId,
          type: 'cashback_sales',
          amount: totalCashback,
          status: 'approved',
          category: 'marketplace',
          description: `CashBack Marketplace - Pedido #${(order as any).id.slice(-8)}`,
        })
      }
    } else if (paymentMethod === 'balance') {
      // Not enough balance - roll back
      await db.deleteFrom('MarketplaceOrder', '"id" = $1', [(order as any).id])
      // Delete order items
      await db.execute(
        `DELETE FROM "MarketplaceOrderItem" WHERE "orderId" = $1`,
        [(order as any).id]
      )
      // Restore stock
      for (const item of items) {
        const product = await db.findOne('MarketplaceProduct', '"id" = $1', [item.productId]) as any
        if (product) {
          await db.update(
            'MarketplaceProduct',
            '"id" = $1',
            { stock: product.stock + item.quantity },
            [item.productId]
          )
        }
      }
      return error('Saldo insuficiente', 400)
    }

    // Get the order with items
    const orderItems = await db.find(
      'MarketplaceOrderItem',
      '"orderId" = $1',
      [(order as any).id]
    )

    return success({ order: { ...order, items: orderItems } }, 201)
  } catch (err) {
    console.error('Create order error:', err)
    return error('Internal server error', 500)
  }
}
