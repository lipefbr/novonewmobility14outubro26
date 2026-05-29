'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { plansApi } from '@/lib/api'
import { formatCurrency, formatDate, getPlanName, getPlanPrice } from '@/lib/utils'
import {
  CreditCard, Check, Star, ArrowUpRight, FileText, Calendar,
  Shield, Car, Pill, ShoppingBag, Gamepad2, Trophy, Phone,
  Heart, Zap, Gift, Users, Smartphone, Clock, Calculator, TrendingUp, Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { toast } from 'sonner'

const mockInvoices = [
  { id: '1', type: 'plan_blue5', amount: 99900, status: 'paid', dueDate: '2025-01-05', paidAt: '2025-01-03' },
  { id: '2', type: 'plan_blue5', amount: 99900, status: 'paid', dueDate: '2024-12-05', paidAt: '2024-12-04' },
  { id: '3', type: 'plan_blue5', amount: 99900, status: 'paid', dueDate: '2024-11-05', paidAt: '2024-11-05' },
  { id: '4', type: 'plan_blue5', amount: 99900, status: 'pending', dueDate: '2025-02-05', paidAt: null },
  { id: '5', type: 'residual_entry', amount: 20000, status: 'paid', dueDate: '2024-10-15', paidAt: '2024-10-14' },
]

const invoiceTypeLabels: Record<string, string> = {
  plan_blue3: 'Plano Blue 3',
  plan_blue5: 'Plano Blue 5 Premium',
  upgrade: 'Upgrade de Plano',
  monthly_fee: 'Mensalidade',
  residual_entry: 'Entrada Residual',
}

const allPlans = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'Grátis',
    priceCents: 0,
    color: 'from-gray-400 to-gray-500',
    cashbackEntrada: '-',
    cashbackResidual: '-',
    cashbackSales: '-',
    features: [
      { icon: Smartphone, label: 'App Mobilidade', included: true },
      { icon: Gift, label: 'Voucher Bem-Vindo', included: true },
      { icon: Car, label: 'CashBack Mobilidade', included: false },
      { icon: Pill, label: 'CashBack Farmácia', included: false },
      { icon: ShoppingBag, label: 'CashBack Shopping', included: false },
      { icon: Gamepad2, label: 'Portal Gamer', included: false },
      { icon: Trophy, label: 'Portal Sport Bet', included: false },
      { icon: Shield, label: 'Seguro Auto', included: false },
      { icon: Heart, label: 'Seguro de Vida', included: false },
      { icon: Phone, label: 'Telemedicina', included: false },
    ],
  },
  {
    id: 'blue3',
    name: 'Blue 3',
    price: 'R$ 200,00/mês',
    priceCents: 20000,
    color: 'from-teal-400 to-teal-500',
    cashbackEntrada: '5 níveis',
    cashbackResidual: '7 níveis',
    cashbackSales: '-',
    features: [
      { icon: Smartphone, label: 'App Mobilidade', included: true },
      { icon: Gift, label: 'Voucher Bem-Vindo', included: true },
      { icon: Car, label: 'CashBack Mobilidade', included: true },
      { icon: Pill, label: 'CashBack Farmácia', included: true },
      { icon: ShoppingBag, label: 'CashBack Shopping', included: false },
      { icon: Gamepad2, label: 'Portal Gamer', included: false },
      { icon: Trophy, label: 'Portal Sport Bet', included: false },
      { icon: Shield, label: 'Seguro Auto', included: false },
      { icon: Heart, label: 'Seguro de Vida', included: false },
      { icon: Phone, label: 'Telemedicina', included: false },
    ],
  },
  {
    id: 'blue5',
    name: 'Blue 5 Premium',
    price: 'R$ 999,00/mês',
    priceCents: 99900,
    color: 'from-emerald-600 to-emerald-700',
    popular: true,
    cashbackEntrada: '5 níveis',
    cashbackResidual: '7 níveis',
    cashbackSales: '9 níveis',
    features: [
      { icon: Smartphone, label: 'App Mobilidade', included: true },
      { icon: Gift, label: 'Voucher Bem-Vindo', included: true },
      { icon: Car, label: 'CashBack Mobilidade', included: true },
      { icon: Pill, label: 'CashBack Farmácia', included: true },
      { icon: ShoppingBag, label: 'CashBack Shopping', included: true },
      { icon: Gamepad2, label: 'Portal Gamer', included: true },
      { icon: Trophy, label: 'Portal Sport Bet', included: true },
      { icon: Shield, label: 'Seguro Auto', included: true },
      { icon: Heart, label: 'Seguro de Vida', included: true },
      { icon: Phone, label: 'Telemedicina', included: true },
    ],
  },
]

