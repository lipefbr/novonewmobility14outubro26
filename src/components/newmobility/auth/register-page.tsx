'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, Mail, Lock, User, Phone, CreditCard, Users, ArrowLeft, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const plans = [
  {
    id: 'blue3',
    name: 'Blue 3',
    price: 'R$ 200,00',
    priceValue: 200,
    features: ['CashBack Entrada', 'CashBack Residual', 'App Mobilidade', 'CashBack Farmácia', 'CashBack Refeição'],
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 'blue5',
    name: 'Blue 5 Premium',
    price: 'R$ 999,00',
    priceValue: 999,
    features: ['Tudo do Blue 3', 'CashBack Vendas', 'CashBack Shopping', 'Portal Gamer', 'Portal Sport Bet', 'Gratificações Premium'],
    color: 'from-emerald-600 to-emerald-800',
    popular: true,
  },
]

export function RegisterPage() {
  const { setAuthView, login } = useStore()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    plan: 'blue5',
    terms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check URL for referral code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      setFormData(prev => ({ ...prev, referralCode: ref.toUpperCase() }))
    }
  }, [])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.terms) return
    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      const data = await authApi.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cpf: formData.cpf,
        password: formData.password,
        referralCode: formData.referralCode || undefined,
        plan: formData.plan,
      })
      if (data.user) {
        login(data.user)
        toast.success('Conta criada com sucesso! Bem-vindo(a)!')
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white font-bold text-xl mb-3 shadow-lg shadow-emerald-600/25">
            NM
          </div>
          <h1 className="text-2xl font-bold text-gray-900">NewMobility</h1>
          <p className="text-sm text-gray-500 mt-1">Crie sua conta e comece agora</p>
        </div>

        <Card className="shadow-xl border-0 shadow-emerald-100/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-center">Cadastro</CardTitle>
            <CardDescription className="text-center">
              Preencha seus dados para criar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="reg-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Phone & CPF row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => handleChange('cpf', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Password row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      className="pl-10"
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
              </div>

              {/* Referral Code */}
              <div className="space-y-2">
                <Label htmlFor="referral">Código de Indicação</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="referral"
                    placeholder="Código de quem te indicou"
                    value={formData.referralCode}
                    onChange={(e) => handleChange('referral', e.target.value.toUpperCase())}
                    className="pl-10 uppercase"
                  />
                </div>
              </div>

              {/* Plan Selection */}
              <div className="space-y-3">
                <Label>Escolha seu Plano</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handleChange('plan', plan.id)}
                      className={cn(
                        "relative p-4 rounded-xl border-2 text-left transition-all",
                        formData.plan === plan.id
                          ? "border-emerald-500 bg-emerald-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-emerald-300"
                      )}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2.5 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          POPULAR
                        </span>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-gray-900">{plan.name}</span>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          formData.plan === plan.id ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
                        )}>
                          {formData.plan === plan.id && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                      <span className="text-xl font-bold text-emerald-700">{plan.price}</span>
                      <span className="text-xs text-gray-500 block">/taxa de uso</span>
                      <ul className="mt-2 space-y-1">
                        {plan.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                            <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                            {f}
                          </li>
                        ))}
                        {plan.features.length > 3 && (
                          <li className="text-xs text-gray-400">+{plan.features.length - 3} mais</li>
                        )}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.terms}
                  onCheckedChange={(checked) => handleChange('terms', !!checked)}
                />
                <label htmlFor="terms" className="text-sm text-gray-600 leading-snug cursor-pointer">
                  Aceito os <span className="text-emerald-600 font-medium">Termos de Uso</span> e{' '}
                  <span className="text-emerald-600 font-medium">Política de Privacidade</span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading || !formData.terms}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando conta...
                  </span>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <button
                  onClick={() => setAuthView('login')}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Entrar
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
