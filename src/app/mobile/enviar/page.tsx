'use client'

import { Send } from 'lucide-react'
import { MobileComingSoon } from '@/components/mobile/mobile-coming-soon'

export default function EnviarPage() {
  return (
    <MobileComingSoon
      title="Enviar"
      description="Envie encomendas e pacotes com a rede de entregadores NewMobility. Rápido e rastreado."
      icon={Send}
    />
  )
}
