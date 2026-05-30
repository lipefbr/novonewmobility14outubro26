'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useStore } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import {
  Trophy, Star, TrendingUp, Award, Target, Crown,
  Zap, Shield, Percent, Gift, CheckCircle2, ArrowRight, Sparkles, Lock, Unlock
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
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-300 dark:border-amber-700',
    reward: 50000,
    cashbackMultiplier: '1.0x',
    achieved: true,
    benefits: ['CashBack Entrada básico', 'Suporte padrão', 'App Mobilidade'],
    nextReward: 'CashBack Residual',
    nextRewardIcon: '📈',
  },
  {
    id: 'silver',
    name: 'Prata',
    icon: Award,
    starsRequired: 2,
    pointsRequired: 20,
    color: 'from-gray-400 to-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800/30',
    textColor: 'text-gray-700 dark:text-gray-300',
    borderColor: 'border-gray-300 dark:border-gray-600',
    reward: 150000,
    cashbackMultiplier: '1.2x',
    achieved: true,
    benefits: ['CashBack Entrada completo', 'CashBack Residual', 'Voucher mensal R$20'],
    nextReward: 'CashBack Vendas',
    nextRewardIcon: '🛒',
  },
  {
    id: 'gold',
    name: 'Ouro',
    icon: Trophy,
    starsRequired: 3,
    pointsRequired: 30,
    color: 'from-yellow-500 to-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    reward: 500000,
    cashbackMultiplier: '1.5x',
    achieved: true,
    benefits: ['Tudo do Prata', 'CashBack Vendas', 'Gratificações premium', 'CashBack Farmácia'],
    nextReward: 'Portal Gamer',
    nextRewardIcon: '🎮',
  },
  {
    id: 'sapphire',
    name: 'Safira',
    icon: Crown,
    starsRequired: 4,
    pointsRequired: 40,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-300 dark:border-blue-700',
    reward: 1500000,
    cashbackMultiplier: '2.0x',
    achieved: false,
    benefits: ['Tudo do Ouro', 'Portal Gamer', 'Seguro Auto', 'Telemedicina'],
    nextReward: 'Portal Sport Bet',
    nextRewardIcon: '⚽',
  },
  {
    id: 'diamond',
    name: 'Diamante',
    icon: Crown,
    starsRequired: 5,
    pointsRequired: 60,
    color: 'from-cyan-400 to-cyan-500',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    textColor: 'text-cyan-700 dark:text-cyan-400',
    borderColor: 'border-cyan-300 dark:border-cyan-700',
    reward: 3000000,
    cashbackMultiplier: '2.5x',
    achieved: false,
    benefits: ['Tudo do Safira', 'Portal Sport Bet', 'Seguro de Vida', 'Plano Odontológico'],
    nextReward: 'CashBack Máximo',
    nextRewardIcon: '💎',
  },
  {
    id: 'platinum',
    name: 'Platina',
    icon: Crown,
    starsRequired: 6,
    pointsRequired: 100,
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-300 dark:border-emerald-700',
    reward: 5000000,
    cashbackMultiplier: '3.0x',
    achieved: false,
    benefits: ['Tudo do Diamante', 'CashBack máximo', 'Benefícios exclusivos VIP', 'Acesso antecipado'],
    nextReward: 'Benefícios Exclusivos VIP',
    nextRewardIcon: '👑',
  },
]

const motivationalMessages = [
  { minProgress: 0, maxProgress: 30, message: 'Continue firme! Cada passo conta na sua jornada.' },
  { minProgress: 30, maxProgress: 60, message: 'Você está no caminho certo! Não pare agora.' },
  { minProgress: 60, maxProgress: 85, message: 'Quase lá! O próximo rank está ao seu alcance.' },
  { minProgress: 85, maxProgress: 100, message: 'Incrível! Você está prestes a conquistar o próximo nível!' },
  { minProgress: 100, maxProgress: 999, message: 'Parabéns! Você atingiu o topo! Continue brilhando.' },
]

