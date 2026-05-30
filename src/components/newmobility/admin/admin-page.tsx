'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency } from '@/lib/utils'
import { apiFetch } from '@/lib/api'
import {
  Shield, Users, DollarSign, TrendingUp, Activity, Settings, Search,
  ChevronLeft, ChevronRight, BarChart3, Clock, Mail, Check, X,
  ToggleLeft, ToggleRight, Save, RefreshCw, AlertTriangle, Info, Megaphone,
  Plus, Trash2, Edit, Eye,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  totalTransactions: number
  totalRevenue: number
  totalWithdrawals: number
  totalCashback: number
  planDistribution: { plan: string; count: number }[]
  recentUsers: { id: string; name: string; email: string; plan: string; isActive: boolean; createdAt: string }[]
  growthRate: number
  monthlyRevenue: number
}

interface AdminUser {
  id: string; name: string; email: string; phone: string; plan: string;
  isActive: boolean; referralCode: string; balanceWithdrawal: number;
  careerPoints: number; createdAt: string; _count: { referrals: number }
}

interface SystemConfigs {
  cashback_entrada_pct?: string
  cashback_residual_pct?: string
  cashback_vendas_pct?: string
  min_withdrawal?: string
  max_withdrawal?: string
  withdrawal_fee_pct?: string
  [key: string]: string | undefined
}

interface AdminAnnouncement {
  id: string; title: string; message: string; type: string;
  priority: string; isActive: boolean; createdAt: string;
  actionLabel?: string; actionUrl?: string;
}

