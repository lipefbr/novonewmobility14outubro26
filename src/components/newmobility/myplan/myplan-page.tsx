'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import { formatCurrency, formatDate, getPlanName, getPlanPrice } from '@/lib/utils'
import {
  CreditCard, Check, Star, ArrowUpRight, FileText, Calendar,
  Shield, Car, Pill, ShoppingBag, Gamepad2, Trophy, Phone,
  Heart, Zap, Gift, Users, Smartphone, Clock
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

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

  const handleUpgrade = (planId: string) => {
    toast({
      title: planId === 'blue5' ? 'Upgrade solicitado!' : 'Alteração de plano',
      description: planId === 'blue5'
        ? 'Você será redirecionado para o pagamento.'
        : 'Entre em contato com o suporte para alterar seu plano.',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Meu Plano</h2>
        <p className="text-sm text-gray-500">Gerencie seu plano e acompanhe suas faturas</p>
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
                  <Button className="bg-white text-emerald-700 hover:bg-emerald-50 gap-1" onClick={() => handleUpgrade('blue5')}>
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

      {/* Plan Comparison Table */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
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
              <Card className={`shadow-sm relative overflow-hidden ${
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
                  <p className="text-xl font-bold text-gray-900 mb-4">{plan.price}</p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, fi) => (
                      <li key={fi} className={`flex items-center gap-2 text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        {feature.included ? (
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <span className="h-4 w-4 shrink-0 text-gray-300">—</span>
                        )}
                        {feature.label}
                      </li>
                    ))}
                  </ul>
                  {currentPlan === plan.id ? (
                    <div className="mt-4 text-center text-sm text-emerald-600 font-medium bg-emerald-50 py-2 rounded-lg">
                      Seu plano atual
                    </div>
                  ) : (
                    <Button
                      className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleUpgrade(plan.id)}
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
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 text-gray-500 font-medium">Benefício</th>
                    {allPlans.map((plan) => (
                      <th key={plan.id} className="p-4 text-center min-w-[160px]">
                        <div className={`inline-block bg-gradient-to-r ${plan.color} text-white px-3 py-1 rounded-lg text-xs font-bold`}>
                          {plan.name}
                        </div>
                        <p className="font-bold text-gray-900 mt-2">{plan.price}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* CashBack rows */}
                  <tr className="border-b bg-gray-50">
                    <td className="p-3 text-gray-600 font-medium text-xs">CashBack Entrada</td>
                    {allPlans.map((plan) => (
                      <td key={plan.id} className="p-3 text-center text-xs font-medium">
                        {plan.cashbackEntrada === '-' ? <span className="text-gray-300">—</span> : <span className="text-emerald-600">{plan.cashbackEntrada}</span>}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-gray-600 font-medium text-xs">CashBack Residual</td>
                    {allPlans.map((plan) => (
                      <td key={plan.id} className="p-3 text-center text-xs font-medium">
                        {plan.cashbackResidual === '-' ? <span className="text-gray-300">—</span> : <span className="text-emerald-600">{plan.cashbackResidual}</span>}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td className="p-3 text-gray-600 font-medium text-xs">CashBack Vendas</td>
                    {allPlans.map((plan) => (
                      <td key={plan.id} className="p-3 text-center text-xs font-medium">
                        {plan.cashbackSales === '-' ? <span className="text-gray-300">—</span> : <span className="text-emerald-600">{plan.cashbackSales}</span>}
                      </td>
                    ))}
                  </tr>
                  {/* Feature rows */}
                  {allPlans[0].features.map((feature, fi) => (
                    <tr key={fi} className={`border-b ${fi % 2 === 0 ? '' : 'bg-gray-50'}`}>
                      <td className="p-3 text-gray-600 text-xs flex items-center gap-1.5">
                        <feature.icon className="h-3.5 w-3.5 text-gray-400" />
                        {feature.label}
                      </td>
                      {allPlans.map((plan) => (
                        <td key={plan.id} className="p-3 text-center">
                          {plan.features[fi].included ? (
                            <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* CTA row */}
                  <tr>
                    <td className="p-4" />
                    {allPlans.map((plan) => (
                      <td key={plan.id} className="p-4 text-center">
                        {currentPlan === plan.id ? (
                          <Badge className="bg-emerald-100 text-emerald-700">Plano Atual</Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleUpgrade(plan.id)}
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
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              Histórico de Faturas
            </CardTitle>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              Próxima cobrança: {nextBillingDate}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y max-h-72 overflow-y-auto custom-scrollbar">
            {mockInvoices.map((invoice, i) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {invoiceTypeLabels[invoice.type] || invoice.type}
                    </p>
                    <p className="text-xs text-gray-500">
                      Vencimento: {formatDate(invoice.dueDate)}
                      {invoice.paidAt && <span> · Pago em: {formatDate(invoice.paidAt)}</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.amount)}</p>
                  <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'} className="text-[10px]">
                    {invoice.status === 'paid' ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
