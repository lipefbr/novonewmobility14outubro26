import { NextResponse } from 'next/server'

// ============================================================================
// /api/debug/pages — Page health checker (NO AUTH — for deploy debugging)
// ----------------------------------------------------------------------------
// Tests ALL page routes in the app by doing an internal HTTP fetch to each
// one. Returns for each page:
//   - path, group, label
//   - httpStatus (200, 404, 500, etc.)
//   - ok (boolean — 2xx or 3xx)
//   - redirected (boolean + location header)
//   - error (string — fetch error message)
//   - durationMs
//   - sizeBytes
//
// This is critical for diagnosing "page X doesn't open" issues after deploy
// without having to click through every route manually.
//
// Pages are tested in parallel batches to keep total time low.
// ============================================================================

interface PageDef {
  path: string
  group: 'backoffice' | 'mobile' | 'motorista' | 'lojista' | 'admingeral' | 'debug'
  label: string
  requiresAuth?: boolean // pages that redirect to /login when not authed
}

// Full inventory of page routes (kept in sync with src/app/**/page.tsx)
const PAGES: PageDef[] = [
  // Backoffice (root)
  { path: '/', group: 'backoffice', label: 'Backoffice (login/home)', requiresAuth: false },
  { path: '/debug', group: 'debug', label: 'Debug (esta página)' },

  // Mobile (cliente)
  { path: '/mobile/login', group: 'mobile', label: 'Login' },
  { path: '/mobile/inicio', group: 'mobile', label: 'Início', requiresAuth: true },
  { path: '/mobile/carteira', group: 'mobile', label: 'Carteira', requiresAuth: true },
  { path: '/mobile/pedidos', group: 'mobile', label: 'Pedidos', requiresAuth: true },
  { path: '/mobile/perfil', group: 'mobile', label: 'Perfil', requiresAuth: true },
  { path: '/mobile/enviar', group: 'mobile', label: 'Enviar', requiresAuth: true },
  { path: '/mobile/reserva', group: 'mobile', label: 'Reserva', requiresAuth: true },
  { path: '/mobile/procurar', group: 'mobile', label: 'Procurar', requiresAuth: true },
  { path: '/mobile/mercado', group: 'mobile', label: 'Mercado', requiresAuth: true },
  { path: '/mobile/shopping', group: 'mobile', label: 'Shopping', requiresAuth: true },
  { path: '/mobile/alimentacao', group: 'mobile', label: 'Alimentação', requiresAuth: true },
  { path: '/mobile/mobilidade', group: 'mobile', label: 'Mobilidade', requiresAuth: true },
  { path: '/mobile/medidrop', group: 'mobile', label: 'Medidrop', requiresAuth: true },
  { path: '/mobile/assistencia', group: 'mobile', label: 'Assistência', requiresAuth: true },

  // Motorista
  { path: '/motorista/login', group: 'motorista', label: 'Login' },
  { path: '/motorista/inicio', group: 'motorista', label: 'Início', requiresAuth: true },
  { path: '/motorista/carteira', group: 'motorista', label: 'Carteira', requiresAuth: true },
  { path: '/motorista/corridas', group: 'motorista', label: 'Corridas', requiresAuth: true },
  { path: '/motorista/mais', group: 'motorista', label: 'Mais', requiresAuth: true },

  // Lojista
  { path: '/lojista/login', group: 'lojista', label: 'Login' },
  { path: '/lojista/inicio', group: 'lojista', label: 'Início', requiresAuth: true },
  { path: '/lojista/pedidos', group: 'lojista', label: 'Pedidos', requiresAuth: true },
  { path: '/lojista/financeiro', group: 'lojista', label: 'Financeiro', requiresAuth: true },
  { path: '/lojista/mais', group: 'lojista', label: 'Mais', requiresAuth: true },

  // Admin Geral
  { path: '/admingeral/login', group: 'admingeral', label: 'Login' },
  { path: '/admingeral/inicio', group: 'admingeral', label: 'Início', requiresAuth: true },
]

