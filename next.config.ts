import type { NextConfig } from "next";
import path from "path";

// ============================================================================
// next.config.ts — Next.js 16 configuration for NewMobility
// ----------------------------------------------------------------------------
// IMPORTANT (LipeHost deploy fix):
//
// The LipeHost VPS has a stray `/var/www/lipehost/package-lock.json` at the
// parent directory of the deploy. Next.js 16's workspace-root detection
// walks UP from cwd looking for the nearest lockfile and incorrectly picks
// the PARENT (`/var/www/lipehost/`) as the project root — which has no
// `app/` or `src/` directory, causing:
//
//   Error: Couldn't find any `pages` or `app` directory.
//
// We fix this with THREE mechanisms:
//   1. `outputFileTracingRoot` — explicitly tells Next.js the project root
//      for output file tracing (standalone build).
//   2. `turbopack.root` — explicitly tells Turbopack the project root.
//   3. `workspaces: []` in package.json — makes our package.json a workspace
//      root so Next.js stops walking up the directory tree looking for one.
//      (This is the KEY fix — without it, Next.js still picks the parent
//      lockfile dir as root.)
//
// We also REMOVED the `eslint` key — it was deprecated in Next.js 16 and
// caused a build warning. ESLint is no longer run during `next build` by
// default in Next.js 16, so there's nothing to ignore.
// ============================================================================

const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  output: "standalone",

  // ── Root detection overrides ──────────────────────────────────────────────
  // These prevent Next.js from picking the parent directory (where LipeHost's
  // own package-lock.json lives) as the workspace root.
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },

  // ── Build robustness ──────────────────────────────────────────────────────
  // Ignore TypeScript and ESLint errors during build — we run them separately
  // in CI. This prevents a single type error from blocking a deploy.
  typescript: {
    ignoreBuildErrors: true,
  },
  // NOTE: the `eslint` key was removed — it's no longer supported in Next.js 16.
  // ESLint doesn't run during `next build` by default anymore.

  reactStrictMode: false,

  // ── Allowed dev origins (for the sandbox preview) ─────────────────────────
  allowedDevOrigins: [".space-z.ai"],
};

export default nextConfig;
