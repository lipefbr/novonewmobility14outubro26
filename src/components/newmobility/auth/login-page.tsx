'use client'

import { useState } from 'react'
import { useStore, type UserData } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

function mapApiUserToUserData(apiUser: any, balances?: any): UserData {
  return {
    id: apiUser.id,
    name: apiUser.name || '',
    email: apiUser.email || '',
    phone: apiUser.phone || '',
    cpf: apiUser.cpf || '',
    plan: apiUser.plan || 'free',
    referralCode: apiUser.referralCode || '',
    referredById: apiUser.referredById || null,
    language: apiUser.language || 'pt',
    isActive: apiUser.isActive ?? true,
    balanceWithdrawal: balances?.withdrawal ?? apiUser.balanceWithdrawal ?? 0,
    balanceMobility: balances?.mobility ?? apiUser.balanceMobility ?? 0,
    balanceShopping: balances?.shopping ?? apiUser.balanceShopping ?? 0,
    balanceFood: balances?.food ?? apiUser.balanceFood ?? 0,
    balancePharmacy: balances?.pharmacy ?? apiUser.balancePharmacy ?? 0,
    balanceGratification: balances?.gratification ?? apiUser.balanceGratification ?? 0,
    careerPoints: apiUser.careerPoints ?? 0,
    personalPoints: apiUser.personalPoints ?? 0,
    stars: apiUser.stars ?? 0,
    isDriver: apiUser.isDriver ?? false,
    profileImage: apiUser.profileImage || null,
    createdAt: apiUser.createdAt || new Date().toISOString(),
  }
}

export function LoginPage() {
  const { setAuthView, login } = useStore()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (emailArg: string, passwordArg: string) => {
    setLoading(true)
    try {
      const data = await authApi.login(emailArg, passwordArg)
      if (data.user) {
        const userData = mapApiUserToUserData(data.user, data.balances)
        login(userData)
        toast.success(t('auth.login.success'))
      }
    } catch (err: any) {
      toast.error(err.message || t('auth.login.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    await handleLogin(email, password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
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
          <h1 className="text-2xl font-bold text-foreground">NewMobility</h1>
          <p className="text-sm text-muted-foreground mt-1">BackOffice - Área do Membro</p>
        </div>

        <Card className="shadow-xl border-0 shadow-emerald-100/50 dark:shadow-emerald-900/20 bg-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-center text-foreground">{t('auth.login.title')}</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {t('auth.login.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">{t('auth.login.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                <Label htmlFor="password" className="text-foreground">{t('auth.login.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    {t('auth.login.remember')}
                  </label>
                </div>
                <button type="button" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  {t('auth.login.forgot')}
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
                    {t('auth.login.entering')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {t('auth.login.submit')}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.login.noAccount')}{' '}
                <button
                  onClick={() => setAuthView('register')}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  {t('auth.login.register')}
                </button>
              </p>
            </div>

            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mb-1">🔑 Demo:</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Email: carlos.silva@email.com</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Senha: 123456</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-xs"
                onClick={() => handleLogin('carlos.silva@email.com', '123456')}
                disabled={loading}
              >
                {t('auth.login.demo')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {t('footer.copyright')}
        </p>
      </motion.div>
    </div>
  )
}
