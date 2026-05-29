'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatNumber } from '@/lib/utils'
import { Users, DollarSign, Activity, Truck } from 'lucide-react'

interface StatsCardsProps {
  data: any | null
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true

    const duration = 1500
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
    <span className="text-2xl md:text-3xl font-bold text-gray-900">
      {formatNumber(display)}
    </span>
  )
}

export function StatsCards({ data }: StatsCardsProps) {
  const stats = [
    {
      title: 'USUÁRIOS DIRETOS',
      value: data?.directReferrals ?? 4,
      subtitle: `TOTAL ${formatNumber(data?.cashbackEntrada?.totalUsers ?? 1364)} USUÁRIOS`,
      icon: Users,
      color: 'border-emerald-200 bg-emerald-50',
      iconBg: 'bg-emerald-100 text-emerald-600',
      delay: 0,
    },
    {
      title: 'CASHBACK ENTRADA',
      value: data?.cashbackEntrada?.totalUsers ?? 1066,
      subtitle: `TOTAL ${formatNumber(data?.cashbackEntrada?.totalUsers ?? 1364)} USUÁRIOS`,
      icon: DollarSign,
      color: 'border-blue-200 bg-blue-50',
      iconBg: 'bg-blue-100 text-blue-600',
      delay: 0.1,
    },
    {
      title: 'CASHBACK RESIDUAL',
      value: data?.cashbackResidual?.totalUsers ?? 3,
      subtitle: `TOTAL DE ${formatNumber(data?.cashbackResidual?.totalUsers ?? 21844)} USUÁRIOS`,
      icon: Activity,
      color: 'border-amber-200 bg-amber-50',
      iconBg: 'bg-amber-100 text-amber-600',
      delay: 0.2,
    },
    {
      title: 'CASHBACK VENDAS',
      value: data?.cashbackVendas?.totalUsers ?? 106025,
      subtitle: `TOTAL ${formatNumber(data?.cashbackVendas?.totalUsers ?? 349524)} USUÁRIOS`,
      icon: Truck,
      color: 'border-purple-200 bg-purple-50',
      iconBg: 'bg-purple-100 text-purple-600',
      delay: 0.3,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay, duration: 0.4 }}
          >
            <Card className={cn('border shadow-sm hover:shadow-md transition-shadow', stat.color)}>
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    {stat.title}
                  </span>
                  <div className={cn('p-2 rounded-lg', stat.iconBg)}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <AnimatedNumber value={stat.value} />
                <p className="text-xs text-gray-500 mt-1 font-medium">{stat.subtitle}</p>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
