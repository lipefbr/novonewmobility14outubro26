'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2, LogOut, Wallet, Car, Bike, Store, Shield, Users,
  TrendingUp, Crown, Target, Gift, Headphones, Smartphone,
  Lock, ChevronRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { apiFetch } from '@/lib/api'
import { useStore } from '@/lib/store'
import { toast } from 'sonner'

// ============================================================================
// /mobile/inicio — Skeleton home screen for the NewMobility mobile app.
// ----------------------------------------------------------------------------
// Renders a feature grid based on the logged-in user's UserType.mobilePermissions
// (configured by the admin in the "Tipos de Usuário" tab).
//
// Flow:
//   1. Read the user from the Zustand store (populated by /mobile/login).
//   2. Fetch the user's UserType from /api/user-types?includeMobile=1 and find
//      the row whose code === user.qualification.
//   3. Render a grid of feature cards, one per mobilePermissions entry. Cards
//      the user doesn't have access to are shown locked (greyed out) so the
//      user can see what exists but can't tap them.
//   4. If the user has no UserType (qualification === null), we show a friendly
//      "contate o suporte" message.
//
// This is a skeleton — the actual feature screens (ride request, store, etc.)
// will be built next, once the user sends the design images.
// ============================================================================

// Master list of mobile features. The `key` matches the strings the admin
// toggles in the UserType panel. A feature not in this list still renders as
// a generic card (so admins can experiment with new keys).
const FEATURE_CATALOG: Record<string, { label: string; description: string; icon: typeof Car; color: string }> = {
  dashboard: { label: 'Início', description: 'Resumo da sua conta', icon: Smartphone, color: '#10b981' },
  wallet: { label: 'Carteira', description: 'Saldos e saques', icon: Wallet, color: '#3b82f6' },
  ride_request: { label: 'Pedir Corrida', description: 'Solicite um veículo', icon: Car, color: '#10b981' },
  ride_offer: { label: 'Ofertar Corrida', description: 'Receba corridas como motorista', icon: Car, color: '#f97316' },
  delivery: { label: 'Entregas', description: 'Receber entregas', icon: Bike, color: '#f97316' },
  store: { label: 'Loja', description: 'Comércio parceiro', icon: Store, color: '#ec4899' },
  cashback: { label: 'Cashback', description: 'Suas matrizes de cashback', icon: TrendingUp, color: '#06b6d4' },
  career: { label: 'Carreira', description: 'PINs e bônus de carreira', icon: Crown, color: '#a78bfa' },
  metas: { label: 'Metas', description: 'Metas de motorista/entregador', icon: Target, color: '#f59e0b' },
  indicacoes: { label: 'Indicações', description: 'Convide e ganhe', icon: Users, color: '#84cc16' },
  marketplace: { label: 'Marketplace', description: 'Compre produtos', icon: Store, color: '#ec4899' },
  telemedicina: { label: 'Telemedicina', description: 'Consultas online', icon: Shield, color: '#ef4444' },
  voucher: { label: 'Vouchers', description: 'Seus cupons e vouchers', icon: Gift, color: '#f59e0b' },
  support: { label: 'Suporte', description: 'Fale conosco', icon: Headphones, color: '#6366f1' },
}

interface UserTypeWithPerms {
  id: string
  code: string
  label: string
  icon: string | null
  color: string | null
  mobilePermissions: string[]
}

export default function MobileInicioPage() {
  const router = useRouter()
  const { user, logout } = useStore()
  const [userType, setUserType] = useState<UserTypeWithPerms | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      router.replace('/mobile/login')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await apiFetch<{ types: UserTypeWithPerms[] }>(
          '/user-types?includeMobile=1',
        )
        if (cancelled) return
        const types = data?.types || []
        // Find the user's type by their qualification code.
        const mine = user.qualification
          ? types.find((t) => t.code === user.qualification)
          : undefined
        setUserType(mine || null)
      } catch {
        if (!cancelled) toast.error('Erro ao carregar permissões')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user?.id, user?.qualification, router])

  const handleLogout = () => {
    logout()
    router.push('/mobile/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        <span className="ml-2 text-muted-foreground">Carregando...</span>
      </div>
    )
  }

  if (!user) return null

  const perms = userType?.mobilePermissions || []

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Status bar spacer */}
      <div className="h-[env(safe-area-inset-top)] bg-emerald-600" />

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-4 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-lg">
              {userType?.icon || '👤'}
            </div>
            <div>
              <p className="text-xs text-white/70">Olá,</p>
              <p className="font-semibold text-sm">{user.name?.split(' ')[0]}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white hover:bg-white/10 gap-1.5 h-8"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </Button>
        </div>

        {/* Type badge */}
        {userType ? (
          <div className="mt-3">
            <Badge className="bg-white/20 text-white hover:bg-white/20 border-0 gap-1">
              {userType.label}
            </Badge>
            <p className="text-[11px] text-white/70 mt-1">
              {perms.length} funcionalidade(s) disponível(is) para seu tipo de conta
            </p>
          </div>
        ) : (
          <div className="mt-3">
            <Badge className="bg-amber-500/30 text-white border-0">
              Sem tipo atribuído
            </Badge>
            <p className="text-[11px] text-white/70 mt-1">
              Contate o suporte para liberar funcionalidades.
            </p>
          </div>
        )}
      </div>

      {/* Feature grid */}
      <div className="flex-1 p-4 -mt-3">
        {perms.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-6 text-center">
              <Lock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">
                Nenhuma funcionalidade liberada
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Seu tipo de usuário não tem permissões mobile configuradas.
                Contate o administrador.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {perms.map((perm, idx) => {
              const feat = FEATURE_CATALOG[perm] || {
                label: perm,
                description: 'Funcionalidade em breve',
                icon: Smartphone,
                color: '#64748b',
              }
              const Icon = feat.icon
              return (
                <motion.div
                  key={perm}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col items-center text-center h-full">
                      <div
                        className="h-11 w-11 rounded-xl flex items-center justify-center mb-2"
                        style={{ backgroundColor: (feat.color || '#64748b') + '20' }}
                      >
                        <Icon className="h-5 w-5" style={{ color: feat.color }} />
                      </div>
                      <p className="text-xs font-semibold text-foreground">{feat.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                        {feat.description}
                      </p>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/40 mt-2" />
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Wallet quick preview */}
        <Card className="shadow-sm mt-4 bg-gradient-to-br from-emerald-600 to-teal-500 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wide text-white/70 font-semibold">
                Saldo Carteira Saque
              </span>
              <Wallet className="h-4 w-4 text-white/70" />
            </div>
            <p className="text-2xl font-bold">
              R$ {((user.balanceWithdrawal || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="grid grid-cols-3 gap-2 mt-3 text-[10px]">
              <div>
                <p className="text-white/60">Compras</p>
                <p className="font-semibold">
                  R$ {((user.balanceShopping || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-white/60">Pontos</p>
                <p className="font-semibold">{(user.careerPoints || 0).toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-white/60">Estrelas</p>
                <p className="font-semibold">{'⭐'.repeat(Math.min(user.stars || 0, 5))}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center mt-4">
          Skeleton do app mobile — em breve com mais funcionalidades.
        </p>
      </div>

      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  )
}
