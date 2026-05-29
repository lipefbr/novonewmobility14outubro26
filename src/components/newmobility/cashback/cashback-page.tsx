'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { MatrixVisualization } from './matrix-visualization'
import { useStore } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, TrendingUp, ShoppingBag, ArrowDownRight } from 'lucide-react'
import { motion } from 'framer-motion'

const cashbackSummary = {
  entrada: {
    total: 3258000,
    lastMonth: 456000,
    lastWeek: 112000,
    pending: 89000,
  },
  residual: {
    total: 1824000,
    lastMonth: 234000,
    lastWeek: 56000,
    pending: 45000,
  },
  vendas: {
    total: 10602500,
    lastMonth: 1234000,
    lastWeek: 345000,
    pending: 678000,
  },
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-base font-bold text-gray-900">{formatCurrency(value)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function CashbackPage() {
  const [activeTab, setActiveTab] = useState('entrada')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">CashBack</h2>
        <p className="text-sm text-gray-500">Acompanhe seus ganhos por tipo de CashBack</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="entrada" className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">CashBack</span> Entrada
          </TabsTrigger>
          <TabsTrigger value="residual" className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">CashBack</span> Residual
          </TabsTrigger>
          <TabsTrigger value="vendas" className="flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">CashBack</span> Vendas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entrada" className="mt-4 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard
              label="Total Acumulado"
              value={cashbackSummary.entrada.total}
              icon={DollarSign}
              color="bg-emerald-100 text-emerald-600"
            />
            <SummaryCard
              label="Último Mês"
              value={cashbackSummary.entrada.lastMonth}
              icon={ArrowDownRight}
              color="bg-blue-100 text-blue-600"
            />
            <SummaryCard
              label="Última Semana"
              value={cashbackSummary.entrada.lastWeek}
              icon={ArrowDownRight}
              color="bg-amber-100 text-amber-600"
            />
            <SummaryCard
              label="Pendente"
              value={cashbackSummary.entrada.pending}
              icon={DollarSign}
              color="bg-purple-100 text-purple-600"
            />
          </div>
          <MatrixVisualization type="entrada" />
        </TabsContent>

        <TabsContent value="residual" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard
              label="Total Acumulado"
              value={cashbackSummary.residual.total}
              icon={DollarSign}
              color="bg-emerald-100 text-emerald-600"
            />
            <SummaryCard
              label="Último Mês"
              value={cashbackSummary.residual.lastMonth}
              icon={ArrowDownRight}
              color="bg-blue-100 text-blue-600"
            />
            <SummaryCard
              label="Última Semana"
              value={cashbackSummary.residual.lastWeek}
              icon={ArrowDownRight}
              color="bg-amber-100 text-amber-600"
            />
            <SummaryCard
              label="Pendente"
              value={cashbackSummary.residual.pending}
              icon={DollarSign}
              color="bg-purple-100 text-purple-600"
            />
          </div>
          <MatrixVisualization type="residual" />
        </TabsContent>

        <TabsContent value="vendas" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard
              label="Total Acumulado"
              value={cashbackSummary.vendas.total}
              icon={DollarSign}
              color="bg-emerald-100 text-emerald-600"
            />
            <SummaryCard
              label="Último Mês"
              value={cashbackSummary.vendas.lastMonth}
              icon={ArrowDownRight}
              color="bg-blue-100 text-blue-600"
            />
            <SummaryCard
              label="Última Semana"
              value={cashbackSummary.vendas.lastWeek}
              icon={ArrowDownRight}
              color="bg-amber-100 text-amber-600"
            />
            <SummaryCard
              label="Pendente"
              value={cashbackSummary.vendas.pending}
              icon={DollarSign}
              color="bg-purple-100 text-purple-600"
            />
          </div>
          <MatrixVisualization type="vendas" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
