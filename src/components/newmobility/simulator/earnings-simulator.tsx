'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency } from '@/lib/utils'
import { apiFetch } from '@/lib/api'
import {
  Calculator, TrendingUp, Users, DollarSign, BarChart3,
  ArrowUpRight, Zap, Target, Layers, ChevronRight, Info,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ProjectionData {
  plan: string
  directReferrals: number
  planPrice: number
  multiplier: number
  entrada: { levels: { level: number; percentage: number; maxUsers: number; projectedUsers: number; earningPerUser: number; totalEarning: number }[]; total: number }
  residual: { levels: { level: number; percentage: number; projectedUsers: number; earningPerUser: number; totalEarning: number }[]; total: number }
  vendas: { levels: { level: number; percentage: number; projectedUsers: number; earningPerUser: number; totalEarning: number }[]; total: number }
  totalMonthly: number
  totalAnnual: number
  roi: number
  comparisons: { plan: string; monthlyTotal: number; annualTotal: number; roi: number }[]
}

export function EarningsSimulator() {
  const { t } = useTranslation()
  const { user } = useStore()
  const [plan, setPlan] = useState(user?.plan || 'blue5')
  const [referrals, setReferrals] = useState('4')
  const [projection, setProjection] = useState<ProjectionData | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [showComparison, setShowComparison] = useState(false)

  const handleCalculate = async () => {
    setCalculating(true)
    try {
      const data = await apiFetch<ProjectionData>('/simulator/calculate', {
        method: 'POST',
        body: JSON.stringify({ plan, directReferrals: parseInt(referrals) || 1 }),
      })
      setProjection(data)
    } catch { /* ignore */ } finally { setCalculating(false) }
  }

  const planOptions = [
    { value: 'blue3', label: 'Blue 3', price: 'R$ 99/mês', color: 'border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-700' },
    { value: 'blue5', label: 'Blue 5 Premium', price: 'R$ 199/mês', color: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Calculator className="h-5 w-5 text-emerald-600" />
          Simulador de Ganhos
        </h2>
        <p className="text-sm text-muted-foreground">Calcule projeções de ganhos com base no seu plano e rede</p>
      </div>

      {/* Input Section */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Selecione o Plano</Label>
              <div className="grid grid-cols-2 gap-2">
                {planOptions.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPlan(p.value)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      plan === p.value ? p.color + ' border-solid' : 'border-border bg-muted/30'
                    }`}
                  >
                    <p className="text-sm font-bold text-foreground">{p.label}</p>
                    <p className="text-[10px] text-muted-foreground">{p.price}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Indicações Diretas</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={referrals}
                onChange={(e) => setReferrals(e.target.value)}
                className="h-12 text-lg font-bold text-center"
              />
              <p className="text-[10px] text-muted-foreground">Número de indicações diretas que você espera fazer</p>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                onClick={handleCalculate}
                disabled={calculating || !referrals}
              >
                {calculating ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4" />
                )}
                Calcular Projeção
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {projection && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-0">
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{formatCurrency(projection.totalMonthly)}</p>
                  <p className="text-[10px] text-muted-foreground">Projeção Mensal</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 dark:bg-blue-950/30 border-0">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{formatCurrency(projection.totalAnnual)}</p>
                  <p className="text-[10px] text-muted-foreground">Projeção Anual</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 dark:bg-amber-950/30 border-0">
                <CardContent className="p-4 text-center">
                  <Zap className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{projection.roi.toFixed(0)}%</p>
                  <p className="text-[10px] text-muted-foreground">ROI Estimado</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 dark:bg-purple-950/30 border-0">
                <CardContent className="p-4 text-center">
                  <Users className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{projection.comparisons[0]?.monthlyTotal ? Math.pow(4, parseInt(referrals) || 1) : 0}</p>
                  <p className="text-[10px] text-muted-foreground">Rede Total</p>
                </CardContent>
              </Card>
            </div>

            {/* Breakdown by Matrix Type */}
            <Tabs defaultValue="entrada">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="entrada" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white gap-1">
                  <Layers className="h-3.5 w-3.5" /> Entrada 4x5
                </TabsTrigger>
                <TabsTrigger value="residual" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white gap-1">
                  <Layers className="h-3.5 w-3.5" /> Residual 4x7
                </TabsTrigger>
                <TabsTrigger value="vendas" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white gap-1">
                  <Layers className="h-3.5 w-3.5" /> Vendas 4x9
                </TabsTrigger>
                <TabsTrigger value="comparison" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white gap-1">
                  <BarChart3 className="h-3.5 w-3.5" /> Comparar
                </TabsTrigger>
              </TabsList>

              {[
                { key: 'entrada', data: projection.entrada, title: 'CashBack Entrada 4x5' },
                { key: 'residual', data: projection.residual, title: 'CashBack Residual 4x7' },
                { key: 'vendas', data: projection.vendas, title: 'CashBack Vendas 4x9' },
              ].map(tab => (
                <TabsContent key={tab.key} value={tab.key} className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>{tab.title}</span>
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Total: {formatCurrency(tab.data.total)}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left text-xs font-semibold text-muted-foreground p-2">Nível</th>
                              <th className="text-right text-xs font-semibold text-muted-foreground p-2">%</th>
                              <th className="text-right text-xs font-semibold text-muted-foreground p-2">Usuários</th>
                              <th className="text-right text-xs font-semibold text-muted-foreground p-2">Por Usuário</th>
                              <th className="text-right text-xs font-semibold text-muted-foreground p-2">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tab.data.levels.map(level => (
                              <tr key={level.level} className="border-b border-border/30">
                                <td className="p-2 text-sm font-medium text-foreground">Nível {level.level}</td>
                                <td className="p-2 text-sm text-right text-muted-foreground">{level.percentage}%</td>
                                <td className="p-2 text-sm text-right text-foreground">{level.projectedUsers}</td>
                                <td className="p-2 text-sm text-right text-foreground">{formatCurrency(level.earningPerUser)}</td>
                                <td className="p-2 text-sm text-right font-medium text-emerald-600">{formatCurrency(level.totalEarning)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}

              {/* Comparison Tab */}
              <TabsContent value="comparison" className="mt-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Comparação entre Planos</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {projection.comparisons.map(c => (
                        <div key={c.plan} className={`p-4 rounded-lg border-2 ${
                          c.plan === plan ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700' : 'border-border bg-muted/30'
                        }`}>
                          <div className="flex items-center gap-2 mb-3">
                            <p className="text-sm font-bold text-foreground">{c.plan === 'blue3' ? 'Blue 3' : 'Blue 5 Premium'}</p>
                            {c.plan === plan && <Badge className="bg-emerald-600 text-white text-[9px]">Selecionado</Badge>}
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">Mensal</span>
                              <span className="text-sm font-bold text-foreground">{formatCurrency(c.monthlyTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">Anual</span>
                              <span className="text-sm font-bold text-foreground">{formatCurrency(c.annualTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">ROI</span>
                              <span className="text-sm font-bold text-emerald-600">{c.roi.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
