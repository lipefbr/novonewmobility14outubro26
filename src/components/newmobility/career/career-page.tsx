'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useStore } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import {
  Trophy, Star, TrendingUp, Award, Target, Crown,
  Zap, Shield, Percent, Gift, CheckCircle2, ArrowRight, Sparkles
} from 'lucide-react'
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
    borderColor: 'border-amber-300',
    reward: 50000,
    cashbackMultiplier: '1.0x',
    achieved: true,
    benefits: ['CashBack Entrada básico', 'Suporte padrão', 'App Mobilidade'],
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
    borderColor: 'border-gray-300',
    reward: 150000,
    cashbackMultiplier: '1.2x',
    achieved: true,
    benefits: ['CashBack Entrada completo', 'CashBack Residual', 'Voucher mensal R$20'],
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
    borderColor: 'border-yellow-300',
    reward: 500000,
    cashbackMultiplier: '1.5x',
    achieved: true,
    benefits: ['Tudo do Prata', 'CashBack Vendas', 'Gratificações premium', 'CashBack Farmácia'],
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
    borderColor: 'border-blue-300',
    reward: 1500000,
    cashbackMultiplier: '2.0x',
    achieved: false,
    benefits: ['Tudo do Ouro', 'Portal Gamer', 'Seguro Auto', 'Telemedicina'],
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
    borderColor: 'border-cyan-300',
    reward: 3000000,
    cashbackMultiplier: '2.5x',
    achieved: false,
    benefits: ['Tudo do Safira', 'Portal Sport Bet', 'Seguro de Vida', 'Plano Odontológico'],
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
    borderColor: 'border-emerald-300',
    reward: 5000000,
    cashbackMultiplier: '3.0x',
    achieved: false,
    benefits: ['Tudo do Diamante', 'CashBack máximo', 'Benefícios exclusivos VIP', 'Acesso antecipado'],
  },
]

const motivationalMessages = [
  { minProgress: 0, maxProgress: 30, message: 'Continue firme! Cada passo conta na sua jornada.' },
  { minProgress: 30, maxProgress: 60, message: 'Você está no caminho certo! Não pare agora.' },
  { minProgress: 60, maxProgress: 85, message: 'Quase lá! O próximo rank está ao seu alcance.' },
  { minProgress: 85, maxProgress: 100, message: 'Incrível! Você está prestes a conquistar o próximo nível!' },
  { minProgress: 100, maxProgress: 999, message: 'Parabéns! Você atingiu o topo! Continue brilhando.' },
]

