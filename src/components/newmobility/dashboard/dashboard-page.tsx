'use client'

import { useStore } from '@/lib/store'
import { dashboardApi } from '@/lib/api'
import { formatCurrency, timeSince, formatDate, getPlanName } from '@/lib/utils'
import { StatsCards } from './stats-cards'
import { FinancialCards } from './financial-cards'
import { DashboardCharts } from './charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
  Copy,
  Link2,
  Smartphone,
  Apple,
  Check,
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface DashboardData {
  user: any
  directReferrals: number
  cashbackEntrada: { totalUsers: number; totalEarned: number }
  cashbackResidual: { totalUsers: number; totalEarned: number }
  cashbackVendas: { totalUsers: number; totalEarned: number }
  balances: any
  recentTransactions: any[]
  career: any
}

export function DashboardPage() {
  const { user } = useStore()
  const [copied, setCopied] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadDashboard()
    }
  }, [user?.id])

  const loadDashboard = async () => {
    try {
      const data = await dashboardApi.getData(user!.id)
      setDashboardData(data)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${user?.referralCode || 'USER'}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 border-0 shadow-lg">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-white">
                <h2 className="text-xl md:text-2xl font-bold">
                  👋 Bem-vindo(a), {user?.name?.split(' ')[0] || 'Usuário'}
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-emerald-100 text-sm">
                  <span>Usuário desde: {user?.createdAt ? formatDate(user.createdAt) : '-'}</span>
                  <span className="hidden sm:inline">|</span>
                  <span className="font-medium text-white">{user?.createdAt ? timeSince(user.createdAt) : '-'}</span>
                  <Badge variant="secondary" className="w-fit bg-white/20 text-white border-0">
                    {getPlanName(user?.plan || 'free')}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2">
                  <Link2 className="h-4 w-4 text-emerald-200 shrink-0" />
                  <span className="text-sm text-white truncate max-w-[200px] md:max-w-[260px]">
                    🔗 Link de indicação do CashBack:
                  </span>
                  <span className="text-sm font-mono text-white font-medium truncate max-w-[160px]">
                    {referralLink}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-7 px-2 text-emerald-200 hover:text-white hover:bg-white/15"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <StatsCards data={dashboardData} />

      {/* Financial Cards */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">Financeiro</h3>
        <FinancialCards data={dashboardData} />
      </div>

      {/* App Download Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-600" />
              Download dos Apps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col gap-1.5 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
              >
                <Smartphone className="h-5 w-5 text-emerald-600" />
                <span className="text-xs font-semibold">Android</span>
                <span className="text-[10px] text-gray-500">Motorista</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col gap-1.5 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
              >
                <Apple className="h-5 w-5 text-emerald-600" />
                <span className="text-xs font-semibold">iOS</span>
                <span className="text-[10px] text-gray-500">Motorista</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col gap-1.5 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
              >
                <Smartphone className="h-5 w-5 text-blue-600" />
                <span className="text-xs font-semibold">Android</span>
                <span className="text-[10px] text-gray-500">Passageiro</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col gap-1.5 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
              >
                <Apple className="h-5 w-5 text-blue-600" />
                <span className="text-xs font-semibold">iOS</span>
                <span className="text-[10px] text-gray-500">Passageiro</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <DashboardCharts data={dashboardData} />
    </div>
  )
}
