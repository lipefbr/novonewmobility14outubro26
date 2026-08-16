// ============================================================================
// /mobile/layout.tsx — Wrapper for all /mobile/* pages
// ----------------------------------------------------------------------------
// Prevents horizontal scroll on mobile pages by clamping overflow-x.
// This is a "belt and suspenders" fix — individual pages should still be
// designed to fit the viewport, but this ensures no accidental horizontal
// scroll from any element (negative margins, box-shadows, etc.).
// ============================================================================

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="overflow-x-hidden">{children}</div>
}
