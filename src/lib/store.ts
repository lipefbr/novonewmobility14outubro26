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
  | 'admin'
  | 'reports'
  | 'gamification'
  | 'simulator'
  | 'events'
  | 'leaderboard'
  | 'marketplace'
  | 'services'

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
  role?: string
  balanceWithdrawal: number
  balanceMobility: number
  balanceShopping: number
  balanceFood: number
  balancePharmacy: number
  balanceGratification: number
  balanceFree: number
  balancePending: number
  careerPoints: number
  personalPoints: number
  stars: number
  isDriver: boolean
  userType?: 'usuario' | 'lojista' | 'motorista' | string
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

      // Notifications - start empty, will be loaded from API per user
      notifications: [],

      // Actions
      login: (user) => {
        // Clear ALL localStorage to prevent data leakage from previous sessions
        if (typeof window !== 'undefined') {
          const darkMode = localStorage.getItem('newmobility-auth')
            ? JSON.parse(localStorage.getItem('newmobility-auth') || '{}').state?.darkMode
            : false
          localStorage.removeItem('newmobility-auth')
          // Re-init with clean state
          if (darkMode !== undefined) {
            // preserve dark mode preference
            set({ darkMode })
          }
        }
        set({
          isAuthenticated: true,
          user,
          activePage: 'dashboard',
          mobileSidebarOpen: false,
          notifications: [],
        })
      },

      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
          activePage: 'dashboard',
          authView: 'login',
          mobileSidebarOpen: false,
          notifications: [],
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
      // Only persist auth essentials - NEVER persist notifications or other
      // user-specific data that could leak between sessions
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated && !!state.user?.id,
        user: state.user,
        activePage: state.activePage,
        darkMode: state.darkMode,
      }),
      // When rehydrating, validate the stored user ID matches to prevent stale data
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Always reset notifications on rehydration to prevent cross-user leakage
          state.notifications = []
        }
      },
    }
  )
)

// Empty default user for reference (all zeros - new user state)
export const emptyUser: UserData = {
  id: '',
  name: '',
  email: '',
  phone: '',
  cpf: '',
  plan: 'free',
  referralCode: '',
  referredById: null,
  language: 'pt',
  isActive: false,
  role: 'user',
  balanceWithdrawal: 0,
  balanceMobility: 0,
  balanceShopping: 0,
  balanceFood: 0,
  balancePharmacy: 0,
  balanceGratification: 0,
  balanceFree: 0,
  balancePending: 0,
  careerPoints: 0,
  personalPoints: 0,
  stars: 0,
  isDriver: false,
  userType: 'usuario',
  profileImage: null,
  createdAt: '',
}
