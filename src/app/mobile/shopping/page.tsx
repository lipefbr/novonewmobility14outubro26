'use client'

import { ShoppingBag } from 'lucide-react'
import { MobileComingSoon } from '@/components/mobile/mobile-coming-soon'

export default function ShoppingPage() {
  return (
    <MobileComingSoon
      title="Shopping"
      description="Compre produtos das melhores lojas parceiras NewMobility. Cashback em cada compra."
      icon={ShoppingBag}
    />
  )
}
