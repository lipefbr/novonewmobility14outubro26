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
  Verified, Mail, Phone, MapPin, Pencil, Eye, EyeOff, Smartphone, Globe, Key,
  ShieldCheck, ShieldAlert, ShieldX, Chrome, Apple
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

// Inline Editable Field component
function InlineField({ label, value, onChange, icon: Icon, type = 'text', disabled = false }: {
  label: string
  value: string
  onChange: (val: string) => void
  icon?: React.ElementType
  type?: string
  disabled?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)

  const handleSave = () => {
    onChange(tempValue)
    setEditing(false)
  }

  const handleCancel = () => {
    setTempValue(value)
    setEditing(false)
  }

  return (
    <div className="group space-y-1.5">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </Label>
      {editing ? (
        <div className="flex items-center gap-2">
          <Input
            type={type}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
          />
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-emerald-600 hover:text-emerald-700" onClick={handleSave}>
            <Check className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <p className={`text-sm font-medium ${disabled ? 'text-muted-foreground' : 'text-foreground'}`}>
            {type === 'password' ? '••••••' : value || '-'}
          </p>
          {!disabled && (
            <button
              onClick={() => { setTempValue(value); setEditing(true) }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground hover:text-emerald-600"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Security Score widget
function SecurityScore() {
  const [showPassword, setShowPassword] = useState(false)
  const checks = [
    { label: 'Senha forte', passed: true, icon: ShieldCheck },
    { label: '2FA ativado', passed: false, icon: ShieldAlert },
    { label: 'E-mail verificado', passed: true, icon: ShieldCheck },
    { label: 'Telefone verificado', passed: true, icon: ShieldCheck },
  ]
  const score = checks.filter(c => c.passed).length
  const total = checks.length
  const percentage = (score / total) * 100
  const level = percentage >= 75 ? 'Forte' : percentage >= 50 ? 'Médio' : 'Fraco'
  const levelColor = percentage >= 75 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-600' : 'text-red-600'
  const levelBg = percentage >= 75 ? 'bg-emerald-100 dark:bg-emerald-950/30' : percentage >= 50 ? 'bg-amber-100 dark:bg-amber-950/30' : 'bg-red-100 dark:bg-red-950/30'

  return (
    <Card className="shadow-sm bg-card">
      <CardHeader>
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-600" />
          Pontuação de Segurança
          <Badge className={`${levelBg} ${levelColor} text-[10px] border-0`}>{level}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90">
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
              <motion.circle
                cx="32" cy="32" r="28" fill="none" stroke={percentage >= 75 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${28 * 2 * Math.PI}`}
                initial={{ strokeDashoffset: 28 * 2 * Math.PI }}
                animate={{ strokeDashoffset: 28 * 2 * Math.PI * (1 - percentage / 100) }}
                transition={{ duration: 1 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-foreground">{score}/{total}</span>
            </div>
          </div>
          <div className="flex-1">
            {checks.map((check) => {
              const Icon = check.icon
              return (
                <div key={check.label} className="flex items-center gap-2 py-1">
                  <Icon className={`h-3.5 w-3.5 ${check.passed ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <span className="text-xs text-foreground">{check.label}</span>
                  {!check.passed && (
                    <Button variant="link" className="h-auto p-0 text-[10px] text-emerald-600">Ativar</Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Connected Accounts section
function ConnectedAccounts() {
  const accounts = [
    { name: 'Google', icon: Chrome, connected: true, color: 'text-red-500' },
    { name: 'Apple', icon: Apple, connected: false, color: 'text-gray-700 dark:text-gray-300' },
    { name: 'Facebook', icon: Globe, connected: false, color: 'text-blue-600' },
  ]
  return (
    <Card className="shadow-sm bg-card">
      <CardHeader>
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Link2 className="h-4 w-4 text-emerald-600" />
          Contas Conectadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accounts.map((account) => {
            const Icon = account.icon
            return (
              <div key={account.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${account.color}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{account.name}</p>
                    <p className="text-[10px] text-muted-foreground">{account.connected ? 'Conectado' : 'Não conectado'}</p>
                  </div>
                </div>
                <Badge variant={account.connected ? 'default' : 'outline'} className={`text-[10px] ${account.connected ? 'bg-emerald-600' : ''}`}>
                  {account.connected ? 'Conectado' : 'Conectar'}
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

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

  const tabs = [
    { value: 'personal', label: 'Informações Pessoais', shortLabel: 'Pessoal', icon: User },
    { value: 'bank', label: 'Dados Bancários', shortLabel: 'Bancário', icon: Building2 },
    { value: 'password', label: 'Alterar Senha', shortLabel: 'Senha', icon: Lock },
  ]

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
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 animate-gradient-shift h-28 relative">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "url(\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')\")"
            }} />
            <div className="absolute inset-0 animate-shimmer" />
          </div>
          <CardContent className="px-6 pb-6 -mt-14">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="relative group/avatar">
                <Avatar className="h-24 w-24 border-4 border-card shadow-xl">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-bold">
                    {user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('') || 'CS'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover/avatar:bg-black/40 transition-colors flex items-center justify-center">
                  <button className="opacity-0 group-hover/avatar:opacity-100 transition-opacity p-2 bg-emerald-600 rounded-full text-white shadow-lg hover:bg-emerald-700">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-0.5">
                  <div className="bg-emerald-500 rounded-full p-1" title="Conta verificada">
                    <Verified className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-foreground">{user?.name}</h3>
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

            <div className="mt-4 bg-muted/50 rounded-lg p-3 flex items-center justify-between border border-border">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs text-muted-foreground">Código de Indicação:</span>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{user?.referralCode || 'USER2025'}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleCopyCode}>
                {copiedCode ? <CheckIcon className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {copiedCode ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Score + Connected Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SecurityScore />
        <ConnectedAccounts />
      </div>

      {/* Tabs with sliding underline indicator */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="relative">
          <TabsList className="w-full sm:w-auto bg-transparent p-0 h-auto border-b border-border">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="gap-1.5 data-[state=active]:bg-transparent data-[state=active]:text-emerald-600 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:font-semibold flex-1 sm:flex-none transition-all"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {/* Personal Info Tab with Inline Editable Fields */}
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
                  <InlineField label="Nome Completo" value={personalInfo.name} onChange={(v) => setPersonalInfo((p) => ({ ...p, name: v }))} icon={User} />
                  <InlineField label="E-mail" value={personalInfo.email} onChange={(v) => setPersonalInfo((p) => ({ ...p, email: v }))} icon={Mail} type="email" />
                  <InlineField label="Telefone" value={personalInfo.phone} onChange={(v) => setPersonalInfo((p) => ({ ...p, phone: v }))} icon={Phone} />
                  <InlineField label="CPF" value={personalInfo.cpf} onChange={() => {}} icon={Shield} disabled />
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <InlineField label="Endereço" value={personalInfo.address} onChange={(v) => setPersonalInfo((p) => ({ ...p, address: v }))} icon={MapPin} />
                  </div>
                  <InlineField label="Cidade" value={personalInfo.city} onChange={(v) => setPersonalInfo((p) => ({ ...p, city: v }))} />
                  <InlineField label="Estado" value={personalInfo.state} onChange={(v) => setPersonalInfo((p) => ({ ...p, state: v }))} />
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
                  <InlineField label="Banco" value={bankInfo.bankCode} onChange={(v) => setBankInfo((p) => ({ ...p, bankCode: v }))} />
                  <div className="space-y-2">
                    <Label>Tipo de Conta</Label>
                    <div className="flex gap-3 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="bankType" value="cc" checked={bankInfo.bankType === 'cc'} onChange={(e) => setBankInfo((p) => ({ ...p, bankType: e.target.value }))} className="accent-emerald-600" />
                        <span className="text-sm">Conta Corrente</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="bankType" value="cp" checked={bankInfo.bankType === 'cp'} onChange={(e) => setBankInfo((p) => ({ ...p, bankType: e.target.value }))} className="accent-emerald-600" />
                        <span className="text-sm">Conta Poupança</span>
                      </label>
                    </div>
                  </div>
                  <InlineField label="Agência" value={bankInfo.bankAgency} onChange={(v) => setBankInfo((p) => ({ ...p, bankAgency: v }))} />
                  <InlineField label="Conta" value={bankInfo.bankAccount} onChange={(v) => setBankInfo((p) => ({ ...p, bankAccount: v }))} />
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleSaveBank} disabled={saving}>
                  {saving ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
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
                    onChange={(e) => setPasswordInfo((p) => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="Digite sua senha atual"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <Input
                      type="password"
                      value={passwordInfo.newPassword}
                      onChange={(e) => setPasswordInfo((p) => ({ ...p, newPassword: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Nova Senha</Label>
                    <Input
                      type="password"
                      value={passwordInfo.confirmPassword}
                      onChange={(e) => setPasswordInfo((p) => ({ ...p, confirmPassword: e.target.value }))}
                      placeholder="Repita a nova senha"
                    />
                  </div>
                </div>
                {passwordInfo.newPassword && passwordInfo.confirmPassword && passwordInfo.newPassword !== passwordInfo.confirmPassword && (
                  <p className="text-xs text-red-500">As senhas não coincidem</p>
                )}
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleChangePassword} disabled={saving || !passwordInfo.currentPassword || !passwordInfo.newPassword}>
                  {saving ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock className="h-4 w-4" />}
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