export function CareerPage() {
  const { t } = useTranslation()
  const { user } = useStore()
  const currentStars = user?.stars || 3
  const currentPoints = user?.careerPoints || 42
  const personalPoints = user?.personalPoints || 18

  const achievedLevel = [...careerLevels].reverse().find((l) => l.achieved) || careerLevels[0]
  const nextLevel = careerLevels.find((l) => !l.achieved)
  const progressToNext = nextLevel
    ? Math.min((currentPoints / nextLevel.pointsRequired) * 100, 100)
    : 100

  const motivational = motivationalMessages.find(
    (m) => progressToNext >= m.minProgress && progressToNext < m.maxProgress
  ) || motivationalMessages[motivationalMessages.length - 1]

  const currentBenefits = achievedLevel.benefits

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">{t('career.title')}</h2>
        <p className="text-sm text-gray-500">Acompanhe seu progresso e conquistas na carreira</p>
      </div>

      {/* Current Rank Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 border-0 shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-xl bg-white/15">
                    <achievedLevel.icon className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-emerald-200 text-sm font-medium">Patente Atual</p>
                    <h3 className="text-2xl md:text-3xl font-bold">{achievedLevel.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 transition-all duration-300 ${
                        i < currentStars ? 'text-yellow-400 fill-yellow-400 scale-110' : 'text-white/30'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-emerald-200 ml-1">
                    {currentStars} {currentStars === 1 ? 'estrela' : 'estrelas'}
                  </span>
                </div>
              </div>
              <div className="text-white">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-emerald-200 text-xs">Carreira</p>
                    <p className="text-xl font-bold">{currentPoints}</p>
                    <p className="text-[10px] text-emerald-300">pontos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-emerald-200 text-xs">Pessoais</p>
                    <p className="text-xl font-bold">{personalPoints}</p>
                    <p className="text-[10px] text-emerald-300">pontos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-emerald-200 text-xs">Multiplicador</p>
                    <p className="text-xl font-bold">{achievedLevel.cashbackMultiplier}</p>
                    <p className="text-[10px] text-emerald-300">CashBack</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress to Next Rank */}
      {nextLevel && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-sm border-emerald-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-emerald-600" />
                  Progresso para {nextLevel.name}
                </span>
                <span className="text-sm font-bold text-emerald-600">
                  {currentPoints}/{nextLevel.pointsRequired} pontos
                </span>
              </div>
              <div className="relative">
                <Progress value={progressToNext} className="h-4" />
                <motion.div
                  className="absolute top-0 left-0 h-4 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  style={{ maxWidth: '100%' }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  Faltam <span className="font-semibold text-emerald-600">{nextLevel.pointsRequired - currentPoints} pontos</span> para atingir {nextLevel.name}
                </p>
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <Sparkles className="h-3 w-3" />
                  {Math.round(progressToNext)}%
                </div>
              </div>
              <div className="mt-3 bg-emerald-50 rounded-lg p-3 flex items-start gap-2">
                <Zap className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-emerald-700 font-medium">{motivational.message}</p>
                  <p className="text-[10px] text-emerald-600 mt-1">
                    Cada estrela equivale a 2 pontos. Você precisa de {nextLevel.starsRequired} estrelas e {nextLevel.pointsRequired} pontos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Próximo Rank Highlight */}
      {nextLevel && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className={`shadow-sm border-2 ${nextLevel.borderColor} relative overflow-hidden`}>
            <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
              PRÓXIMO RANK
            </div>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-xl bg-gradient-to-br ${nextLevel.color} text-white`}>
                  <nextLevel.icon className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{nextLevel.name}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: nextLevel.starsRequired }).map((_, si) => (
                      <Star key={si} className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">Min. Pontos</span>
                      <p className="font-semibold text-gray-900">{nextLevel.pointsRequired}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">CashBack</span>
                      <p className="font-semibold text-emerald-600">{nextLevel.cashbackMultiplier}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Recompensa</span>
                      <p className="font-semibold text-emerald-600">{formatCurrency(nextLevel.reward)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Benefícios Atuais */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              Benefícios Atuais — {achievedLevel.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentBenefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-lg"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Career Path Timeline */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          Trilha de Carreira
        </h3>
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400 via-gray-200 to-gray-100 hidden sm:block" />

          <div className="space-y-4">
            {careerLevels.map((level, i) => {
              const Icon = level.icon
              return (
                <motion.div
                  key={level.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="relative sm:pl-16"
                >
                  {/* Timeline Dot */}
                  <div className={`absolute left-4 top-4 w-5 h-5 rounded-full border-2 hidden sm:flex items-center justify-center ${
                    level.achieved
                      ? 'bg-emerald-500 border-emerald-300'
                      : 'bg-white border-gray-300'
                  }`}>
                    {level.achieved && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>

                  <Card className={`shadow-sm relative overflow-hidden ${
                    level.achieved ? 'ring-2 ring-emerald-500/30' : ''
                  }`}>
                    {level.achieved && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-emerald-600 text-white text-[10px]">Conquistado</Badge>
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${level.color} text-white shrink-0`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 text-base">{level.name}</h4>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: level.starsRequired }).map((_, si) => (
                                <Star key={si} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Min. Estrelas</span>
                              <p className="font-medium">{level.starsRequired}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Min. Pontos</span>
                              <p className="font-medium">{level.pointsRequired}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Multiplicador</span>
                              <p className="font-medium text-emerald-600">{level.cashbackMultiplier}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Recompensa</span>
                              <p className="font-semibold text-emerald-700">{formatCurrency(level.reward)}</p>
                            </div>
                          </div>
                          {level.benefits.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {level.benefits.slice(0, 3).map((b, bi) => (
                                <Badge key={bi} variant="outline" className="text-[10px]">{b}</Badge>
                              ))}
                              {level.benefits.length > 3 && (
                                <Badge variant="outline" className="text-[10px]">+{level.benefits.length - 3}</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
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
              { action: 'Indicação direta ativa', points: '+2 pontos', icon: '👥', color: 'bg-emerald-50' },
              { action: 'Uso do App Mobilidade', points: '+1 ponto', icon: '🚗', color: 'bg-blue-50' },
              { action: 'Compra no Shopping', points: '+1 ponto', icon: '🛍️', color: 'bg-amber-50' },
              { action: 'Avaliação positiva recebida', points: '+1 ponto', icon: '⭐', color: 'bg-yellow-50' },
              { action: 'Pagamento em dia', points: '+2 pontos', icon: '💳', color: 'bg-teal-50' },
              { action: 'Ativação de residual na rede', points: '+3 pontos', icon: '🔄', color: 'bg-rose-50' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className={`flex items-center gap-3 p-3 ${item.color} rounded-lg`}
              >
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.action}</p>
                  <p className="text-xs text-emerald-600 font-semibold">{item.points}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