// Custom SVG Rank Badge with shimmer
function RankBadge({ level, size = 48, shimmer = false }: { level: typeof careerLevels[0]; size?: number; shimmer?: boolean }) {
  const colors: Record<string, string> = {
    bronze: '#b45309',
    silver: '#6b7280',
    gold: '#eab308',
    sapphire: '#3b82f6',
    diamond: '#06b6d4',
    platinum: '#10b981',
  }
  const color = colors[level.id] || '#10b981'
  const Icon = level.icon
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 48 48">
        {/* Shield/Badge shape */}
        <path
          d="M24 4 L40 12 L40 28 Q40 40 24 46 Q8 40 8 28 L8 12 Z"
          fill={color}
          opacity={0.15}
          stroke={color}
          strokeWidth={1.5}
        />
        <path
          d="M24 8 L36 14 L36 27 Q36 37 24 42 Q12 37 12 27 L12 14 Z"
          fill={color}
          opacity={0.3}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className="text-white" style={{ width: size * 0.35, height: size * 0.35 }} />
      </div>
      {/* Shimmer overlay on current rank badge */}
      {shimmer && (
        <div
          className="absolute inset-0 rounded-full animate-shimmer pointer-events-none"
          style={{
            mask: 'radial-gradient(circle, white 30%, transparent 70%)',
            WebkitMask: 'radial-gradient(circle, white 30%, transparent 70%)',
          }}
        />
      )}
    </div>
  )
}

