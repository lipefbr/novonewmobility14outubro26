'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, TrendingUp, Users, DollarSign, Calendar, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'

export function PortalSportBet() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Portal Sport Bet</h2>
        <p className="text-sm text-gray-500">Apostas esportivas e CashBack</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-r from-emerald-600 to-green-600 border-0 shadow-lg">
          <CardContent className="p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="h-8 w-8" />
              <div>
                <h3 className="text-xl font-bold">Portal Sport Bet</h3>
                <p className="text-emerald-200">Aposte com responsabilidade e ganhe CashBack</p>
              </div>
            </div>
            <p className="text-sm text-emerald-100">
              Acesse as melhores odds do mercado, faça suas apostas e receba CashBack em cada aposta realizada.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: TrendingUp, title: 'Apostas ao Vivo', desc: 'Acompanhe jogos em tempo real', count: '24', color: 'bg-emerald-100 text-emerald-600' },
          { icon: Calendar, title: 'Eventos', desc: 'Próximos eventos esportivos', count: '58', color: 'bg-blue-100 text-blue-600' },
          { icon: DollarSign, title: 'CashBack Apostas', desc: 'CashBack sobre suas apostas', count: '5%', color: 'bg-amber-100 text-amber-600' },
          { icon: BarChart3, title: 'Estatísticas', desc: 'Dados e análises esportivas', count: null, color: 'bg-purple-100 text-purple-600' },
          { icon: Users, title: 'Ligas', desc: 'Crie ou entre em ligas', count: '8', color: 'bg-rose-100 text-rose-600' },
          { icon: Trophy, title: 'Ranking Semanal', desc: 'Melhores apostadores da semana', count: '#15', color: 'bg-teal-100 text-teal-600' },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  {item.count && (
                    <Badge variant="secondary" className="text-xs">{item.count}</Badge>
                  )}
                </div>
                <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="shadow-sm border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <p className="text-sm text-amber-800">
            ⚠️ <strong>Jogue com responsabilidade.</strong> Apostas esportivas são destinadas apenas para maiores de 18 anos. 
            Se precisar de ajuda, ligue para o CVV: 188.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
