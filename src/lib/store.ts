'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PageKey =
  | 'dashboard'
  | 'apps'
  | 'bank'
  | 'profile'
  | 'myplan'
  | 'purchases'
  | 'portal-lojista'
  | 'portal-gamer'
  | 'portal-sportbet'
  | 'gratifications'
  | 'points'
  | 'career'
  | 'referrals'
  | 'cashback'
  | 'financial'
  | 'voucher'
  | 'support'

export type AuthView = 'login' | 'register'

export interface UserData {
  id: string
  name: string
  email: string
  phone: string
  cpf: string
  plan: string
  referralCode: string
  referredById: string | null
  language: string
  isActive: boolean
  balanceWithdrawal: number
  balanceMobility: number
  balanceShopping: number
  balanceFood: number
  balancePharmacy: number
  balanceGratification: number
  careerPoints: number
  personalPoints: number
  stars: number
  isDriver: boolean
  profileImage: string | null
  createdAt: string
}

export interface Notification {
  id: string
  type: 'cashback' | 'referral' | 'career' | 'voucher' | 'system' | 'gratification'
  title: string
  description: string
  time: string
  read: boolean
  icon?: string
}

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'cashback',
    title: 'CashBack Recebido!',
    description: 'Você recebeu R$ 45,00 de CashBack Entrada do usuário Maria Silva.',
    time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n2',
    type: 'referral',
    title: 'Novo Indicado',
    description: 'João Santos se cadastrou usando seu código de indicação!',
    time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n3',
    type: 'career',
    title: 'Progresso na Carreira',
    description: 'Faltam apenas 5 pontos para você alcançar o rank Bronze!',
    time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n4',
    type: 'voucher',
    title: 'Voucher Disponível',
    description: 'Seu voucher de R$ 100,00 está pronto para uso no App Mobilidade.',
    time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n5',
    type: 'gratification',
    title: 'Gratificação Liberada',
    description: 'Parabéns! Sua gratificação semanal de R$ 25,00 foi creditada.',
    time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'n6',
    type: 'cashback',
    title: 'CashBack Residual',
    description: 'R$ 12,50 de CashBack Residual creditados na sua conta.',
    time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'n7',
    type: 'system',
    title: 'Atualização do Sistema',
    description: 'Nova versão do app disponível. Atualize para aproveitar as novidades!',
    time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'n8',
    type: 'referral',
    title: 'Indicado Ativou Plano',
    description: 'Pedro Costa ativou o plano Blue 5 Premium na sua rede!',
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'n9',
    type: 'cashback',
    title: 'CashBack Vendas',
    description: 'Você recebeu R$ 8,30 de CashBack de vendas no Shopping.',
    time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'n10',
    type: 'system',
    title: 'Bem-vindo à NewMobility!',
    description: 'Sua conta foi criada com sucesso. Explore todas as funcionalidades.',
    time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
]

interface AppState {
  // Auth
  isAuthenticated: boolean
  authView: AuthView
  user: UserData | null

  // Navigation
  activePage: PageKey
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean

  // Theme
  darkMode: boolean

  // Notifications
  notifications: Notification[]

  // Actions
  login: (user: UserData) => void
  logout: () => void
  setAuthView: (view: AuthView) => void
  setActivePage: (page: PageKey) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setMobileSidebarOpen: (open: boolean) => void
  updateUser: (data: Partial<UserData>) => void
  toggleDarkMode: () => void
  setDarkMode: (dark: boolean) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  unreadCount: () => number
}

const mockUser: UserData = {
  id: 'usr_01abc123',
  name: 'Carlos Eduardo Silva',
  email: 'carlos.silva@email.com',
  phone: '(11) 99876-5432',
  cpf: '123.456.789-00',
  plan: 'blue5',
  referralCode: 'CARLOS2025',
  referredById: null,
  language: 'pt',
  isActive: true,
  balanceWithdrawal: 3258000,
  balanceMobility: 727000,
  balanceShopping: 2727000,
  balanceFood: 687000,
  balancePharmacy: 558000,
  balanceGratification: 845000,
  careerPoints: 42,
  personalPoints: 18,
  stars: 3,
  isDriver: true,
  profileImage: null,
  createdAt: '2023-06-15T10:00:00Z',
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      isAuthenticated: false,
      authView: 'login',
      user: null,

      // Navigation
      activePage: 'dashboard',
      sidebarCollapsed: false,
      mobileSidebarOpen: false,

      // Theme
      darkMode: false,

      // Notifications
      notifications: mockNotifications,

      // Actions
      login: (user) =>
        set({
          isAuthenticated: true,
          user,
          activePage: 'dashboard',
          mobileSidebarOpen: false,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
          activePage: 'dashboard',
          authView: 'login',
          mobileSidebarOpen: false,
        }),

      setAuthView: (authView) => set({ authView }),

      setActivePage: (activePage) =>
        set({ activePage, mobileSidebarOpen: false }),

      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      toggleDarkMode: () =>
        set((state) => {
          const newDarkMode = !state.darkMode
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', newDarkMode)
          }
          return { darkMode: newDarkMode }
        }),

      setDarkMode: (dark) =>
        set(() => {
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', dark)
          }
          return { darkMode: dark }
        }),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
        })),

      unreadCount: () => {
        return get().notifications.filter(n => !n.read).length
      },
    }),
    {
      name: 'newmobility-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        activePage: state.activePage,
        language: state.user?.language,
        darkMode: state.darkMode,
        notifications: state.notifications,
      }),
    }
  )
)

export { mockUser }
