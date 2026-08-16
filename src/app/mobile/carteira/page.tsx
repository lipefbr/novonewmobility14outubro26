'use client'

import { Wallet } from 'lucide-react'
import { MobileComingSoon } from '@/components/mobile/mobile-coming-soon'

export default function CarteiraPage() {
  return (
    <MobileComingSoon
      title="Carteira"
      description="Veja seu saldo, histórico de transações, cashback e saques. Mesma carteira do site NewMobility."
      icon={Wallet}
    />
  )
}