// Animated Progress Ring Component
function ProgressRing({ progress, size = 120, strokeWidth = 10 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{Math.round(progress)}%</span>
        <span className="text-[10px] text-muted-foreground">Progresso</span>
      </div>
    </div>
  )
}

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

  // Rewards unlocked at current rank
  const unlockedRewards = [
    { label: 'CashBack Entrada', unlocked: true, icon: '💰' },
    { label: 'CashBack Residual', unlocked: achievedLevel.id !== 'bronze', icon: '📈' },
    { label: 'CashBack Vendas', unlocked: achievedLevel.id === 'gold' || achievedLevel.id === 'sapphire' || achievedLevel.id === 'diamond' || achievedLevel.id === 'platinum', icon: '🛒' },
    { label: 'Gratificações', unlocked: achievedLevel.id !== 'bronze', icon: '🎁' },
    { label: 'Portal Gamer', unlocked: achievedLevel.id === 'sapphire' || achievedLevel.id === 'diamond' || achievedLevel.id === 'platinum', icon: '🎮' },
    { label: 'Seguro Auto', unlocked: achievedLevel.id === 'sapphire' || achievedLevel.id === 'diamond' || achievedLevel.id === 'platinum', icon: '🚗' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('career.title')}</h2>
        <p className="text-sm text-muted-foreground">Acompanhe seu progresso e conquistas na carreira</p>
      </div>

      {/* Current Rank Card with Rank Badge and Progress Ring */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 animate-gradient-shift border-0 shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute inset-0 animate-shimmer" />
          <CardContent className="p-6 relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-white flex items-center gap-4">
                {/* Custom Rank Badge SVG with shimmer */}
                <div className="relative">
                  <RankBadge level={achievedLevel} size={70} shimmer />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ProgressRing progress={progressToNext} size={70} strokeWidth={6} />
                    <div>
                      <p className="text-emerald-200 text-xs font-medium">Patente Atual</p>
                      <h3 className="text-xl md:text-2xl font-bold shimmer-text">{achievedLevel.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 transition-all duration-300 ${
                          i < currentStars ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-emerald-200 ml-1">
                      {currentStars} {currentStars === 1 ? 'estrela' : 'estrelas'}
                    </span>
                  </div>
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

      {/* Level Up Progress Animation */}
      {nextLevel && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-sm border-emerald-100 dark:border-emerald-900/50 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-300 via-teal-400 to-emerald-500 animate-gradient-shift" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    <Zap className="h-4 w-4 text-emerald-600" />
                  </motion.div>
                  Progresso para {nextLevel.name}
                </span>
                <span className="text-sm font-bold text-emerald-600">
                  {currentPoints}/{nextLevel.pointsRequired} pontos
                </span>
              </div>
              <div className="relative">
                <Progress value={progressToNext} className="h-4" />
                <motion.div
                  className="absolute top-0 left-0 h-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  style={{ maxWidth: '100%' }}
                >
                  {/* Animated glow effect at the end of progress bar */}
                  <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-r from-transparent to-emerald-300 rounded-full animate-pulse-glow" />
                </motion.div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  Faltam <span className="font-semibold text-emerald-600">{nextLevel.pointsRequired - currentPoints} pontos</span> para atingir {nextLevel.name}
                </p>
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <Sparkles className="h-3 w-3" />
                  {Math.round(progressToNext)}%
                </div>
              </div>
              <div className="mt-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 flex items-start gap-2 border border-emerald-100 dark:border-emerald-900/50">
                <Zap className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{motivational.message}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1">
                    Cada estrela equivale a 2 pontos. Você precisa de {nextLevel.starsRequired} estrelas e {nextLevel.pointsRequired} pontos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Motivational Quote between current rank and next rank */}
      {nextLevel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12 }}
          className="relative"
        >
          <Card className="shadow-sm bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-orange-400" />
            <CardContent className="p-4 pl-5">
              <div className="flex items-center gap-3">
                <motion.span
                  className="text-2xl"
                  animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                >
                  💡
                </motion.span>
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    "{motivational.message}"
                  </p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">
                    Faltam apenas {nextLevel.pointsRequired - currentPoints} pontos para desbloquear {nextLevel.nextReward}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Next Reward Preview Card */}
      {nextLevel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            <Card className="shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 animate-gradient-shift" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <motion.div
                      className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    >
                      <span className="text-2xl">{nextLevel.nextRewardIcon}</span>
                    </motion.div>
                    <div className="absolute -top-1 -right-1">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                      >
                        <Sparkles className="h-4 w-4 text-amber-400" />
                      </motion.div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600 text-white text-[10px]">PRÓXIMA RECOMPENSA</Badge>
                    </div>
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-base mt-1">{nextLevel.nextReward}</h4>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                      Desbloqueie ao atingir o rank <span className="font-semibold">{nextLevel.name}</span>
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-muted-foreground">Recompensa</p>
                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(nextLevel.reward)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Próximo Rank Highlight with gradient border */}
      {nextLevel && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="shadow-sm relative overflow-hidden gradient-border">
            <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              PRÓXIMO RANK
            </div>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <RankBadge level={nextLevel} size={56} />
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-lg">{nextLevel.name}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: nextLevel.starsRequired }).map((_, si) => (
                      <Star key={si} className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Min. Pontos</span>
                      <p className="font-semibold text-foreground">{nextLevel.pointsRequired}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">CashBack</span>
                      <p className="font-semibold text-emerald-600">{nextLevel.cashbackMultiplier}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recompensa</span>
                      <p className="font-semibold text-emerald-600">{formatCurrency(nextLevel.reward)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Rewards Unlocked Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <Card className="shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Gift className="h-4 w-4 text-emerald-600" />
              Recompensas Desbloqueadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {unlockedRewards.map((reward, i) => (
                <motion.div
                  key={reward.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    reward.unlocked
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                      : 'bg-muted/50 border-border opacity-50'
                  }`}
                >
                  <span className="text-lg">{reward.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${reward.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>{reward.label}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {reward.unlocked ? (
                        <>
                          <Unlock className="h-2.5 w-2.5 text-emerald-500" />
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400">Desbloqueado</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground">Bloqueado</span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Benefícios Atuais */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              Benefícios Atuais — {achievedLevel.name}
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] ml-1 milestone-indicator relative">
                Ativo
              </Badge>
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
                  className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900/50"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-sm text-foreground">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Career Path Timeline with Alternating Layout on Desktop */}
      <div>
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          Trilha de Carreira
        </h3>
        <div className="relative">
          {/* Center Timeline Line for desktop */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400 via-emerald-200 to-gray-200 dark:via-emerald-800 dark:to-gray-700 hidden lg:block" />
          {/* Left Timeline Line for mobile */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400 via-emerald-200 to-gray-200 dark:via-emerald-800 dark:to-gray-700 lg:hidden" />

          <div className="space-y-4">
            {careerLevels.map((level, i) => {
              const Icon = level.icon
              const isEven = i % 2 === 0
              return (
                <motion.div
                  key={level.id}
                  initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className={`relative lg:flex ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} pl-16 lg:pl-0`}
                >
                  {/* Timeline Dot - desktop center */}
                  <div className={`absolute left-4 top-4 w-5 h-5 rounded-full border-2 lg:hidden items-center justify-center transition-all ${
                    level.achieved
                      ? 'bg-emerald-500 border-emerald-300 dark:border-emerald-600'
                      : 'bg-card border-gray-300 dark:border-gray-600'
                  }`}>
                    {level.achieved && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                        className="w-1.5 h-1.5 rounded-full bg-white"
                      />
                    )}
                  </div>

                  {/* Desktop alternating layout */}
                  <div className={`hidden lg:block lg:w-1/2 ${isEven ? 'lg:pr-12' : 'lg:pl-12'}`}>
                    <Card className={`shadow-sm relative overflow-hidden bg-card ${
                      level.achieved ? 'ring-2 ring-emerald-500/30 dark:ring-emerald-500/20' : ''
                    }`}>
                      {/* Gradient border on left/right based on position */}
                      {level.achieved && isEven && (
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                      )}
                      {level.achieved && !isEven && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                      )}
                      {level.achieved && (
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <Trophy className="h-3 w-3 text-amber-500" />
                          <Badge className="bg-emerald-600 text-white text-[10px]">Conquistado</Badge>
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <RankBadge level={level} size={44} />
                            {level.achieved && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4 + i * 0.1, type: 'spring' }}
                                className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 shadow-md"
                              >
                                <Star className="h-3 w-3 text-white fill-white" />
                              </motion.div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-foreground text-base">{level.name}</h4>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: level.starsRequired }).map((_, si) => (
                                  <Star key={si} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Min. Pontos</span>
                                <p className="font-medium text-foreground">{level.pointsRequired}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Multiplicador</span>
                                <p className="font-medium text-emerald-600">{level.cashbackMultiplier}</p>
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
                  </div>

                  {/* Center dot for desktop */}
                  <div className={`hidden lg:flex absolute left-1/2 top-4 -translate-x-1/2 w-6 h-6 rounded-full border-2 items-center justify-center transition-all z-10 bg-card ${
                    level.achieved
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {level.achieved && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                        className='w-2 h-2 rounded-full bg-white'
                      />
                    )}
                  </div>

                  {/* Empty space for the other side on desktop */}
                  <div className={`hidden lg:block lg:w-1/2 ${isEven ? 'lg:pl-12' : 'lg:pr-12'}`}>
                    {/* This side is empty for alternating layout */}
                  </div>

                  {/* Mobile layout (card only) */}
                  <div className="lg:hidden">
                    <Card className={`shadow-sm relative overflow-hidden bg-card ${
                      level.achieved ? 'ring-2 ring-emerald-500/30 dark:ring-emerald-500/20' : ''
                    }`}>
                      {level.achieved && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                      )}
                      {level.achieved && (
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <Trophy className="h-3 w-3 text-amber-500" />
                          <Badge className="bg-emerald-600 text-white text-[10px]">Conquistado</Badge>
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${level.color} text-white shrink-0 shadow-lg`}>
                              <Icon className="h-6 w-6" />
                            </div>
                            {level.achieved && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4 + i * 0.1, type: 'spring' }}
                                className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 shadow-md"
                              >
                                <Star className="h-3 w-3 text-white fill-white" />
                              </motion.div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-foreground text-base">{level.name}</h4>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: level.starsRequired }).map((_, si) => (
                                  <Star key={si} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Min. Estrelas</span>
                                <p className="font-medium text-foreground">{level.starsRequired}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Min. Pontos</span>
                                <p className="font-medium text-foreground">{level.pointsRequired}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Multiplicador</span>
                                <p className="font-medium text-emerald-600">{level.cashbackMultiplier}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Recompensa</span>
                                <p className="font-semibold text-emerald-600">{formatCurrency(level.reward)}</p>
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
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* How to earn points */}
      <Card className="shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-600" />
            Como Ganhar Pontos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { action: 'Indicação direta ativa', points: '+2 pontos', icon: '👥', color: 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50' },
              { action: 'Uso do App Mobilidade', points: '+1 ponto', icon: '🚗', color: 'bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50' },
              { action: 'Compra no Shopping', points: '+1 ponto', icon: '🛍️', color: 'bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50' },
              { action: 'Avaliação positiva recebida', points: '+1 ponto', icon: '⭐', color: 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-100 dark:border-yellow-900/50' },
              { action: 'Pagamento em dia', points: '+2 pontos', icon: '💳', color: 'bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50' },
              { action: 'Ativação de residual na rede', points: '+3 pontos', icon: '🔄', color: 'bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50' },
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
                  <p className="text-sm font-medium text-foreground">{item.action}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{item.points}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Career Tips Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 animate-gradient-shift" />
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">Dicas para Evoluir</h4>
                <div className="mt-2 space-y-2">
                  {[
                    { tip: 'Foque em indicações ativas — cada membro ativo gera mais pontos que inativos.', icon: '👥' },
                    { tip: 'Mantenha seus pagamentos em dia para ganhar pontos bônus toda semana.', icon: '💳' },
                    { tip: 'Use o app de mobilidade regularmente para acumular pontos de engajamento.', icon: '🚗' },
                    { tip: 'Ajude seus indicados a se ativarem — a rede residual vale 3 pontos cada.', icon: '🔄' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-sm shrink-0">{item.icon}</span>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">{item.tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
