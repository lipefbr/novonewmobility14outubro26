'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { formatDate, formatCurrency, getStatusLabel, getStatusVariant } from '@/lib/utils'
import { invoicesApi } from '@/lib/api'
import {
  FileText, Download, Eye, Calendar, DollarSign, Receipt, Filter, Loader2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

type Invoice = {
  id: string
  amount: number
  type?: string
  status: string
  dueDate?: string
  paidAt?: string | null
  createdAt?: string
  description?: string
}

export function InvoiceViewer() {
  const { user } = useStore()
  const { t } = useTranslation()
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch real invoices for the logged-in user (Task 11-G — replaces mockInvoices)
  const refreshInvoices = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await invoicesApi.getList(user.id)
      setInvoices(data.invoices || [])
    } catch (err) {
      console.error('Failed to load invoices', err)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    refreshInvoices()
  }, [refreshInvoices])

  const filtered = invoices.filter((inv) =>
    filterStatus === 'all' ? true : inv.status === filterStatus
  )

  const handleDownload = (invoiceId: string) => {
    const url = `/api/invoices/${invoiceId}/pdf?userId=${user?.id || ''}`
    window.open(url, '_blank')
    toast.success(t('invoice.downloadStarted'))
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-2">
          {['all', 'paid', 'pending'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-emerald-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {status === 'all' ? t('general.all') : getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      <Card className="shadow-sm bg-card">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-6 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-10 w-10 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 rounded bg-muted" />
                      <div className="h-2 w-1/4 rounded bg-muted/70" />
                    </div>
                    <div className="h-4 w-20 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <Receipt className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('invoice.noInvoices')}</p>
              </div>
            ) : (
              filtered.map((invoice, i) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {invoice.description || invoice.type || 'Fatura'}
                      </span>
                      <Badge variant={getStatusVariant(invoice.status)} className="text-[10px] shrink-0">
                        {getStatusLabel(invoice.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      {invoice.createdAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(invoice.createdAt)}
                        </span>
                      )}
                      {invoice.dueDate && (
                        <>
                          <span>·</span>
                          <span>{t('invoice.due')}: {formatDate(invoice.dueDate)}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className="font-mono text-[10px]">#{String(invoice.id).toUpperCase().slice(0, 12)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{formatCurrency(Math.abs(Number(invoice.amount) || 0))}</p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                        onClick={() => handleDownload(invoice.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              {t('invoice.detail')} #{selectedInvoice ? String(selectedInvoice.id).toUpperCase().slice(0, 12) : ''}
            </DialogTitle>
            <DialogDescription className="sr-only">Invoice detail view</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">{t('invoice.amount')}</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(Math.abs(Number(selectedInvoice.amount) || 0))}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t('invoice.dueDate')}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedInvoice.dueDate ? formatDate(selectedInvoice.dueDate) : '—'}
                  </p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <span className="text-xs text-muted-foreground">{t('invoice.description')}</span>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {selectedInvoice.description || selectedInvoice.type || 'Fatura'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t('invoice.status')}:</span>
                <Badge variant={getStatusVariant(selectedInvoice.status)} className="text-xs">
                  {getStatusLabel(selectedInvoice.status)}
                </Badge>
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                onClick={() => handleDownload(selectedInvoice.id)}
              >
                <Download className="h-4 w-4" />
                {t('invoice.downloadPdf')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
