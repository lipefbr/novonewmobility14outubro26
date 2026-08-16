'use client'

import { ClipboardList } from 'lucide-react'
import { MobileComingSoon } from '@/components/mobile/mobile-coming-soon'

export default function PedidosPage() {
  return (
    <MobileComingSoon
      title="Meus Pedidos"
      description="Acompanhe seus pedidos, status de entrega e histórico de compras em um só lugar."
      icon={ClipboardList}
    />
  )
}
