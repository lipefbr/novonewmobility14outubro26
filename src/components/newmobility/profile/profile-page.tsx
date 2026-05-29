'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useStore } from '@/lib/store'
import { formatCurrency, getPlanName, getPlanPrice, timeSince, formatDate } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import {
  User, Building2, Lock, Save, Check, Camera, Shield, Calendar,
  CreditCard, Users, DollarSign, Copy, Check as CheckIcon, ArrowUpRight, Link2, Award,
  Verified, Mail, Phone, MapPin
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

export function ProfilePage() {
  const { t } = useTranslation()
  const { user, updateUser } = useStore()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')

  const [personalInfo, setPersonalInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    cpf: user?.cpf || '',
    address: 'Rua das Flores, 123 - Apt 45',
    city: 'São Paulo',
    state: 'SP',
  })

  const [bankInfo, setBankInfo] = useState({
    bankCode: '001',
    bankAgency: '1234-5',
    bankAccount: '67890-1',
    bankType: 'cc',
  })

  const [passwordInfo, setPasswordInfo] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleSavePersonal = () => {
    setSaving(true)
    setTimeout(() => {
      updateUser({ name: personalInfo.name, email: personalInfo.email, phone: personalInfo.phone })
      setSaving(false)
      toast({
        title: 'Dados atualizados',
        description: 'Suas informações pessoais foram salvas com sucesso.',
      })
    }, 800)
  }

  const handleSaveBank = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast({
        title: 'Dados bancários atualizados',
        description: 'Suas informações bancárias foram salvas com sucesso.',
      })
    }, 800)
  }

  const handleChangePassword = () => {
    if (passwordInfo.newPassword !== passwordInfo.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setPasswordInfo({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast({
        title: 'Senha alterada',
        description: 'Sua senha foi alterada com sucesso.',
      })
    }, 800)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user?.referralCode || '').then(() => {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    })
  }

  const memberSince = user?.createdAt ? timeSince(user.createdAt) : '0 dias'
  const totalEarned = (user?.balanceWithdrawal || 0) + (user?.balanceMobility || 0) +
    (user?.balanceShopping || 0) + (user?.balanceFood || 0) + (user?.balancePharmacy || 0) +
    (user?.balanceGratification || 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Dados Pessoais</h2>
        <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais e configurações</p>
      </div>

      {/* Profile Overview Card with enhanced cover */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-sm overflow-hidden">
          {/* Cover photo/banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 animate-gradient-shift h-28 relative">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "url(\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')\")"
            }} />
            <div className="absolute inset-0 animate-shimmer" />
          </div>
          <CardContent className="px-6 pb-6 -mt-14">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              {/* Profile Picture with upload overlay */}
              <div className="relative group/avatar">
                <Avatar className="h-24 w-24 border-4 border-card shadow-xl">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-bold">
                    {user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('') || 'CS'}
                  </AvatarFallback>
                </Avatar>
                {/* Upload overlay */}
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover/avatar:bg-black/40 transition-colors flex items-center justify-center">
                  <button className="opacity-0 group-hover/avatar:opacity-100 transition-opacity p-2 bg-emerald-600 rounded-full text-white shadow-lg hover:bg-emerald-700">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                {/* Verification badge */}
                <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-0.5">
                  <div className="bg-emerald-500 rounded-full p-1" title="Conta verificada">
                    <Verified className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-foreground">{user?.name}</h3>
                  {/* Account verification badges */}
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1">
                    <Verified className="h-3 w-3" />
                    Verificado
                  </Badge>
                  <Badge className={user?.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}>
                    <Shield className="h-3 w-3 mr-1" />
                    {user?.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Membro há {memberSince}
                  </span>
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    {getPlanName(user?.plan || 'free')}
                  </span>
                </div>
              </div>
              {user?.plan === 'free' || user?.plan === 'blue3' ? (
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                  <ArrowUpRight className="h-4 w-4" />
                  Upgrade
                </Button>
              ) : null}
            </div>

            <Separator className="my-4" />

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 text-center border border-emerald-100 dark:border-emerald-900/50">
                <DollarSign className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{formatCurrency(totalEarned)}</p>
                <p className="text-[10px] text-muted-foreground">Total Ganho</p>
              </div>
              <div className="bg-teal-50 dark:bg-teal-950/30 rounded-lg p-3 text-center border border-teal-100 dark:border-teal-900/50">
                <Users className="h-4 w-4 text-teal-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">6</p>
                <p className="text-[10px] text-muted-foreground">Indicações Diretas</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-center border border-amber-100 dark:border-amber-900/50">
                <Award className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">16</p>
                <p className="text-[10px] text-muted-foreground">Rede Total</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center border border-blue-100 dark:border-blue-900/50">
                <CreditCard className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{getPlanPrice(user?.plan || 'free')}/mês</p>
                <p className="text-[10px] text-muted-foreground">Plano Atual</p>
              </div>
            </div>

            {/* Referral Code */}
            <div className="mt-4 bg-muted/50 rounded-lg p-3 flex items-center justify-between border border-border">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs text-muted-foreground">Código de Indicação:</span>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{user?.referralCode || 'USER2025'}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleCopyCode}
              >
                {copiedCode ? <CheckIcon className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {copiedCode ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs with animated indicator */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="personal" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex-1 sm:flex-none">
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Informações Pessoais</span>
            <span className="sm:hidden">Pessoal</span>
          </TabsTrigger>
          <TabsTrigger value="bank" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex-1 sm:flex-none">
            <Building2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dados Bancários</span>
            <span className="sm:hidden">Bancário</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex-1 sm:flex-none">
            <Lock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Alterar Senha</span>
            <span className="sm:hidden">Senha</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-600" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input
                      value={personalInfo.name}
                      onChange={(e) => setPersonalInfo((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={personalInfo.phone}
                      onChange={(e) => setPersonalInfo((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input value={personalInfo.cpf} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">CPF não pode ser alterado</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Endereço</Label>
                    <Input
                      value={personalInfo.address}
                      onChange={(e) => setPersonalInfo((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={personalInfo.city}
                      onChange={(e) => setPersonalInfo((prev) => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input
                      value={personalInfo.state}
                      onChange={(e) => setPersonalInfo((prev) => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                </div>

                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={handleSavePersonal}
                  disabled={saving}
                >
                  {saving ? (
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Bank Info Tab */}
        <TabsContent value="bank" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  Dados Bancários
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-2">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Os dados bancários são usados para saques. Certifique-se de que estão corretos.
                  </p>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Input
                      value={bankInfo.bankCode}
                      onChange={(e) => setBankInfo((prev) => ({ ...prev, bankCode: e.target.value }))}
                      placeholder="Código do banco"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Conta</Label>
                    <div className="flex gap-3 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="bankType"
                          value="cc"
                          checked={bankInfo.bankType === 'cc'}
                          onChange={(e) => setBankInfo((prev) => ({ ...prev, bankType: e.target.value }))}
                          className="accent-emerald-600"
                        />
                        <span className="text-sm">Conta Corrente</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="bankType"
                          value="cp"
                          checked={bankInfo.bankType === 'cp'}
                          onChange={(e) => setBankInfo((prev) => ({ ...prev, bankType: e.target.value }))}
                          className="accent-emerald-600"
                        />
                        <span className="text-sm">Conta Poupança</span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Agência</Label>
                    <Input
                      value={bankInfo.bankAgency}
                      onChange={(e) => setBankInfo((prev) => ({ ...prev, bankAgency: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Conta</Label>
                    <Input
                      value={bankInfo.bankAccount}
                      onChange={(e) => setBankInfo((prev) => ({ ...prev, bankAccount: e.target.value }))}
                    />
                  </div>
                </div>

                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={handleSaveBank}
                  disabled={saving}
                >
                  {saving ? (
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar Dados Bancários
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-600" />
                  Alterar Senha
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator />
                <div className="space-y-2">
                  <Label>Senha Atual</Label>
                  <Input
                    type="password"
                    value={passwordInfo.currentPassword}
                    onChange={(e) => setPasswordInfo((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Digite sua senha atual"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <Input
                      type="password"
                      value={passwordInfo.newPassword}
                      onChange={(e) => setPasswordInfo((prev) => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Nova Senha</Label>
                    <Input
                      type="password"
                      value={passwordInfo.confirmPassword}
                      onChange={(e) => setPasswordInfo((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Repita a nova senha"
                    />
                  </div>
                </div>
                {passwordInfo.newPassword && passwordInfo.confirmPassword && passwordInfo.newPassword !== passwordInfo.confirmPassword && (
                  <p className="text-xs text-red-500">As senhas não coincidem</p>
                )}

                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={handleChangePassword}
                  disabled={saving || !passwordInfo.currentPassword || !passwordInfo.newPassword}
                >
                  {saving ? (
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Alterar Senha
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
