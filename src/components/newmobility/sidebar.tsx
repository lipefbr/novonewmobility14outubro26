'use client'

import {
  Home,
  Smartphone,
  Building2,
  User,
  CreditCard,
  ShoppingCart,
  Store,
  Gamepad2,
  Trophy,
  Gift,
  Star,
  TrendingUp,
  Users,
  DollarSign,
  Wallet,
  Ticket,
  Headphones,
  LogOut,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react'
import { useStore, type PageKey } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface MenuItem {
  key: PageKey
  label: string
  icon: React.ElementType
}

const menuItems: MenuItem[] = [
  { key: 'dashboard', label: 'Início Dashboard', icon: Home },
  { key: 'apps', label: 'Acesso aos Apps', icon: Smartphone },
  { key: 'bank', label: 'Acesso ao Banco', icon: Building2 },
  { key: 'profile', label: 'Dados Pessoais', icon: User },
  { key: 'myplan', label: 'Meu Plano', icon: CreditCard },
  { key: 'purchases', label: 'Relatório de Compras', icon: ShoppingCart },
  { key: 'portal-lojista', label: 'Portal do Lojista', icon: Store },
  { key: 'portal-gamer', label: 'Portal Gamer', icon: Gamepad2 },
  { key: 'portal-sportbet', label: 'Portal Sport Bet', icon: Trophy },
  { key: 'gratifications', label: 'Gratificações', icon: Gift },
  { key: 'points', label: 'Pontuações', icon: Star },
  { key: 'career', label: 'Plano de Carreira', icon: TrendingUp },
  { key: 'referrals', label: 'Meus Indicados', icon: Users },
  { key: 'cashback', label: 'CashBack', icon: DollarSign },
  { key: 'financial', label: 'Financeiro', icon: Wallet },
  { key: 'voucher', label: 'Voucher', icon: Ticket },
  { key: 'support', label: 'Suporte', icon: Headphones },
]

export function Sidebar() {
  const { activePage, setActivePage, logout, sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, user } = useStore()

  const handleItemClick = (key: PageKey) => {
    setActivePage(key)
    setMobileSidebarOpen(false)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500 text-white font-bold text-lg shrink-0">
          NM
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-white font-bold text-base truncate">NewMobility</span>
            <span className="text-emerald-400 text-xs truncate">BackOffice</span>
          </div>
        )}
        {/* Desktop collapse button */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex ml-auto text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
        </Button>
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden ml-auto text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* User info */}
      {!sidebarCollapsed && user && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-emerald-500">
              <AvatarFallback className="bg-emerald-700 text-white text-sm">
                {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-white text-sm font-medium truncate">{user.name}</span>
              <span className="text-emerald-400 text-xs truncate">{user.referralCode}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scrollbar px-2 py-2">
        <div className="space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.key
            return (
              <button
                key={item.key}
                onClick={() => handleItemClick(item.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                    : "text-white/70 hover:text-white hover:bg-white/8"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5 shrink-0", isActive ? "text-white" : "text-emerald-400")} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="px-2 pb-3 pt-2 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {!sidebarCollapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-gray-950 border-r border-white/10 transition-all duration-300 shrink-0",
          sidebarCollapsed ? "w-[68px]" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 w-72 bg-gray-950 z-50 transition-transform duration-300 lg:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
