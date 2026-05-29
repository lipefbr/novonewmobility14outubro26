'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatDate, getStatusLabel, getStatusVariant } from '@/lib/utils'
import { ShoppingCart, Search, Filter, Calendar, Package } from 'lucide-react'
import { motion } from 'framer-motion'

const mockPurchases = [
  { id: '1', description: 'Corrida Aeroporto - Centro', category: 'mobility', amount: 4500, cashback: 225, date: '2025-01-15', status: 'paid' },
  { id: '2', description: 'Farmácia Popular - Medicamentos', category: 'pharmacy', amount: 8900, cashback: 445, date: '2025-01-14', status: 'paid' },
  { id: '3', description: 'Restaurante Sabor & Arte', category: 'food', amount: 12000, cashback: 600, date: '2025-01-13', status: 'paid' },
  { id: '4', description: 'Shopping Center - Eletrônicos', category: 'shopping', amount: 29900, cashback: 1495, date: '2025-01-12', status: 'pending' },
  { id: '5', description: 'Corrida Interlagos', category: 'mobility', amount: 3200, cashback: 160, date: '2025-01-11', status: 'paid' },
  { id: '6', description: 'Supermercado Extra', category: 'food', amount: 25600, cashback: 1280, date: '2025-01-10', status: 'paid' },
  { id: '7', description: 'Drogasil - Produtos', category: 'pharmacy', amount: 5400, cashback: 270, date: '2025-01-09', status: 'paid' },
  { id: '8', description: 'Corrida Vila Madalena', category: 'mobility', amount: 2800, cashback: 140, date: '2025-01-08', status: 'paid' },
  { id: '9', description: 'Loja Renner - Roupas', category: 'shopping', amount: 18900, cashback: 945, date: '2025-01-07', status: 'paid' },
  { id: '10', description: 'Restaurante Outback', category: 'food', amount: 15600, cashback: 780, date: '2025-01-06', status: 'paid' },
]

const categoryLabels: Record<string, string> = {
  mobility: 'Mobilidade',
  pharmacy: 'Farmácia',
  food: 'Refeição',
  shopping: 'Shopping',
}

const categoryColors: Record<string, string> = {
  mobility: 'bg-blue-100 text-blue-700',
  pharmacy: 'bg-rose-100 text-rose-700',
  food: 'bg-orange-100 text-orange-700',
  shopping: 'bg-purple-100 text-purple-700',
}

export function PurchasesPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filtered = mockPurchases.filter((p) => {
    const matchesSearch = p.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const totalSpent = filtered.reduce((acc, p) => acc + p.amount, 0)
  const totalCashback = filtered.reduce((acc, p) => acc + p.cashback, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Relatório de Compras</h2>
        <p className="text-sm text-gray-500">Histórico completo de compras e CashBack</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">TOTAL GASTO</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">COMPRAS</p>
              <p className="text-lg font-bold text-gray-900">{filtered.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">CASHBACK RECEBIDO</p>
              <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalCashback)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar compras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="mobility">Mobilidade</SelectItem>
            <SelectItem value="pharmacy">Farmácia</SelectItem>
            <SelectItem value="food">Refeição</SelectItem>
            <SelectItem value="shopping">Shopping</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Purchase List */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="divide-y max-h-96 overflow-y-auto custom-scrollbar">
            {filtered.map((purchase, i) => (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <Badge className={`text-[10px] shrink-0 ${categoryColors[purchase.category]}`}>
                  {categoryLabels[purchase.category]}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{purchase.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(purchase.date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(purchase.amount)}</p>
                  <p className="text-xs text-emerald-600 font-medium">CB: {formatCurrency(purchase.cashback)}</p>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma compra encontrada</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
