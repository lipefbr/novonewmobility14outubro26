'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'
import { Star, TrendingUp, Users, ShoppingCart, Award, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { AchievementsSection } from './achievements-section'

const mockPointHistory = [
  { id: '1', type: 'direct_referral', amount: 2, description: 'Indicação direta ativa - Ana Paula', date: '2025-01-15' },
  { id: '2', type: 'service_use', amount: 1, description: 'Uso do App Mobilidade', date: '2025-01-14' },
  { id: '3', type: 'purchase', amount: 1, description: 'Compra no Shopping', date: '2025-01-13' },
  { id: '4', type: 'evaluation_received', amount: 1, description: 'Avaliação positiva recebida', date: '2025-01-12' },
  { id: '5', type: 'payment', amount: 2, description: 'Pagamento mensal em dia', date: '2025-01-10' },
  { id: '6', type: 'direct_referral', amount: 2, description: 'Indicação direta ativa - Roberto', date: '2025-01-08' },
  { id: '7', type: 'evaluation_upline', amount: 1, description: 'Avaliação do upline', date: '2025-01-06' },
  { id: '8', type: 'service_use', amount: 1, description: 'Uso do App Mobilidade', date: '2025-01-05' },
  { id: '9', type: 'direct_referral', amount: 2, description: 'Indicação direta ativa - Maria', date: '2025-01-03' },
  { id: '10', type: 'purchase', amount: 1, description: 'Compra no Shopping', date: '2025-01-02' },
]

const typeLabels: Record<string, string> = {
  direct_referral: 'Indicação',
  service_use: 'Serviço',
  purchase: 'Compra',
  evaluation_received: 'Avaliação',
  evaluation_upline: 'Avaliação Upline',
  payment: 'Pagamento',
}

const typeColors: Record<string, string> = {
  direct_referral: 'bg-emerald-100 text-emerald-700',
  service_use: 'bg-blue-100 text-blue-700',
  purchase: 'bg-purple-100 text-purple-700',
  evaluation_received: 'bg-amber-100 text-amber-700',
  evaluation_upline: 'bg-teal-100 text-teal-700',
  payment: 'bg-rose-100 text-rose-700',
}

export function PointsPage() {
  const { user } = useStore()
  const totalPoints = user?.careerPoints || 42
  const personalPoints = user?.personalPoints || 18
  const networkPoints = totalPoints - personalPoints

  const totalEarned = mockPointHistory.reduce((acc, p) => acc + p.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Pontuações</h2>
        <p className="text-sm text-gray-500">Acompanhe seus pontos e saiba como ganhar mais</p>
      </div>

      {/* Total Points */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 shadow-lg">
          <CardContent className="p-6 text-white text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-yellow-300" />
            <p className="text-emerald-200 text-sm">Total de Pontos</p>
            <p className="text-4xl font-bold">{totalPoints}</p>
            <div className="flex justify-center gap-6 mt-4">
              <div>
                <p className="text-emerald-200 text-xs">Pessoais</p>
                <p className="text-xl font-bold">{personalPoints}</p>
              </div>
              <div>
                <p className="text-emerald-200 text-xs">Rede</p>
                <p className="text-xl font-bold">{networkPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Points Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">PONTOS PESSOAIS</p>
              <p className="text-xl font-bold text-gray-900">{personalPoints}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">PONTOS DA REDE</p>
              <p className="text-xl font-bold text-gray-900">{networkPoints}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">TOTAL GANHO</p>
              <p className="text-xl font-bold text-gray-900">{totalEarned}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Points History */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-600" />
            Histórico de Pontos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y max-h-80 overflow-y-auto custom-scrollbar">
            {mockPointHistory.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Badge className={`text-[10px] ${typeColors[entry.type] || 'bg-gray-100 text-gray-700'}`}>
                    {typeLabels[entry.type] || entry.type}
                  </Badge>
                  <div>
                    <p className="text-sm text-gray-900">{entry.description}</p>
                    <p className="text-xs text-gray-500">{formatDate(entry.date)}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-700">+{entry.amount}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How to earn */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-emerald-600" />
            Como Ganhar Pontos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { action: 'Indicação direta ativa', points: '+2 pontos', icon: '👥' },
              { action: 'Uso do App Mobilidade', points: '+1 ponto', icon: '🚗' },
              { action: 'Compra no Shopping', points: '+1 ponto', icon: '🛍️' },
              { action: 'Avaliação positiva recebida', points: '+1 ponto', icon: '⭐' },
              { action: 'Pagamento em dia', points: '+2 pontos', icon: '💳' },
              { action: 'Avaliação do upline', points: '+1 ponto', icon: '🔄' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.action}</p>
                  <p className="text-xs text-emerald-600 font-semibold">{item.points}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements / Badges */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-bold text-foreground">Conquistas</h3>
        </div>
        <AchievementsSection />
      </motion.div>
    </div>
  )
}
