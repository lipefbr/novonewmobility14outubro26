'use client'

import { ShoppingCart } from 'lucide-react'
import { MobileComingSoon } from '@/components/mobile/mobile-coming-soon'

export default function MercadoPage() {
  return (
    <MobileComingSoon
      title="Mercado"
      description="Faça suas compras de mercado sem sair de casa. Receba em casa com o app NewMobility."
      icon={ShoppingCart}
    />
  )
}
