import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// ============================================================================
// /api/admin/seed — Run database seed from the admin UI
// ----------------------------------------------------------------------------
// Lets the admin trigger seed steps from the web UI without needing SSH
// access to the VPS. All functions are idempotent (safe to call repeatedly).
//
// POST /api/admin/seed
//   body: { userId: <adminId>, step?: 'all' | 'users' | 'user-types' | ... }
//
// Steps available:
//   - all             → run all seed steps (default)
//   - users           → seedUsers() only (32 demo users + cleanup orphans)
//   - user-types      → seedUserTypes() only (14 types with defaultLevels)
//   - configs         → seedSystemConfigs() (12 config keys)
//   - plans           → seedPlans() (free / blue3 / blue5)
//   - career-plans    → seedCareerPlans() (5 pins: Safira → Imperial)
//   - cashback        → seedCashbackDemo() (9 demo entries)
//   - faqs            → seedFaqs() (6 FAQs)
//   - service-types   → seedServiceTypes() (15 service types)
//   - events          → seedEvents() (3 events)
//   - categories      → seedCategories() (8 app categories)
//   - announcements   → seedAnnouncements() (5 announcements)
//   - audit-logs      → seedAuditLogs() (10 sample audit logs)
//   - challenges      → seedChallenges() (7 gamification challenges)
// ============================================================================

// Dynamic import of seed functions — the seed file uses `bun run seed` /
// `tsx` style imports that might pull in node-only stuff. We wrap it in
// dynamic import so any error is captured at request time (not at build
// time, which would break the production build).
async function loadSeedModule() {
  // Use a runtime require-style import so the seed module is only loaded
  // when this endpoint is actually called (not when the route is compiled).
  // The seed.ts file uses `createHash` from node:crypto and other node-only
  // APIs that would break the Next.js build if statically imported.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/../../prisma/seed') as typeof import('@/../../prisma/seed')
}

async function requireAdmin(userId: string | null) {
  if (!userId) return null
  const admin = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, userType: true },
  })
  if (!admin || (admin.role !== 'admin' && admin.userType !== 'admin')) {
    return null
  }
  return admin
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { userId } = body
    const step: string = body.step || 'all'

    const admin = await requireAdmin(userId)
    if (!admin) return error('Unauthorized — admin access required', 403)

    const seedModule = await loadSeedModule()
    const startedAt = Date.now()
    const logs: string[] = []
    const originalLog = console.log
    console.log = (...args: unknown[]) => {
      logs.push(args.map((a) => (typeof a === 'string' ? a : String(a))).join(' '))
    }

    try {
      switch (step) {
        case 'all':
          await seedModule.main()
          break
        case 'users':
          await seedModule.seedUsers()
          break
        case 'user-types':
          await seedModule.seedUserTypes()
          break
        case 'configs':
          await seedModule.seedSystemConfigs()
          break
        case 'plans':
          await seedModule.seedPlans()
          break
        case 'career-plans':
          await seedModule.seedCareerPlans()
          break
        case 'goal-configs':
          await seedModule.seedGoalConfigs()
          break
        case 'streak-rewards':
          await seedModule.seedStreakRewards()
          break
        case 'service-types':
          await seedModule.seedServiceTypes()
          break
        case 'events':
          await seedModule.seedEvents()
          break
        case 'categories':
          await seedModule.seedCategories()
          break
        case 'faqs':
          await seedModule.seedFaqs()
          break
        case 'cashback':
          await seedModule.seedCashbackDemo()
          break
        case 'announcements':
          await seedModule.seedAnnouncements()
          break
        case 'audit-logs':
          await seedModule.seedAuditLogs()
          break
        case 'challenges':
          await seedModule.seedChallenges()
          break
        default:
          return error(
            `Unknown step: ${step}. Valid: all, users, user-types, configs, plans, career-plans, goal-configs, streak-rewards, service-types, events, categories, faqs, cashback, announcements, audit-logs, challenges`,
            400,
          )
      }
    } finally {
      console.log = originalLog
    }

    // Collect current DB counts for the response so the admin sees
    // what the seed produced.
    const counts = {
      users: await prisma.user.count(),
      userTypes: await prisma.userType.count(),
      plans: await prisma.plan.count(),
      careerPlans: await prisma.careerPlan.count(),
      cashbackEntries: await prisma.cashbackEntry.count(),
      cashbackResidual: await prisma.cashbackResidual.count(),
      cashbackSales: await prisma.cashbackSales.count(),
      serviceTypes: await prisma.serviceType.count(),
      events: await prisma.event.count(),
      faqs: await prisma.fAQ.count(),
      systemConfigs: await prisma.systemConfig.count(),
      announcements: await prisma.announcement.count(),
      auditLogs: await prisma.auditLog.count(),
      challenges: await prisma.challenge.count(),
    }

    const elapsedMs = Date.now() - startedAt
    return success({ step, elapsedMs, counts, logTail: logs.slice(-50) })
  } catch (err) {
    console.error('Admin seed endpoint error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return error(`Seed failed: ${message}`, 500)
  }
}

export async function GET(req: NextRequest) {
  // Returns current DB counts — useful for the admin UI to show "current
  // state" before/after running the seed.
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const admin = await requireAdmin(userId)
    if (!admin) return error('Unauthorized', 403)

    const counts = {
      users: await prisma.user.count(),
      userTypes: await prisma.userType.count(),
      plans: await prisma.plan.count(),
      careerPlans: await prisma.careerPlan.count(),
      cashbackEntries: await prisma.cashbackEntry.count(),
      cashbackResidual: await prisma.cashbackResidual.count(),
      cashbackSales: await prisma.cashbackSales.count(),
      serviceTypes: await prisma.serviceType.count(),
      events: await prisma.event.count(),
      faqs: await prisma.fAQ.count(),
      systemConfigs: await prisma.systemConfig.count(),
      announcements: await prisma.announcement.count(),
      auditLogs: await prisma.auditLog.count(),
      challenges: await prisma.challenge.count(),
    }

    return success({ counts, steps: [
      'all', 'users', 'user-types', 'configs', 'plans', 'career-plans',
      'goal-configs', 'streak-rewards', 'service-types', 'events',
      'categories', 'faqs', 'cashback', 'announcements', 'audit-logs', 'challenges',
    ] })
  } catch (err) {
    console.error('Admin seed GET error:', err)
    return error('Failed to fetch DB counts', 500)
  }
}
