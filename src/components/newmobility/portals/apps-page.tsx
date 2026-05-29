'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Smartphone, Apple, Download, QrCode } from 'lucide-react'
import { motion } from 'framer-motion'

export function AppsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Acesso aos Apps</h2>
        <p className="text-sm text-gray-500">Faça download dos aplicativos NewMobility</p>
      </div>

      {/* Motorista App */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                <Smartphone className="h-4 w-4" />
              </div>
              App Motorista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Aplicativo exclusivo para motoristas parceiros. Receba corridas, acompanhe seus ganhos e gerencie sua conta.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-emerald-200 hover:bg-emerald-50">
                <Smartphone className="h-6 w-6 text-emerald-600" />
                <span className="text-sm font-semibold">Android</span>
                <span className="text-[10px] text-gray-500">Download APK</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-emerald-200 hover:bg-emerald-50">
                <Apple className="h-6 w-6 text-emerald-600" />
                <span className="text-sm font-semibold">iOS</span>
                <span className="text-[10px] text-gray-500">App Store</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Passageiro App */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                <Smartphone className="h-4 w-4" />
              </div>
              App Passageiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Solicite corridas, acompanhe em tempo real e pague com CashBack. Mobilidade urbana com economia.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-blue-200 hover:bg-blue-50">
                <Smartphone className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-semibold">Android</span>
                <span className="text-[10px] text-gray-500">Google Play</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-blue-200 hover:bg-blue-50">
                <Apple className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-semibold">iOS</span>
                <span className="text-[10px] text-gray-500">App Store</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* QR Code Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="shadow-sm">
          <CardContent className="p-6 text-center">
            <QrCode className="h-16 w-16 text-emerald-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900">Escaneie o QR Code</h3>
            <p className="text-sm text-gray-500 mt-1">
              Aponte a câmera do seu celular para fazer o download rápido
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
