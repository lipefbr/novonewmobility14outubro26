'use client'

import { useState, useEffect } from 'react'
import { useStore, type UserData } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, Mail, Lock, ArrowRight, DollarSign, TrendingUp, Users, Smartphone, Apple, Quote, Sparkles, Shield, Fingerprint, Globe, Lock as LockIcon, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ResetPasswordFlow } from './reset-password-flow'

function mapApiUserToUserData(apiUser: Record<string, unknown>, balances?: Record<string, number>): UserData {
  return {
    id: apiUser.id as string,
    name: (apiUser.name as string) || '',
    email: (apiUser.email as string) || '',
    phone: (apiUser.phone as string) || '',
    cpf: (apiUser.cpf as string) || '',
    plan: (apiUser.plan as string) || 'free',
    referralCode: (apiUser.referralCode as string) || '',
    referredById: (apiUser.referredById as string | null) || null,
    language: (apiUser.language as string) || 'pt',
    isActive: (apiUser.isActive as boolean) ?? true,
    balanceWithdrawal: balances?.withdrawal ?? (apiUser.balanceWithdrawal as number) ?? 0,
    balanceMobility: balances?.mobility ?? (apiUser.balanceMobility as number) ?? 0,
    balanceShopping: balances?.shopping ?? (apiUser.balanceShopping as number) ?? 0,
    balanceFood: balances?.food ?? (apiUser.balanceFood as number) ?? 0,
    balancePharmacy: balances?.pharmacy ?? (apiUser.balancePharmacy as number) ?? 0,
    balanceGratification: balances?.gratification ?? (apiUser.balanceGratification as number) ?? 0,
    balanceFree: balances?.free ?? (apiUser.balanceFree as number) ?? 0,
    balancePending: balances?.pending ?? (apiUser.balancePending as number) ?? 0,
    careerPoints: (apiUser.careerPoints as number) ?? 0,
    personalPoints: (apiUser.personalPoints as number) ?? 0,
    stars: (apiUser.stars as number) ?? 0,
    isDriver: (apiUser.isDriver as boolean) ?? false,
    userType: (apiUser.userType as 'usuario' | 'lojista' | 'motorista') ?? 'usuario',
    profileImage: (apiUser.profileImage as string | null) || null,
    createdAt: (apiUser.createdAt as string) || new Date().toISOString(),
  }
}

// Seeded pseudo-random for consistent SSR/client rendering
// Uses integer-based calculation to avoid floating-point differences between server/client
function seededRandom(seed: number) {
  // Math.abs ensures the result is always non-negative
  // (JavaScript modulo can return negative values for negative operands)
  const x = Math.abs(((Math.sin(seed + 1) * 10000) | 0) % 10000)
  return x / 10000
}

// Floating particles component - uses seeded random to avoid hydration mismatch
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: seededRandom(i * 7 + 1) * 100,
    y: seededRandom(i * 13 + 2) * 100,
    size: seededRandom(i * 3 + 5) * 4 + 2,
    duration: Math.max(0.5, seededRandom(i * 11 + 3) * 20 + 15),
    delay: Math.max(0, seededRandom(i * 5 + 7) * 10),
    opacity: seededRandom(i * 17 + 4) * 0.3 + 0.1,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-emerald-400/30 dark:bg-emerald-300/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0, 30, 0],
            x: [0, 15, 0, -15, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity, p.opacity * 0.5, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Network lines between particles - uses seeded random to avoid hydration mismatch
function NetworkLines() {
  const lines = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x1: seededRandom(i * 23 + 10) * 100,
    y1: seededRandom(i * 29 + 11) * 100,
    x2: seededRandom(i * 31 + 12) * 100,
    y2: seededRandom(i * 37 + 13) * 100,
    delay: Math.max(0, seededRandom(i * 41 + 14) * 5),
  }))

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.06]">
      {lines.map((l) => (
        <motion.line
          key={l.id}
          x1={`${l.x1}%`}
          y1={`${l.y1}%`}
          x2={`${l.x2}%`}
          y2={`${l.y2}%`}
          stroke="currentColor"
          strokeWidth="1"
          className="text-emerald-500"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.5, 0] }}
          transition={{
            duration: 8,
            delay: l.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </svg>
  )
}

