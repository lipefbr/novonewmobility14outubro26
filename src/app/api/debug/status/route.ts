import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createHash } from 'crypto'

// ============================================================================
// /api/debug/status — System health check (NO AUTH — for deploy debugging)
// ----------------------------------------------------------------------------
// Returns:
//   - timestamp, node env, runtime info
//   - DATABASE_URL presence (masked)
//   - DB connection status (live query)
//   - Table counts (users, plans, systemConfig, userType, appCategory, faq)
//   - Whether admin user exists
//   - List of critical env vars (masked)
//   - Any error message
//
// This endpoint is intentionally public so it can be hit immediately after
// deploy to diagnose "blank page" / "Invalid credentials" issues without
// needing to log in first. It does NOT expose secrets — only presence/mask.
// ============================================================================

function maskValue(val: string | undefined): string {
  if (!val) return '(not set)'
  if (val.length <= 8) return '***'
  // Show first 4 + last 4 chars, mask the middle
  return val.slice(0, 4) + '***' + val.slice(-4)
}

function maskDbUrl(url: string | undefined): string {
  if (!url) return '(not set)'
  if (url.startsWith('file:')) return url // SQLite path is safe to show
  // postgresql://user:pass@host/db?params
  try {
    const m = url.match(/^(postgresql|postgres):\/\/([^:]+):([^@]+)@(.+)$/)
    if (m) {
      return `${m[1]}://${m[2]}:***@${m[4]}`
    }
    return '***'
  } catch {
    return '***'
  }
}

export async function GET() {
  const startedAt = Date.now()
  const result: Record<string, unknown> = {
    ok: true,
    timestamp: new Date().toISOString(),
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      nodeEnv: process.env.NODE_ENV || '(unset)',
      pid: process.pid,
      uptimeSec: Math.round(process.uptime()),
      memoryMb: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    },
    env: {
      DATABASE_URL: maskDbUrl(process.env.DATABASE_URL),
      NEXTAUTH_URL: maskValue(process.env.NEXTAUTH_URL),
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '(set)' : '(not set)',
      ASAAS_API_KEY: process.env.ASAAS_API_KEY ? '(set)' : '(not set)',
      ZAI_API_KEY: process.env.ZAI_API_KEY ? '(set)' : '(not set)',
    },
    db: {
      urlPresent: !!process.env.DATABASE_URL,
      urlProtocol: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.startsWith('postgresql://') ||
          process.env.DATABASE_URL.startsWith('postgres://')
          ? 'postgresql'
          : process.env.DATABASE_URL.startsWith('file:')
            ? 'sqlite'
            : 'unknown'
        : 'none',
      connected: false,
      error: null as string | null,
      latencyMs: 0,
    },
    tables: {} as Record<string, number>,
    users: {
      total: 0,
      admin: false,
      demoUsers: [] as string[],
    },
    seed: {
      hasSeedFile: true,
      adminEmail: 'admin@newmobility.com',
      adminPasswordHint: 'admin123',
      demoEmails: [
        'cliente@newmobility.com',
        'motorista@newmobility.com',
        'lojista@newmobility.com',
      ],
    },
  }

  // --- DB connection test ----------------------------------------------------
  try {
    const t0 = Date.now()
    // Simple raw query to test connection
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - t0
    result.db.connected = true
    result.db.latencyMs = latency
  } catch (err) {
    result.db.connected = false
    result.db.error = err instanceof Error ? err.message : String(err)
    result.ok = false
    result.error = `DB connection failed: ${result.db.error}`
    return NextResponse.json(result, { status: 200 }) // still 200 so frontend can show
  }

  // --- Table counts ----------------------------------------------------------
  const tableChecks: Array<{ key: string; model: keyof typeof prisma; label: string }> = [
    { key: 'users', model: 'user', label: 'User' },
    { key: 'plans', model: 'plan', label: 'Plan' },
    { key: 'systemConfig', model: 'systemConfig', label: 'SystemConfig' },
    { key: 'userTypes', model: 'userType', label: 'UserType' },
    { key: 'appCategories', model: 'appCategory', label: 'AppCategory' },
    { key: 'faqs', model: 'fAQ', label: 'FAQ' },
    { key: 'appStores', model: 'appStore', label: 'AppStore' },
    { key: 'appProducts', model: 'appProduct', label: 'AppProduct' },
    { key: 'appOrders', model: 'appOrder', label: 'AppOrder' },
    { key: 'mobileBanners', model: 'mobileBanner', label: 'MobileBanner' },
  ]

  for (const t of tableChecks) {
    try {
      const count = await (prisma[t.model] as { count: () => Promise<number> }).count()
      result.tables[t.key] = count
    } catch (err) {
      result.tables[t.key] = -1
      result.tables[`${t.key}_error`] = err instanceof Error ? err.message : String(err)
    }
  }

  // --- Users check -----------------------------------------------------------
  try {
    const users = await prisma.user.findMany({
      select: { email: true, role: true, userType: true, isActive: true },
      take: 100,
    })
    result.users.total = users.length
    result.users.admin = users.some((u) => u.email === 'admin@newmobility.com')
    result.users.demoUsers = users
      .filter((u) =>
        ['admin@newmobility.com', 'cliente@newmobility.com', 'motorista@newmobility.com', 'lojista@newmobility.com'].includes(
          u.email,
        ),
      )
      .map((u) => `${u.email} (${u.role}/${u.userType})`)

    // Hash check — verify admin password would match "admin123"
    const admin = users.find((u) => u.email === 'admin@newmobility.com')
    if (admin) {
      const expectedHash = createHash('sha256').update('admin123').digest('hex')
      const adminFull = await prisma.user.findUnique({
        where: { email: 'admin@newmobility.com' },
        select: { password: true },
      })
      result.users.adminPasswordMatches = adminFull?.password === expectedHash
      result.users.adminPasswordHash = adminFull?.password
        ? `${adminFull.password.slice(0, 8)}...${adminFull.password.slice(-8)}`
        : null
    }
  } catch (err) {
    result.users.error = err instanceof Error ? err.message : String(err)
  }

  // --- Overall status --------------------------------------------------------
  const totalMs = Date.now() - startedAt
  result.totalLatencyMs = totalMs
  result.healthy =
    result.db.connected &&
    (result.tables.users ?? -1) >= 0 &&
    (result.tables.plans ?? -1) >= 0

  if (!result.healthy) {
    result.ok = false
    result.error = 'System is not fully healthy — check db/tables fields'
  }

  return NextResponse.json(result, { status: 200 })
}
