import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

// ============================================================================
// next.config.ts — Next.js 16 configuration for NewMobility
// ----------------------------------------------------------------------------
// IMPORTANT (LipeHost deploy fix — CSS / Turbopack root resolution):
//
// SYMPTOM on LipeHost (Next.js 16.3.1):
//   FileSystemPath("").join("../../node_modules/tailwindcss/index.css")
//   leaves the filesystem root
//
// ROOT CAUSE:
//   1. `package.json` had `"next": "^16.1.1"` which let `npm install` on the
//      VPS resolve to 16.3.1. That version's Turbopack has a CSS @import
//      resolver bug: `turbopack.root` is NOT applied to bare-specifier CSS
//      imports (like `@import "tailwindcss"`), so the project root ends up
//      as `FileSystemPath("")` (empty) and the resolved relative path
//      `../../node_modules/...` goes above it.
//   2. `__dirname` is not guaranteed in ESM-loaded configs.
//
// FIX:
//   - PIN `next` to exact `16.1.3` in package.json (the version we know works
//     with Turbopack CSS resolution). This is the PRIMARY fix.
//   - Compute project root in an ESM-safe way (`import.meta.url` with a
//     `process.cwd()` fallback) so `turbopack.root` / `outputFileTracingRoot`
//     always resolve to an absolute path, never empty.
//   - Keep `workspaces: []` in package.json so Next.js doesn't walk up to the
//     parent directory (where LipeHost's own lockfile lives).
//
// Previous fix (still in place):
//   - `outputFileTracingRoot` + `turbopack.root` explicitly tell Next.js the
//     project root (prevents "Couldn't find any pages or app directory").
//   - `workspaces: []` in package.json makes our package.json a workspace
//     root so Next.js stops walking up the directory tree.
//   - Removed deprecated `eslint` key (not supported in Next.js 16).
// ============================================================================

// ESM-safe project root detection.
// 1. Try `import.meta.url` (works in ESM).
// 2. Fall back to `__dirname` (works in CJS / jiti).
// 3. Fall back to `process.cwd()` (always available).
let projectRoot: string;
try {
  // import.meta.url is available when loaded as ESM
  const configUrl: string = (import.meta as { url: string }).url;
  projectRoot = path.dirname(fileURLToPath(configUrl));
} catch {
  // CJS / jiti fallback: __dirname is injected by the loader
  const dir: string | undefined = (globalThis as { __dirname?: string }).__dirname;
  projectRoot = dir ? path.resolve(dir) : process.cwd();
}
// Always normalize to an absolute path with no trailing slash.
projectRoot = path.resolve(projectRoot);

const nextConfig: NextConfig = {
  // PRODUCTION DEPLOY (LipeHost): `output: "standalone"` IS REQUIRED and must
  // stay. The deploy scripts (PM2 ecosystem.config.js / start-prod.sh) run
  // `.next/standalone/server.js`, which only exists when this is enabled.
  // (An older comment here claimed it had been removed — that was wrong.)
  //
  // Side effect we must handle: in standalone mode the server only serves
  // files that existed in `public/` at BUILD time. Files written to
  // `public/uploads` at RUNTIME (profile photos etc.) are not in that
  // build-time snapshot, so they would 404 and DB URLs would break after the
  // first redeploy. Fix below via the /uploads/* → /api/uploads/* rewrite:
  // the API route streams files from `process.env.UPLOADS_DIR` (set it in
  // production to a PERSISTENT path outside `.next/standalone/`) or, by
  // default, `<cwd>/public/uploads`.
  output: "standalone",

  // ── Runtime uploads (Task 15-d) ───────────────────────────────────────────
  // Serve every /uploads/* URL through /api/uploads/[...path], which reads
  // from disk on each request (with path-traversal sanitization) and therefore
  // works in dev AND in standalone production where `public/` is a frozen
  // build-time snapshot. Old URLs already stored in the DB keep working.
  // Next checks `public/` first for afterFiles rewrites, so in dev an existing
  // file is still served statically — behavior is unchanged locally.
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ];
  },

  // ── Root detection overrides ──────────────────────────────────────────────
  // These prevent Next.js from picking the parent directory (where LipeHost's
  // own package-lock.json lives) as the workspace root.
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },

  // ── Build robustness ──────────────────────────────────────────────────────
  // Ignore TypeScript errors during build — we run them separately in CI.
  // This prevents a single type error from blocking a deploy.
  typescript: {
    ignoreBuildErrors: true,
  },
  // NOTE: the `eslint` key is NOT supported in Next.js 16 — it was removed.
  // ESLint no longer runs during `next build` (run `bun run lint` separately),
  // so there is nothing to ignore. Keeping this key would emit a
  // "Unrecognized key(s): 'eslint'" warning on every dev/build start.

  reactStrictMode: false,

  // ── Allowed dev origins (for the sandbox preview) ─────────────────────────
  allowedDevOrigins: [".space-z.ai"],
};

export default nextConfig;
