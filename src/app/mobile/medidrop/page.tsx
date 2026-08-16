'use client'

import { Pill } from 'lucide-react'
import { MobileComingSoon } from '@/components/mobile/mobile-coming-soon'

export default function MediDropPage() {
  return (
    <MobileComingSoon
      title="MediDrop"
      description="Solicite medicamentos e produtos de farmácia com entrega expressa. MediDrop NewMobility."
      icon={Pill}
    />
  )
}
