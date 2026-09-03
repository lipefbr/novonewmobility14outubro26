'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// ============================================================================
// MobileDesktopRedirect — Client component that redirects /mobile/* pages
// to the web backoffice (/) when accessed on a desktop/notebook (>= 768px).
// ----------------------------------------------------------------------------
// Rendered inside MobileLayout (a server component). This separation is
// required by Next.js App Router — making the layout itself a client
// component causes "Application error: a client-side exception" in
// production builds.
//
// The redirect fires on mount (useEffect, client-side only). On mobile
// devices (< 768px), it does nothing — the user stays in the mobile app.
// ============================================================================

export function MobileDesktopRedirect() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only redirect if on a desktop/notebook (screen >= 768px).
    // On mobile/tablet (< 768px), keep the user in the mobile app.
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      router.replace('/')
    }
  }, [router, pathname])

  return null
}
