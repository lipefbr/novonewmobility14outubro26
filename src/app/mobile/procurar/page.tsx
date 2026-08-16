'use client'

import { Search } from 'lucide-react'
import { MobileComingSoon } from '@/components/mobile/mobile-coming-soon'

export default function ProcurarPage() {
  return (
    <MobileComingSoon
      title="Procurar"
      description="Busque por produtos, lojas, restaurantes e serviços em toda a rede NewMobility."
      icon={Search}
    />
  )
}
