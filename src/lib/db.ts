import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use NEON_DATABASE_URL from .env.local to avoid conflict with system DATABASE_URL
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL

export const db = globalForPrisma.prisma ?? new PrismaClient({
  datasourceUrl: connectionString,
  log: ['query'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
