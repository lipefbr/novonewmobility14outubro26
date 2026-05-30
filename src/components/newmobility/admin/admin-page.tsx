'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency } from '@/lib/utils'
import { apiFetch } from '@/lib/api'
import {
  Shield, Users, DollarSign, TrendingUp, Activity, Settings, Search,
  ChevronLeft, ChevronRight, BarChart3, Clock, Mail, Check, X,
  ToggleLeft, ToggleRight, Save, RefreshCw, AlertTriangle, Info, Megaphone,
  Plus, Trash2, Edit, Eye, Wallet, CreditCard, FileText, Ban,
  MapPin, Phone, Star, Car, Bike, Banknote, UserCheck, UserX,
  ArrowUpDown, Receipt,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// ---------- Interfaces ----------

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
  id: string; name: string; email: string; phone: string; cpf: string; plan: string;
  isActive: boolean; referralCode: string; referredById: string;
  balanceWithdrawal: number; balanceMobility: number; balanceShopping: number;
  balanceFood: number; balancePharmacy: number; balanceGratification: number;
  careerPoints: number; personalPoints: number; stars: number;
  city: string; state: string; country: string;
  bankCode: string; bankAgency: string; bankAccount: string; bankType: string;
  pixKey: string; pixEnabled: boolean;
  isDriver: boolean; isDelivery: boolean; role: string;
  createdAt: string; _count: { referrals: number }
}

interface ViewUserData extends AdminUser {
  referrer?: { id: string; name: string; email: string } | null
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

interface AdminPlan {
  id: string; name: string; price: number; features: string[] | string;
  matrixEntrada: string; matrixResidual: string; matrixVendas: string;
  isActive: boolean;
}

interface AdminWithdrawal {
  id: string; userId: string; userName?: string; userEmail?: string;
  amount: number; status: string; category?: string; createdAt: string;
}

interface WithdrawalStats {
  pendingCount: number; approvedCount: number; rejectedCount: number;
  pendingAmount: number; approvedAmount: number;
}

interface CashbackEntry {
  id: string; userId: string; fromUserId: string; amount: number;
  level: number; percentage: number; description: string;
  category: string; createdAt: string; cashbackType: string;
  userName: string; userEmail: string; fromUserName: string;
}

interface CashbackData {
  entries: CashbackEntry[]; total: number; page: number; totalPages: number;
  totals: { entrada: number; residual: number; vendas: number };
  perUserSummary: { userId: string; name: string; email: string; total: number; count: number }[];
}

// ---------- Full edit form data ----------
interface EditFormData {
  name: string; email: string; phone: string; cpf: string;
  plan: string; isActive: boolean;
  balanceWithdrawal: number; balanceMobility: number; balanceShopping: number;
  balanceFood: number; balancePharmacy: number; balanceGratification: number;
  careerPoints: number; personalPoints: number; stars: number;
  city: string; state: string; country: string;
  bankCode: string; bankAgency: string; bankAccount: string; bankType: string;
  pixKey: string; pixEnabled: boolean;
  isDriver: boolean; isDelivery: boolean; role: string;
}

const emptyEditForm: EditFormData = {
  name: '', email: '', phone: '', cpf: '',
  plan: 'free', isActive: true,
  balanceWithdrawal: 0, balanceMobility: 0, balanceShopping: 0,
  balanceFood: 0, balancePharmacy: 0, balanceGratification: 0,
  careerPoints: 0, personalPoints: 0, stars: 0,
  city: '', state: '', country: 'BR',
  bankCode: '', bankAgency: '', bankAccount: '', bankType: '',
  pixKey: '', pixEnabled: false,
  isDriver: false, isDelivery: false, role: 'user',
}

export function AdminPage() {
  const { t } = useTranslation()
  const { user } = useStore()
  const [activeTab, setActiveTab] = useState('stats')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<{ users: AdminUser[]; total: number; page: number; totalPages: number } | null>(null)
  const [configs, setConfigs] = useState<SystemConfigs>({})
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([])
  const [plans, setPlans] = useState<AdminPlan[]>([])
  const [withdrawals, setWithdrawals] = useState<{ withdrawals: AdminWithdrawal[]; total: number; page: number; totalPages: number; stats: WithdrawalStats } | null>(null)
  const [cashbackData, setCashbackData] = useState<CashbackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userPage, setUserPage] = useState(1)
  const [savingConfig, setSavingConfig] = useState(false)
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', type: 'info', priority: 'normal', actionLabel: '', actionUrl: '' })
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState('all')

  // Cashback tab filters
  const [cashbackTypeFilter, setCashbackTypeFilter] = useState('all')
  const [cashbackUserFilter, setCashbackUserFilter] = useState('')

