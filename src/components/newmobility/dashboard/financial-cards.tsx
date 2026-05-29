'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import {
  DollarSign,
  TrendingUp,
  Gift,
  Car,
  Pill,
  UtensilsCrossed,
  ShoppingBag,
  BarChart3,
} from 'lucide-react'

interface FinancialCardsProps {
  data: any | null
}

function AnimatedCurrency({ value }: { value: number }) {
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
    <span className="text-lg md:text-xl font-bold text-white">
      {formatCurrency(display)}
    </span>
  )
}

function FinancialCard({ title, valueInCents, icon: Icon, gradient, delay = 0 }: {
  title: string
  valueInCents: number
  icon: React.ElementType
  gradient: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
        <CardContent className="p-0">
          <div className={`bg-gradient-to-br ${gradient} p-4 md:p-5`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">
                {title}
              </span>
              <div className="p-1.5 rounded-lg bg-white/20">
                <Icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <AnimatedCurrency value={valueInCents} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function FinancialCards({ data }: FinancialCardsProps) {
  const b = data?.balances
  const cards = [
    {
      title: 'CASHBACK ENTRADA',
      valueInCents: b?.cashbackEntrada ?? 3258000,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'CASHBACK RESIDUAL',
      valueInCents: b?.cashbackResidual ?? 1824000,
      icon: TrendingUp,
      gradient: 'from-teal-500 to-teal-600',
    },
    {
      title: 'GRATIFICAÇÕES',
      valueInCents: b?.gratifications ?? 845000,
      icon: Gift,
      gradient: 'from-amber-500 to-amber-600',
    },
    {
      title: 'CASHBACK MOBILIDADE URBANA',
      valueInCents: b?.balanceMobility ?? 727000,
      icon: Car,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'CASHBACK FARMÁCIA',
      valueInCents: b?.balancePharmacy ?? 558000,
      icon: Pill,
      gradient: 'from-rose-500 to-rose-600',
    },
    {
      title: 'CASHBACK REFEIÇÃO',
      valueInCents: b?.balanceFood ?? 687000,
      icon: UtensilsCrossed,
      gradient: 'from-orange-500 to-orange-600',
    },
    {
      title: 'CASHBACK SHOPPING',
      valueInCents: b?.balanceShopping ?? 2727000,
      icon: ShoppingBag,
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'FATURAMENTO',
      valueInCents: b?.totalRevenue ?? 28345000,
      icon: BarChart3,
      gradient: 'from-emerald-700 to-emerald-900',
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
