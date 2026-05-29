'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStore } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import { Building2, Save, CreditCard, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

export function BankPage() {
  const { user } = useStore()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Acesso ao Banco</h2>
        <p className="text-sm text-gray-500">Gerencie suas informações bancárias</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 shadow-lg">
          <CardContent className="p-6 text-white">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8" />
              <div>
                <h3 className="text-xl font-bold">NewMobility Bank</h3>
                <p className="text-emerald-200">Sua conta digital integrada</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bank Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">SALDO PRINCIPAL</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(user?.balanceWithdrawal || 0)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">SALDO MOBILIDADE</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(user?.balanceMobility || 0)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">SALDO COMPRAS</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(user?.balanceShopping || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bank Details Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Dados Bancários para Recebimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banco</Label>
                <Input defaultValue="Banco do Brasil" />
              </div>
              <div className="space-y-2">
                <Label>Código do Banco</Label>
                <Input defaultValue="001" />
              </div>
              <div className="space-y-2">
                <Label>Agência</Label>
                <Input defaultValue="1234-5" />
              </div>
              <div className="space-y-2">
                <Label>Conta</Label>
                <Input defaultValue="67890-1" />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <Input defaultValue="Conta Corrente" disabled className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>CPF/Titular</Label>
                <Input defaultValue={user?.cpf || ''} disabled className="bg-gray-50" />
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
              <Shield className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-xs text-emerald-700">
                Seus dados bancários são protegidos com criptografia de ponta a ponta. Nunca compartilhe suas informações com terceiros.
              </p>
            </div>

            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Save className="h-4 w-4" />
              Atualizar Dados Bancários
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