export function MyPlanPage() {
  const { user } = useStore()
  const { toast } = useToast()
  const currentPlan = user?.plan || 'blue5'
  const currentPlanData = allPlans.find((p) => p.id === currentPlan) || allPlans[2]
  const nextBillingDate = '05/02/2025'
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>('blue5')
  const [upgradeCalc, setUpgradeCalc] = useState<any>(null)
  const [calcLoading, setCalcLoading] = useState(false)
  const [upgradeStep, setUpgradeStep] = useState<'calculate' | 'confirm' | 'success'>('calculate')
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card')

  const handleCalculateUpgrade = async (planId: string) => {
    if (!user?.id) return
    setSelectedPlan(planId)
    setCalcLoading(true)
    setUpgradeStep('calculate')
    setUpgradeDialogOpen(true)

    try {
      const data = await plansApi.calculateUpgrade(user.id, planId)
      setUpgradeCalc(data)
    } catch (err) {
      // Fallback to local calculation
      const planPrices: Record<string, number> = { free: 0, blue3: 20000, blue5: 99900 }
      const planNames: Record<string, string> = { free: 'Gratuito', blue3: 'Blue 3', blue5: 'Blue 5 Premium' }
      const currentPrice = planPrices[currentPlan] || 0
      const targetPrice = planPrices[planId] || 0
      setUpgradeCalc({
        currentPlan: { id: currentPlan, name: planNames[currentPlan], price: currentPrice },
        targetPlan: { id: planId, name: planNames[planId], price: targetPrice },
        upgradeCost: targetPrice - currentPrice,
        monthlyDifference: targetPrice - currentPrice,
        newFeatures: planId === 'blue5' ? ['CashBack Shopping', 'Portal Gamer', 'Portal Sport Bet', 'Seguro Auto', 'Seguro de Vida', 'Telemedicina'] : ['CashBack Mobilidade', 'CashBack Farmácia'],
        estimatedMonthlyCashbackIncrease: planId === 'blue5' ? 45000 : 15000,
        roi: targetPrice > 0 ? Math.round((45000 / targetPrice) * 100) : 0,
      })
    } finally {
      setCalcLoading(false)
    }
  }

  const handleConfirmUpgrade = async () => {
    if (!user?.id) return
    try {
      await plansApi.upgrade(user.id, selectedPlan)
      setUpgradeStep('success')
      toast({ title: 'Upgrade realizado com sucesso!', description: `Seu plano foi atualizado para ${upgradeCalc?.targetPlan?.name || selectedPlan}` })
    } catch (err) {
      toast({ title: 'Erro ao realizar upgrade', description: 'Tente novamente mais tarde', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Meu Plano</h2>
        <p className="text-sm text-muted-foreground">Gerencie seu plano e acompanhe suas faturas</p>
      </div>

      {/* Current Plan Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 border-0 shadow-lg overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-50" />
          <CardContent className="p-6 text-white relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  <span className="text-emerald-200 text-sm">Plano Atual</span>
                </div>
                <h3 className="text-2xl font-bold mt-1">{getPlanName(currentPlan)}</h3>
                <p className="text-emerald-200 text-lg">{getPlanPrice(currentPlan)}/mês</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/20 text-white border-0">
                    <Check className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                  <span className="text-xs text-emerald-200 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Próxima cobrança: {nextBillingDate}
                  </span>
                </div>
                {currentPlan !== 'blue5' && (
                  <Button className="bg-white text-emerald-700 hover:bg-emerald-50 gap-1" onClick={() => handleCalculateUpgrade('blue5')}>
                    <ArrowUpRight className="h-4 w-4" />
                    Upgrade para Blue 5
                  </Button>
                )}
              </div>
            </div>

            {/* Benefits */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs text-emerald-200 mb-2">Benefícios inclusos:</p>
              <div className="flex flex-wrap gap-2">
                {currentPlanData.features.filter((f) => f.included).map((feature, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1">
                    <feature.icon className="h-3 w-3 text-emerald-200" />
                    <span className="text-[11px] text-white">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Plan Comparison Slider */}
      <Card className="shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-600" />
            Simulador de Upgrade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Plano atual: <strong className="text-foreground">{getPlanName(currentPlan)}</strong></span>
              <span className="text-muted-foreground font-medium">Simular upgrade para: <strong className="text-emerald-600">{selectedPlan === 'blue3' ? 'Blue 3' : selectedPlan === 'blue5' ? 'Blue 5 Premium' : 'Selecione'}</strong></span>
            </div>
            
            <div className="flex items-center gap-4">
              {allPlans.filter(p => p.id !== 'free').map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    'flex-1 p-4 rounded-xl border-2 transition-all text-center',
                    selectedPlan === plan.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 shadow-sm'
                      : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                  )}
                >
                  <div className={`inline-block bg-gradient-to-r ${plan.color} text-white px-3 py-1 rounded-lg text-sm font-bold mb-2`}>
                    {plan.name}
                  </div>
                  <p className="text-lg font-bold text-foreground">{plan.price}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan.cashbackEntrada !== '-' ? `${plan.cashbackEntrada} Entrada` : 'Sem CB Entrada'}
                  </p>
                </button>
              ))}
            </div>

            {selectedPlan && selectedPlan !== currentPlan && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Estimativa de Upgrade
                  </span>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    onClick={() => handleCalculateUpgrade(selectedPlan)}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Calcular
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Custo do Upgrade</p>
                    <p className="text-lg font-bold text-foreground">
                      {selectedPlan === 'blue5' ? 'R$ 999,00' : 'R$ 200,00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Diferença Mensal</p>
                    <p className="text-lg font-bold text-foreground">
                      +{selectedPlan === 'blue5' ? 'R$ 799,00' : 'R$ 200,00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CB Estimado+/mês</p>
                    <p className="text-lg font-bold text-emerald-600">
                      +{selectedPlan === 'blue5' ? 'R$ 450,00' : 'R$ 150,00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ROI Estimado</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {selectedPlan === 'blue5' ? '45%' : '75%'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison Table */}
      <div>
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <Star className="h-4 w-4 text-emerald-600" />
          Comparação de Planos
        </h3>
        {/* Mobile: Cards view */}
        <div className="grid grid-cols-1 md:hidden gap-4">
          {allPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`shadow-sm relative overflow-hidden bg-card ${
                currentPlan === plan.id ? 'ring-2 ring-emerald-500' : ''
              }`}>
                {plan.popular && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-emerald-600 text-white text-[10px]">POPULAR</Badge>
                  </div>
                )}
                <CardContent className="p-5">
                  <div className={`inline-block bg-gradient-to-r ${plan.color} text-white px-3 py-1 rounded-lg text-sm font-bold mb-3`}>
                    {plan.name}
                  </div>
                  <p className="text-xl font-bold text-foreground mb-4">{plan.price}</p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, fi) => (
                      <li key={fi} className={`flex items-center gap-2 text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {feature.included ? (
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <span className="h-4 w-4 shrink-0 text-muted-foreground/30">—</span>
                        )}
                        {feature.label}
                      </li>
                    ))}
                  </ul>
                  {currentPlan === plan.id ? (
                    <div className="mt-4 text-center text-sm text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/30 py-2 rounded-lg">
                      Seu plano atual
                    </div>
                  ) : (
                    <Button
                      className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleCalculateUpgrade(plan.id)}
                    >
                      {plan.priceCents > (allPlans.find((p) => p.id === currentPlan)?.priceCents || 0) ? 'Fazer Upgrade' : 'Selecionar'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Desktop: Table view */}
        <div className="hidden md:block overflow-x-auto">
          <Card className="shadow-sm bg-card">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 text-muted-foreground font-medium">Benefício</th>
                    {allPlans.map((plan) => (
                      <th key={plan.id} className="p-4 text-center min-w-[160px]">
                        <div className={`inline-block bg-gradient-to-r ${plan.color} text-white px-3 py-1 rounded-lg text-xs font-bold`}>
                          {plan.name}
                        </div>
                        <p className="font-bold text-foreground mt-2">{plan.price}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-muted/30">
                    <td className="p-3 text-muted-foreground font-medium text-xs">CashBack Entrada</td>
                    {allPlans.map((plan) => (
                      <td key={plan.id} className="p-3 text-center text-xs font-medium">
                        {plan.cashbackEntrada === '-' ? <span className="text-muted-foreground/30">—</span> : <span className="text-emerald-600">{plan.cashbackEntrada}</span>}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-muted-foreground font-medium text-xs">CashBack Residual</td>
                    {allPlans.map((plan) => (
                      <td key={plan.id} className="p-3 text-center text-xs font-medium">
                        {plan.cashbackResidual === '-' ? <span className="text-muted-foreground/30">—</span> : <span className="text-emerald-600">{plan.cashbackResidual}</span>}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b bg-muted/30">
                    <td className="p-3 text-muted-foreground font-medium text-xs">CashBack Vendas</td>
                    {allPlans.map((plan) => (
                      <td key={plan.id} className="p-3 text-center text-xs font-medium">
                        {plan.cashbackSales === '-' ? <span className="text-muted-foreground/30">—</span> : <span className="text-emerald-600">{plan.cashbackSales}</span>}
                      </td>
                    ))}
                  </tr>
                  {allPlans[0].features.map((feature, fi) => (
                    <tr key={fi} className={`border-b ${fi % 2 === 0 ? '' : 'bg-muted/30'}`}>
                      <td className="p-3 text-muted-foreground text-xs flex items-center gap-1.5">
                        <feature.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {feature.label}
                      </td>
                      {allPlans.map((plan) => (
                        <td key={plan.id} className="p-3 text-center">
                          {plan.features[fi].included ? (
                            <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="p-4" />
                    {allPlans.map((plan) => (
                      <td key={plan.id} className="p-4 text-center">
                        {currentPlan === plan.id ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Plano Atual</Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleCalculateUpgrade(plan.id)}
                          >
                            Selecionar
                          </Button>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment History */}
      <Card className="shadow-sm bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              Histórico de Faturas
            </CardTitle>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Próxima cobrança: {nextBillingDate}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border max-h-72 overflow-y-auto custom-scrollbar">
            {mockInvoices.map((invoice, i) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {invoiceTypeLabels[invoice.type] || invoice.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vencimento: {formatDate(invoice.dueDate)}
                      {invoice.paidAt && <span> · Pago em: {formatDate(invoice.paidAt)}</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(invoice.amount)}</p>
                  <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'} className="text-[10px]">
                    {invoice.status === 'paid' ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Upgrade de Plano
            </DialogTitle>
            <DialogDescription className="sr-only">Dialog to calculate and confirm a plan upgrade</DialogDescription>
          </DialogHeader>
          
          {upgradeStep === 'calculate' && (
            <div className="space-y-4 py-4">
              {calcLoading ? (
                <div className="flex items-center justify-center py-8">
                  <span className="h-6 w-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                </div>
              ) : upgradeCalc ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <Badge variant="outline" className="text-xs">{upgradeCalc.currentPlan.name}</Badge>
                      <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(upgradeCalc.currentPlan.price)}</p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                    <div className="text-center">
                      <Badge className="bg-emerald-600 text-white text-xs">{upgradeCalc.targetPlan.name}</Badge>
                      <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(upgradeCalc.targetPlan.price)}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Custo do upgrade:</span>
                      <span className="font-bold text-foreground">{formatCurrency(upgradeCalc.upgradeCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CB estimado +/mês:</span>
                      <span className="font-bold text-emerald-600">+{formatCurrency(upgradeCalc.estimatedMonthlyCashbackIncrease)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ROI estimado:</span>
                      <span className="font-bold text-emerald-600">{upgradeCalc.roi}%</span>
                    </div>
                  </div>

                  {upgradeCalc.newFeatures?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-2">Novos benefícios:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {upgradeCalc.newFeatures.map((f: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <Check className="h-2.5 w-2.5 mr-1" />
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setUpgradeStep('confirm')}
                  >
                    Continuar com Upgrade
                  </Button>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-4">Selecione um plano para calcular</p>
              )}
            </div>
          )}

          {upgradeStep === 'confirm' && (
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">⚠️ Confirme o Upgrade</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Você será cobrado {upgradeCalc ? formatCurrency(upgradeCalc.upgradeCost) : ''} para o upgrade para {upgradeCalc?.targetPlan?.name}.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Método de pagamento:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'credit_card', label: 'Cartão de Crédito', icon: '💳' },
                    { id: 'boleto', label: 'Boleto', icon: '📄' },
                    { id: 'pix', label: 'PIX', icon: '📱' },
                    { id: 'balance', label: 'Saldo em Conta', icon: '💰' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-3 rounded-lg border text-sm text-left flex items-center gap-2 transition-colors ${
                        paymentMethod === method.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-foreground'
                          : 'border-border hover:border-emerald-300 text-muted-foreground'
                      }`}
                    >
                      <span>{method.icon}</span>
                      <span className="text-xs font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setUpgradeStep('calculate')}>
                  Voltar
                </Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleConfirmUpgrade}>
                  Confirmar Upgrade
                </Button>
              </div>
            </div>
          )}

          {upgradeStep === 'success' && (
            <div className="py-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <Check className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-bold text-foreground mb-2">Upgrade Realizado!</h3>
              <p className="text-sm text-muted-foreground">
                Seu plano foi atualizado com sucesso para {upgradeCalc?.targetPlan?.name || selectedPlan}.
              </p>
              <Button
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => { setUpgradeDialogOpen(false); setUpgradeStep('calculate') }}
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ')
}
