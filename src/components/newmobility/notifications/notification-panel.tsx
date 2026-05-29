'use client'

import { useStore, type Notification } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCheck, DollarSign, Users, TrendingUp, Gift, Ticket, Info, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { NotificationSettings } from './notification-settings'

const iconMap: Record<Notification['type'], React.ElementType> = {
  cashback: DollarSign,
  referral: Users,
  career: TrendingUp,
  voucher: Ticket,
  system: Info,
  gratification: Sparkles,
}

const colorMap: Record<Notification['type'], string> = {
  cashback: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  referral: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  career: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  voucher: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  system: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  gratification: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Agora'
  if (diffMin < 60) return `${diffMin}min`
  if (diffHr < 24) return `${diffHr}h`
  if (diffDay < 7) return `${diffDay}d`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function NotificationPanel() {
  const { notifications, markAsRead, markAllAsRead } = useStore()
  const unread = notifications.filter(n => !n.read)
  const latest = notifications.slice(0, 10)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative text-muted-foreground hover:text-foreground">
          <Bell className="h-4.5 w-4.5" />
          {unread.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-card"
            >
              {unread.length > 9 ? '9+' : unread.length}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
            {unread.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {unread.length} nova{unread.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {unread.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <ScrollArea className="max-h-80">
          <AnimatePresence initial={false}>
            {latest.map((notif) => {
              const Icon = iconMap[notif.type] || Info
              return (
                <motion.button
                  key={notif.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => markAsRead(notif.id)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 text-left transition-colors hover:bg-muted/50 border-b border-border last:border-b-0',
                    !notif.read && 'bg-emerald-50/50 dark:bg-emerald-950/20'
                  )}
                >
                  <div className={cn('p-1.5 rounded-lg shrink-0 mt-0.5', colorMap[notif.type])}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-xs leading-tight', !notif.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80')}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {notif.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatTimeAgo(notif.time)}
                    </p>
                  </div>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </ScrollArea>

        {/* Footer */}
        {latest.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Nenhuma notificação</p>
          </div>
        ) : (
          <div className="border-t border-border px-3 py-2 flex items-center justify-between">
            <NotificationSettings />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Ver todas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
