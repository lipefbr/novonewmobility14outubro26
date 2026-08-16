'use client'

import { User } from 'lucide-react'
import { MobileComingSoon } from '@/components/mobile/mobile-coming-soon'

export default function PerfilPage() {
  return (
    <MobileComingSoon
      title="Meu Perfil"
      description="Gerencie seus dados pessoais, endereço, documentos e preferências do app."
      icon={User}
    />
  )
}
