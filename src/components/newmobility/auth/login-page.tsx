'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export function LoginPage() {
  const { setAuthView, login } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      const data = await authApi.login(email, password)
      if (data.user) {
        login(data.user)
        toast.success('Bem-vindo(a) de volta!')
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white font-bold text-2xl mb-4 shadow-lg shadow-emerald-600/25">
            NM
          </div>
          <h1 className="text-2xl font-bold text-gray-900">NewMobility</h1>
          <p className="text-sm text-gray-500 mt-1">BackOffice - Área do Membro</p>
        </div>

        <Card className="shadow-xl border-0 shadow-emerald-100/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-center">Entrar</CardTitle>
            <CardDescription className="text-center">
              Acesse sua conta para gerenciar seu negócio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                    Lembrar-me
                  </label>
                </div>
                <button type="button" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  Esqueceu a senha?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Entrar
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <button
                  onClick={() => setAuthView('register')}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Cadastre-se
                </button>
              </p>
            </div>

            <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-xs text-emerald-700 font-medium mb-1">🔑 Demo:</p>
              <p className="text-xs text-emerald-600">Email: carlos.silva@email.com</p>
              <p className="text-xs text-emerald-600">Senha: 123456</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-xs"
                onClick={async () => {
                  setEmail('carlos.silva@email.com')
                  setPassword('123456')
                  setLoading(true)
                  try {
                    const data = await authApi.login('carlos.silva@email.com', '123456')
                    if (data.user) {
                      login(data.user)
                      toast.success('Bem-vindo(a) de volta!')
                    }
                  } catch (err: any) {
                    toast.error(err.message || 'Erro ao fazer login.')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
              >
                Acesso Rápido Demo
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2025 @NewMobility. Todos os direitos reservados.
        </p>
      </motion.div>
    </div>
  )
}
