import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Brazilian currency (R$ X.XXX,XX)
 * @param valueInCents - Value in cents (e.g., 3258000 = R$ 32.580,00)
 */
export function formatCurrency(valueInCents: number): string {
  const value = valueInCents / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Format a number with Brazilian locale (1.234.567)
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

/**
 * Format a date in Brazilian format (DD/MM/YYYY)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

/**
 * Format a date with time in Brazilian format (DD/MM/YYYY HH:mm)
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Calculate time since a date in Portuguese
 */
export function timeSince(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  
  const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25))
  const months = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44))
  const days = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24))
  
  const parts: string[] = []
  if (years > 0) parts.push(`${years} ano${years > 1 ? 's' : ''}`)
  if (months > 0) parts.push(`${months} ${months > 1 ? 'meses' : 'mês'}`)
  if (days > 0) parts.push(`${days} dia${days > 1 ? 's' : ''}`)
  
  return parts.join(', ') || '0 dias'
}

/**
 * Get plan name in Portuguese
 */
export function getPlanName(plan: string): string {
  const plans: Record<string, string> = {
    free: 'Gratuito',
    blue3: 'Blue 3',
    blue5: 'Blue 5 Premium',
  }
  return plans[plan] || plan
}

/**
 * Get plan price in Brazilian format
 */
export function getPlanPrice(plan: string): string {
  const prices: Record<string, string> = {
    free: 'Grátis',
    blue3: 'R$ 200,00',
    blue5: 'R$ 999,00',
  }
  return prices[plan] || '-'
}

/**
 * Get status badge variant
 */
export function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    paid: 'default',
    approved: 'default',
    resolved: 'default',
    inactive: 'secondary',
    pending: 'outline',
    open: 'outline',
    in_progress: 'secondary',
    overdue: 'destructive',
    rejected: 'destructive',
    closed: 'secondary',
    cancelled: 'destructive',
  }
  return variants[status] || 'outline'
}

/**
 * Get status label in Portuguese
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    pending: 'Pendente',
    paid: 'Pago',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    open: 'Aberto',
    in_progress: 'Em Andamento',
    resolved: 'Resolvido',
    closed: 'Fechado',
    overdue: 'Vencido',
    cancelled: 'Cancelado',
  }
  return labels[status] || status
}
