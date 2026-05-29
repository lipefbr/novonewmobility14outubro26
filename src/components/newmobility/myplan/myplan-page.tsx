'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import { formatCurrency, formatDate, getPlanName, getPlanPrice } from '@/lib/utils'
import { CreditCard, Check, Star, ArrowUpRight, FileText, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

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

const plans = [
  {
    id: 'blue3',
    name: 'Blue 3',
    price: 'R$ 200,00/mês',
    features: [
      'CashBack Entrada (5 níveis)',
      'CashBack Residual (7 níveis)',
      'App Mobilidade Urbana',
      'CashBack Farmácia',
      'CashBack Refeição',
      'Voucher de Bem-Vindo',
    ],
    color: 'from-emerald-400 to-emerald-500',
  },
  {
    id: 'blue5',
    name: 'Blue 5 Premium',
    price: 'R$ 999,00/mês',
    features: [
      'Tudo do plano Blue 3',
      'CashBack Vendas (9 níveis)',
      'CashBack Shopping',
      'Portal Gamer',
      'Portal Sport Bet',
      'Gratificações Premium',
      'Seguro Auto',
      'Seguro de Vida',
      'Telemedicina',
      'Plano Odontológico',
    ],
    color: 'from-emerald-600 to-emerald-700',
    popular: true,
  },
]

export function MyPlanPage() {
  const { user } = useStore()
  const currentPlan = user?.plan || 'blue5'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Meu Plano</h2>
        <p className="text-sm text-gray-500">Gerencie seu plano e acompanhe suas faturas</p>
      </div>

      {/* Current Plan */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 border-0 shadow-lg overflow-hidden">
          <CardContent className="p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  <span className="text-emerald-200 text-sm">Plano Atual</span>
                </div>
                <h3 className="text-2xl font-bold mt-1">{getPlanName(currentPlan)}</h3>
                <p className="text-emerald-200 text-lg">{getPlanPrice(currentPlan)}/mês</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-0">
                  <Check className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
                {currentPlan === 'blue3' && (
                  <Button className="bg-white text-emerald-700 hover:bg-emerald-50 gap-1">
                    <ArrowUpRight className="h-4 w-4" />
                    Upgrade
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Plan Comparison */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4">Comparação de Planos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan, i) => (
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
                      <li key={fi} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {currentPlan !== plan.id && (
                    <Button
                      className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                      variant={plan.id === 'blue3' ? 'outline' : 'default'}
                    >
                      {currentPlan === 'blue5' && plan.id === 'blue3'
                        ? 'Downgrade'
                        : 'Fazer Upgrade'}
                    </Button>
                  )}
                  {currentPlan === plan.id && (
                    <div className="mt-4 text-center text-sm text-emerald-600 font-medium bg-emerald-50 py-2 rounded-lg">
                      ✓ Seu plano atual
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Invoice History */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            Histórico de Faturas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y max-h-72 overflow-y-auto custom-scrollbar">
            {mockInvoices.map((invoice, i) => (
              <div key={invoice.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
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
                    <p className="text-xs text-gray-500">Vencimento: {formatDate(invoice.dueDate)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.amount)}</p>
                  <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'} className="text-[10px]">
                    {invoice.status === 'paid' ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