  // User edit dialog
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editUserData, setEditUserData] = useState<EditFormData>(emptyEditForm)
  const [savingUser, setSavingUser] = useState(false)

  // User view dialog
  const [viewUserDialogOpen, setViewUserDialogOpen] = useState(false)
  const [viewingUser, setViewingUser] = useState<ViewUserData | null>(null)
  const [loadingViewUser, setLoadingViewUser] = useState(false)

  // Plan dialog
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null)
  const [planFormData, setPlanFormData] = useState({ name: '', price: 0, features: '', matrixEntrada: '-', matrixResidual: '-', matrixVendas: '-', isActive: true })
  const [savingPlan, setSavingPlan] = useState(false)

  // Withdrawal action
  const [processingWithdrawal, setProcessingWithdrawal] = useState<string | null>(null)

  // Manual cashback dialog
  const [addCashbackDialogOpen, setAddCashbackDialogOpen] = useState(false)
  const [savingCashback, setSavingCashback] = useState(false)
  const [cashbackFormData, setCashbackFormData] = useState({
    targetUserId: '', cashbackType: 'entrada', amount: 0, level: 1, percentage: 0, description: '', category: '',
  })

  const isAdmin = user?.id === 'usr_demo_admin' || user?.email === 'carlos.silva@email.com' || user?.email === 'admin@newmobility.com'

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') loadUsers()
    if (activeTab === 'config') loadConfigs()
    if (activeTab === 'announcements') loadAnnouncements()
    if (activeTab === 'plans') loadPlans()
    if (activeTab === 'withdrawals') loadWithdrawals()
    if (activeTab === 'cashback') loadCashback()
  }, [activeTab, searchQuery, planFilter, statusFilter, userPage, withdrawalStatusFilter, cashbackTypeFilter, cashbackUserFilter])

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

  const loadPlans = async () => {
    try {
      const data = await apiFetch<{ plans: AdminPlan[] }>(`/admin/plans?userId=${user?.id}`)
      setPlans(data.plans || [])
    } catch { /* ignore */ }
  }

  const loadWithdrawals = async () => {
    try {
      const params = new URLSearchParams({ userId: user?.id || '', status: withdrawalStatusFilter })
      const data = await apiFetch<{ withdrawals: AdminWithdrawal[]; total: number; page: number; totalPages: number; stats: WithdrawalStats }>(`/admin/withdrawals?${params}`)
      setWithdrawals(data)
    } catch { /* ignore */ }
  }

  const loadCashback = async () => {
    try {
      const params = new URLSearchParams({
        userId: user?.id || '',
        type: cashbackTypeFilter,
        filterUserId: cashbackUserFilter,
      })
      const data = await apiFetch<CashbackData>(`/admin/cashback?${params}`)
      setCashbackData(data)
    } catch { /* ignore */ }
  }

  // ---------- Config ----------
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

  // ---------- Announcements ----------
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

  // ---------- User Edit ----------
  const handleOpenEditUser = (u: AdminUser) => {
    setEditingUser(u)
    setEditUserData({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      cpf: u.cpf || '',
      plan: u.plan || 'free',
      isActive: u.isActive,
      balanceWithdrawal: u.balanceWithdrawal || 0,
      balanceMobility: u.balanceMobility || 0,
      balanceShopping: u.balanceShopping || 0,
      balanceFood: u.balanceFood || 0,
      balancePharmacy: u.balancePharmacy || 0,
      balanceGratification: u.balanceGratification || 0,
      careerPoints: u.careerPoints || 0,
      personalPoints: u.personalPoints || 0,
      stars: u.stars || 0,
      city: u.city || '',
      state: u.state || '',
      country: u.country || 'BR',
      bankCode: u.bankCode || '',
      bankAgency: u.bankAgency || '',
      bankAccount: u.bankAccount || '',
      bankType: u.bankType || '',
      pixKey: u.pixKey || '',
      pixEnabled: u.pixEnabled || false,
      isDriver: u.isDriver || false,
      isDelivery: u.isDelivery || false,
      role: u.role || 'user',
    })
    setEditUserDialogOpen(true)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return
    setSavingUser(true)
    try {
      await apiFetch(`/admin/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ userId: user?.id, ...editUserData }),
      })
      setEditUserDialogOpen(false)
      setEditingUser(null)
      loadUsers()
      toast.success('Usuário atualizado com sucesso!')
    } catch {
      toast.error('Erro ao atualizar usuário')
    } finally {
      setSavingUser(false)
    }
  }

  // ---------- User View ----------
  const handleOpenViewUser = async (u: AdminUser) => {
    setViewUserDialogOpen(true)
    setLoadingViewUser(true)
    try {
      const data = await apiFetch<ViewUserData>(`/admin/users/${u.id}?userId=${user?.id}`)
      setViewingUser(data)
    } catch {
      // Fallback to list data
      setViewingUser(u as unknown as ViewUserData)
    } finally {
      setLoadingViewUser(false)
    }
  }

  // ---------- Plans CRUD ----------
  const handleOpenNewPlan = () => {
    setEditingPlan(null)
    setPlanFormData({ name: '', price: 0, features: '', matrixEntrada: '-', matrixResidual: '-', matrixVendas: '-', isActive: true })
    setPlanDialogOpen(true)
  }

  const handleOpenEditPlan = (plan: AdminPlan) => {
    setEditingPlan(plan)
    const featuresList = typeof plan.features === 'string'
      ? JSON.parse(plan.features || '[]').join(', ')
      : (plan.features || []).join(', ')
    setPlanFormData({
      name: plan.name,
      price: plan.price,
      features: featuresList,
      matrixEntrada: plan.matrixEntrada || '-',
      matrixResidual: plan.matrixResidual || '-',
      matrixVendas: plan.matrixVendas || '-',
      isActive: plan.isActive,
    })
    setPlanDialogOpen(true)
  }

  const handleSavePlan = async () => {
    setSavingPlan(true)
    try {
      const featuresArray = planFormData.features
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0)

      if (editingPlan) {
        await apiFetch(`/admin/plans/${editingPlan.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            userId: user?.id,
            name: planFormData.name,
            price: planFormData.price,
            features: featuresArray,
            matrixEntrada: planFormData.matrixEntrada,
            matrixResidual: planFormData.matrixResidual,
            matrixVendas: planFormData.matrixVendas,
            isActive: planFormData.isActive,
          }),
        })
        toast.success('Plano atualizado com sucesso!')
      } else {
        await apiFetch('/admin/plans', {
          method: 'POST',
          body: JSON.stringify({
            userId: user?.id,
            name: planFormData.name,
            price: planFormData.price,
            features: featuresArray,
            matrixEntrada: planFormData.matrixEntrada,
            matrixResidual: planFormData.matrixResidual,
            matrixVendas: planFormData.matrixVendas,
          }),
        })
        toast.success('Plano criado com sucesso!')
      }
      setPlanDialogOpen(false)
      setEditingPlan(null)
      loadPlans()
    } catch {
      toast.error('Erro ao salvar plano')
    } finally {
      setSavingPlan(false)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (planId === 'free' || planId === 'blue3' || planId === 'blue5') {
      toast.error('Não é possível excluir planos padrão')
      return
    }
    try {
      await apiFetch(`/admin/plans/${planId}?userId=${user?.id}`, { method: 'DELETE' })
      loadPlans()
      toast.success('Plano excluído!')
    } catch {
      toast.error('Erro ao excluir plano')
    }
  }

  // ---------- Withdrawals ----------
  const handleWithdrawalAction = async (withdrawalId: string, action: 'approve' | 'reject') => {
    setProcessingWithdrawal(withdrawalId)
    try {
      await apiFetch(`/admin/withdrawals/${withdrawalId}`, {
        method: 'PUT',
        body: JSON.stringify({ userId: user?.id, action }),
      })
      loadWithdrawals()
      toast.success(action === 'approve' ? 'Saque aprovado!' : 'Saque rejeitado!')
    } catch {
      toast.error('Erro ao processar saque')
    } finally {
      setProcessingWithdrawal(null)
    }
  }

  // ---------- Manual Cashback ----------
  const handleAddCashback = async () => {
    setSavingCashback(true)
    try {
      await apiFetch('/admin/cashback', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.id,
          targetUserId: cashbackFormData.targetUserId,
          cashbackType: cashbackFormData.cashbackType,
          amount: cashbackFormData.amount,
          level: cashbackFormData.level,
          percentage: cashbackFormData.percentage,
          description: cashbackFormData.description,
          category: cashbackFormData.category,
        }),
      })
      setAddCashbackDialogOpen(false)
      setCashbackFormData({ targetUserId: '', cashbackType: 'entrada', amount: 0, level: 1, percentage: 0, description: '', category: '' })
      loadCashback()
      toast.success('Cashback adicionado com sucesso!')
    } catch {
      toast.error('Erro ao adicionar cashback')
    } finally {
      setSavingCashback(false)
    }
  }

  // ---------- Helpers ----------
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

  const getWithdrawalStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    }
    return map[status] || 'bg-gray-100 text-gray-700'
  }

  const getWithdrawalStatusLabel = (status: string) => {
    const map: Record<string, string> = { pending: 'Pendente', approved: 'Aprovado', rejected: 'Rejeitado', paid: 'Pago' }
    return map[status] || status
  }

  const getCashbackTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      entrada: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      residual: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      vendas: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    }
    return map[type] || 'bg-gray-100 text-gray-700'
  }

  const getCashbackTypeLabel = (type: string) => {
    const map: Record<string, string> = { entrada: 'Entrada', residual: 'Residual', vendas: 'Vendas' }
    return map[type] || type
  }

  const updateEditField = <K extends keyof EditFormData>(key: K, value: EditFormData[K]) => {
    setEditUserData(d => ({ ...d, [key]: value }))
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
          Admin Geral
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1 flex flex-wrap">
          <TabsTrigger value="stats" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <BarChart3 className="h-3.5 w-3.5" /> Estatísticas
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Users className="h-3.5 w-3.5" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <CreditCard className="h-3.5 w-3.5" /> Planos
          </TabsTrigger>
          <TabsTrigger value="cashback" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Receipt className="h-3.5 w-3.5" /> Cashback
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Wallet className="h-3.5 w-3.5" /> Saques
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Settings className="h-3.5 w-3.5" /> Config
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Megaphone className="h-3.5 w-3.5" /> Anúncios
          </TabsTrigger>
        </TabsList>

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-4 space-y-4">
          {stats && (
            <>
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
                      <th className="text-right text-xs font-semibold text-muted-foreground p-3">Ações</th>
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
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-blue-600 hover:text-blue-700" onClick={() => handleOpenViewUser(u)}>
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Ver</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-emerald-600 hover:text-emerald-700" onClick={() => handleOpenEditUser(u)}>
                              <Edit className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Editar</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

        {/* Plans Tab */}
        <TabsContent value="plans" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{plans.length} planos cadastrados</p>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleOpenNewPlan}>
              <Plus className="h-4 w-4" /> Novo Plano
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan, i) => {
              const features = typeof plan.features === 'string'
                ? JSON.parse(plan.features || '[]')
                : plan.features || []
              const isDefault = ['free', 'blue3', 'blue5'].includes(plan.id)

              return (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className={`shadow-sm hover:shadow-md transition-shadow ${plan.id === 'blue5' ? 'border-2 border-emerald-300 dark:border-emerald-700' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold text-foreground">{plan.name}</CardTitle>
                        {isDefault && <Badge variant="outline" className="text-[9px]">Padrão</Badge>}
                      </div>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {plan.price === 0 ? 'Grátis' : formatCurrency(plan.price)}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1.5 mb-4 max-h-48 overflow-y-auto">
                        {features.map((f: string, fi: number) => (
                          <div key={fi} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
                        <span>Entrada: {plan.matrixEntrada}</span>
                        <span>•</span>
                        <span>Residual: {plan.matrixResidual}</span>
                        <span>•</span>
                        <span>Vendas: {plan.matrixVendas}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1" onClick={() => handleOpenEditPlan(plan)}>
                          <Edit className="h-3 w-3" /> Editar
                        </Button>
                        {!isDefault && (
                          <Button variant="outline" size="sm" className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => handleDeletePlan(plan.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        {/* Cashback Tab */}
        <TabsContent value="cashback" className="mt-4 space-y-4">
          {/* Cashback Totals */}
          {cashbackData?.totals && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Entrada Total', value: formatCurrency(cashbackData.totals.entrada), icon: ArrowUpDown, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                { label: 'Residual Total', value: formatCurrency(cashbackData.totals.residual), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
                { label: 'Vendas Total', value: formatCurrency(cashbackData.totals.vendas), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                { label: 'Total Geral', value: formatCurrency(cashbackData.totals.entrada + cashbackData.totals.residual + cashbackData.totals.vendas), icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
              ].map((card, i) => (
                <Card key={i} className={`${card.bg} border-0`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <card.icon className={`h-4 w-4 ${card.color}`} />
                      <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{card.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Filters & Add button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-1">
              {(['all', 'entrada', 'residual', 'vendas'] as const).map((type) => {
                const labels: Record<string, string> = { all: 'Todos', entrada: 'Entrada', residual: 'Residual', vendas: 'Vendas' }
                return (
                  <button
                    key={type}
                    onClick={() => setCashbackTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      cashbackTypeFilter === type ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {labels[type]}
                  </button>
                )
              })}
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por ID do usuário..."
                value={cashbackUserFilter}
                onChange={(e) => setCashbackUserFilter(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 text-xs" onClick={() => setAddCashbackDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Adicionar Cashback
            </Button>
          </div>

          {/* Per-User Summary */}
          {cashbackData?.perUserSummary && cashbackData.perUserSummary.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-emerald-600" /> Top Usuários por Cashback</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cashbackData.perUserSummary.slice(0, 10).map((u, i) => (
                    <div key={u.userId} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-600">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{u.name}</p>
                          <p className="text-[10px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(u.total)}</p>
                        <p className="text-[10px] text-muted-foreground">{u.count} entradas</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cashback Entries Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3">Usuário</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3">Tipo</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden sm:table-cell">De</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3">Valor</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden md:table-cell">Nível</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden lg:table-cell">Descrição</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden sm:table-cell">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashbackData?.entries.map(e => (
                      <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{e.userName}</p>
                            <p className="text-[10px] text-muted-foreground">{e.userEmail}</p>
                          </div>
                        </td>
                        <td className="p-3"><Badge className={getCashbackTypeBadge(e.cashbackType)}>{getCashbackTypeLabel(e.cashbackType)}</Badge></td>
                        <td className="p-3 hidden sm:table-cell"><span className="text-xs text-muted-foreground">{e.fromUserName || '—'}</span></td>
                        <td className="p-3"><span className="text-sm font-semibold text-foreground">{formatCurrency(e.amount)}</span></td>
                        <td className="p-3 hidden md:table-cell"><span className="text-xs text-muted-foreground">{e.level} ({e.percentage}%)</span></td>
                        <td className="p-3 hidden lg:table-cell"><span className="text-xs text-muted-foreground truncate max-w-[200px] block">{e.description}</span></td>
                        <td className="p-3 hidden sm:table-cell"><span className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleDateString('pt-BR')}</span></td>
                      </tr>
                    ))}
                    {(!cashbackData?.entries || cashbackData.entries.length === 0) && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Receipt className="h-8 w-8 text-muted-foreground/50" />
                            <p>Nenhum cashback encontrado</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="mt-4 space-y-4">
          {withdrawals?.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Pendentes', value: withdrawals.stats.pendingCount, amount: formatCurrency(withdrawals.stats.pendingAmount), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
                { label: 'Aprovados', value: withdrawals.stats.approvedCount, amount: formatCurrency(withdrawals.stats.approvedAmount), icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                { label: 'Rejeitados', value: withdrawals.stats.rejectedCount, amount: '', icon: X, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
                { label: 'Total Solicitado', value: '', amount: formatCurrency(withdrawals.stats.pendingAmount + withdrawals.stats.approvedAmount), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className={`${stat.bg} border-0`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                      </div>
                      {stat.value > 0 && <p className="text-xl font-bold text-foreground">{stat.value}</p>}
                      {stat.amount && <p className="text-sm font-semibold text-foreground">{stat.amount}</p>}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => {
              const labels: Record<string, string> = { all: 'Todos', pending: 'Pendentes', approved: 'Aprovados', rejected: 'Rejeitados' }
              return (
                <button key={s} onClick={() => setWithdrawalStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${withdrawalStatusFilter === s ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  {labels[s]}
                </button>
              )
            })}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3">Usuário</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3">Valor</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden sm:table-cell">Data</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3">Status</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals?.withdrawals.map(w => (
                      <tr key={w.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{w.userName || 'Usuário'}</p>
                            <p className="text-[10px] text-muted-foreground">{w.userEmail || w.userId}</p>
                          </div>
                        </td>
                        <td className="p-3"><span className="text-sm font-semibold text-foreground">{formatCurrency(w.amount)}</span></td>
                        <td className="p-3 hidden sm:table-cell"><span className="text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleDateString('pt-BR')}</span></td>
                        <td className="p-3"><Badge className={getWithdrawalStatusBadge(w.status)}>{getWithdrawalStatusLabel(w.status)}</Badge></td>
                        <td className="p-3 text-right">
                          {w.status === 'pending' && (
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-7 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" disabled={processingWithdrawal === w.id} onClick={() => handleWithdrawalAction(w.id, 'approve')}>
                                {processingWithdrawal === w.id ? <span className="h-3.5 w-3.5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                <span className="hidden sm:inline">Aprovar</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" disabled={processingWithdrawal === w.id} onClick={() => handleWithdrawalAction(w.id, 'reject')}>
                                {processingWithdrawal === w.id ? <span className="h-3.5 w-3.5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                                <span className="hidden sm:inline">Rejeitar</span>
                              </Button>
                            </div>
                          )}
                          {w.status !== 'pending' && <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                    {(!withdrawals?.withdrawals || withdrawals.withdrawals.length === 0) && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Wallet className="h-8 w-8 text-muted-foreground/50" />
                            <p>Nenhum saque encontrado</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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

      {/* ===== VIEW USER DIALOG ===== */}
      <Dialog open={viewUserDialogOpen} onOpenChange={setViewUserDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              Visualizar Usuário
            </DialogTitle>
            <DialogDescription>Detalhes completos do usuário</DialogDescription>
          </DialogHeader>
          {loadingViewUser ? (
            <div className="flex items-center justify-center py-12">
              <span className="h-6 w-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : viewingUser ? (
            <div className="space-y-5">
              {/* Personal Info */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Dados Pessoais</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground text-xs">Nome</span><p className="font-medium text-foreground">{viewingUser.name}</p></div>
                  <div><span className="text-muted-foreground text-xs">Email</span><p className="font-medium text-foreground">{viewingUser.email}</p></div>
                  <div><span className="text-muted-foreground text-xs">Telefone</span><p className="font-medium text-foreground">{viewingUser.phone || '—'}</p></div>
                  <div><span className="text-muted-foreground text-xs">CPF</span><p className="font-medium text-foreground">{viewingUser.cpf || '—'}</p></div>
                  <div><span className="text-muted-foreground text-xs">Cidade/Estado</span><p className="font-medium text-foreground">{viewingUser.city || '—'}{viewingUser.state ? ` - ${viewingUser.state}` : ''}</p></div>
                  <div><span className="text-muted-foreground text-xs">País</span><p className="font-medium text-foreground">{viewingUser.country || '—'}</p></div>
                </div>
              </div>

              <Separator />

              {/* Plan & Status */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Plano & Status</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground text-xs">Plano</span><p><Badge className={getPlanBadge(viewingUser.plan)}>{getPlanName(viewingUser.plan)}</Badge></p></div>
                  <div><span className="text-muted-foreground text-xs">Status</span><p><Badge className={viewingUser.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}>{viewingUser.isActive ? 'Ativo' : 'Inativo'}</Badge></p></div>
                  <div><span className="text-muted-foreground text-xs">Role</span><p><Badge variant="outline">{viewingUser.role === 'admin' ? 'Admin' : 'Usuário'}</Badge></p></div>
                  <div className="flex gap-2">
                    {viewingUser.isDriver && <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 gap-1"><Car className="h-3 w-3" />Motorista</Badge>}
                    {viewingUser.isDelivery && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1"><Bike className="h-3 w-3" />Entregador</Badge>}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Balances */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Saldos</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Saque', value: viewingUser.balanceWithdrawal },
                    { label: 'Mobilidade', value: viewingUser.balanceMobility },
                    { label: 'Compras', value: viewingUser.balanceShopping },
                    { label: 'Refeição', value: viewingUser.balanceFood },
                    { label: 'Farmácia', value: viewingUser.balancePharmacy },
                    { label: 'Gratificação', value: viewingUser.balanceGratification },
                  ].map(b => (
                    <div key={b.label} className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-[10px] text-muted-foreground">{b.label}</p>
                      <p className="text-sm font-bold text-foreground">{formatCurrency(b.value)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Career */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> Carreira</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-[10px] text-muted-foreground">Pontos Carreira</p>
                    <p className="text-sm font-bold text-foreground">{viewingUser.careerPoints}</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-[10px] text-muted-foreground">Pontos Pessoais</p>
                    <p className="text-sm font-bold text-foreground">{viewingUser.personalPoints}</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-[10px] text-muted-foreground">Estrelas</p>
                    <p className="text-sm font-bold text-foreground">{'★'.repeat(viewingUser.stars)}{'☆'.repeat(5 - viewingUser.stars)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Bank Info */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Banknote className="h-3.5 w-3.5" /> Dados Bancários</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground text-xs">Banco</span><p className="font-medium text-foreground">{viewingUser.bankCode || '—'}</p></div>
                  <div><span className="text-muted-foreground text-xs">Agência</span><p className="font-medium text-foreground">{viewingUser.bankAgency || '—'}</p></div>
                  <div><span className="text-muted-foreground text-xs">Conta</span><p className="font-medium text-foreground">{viewingUser.bankAccount || '—'}</p></div>
                  <div><span className="text-muted-foreground text-xs">Tipo</span><p className="font-medium text-foreground">{viewingUser.bankType === 'cc' ? 'Conta Corrente' : viewingUser.bankType === 'cp' ? 'Conta Poupança' : viewingUser.bankType || '—'}</p></div>
                  <div><span className="text-muted-foreground text-xs">Chave PIX</span><p className="font-medium text-foreground">{viewingUser.pixKey || '—'}</p></div>
                  <div><span className="text-muted-foreground text-xs">PIX Ativo</span><p><Badge className={viewingUser.pixEnabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}>{viewingUser.pixEnabled ? 'Sim' : 'Não'}</Badge></p></div>
                </div>
              </div>

              <Separator />

              {/* Referral Info */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Indicações</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground text-xs">Código de Indicação</span><p className="font-bold text-emerald-600 font-mono">{viewingUser.referralCode}</p></div>
                  <div><span className="text-muted-foreground text-xs">Total de Indicados</span><p className="font-bold text-foreground">{viewingUser._count?.referrals ?? 0}</p></div>
                  <div className="col-span-2"><span className="text-muted-foreground text-xs">Indicado por</span><p className="font-medium text-foreground">{(viewingUser as ViewUserData).referrer ? `${(viewingUser as ViewUserData).referrer!.name} (${(viewingUser as ViewUserData).referrer!.email})` : 'Nenhum'}</p></div>
                  <div className="col-span-2"><span className="text-muted-foreground text-xs">Data de Cadastro</span><p className="font-medium text-foreground">{new Date(viewingUser.createdAt).toLocaleString('pt-BR')}</p></div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ===== EDIT USER DIALOG ===== */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-emerald-600" />
              Editar Usuário
            </DialogTitle>
            <DialogDescription>
              Atualize os dados do usuário. As alterações serão salvas imediatamente.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-5">
              {/* Personal Info */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Dados Pessoais</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome</Label>
                    <Input value={editUserData.name} onChange={(e) => updateEditField('name', e.target.value)} placeholder="Nome completo" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input value={editUserData.email} onChange={(e) => updateEditField('email', e.target.value)} placeholder="email@exemplo.com" type="email" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Telefone</Label>
                    <Input value={editUserData.phone} onChange={(e) => updateEditField('phone', e.target.value)} placeholder="(11) 99999-0000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">CPF</Label>
                    <Input value={editUserData.cpf} onChange={(e) => updateEditField('cpf', e.target.value)} placeholder="000.000.000-00" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Plan & Status */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Plano & Status</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Plano</Label>
                    <Select value={editUserData.plan} onValueChange={(v) => updateEditField('plan', v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        <SelectItem value="free">Gratuito</SelectItem>
                        <SelectItem value="blue3">Blue 3</SelectItem>
                        <SelectItem value="blue5">Blue 5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select value={String(editUserData.isActive)} onValueChange={(v) => updateEditField('isActive', v === 'true')}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Ativo</SelectItem>
                        <SelectItem value="false">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Role</Label>
                    <Select value={editUserData.role} onValueChange={(v) => updateEditField('role', v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-4 mt-3">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={editUserData.isDriver} onChange={(e) => updateEditField('isDriver', e.target.checked)} className="rounded border-input" />
                    <Car className="h-3.5 w-3.5 text-blue-600" /> Motorista
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={editUserData.isDelivery} onChange={(e) => updateEditField('isDelivery', e.target.checked)} className="rounded border-input" />
                    <Bike className="h-3.5 w-3.5 text-amber-600" /> Entregador
                  </label>
                </div>
              </div>

              <Separator />

              {/* All Balances */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Saldos (centavos)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {([
                    ['balanceWithdrawal', 'Saque'],
                    ['balanceMobility', 'Mobilidade'],
                    ['balanceShopping', 'Compras'],
                    ['balanceFood', 'Refeição'],
                    ['balancePharmacy', 'Farmácia'],
                    ['balanceGratification', 'Gratificação'],
                  ] as const).map(([key, label]) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-xs">{label}</Label>
                      <Input
                        value={editUserData[key]}
                        onChange={(e) => updateEditField(key, parseInt(e.target.value) || 0)}
                        type="number"
                        placeholder="0"
                      />
                      <p className="text-[10px] text-muted-foreground">{formatCurrency(editUserData[key])}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Career Info */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> Carreira</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pontos Carreira</Label>
                    <Input value={editUserData.careerPoints} onChange={(e) => updateEditField('careerPoints', parseInt(e.target.value) || 0)} type="number" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pontos Pessoais</Label>
                    <Input value={editUserData.personalPoints} onChange={(e) => updateEditField('personalPoints', parseInt(e.target.value) || 0)} type="number" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Estrelas</Label>
                    <Input value={editUserData.stars} onChange={(e) => updateEditField('stars', parseInt(e.target.value) || 0)} type="number" min={0} max={5} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Location */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Localização</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cidade</Label>
                    <Input value={editUserData.city} onChange={(e) => updateEditField('city', e.target.value)} placeholder="São Paulo" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Estado</Label>
                    <Input value={editUserData.state} onChange={(e) => updateEditField('state', e.target.value)} placeholder="SP" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">País</Label>
                    <Input value={editUserData.country} onChange={(e) => updateEditField('country', e.target.value)} placeholder="BR" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Bank Details */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Banknote className="h-3.5 w-3.5" /> Dados Bancários</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Código Banco</Label>
                    <Input value={editUserData.bankCode} onChange={(e) => updateEditField('bankCode', e.target.value)} placeholder="001" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Agência</Label>
                    <Input value={editUserData.bankAgency} onChange={(e) => updateEditField('bankAgency', e.target.value)} placeholder="1234" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Conta</Label>
                    <Input value={editUserData.bankAccount} onChange={(e) => updateEditField('bankAccount', e.target.value)} placeholder="56789-0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo de Conta</Label>
                    <Select value={editUserData.bankType || 'none'} onValueChange={(v) => updateEditField('bankType', v === 'none' ? '' : v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não definido</SelectItem>
                        <SelectItem value="cc">Conta Corrente</SelectItem>
                        <SelectItem value="cp">Conta Poupança</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Chave PIX</Label>
                    <Input value={editUserData.pixKey} onChange={(e) => updateEditField('pixKey', e.target.value)} placeholder="email@exemplo.com" />
                  </div>
                  <div className="space-y-1.5 flex items-end">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={editUserData.pixEnabled} onChange={(e) => updateEditField('pixEnabled', e.target.checked)} className="rounded border-input" />
                      PIX Ativo
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditUserDialogOpen(false)} disabled={savingUser}>
                  Cancelar
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleSaveUser} disabled={savingUser}>
                  {savingUser ? (
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== ADD CASHBACK DIALOG ===== */}
      <Dialog open={addCashbackDialogOpen} onOpenChange={setAddCashbackDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-600" />
              Adicionar Cashback Manual
            </DialogTitle>
            <DialogDescription>Adicione uma entrada de cashback para um usuário.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">ID do Usuário</Label>
              <Input
                value={cashbackFormData.targetUserId}
                onChange={(e) => setCashbackFormData(d => ({ ...d, targetUserId: e.target.value }))}
                placeholder="usr_xxxx..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tipo</Label>
                <Select value={cashbackFormData.cashbackType} onValueChange={(v) => setCashbackFormData(d => ({ ...d, cashbackType: v }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="residual">Residual</SelectItem>
                    <SelectItem value="vendas">Vendas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Valor (centavos)</Label>
                <Input
                  value={cashbackFormData.amount}
                  onChange={(e) => setCashbackFormData(d => ({ ...d, amount: parseInt(e.target.value) || 0 }))}
                  type="number"
                  placeholder="50000"
                />
                <p className="text-[10px] text-muted-foreground">{cashbackFormData.amount > 0 ? formatCurrency(cashbackFormData.amount) : ''}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nível</Label>
                <Input
                  value={cashbackFormData.level}
                  onChange={(e) => setCashbackFormData(d => ({ ...d, level: parseInt(e.target.value) || 1 }))}
                  type="number"
                  min={1}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Percentual (%)</Label>
                <Input
                  value={cashbackFormData.percentage}
                  onChange={(e) => setCashbackFormData(d => ({ ...d, percentage: parseFloat(e.target.value) || 0 }))}
                  type="number"
                  step="0.1"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Descrição</Label>
              <Input
                value={cashbackFormData.description}
                onChange={(e) => setCashbackFormData(d => ({ ...d, description: e.target.value }))}
                placeholder="Cashback manual..."
              />
            </div>
            {cashbackFormData.cashbackType === 'vendas' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Categoria</Label>
                <Select value={cashbackFormData.category || 'mobility'} onValueChange={(v) => setCashbackFormData(d => ({ ...d, category: v }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobility">Mobilidade</SelectItem>
                    <SelectItem value="food">Refeição</SelectItem>
                    <SelectItem value="pharmacy">Farmácia</SelectItem>
                    <SelectItem value="pet">Pet</SelectItem>
                    <SelectItem value="shopping">Compras</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddCashbackDialogOpen(false)} disabled={savingCashback}>Cancelar</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleAddCashback} disabled={savingCashback || !cashbackFormData.targetUserId || cashbackFormData.amount <= 0}>
                {savingCashback ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="h-4 w-4" />}
                Adicionar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== PLAN CREATE/EDIT DIALOG ===== */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              {editingPlan ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Atualize os dados do plano.' : 'Preencha os dados do novo plano.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Nome do Plano</Label>
              <Input value={planFormData.name} onChange={(e) => setPlanFormData(d => ({ ...d, name: e.target.value }))} placeholder="Ex: Blue 7" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Preço (centavos)</Label>
              <Input value={planFormData.price} onChange={(e) => setPlanFormData(d => ({ ...d, price: parseInt(e.target.value) || 0 }))} type="number" placeholder="9700" />
              <p className="text-[10px] text-muted-foreground">{planFormData.price > 0 ? formatCurrency(planFormData.price) : 'Grátis'}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Features (separadas por vírgula)</Label>
              <Input value={planFormData.features} onChange={(e) => setPlanFormData(d => ({ ...d, features: e.target.value }))} placeholder="CashBack Entrada, App Mobilidade, Telemedicina" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Matriz Entrada</Label>
                <Input value={planFormData.matrixEntrada} onChange={(e) => setPlanFormData(d => ({ ...d, matrixEntrada: e.target.value }))} placeholder="4x5" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Matriz Residual</Label>
                <Input value={planFormData.matrixResidual} onChange={(e) => setPlanFormData(d => ({ ...d, matrixResidual: e.target.value }))} placeholder="4x7" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Matriz Vendas</Label>
                <Input value={planFormData.matrixVendas} onChange={(e) => setPlanFormData(d => ({ ...d, matrixVendas: e.target.value }))} placeholder="4x9" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPlanDialogOpen(false)} disabled={savingPlan}>Cancelar</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleSavePlan} disabled={savingPlan || !planFormData.name}>
                {savingPlan ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                {editingPlan ? 'Salvar' : 'Criar Plano'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