export function AdminPage() {
  const { t } = useTranslation()
  const { user } = useStore()
  const [activeTab, setActiveTab] = useState('stats')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<{ users: AdminUser[]; total: number; page: number; totalPages: number } | null>(null)
  const [configs, setConfigs] = useState<SystemConfigs>({})
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userPage, setUserPage] = useState(1)
  const [savingConfig, setSavingConfig] = useState(false)
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', type: 'info', priority: 'normal', actionLabel: '', actionUrl: '' })

  const isAdmin = user?.id === 'usr_demo_admin' || user?.email === 'carlos.silva@email.com'

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') loadUsers()
    if (activeTab === 'config') loadConfigs()
    if (activeTab === 'announcements') loadAnnouncements()
  }, [activeTab, searchQuery, planFilter, statusFilter, userPage])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await apiFetch<AdminStats>(`/admin/stats?userId=${user?.id}`)
      setStats(data)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams({ userId: user?.id || '', search: searchQuery, plan: planFilter, status: statusFilter, page: String(userPage) })
      const data = await apiFetch<{ users: AdminUser[]; total: number; page: number; totalPages: number }>(`/admin/users?${params}`)
      setUsers(data)
    } catch { /* ignore */ }
  }

  const loadConfigs = async () => {
    try {
      const data = await apiFetch<SystemConfigs>(`/admin/config?userId=${user?.id}`)
      setConfigs(data)
    } catch { /* ignore */ }
  }

  const loadAnnouncements = async () => {
    try {
      const data = await apiFetch<AdminAnnouncement[]>('/announcements')
      setAnnouncements(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
  }

  const handleSaveConfig = async () => {
    setSavingConfig(true)
    try {
      await apiFetch('/admin/config', {
        method: 'PUT',
        body: JSON.stringify({ userId: user?.id, configs }),
      })
      toast.success('Configurações salvas com sucesso!')
    } catch { toast.error('Erro ao salvar configurações') } finally { setSavingConfig(false) }
  }

  const handleCreateAnnouncement = async () => {
    try {
      await apiFetch('/admin/announcements', {
        method: 'POST',
        body: JSON.stringify({ userId: user?.id, ...newAnnouncement }),
      })
      setShowNewAnnouncement(false)
      setNewAnnouncement({ title: '', message: '', type: 'info', priority: 'normal', actionLabel: '', actionUrl: '' })
      loadAnnouncements()
      toast.success('Anúncio criado com sucesso!')
    } catch { toast.error('Erro ao criar anúncio') }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await apiFetch(`/admin/announcements/${id}?userId=${user?.id}`, { method: 'DELETE' })
      loadAnnouncements()
      toast.success('Anúncio removido!')
    } catch { toast.error('Erro ao remover anúncio') }
  }

  const handleToggleAnnouncement = async (id: string, isActive: boolean) => {
    try {
      await apiFetch(`/admin/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ userId: user?.id, isActive: !isActive }),
      })
      loadAnnouncements()
    } catch { /* ignore */ }
  }

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = { free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', blue3: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', blue5: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' }
    return colors[plan] || colors.free
  }

  const getPlanName = (plan: string) => {
    const names: Record<string, string> = { free: 'Gratuito', blue3: 'Blue 3', blue5: 'Blue 5 Premium' }
    return names[plan] || plan
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = { info: 'bg-blue-100 text-blue-700', promo: 'bg-emerald-100 text-emerald-700', maintenance: 'bg-amber-100 text-amber-700', feature: 'bg-purple-100 text-purple-700', urgent: 'bg-red-100 text-red-700' }
    return colors[type] || colors.info
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            Painel Administrativo
          </h2>
          <p className="text-sm text-muted-foreground">Gerencie o sistema, usuários e configurações</p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1">
          <Shield className="h-3 w-3" />
          Admin
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="stats" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <BarChart3 className="h-3.5 w-3.5" /> Estatísticas
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Users className="h-3.5 w-3.5" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Settings className="h-3.5 w-3.5" /> Configurações
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Megaphone className="h-3.5 w-3.5" /> Anúncios
          </TabsTrigger>
        </TabsList>

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-4 space-y-4">
          {stats && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total de Usuários', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                  { label: 'Usuários Ativos', value: stats.activeUsers, icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                  { label: 'Receita Total', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
                  { label: 'CashBack Total', value: formatCurrency(stats.totalCashback), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
                ].map((card, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card className={`${card.bg} border-0`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <card.icon className={`h-5 w-5 ${card.color}`} />
                          <Badge variant="secondary" className="text-[10px]">+{stats.growthRate}%</Badge>
                        </div>
                        <p className="text-lg font-bold text-foreground">{card.value}</p>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Plan Distribution & Recent Users */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-emerald-600" /> Distribuição de Planos</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.planDistribution.map(p => (
                        <div key={p.plan} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getPlanBadge(p.plan)}>{getPlanName(p.plan)}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(p.count / stats.totalUsers) * 100}%` }} />
                            </div>
                            <span className="text-sm font-medium text-foreground w-8 text-right">{p.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-600" /> Usuários Recentes</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.recentUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <div>
                              <p className="text-sm font-medium text-foreground">{u.name}</p>
                              <p className="text-[10px] text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                          <Badge className={getPlanBadge(u.plan)}>{getPlanName(u.plan)}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Summary */}
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-600" /> Resumo de Atividade</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold text-foreground">{stats.totalTransactions}</p>
                      <p className="text-xs text-muted-foreground">Total de Transações</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold text-foreground">{formatCurrency(stats.totalWithdrawals)}</p>
                      <p className="text-xs text-muted-foreground">Total de Saques</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold text-foreground">{stats.inactiveUsers}</p>
                      <p className="text-xs text-muted-foreground">Usuários Inativos</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold text-foreground">{formatCurrency(stats.monthlyRevenue)}</p>
                      <p className="text-xs text-muted-foreground">Receita Mensal</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4 space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email ou código..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setUserPage(1) }}
                    className="pl-9"
                  />
                </div>
                <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setUserPage(1) }} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="all">Todos os planos</option>
                  <option value="free">Gratuito</option>
                  <option value="blue3">Blue 3</option>
                  <option value="blue5">Blue 5</option>
                </select>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setUserPage(1) }} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3">Usuário</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden sm:table-cell">Plano</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden md:table-cell">Indicados</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden md:table-cell">Saldo</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.users.map(u => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{u.name}</p>
                            <p className="text-[10px] text-muted-foreground">{u.email}</p>
                          </div>
                        </td>
                        <td className="p-3 hidden sm:table-cell"><Badge className={getPlanBadge(u.plan)}>{getPlanName(u.plan)}</Badge></td>
                        <td className="p-3 hidden md:table-cell"><span className="text-sm text-foreground">{u._count.referrals}</span></td>
                        <td className="p-3 hidden md:table-cell"><span className="text-sm text-foreground">{formatCurrency(u.balanceWithdrawal)}</span></td>
                        <td className="p-3">
                          <Badge className={u.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}>
                            {u.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {users && users.totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">{users.total} usuários</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)}><ChevronLeft className="h-3 w-3" /></Button>
                    <span className="text-xs text-muted-foreground">{userPage}/{users.totalPages}</span>
                    <Button variant="outline" size="sm" disabled={userPage >= users.totalPages} onClick={() => setUserPage(p => p + 1)}><ChevronRight className="h-3 w-3" /></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4 text-emerald-600" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" /> CashBack
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">CashBack Entrada (%)</Label>
                    <Input value={configs.cashback_entrada_pct || ''} onChange={(e) => setConfigs(c => ({ ...c, cashback_entrada_pct: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">CashBack Residual (%)</Label>
                    <Input value={configs.cashback_residual_pct || ''} onChange={(e) => setConfigs(c => ({ ...c, cashback_residual_pct: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">CashBack Vendas (%)</Label>
                    <Input value={configs.cashback_vendas_pct || ''} onChange={(e) => setConfigs(c => ({ ...c, cashback_vendas_pct: e.target.value }))} />
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-amber-600" /> Saques
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Saque Mínimo (centavos)</Label>
                    <Input value={configs.min_withdrawal || ''} onChange={(e) => setConfigs(c => ({ ...c, min_withdrawal: e.target.value }))} />
                    <p className="text-[10px] text-muted-foreground">Ex: 5000 = R$ 50,00</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Saque Máximo (centavos)</Label>
                    <Input value={configs.max_withdrawal || ''} onChange={(e) => setConfigs(c => ({ ...c, max_withdrawal: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Taxa de Saque (%)</Label>
                    <Input value={configs.withdrawal_fee_pct || ''} onChange={(e) => setConfigs(c => ({ ...c, withdrawal_fee_pct: e.target.value }))} />
                  </div>
                </div>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleSaveConfig} disabled={savingConfig}>
                {savingConfig ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{announcements.length} anúncios ativos</p>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => setShowNewAnnouncement(true)}>
              <Plus className="h-4 w-4" /> Novo Anúncio
            </Button>
          </div>

          {/* New Announcement Form */}
          <AnimatePresence>
            {showNewAnnouncement && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Card className="border-emerald-200 dark:border-emerald-800">
                  <CardHeader><CardTitle className="text-sm">Criar Novo Anúncio</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input placeholder="Título" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement(a => ({ ...a, title: e.target.value }))} />
                      <div className="flex gap-2">
                        <select value={newAnnouncement.type} onChange={(e) => setNewAnnouncement(a => ({ ...a, type: e.target.value }))} className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm">
                          <option value="info">Info</option><option value="promo">Promo</option><option value="maintenance">Manutenção</option><option value="feature">Feature</option><option value="urgent">Urgente</option>
                        </select>
                        <select value={newAnnouncement.priority} onChange={(e) => setNewAnnouncement(a => ({ ...a, priority: e.target.value }))} className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm">
                          <option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option>
                        </select>
                      </div>
                    </div>
                    <Input placeholder="Mensagem" value={newAnnouncement.message} onChange={(e) => setNewAnnouncement(a => ({ ...a, message: e.target.value }))} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input placeholder="Botão de ação (opcional)" value={newAnnouncement.actionLabel} onChange={(e) => setNewAnnouncement(a => ({ ...a, actionLabel: e.target.value }))} />
                      <Input placeholder="URL do botão (opcional)" value={newAnnouncement.actionUrl} onChange={(e) => setNewAnnouncement(a => ({ ...a, actionUrl: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreateAnnouncement} disabled={!newAnnouncement.title || !newAnnouncement.message}>Criar</Button>
                      <Button variant="outline" onClick={() => setShowNewAnnouncement(false)}>Cancelar</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Announcements List */}
          <div className="space-y-3">
            {announcements.map(a => (
              <Card key={a.id} className={!a.isActive ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">{a.title}</span>
                        <Badge className={getTypeColor(a.type)}>{a.type}</Badge>
                        <Badge variant="outline" className="text-[10px]">{a.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{a.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(a.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleAnnouncement(a.id, a.isActive)}>
                        {a.isActive ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-red-500" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => handleDeleteAnnouncement(a.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
