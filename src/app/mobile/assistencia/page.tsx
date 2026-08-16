'use client'

import { LifeBuoy } from 'lucide-react'
import { MobileComingSoon } from '@/components/mobile/mobile-coming-soon'

export default function AssistenciaPage() {
  return (
    <MobileComingSoon
      title="Assistência"
      description="Solicite assistência veicular, mecânica e serviços de apoio 24h onde estiver."
      icon={LifeBuoy}
    />
  )
}
