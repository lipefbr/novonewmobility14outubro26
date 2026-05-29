'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Gift, Check, Clock, Car, ShoppingBag, Heart, Shield, Phone, Stethoscope, Fuel, UtensilsCrossed, Wrench, Home, Bike, Banknote } from 'lucide-react'
import { motion } from 'framer-motion'

const gratificationCategories = [
  {
    name: 'Mobilidade',
    icon: Car,
    color: 'bg-blue-100 text-blue-600',
    items: [
      { id: '1', name: 'Equipe Mobilidade', amount: 200000, type: 'mobility_team', isClaimed: true, claimedAt: '2025-01-10' },
      { id: '2', name: 'Auxílio Combustível', amount: 50000, type: 'fuel_aid', isClaimed: false },
    ],
  },
  {
    name: 'Compras',
    icon: ShoppingBag,
    color: 'bg-purple-100 text-purple-600',
    items: [
      { id: '3', name: 'CashBack Shopping', amount: 150000, type: 'shopping', isClaimed: true, claimedAt: '2025-01-08' },
    ],
  },
  {
    name: 'Liderança',
    icon: Heart,
    color: 'bg-rose-100 text-rose-600',
    items: [
      { id: '4', name: 'Gratificação Liderança', amount: 300000, type: 'leadership', isClaimed: false },
      { id: '5', name: 'Ativação Residual', amount: 100000, type: 'residual_activation', isClaimed: false },
    ],
  },
  {
    name: 'Seguros',
    icon: Shield,
    color: 'bg-amber-100 text-amber-600',
    items: [
      { id: '6', name: 'Seguro Auto', amount: 180000, type: 'insurance_car', isClaimed: true, claimedAt: '2024-12-20' },
      { id: '7', name: 'Seguro de Vida', amount: 250000, type: 'insurance_life', isClaimed: false },
      { id: '8', name: 'Seguro Celular', amount: 30000, type: 'insurance_phone', isClaimed: false },
    ],
  },
  {
    name: 'Saúde',
    icon: Stethoscope,
    color: 'bg-emerald-100 text-emerald-600',
    items: [
      { id: '9', name: 'Telemedicina', amount: 40000, type: 'telemedicine', isClaimed: true, claimedAt: '2025-01-05' },
      { id: '10', name: 'Plano Odontológico', amount: 60000, type: 'dental', isClaimed: false },
    ],
  },
  {
    name: 'Benefícios',
    icon: Gift,
    color: 'bg-teal-100 text-teal-600',
    items: [
      { id: '11', name: 'Kit Mimo', amount: 25000, type: 'mimo_kit', isClaimed: false },
      { id: '12', name: 'Guincho', amount: 35000, type: 'tow_truck', isClaimed: false },
      { id: '13', name: 'Assistência Residencial', amount: 45000, type: 'home_assistance', isClaimed: false },
      { id: '14', name: 'Fundo Aposentadoria', amount: 500000, type: 'retirement_fund', isClaimed: false },
      { id: '15', name: 'Escolha da Moto', amount: 800000, type: 'motorcycle_choice', isClaimed: false },
    ],
  },
]

export function GratificationsPage() {
  const allItems = gratificationCategories.flatMap((c) => c.items)
  const claimedCount = allItems.filter((i) => i.isClaimed).length
  const totalAvailable = allItems.filter((i) => !i.isClaimed).reduce((acc, i) => acc + i.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Gratificações</h2>
        <p className="text-sm text-gray-500">Gerencie suas gratificações e benefícios disponíveis</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">DISPONÍVEIS</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalAvailable)}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">REIVINDICADAS</p>
                <p className="text-lg font-bold text-gray-900">{claimedCount}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">PENDENTES</p>
                <p className="text-lg font-bold text-gray-900">{allItems.length - claimedCount}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gratification Categories */}
      {gratificationCategories.map((category, ci) => (
        <motion.div
          key={category.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ci * 0.08 }}
        >
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${category.color}`}>
                  <category.icon className="h-4 w-4" />
                </div>
                {category.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {category.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.isClaimed ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        {item.isClaimed && item.claimedAt && (
                          <p className="text-xs text-gray-500">Reivindicado em {formatDate(item.claimedAt)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-emerald-700">
                        {formatCurrency(item.amount)}
                      </span>
                      {item.isClaimed ? (
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Reivindicado</Badge>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                          Reivindicar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
