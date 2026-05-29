'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency, formatDate, getStatusLabel, getStatusVariant } from '@/lib/utils'
import { Users, UserPlus, UserCheck, TrendingUp, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { motion } from 'framer-motion'

const mockReferrals = [
  { id: '1', name: 'Ana Paula Santos', date: '2024-11-15', status: 'active', plan: 'blue5', level: 1, cashback: 125000 },
  { id: '2', name: 'Roberto Ferreira', date: '2024-10-22', status: 'active', plan: 'blue3', level: 1, cashback: 89000 },
  { id: '3', name: 'Maria Clara Costa', date: '2024-09-05', status: 'active', plan: 'blue5', level: 1, cashback: 234000 },
  { id: '4', name: 'João Pedro Lima', date: '2024-08-18', status: 'inactive', plan: 'blue3', level: 1, cashback: 45000 },
  { id: '5', name: 'Lucas Mendes', date: '2024-12-01', status: 'active', plan: 'blue5', level: 2, cashback: 67000 },
  { id: '6', name: 'Fernanda Oliveira', date: '2024-07-10', status: 'active', plan: 'blue3', level: 2, cashback: 156000 },
  { id: '7', name: 'Ricardo Souza', date: '2024-06-15', status: 'active', plan: 'blue5', level: 2, cashback: 312000 },
  { id: '8', name: 'Patricia Alves', date: '2024-05-20', status: 'inactive', plan: 'free', level: 2, cashback: 12000 },
  { id: '9', name: 'Bruno Carvalho', date: '2024-11-28', status: 'active', plan: 'blue3', level: 3, cashback: 78000 },
  { id: '10', name: 'Camila Rodrigues', date: '2024-10-15', status: 'active', plan: 'blue5', level: 3, cashback: 198000 },
  { id: '11', name: 'Diego Martins', date: '2024-09-22', status: 'active', plan: 'blue3', level: 3, cashback: 95000 },
  { id: '12', name: 'Elisa Barbosa', date: '2024-08-30', status: 'active', plan: 'blue5', level: 4, cashback: 445000 },
]

export function ReferralsPage() {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<number | null>(null)

  const filtered = mockReferrals.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchesLevel = levelFilter === null || r.level === levelFilter
    return matchesSearch && matchesLevel
  })

  const totalDirect = mockReferrals.filter((r) => r.level === 1).length
  const totalNetwork = mockReferrals.length
  const activeCount = mockReferrals.filter((r) => r.status === 'active').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Meus Indicados</h2>
        <p className="text-sm text-gray-500">Gerencie e acompanhe sua rede de indicações</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">INDICAÇÕES DIRETAS</p>
                <p className="text-2xl font-bold text-gray-900">{totalDirect}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">TOTAL DA REDE</p>
                <p className="text-2xl font-bold text-gray-900">{totalNetwork}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">ATIVOS</p>
                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[null, 1, 2, 3, 4].map((level) => (
            <button
              key={level ?? 'all'}
              onClick={() => setLevelFilter(level)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                levelFilter === level
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {level === null ? 'Todos' : `Nível ${level}`}
            </button>
          ))}
        </div>
      </div>

      {/* Referral List */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="divide-y max-h-96 overflow-y-auto custom-scrollbar">
            {filtered.map((referral, i) => (
              <motion.div
                key={referral.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
              >
                <Avatar className="h-10 w-10 border-2 border-emerald-100">
                  <AvatarFallback className="bg-emerald-50 text-emerald-700 text-sm font-medium">
                    {referral.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{referral.name}</span>
                    <Badge variant={getStatusVariant(referral.status)} className="text-[10px]">
                      {getStatusLabel(referral.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{formatDate(referral.date)}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-emerald-600 font-medium">Nível {referral.level}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-emerald-700">{formatCurrency(referral.cashback)}</p>
                  <p className="text-[10px] text-gray-400">CashBack gerado</p>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum indicado encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Network Tree Visualization */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            Visualização da Rede
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            {/* You */}
            <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg">
              Você
            </div>
            <div className="w-px h-4 bg-gray-300" />
            {/* Level 1 */}
            <div>
              <p className="text-xs text-center text-gray-500 mb-2 font-medium">Nível 1 ({totalDirect} indicados)</p>
              <div className="flex flex-wrap justify-center gap-2">
                {mockReferrals.filter(r => r.level === 1).map((r) => (
                  <div
                    key={r.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      r.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}
                  >
                    {r.name.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            {/* Level 2 */}
            <div>
              <p className="text-xs text-center text-gray-500 mb-2 font-medium">
                Nível 2 ({mockReferrals.filter(r => r.level === 2).length} indicados)
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {mockReferrals.filter(r => r.level === 2).map((r) => (
                  <div
                    key={r.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      r.status === 'active'
                        ? 'bg-teal-100 text-teal-700 border border-teal-200'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}
                  >
                    {r.name.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <p className="text-xs text-gray-400 text-center">
              +{mockReferrals.filter(r => r.level > 2).length} membros nos níveis 3-4
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
