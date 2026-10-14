import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// ============================================================================
// GET /api/uploads/[...path] — safe static file serving for runtime uploads.
// ----------------------------------------------------------------------------
// Task 15-d: profile photos (and other runtime uploads) are written to an
// uploads directory at RUNTIME, but `output: "standalone"` production only
// serves files that existed in `public/` at BUILD time. A `next.config.ts`
// rewrite maps `/uploads/:path*` → `/api/uploads/:path*`, so every upload URL
// (old values stored in User.profileImage and new ones) is served through this
// route, which reads from disk on every request and therefore works in both
// dev and standalone production.
//
// Base directory resolution:
//   - `process.env.UPLOADS_DIR` when set (production: point it at a PERSISTENT
//     path outside `.next/standalone/` so uploads survive redeploys), else
//   - `<cwd>/public/uploads` (dev default — identical to the old behavior).
//
// Security:
//   - Path traversal is rejected: each segment must not be `..` (defense in
//     depth), and the resolved absolute path must stay inside the base dir.
//   - Only image extensions are allowed: png, jpg, jpeg, webp, gif, svg.
//   - Missing files return a JSON 404 (never a directory listing / stack).
// ============================================================================

// Filenames are content-versioned via a `?t=<timestamp>` cache-buster on the
// URL, so responses can be cached aggressively.
const ALLOWED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'])

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
}

export const dynamic = 'force-dynamic'

function resolveUploadsBaseDir(): string {
  const configured = process.env.UPLOADS_DIR
  return configured
    ? path.resolve(configured)
    : path.resolve(process.cwd(), 'public', 'uploads')
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params

    if (!segments || segments.length === 0) {
      return NextResponse.json({ error: 'Caminho não informado' }, { status: 400 })
    }

    const baseDir = resolveUploadsBaseDir()

    // Defense in depth: reject traversal segments before touching the FS.
    // (Next.js decodes URL segments, so `%2e%2e` arrives here as `..`.)
    for (const segment of segments) {
      if (segment === '..' || segment === '.' || segment.includes('/') || segment.includes('\\')) {
        return NextResponse.json({ error: 'Caminho inválido' }, { status: 400 })
      }
    }

    const resolvedBase = path.resolve(baseDir)
    const resolvedFile = path.resolve(resolvedBase, ...segments)

    // The resolved absolute path MUST stay inside the base directory.
    if (resolvedFile !== resolvedBase && !resolvedFile.startsWith(resolvedBase + path.sep)) {
      return NextResponse.json({ error: 'Caminho inválido' }, { status: 400 })
    }

    // Extension allowlist (checked on the final resolved filename).
    const ext = path.extname(resolvedFile).slice(1).toLowerCase()
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: 'Tipo de arquivo não suportado' }, { status: 400 })
    }

    let stat: fs.Stats
    try {
      stat = await fs.promises.stat(resolvedFile)
    } catch {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
    }
    if (!stat.isFile()) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
    }

    const data = await fs.promises.readFile(resolvedFile)

    const headers: Record<string, string> = {
      'Content-Type': CONTENT_TYPES[ext],
      'Content-Length': String(stat.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    }
    // SVG can embed scripts when opened directly (not in <img> context) —
    // sandbox it to keep it purely presentational.
    if (ext === 'svg') {
      headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox"
    }

    return new NextResponse(new Uint8Array(data), { status: 200, headers })
  } catch (err) {
    console.error('Uploads serve error:', err)
    return NextResponse.json({ error: 'Erro ao servir arquivo' }, { status: 500 })
  }
}
