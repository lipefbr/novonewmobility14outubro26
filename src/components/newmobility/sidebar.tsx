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
  Circle,
  Bell,
} from 'lucide-react'
import { useStore, type PageKey } from '@/lib/store'
import { cn, getPlanName } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import { SidebarSearch } from './search/search-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'

interface MenuItem {
  key: PageKey
  labelKey: string
  icon: React.ElementType
  groupKey: string
  isNew?: boolean
}

const menuItems: MenuItem[] = [
  { key: 'dashboard', labelKey: 'sidebar.dashboard', icon: Home, groupKey: 'sidebar.group.main' },
  { key: 'apps', labelKey: 'sidebar.apps', icon: Smartphone, groupKey: 'sidebar.group.main' },
  { key: 'bank', labelKey: 'sidebar.bank', icon: Building2, groupKey: 'sidebar.group.main' },
  { key: 'profile', labelKey: 'sidebar.profile', icon: User, groupKey: 'sidebar.group.main' },
  { key: 'myplan', labelKey: 'sidebar.myplan', icon: CreditCard, groupKey: 'sidebar.group.main' },
  { key: 'purchases', labelKey: 'sidebar.purchases', icon: ShoppingCart, groupKey: 'sidebar.group.main' },
  { key: 'portal-lojista', labelKey: 'sidebar.portal-lojista', icon: Store, groupKey: 'sidebar.group.portals' },
  { key: 'portal-gamer', labelKey: 'sidebar.portal-gamer', icon: Gamepad2, groupKey: 'sidebar.group.portals' },
  { key: 'portal-sportbet', labelKey: 'sidebar.portal-sportbet', icon: Trophy, groupKey: 'sidebar.group.portals' },
  { key: 'gratifications', labelKey: 'sidebar.gratifications', icon: Gift, groupKey: 'sidebar.group.financial' },
  { key: 'points', labelKey: 'sidebar.points', icon: Star, groupKey: 'sidebar.group.financial' },
  { key: 'career', labelKey: 'sidebar.career', icon: TrendingUp, groupKey: 'sidebar.group.financial' },
  { key: 'referrals', labelKey: 'sidebar.referrals', icon: Users, groupKey: 'sidebar.group.financial' },
  { key: 'cashback', labelKey: 'sidebar.cashback', icon: DollarSign, groupKey: 'sidebar.group.financial' },
  { key: 'financial', labelKey: 'sidebar.financial', icon: Wallet, groupKey: 'sidebar.group.financial' },
  { key: 'voucher', labelKey: 'sidebar.voucher', icon: Ticket, groupKey: 'sidebar.group.financial' },
  { key: 'support', labelKey: 'sidebar.support', icon: Headphones, groupKey: 'sidebar.group.support', isNew: true },
]

