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
  ArrowUpDown, Receipt, PieChart, Filter, Download, Calendar,
  MessageSquare, Send,
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

interface FinancialOverview {
  totalRevenue: number; totalPlatformBalance: number;
  pendingWithdrawals: number; approvedWithdrawals: number;
  totalCashback: number; totalInCirculation: number;
}

interface FinancialTransaction {
  id: string; userId: string; userName: string; userEmail: string;
  type: string; amount: number; status: string; category: string;
  description: string; createdAt: string;
}

interface FinancialData {
  overview: FinancialOverview;
  recentTransactions: FinancialTransaction[];
  monthlyRevenue: { month: string; revenue: number }[];
  categoryBreakdown: { category: string; amount: number }[];
}

interface AdminTicket {
  id: string; userId: string; userName: string; userEmail: string;
  subject: string; category: string; status: string; priority: string;
  createdAt: string; updatedAt: string;
  messages: { id: string; message: string; isAdmin: boolean; userId: string; createdAt: string }[];
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

  // Financial tab
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [financialTypeFilter, setFinancialTypeFilter] = useState('all')
  const [financialStatusFilter, setFinancialStatusFilter] = useState('all')
  const [financialDateFrom, setFinancialDateFrom] = useState('')
  const [financialDateTo, setFinancialDateTo] = useState('')
  const [financialDatePreset, setFinancialDatePreset] = useState('')

  // Users bulk actions
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [processingBulk, setProcessingBulk] = useState(false)

  // Announcement edit
  const [editAnnouncementDialogOpen, setEditAnnouncementDialogOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<AdminAnnouncement | null>(null)
  const [editAnnouncementData, setEditAnnouncementData] = useState({ title: '', message: '', type: 'info', priority: 'normal', actionLabel: '', actionUrl: '' })
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)

