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

interface AppState {
  // Auth
  isAuthenticated: boolean
  authView: AuthView
  user: UserData | null

  // Navigation
  activePage: PageKey
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean

  // Actions
  login: (user: UserData) => void
  logout: () => void
  setAuthView: (view: AuthView) => void
  setActivePage: (page: PageKey) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setMobileSidebarOpen: (open: boolean) => void
  updateUser: (data: Partial<UserData>) => void
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
    (set) => ({
      // Auth
      isAuthenticated: false,
      authView: 'login',
      user: null,

      // Navigation
      activePage: 'dashboard',
      sidebarCollapsed: false,
      mobileSidebarOpen: false,

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
    }),
    {
      name: 'newmobility-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        activePage: state.activePage,
        language: state.user?.language,
      }),
    }
  )
)

export { mockUser }
