'use client'

import { Menu, Globe, Bell, ChevronRight, Home, Moon, Sun } from 'lucide-react'
import { useStore, type PageKey } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { languageNames, type Language } from '@/lib/i18n'
import { Sidebar } from './sidebar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const languages: { code: Language; label: string; name: string }[] = [
  { code: 'pt', label: 'PT', name: 'Português' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'it', label: 'IT', name: 'Italiano' },
]

const sidebarLabelKeys: Record<PageKey, string> = {
  'dashboard': 'sidebar.dashboard',
  'apps': 'sidebar.apps',
  'bank': 'sidebar.bank',
  'profile': 'sidebar.profile',
  'myplan': 'sidebar.myplan',
  'purchases': 'sidebar.purchases',
  'portal-lojista': 'sidebar.portal-lojista',
  'portal-gamer': 'sidebar.portal-gamer',
  'portal-sportbet': 'sidebar.portal-sportbet',
  'gratifications': 'sidebar.gratifications',
  'points': 'sidebar.points',
  'career': 'sidebar.career',
  'referrals': 'sidebar.referrals',
  'cashback': 'sidebar.cashback',
  'financial': 'sidebar.financial',
  'voucher': 'sidebar.voucher',
  'support': 'sidebar.support',
}

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, setMobileSidebarOpen, updateUser, activePage, darkMode, toggleDarkMode } = useStore()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-card border-b border-border shrink-0">
            {/* Top gradient line */}
            <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
            <div className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile menu toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-9 w-9 text-muted-foreground"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>

                {/* Brand on mobile */}
                <div className="flex items-center gap-2 lg:hidden">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs">
                    NM
                  </div>
                  <span className="font-bold text-foreground">NewMobility</span>
                </div>

                {/* Breadcrumb on desktop */}
                <div className="hidden lg:flex items-center gap-1.5 text-sm">
                  <Home className="h-3.5 w-3.5 text-muted-foreground" />
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-muted-foreground">{t('header.backoffice')}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                  <span className="font-medium text-foreground">{t(sidebarLabelKeys[activePage]) || 'Dashboard'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Notification Bell */}
                <Button variant="ghost" size="icon" className="h-9 w-9 relative text-muted-foreground hover:text-foreground">
                  <Bell className="h-4.5 w-4.5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card" />
                </Button>

                {/* Dark Mode Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  onClick={toggleDarkMode}
                >
                  {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                </Button>

                {/* Language Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                      <Globe className="h-3.5 w-3.5" />
                      <span className="uppercase font-semibold">{user?.language || 'pt'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {languages.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        onClick={() => updateUser({ language: lang.code })}
                        className="gap-2"
                      >
                        <span className="font-semibold text-xs uppercase w-6">{lang.label}</span>
                        <span>{lang.name}</span>
                        {user?.language === lang.code && (
                          <span className="ml-auto text-emerald-600 text-xs">✓</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Avatar */}
                {user && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border-2 border-emerald-200 dark:border-emerald-800">
                      <AvatarFallback className="bg-emerald-600 text-white text-xs">
                        {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium text-foreground max-w-[140px] truncate">
                      {user.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-6 page-transition">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-card border-t border-border px-4 py-3 shrink-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground text-center">
                {t('footer.copyright')}
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-xs text-muted-foreground/70 hover:text-emerald-600 transition-colors">{t('footer.terms')}</a>
                <a href="#" className="text-xs text-muted-foreground/70 hover:text-emerald-600 transition-colors">{t('footer.privacy')}</a>
                <span className="text-xs text-muted-foreground/50">v1.0.0</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
