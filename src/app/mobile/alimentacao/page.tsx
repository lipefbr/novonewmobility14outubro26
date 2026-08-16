'use client'

import { UtensilsCrossed } from 'lucide-react'
import { MobileComingSoon } from '@/components/mobile/mobile-coming-soon'

export default function AlimentacaoPage() {
  return (
    <MobileComingSoon
      title="Alimentação"
      description="Peça comida dos melhores restaurantes da sua cidade. Entrega rápida e cashback no cashback!"
      icon={UtensilsCrossed}
    />
  )
}
