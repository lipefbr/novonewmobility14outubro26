'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useStore } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import { Trophy, Star, TrendingUp, Award, Target, Crown } from 'lucide-react'
import { motion } from 'framer-motion'

const careerLevels = [
  {
    id: 'bronze',
    name: 'Bronze',
    icon: Award,
    starsRequired: 1,
    pointsRequired: 10,
    color: 'from-amber-600 to-amber-700',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    reward: 50000,
    achieved: true,
  },
  {
    id: 'silver',
    name: 'Prata',
    icon: Award,
    starsRequired: 2,
    pointsRequired: 20,
    color: 'from-gray-400 to-gray-500',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    reward: 150000,
    achieved: true,
  },
  {
    id: 'gold',
    name: 'Ouro',
    icon: Trophy,
    starsRequired: 3,
    pointsRequired: 30,
    color: 'from-yellow-500 to-yellow-600',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    reward: 500000,
    achieved: true,
  },
  {
    id: 'sapphire',
    name: 'Safira',
    icon: Crown,
    starsRequired: 4,
    pointsRequired: 40,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    reward: 1500000,
    achieved: false,
  },
  {
    id: 'diamond',
    name: 'Diamante',
    icon: Crown,
    starsRequired: 5,
    pointsRequired: 60,
    color: 'from-cyan-400 to-cyan-500',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-700',
    reward: 3000000,
    achieved: false,
  },
  {
    id: 'platinum',
    name: 'Platina',
    icon: Crown,
    starsRequired: 6,
    pointsRequired: 100,
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    reward: 5000000,
    achieved: false,
  },
]

export function CareerPage() {
  const { user } = useStore()
  const currentStars = user?.stars || 3
  const currentPoints = user?.careerPoints || 42
  const personalPoints = user?.personalPoints || 18

  const currentLevel = careerLevels.find((l) => !l.achieved) || careerLevels[careerLevels.length - 1]
  const nextLevel = careerLevels.find((l) => !l.achieved)
  const progressToNext = nextLevel
    ? Math.min((currentPoints / nextLevel.pointsRequired) * 100, 100)
    : 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Plano de Carreira</h2>
        <p className="text-sm text-gray-500">Acompanhe seu progresso e conquistas na carreira</p>
      </div>

      {/* Current Level Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 border-0 shadow-lg overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-white">
                <p className="text-emerald-200 text-sm font-medium">Patente Atual</p>
                <h3 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <Trophy className="h-7 w-7" />
                  {currentLevel.name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < currentStars ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-emerald-200 ml-1">
                    {currentStars} {currentStars === 1 ? 'estrela' : 'estrelas'}
                  </span>
                </div>
              </div>
              <div className="text-white">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-emerald-200 text-xs">Pontos de Carreira</p>
                    <p className="text-xl font-bold">{currentPoints}</p>
                  </div>
                  <div>
                    <p className="text-emerald-200 text-xs">Pontos Pessoais</p>
                    <p className="text-xl font-bold">{personalPoints}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress to Next Level */}
      {nextLevel && (
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progresso para {nextLevel.name}
              </span>
              <span className="text-sm font-bold text-emerald-600">
                {currentPoints}/{nextLevel.pointsRequired} pontos
              </span>
            </div>
            <Progress value={progressToNext} className="h-3" />
            <p className="text-xs text-gray-500 mt-2">
              Faltam <span className="font-semibold text-emerald-600">{nextLevel.pointsRequired - currentPoints} pontos</span> para atingir o próximo nível
            </p>
            <div className="mt-3 bg-emerald-50 rounded-lg p-3">
              <p className="text-xs text-emerald-700">
                💡 Cada estrela equivale a 2 pontos. Você precisa de {nextLevel.starsRequired} estrelas e {nextLevel.pointsRequired} pontos para atingir {nextLevel.name}.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Career Path */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          Trilha de Carreira
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {careerLevels.map((level, i) => {
            const Icon = level.icon
            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className={`shadow-sm relative overflow-hidden ${
                  level.achieved ? 'ring-2 ring-emerald-500' : ''
                }`}>
                  {level.achieved && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-emerald-600 text-white text-[10px]">Conquistado ✓</Badge>
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${level.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{level.name}</h4>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: level.starsRequired }).map((_, si) => (
                            <Star key={si} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Estrelas necessárias</span>
                        <span className="font-medium">{level.starsRequired}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pontos necessários</span>
                        <span className="font-medium">{level.pointsRequired}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Recompensa</span>
                        <span className="font-semibold text-emerald-700">{formatCurrency(level.reward)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* How to earn points */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-600" />
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
              { action: 'Ativação de residual na rede', points: '+3 pontos', icon: '🔄' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.action}</p>
                  <p className="text-xs text-emerald-600 font-semibold">{item.points}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
