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
//      The MobileDesktopRedirect component also GATES the children — on
//      desktop it shows a loading spinner instead of rendering the child
//      page (which prevents race conditions and API fetches that cause
//      "Application error" in production).
//
//   2. Prevents horizontal scroll on mobile pages by clamping overflow-x.
// ============================================================================

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MobileDesktopRedirect>
      <div className="overflow-x-hidden">{children}</div>
    </MobileDesktopRedirect>
  )
}
