// Database client using Prisma with SQLite
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Legacy db interface for backward compatibility with API routes
// Maps the old db.findOne/find/insert/update/deleteFrom/count patterns to Prisma calls
export const db = {
  async execute(query: string, params: any[] = []): Promise<any[]> {
    throw new Error('Raw SQL execute is not supported with Prisma. Use Prisma client methods instead.')
  },

  async findOne(table: string, conditions: string, params: any[] = []): Promise<any | null> {
    // Delegate to Prisma-based lookup
    if (table === 'User') {
      if (conditions.includes('"email"')) {
        return prisma.user.findUnique({ where: { email: params[0] } }) as any
      }
      if (conditions.includes('"id"')) {
        return prisma.user.findUnique({ where: { id: params[0] } }) as any
      }
      if (conditions.includes('"referralCode"')) {
        return prisma.user.findUnique({ where: { referralCode: params[0] } }) as any
      }
    }
    throw new Error(`findOne not implemented for table=${table} conditions=${conditions}`)
  },

  async find(table: string, conditions: string = '', params: any[] = [], extra: string = ''): Promise<any[]> {
    if (table === 'User') {
      if (conditions.includes('"referredById"')) {
        return prisma.user.findMany({ where: { referredById: params[0] } }) as any
      }
      if (conditions.includes('"role"')) {
        return prisma.user.findMany({ where: { role: params[0] } }) as any
      }
      if (conditions.includes('"isActive"')) {
        return prisma.user.findMany({ where: { isActive: params[0] } }) as any
      }
      if (!conditions) {
        return prisma.user.findMany() as any
      }
    }
    if (table === 'Notification') {
      if (conditions.includes('"userId"')) {
        return prisma.notification.findMany({ where: { userId: params[0] }, orderBy: { createdAt: 'desc' } }) as any
      }
    }
    if (table === 'Gratification') {
      if (conditions.includes('"userId"')) {
        return prisma.gratification.findMany({ where: { userId: params[0] } }) as any
      }
    }
    if (table === 'Transaction') {
      if (conditions.includes('"userId"')) {
        return prisma.transaction.findMany({ where: { userId: params[0] }, orderBy: { createdAt: 'desc' } }) as any
      }
    }
    if (table === 'Ticket') {
      if (conditions.includes('"userId"')) {
        return prisma.ticket.findMany({ where: { userId: params[0] }, orderBy: { createdAt: 'desc' } }) as any
      }
    }
    if (table === 'Voucher') {
      if (conditions.includes('"userId"')) {
        return prisma.voucher.findMany({ where: { userId: params[0] } }) as any
      }
    }
    if (table === 'CareerMilestone') {
      if (conditions.includes('"userId"')) {
        return prisma.careerMilestone.findMany({ where: { userId: params[0] } }) as any
      }
    }
    if (table === 'CashbackEntry') {
      if (conditions.includes('"userId"')) {
        return prisma.cashbackEntry.findMany({ where: { userId: params[0] }, orderBy: { createdAt: 'desc' } }) as any
      }
    }
    if (table === 'CashbackResidual') {
      if (conditions.includes('"userId"')) {
        return prisma.cashbackResidual.findMany({ where: { userId: params[0] }, orderBy: { createdAt: 'desc' } }) as any
      }
    }
    if (table === 'CashbackSales') {
      if (conditions.includes('"userId"')) {
        return prisma.cashbackSales.findMany({ where: { userId: params[0] }, orderBy: { createdAt: 'desc' } }) as any
      }
    }
    if (table === 'Invoice') {
      if (conditions.includes('"userId"')) {
        return prisma.invoice.findMany({ where: { userId: params[0] }, orderBy: { createdAt: 'desc' } }) as any
      }
    }
    if (table === 'SystemConfig') {
      return prisma.systemConfig.findMany() as any
    }
    if (table === 'Announcement') {
      return prisma.announcement.findMany({ where: { isActive: true } }) as any
    }
    throw new Error(`find not implemented for table=${table} conditions=${conditions}`)
  },

  async insert(table: string, data: Record<string, any>): Promise<any> {
    if (table === 'User') {
      return prisma.user.create({ data }) as any
    }
    if (table === 'Transaction') {
      return prisma.transaction.create({ data }) as any
    }
    if (table === 'Ticket') {
      return prisma.ticket.create({ data }) as any
    }
    if (table === 'TicketMessage') {
      return prisma.ticketMessage.create({ data }) as any
    }
    if (table === 'Notification') {
      return prisma.notification.create({ data }) as any
    }
    if (table === 'CashbackEntry') {
      return prisma.cashbackEntry.create({ data }) as any
    }
    if (table === 'CashbackResidual') {
      return prisma.cashbackResidual.create({ data }) as any
    }
    if (table === 'CashbackSales') {
      return prisma.cashbackSales.create({ data }) as any
    }
    if (table === 'Gratification') {
      return prisma.gratification.create({ data }) as any
    }
    if (table === 'Voucher') {
      return prisma.voucher.create({ data }) as any
    }
    if (table === 'CareerMilestone') {
      return prisma.careerMilestone.create({ data }) as any
    }
    if (table === 'MatrixPosition') {
      return prisma.matrixPosition.create({ data }) as any
    }
    if (table === 'PointTransaction') {
      return prisma.pointTransaction.create({ data }) as any
    }
    if (table === 'Invoice') {
      return prisma.invoice.create({ data }) as any
    }
    if (table === 'SystemConfig') {
      return prisma.systemConfig.create({ data }) as any
    }
    if (table === 'GamificationStreak') {
      return prisma.gamificationStreak.create({ data }) as any
    }
    if (table === 'UserChallenge') {
      return prisma.userChallenge.create({ data }) as any
    }
    if (table === 'Event') {
      return prisma.event.create({ data }) as any
    }
    if (table === 'EventRegistration') {
      return prisma.eventRegistration.create({ data }) as any
    }
    if (table === 'Beneficiary') {
      return prisma.beneficiary.create({ data }) as any
    }
    if (table === 'MarketplaceProduct') {
      return prisma.marketplaceProduct.create({ data }) as any
    }
    if (table === 'MarketplaceOrder') {
      return prisma.marketplaceOrder.create({ data }) as any
    }
    if (table === 'MarketplaceOrderItem') {
      return prisma.marketplaceOrderItem.create({ data }) as any
    }
    if (table === 'Announcement') {
      return prisma.announcement.create({ data }) as any
    }
    throw new Error(`insert not implemented for table=${table}`)
  },

  async update(table: string, conditions: string, data: Record<string, any>, conditionParams: any[] = []): Promise<any> {
    if (table === 'User') {
      if (conditions.includes('"id"')) {
        return prisma.user.update({ where: { id: conditionParams[0] }, data }) as any
      }
      if (conditions.includes('"email"')) {
        return prisma.user.update({ where: { email: conditionParams[0] }, data }) as any
      }
    }
    if (table === 'Gratification') {
      if (conditions.includes('"id"')) {
        return prisma.gratification.update({ where: { id: conditionParams[0] }, data }) as any
      }
    }
    if (table === 'Transaction') {
      if (conditions.includes('"id"')) {
        return prisma.transaction.update({ where: { id: conditionParams[0] }, data }) as any
      }
    }
    if (table === 'Ticket') {
      if (conditions.includes('"id"')) {
        return prisma.ticket.update({ where: { id: conditionParams[0] }, data }) as any
      }
    }
    if (table === 'Notification') {
      if (conditions.includes('"id"')) {
        return prisma.notification.update({ where: { id: conditionParams[0] }, data }) as any
      }
    }
    if (table === 'Voucher') {
      if (conditions.includes('"id"')) {
        return prisma.voucher.update({ where: { id: conditionParams[0] }, data }) as any
      }
    }
    if (table === 'SystemConfig') {
      if (conditions.includes('"key"')) {
        return prisma.systemConfig.update({ where: { key: conditionParams[0] }, data }) as any
      }
    }
    if (table === 'GamificationStreak') {
      if (conditions.includes('"userId"')) {
        return prisma.gamificationStreak.update({ where: { userId: conditionParams[0] }, data }) as any
      }
    }
    if (table === 'UserChallenge') {
      if (conditions.includes('"id"')) {
        return prisma.userChallenge.update({ where: { id: conditionParams[0] }, data }) as any
      }
    }
    if (table === 'MarketplaceProduct') {
      if (conditions.includes('"id"')) {
        return prisma.marketplaceProduct.update({ where: { id: conditionParams[0] }, data }) as any
      }
    }
    if (table === 'MarketplaceOrder') {
      if (conditions.includes('"id"')) {
        return prisma.marketplaceOrder.update({ where: { id: conditionParams[0] }, data }) as any
      }
    }
    if (table === 'Invoice') {
      if (conditions.includes('"id"')) {
        return prisma.invoice.update({ where: { id: conditionParams[0] }, data }) as any
      }
    }
    throw new Error(`update not implemented for table=${table} conditions=${conditions}`)
  },

  async deleteFrom(table: string, conditions: string, params: any[] = []): Promise<any> {
    if (table === 'Notification') {
      if (conditions.includes('"id"')) {
        return prisma.notification.delete({ where: { id: params[0] } }) as any
      }
    }
    if (table === 'MarketplaceProduct') {
      if (conditions.includes('"id"')) {
        return prisma.marketplaceProduct.delete({ where: { id: params[0] } }) as any
      }
    }
    if (table === 'MarketplaceOrder') {
      if (conditions.includes('"id"')) {
        return prisma.marketplaceOrder.delete({ where: { id: params[0] } }) as any
      }
    }
    throw new Error(`deleteFrom not implemented for table=${table} conditions=${conditions}`)
  },

  async count(table: string, conditions: string = '', params: any[] = []): Promise<number> {
    if (table === 'User') {
      if (!conditions) return prisma.user.count()
      if (conditions.includes('"role"')) return prisma.user.count({ where: { role: params[0] } })
      if (conditions.includes('"isActive"')) return prisma.user.count({ where: { isActive: params[0] } })
      if (conditions.includes('"referredById"')) return prisma.user.count({ where: { referredById: params[0] } })
    }
    if (table === 'Transaction') {
      if (conditions.includes('"userId"')) return prisma.transaction.count({ where: { userId: params[0] } })
    }
    if (table === 'Notification') {
      if (conditions.includes('"userId"')) return prisma.notification.count({ where: { userId: params[0] } })
    }
    throw new Error(`count not implemented for table=${table} conditions=${conditions}`)
  },
}
