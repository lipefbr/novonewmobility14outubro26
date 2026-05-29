'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gamepad2, Trophy, Coins, Users, Swords, Star } from 'lucide-react'
import { motion } from 'framer-motion'

export function PortalGamer() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Portal Gamer</h2>
        <p className="text-sm text-gray-500">Jogos, torneios e recompensas</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 border-0 shadow-lg">
          <CardContent className="p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Gamepad2 className="h-8 w-8" />
              <div>
                <h3 className="text-xl font-bold">Portal Gamer</h3>
                <p className="text-purple-200">Jogue, compita e ganhe recompensas</p>
              </div>
            </div>
            <p className="text-sm text-purple-100">
              Participe de torneios, complete missões e ganhe CashBack e pontos enquanto se diverte.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Swords, title: 'Torneios Ativos', desc: 'Participe de torneios semanais', count: '3', color: 'bg-purple-100 text-purple-600' },
          { icon: Trophy, title: 'Ranking', desc: 'Veja sua posição no ranking', count: '#42', color: 'bg-amber-100 text-amber-600' },
          { icon: Coins, title: 'Moedas', desc: 'Saldo de moedas gamer', count: '2.450', color: 'bg-emerald-100 text-emerald-600' },
          { icon: Star, title: 'Missões Diárias', desc: 'Complete missões para ganhar pontos', count: '5/8', color: 'bg-blue-100 text-blue-600' },
          { icon: Users, title: 'Equipe', desc: 'Monte sua equipe de jogadores', count: '4', color: 'bg-rose-100 text-rose-600' },
          { icon: Gamepad2, title: 'Jogos', desc: 'Explore todos os jogos disponíveis', count: '12', color: 'bg-teal-100 text-teal-600' },
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
                  <Badge variant="secondary" className="text-xs">{item.count}</Badge>
                </div>
                <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