  // Support/Tickets tab
  const [tickets, setTickets] = useState<AdminTicket[]>([])
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all')
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null)
  const [ticketReply, setTicketReply] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const isAdmin = user?.role === 'admin'

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
    if (activeTab === 'financial') loadFinancial()
    if (activeTab === 'tickets') loadTickets()
  }, [activeTab, searchQuery, planFilter, statusFilter, userPage, withdrawalStatusFilter, cashbackTypeFilter, cashbackUserFilter, ticketStatusFilter, ticketPriorityFilter])

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
      const data = await apiFetch<AdminAnnouncement[]>(`/admin/announcements?userId=${user?.id}`)
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

  const loadFinancial = async () => {
    try {
      const data = await apiFetch<FinancialData>(`/admin/financial?userId=${user?.id}`)
      setFinancialData(data)
    } catch { /* ignore */ }
  }

  const loadTickets = async () => {
    try {
      const params = new URLSearchParams({ userId: user?.id || '', status: ticketStatusFilter, priority: ticketPriorityFilter })
      const data = await apiFetch<{ tickets: AdminTicket[] }>(`/admin/support/tickets?${params}`)
      setTickets(data.tickets || [])
    } catch { /* ignore */ }
  }

  const handleReplyTicket = async () => {
    if (!selectedTicket || !ticketReply.trim()) return
    setSendingReply(true)
    try {
      await apiFetch(`/admin/support/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ userId: user?.id, message: ticketReply }),
      })
      setTicketReply('')
      const data = await apiFetch<{ ticket: AdminTicket }>(`/admin/support/tickets/${selectedTicket.id}?userId=${user?.id}`)
      setSelectedTicket(data.ticket || data as unknown as AdminTicket)
      loadTickets()
      toast.success('Resposta enviada com sucesso!')
    } catch {
      toast.error('Erro ao enviar resposta')
    } finally {
      setSendingReply(false)
    }
  }

  const handleChangeTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      await apiFetch(`/admin/support/tickets/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify({ userId: user?.id, status: newStatus }),
      })
      loadTickets()
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null)
      }
      toast.success('Status atualizado!')
    } catch {
      toast.error('Erro ao atualizar status')
    }
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

  // ---------- Announcement Edit ----------
  const handleOpenEditAnnouncement = (a: AdminAnnouncement) => {
    setEditingAnnouncement(a)
    setEditAnnouncementData({
      title: a.title || '',
      message: a.message || '',
      type: a.type || 'info',
      priority: a.priority || 'normal',
      actionLabel: a.actionLabel || '',
      actionUrl: a.actionUrl || '',
    })
    setEditAnnouncementDialogOpen(true)
  }

  const handleSaveAnnouncement = async () => {
    if (!editingAnnouncement) return
    setSavingAnnouncement(true)
    try {
      await apiFetch(`/admin/announcements/${editingAnnouncement.id}`, {
        method: 'PUT',
        body: JSON.stringify({ userId: user?.id, ...editAnnouncementData }),
      })
      setEditAnnouncementDialogOpen(false)
      setEditingAnnouncement(null)
      loadAnnouncements()
      toast.success('Anúncio atualizado com sucesso!')
    } catch {
      toast.error('Erro ao atualizar anúncio')
    } finally {
      setSavingAnnouncement(false)
    }
  }

  // ---------- Bulk User Actions ----------
  const handleBulkAction = async (action: 'activate' | 'deactivate') => {
    if (selectedUserIds.size === 0) return
    setProcessingBulk(true)
    try {
      await apiFetch('/admin/users/bulk', {
        method: 'POST',
        body: JSON.stringify({ userId: user?.id, userIds: Array.from(selectedUserIds), action }),
      })
      setSelectedUserIds(new Set())
      loadUsers()
      toast.success(action === 'activate' ? 'Usuários ativados com sucesso!' : 'Usuários desativados com sucesso!')
    } catch {
      toast.error('Erro ao processar ação em massa')
    } finally {
      setProcessingBulk(false)
    }
  }

  const handleExportCSV = () => {
    if (!users?.users?.length) {
      toast.error('Nenhum usuário para exportar')
      return
    }
    const headers = ['Nome', 'Email', 'Telefone', 'CPF', 'Plano', 'Status', 'Saldo Saque', 'Saldo Mobilidade', 'Saldo Compras', 'Cidade', 'Estado', 'Data Cadastro']
    const rows = users.users.map(u => [
      u.name, u.email, u.phone, u.cpf, getPlanName(u.plan),
      u.isActive ? 'Ativo' : 'Inativo',
      (u.balanceWithdrawal / 100).toFixed(2),
      (u.balanceMobility / 100).toFixed(2),
      (u.balanceShopping / 100).toFixed(2),
      u.city, u.state,
      new Date(u.createdAt).toLocaleDateString('pt-BR'),
    ])
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `usuarios_newmobility_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    toast.success('CSV exportado com sucesso!')
  }

  const toggleUserSelection = (id: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllUsers = () => {
    if (!users?.users) return
    if (selectedUserIds.size === users.users.length) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(users.users.map(u => u.id)))
    }
  }

  // ---------- Financial Date Presets ----------
  const applyDatePreset = (preset: string) => {
    setFinancialDatePreset(preset)
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const fmt = (d: Date) => d.toISOString().split('T')[0]

    if (preset === 'this_month') {
      setFinancialDateFrom(fmt(new Date(y, m, 1)))
      setFinancialDateTo(fmt(now))
    } else if (preset === 'last_month') {
      setFinancialDateFrom(fmt(new Date(y, m - 1, 1)))
      setFinancialDateTo(fmt(new Date(y, m, 0)))
    } else if (preset === 'last_3_months') {
      setFinancialDateFrom(fmt(new Date(y, m - 2, 1)))
      setFinancialDateTo(fmt(now))
    } else {
      setFinancialDateFrom('')
      setFinancialDateTo('')
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
    const colors: Record<string, string> = { info: 'bg-blue-100 text-blue-700', warning: 'bg-amber-100 text-amber-700', success: 'bg-emerald-100 text-emerald-700', promo: 'bg-emerald-100 text-emerald-700', maintenance: 'bg-amber-100 text-amber-700', feature: 'bg-purple-100 text-purple-700', urgent: 'bg-red-100 text-red-700' }
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

  // Admin access guard
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-center text-red-700 dark:text-red-400">Acesso Restrito</h2>
          <p className="text-sm text-center text-red-600 dark:text-red-300 mt-2">Apenas administradores podem acessar este painel.</p>
        </div>
      </div>
    )
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
          <TabsTrigger value="financial" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <PieChart className="h-3.5 w-3.5" /> Financeiro
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Wallet className="h-3.5 w-3.5" /> Saques
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <FileText className="h-3.5 w-3.5" /> Suporte
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
          {loading && !stats && (
            <div className="flex items-center justify-center py-12">
              <span className="h-6 w-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
              <span className="ml-3 text-sm text-muted-foreground">Carregando estatísticas...</span>
            </div>
          )}
          {!loading && !stats && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Erro ao carregar estatísticas</p>
                <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">Verifique sua conexão e tente novamente.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={loadStats}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          )}
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
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={handleExportCSV}>
                  <Download className="h-3.5 w-3.5" /> Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions Bar */}
          {selectedUserIds.size > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CardContent className="p-3 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm font-medium text-foreground">{selectedUserIds.size} usuário(s) selecionado(s)</span>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" disabled={processingBulk} onClick={() => handleBulkAction('activate')}>
                      {processingBulk ? <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                      Ativar
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" disabled={processingBulk} onClick={() => handleBulkAction('deactivate')}>
                      <UserX className="h-3.5 w-3.5" />
                      Desativar
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setSelectedUserIds(new Set())}>
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 w-10">
                        <input type="checkbox" checked={users?.users?.length ? selectedUserIds.size === users.users.length : false} onChange={toggleAllUsers} className="rounded border-input" />
                      </th>
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
                      <tr key={u.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${selectedUserIds.has(u.id) ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}>
                        <td className="p-3">
                          <input type="checkbox" checked={selectedUserIds.has(u.id)} onChange={() => toggleUserSelection(u.id)} className="rounded border-input" />
                        </td>
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

        {/* Financial Tab */}
        <TabsContent value="financial" className="mt-4 space-y-4">
          {financialData && (
            <>
              {/* Financial Health Dashboard */}
              <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-600" /> Saúde Financeira
                    </h3>
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {financialData.overview.totalRevenue > 0 && financialData.overview.pendingWithdrawals < financialData.overview.totalRevenue * 0.3 ? 'Saudável' : 'Atenção'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Receita / Saques Pend.</p>
                      <p className="text-lg font-bold text-foreground">
                        {financialData.overview.pendingWithdrawals > 0
                          ? (financialData.overview.totalRevenue / financialData.overview.pendingWithdrawals).toFixed(1)
                          : '∞'}x
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">CashBack / Receita</p>
                      <p className="text-lg font-bold text-foreground">
                        {financialData.overview.totalRevenue > 0
                          ? ((financialData.overview.totalCashback / financialData.overview.totalRevenue) * 100).toFixed(1)
                          : '0'}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Em Circulação / Total</p>
                      <p className="text-lg font-bold text-foreground">
                        {financialData.overview.totalPlatformBalance > 0
                          ? ((financialData.overview.totalInCirculation / financialData.overview.totalPlatformBalance) * 100).toFixed(1)
                          : '0'}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Dashboard - Big Number Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Receita Total', value: formatCurrency(financialData.overview.totalRevenue), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-l-4 border-emerald-500', sub: financialData.monthlyRevenue.length > 0 ? `Média: ${formatCurrency(financialData.monthlyRevenue.reduce((s, m) => s + m.revenue, 0) / financialData.monthlyRevenue.length)}` : undefined },
                  { label: 'Saldo Plataforma', value: formatCurrency(financialData.overview.totalPlatformBalance), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-l-4 border-amber-500', sub: financialData.overview.totalPlatformBalance > financialData.overview.pendingWithdrawals ? 'Cobertura OK' : 'Verificar saldo' },
                  { label: 'Saques Pendentes', value: formatCurrency(financialData.overview.pendingWithdrawals), icon: Clock, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-l-4 border-red-500', sub: financialData.overview.pendingWithdrawals > 0 ? 'Aguardando aprovação' : undefined },
                  { label: 'Saques Aprovados', value: formatCurrency(financialData.overview.approvedWithdrawals), icon: Check, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-l-4 border-blue-500', sub: financialData.overview.approvedWithdrawals > 0 && financialData.overview.pendingWithdrawals > 0 ? `${((financialData.overview.approvedWithdrawals / (financialData.overview.approvedWithdrawals + financialData.overview.pendingWithdrawals)) * 100).toFixed(0)}% taxa aprovação` : undefined },
                  { label: 'CashBack Distribuído', value: formatCurrency(financialData.overview.totalCashback), icon: Receipt, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-l-4 border-purple-500', sub: financialData.overview.totalRevenue > 0 ? `${((financialData.overview.totalCashback / financialData.overview.totalRevenue) * 100).toFixed(1)}% da receita` : undefined },
                  { label: 'Saldo em Circulação', value: formatCurrency(financialData.overview.totalInCirculation), icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-l-4 border-orange-500', sub: financialData.overview.totalPlatformBalance > 0 ? `${((financialData.overview.totalInCirculation / financialData.overview.totalPlatformBalance) * 100).toFixed(1)}% do total` : undefined },
                ].map((card, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className={`${card.bg} border-0 ${card.border}`}>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <card.icon className={`h-5 w-5 ${card.color}`} />
                          <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{card.value}</p>
                        {card.sub && <p className="text-[10px] text-muted-foreground mt-1">{card.sub}</p>}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Transaction Filters */}
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Filter className="h-4 w-4 text-emerald-600" /> Filtros de Transação</CardTitle></CardHeader>
                <CardContent>
                  {/* Date Range Presets */}
                  <div className="mb-3">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Período Rápido</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: '', label: 'Todos' },
                        { value: 'this_month', label: 'Este mês' },
                        { value: 'last_month', label: 'Último mês' },
                        { value: 'last_3_months', label: 'Últimos 3 meses' },
                      ].map(p => (
                        <button key={p.value} onClick={() => applyDatePreset(p.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${financialDatePreset === p.value ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1">Data Início</Label>
                      <Input type="date" value={financialDateFrom} onChange={e => { setFinancialDateFrom(e.target.value); setFinancialDatePreset('') }} className="h-9" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1">Data Fim</Label>
                      <Input type="date" value={financialDateTo} onChange={e => { setFinancialDateTo(e.target.value); setFinancialDatePreset('') }} className="h-9" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1">Tipo</Label>
                      <select value={financialTypeFilter} onChange={e => setFinancialTypeFilter(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                        <option value="all">Todos</option>
                        <option value="deposit">Depósito</option>
                        <option value="withdrawal">Saque</option>
                        <option value="cashback">Cashback</option>
                        <option value="gratification">Gratificação</option>
                        <option value="marketplace_purchase">Marketplace</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1">Status</Label>
                      <select value={financialStatusFilter} onChange={e => setFinancialStatusFilter(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                        <option value="all">Todos</option>
                        <option value="pending">Pendente</option>
                        <option value="approved">Aprovado</option>
                        <option value="rejected">Rejeitado</option>
                        <option value="paid">Pago</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Monthly Revenue Chart - Enhanced */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-emerald-600" /> Receita Mensal</CardTitle>
                      <Badge variant="outline" className="text-[9px]">Últimos 6 meses</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {financialData.monthlyRevenue.length > 0 ? (
                      <div className="space-y-2">
                        {financialData.monthlyRevenue.map(m => {
                          const maxRevenue = Math.max(...financialData.monthlyRevenue.map(r => r.revenue), 1)
                          const pct = (m.revenue / maxRevenue) * 100
                          const [year, month] = m.month.split('-')
                          const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                          return (
                            <div key={m.month} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-muted-foreground">{monthNames[parseInt(month) - 1]}/{year}</span>
                                <span className="font-semibold text-foreground">{formatCurrency(m.revenue)}</span>
                              </div>
                              <div className="w-full h-8 bg-muted/50 rounded-lg overflow-hidden relative">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 rounded-lg flex items-center justify-end pr-3"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.max(pct, 3)}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                >
                                  {pct > 15 && <span className="text-[10px] font-bold text-white drop-shadow-sm">{Math.round(pct)}%</span>}
                                </motion.div>
                                {pct <= 15 && pct > 0 && (
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground">{Math.round(pct)}%</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma receita registrada</div>
                    )}
                  </CardContent>
                </Card>

                {/* Category Breakdown - Enhanced with bars */}
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><PieChart className="h-4 w-4 text-emerald-600" /> Resumo por Categoria</CardTitle></CardHeader>
                  <CardContent>
                    {financialData.categoryBreakdown.length > 0 ? (
                      <div className="space-y-3">
                        {/* Pie chart visual */}
                        <div className="flex items-center justify-center">
                          <div className="flex w-40 h-40 rounded-full overflow-hidden border-4 border-background shadow-inner">
                            {(() => {
                              const total = financialData.categoryBreakdown.reduce((s, c) => s + c.amount, 0) || 1
                              const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-red-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']
                              return financialData.categoryBreakdown.map((c, i) => {
                                const pct = (c.amount / total) * 100
                                return (
                                  <div
                                    key={c.category}
                                    className={`${colors[i % colors.length]}`}
                                    style={{ width: `${pct}%` }}
                                    title={`${c.category}: ${formatCurrency(c.amount)}`}
                                  />
                                )
                              })
                            })()}
                          </div>
                        </div>
                        {/* Legend with visual bars */}
                        <div className="space-y-2">
                          {(() => {
                            const total = financialData.categoryBreakdown.reduce((s, c) => s + c.amount, 0) || 1
                            const maxAmount = Math.max(...financialData.categoryBreakdown.map(c => c.amount), 1)
                            const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-red-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']
                            const categoryLabels: Record<string, string> = {
                              withdrawal: 'Saque', mobility: 'Mobilidade', shopping: 'Compras',
                              food: 'Refeição', pharmacy: 'Farmácia', gratification: 'Gratificação',
                              marketplace: 'Marketplace', other: 'Outros',
                            }
                            return financialData.categoryBreakdown.map((c, i) => {
                              const pct = (c.amount / total) * 100
                              const barPct = (c.amount / maxAmount) * 100
                              return (
                                <div key={c.category} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className={`h-3 w-3 rounded-sm ${colors[i % colors.length]}`} />
                                      <span className="text-xs text-foreground">{categoryLabels[c.category] || c.category}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-foreground">{formatCurrency(c.amount)}</span>
                                      <span className="text-[10px] text-muted-foreground">{pct.toFixed(1)}%</span>
                                    </div>
                                  </div>
                                  <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full ${colors[i % colors.length]} rounded-full`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${barPct}%` }}
                                      transition={{ duration: 0.6, ease: 'easeOut' }}
                                    />
                                  </div>
                                </div>
                              )
                            })
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma categoria registrada</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Revenue Summary with Trend */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600" /> Resumo de Receita Mensal</CardTitle>
                    <div className="flex items-center gap-2">
                      {financialData.monthlyRevenue.length >= 2 && (() => {
                        const sorted = [...financialData.monthlyRevenue].sort((a, b) => a.month.localeCompare(b.month))
                        const last = sorted[sorted.length - 1]
                        const prev = sorted[sorted.length - 2]
                        const change = prev.revenue > 0 ? ((last.revenue - prev.revenue) / prev.revenue) * 100 : 0
                        const isPositive = change >= 0
                        return (
                          <Badge className={`${isPositive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'} text-[10px] gap-1`}>
                            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />}
                            {isPositive ? '+' : ''}{change.toFixed(1)}%
                          </Badge>
                        )
                      })()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {financialData.monthlyRevenue.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      {financialData.monthlyRevenue.map(m => {
                        const [year, month] = m.month.split('-')
                        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                        const maxRev = Math.max(...financialData.monthlyRevenue.map(r => r.revenue), 1)
                        const pct = (m.revenue / maxRev) * 100
                        return (
                          <div key={m.month} className="text-center p-3 bg-muted/30 rounded-lg">
                            <p className="text-[10px] text-muted-foreground font-medium">{monthNames[parseInt(month) - 1]}/{year.slice(2)}</p>
                            <p className="text-sm font-bold text-foreground mt-1">{formatCurrency(m.revenue)}</p>
                            <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                              <motion.div
                                className="h-full bg-emerald-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma receita registrada</div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Withdrawals - Approve/Reject */}
              {financialData.recentTransactions.filter(t => t.type === 'withdrawal' && t.status === 'pending').length > 0 && (
                <Card className="border-amber-200 dark:border-amber-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        Saques Pendentes ({financialData.recentTransactions.filter(t => t.type === 'withdrawal' && t.status === 'pending').length})
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-amber-50/50 dark:bg-amber-950/20">
                            <th className="text-left text-xs font-semibold text-muted-foreground p-3">Usuário</th>
                            <th className="text-left text-xs font-semibold text-muted-foreground p-3">Valor</th>
                            <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden sm:table-cell">Data</th>
                            <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden md:table-cell">Descrição</th>
                            <th className="text-right text-xs font-semibold text-muted-foreground p-3">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financialData.recentTransactions
                            .filter(t => t.type === 'withdrawal' && t.status === 'pending')
                            .map(t => (
                              <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                <td className="p-3">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{t.userName}</p>
                                    <p className="text-[10px] text-muted-foreground">{t.userEmail}</p>
                                  </div>
                                </td>
                                <td className="p-3"><span className="text-sm font-semibold text-red-600">{formatCurrency(t.amount)}</span></td>
                                <td className="p-3 hidden sm:table-cell"><span className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</span></td>
                                <td className="p-3 hidden md:table-cell"><span className="text-xs text-muted-foreground line-clamp-1">{t.description || '—'}</span></td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" disabled={processingWithdrawal === t.id} onClick={() => handleWithdrawalAction(t.id, 'approve')}>
                                      {processingWithdrawal === t.id ? <span className="h-3.5 w-3.5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                      <span className="hidden sm:inline">Aprovar</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" disabled={processingWithdrawal === t.id} onClick={() => handleWithdrawalAction(t.id, 'reject')}>
                                      <Ban className="h-3.5 w-3.5" />
                                      <span className="hidden sm:inline">Rejeitar</span>
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Financial Health Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" /> Métricas de Saúde Financeira
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Taxa de Aprovação</p>
                      <p className="text-lg font-bold text-foreground">
                        {financialData.overview.approvedWithdrawals + financialData.overview.pendingWithdrawals > 0
                          ? ((financialData.overview.approvedWithdrawals / (financialData.overview.approvedWithdrawals + financialData.overview.pendingWithdrawals)) * 100).toFixed(0)
                          : '0'}%
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">CB / Receita</p>
                      <p className="text-lg font-bold text-foreground">
                        {financialData.overview.totalRevenue > 0
                          ? ((financialData.overview.totalCashback / financialData.overview.totalRevenue) * 100).toFixed(1)
                          : '0'}%
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Saldo Líquido</p>
                      <p className={`text-lg font-bold ${financialData.overview.totalRevenue - financialData.overview.totalCashback - financialData.overview.approvedWithdrawals >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(financialData.overview.totalRevenue - financialData.overview.totalCashback - financialData.overview.approvedWithdrawals)}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Em Circulação</p>
                      <p className="text-lg font-bold text-foreground">
                        {financialData.overview.totalPlatformBalance > 0
                          ? ((financialData.overview.totalInCirculation / financialData.overview.totalPlatformBalance) * 100).toFixed(1)
                          : '0'}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-600" /> Transações Recentes</CardTitle>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                      if (!financialData?.recentTransactions?.length) { toast.error('Nenhuma transação para exportar'); return }
                      const headers = ['Data', 'Usuário', 'Email', 'Tipo', 'Valor', 'Status', 'Descrição']
                      const typeLabels: Record<string, string> = { deposit: 'Depósito', withdrawal: 'Saque', cashback_entry: 'CB Entrada', cashback_residual: 'CB Residual', cashback_sales: 'CB Vendas', gratification: 'Gratificação', plan_payment: 'Pag. Plano', marketplace_purchase: 'Marketplace', voucher: 'Voucher', bonus: 'Bônus' }
                      const statusLabels: Record<string, string> = { pending: 'Pendente', approved: 'Aprovado', rejected: 'Rejeitado', paid: 'Pago' }
                      const rows = financialData.recentTransactions.map(t => [new Date(t.createdAt).toLocaleString('pt-BR'), t.userName, t.userEmail, typeLabels[t.type] || t.type, (t.amount / 100).toFixed(2), statusLabels[t.status] || t.status, t.description || ''])
                      const csvContent = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
                      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
                      const link = document.createElement('a')
                      link.href = URL.createObjectURL(blob)
                      link.download = `financeiro_newmobility_${new Date().toISOString().split('T')[0]}.csv`
                      link.click()
                      URL.revokeObjectURL(link.href)
                      toast.success('Relatório financeiro exportado!')
                    }}>
                      <Download className="h-3 w-3" /> Exportar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-background z-10">
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-semibold text-muted-foreground p-3">Data</th>
                          <th className="text-left text-xs font-semibold text-muted-foreground p-3">Usuário</th>
                          <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden sm:table-cell">Tipo</th>
                          <th className="text-right text-xs font-semibold text-muted-foreground p-3">Valor</th>
                          <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden md:table-cell">Status</th>
                          <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden lg:table-cell">Descrição</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financialData.recentTransactions
                          .filter(t => {
                            if (financialTypeFilter !== 'all') {
                              if (financialTypeFilter === 'cashback' && !t.type.startsWith('cashback')) return false
                              if (financialTypeFilter !== 'cashback' && t.type !== financialTypeFilter) return false
                            }
                            if (financialStatusFilter !== 'all' && t.status !== financialStatusFilter) return false
                            if (financialDateFrom && new Date(t.createdAt) < new Date(financialDateFrom)) return false
                            if (financialDateTo && new Date(t.createdAt) > new Date(financialDateTo + 'T23:59:59')) return false
                            return true
                          })
                          .slice(0, 50)
                          .map(t => {
                            const typeLabels: Record<string, string> = {
                              deposit: 'Depósito', withdrawal: 'Saque', cashback_entry: 'CB Entrada',
                              cashback_residual: 'CB Residual', cashback_sales: 'CB Vendas',
                              gratification: 'Gratificação', voucher: 'Voucher', bonus: 'Bônus',
                              marketplace_purchase: 'Marketplace', plan_payment: 'Pag. Plano',
                            }
                            const typeBadge: Record<string, string> = {
                              deposit: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                              withdrawal: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                              cashback_entry: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                              cashback_residual: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                              cashback_sales: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
                              gratification: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                              voucher: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
                              bonus: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
                              marketplace_purchase: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                              plan_payment: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
                            }
                            const statusBadge: Record<string, string> = {
                              pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                              approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                              rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                              paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                            }
                            const statusLabels: Record<string, string> = {
                              pending: 'Pendente', approved: 'Aprovado', rejected: 'Rejeitado', paid: 'Pago',
                            }
                            const dateStr = new Date(t.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                            return (
                              <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{dateStr}</td>
                                <td className="p-3">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{t.userName}</p>
                                    <p className="text-[10px] text-muted-foreground">{t.userEmail}</p>
                                  </div>
                                </td>
                                <td className="p-3 hidden sm:table-cell"><Badge className={typeBadge[t.type] || 'bg-gray-100 text-gray-700'}>{typeLabels[t.type] || t.type}</Badge></td>
                                <td className="p-3 text-right">
                                  <span className={`text-sm font-medium ${t.type === 'withdrawal' || t.type === 'marketplace_purchase' ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {t.type === 'withdrawal' || t.type === 'marketplace_purchase' ? '-' : '+'}{formatCurrency(t.amount)}
                                  </span>
                                </td>
                                <td className="p-3 hidden md:table-cell"><Badge className={statusBadge[t.status] || 'bg-gray-100 text-gray-700'}>{statusLabels[t.status] || t.status}</Badge></td>
                                <td className="p-3 hidden lg:table-cell"><span className="text-xs text-muted-foreground line-clamp-1">{t.description || '—'}</span></td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                  {financialData.recentTransactions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma transação encontrada</div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
          {!financialData && (
            <div className="flex items-center justify-center py-12">
              <span className="h-6 w-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          )}
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

        {/* Tickets / Suporte Tab */}
        <TabsContent value="tickets" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                Tickets de Suporte
              </h3>
              <p className="text-xs text-muted-foreground">{tickets.length} ticket(s) encontrado(s)</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={ticketStatusFilter} onChange={(e) => setTicketStatusFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">Todos os Status</option>
                <option value="open">Aberto</option>
                <option value="in_progress">Em Andamento</option>
                <option value="resolved">Resolvido</option>
                <option value="closed">Fechado</option>
              </select>
              <select value={ticketPriorityFilter} onChange={(e) => setTicketPriorityFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">Todas Prioridades</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="normal">Normal</option>
                <option value="low">Baixa</option>
              </select>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={loadTickets}>
                <RefreshCw className="h-3.5 w-3.5" /> Atualizar
              </Button>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={async () => {
                try {
                  await apiFetch('/seed-tickets', { method: 'POST' })
                  loadTickets()
                  toast.success('Tickets de teste criados!')
                } catch {
                  toast.error('Erro ao criar tickets de teste')
                }
              }}>
                <Plus className="h-3.5 w-3.5" /> Criar Teste
              </Button>
            </div>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Abertos', count: tickets.filter(t => t.status === 'open').length, color: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-600' },
              { label: 'Em Andamento', count: tickets.filter(t => t.status === 'in_progress').length, color: 'bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-600' },
              { label: 'Resolvidos', count: tickets.filter(t => t.status === 'resolved').length, color: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-600' },
              { label: 'Fechados', count: tickets.filter(t => t.status === 'closed').length, color: 'bg-gray-50 dark:bg-gray-950/30', iconColor: 'text-gray-600' },
            ].map((s, i) => (
              <Card key={i} className={`${s.color} border-0`}>
                <CardContent className="p-3">
                  <p className="text-lg font-bold text-foreground">{s.count}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Ticket List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader><CardTitle className="text-sm">Lista de Tickets</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-y-auto">
                    {tickets.length > 0 ? tickets.map(ticket => {
                      const statusBadge: Record<string, string> = {
                        open: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                        in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                        resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                        closed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                      }
                      const statusLabel: Record<string, string> = { open: 'Aberto', in_progress: 'Em Andamento', resolved: 'Resolvido', closed: 'Fechado' }
                      const priorityBadge: Record<string, string> = {
                        low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                        medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                        high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                        urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                      }
                      const priorityLabel: Record<string, string> = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' }
                      const categoryLabel: Record<string, string> = { technical: 'Técnico', financial: 'Financeiro', account: 'Conta', general: 'Geral', bug: 'Bug', feature: 'Sugestão' }
                      const isSelected = selectedTicket?.id === ticket.id
                      return (
                        <button
                          key={ticket.id}
                          className={`w-full text-left p-3 border-b border-border/50 hover:bg-muted/30 transition-colors ${isSelected ? 'bg-emerald-50 dark:bg-emerald-950/20 border-l-2 border-l-emerald-500' : ''}`}
                          onClick={async () => {
                            try {
                              const data = await apiFetch<{ ticket: AdminTicket }>(`/admin/support/tickets/${ticket.id}?userId=${user?.id}`)
                              setSelectedTicket(data.ticket || data as unknown as AdminTicket)
                            } catch {
                              setSelectedTicket(ticket)
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{ticket.userName} • {ticket.userEmail}</p>
                            </div>
                            <Badge className={`${statusBadge[ticket.status] || 'bg-gray-100 text-gray-700'} text-[9px] whitespace-nowrap`}>
                              {statusLabel[ticket.status] || ticket.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge className={`${priorityBadge[ticket.priority] || 'bg-gray-100 text-gray-700'} text-[9px]`}>
                              {priorityLabel[ticket.priority] || ticket.priority}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{categoryLabel[ticket.category] || ticket.category}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto">{ticket.messages?.length || 0} msg(s)</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </button>
                      )
                    }) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        Nenhum ticket encontrado
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ticket Detail */}
            <div className="lg:col-span-3">
              {selectedTicket ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4 text-emerald-600" />
                          {selectedTicket.subject}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedTicket.userName} ({selectedTicket.userEmail}) • Criado em {new Date(selectedTicket.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${
                            selectedTicket.status === 'open' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            selectedTicket.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            selectedTicket.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          } text-[10px]`}>
                            {selectedTicket.status === 'open' ? 'Aberto' : selectedTicket.status === 'in_progress' ? 'Em Andamento' : selectedTicket.status === 'resolved' ? 'Resolvido' : selectedTicket.status === 'closed' ? 'Fechado' : selectedTicket.status}
                          </Badge>
                          <Badge className={`${
                            selectedTicket.priority === 'low' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                            selectedTicket.priority === 'normal' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            selectedTicket.priority === 'high' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          } text-[10px]`}>
                            {selectedTicket.priority === 'low' ? 'Baixa' : selectedTicket.priority === 'normal' ? 'Normal' : selectedTicket.priority === 'high' ? 'Alta' : selectedTicket.priority === 'urgent' ? 'Urgente' : selectedTicket.priority}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {selectedTicket.category === 'technical' ? 'Técnico' : selectedTicket.category === 'financial' ? 'Financeiro' : selectedTicket.category === 'account' ? 'Conta' : selectedTicket.category === 'other' ? 'Outro' : selectedTicket.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedTicket.status}
                          onChange={(e) => handleChangeTicketStatus(selectedTicket.id, e.target.value)}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="open">Aberto</option>
                          <option value="in_progress">Em Andamento</option>
                          <option value="resolved">Resolvido</option>
                          <option value="closed">Fechado</option>
                        </select>
                        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={async () => {
                          try {
                            const data = await apiFetch<{ ticket: AdminTicket }>(`/admin/support/tickets/${selectedTicket.id}?userId=${user?.id}`)
                            setSelectedTicket(data.ticket || data as unknown as AdminTicket)
                          } catch { /* ignore */ }
                        }}>
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Messages */}
                    <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
                      {selectedTicket.messages?.map(msg => (
                        <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[85%] rounded-lg p-3 ${msg.isAdmin ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800' : 'bg-muted/50 border border-border'}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                              {msg.isAdmin && <Shield className="h-3 w-3 text-emerald-600" />}
                              <span className="text-[10px] font-semibold text-muted-foreground">
                                {msg.isAdmin ? 'Admin' : selectedTicket.userName}
                              </span>
                              <span className="text-[9px] text-muted-foreground/60">
                                {new Date(msg.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        </div>
                      ))}
                      {(!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                        <div className="text-center py-4 text-muted-foreground text-xs">Nenhuma mensagem neste ticket</div>
                      )}
                    </div>

                    <Separator />

                    {/* Reply */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Responder como Admin</Label>
                      <textarea
                        value={ticketReply}
                        onChange={(e) => setTicketReply(e.target.value)}
                        placeholder="Escreva sua resposta..."
                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) handleReplyTicket()
                        }}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Ctrl+Enter para enviar</span>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-8 text-xs"
                          onClick={handleReplyTicket}
                          disabled={sendingReply || !ticketReply.trim()}
                        >
                          {sendingReply ? <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          Enviar Resposta
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Selecione um ticket para ver os detalhes</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Config Tab → Configurações */}
        <TabsContent value="config" className="mt-4 space-y-4">
          {/* Platform Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4 text-emerald-600" />
                Configurações da Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-emerald-600" /> Informações Gerais
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Nome da Plataforma</Label>
                    <Input value={configs.platform_name || ''} onChange={(e) => setConfigs(c => ({ ...c, platform_name: e.target.value }))} placeholder="NewMobility" />
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <ToggleLeft className="h-4 w-4 text-amber-600" /> Controles do Sistema
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">Modo Manutenção</p>
                      <p className="text-xs text-muted-foreground">Desabilita o acesso para usuários comuns</p>
                    </div>
                    <button
                      onClick={() => setConfigs(c => ({ ...c, maintenance_mode: c.maintenance_mode === 'true' ? 'false' : 'true' }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${configs.maintenance_mode === 'true' ? 'bg-amber-500' : 'bg-muted'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${configs.maintenance_mode === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">Novos Cadastros</p>
                      <p className="text-xs text-muted-foreground">Permitir registro de novos usuários</p>
                    </div>
                    <button
                      onClick={() => setConfigs(c => ({ ...c, registration_enabled: c.registration_enabled === 'false' ? 'true' : 'false' }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${configs.registration_enabled !== 'false' ? 'bg-emerald-500' : 'bg-muted'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${configs.registration_enabled !== 'false' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" /> CashBack Padrão
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
            <p className="text-sm text-muted-foreground">{announcements.length} anúncios</p>
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
                          <option value="info">Info</option>
                          <option value="warning">Aviso</option>
                          <option value="success">Sucesso</option>
                          <option value="promo">Promo</option>
                          <option value="maintenance">Manutenção</option>
                          <option value="feature">Feature</option>
                          <option value="urgent">Urgente</option>
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
                        {!a.isActive && <Badge className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 text-[10px]">Inativo</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{a.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(a.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleAnnouncement(a.id, a.isActive)} title={a.isActive ? 'Desativar' : 'Ativar'}>
                        {a.isActive ? <ToggleRight className="h-3.5 w-3.5 text-emerald-600" /> : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:text-blue-700" onClick={() => handleOpenEditAnnouncement(a)} title="Editar">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => handleDeleteAnnouncement(a.id)} title="Excluir">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {announcements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Nenhum anúncio cadastrado
              </div>
            )}
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

      {/* ===== EDIT ANNOUNCEMENT DIALOG ===== */}
      <Dialog open={editAnnouncementDialogOpen} onOpenChange={setEditAnnouncementDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-emerald-600" />
              Editar Anúncio
            </DialogTitle>
            <DialogDescription>Atualize os dados do anúncio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Título</Label>
              <Input value={editAnnouncementData.title} onChange={(e) => setEditAnnouncementData(d => ({ ...d, title: e.target.value }))} placeholder="Título do anúncio" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Mensagem</Label>
              <Input value={editAnnouncementData.message} onChange={(e) => setEditAnnouncementData(d => ({ ...d, message: e.target.value }))} placeholder="Mensagem do anúncio" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Tipo</Label>
                <Select value={editAnnouncementData.type} onValueChange={(v) => setEditAnnouncementData(d => ({ ...d, type: v }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="promo">Promo</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Prioridade</Label>
                <Select value={editAnnouncementData.priority} onValueChange={(v) => setEditAnnouncementData(d => ({ ...d, priority: v }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Botão de ação</Label>
                <Input value={editAnnouncementData.actionLabel} onChange={(e) => setEditAnnouncementData(d => ({ ...d, actionLabel: e.target.value }))} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">URL do botão</Label>
                <Input value={editAnnouncementData.actionUrl} onChange={(e) => setEditAnnouncementData(d => ({ ...d, actionUrl: e.target.value }))} placeholder="Opcional" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAnnouncementDialogOpen(false)} disabled={savingAnnouncement}>Cancelar</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleSaveAnnouncement} disabled={savingAnnouncement || !editAnnouncementData.title || !editAnnouncementData.message}>
                {savingAnnouncement ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