// Testimonial rotator
const testimonials = [
  { text: 'O NewMobility mudou minha vida financeira!', author: 'Maria Santos', city: 'São Paulo' },
  { text: 'Em 3 meses já consegui uma renda extra incrível!', author: 'João Ferreira', city: 'Rio de Janeiro' },
  { text: 'O CashBack multi-nível é simplesmente fantástico.', author: 'Ana Oliveira', city: 'Belo Horizonte' },
  { text: 'Melhor oportunidade que já tive na vida!', author: 'Pedro Lima', city: 'Curitiba' },
]

export function LoginPage() {
  const { setAuthView, login, setActivePage } = useStore()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testimonialIdx, setTestimonialIdx] = useState(0)
  const [showResetPassword, setShowResetPassword] = useState(false)

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIdx((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleLogin = async (emailArg: string, passwordArg: string, isAdmin = false) => {
    setLoading(true)

    // Safety timeout: ensure loading is always reset even if the API call never resolves
    const safetyTimer = setTimeout(() => {
      setLoading(false)
      toast.error('A requisição demorou demais. Tente novamente.')
    }, 15_000)

    try {
      const data = await authApi.login(emailArg, passwordArg)
      clearTimeout(safetyTimer)
      if (data.user) {
        const userData = mapApiUserToUserData(data.user, data.balances)
        login(userData)
        if (isAdmin) {
          // Use setTimeout to avoid state update conflicts
          setTimeout(() => {
            useStore.getState().setActivePage('admin')
          }, 100)
        }
        toast.success(t('auth.login.success'))
      }
    } catch (err: unknown) {
      clearTimeout(safetyTimer)
      const errorMsg = err instanceof Error ? err.message : t('auth.login.error')
      toast.error(errorMsg)
    } finally {
      clearTimeout(safetyTimer)
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    await handleLogin(email, password)
  }

  const currentTestimonial = testimonials[testimonialIdx]

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.08) 0%, transparent 50%)',
            'radial-gradient(ellipse at 80% 20%, rgba(20,184,166,0.08) 0%, transparent 50%)',
            'radial-gradient(ellipse at 50% 80%, rgba(5,150,105,0.08) 0%, transparent 50%)',
            'radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.08) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating particles and network lines */}
      <FloatingParticles />
      <NetworkLines />

      {/* LEFT PANEL - Desktop only */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative z-10">
        <div className="w-full flex flex-col justify-center items-center px-12 xl:px-20 relative">
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-900" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

          <div className="relative z-10 max-w-md">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-10"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-600 text-white font-bold text-3xl mb-6 shadow-xl shadow-emerald-600/30">
                NM
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">NewMobility</h1>
              <p className="text-emerald-300 text-lg font-light">
                Conectando pessoas, transformando vidas
              </p>
            </motion.div>

            {/* Feature highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-4 mb-10"
            >
              {[
                { icon: DollarSign, title: 'CashBack Multi-Nível', desc: 'Ganhe em até 9 níveis da sua rede' },
                { icon: TrendingUp, title: 'Plano de Carreira', desc: 'Evolua e desbloqueie gratificações exclusivas' },
                { icon: Users, title: 'Rede de Indicações', desc: 'Compartilhe e construa sua renda residual' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.15 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="p-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30 group-hover:bg-emerald-600/30 transition-colors shrink-0">
                    <feature.icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
                    <p className="text-gray-400 text-xs mt-0.5">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* App download links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="flex gap-3"
            >
              <button className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition-colors">
                <Smartphone className="h-5 w-5 text-white" />
                <div className="text-left">
                  <p className="text-[9px] text-gray-400 uppercase">Download na</p>
                  <p className="text-xs text-white font-semibold -mt-0.5">Google Play</p>
                </div>
              </button>
              <button className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition-colors">
                <Apple className="h-5 w-5 text-white" />
                <div className="text-left">
                  <p className="text-[9px] text-gray-400 uppercase">Download na</p>
                  <p className="text-xs text-white font-semibold -mt-0.5">App Store</p>
                </div>
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Login form */}
      <div className="w-full lg:w-[55%] xl:w-[50%] flex flex-col items-center justify-center p-4 sm:p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Logo on mobile */}
          <div className="lg:hidden text-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white font-bold text-2xl mb-4 shadow-lg shadow-emerald-600/25"
            >
              NM
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground">NewMobility</h1>
            <p className="text-sm text-muted-foreground mt-1">BackOffice - Área do Membro</p>
          </div>

        {showResetPassword ? (
          <ResetPasswordFlow onBack={() => setShowResetPassword(false)} />
        ) : (
          <Card className="shadow-xl border-0 shadow-emerald-100/50 dark:shadow-emerald-900/20 bg-card/80 backdrop-blur-sm animated-gradient-border">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold text-center text-foreground">{t('auth.login.title')}</CardTitle>
              <CardDescription className="text-center text-muted-foreground typing-cursor-anim">
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
                  <button type="button" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium" onClick={() => setShowResetPassword(true)}>
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

              {/* Social login buttons */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 h-10"
                    onClick={() => toast.info('Login com Google em breve!')}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span className="text-sm">Google</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 h-10"
                    onClick={() => toast.info('Login com Apple em breve!')}
                  >
                    <Apple className="h-4 w-4" />
                    <span className="text-sm">Apple</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 h-10 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    onClick={() => toast.info('Login com biometria em breve!')}
                  >
                    <Fingerprint className="h-4 w-4" />
                    <span className="text-sm">Biometria</span>
                  </Button>
                </div>
              </div>

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

              {/* Demo credentials with pulsing border */}
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-2 border-emerald-300 dark:border-emerald-700 animate-shimmer-border relative">
                <div className="absolute -top-2 left-3">
                  <Badge className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 border-0 shadow-sm">DEMO</Badge>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold mb-1.5 mt-0.5">🔑 Acesso de Demonstração</p>
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <Mail className="h-3 w-3" />
                  <span>carlos.silva@email.com</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <Lock className="h-3 w-3" />
                  <span>123456</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-xs bg-white/50 dark:bg-black/20"
                  onClick={() => handleLogin('carlos.silva@email.com', '123456')}
                  disabled={loading}
                >
                  <Zap className="h-3.5 w-3.5 mr-1" />
                  {t('auth.login.demo')}
                </Button>

                </div>

              {/* Admin demo credentials */}
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-2 border-amber-300 dark:border-amber-700 relative">
                <div className="absolute -top-2 left-3">
                  <Badge className="bg-amber-600 text-white text-[9px] px-2 py-0.5 border-0 shadow-sm">ADMIN</Badge>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold mb-1.5 mt-0.5 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  Acesso Administrador
                </p>
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <Mail className="h-3 w-3" />
                  <span>admin@newmobility.com</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  <Lock className="h-3 w-3" />
                  <span>123456</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-xs bg-white/50 dark:bg-black/20"
                  onClick={() => handleLogin('admin@newmobility.com', '123456', true)}
                  disabled={loading}
                >
                  <Shield className="h-3.5 w-3.5 mr-1" />
                  Entrar como Admin
                </Button>
              </div>

              {/* Trust badges */}
              <div className="mt-5 flex items-center justify-center gap-3 text-muted-foreground">
                <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2.5 py-1">
                  <LockIcon className="h-3 w-3 text-emerald-500" />
                  <span className="text-[10px] font-medium">Dados Seguros</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2.5 py-1">
                  <Globe className="h-3 w-3 text-emerald-500" />
                  <span className="text-[10px] font-medium">Criptografia 128-bit</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2.5 py-1">
                  <Users className="h-3 w-3 text-emerald-500" />
                  <span className="text-[10px] font-medium">+10.000 Membros</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

          {/* Testimonial card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-6"
          >
            <div className="relative bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4 shadow-sm">
              <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-emerald-500 bg-card rounded-full p-0.5" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={testimonialIdx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="flex gap-3"
                >
                  <Quote className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground italic leading-relaxed">
                      &ldquo;{currentTestimonial.text}&rdquo;
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                      — {currentTestimonial.author}, {currentTestimonial.city}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
              {/* Dots indicator */}
              <div className="flex justify-center gap-1.5 mt-3">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTestimonialIdx(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === testimonialIdx ? 'w-4 bg-emerald-500' : 'w-1.5 bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {t('footer.copyright')}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
