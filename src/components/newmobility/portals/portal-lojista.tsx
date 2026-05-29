'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Store, TrendingUp, Users, Package, BarChart3, Settings,
  ShoppingCart, DollarSign, ArrowUpRight, Clock, CheckCircle2,
  Percent, Plus, Eye, Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'

const recentOrders = [
  { id: 'PED-2025-001', customer: 'Ana Santos', amount: 18990, status: 'completed', date: '2025-02-01' },
  { id: 'PED-2025-002', customer: 'Roberto Lima', amount: 45500, status: 'pending', date: '2025-02-01' },
  { id: 'PED-2025-003', customer: 'Maria Costa', amount: 32400, status: 'completed', date: '2025-01-31' },
  { id: 'PED-2025-004', customer: 'João Ferreira', amount: 12800, status: 'processing', date: '2025-01-31' },
  { id: 'PED-2025-005', customer: 'Camila Rocha', amount: 67500, status: 'completed', date: '2025-01-30' },
]

const productCatalog = [
  { name: 'Serviço de Transporte Premium', price: 8990, category: 'Mobilidade', stock: 'Ilimitado', active: true },
  { name: 'Passe Diário Mobilidade', price: 2990, category: 'Mobilidade', stock: 'Ilimitado', active: true },
  { name: 'Kit Bem-Estar Farmácia', price: 15990, category: 'Farmácia', stock: '45 un', active: true },
  { name: 'Voucher Refeição R$30', price: 3000, category: 'Refeição', stock: '200 un', active: false },
]

const salesMetrics = [
  { label: 'Vendas Hoje', value: formatCurrency(189900), change: '+12%', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', gradient: 'from-emerald-500 to-emerald-600' },
  { label: 'Vendas Semana', value: formatCurrency(1245000), change: '+8%', icon: TrendingUp, color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400', gradient: 'from-teal-500 to-teal-600' },
  { label: 'Pedidos Pendentes', value: '3', change: '', icon: Clock, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', gradient: 'from-amber-500 to-amber-600' },
  { label: 'Clientes Ativos', value: '156', change: '+5', icon: Users, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', gradient: 'from-blue-500 to-blue-600' },
]

export function PortalLojista() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Portal do Lojista</h2>
        <p className="text-sm text-muted-foreground">Gerencie sua loja e acompanhe suas vendas</p>
      </div>

      {/* Hero Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 animate-gradient-shift border-0 shadow-lg overflow-hidden relative">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "url(\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDgpIi8+PC9zdmc+\")"
          }} />
          <div className="absolute inset-0 animate-shimmer" />
          <CardContent className="p-6 text-white relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-white/15">
                <Store className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Portal do Lojista</h3>
                <p className="text-emerald-200">Gerencie seus produtos e vendas</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              <Button className="bg-white/15 hover:bg-white/25 text-white border-0 gap-1.5">
                <Plus className="h-4 w-4" />
                Cadastrar Loja
              </Button>
              <Button className="bg-white/15 hover:bg-white/25 text-white border-0 gap-1.5">
                <Package className="h-4 w-4" />
                Adicionar Produto
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sales Dashboard - Enhanced with animated stats */}
      <div>
        <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-600" />
          Dashboard de Vendas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {salesMetrics.map((metric, i) => (
            <motion.div key={metric.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="shadow-sm bg-card hover:shadow-md transition-shadow group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${metric.color} group-hover:scale-105 transition-transform`}>
                      <metric.icon className="h-3.5 w-3.5" />
                    </div>
                    {metric.change && (
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 dark:border-emerald-800">
                        {metric.change}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xl font-bold text-foreground">{metric.value}</p>
                  <p className="text-[10px] text-muted-foreground">{metric.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CashBack Configuration */}
      <Card className="shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Percent className="h-4 w-4 text-emerald-600" />
            Configuração de CashBack
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 text-center border border-emerald-100 dark:border-emerald-900/50">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">5%</p>
              <p className="text-xs text-muted-foreground">CashBack Mobilidade</p>
              <Progress value={50} className="h-1.5 mt-2" />
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/30 rounded-lg p-4 text-center border border-rose-100 dark:border-rose-900/50">
              <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">3%</p>
              <p className="text-xs text-muted-foreground">CashBack Farmácia</p>
              <Progress value={30} className="h-1.5 mt-2" />
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 text-center border border-amber-100 dark:border-amber-900/50">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">4%</p>
              <p className="text-xs text-muted-foreground">CashBack Refeição</p>
              <Progress value={40} className="h-1.5 mt-2" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">Configure as porcentagens de CashBack oferecidas aos clientes em cada categoria.</p>
        </CardContent>
      </Card>

      {/* Product Catalog */}
      <Card className="shadow-sm bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-600" />
              Catálogo de Produtos
            </CardTitle>
            <Button variant="outline" size="sm" className="text-xs gap-1">
              <Plus className="h-3 w-3" />
              Novo Produto
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y max-h-64 overflow-y-auto custom-scrollbar">
            {productCatalog.map((product, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Package className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px]">{product.category}</Badge>
                    <span className="text-[10px] text-muted-foreground">Estoque: {product.stock}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(product.price)}</p>
                  <Badge className={product.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 text-[10px]'}>
                    {product.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card className="shadow-sm bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-emerald-600" />
              Pedidos Recentes
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-emerald-600">
              Ver todos <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y max-h-64 overflow-y-auto custom-scrollbar">
            {recentOrders.map((order, i) => {
              const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
                completed: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Concluído' },
                pending: { icon: Clock, color: 'text-amber-500', label: 'Pendente' },
                processing: { icon: Clock, color: 'text-blue-500', label: 'Processando' },
              }
              const config = statusConfig[order.status] || statusConfig.pending
              const StatusIcon = config.icon
              return (
                <div key={order.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <StatusIcon className={`h-4 w-4 ${config.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">{order.id} · {formatDate(order.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(order.amount)}</p>
                    <Badge variant="outline" className="text-[10px]">{config.label}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Settings, title: 'Configurações', desc: 'Configure sua loja e preferências' },
          { icon: BarChart3, title: 'Relatórios', desc: 'Análise detalhada de desempenho' },
          { icon: Store, title: 'Perfil da Loja', desc: 'Edite informações da loja' },
        ].map((item, i) => (
          <motion.div key={item.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }}>
            <Card className="shadow-sm hover:shadow-md transition-all cursor-pointer group bg-card">
              <CardContent className="p-5">
                <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 w-fit mb-3 group-hover:scale-105 transition-transform">
                  <item.icon className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
