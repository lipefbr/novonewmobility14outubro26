'use client'

import { CalendarCheck } from 'lucide-react'
import { MobileComingSoon } from '@/components/mobile/mobile-coming-soon'

export default function ReservaPage() {
  return (
    <MobileComingSoon
      title="Reserva"
      description="Reserve restaurantes, eventos e serviços com poucos toques. Tudo no app NewMobility."
      icon={CalendarCheck}
    />
  )
}
