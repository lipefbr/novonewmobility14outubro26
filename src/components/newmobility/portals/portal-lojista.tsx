'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Store, TrendingUp, Users, Package, BarChart3, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

export function PortalLojista() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Portal do Lojista</h2>
        <p className="text-sm text-gray-500">Gerencie sua loja e acompanhe suas vendas</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 shadow-lg">
          <CardContent className="p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Store className="h-8 w-8" />
              <div>
                <h3 className="text-xl font-bold">Portal do Lojista</h3>
                <p className="text-emerald-200">Gerencie seus produtos e vendas</p>
              </div>
            </div>
            <p className="text-sm text-emerald-100">
              Acesse o portal completo para gerenciar sua loja, cadastrar produtos, acompanhar pedidos e visualizar relatórios de vendas.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Package, title: 'Meus Produtos', desc: 'Cadastre e gerencie seus produtos', count: '24' },
          { icon: TrendingUp, title: 'Vendas', desc: 'Acompanhe suas vendas', count: 'R$ 12.450' },
          { icon: Users, title: 'Clientes', desc: 'Visualize seus clientes', count: '156' },
          { icon: BarChart3, title: 'Relatórios', desc: 'Análise detalhada de desempenho', count: null },
          { icon: Settings, title: 'Configurações', desc: 'Configure sua loja', count: null },
          { icon: Store, title: 'Perfil da Loja', desc: 'Edite informações da loja', count: null },
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
                  <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600">
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
    </div>
  )
}
