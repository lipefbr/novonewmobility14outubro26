'use client'

import { Car } from 'lucide-react'
import { MobileComingSoon } from '@/components/mobile/mobile-coming-soon'

export default function MobilidadePage() {
  return (
    <MobileComingSoon
      title="Mobilidade"
      description="Solicite corridas e veículos NewMobility. Chegue onde precisa com segurança e cashback."
      icon={Car}
    />
  )
}