interface PageResult {
  path: string
  group: string
  label: string
  requiresAuth?: boolean
  httpStatus: number | null
  ok: boolean
  redirected: boolean
  redirectLocation?: string | null
  error: string | null
  durationMs: number
  sizeBytes: number
}

async function testPage(baseUrl: string, page: PageDef): Promise<PageResult> {
  const startedAt = Date.now()
  const url = `${baseUrl}${page.path}`

  // 12s timeout — pages can take a while to compile on first hit (dev)
  const controller = new AbortController()
  const timeoutMs = 12000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual', // detect redirects without following
      signal: controller.signal,
      headers: {
        // Don't ask for cached responses — we want fresh compile each time
        'Cache-Control': 'no-cache',
      },
    })

    clearTimeout(timeout)
    const durationMs = Date.now() - startedAt
    const redirected = res.status >= 300 && res.status < 400
    const location = redirected ? res.headers.get('location') : null

    // Read body size (text length) for diagnostics — limit to 1MB to avoid OOM
    let sizeBytes = 0
    try {
      const cloned = res.clone()
      const text = await cloned.text()
      sizeBytes = text.length
    } catch {
      // ignore body read errors
    }

    // A page "works" if it returns 2xx (success) or 3xx (redirect — common for
    // auth-protected pages that redirect to /login).
    const ok = res.status >= 200 && res.status < 400

    return {
      path: page.path,
      group: page.group,
      label: page.label,
      requiresAuth: page.requiresAuth,
      httpStatus: res.status,
      ok,
      redirected,
      redirectLocation: location,
      error: null,
      durationMs,
      sizeBytes,
    }
  } catch (err) {
    clearTimeout(timeout)
    const durationMs = Date.now() - startedAt
    const aborted = err instanceof Error && err.name === 'AbortError'
    return {
      path: page.path,
      group: page.group,
      label: page.label,
      requiresAuth: page.requiresAuth,
      httpStatus: null,
      ok: false,
      redirected: false,
      redirectLocation: null,
      error: aborted ? `Timeout após ${timeoutMs / 1000}s` : (err instanceof Error ? err.message : String(err)),
      durationMs,
      sizeBytes: 0,
    }
  }
}

export async function GET(request: Request) {
  const startedAt = Date.now()

  // Build base URL from request host (works behind proxies / gateways)
  const url = new URL(request.url)
  const protocol = url.protocol || 'http:'
  const host = request.headers.get('host') || url.host || 'localhost:3000'
  const baseUrl = `${protocol}//${host}`

  // Test pages in parallel batches of 6 to avoid overwhelming the server
  // (Next.js dev compiles each page on first hit — heavy).
  const batchSize = 6
  const results: PageResult[] = []

  for (let i = 0; i < PAGES.length; i += batchSize) {
    const batch = PAGES.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map((p) => testPage(baseUrl, p)))
    results.push(...batchResults)
  }

  // Summary stats
  const total = results.length
  const okCount = results.filter((r) => r.ok).length
  const errorCount = results.filter((r) => !r.ok).length
  const redirectCount = results.filter((r) => r.redirected).length
  const timeoutCount = results.filter((r) => r.error?.startsWith('Timeout')).length

  // Group breakdown
  const groups: Record<string, { total: number; ok: number; error: number }> = {}
  for (const r of results) {
    if (!groups[r.group]) groups[r.group] = { total: 0, ok: 0, error: 0 }
    groups[r.group].total++
    if (r.ok) groups[r.group].ok++
    else groups[r.group].error++
  }

  return NextResponse.json({
    ok: errorCount === 0,
    timestamp: new Date().toISOString(),
    baseUrl,
    summary: {
      total,
      ok: okCount,
      error: errorCount,
      redirected: redirectCount,
      timeout: timeoutCount,
      durationMs: Date.now() - startedAt,
    },
    groups,
    pages: results,
  })
}
