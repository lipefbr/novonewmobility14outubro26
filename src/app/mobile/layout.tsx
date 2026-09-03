import { MobileDesktopRedirect } from '@/components/mobile/mobile-desktop-redirect'

// ============================================================================
// /mobile/layout.tsx — Wrapper for all /mobile/* pages (SERVER COMPONENT)
// ----------------------------------------------------------------------------
// Two responsibilities:
//   1. DESKTOP REDIRECT: renders <MobileDesktopRedirect /> (a client
//      component) which redirects /mobile/* to / on screens >= 768px.
//      The redirect logic is in a separate client component because
//      making the layout itself a client component causes "Application
//      error: a client-side exception" in production builds.
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
  return (
    <div className="overflow-x-hidden">
      <MobileDesktopRedirect />
      {children}
    </div>
  )
}
