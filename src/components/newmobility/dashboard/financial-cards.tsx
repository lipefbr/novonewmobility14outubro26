'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
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
} from 'lucide-react'

interface FinancialCardsProps {
  data: any | null
}

function AnimatedCurrency({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true

    const duration = 1800
    const steps = 60
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  return (
    <span className={className || 'text-lg md:text-xl font-bold text-white'}>
      {formatCurrency(display)}
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

function FinancialCard({ title, valueInCents, icon: Icon, gradient, delay = 0, change }: {
  title: string
  valueInCents: number
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
      <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer hover:scale-[1.01]">
        <CardContent className="p-0">
          <div className={`bg-gradient-to-br ${gradient} p-4 md:p-5 relative min-h-[100px]`}>
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
                  <div className="p-1.5 rounded-lg bg-white/20">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <AnimatedCurrency value={valueInCents} className="text-xl md:text-2xl font-bold text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function FinancialCards({ data }: FinancialCardsProps) {
  const { t } = useTranslation()
  const b = data?.balances
  const cards = [
    {
      title: t('dashboard.financial.cbEntrada'),
      valueInCents: b?.cashbackEntrada ?? b?.withdrawal ?? 0,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-emerald-600',
      change: 5,
    },
    {
      title: t('dashboard.financial.cbResidual'),
      valueInCents: b?.cashbackResidual ?? 0,
      icon: TrendingUp,
      gradient: 'from-teal-500 to-teal-600',
      change: 3,
    },
    {
      title: t('dashboard.financial.gratifications'),
      valueInCents: b?.gratifications ?? b?.gratification ?? 0,
      icon: Gift,
      gradient: 'from-amber-500 to-amber-600',
      change: 12,
    },
    {
      title: t('dashboard.financial.mobility'),
      valueInCents: b?.balanceMobility ?? b?.mobility ?? 0,
      icon: Car,
      gradient: 'from-blue-500 to-blue-600',
      change: -2,
    },
    {
      title: t('dashboard.financial.pharmacy'),
      valueInCents: b?.balancePharmacy ?? b?.pharmacy ?? 0,
      icon: Pill,
      gradient: 'from-rose-500 to-rose-600',
      change: 8,
    },
    {
      title: t('dashboard.financial.meal'),
      valueInCents: b?.balanceFood ?? b?.food ?? 0,
      icon: UtensilsCrossed,
      gradient: 'from-orange-500 to-orange-600',
      change: 6,
    },
    {
      title: t('dashboard.financial.shopping'),
      valueInCents: b?.balanceShopping ?? b?.shopping ?? 0,
      icon: ShoppingBag,
      gradient: 'from-purple-500 to-purple-600',
      change: 15,
    },
    {
      title: t('dashboard.financial.revenue'),
      valueInCents: b?.totalRevenue ?? 0,
      icon: BarChart3,
      gradient: 'from-emerald-700 to-emerald-900',
      change: 9,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
