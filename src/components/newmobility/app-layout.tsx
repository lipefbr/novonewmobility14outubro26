'use client'

import { Menu, Globe } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Sidebar } from './sidebar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const languages = [
  { code: 'pt', label: 'PT', name: 'Português' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'it', label: 'IT', name: 'Italiano' },
]

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, setMobileSidebarOpen, updateUser } = useStore()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9 text-gray-600"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Brand on mobile */}
              <div className="flex items-center gap-2 lg:hidden">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs">
                  NM
                </div>
                <span className="font-bold text-gray-900">NewMobility</span>
              </div>

              <div className="hidden lg:block">
                <h1 className="text-lg font-semibold text-gray-900">BackOffice</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                  <Avatar className="h-8 w-8 border-2 border-emerald-200">
                    <AvatarFallback className="bg-emerald-600 text-white text-xs">
                      {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[140px] truncate">
                    {user.name}
                  </span>
                </div>
              )}
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-6 page-transition">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 px-4 py-3 text-center shrink-0">
            <p className="text-xs text-gray-500">
              © 2025 @NewMobility. Todos os direitos reservados. Sistema protegido por Lei de Direitos Autorais (Lei nº 9.610/98).
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
