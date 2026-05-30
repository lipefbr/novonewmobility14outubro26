'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Smartphone, Apple, Download, QrCode, MapPin, Navigation,
  Shield, CreditCard, Star, Bell, Clock, Car, User,
  CheckCircle2, Zap, RefreshCw
} from 'lucide-react'
import { motion } from 'framer-motion'

const driverFeatures = [
  { icon: MapPin, label: 'GPS Integrado', desc: 'Navegação em tempo real' },
  { icon: Bell, label: 'Notificações', desc: 'Alertas de novas corridas' },
  { icon: CreditCard, label: 'Recebimentos', desc: 'Acompanhe seus ganhos' },
  { icon: Shield, label: 'Segurança', desc: 'Botão de emergência' },
  { icon: Star, label: 'Avaliações', desc: 'Veja suas notas' },
  { icon: Clock, label: 'Histórico', desc: 'Todas as suas corridas' },
]

const passengerFeatures = [
  { icon: Navigation, label: 'Rastreamento', desc: 'Acompanhe o motorista' },
  { icon: CreditCard, label: 'Pagamento Fácil', desc: 'Cartão, PIX ou CashBack' },
  { icon: Shield, label: 'Viagem Segura', desc: 'Compartilhe sua rota' },
  { icon: Star, label: 'Avaliação', desc: 'Avalie sua experiência' },
  { icon: Bell, label: 'Alertas', desc: 'Previsão de chegada' },
  { icon: Clock, label: 'Agendamento', desc: 'Agende corridas' },
]

const whatsNew = [
  { version: '3.2.0', date: 'Fev 2025', items: ['Modo escuro', 'Chat com motorista', 'PIX instantâneo'] },
  { version: '3.1.5', date: 'Jan 2025', items: ['Correção de bugs', 'Performance aprimorada', 'Novos mapas'] },
]

export function AppsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Acesso aos Apps</h2>
        <p className="text-sm text-gray-500">Faça download dos aplicativos NewMobility</p>
      </div>

      {/* Motorista App */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                  <Car className="h-5 w-5" />
                </div>
                App Motorista
                <Badge variant="outline" className="text-[10px] ml-1">v3.2.0</Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Aplicativo exclusivo para motoristas parceiros. Receba corridas, acompanhe seus ganhos e gerencie sua conta.
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {driverFeatures.map((feature, i) => (
                <div key={i} className="bg-emerald-50 rounded-lg p-3 text-center">
                  <feature.icon className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-gray-900">{feature.label}</p>
                  <p className="text-[10px] text-gray-500">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-emerald-200 hover:bg-emerald-50">
                <Smartphone className="h-6 w-6 text-emerald-600" />
                <span className="text-sm font-semibold">Android</span>
                <span className="text-[10px] text-gray-500">Google Play · 45MB</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-emerald-200 hover:bg-emerald-50">
                <Apple className="h-6 w-6 text-emerald-600" />
                <span className="text-sm font-semibold">iOS</span>
                <span className="text-[10px] text-gray-500">App Store · 52MB</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Passageiro App */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 h-2" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <div className="p-2 rounded-lg bg-teal-100 text-teal-600">
                  <User className="h-5 w-5" />
                </div>
                App Passageiro
                <Badge variant="outline" className="text-[10px] ml-1">v3.2.0</Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Solicite corridas, acompanhe em tempo real e pague com CashBack. Mobilidade urbana com economia.
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {passengerFeatures.map((feature, i) => (
                <div key={i} className="bg-teal-50 rounded-lg p-3 text-center">
                  <feature.icon className="h-5 w-5 text-teal-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-gray-900">{feature.label}</p>
                  <p className="text-[10px] text-gray-500">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-teal-200 hover:bg-teal-50">
                <Smartphone className="h-6 w-6 text-teal-600" />
                <span className="text-sm font-semibold">Android</span>
                <span className="text-[10px] text-gray-500">Google Play · 38MB</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-teal-200 hover:bg-teal-50">
                <Apple className="h-6 w-6 text-teal-600" />
                <span className="text-sm font-semibold">iOS</span>
                <span className="text-[10px] text-gray-500">App Store · 44MB</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* QR Code Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="shrink-0">
                <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-emerald-300">
                  <QrCode className="h-20 w-20 text-emerald-600" />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="font-bold text-gray-900 text-lg">Download Rápido</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Aponte a câmera do seu celular para o QR Code e faça o download instantâneo do app.
                </p>
                <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Smartphone className="h-3 w-3" />
                    Android 8+
                  </Badge>
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Apple className="h-3 w-3" />
                    iOS 14+
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* What's New */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-emerald-600" />
              Novidades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {whatsNew.map((release, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">v{release.version}</Badge>
                  <span className="text-xs text-gray-400">{release.date}</span>
                  {i === 0 && (
                    <Badge className="bg-amber-100 text-amber-700 text-[10px]">ATUAL</Badge>
                  )}
                </div>
                <ul className="space-y-1">
                  {release.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* App Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-bold text-gray-900 text-sm">Alta Performance</h4>
            <p className="text-xs text-gray-500 mt-1">Apps otimizados para funcionar mesmo com conexão lenta</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-bold text-gray-900 text-sm">Seguro e Privado</h4>
            <p className="text-xs text-gray-500 mt-1">Seus dados protegidos com criptografia de ponta</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
