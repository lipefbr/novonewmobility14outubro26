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

    const where: any = { userId }
    if (status && status !== 'all') {
      where.status = status
    }

    const orders = await db.marketplaceOrder.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return success({ orders })
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
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return error('User not found', 404)
    }

    // Get products and calculate total
    let totalAmount = 0
    let totalCashback = 0
    const orderItemsData: any[] = []

    for (const item of items) {
      const product = await db.marketplaceProduct.findUnique({
        where: { id: item.productId },
      })
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
      await db.marketplaceProduct.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantity } },
      })
    }

    // Create order
    const order = await db.marketplaceOrder.create({
      data: {
        userId,
        totalAmount,
        cashbackEarned: totalCashback,
        shippingAddress: shippingAddress || null,
        paymentMethod: paymentMethod || null,
        status: paymentMethod === 'balance' ? 'processing' : 'pending',
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    })

    // If paying with balance, deduct from user
    if (paymentMethod === 'balance' && user.balanceWithdrawal >= totalAmount) {
      await db.user.update({
        where: { id: userId },
        data: {
          balanceWithdrawal: { decrement: totalAmount },
          balanceGratification: { increment: totalCashback },
        },
      })

      await db.marketplaceOrder.update({
        where: { id: order.id },
        data: { status: 'processing', paidAt: new Date() },
      })

      // Create transaction
      await db.transaction.create({
        data: {
          userId,
          type: 'marketplace_purchase',
          amount: -totalAmount,
          status: 'approved',
          category: 'marketplace',
          description: `Compra no Marketplace - Pedido #${order.id.slice(-8)}`,
        },
      })

      // Create cashback transaction
      if (totalCashback > 0) {
        await db.transaction.create({
          data: {
            userId,
            type: 'cashback_sales',
            amount: totalCashback,
            status: 'approved',
            category: 'marketplace',
            description: `CashBack Marketplace - Pedido #${order.id.slice(-8)}`,
          },
        })
      }
    } else if (paymentMethod === 'balance') {
      // Not enough balance
      await db.marketplaceOrder.delete({ where: { id: order.id } })
      // Restore stock
      for (const item of items) {
        await db.marketplaceProduct.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
      return error('Saldo insuficiente', 400)
    }

    return success({ order }, 201)
  } catch (err) {
    console.error('Create order error:', err)
    return error('Internal server error', 500)
  }
}
