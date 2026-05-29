'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { motion } from 'framer-motion'

interface DashboardChartsProps {
  data: any | null
}

const defaultUserDistribution = [
  { name: 'Diretos', value: 4, color: '#059669' },
  { name: 'Nível 2', value: 16, color: '#10b981' },
  { name: 'Nível 3', value: 64, color: '#34d399' },
  { name: 'Nível 4', value: 256, color: '#6ee7b7' },
  { name: 'Nível 5', value: 1024, color: '#a7f3d0' },
]

const defaultRevenueData = [
  { name: 'Entrada', valor: 32580, color: '#059669' },
  { name: 'Residual', valor: 18240, color: '#10b981' },
  { name: 'Gratific.', valor: 8450, color: '#f59e0b' },
  { name: 'Mobilidade', valor: 7270, color: '#3b82f6' },
  { name: 'Farmácia', valor: 5580, color: '#f43f5e' },
  { name: 'Refeição', valor: 6870, color: '#f97316' },
  { name: 'Shopping', valor: 27270, color: '#8b5cf6' },
]

const userColorMap: Record<string, string> = {
  'Diretos': '#059669',
  'Nível 2': '#10b981',
  'Nível 3': '#34d399',
  'Nível 4': '#6ee7b7',
  'Nível 5': '#a7f3d0',
  'blue5': '#059669',
  'blue3': '#10b981',
  'free': '#34d399',
}

const revenueColorMap: Record<string, string> = {
  'Entrada': '#059669',
  'Residual': '#10b981',
  'Gratific.': '#f59e0b',
  'Mobilidade': '#3b82f6',
  'Farmácia': '#f43f5e',
  'Refeição': '#f97316',
  'Shopping': '#8b5cf6',
  'plan_upgrade': '#059669',
  'withdrawal': '#10b981',
  'mobility': '#3b82f6',
  'food': '#f97316',
  'pharmacy': '#f43f5e',
  'shopping': '#8b5cf6',
  'gratification': '#f59e0b',
  'plan_blue3': '#34d399',
}

const nameTranslations: Record<string, string> = {
  'plan_upgrade': 'Upgrade',
  'withdrawal': 'Saque',
  'mobility': 'Mobilidade',
  'food': 'Refeição',
  'pharmacy': 'Farmácia',
  'shopping': 'Shopping',
  'gratification': 'Gratific.',
  'plan_blue3': 'Blue 3',
  'blue5': 'Blue 5',
  'blue3': 'Blue 3',
  'free': 'Gratuito',
}

const RADIAN = Math.PI / 180

function renderCustomizedLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

function normalizeToArray(obj: any, colorMap: Record<string, string>, nameMap: Record<string, string>, valueKey: string): any[] {
  if (Array.isArray(obj)) return obj
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj).map(([key, value]) => ({
    name: nameMap[key] || key,
    [valueKey]: value,
    color: colorMap[key] || '#6b7280',
  }))
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  const userDistributionData = data?.userDistribution 
    ? normalizeToArray(data.userDistribution, userColorMap, nameTranslations, 'value')
    : defaultUserDistribution
  
  const revenueByCategoryData = data?.revenueByCategory
    ? normalizeToArray(data.revenueByCategory, revenueColorMap, nameTranslations, 'valor')
    : defaultRevenueData

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* Pie Chart */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-900">
              Distribuição de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] md:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={110}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1200}
                  >
                    {userDistributionData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} usuários`, 'Quantidade']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-xs text-gray-600">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bar Chart */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-900">
              Receitas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] md:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueByCategoryData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#666' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#666' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar
                    dataKey="valor"
                    radius={[6, 6, 0, 0]}
                    animationBegin={0}
                    animationDuration={1200}
                  >
                    {revenueByCategoryData.map((entry: any, index: number) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
