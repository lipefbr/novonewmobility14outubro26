'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Search,
  Eye,
  Edit,
  LogIn,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users as UsersIcon,
  UserCheck,
  UserX,
  Save,
  RefreshCw,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { apiFetch } from '@/lib/api'
import { formatBRL } from '@/lib/format'
import { formatDate, formatDateTime } from '@/lib/utils'

// ----- User types (10 options) -----

export const USER_TYPES = [
  { value: 'gratuito', label: 'Gratuito', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  { value: 'inativo', label: 'Inativo', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  { value: 'usuario', label: 'Usuário', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'motorista', label: 'Motorista', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { value: 'entregador', label: 'Entregador', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
  { value: 'loja', label: 'Loja', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'parceiro', label: 'Parceiro', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { value: 'empresa', label: 'Empresa', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  { value: 'afiliado', label: 'Afiliado', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
  { value: 'administrador', label: 'Administrador', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
] as const

const PLAN_OPTIONS = [
  { value: 'free', label: 'Gratuito' },
  { value: 'blue3', label: 'Blue 3' },
  { value: 'blue5', label: 'Blue 5 Premium' },
]

function userTypeBadge(type?: string) {
  const t = USER_TYPES.find((x) => x.value === (type || 'usuario'))
  return t || USER_TYPES[2]
}

function planBadge(plan?: string) {
  switch (plan) {
    case 'blue5':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    case 'blue3':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

function kycBadge(status?: string) {
  switch (status) {
    case 'approved':
      return { label: 'Aprovado', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' }
    case 'pending':
      return { label: 'Pendente', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' }
    case 'rejected':
      return { label: 'Rejeitado', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' }
    default:
      return { label: 'Não enviado', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' }
  }
}

// ----- Types -----

interface AdminUser {
  id: string
  name: string
  email: string
  phone?: string | null
  cpf?: string | null
  plan: string
  isActive: boolean
  userType?: string
  kycStatus?: string
  role?: string
  referralCode?: string
  isDriver?: boolean
  isDelivery?: boolean
  entradaLevel?: number
  residualLevel?: number
  vendasLevel?: number
  balanceWithdrawal: number
  balanceMobility: number
  balanceShopping: number
  balanceFood: number
  balancePharmacy: number
  balanceGratification: number
  balancePaymentInvoice: number
  balanceFree?: number
  balancePending?: number
  careerPoints?: number
  personalPoints?: number
  stars?: number
  city?: string | null
  state?: string | null
  country?: string | null
  createdAt?: string
  _count?: { referrals: number }
}

interface AdminUsersResponse {
  users: AdminUser[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface EditFormData {
  name: string
  email: string
  phone: string
  cpf: string
  userType: string
  plan: string
  isActive: boolean
  isDriver: boolean
  isDelivery: boolean
  entradaLevel: number
  residualLevel: number
  vendasLevel: number
  balanceWithdrawal: number
  balanceMobility: number
  balanceShopping: number
  balanceFood: number
  balancePharmacy: number
  balanceGratification: number
  balancePaymentInvoice: number
  careerPoints: number
  personalPoints: number
  stars: number
}

const EMPTY_EDIT: EditFormData = {
  name: '',
  email: '',
  phone: '',
  cpf: '',
  userType: 'usuario',
  plan: 'free',
  isActive: true,
  isDriver: false,
  isDelivery: false,
  entradaLevel: 0,
  residualLevel: 0,
  vendasLevel: 0,
  balanceWithdrawal: 0,
  balanceMobility: 0,
  balanceShopping: 0,
  balanceFood: 0,
  balancePharmacy: 0,
  balanceGratification: 0,
  balancePaymentInvoice: 0,
  careerPoints: 0,
  personalPoints: 0,
  stars: 0,
}

export function AdminUsersPanel() {
  const { user, login } = useStore()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [impersonating, setImpersonating] = useState<string | null>(null)
  const [data, setData] = useState<AdminUsersResponse | null>(null)

  const [search, setSearch] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 20

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState<EditFormData>(EMPTY_EDIT)

  const [viewOpen, setViewOpen] = useState(false)
  const [viewing, setViewing] = useState<AdminUser | null>(null)

  const loadUsers = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        userId: user.id,
        page: String(page),
        limit: String(limit),
      })
      if (search) params.set('search', search)
      if (userTypeFilter !== 'all') params.set('userType', userTypeFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await apiFetch<AdminUsersResponse>(`/admin/users?${params}`)
      setData(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }, [user?.id, page, search, userTypeFilter, statusFilter])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const stats = useMemo(() => {
    if (!data?.users) return { total: 0, active: 0, inactive: 0, drivers: 0 }
    const users = data.users
    return {
      total: data.total,
      active: users.filter((u) => u.isActive).length,
      inactive: users.filter((u) => !u.isActive).length,
      drivers: users.filter((u) => u.isDriver || u.isDelivery).length,
    }
  }, [data])

  const openEdit = (u: AdminUser) => {
    setEditing(u)
    setEditForm({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      cpf: u.cpf || '',
      userType: u.userType || 'usuario',
      plan: u.plan || 'free',
      isActive: u.isActive,
      isDriver: u.isDriver || false,
      isDelivery: u.isDelivery || false,
      entradaLevel: u.entradaLevel || 0,
      residualLevel: u.residualLevel || 0,
      vendasLevel: u.vendasLevel || 0,
      balanceWithdrawal: u.balanceWithdrawal || 0,
      balanceMobility: u.balanceMobility || 0,
      balanceShopping: u.balanceShopping || 0,
      balanceFood: u.balanceFood || 0,
      balancePharmacy: u.balancePharmacy || 0,
      balanceGratification: u.balanceGratification || 0,
      balancePaymentInvoice: u.balancePaymentInvoice || 0,
      careerPoints: u.careerPoints || 0,
      personalPoints: u.personalPoints || 0,
      stars: u.stars || 0,
    })
    setEditOpen(true)
  }

  const openView = (u: AdminUser) => {
    setViewing(u)
    setViewOpen(true)
  }

  const handleSave = async () => {
    if (!editing || !user?.id) return
    setSaving(true)
    try {
      await apiFetch(`/admin/users/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({ userId: user.id, ...editForm }),
      })
      toast.success('Usuário atualizado com sucesso')
      setEditOpen(false)
      setEditing(null)
      loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar usuário')
    } finally {
      setSaving(false)
    }
  }

  const handleLoginAs = async (u: AdminUser) => {
    if (!user?.id) return
    setImpersonating(u.id)
    try {
      const res = await apiFetch<{
        user: Record<string, unknown>
        adminId: string
        adminName: string
        redirectUrl: string
        message: string
      }>(`/admin/users/${u.id}/login-as`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      })
      toast.success(res.message || `Agora acessando como ${u.name}`)
      // Remember admin id in sessionStorage so the user can return to admin mode.
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('newmobility_admin_impersonating', res.adminId)
        sessionStorage.setItem('newmobility_admin_name', res.adminName)
      }
      // Swap the current session in zustand to the impersonated user.
      login(res.user as never)
      // Hard navigate to the user backoffice root.
      window.location.href = res.redirectUrl || '/'
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao entrar como usuário')
    } finally {
      setImpersonating(null)
    }
  }

  const handleExportCSV = () => {
    if (!data?.users?.length) {
      toast.info('Nenhum usuário para exportar')
      return
    }
    const headers = ['Nome', 'Email', 'CPF', 'Tipo', 'Plano', 'Status', 'KYC', 'Saldo Saque']
    const rows = data.users.map((u) => [
      u.name,
      u.email,
      u.cpf || '',
      u.userType || 'usuario',
      u.plan,
      u.isActive ? 'Ativo' : 'Inativo',
      u.kycStatus || 'none',
      String(u.balanceWithdrawal || 0),
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usuarios-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
              <UsersIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-foreground">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
              <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Ativos (página)</p>
              <p className="text-xl font-bold text-foreground">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
              <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Inativos (página)</p>
              <p className="text-xl font-bold text-foreground">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Motoristas/Entregadores</p>
              <p className="text-xl font-bold text-foreground">{stats.drivers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou código..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={userTypeFilter} onValueChange={(v) => { setUserTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Todos os tipos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {USER_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs shrink-0" onClick={handleExportCSV}>
              <Download className="h-3.5 w-3.5" /> Exportar
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs shrink-0" onClick={loadUsers} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3">Usuário</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden md:table-cell">CPF</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3">Tipo</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden sm:table-cell">Plano</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden lg:table-cell">KYC</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden md:table-cell">Saldo Saque</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">
                      <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                        <span className="h-4 w-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                        Carregando usuários...
                      </div>
                    </td>
                  </tr>
                ) : data?.users && data.users.length > 0 ? (
                  data.users.map((u) => {
                    const typeBadge = userTypeBadge(u.userType)
                    const kyc = kycBadge(u.kycStatus)
                    return (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <p className="text-sm font-medium text-foreground">{u.name}</p>
                          <p className="text-[10px] text-muted-foreground">{u.email}</p>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">{u.cpf || '—'}</span>
                        </td>
                        <td className="p-3">
                          <Badge className={typeBadge.color}>{typeBadge.label}</Badge>
                        </td>
                        <td className="p-3 hidden sm:table-cell">
                          <Badge className={planBadge(u.plan)}>{u.plan === 'blue5' ? 'Blue 5' : u.plan === 'blue3' ? 'Blue 3' : 'Gratuito'}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={u.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}>
                            {u.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="p-3 hidden lg:table-cell">
                          <Badge className={kyc.cls}>{kyc.label}</Badge>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <span className="text-sm font-semibold text-foreground">{formatBRL(u.balanceWithdrawal)}</span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="default"
                              size="sm"
                              className="h-7 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleLoginAs(u)}
                              disabled={impersonating === u.id || u.role === 'admin'}
                              title={u.role === 'admin' ? 'Não é possível entrar como admin' : 'Entrar no backoffice do usuário'}
                            >
                              {impersonating === u.id
                                ? <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <LogIn className="h-3.5 w-3.5" />}
                              <span className="hidden xl:inline">Entrar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-xs"
                              onClick={() => openView(u)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">Ver</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-xs"
                              onClick={() => openEdit(u)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">Editar</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">
                      <UsersIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-border">
              <span className="text-xs text-muted-foreground">{data.total} usuários</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-xs text-muted-foreground">{page}/{data.totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-emerald-600" />
              Editar Usuário
            </DialogTitle>
            <DialogDescription>
              {editing?.name} ({editing?.email})
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="personal">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Pessoal</TabsTrigger>
              <TabsTrigger value="type">Tipo & Plano</TabsTrigger>
              <TabsTrigger value="balances">Saldos & Pontos</TabsTrigger>
            </TabsList>
            <TabsContent value="personal" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm((d) => ({ ...d, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input value={editForm.email} onChange={(e) => setEditForm((d) => ({ ...d, email: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Telefone</Label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm((d) => ({ ...d, phone: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">CPF</Label>
                  <Input value={editForm.cpf} onChange={(e) => setEditForm((d) => ({ ...d, cpf: e.target.value }))} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="type" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de Usuário</Label>
                  <Select value={editForm.userType} onValueChange={(v) => setEditForm((d) => ({ ...d, userType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {USER_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Plano</Label>
                  <Select value={editForm.plan} onValueChange={(v) => setEditForm((d) => ({ ...d, plan: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label className="text-xs">Ativo</Label>
                  <Switch checked={editForm.isActive} onCheckedChange={(v) => setEditForm((d) => ({ ...d, isActive: v }))} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label className="text-xs">Motorista</Label>
                  <Switch checked={editForm.isDriver} onCheckedChange={(v) => setEditForm((d) => ({ ...d, isDriver: v }))} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label className="text-xs">Entregador</Label>
                  <Switch checked={editForm.isDelivery} onCheckedChange={(v) => setEditForm((d) => ({ ...d, isDelivery: v }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nível Entrada</Label>
                  <Input type="number" value={editForm.entradaLevel} onChange={(e) => setEditForm((d) => ({ ...d, entradaLevel: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nível Residual</Label>
                  <Input type="number" value={editForm.residualLevel} onChange={(e) => setEditForm((d) => ({ ...d, residualLevel: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nível Vendas</Label>
                  <Input type="number" value={editForm.vendasLevel} onChange={(e) => setEditForm((d) => ({ ...d, vendasLevel: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="balances" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Saque (cents)</Label>
                  <Input type="number" value={editForm.balanceWithdrawal} onChange={(e) => setEditForm((d) => ({ ...d, balanceWithdrawal: parseInt(e.target.value) || 0 }))} />
                  <p className="text-[10px] text-muted-foreground">{formatBRL(editForm.balanceWithdrawal)}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Mobilidade</Label>
                  <Input type="number" value={editForm.balanceMobility} onChange={(e) => setEditForm((d) => ({ ...d, balanceMobility: parseInt(e.target.value) || 0 }))} />
                  <p className="text-[10px] text-muted-foreground">{formatBRL(editForm.balanceMobility)}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Compras</Label>
                  <Input type="number" value={editForm.balanceShopping} onChange={(e) => setEditForm((d) => ({ ...d, balanceShopping: parseInt(e.target.value) || 0 }))} />
                  <p className="text-[10px] text-muted-foreground">{formatBRL(editForm.balanceShopping)}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Refeição</Label>
                  <Input type="number" value={editForm.balanceFood} onChange={(e) => setEditForm((d) => ({ ...d, balanceFood: parseInt(e.target.value) || 0 }))} />
                  <p className="text-[10px] text-muted-foreground">{formatBRL(editForm.balanceFood)}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Farmácia</Label>
                  <Input type="number" value={editForm.balancePharmacy} onChange={(e) => setEditForm((d) => ({ ...d, balancePharmacy: parseInt(e.target.value) || 0 }))} />
                  <p className="text-[10px] text-muted-foreground">{formatBRL(editForm.balancePharmacy)}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Gratificação</Label>
                  <Input type="number" value={editForm.balanceGratification} onChange={(e) => setEditForm((d) => ({ ...d, balanceGratification: parseInt(e.target.value) || 0 }))} />
                  <p className="text-[10px] text-muted-foreground">{formatBRL(editForm.balanceGratification)}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Pag. Fatura</Label>
                  <Input type="number" value={editForm.balancePaymentInvoice} onChange={(e) => setEditForm((d) => ({ ...d, balancePaymentInvoice: parseInt(e.target.value) || 0 }))} />
                  <p className="text-[10px] text-muted-foreground">{formatBRL(editForm.balancePaymentInvoice)}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Pontos Carreira</Label>
                  <Input type="number" value={editForm.careerPoints} onChange={(e) => setEditForm((d) => ({ ...d, careerPoints: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Pontos Pessoais</Label>
                  <Input type="number" value={editForm.personalPoints} onChange={(e) => setEditForm((d) => ({ ...d, personalPoints: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Estrelas</Label>
                  <Input type="number" value={editForm.stars} onChange={(e) => setEditForm((d) => ({ ...d, stars: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancelar</Button>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={saving}>
              {saving ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog (read-only) */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              Perfil do Usuário
            </DialogTitle>
            <DialogDescription>{viewing?.name}</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Detail label="Nome" value={viewing.name} />
                <Detail label="Email" value={viewing.email} />
                <Detail label="Telefone" value={viewing.phone || '—'} />
                <Detail label="CPF" value={viewing.cpf || '—'} />
                <Detail label="Tipo" value={userTypeBadge(viewing.userType).label} />
                <Detail label="Plano" value={viewing.plan === 'blue5' ? 'Blue 5 Premium' : viewing.plan === 'blue3' ? 'Blue 3' : 'Gratuito'} />
                <Detail label="Status" value={viewing.isActive ? 'Ativo' : 'Inativo'} />
                <Detail label="KYC" value={kycBadge(viewing.kycStatus).label} />
                <Detail label="Motorista" value={viewing.isDriver ? 'Sim' : 'Não'} />
                <Detail label="Entregador" value={viewing.isDelivery ? 'Sim' : 'Não'} />
                <Detail label="Indicações" value={String(viewing._count?.referrals ?? 0)} />
                <Detail label="Cidade" value={viewing.city ? `${viewing.city}${viewing.state ? '/' + viewing.state : ''}` : '—'} />
                <Detail label="Criado em" value={viewing.createdAt ? formatDate(viewing.createdAt) : '—'} />
              </div>
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Saldos</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Detail label="Saque" value={formatBRL(viewing.balanceWithdrawal)} />
                  <Detail label="Mobilidade" value={formatBRL(viewing.balanceMobility)} />
                  <Detail label="Compras" value={formatBRL(viewing.balanceShopping)} />
                  <Detail label="Refeição" value={formatBRL(viewing.balanceFood)} />
                  <Detail label="Farmácia" value={formatBRL(viewing.balancePharmacy)} />
                  <Detail label="Gratificação" value={formatBRL(viewing.balanceGratification)} />
                  <Detail label="Pag. Fatura" value={formatBRL(viewing.balancePaymentInvoice)} />
                  <Detail label="Pontos Carreira" value={String(viewing.careerPoints ?? 0)} />
                </div>
              </div>
              {viewing.createdAt && (
                <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
                  Atualizado em {formatDateTime(viewing.createdAt)}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Fechar</Button>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
              if (viewing) {
                setViewOpen(false)
                openEdit(viewing)
              }
            }}>
              <Edit className="h-4 w-4" /> Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-foreground break-words">{value}</span>
    </div>
  )
}
