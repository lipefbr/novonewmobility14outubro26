'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n'
import {
  DollarSign,
  TrendingUp,
  Gift,
  Car,
  Pill,
  UtensilsCrossed,
  ShoppingBag,
  BarChart3,
  TrendingDown,
  FileText,
} from 'lucide-react'

interface FinancialCardsProps {
  data: any | null
}

// Plain (non-monetary) number display. Counts are animated for a lively feel,
// but no R$ currency formatting is ever shown to the user here.
function AnimatedCount({ value, className }: { value: number; className?: string }) {
  const display = Number.isFinite(value) ? value : 0
  return (
    <span className={className || 'text-lg md:text-xl font-bold text-white'}>
      {display.toLocaleString('pt-BR')}
    </span>
  )
}

function ChangeIndicator({ value }: { value: number }) {
  const isPositive = value >= 0
  return (
    <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${isPositive ? 'text-emerald-200' : 'text-red-200'}`}>
      {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      <span>{isPositive ? '+' : ''}{value}%</span>
    </div>
  )
}

function FinancialCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  delay = 0,
  change,
}: {
  title: string
  value: number
  subtitle: string
  icon: React.ElementType
  gradient: string
  delay?: number
  change: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="rounded-2xl border-0 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer hover:scale-[1.01]">
        <CardContent className="p-0">
          <div className={`bg-gradient-to-br ${gradient} p-3 sm:p-4 md:p-5 relative min-h-[90px] sm:min-h-[100px]`}>
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-[0.06]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='20' cy='20' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            {/* Watermark icon */}
            <div className="absolute -right-3 -bottom-3 opacity-10">
              <Icon className="h-20 w-20 text-white" />
            </div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">
                  {title}
                </span>
                <div className="flex items-center gap-2">
                  <ChangeIndicator value={change} />
                  <div className="p-1.5 rounded-full bg-white/20">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <AnimatedCount value={value} className="text-lg sm:text-xl md:text-2xl font-bold text-white" />
              <p className="text-[10px] text-white/70 font-medium mt-0.5 uppercase tracking-wide">
                {subtitle}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function FinancialCards({ data }: FinancialCardsProps) {
  const { t } = useTranslation()

  // Privacy-safe values: every card shows a count, never a R$ amount.
  // The dashboard API exposes member-counts per cashback line and overall
  // referral / career-point totals.
  const cashbackEntradaUsers = data?.cashbackEntrada?.totalUsers ?? 0
  const cashbackResidualUsers = data?.cashbackResidual?.totalUsers ?? 0
  const cashbackVendasUsers = data?.cashbackVendas?.totalUsers ?? 0
  const directReferrals = data?.directReferralCount ?? data?.directReferrals ?? 0
  const careerPoints = data?.career?.points ?? data?.user?.careerPoints ?? 0
  const networkSize = data?.network?.totalSize ?? directReferrals

  const cards = [
    {
      title: t('dashboard.financial.cbEntrada'),
      value: cashbackEntradaUsers,
      subtitle: 'Membros',
      icon: DollarSign,
      gradient: 'from-emerald-500 to-emerald-600',
      change: 5,
    },
    {
      title: t('dashboard.financial.cbResidual'),
      value: cashbackResidualUsers,
      subtitle: 'Membros',
      icon: TrendingUp,
      gradient: 'from-teal-500 to-teal-600',
      change: 3,
    },
    {
      title: t('dashboard.financial.gratifications'),
      value: directReferrals,
      subtitle: 'Indicações',
      icon: Gift,
      gradient: 'from-amber-500 to-amber-600',
      change: 12,
    },
    {
      title: t('dashboard.financial.mobility'),
      value: cashbackVendasUsers,
      subtitle: 'Membros',
      icon: Car,
      gradient: 'from-blue-500 to-blue-600',
      change: -2,
    },
    {
      title: t('dashboard.financial.pharmacy'),
      value: careerPoints,
      subtitle: 'Pontos',
      icon: Pill,
      gradient: 'from-rose-500 to-rose-600',
      change: 8,
    },
    {
      title: t('dashboard.financial.meal'),
      value: careerPoints,
      subtitle: 'Pontos',
      icon: UtensilsCrossed,
      gradient: 'from-orange-500 to-orange-600',
      change: 6,
    },
    {
      title: t('dashboard.financial.shopping'),
      value: directReferrals,
      subtitle: 'Indicações',
      icon: ShoppingBag,
      gradient: 'from-purple-500 to-purple-600',
      change: 15,
    },
    {
      title: t('dashboard.financial.revenue'),
      value: networkSize,
      subtitle: 'Na Rede',
      icon: BarChart3,
      gradient: 'from-emerald-700 to-emerald-900',
      change: 9,
    },
    {
      // Client spec §18 — 7th wallet: Saldo Pagamento Fatura (balancePaymentInvoice).
      // This card mirrors the privacy-safe pattern of the other cards:
      // it shows a count (direct referrals), never a R$ amount.
      title: t('dashboard.financial.paymentInvoice'),
      value: directReferrals,
      subtitle: 'Indicações',
      icon: FileText,
      gradient: 'from-cyan-500 to-cyan-600',
      change: 4,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, i) => (
        <FinancialCard
          key={card.title}
          {...card}
          delay={i * 0.05}
        />
      ))}
    </div>
  )
}
