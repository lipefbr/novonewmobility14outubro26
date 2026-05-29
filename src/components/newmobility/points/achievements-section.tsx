'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import {
  Trophy, Star, Users, DollarSign, ArrowDownToLine, Award,
  Zap, Target, Crown, Flame, Gift, Shield, Lock
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Achievement {
  id: string
  icon: React.ElementType
  titleKey: string
  descriptionKey: string
  progress: number
  maxProgress: number
  earned: boolean
  earnedDate?: string
  category: 'referral' | 'financial' | 'engagement' | 'milestone'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

const achievements: Achievement[] = [
  { id: 'first_referral', icon: Users, titleKey: 'achievements.firstReferral', descriptionKey: 'achievements.firstReferralDesc', progress: 1, maxProgress: 1, earned: true, earnedDate: '2024-08-15', category: 'referral', rarity: 'common' },
  { id: 'ten_referrals', icon: UserPlus, titleKey: 'achievements.tenReferrals', descriptionKey: 'achievements.tenReferralsDesc', progress: 6, maxProgress: 10, earned: false, category: 'referral', rarity: 'rare' },
  { id: 'fifty_referrals', icon: Crown, titleKey: 'achievements.fiftyReferrals', descriptionKey: 'achievements.fiftyReferralsDesc', progress: 6, maxProgress: 50, earned: false, category: 'referral', rarity: 'epic' },
  { id: 'cashback_1000', icon: DollarSign, titleKey: 'achievements.cashback1000', descriptionKey: 'achievements.cashback1000Desc', progress: 100000, maxProgress: 100000, earned: true, earnedDate: '2024-10-22', category: 'financial', rarity: 'common' },
  { id: 'cashback_5000', icon: DollarSign, titleKey: 'achievements.cashback5000', descriptionKey: 'achievements.cashback5000Desc', progress: 3258000, maxProgress: 5000000, earned: false, category: 'financial', rarity: 'rare' },
  { id: 'first_withdrawal', icon: ArrowDownToLine, titleKey: 'achievements.firstWithdrawal', descriptionKey: 'achievements.firstWithdrawalDesc', progress: 1, maxProgress: 1, earned: true, earnedDate: '2024-09-10', category: 'financial', rarity: 'common' },
  { id: 'weekly_active', icon: Flame, titleKey: 'achievements.weeklyActive', descriptionKey: 'achievements.weeklyActiveDesc', progress: 3, maxProgress: 4, earned: false, category: 'engagement', rarity: 'rare' },
  { id: 'first_voucher', icon: Gift, titleKey: 'achievements.firstVoucher', descriptionKey: 'achievements.firstVoucherDesc', progress: 1, maxProgress: 1, earned: true, earnedDate: '2024-11-05', category: 'engagement', rarity: 'common' },
  { id: 'plan_upgrade', icon: Zap, titleKey: 'achievements.planUpgrade', descriptionKey: 'achievements.planUpgradeDesc', progress: 1, maxProgress: 1, earned: true, earnedDate: '2024-08-20', category: 'milestone', rarity: 'common' },
  { id: 'network_builder', icon: Target, titleKey: 'achievements.networkBuilder', descriptionKey: 'achievements.networkBuilderDesc', progress: 16, maxProgress: 25, earned: false, category: 'referral', rarity: 'rare' },
  { id: 'top_earner', icon: Trophy, titleKey: 'achievements.topEarner', descriptionKey: 'achievements.topEarnerDesc', progress: 65, maxProgress: 100, earned: false, category: 'financial', rarity: 'epic' },
  { id: 'security_master', icon: Shield, titleKey: 'achievements.securityMaster', descriptionKey: 'achievements.securityMasterDesc', progress: 2, maxProgress: 3, earned: false, category: 'engagement', rarity: 'legendary' },
  { id: 'career_bronze', icon: Award, titleKey: 'achievements.careerBronze', descriptionKey: 'achievements.careerBronzeDesc', progress: 42, maxProgress: 50, earned: false, category: 'milestone', rarity: 'rare' },
  { id: 'loyalty_1year', icon: Star, titleKey: 'achievements.loyalty1year', descriptionKey: 'achievements.loyalty1yearDesc', progress: 7, maxProgress: 12, earned: false, category: 'milestone', rarity: 'epic' },
]

function UserPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  )
}

const rarityColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  common: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700', glow: '' },
  rare: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', glow: '' },
  epic: { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', glow: 'shadow-purple-200/50 dark:shadow-purple-800/30' },
  legendary: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', glow: 'shadow-amber-200/50 dark:shadow-amber-800/30' },
}

const rarityLabels: Record<string, string> = {
  common: 'Comum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
}

const categoryIcons: Record<string, React.ElementType> = {
  referral: Users,
  financial: DollarSign,
  engagement: Zap,
  milestone: Award,
}

export function AchievementsSection() {
  const { user } = useStore()
  const { t } = useTranslation()

  const earnedCount = achievements.filter(a => a.earned).length
  const totalPoints = achievements.reduce((acc, a) => acc + (a.earned ? (a.rarity === 'legendary' ? 4 : a.rarity === 'epic' ? 3 : a.rarity === 'rare' ? 2 : 1) : 0), 0)

  const earnedAchievements = achievements.filter(a => a.earned)
  const lockedAchievements = achievements.filter(a => !a.earned)

  const formatProgress = (a: Achievement) => {
    if (a.maxProgress >= 100000) {
      return `R$ ${(a.progress / 100).toLocaleString('pt-BR')} / R$ ${(a.maxProgress / 100).toLocaleString('pt-BR')}`
    }
    return `${a.progress} / ${a.maxProgress}`
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-sm bg-card">
          <CardContent className="p-3 text-center">
            <Trophy className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{earnedCount}/{achievements.length}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{t('achievements.earned')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-card">
          <CardContent className="p-3 text-center">
            <Star className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{totalPoints}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{t('achievements.points')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-card">
          <CardContent className="p-3 text-center">
            <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{Math.round((earnedCount / achievements.length) * 100)}%</p>
            <p className="text-[10px] text-muted-foreground font-medium">{t('achievements.completion')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="shadow-sm bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">{t('achievements.overallProgress')}</span>
            <span className="text-sm font-bold text-emerald-600">{Math.round((earnedCount / achievements.length) * 100)}%</span>
          </div>
          <Progress value={(earnedCount / achievements.length) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Earned Achievements */}
      {earnedAchievements.length > 0 && (
        <Card className="shadow-sm bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              {t('achievements.earnedTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {earnedAchievements.map((achievement, i) => {
                const Icon = achievement.icon
                const colors = rarityColors[achievement.rarity]
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`relative p-4 rounded-xl border ${colors.border} ${colors.bg} ${colors.glow ? `shadow-md ${colors.glow}` : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-lg ${colors.bg} ${colors.text} border ${colors.border}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">{t(achievement.titleKey)}</h4>
                          <Badge className={`text-[9px] ${colors.text} ${colors.bg} border ${colors.border}`}>
                            {rarityLabels[achievement.rarity]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{t(achievement.descriptionKey)}</p>
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                          <Star className="h-3 w-3" />
                          {achievement.earnedDate ? new Date(achievement.earnedDate).toLocaleDateString('pt-BR') : ''}
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked Achievements */}
      <Card className="shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            {t('achievements.lockedTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lockedAchievements.map((achievement, i) => {
              const Icon = achievement.icon
              const colors = rarityColors[achievement.rarity]
              const progressPct = Math.min(100, (achievement.progress / achievement.maxProgress) * 100)
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative p-4 rounded-xl border border-border bg-muted/30 opacity-80 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-muted text-muted-foreground border border-border">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-muted-foreground">{t(achievement.titleKey)}</h4>
                        <Badge className={`text-[9px] ${colors.text} ${colors.bg} border ${colors.border}`}>
                          {rarityLabels[achievement.rarity]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{t(achievement.descriptionKey)}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>{formatProgress(achievement)}</span>
                          <span>{progressPct.toFixed(0)}%</span>
                        </div>
                        <Progress value={progressPct} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
