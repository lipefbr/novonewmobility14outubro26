'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import { Megaphone, X, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Announcement {
  id: string
  type: 'info' | 'promo' | 'maintenance' | 'feature'
  title: string
  description: string
  actionLabel?: string
  actionUrl?: string
  bgColor: string
  textColor: string
  iconBg: string
}

const announcements: Announcement[] = [
  {
    id: 'promo-cashback-fev',
    type: 'promo',
    title: '🔥 CashBack em Dobro!',
    description: 'Em fevereiro, todos os CashBacks de Entrada são dobrados. Aproveite!',
    actionLabel: 'Saber mais',
    bgColor: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    textColor: 'text-white',
    iconBg: 'bg-white/20',
  },
  {
    id: 'new-feature-2fa',
    type: 'feature',
    title: '🛡️ Autenticação em 2 Fatores',
    description: 'Agora você pode ativar 2FA na sua conta para mais segurança.',
    actionLabel: 'Configurar',
    bgColor: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    textColor: 'text-white',
    iconBg: 'bg-white/20',
  },
  {
    id: 'maintenance-scheduled',
    type: 'maintenance',
    title: '⚠️ Manutenção Programada',
    description: 'Dia 15/02 das 02h às 06h o sistema passará por manutenção.',
    bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
    textColor: 'text-white',
    iconBg: 'bg-white/20',
  },
]

const STORAGE_KEY = 'newmobility-dismissed-announcements'

export function AnnouncementBanner() {
  const { t } = useTranslation()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Using a callback in useState initializer would be better but
    // localStorage is not available during SSR, so we need this pattern
    const mountState = () => {
      setIsMounted(true)
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          setDismissedIds(JSON.parse(stored))
        }
      } catch {
        // ignore
      }
    }
    mountState()
  }, [])

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id))

  const current = visibleAnnouncements[currentIdx]

  const handleDismiss = () => {
    if (!current) return
    const newDismissed = [...dismissedIds, current.id]
    setDismissedIds(newDismissed)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDismissed))
    } catch {
      // ignore
    }
    setCurrentIdx(0)
  }

  const handleNext = () => {
    if (currentIdx < visibleAnnouncements.length - 1) {
      setCurrentIdx(prev => prev + 1)
    }
  }

  if (!isMounted || !current) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={current.id}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className={`${current.bgColor} ${current.textColor} relative`}>
          <div className="px-4 py-2.5 flex items-center gap-3 max-w-full">
            <div className={`p-1.5 rounded-lg ${current.iconBg} shrink-0`}>
              <Megaphone className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="text-sm font-semibold truncate">{current.title}</span>
              <span className="text-xs opacity-80 hidden sm:inline truncate">{current.description}</span>
            </div>
            {current.actionLabel && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2 text-white/90 hover:text-white hover:bg-white/15 shrink-0 gap-1"
              >
                {current.actionLabel}
                <ChevronRight className="h-3 w-3" />
              </Button>
            )}
            {visibleAnnouncements.length > 1 && (
              <button
                onClick={handleNext}
                className="text-white/60 hover:text-white shrink-0 text-[10px] font-medium"
              >
                {currentIdx + 1}/{visibleAnnouncements.length}
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="text-white/60 hover:text-white shrink-0 ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
