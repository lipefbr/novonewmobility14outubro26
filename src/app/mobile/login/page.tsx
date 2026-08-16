'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Car, Shield, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { useStore } from '@/lib/store'

// ============================================================================
// /mobile/login — Skeleton login page for the upcoming NewMobility mobile app.
// ----------------------------------------------------------------------------
// This is the entry point for the mobile web app (PWA-style). After login we
// redirect to /mobile/inicio which renders a feature grid based on the user's
// UserType.mobilePermissions (configured by the admin in the "Tipos de
// Usuário" tab).
//
// Reuses the same /api/auth/login endpoint as the main backoffice so a single
// account works on both surfaces.
// ============================================================================

export default function MobileLoginPage() {
  const router = useRouter()
  const { login } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      toast.error('Informe email e senha')
      return
    }
    setLoading(true)
    try {
      const data = await apiFetch<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      })
      if (data?.user) {
        login(data.user, data.token)
        toast.success(`Bem-vindo, ${data.user.name?.split(' ')[0] || 'usuário'}!`)
        router.push('/mobile/inicio')
      } else {
        toast.error('Resposta inválida do servidor')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500">
      {/* Status bar spacer for mobile safe area */}
      <div className="h-[env(safe-area-inset-top)]" />

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-white/20 backdrop-blur items-center justify-center mb-3">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">NewMobility</h1>
          <p className="text-sm text-white/80 mt-1">App Mobile</p>
        </div>

        {/* Login card */}
        <Card className="w-full max-w-sm shadow-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-600" />
              Entrar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Acessar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 pt-3 border-t text-center">
              <p className="text-[11px] text-muted-foreground">
                Use a mesma conta do backoffice. As funcionalidades disponíveis
                dependem do seu tipo de usuário.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-[10px] text-white/60 mt-6 text-center max-w-xs">
          Skeleton do app mobile — em breve com mapas, corridas e loja integrada.
        </p>
      </div>

      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  )
}
