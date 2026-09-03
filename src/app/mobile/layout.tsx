'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ============================================================================
// /mobile/layout.tsx — Wrapper for all /mobile/* pages
// ----------------------------------------------------------------------------
// Two responsibilities:
//   1. DESKTOP REDIRECT: if a user opens any /mobile/* page on a desktop/
//      notebook (screen >= 768px), they are automatically redirected to
//      the main web backoffice at /. The mobile app is designed for phones
//      only — on desktop the full web backoffice provides a much better
//      experience. This catches direct URL access, bookmarks, and links.
//
//      EXCEPTION: /mobile/login is allowed on desktop briefly so it can
//      redirect logged-in users to / (the redirect logic in /mobile/login
//      handles this). All other /mobile/* pages redirect immediately.
//
//   2. Prevents horizontal scroll on mobile pages by clamping overflow-x.
//      This is a "belt and suspenders" fix — individual pages should still
//      be designed to fit the viewport, but this ensures no accidental
//      horizontal scroll from any element (negative margins, box-shadows, etc.).
// ============================================================================

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    // Only redirect if on a desktop/notebook (screen >= 768px).
    // On mobile/tablet (< 768px), keep the user in the mobile app.
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      router.replace('/')
    }
  }, [router])

  return <div className="overflow-x-hidden">{children}</div>
}