export function Sidebar() {
  const { activePage, setActivePage, logout, sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, user } = useStore()
  const { t } = useTranslation()

  const handleItemClick = (key: PageKey) => {
    setActivePage(key)
    setMobileSidebarOpen(false)
  }

  // Group menu items
  const groupedItems: { groupKey: string; items: MenuItem[] }[] = []
  let currentGroup = ''
  for (const item of menuItems) {
    if (item.groupKey !== currentGroup) {
      currentGroup = item.groupKey
      groupedItems.push({ groupKey: currentGroup, items: [item] })
    } else {
      groupedItems[groupedItems.length - 1].items.push(item)
    }
  }

  const sidebarContent = (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full bg-gradient-to-b from-gray-950 to-gray-900">
        {/* Logo area */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-bold text-lg shrink-0 shadow-lg shadow-emerald-500/25 animate-glow">
            NM
          </div>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col min-w-0"
            >
              <span className="text-white font-bold text-base truncate">NewMobility</span>
              <span className="text-emerald-400 text-xs truncate">{t('header.backoffice')}</span>
            </motion.div>
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

        {/* User info with glow effect */}
        {!sidebarCollapsed && user && (
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
              <div className="relative">
                <Avatar className="h-9 w-9 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20">
                  <AvatarFallback className="bg-emerald-700 text-white text-sm">
                    {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator with glow */}
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-gray-950 animate-pulse-glow" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-white text-sm font-medium truncate">{user.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-xs truncate">{user.referralCode}</span>
                  <Badge variant="secondary" className="h-4 px-1.5 text-[9px] bg-emerald-600/30 text-emerald-300 border-0 shrink-0">
                    {getPlanName(user.plan)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {sidebarCollapsed && user && (
          <div className="px-2 py-3 border-b border-white/10 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-9 w-9 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20">
                    <AvatarFallback className="bg-emerald-700 text-white text-sm">
                      {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-gray-950" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                <p className="font-medium">{user.name}</p>
                <p className="text-muted-foreground">{getPlanName(user.plan)}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Search input - only show when not collapsed */}
        {!sidebarCollapsed && <SidebarSearch />}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto sidebar-scrollbar px-2 py-2">
          <div className="space-y-1">
            {groupedItems.map((group, gi) => (
              <div key={group.groupKey}>
                {/* Group label */}
                {!sidebarCollapsed && (
                  <div className="px-3 pt-3 pb-1 first:pt-0">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                      {t(group.groupKey)}
                    </span>
                  </div>
                )}
                {sidebarCollapsed && gi > 0 && (
                  <div className="mx-3 my-2 border-t border-white/5" />
                )}
                {/* Group items */}
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activePage === item.key
                  
                  const menuItem = (
                    <motion.button
                      key={item.key}
                      onClick={() => handleItemClick(item.key)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative group/item",
                        isActive
                          ? "text-white shadow-lg relative overflow-hidden"
                          : "text-white/60 hover:text-white hover:bg-white/8"
                      )}
                      whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Active background with animated gradient */}
                      {isActive && (
                        <motion.div
                          layoutId="activeBg"
                          className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg"
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                      {/* Active shimmer effect */}
                      {isActive && (
                        <div className="absolute inset-0 animate-shimmer rounded-lg" />
                      )}
                      {/* Active indicator bar */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-300 rounded-r-full z-10"
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                      <Icon className={cn(
                        "h-4.5 w-4.5 shrink-0 transition-colors relative z-10",
                        isActive ? "text-white" : "text-emerald-400 group-hover/item:text-emerald-300"
                      )} />
                      {!sidebarCollapsed && (
                        <span className="truncate relative z-10">{t(item.labelKey)}</span>
                      )}
                      {/* New badge */}
                      {item.isNew && !sidebarCollapsed && (
                        <Badge className="bg-rose-500 text-white text-[8px] px-1.5 py-0 h-4 border-0 ml-auto relative z-10 animate-bounce-subtle">
                          NOVO
                        </Badge>
                      )}
                      {item.isNew && sidebarCollapsed && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full z-10" />
                      )}
                    </motion.button>
                  )

                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.key}>
                        <TooltipTrigger asChild>
                          {menuItem}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs flex items-center gap-2">
                          <span>{t(item.labelKey)}</span>
                          {item.isNew && (
                            <Badge className="bg-rose-500 text-white text-[8px] px-1 py-0 h-3.5 border-0">
                              NOVO
                            </Badge>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return menuItem
                })}
              </div>
            ))}
          </div>
        </nav>

        {/* Version & Logout */}
        <div className="px-2 pb-3 pt-2 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {!sidebarCollapsed && <span>{t('sidebar.logout')}</span>}
          </button>
          {!sidebarCollapsed && (
            <p className="text-[10px] text-gray-600 text-center mt-2">v1.0.0</p>
          )}
        </div>
      </div>
    </TooltipProvider>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-white/10 shrink-0 relative",
          sidebarCollapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Glow effect on right border */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/40 via-emerald-500/10 to-emerald-500/40" />
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.aside
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 bottom-0 w-72 z-50 lg:hidden"
          >
            <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/40 via-emerald-500/10 to-emerald-500/40" />
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
