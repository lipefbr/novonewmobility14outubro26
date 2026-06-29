'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Users,
  Car,
  Store,
  Bike,
  UserCheck,
  Download,
  FileSpreadsheet,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Wallet,
  Network,
  HandCoins,
  PieChart,
  Activity,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { useStore } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'

// ---------------- Types ----------------
interface UserCounts {
  motorista: number
  passageiro: number
  passageiro_60: number
  passageiro_pcd: number
  comercio: number
  entregador: number
  total: number
}

interface MatrixDistribution {
  entrada: { total: number; byLevel: Record<number, number> }
  residual: { total: number; byLevel: Record<number, number> }
  vendas: { total: number; byLevel: Record<number, number> }
}

interface EarningsByBlock {
  mobility: number
  shopping: number
  food: number
  pharmacy: number
  gratification: number
  withdrawal: number
  paymentInvoice: number
}

interface RecentWithdrawal {
  id: string
  userId: string
  amount: number
  description: string | null
  createdAt: string
}

interface OverviewResponse {
  success: boolean
  userCounts: UserCounts
  seniorsCount: number
  activeUsers: number
  inactiveUsers: number
  planCounts: Record<string, number>
  matrixDistribution: MatrixDistribution
  earningsByBlock: EarningsByBlock
  withdrawals: {
    pending: number
    approved: number
    rejected: number
    totalWithdrawn: number
    recent: RecentWithdrawal[]
  }
  matrixEarnings: {
    entrada: number
    residual: number
    vendas: number
  }
  recentSignups: number
  totalTransactions: number
  totalInCirculation: number
  generatedAt: string
}

// ---------------- Component ----------------
export function AdminReportsPanel() {
  const user = useStore((s) => s.user)
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<OverviewResponse>(
        `/admin/reports/overview?userId=${user?.id}`,
        { timeoutMs: 30_000 }
      )
      if (!res.success) throw new Error('Failed to load reports')
      setData(res)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load reports'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch(
        `/api/admin/reports/export?userId=${user?.id}`,
        { method: 'GET' }
      )
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = res.headers.get('Content-Disposition') || ''
      const match = disposition.match(/filename="?([^"]+)"?/i)
      a.download = match ? match[1] : `newmobility-relatorio-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Relatório Excel exportado com sucesso!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao exportar'
      toast.error(msg)
    } finally {
      setExporting(false)
    }
  }

  const handleWithdrawalAction = async (
    withdrawalId: string,
    action: 'approve' | 'reject'
  ) => {
    setProcessingId(withdrawalId)
    try {
      await apiFetch(`/admin/withdrawals/${withdrawalId}`, {
        method: 'PUT',
        body: JSON.stringify({ userId: user?.id, action }),
      })
      toast.success(action === 'approve' ? 'Saque aprovado!' : 'Saque rejeitado!')
      // Refresh overview data so the pending count/table updates
      void fetchData()
    } catch {
      toast.error('Erro ao processar saque')
    } finally {
      setProcessingId(null)
    }
  }

  // ---------------- Loading state ----------------
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-72" />
              </div>
            </div>
            <Skeleton className="h-9 w-36" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-7 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // ---------------- Error state ----------------
  if (error || !data) {
    return (
      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
        <CardContent className="p-6 flex flex-col items-center text-center gap-3">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              Erro ao carregar relatórios
            </p>
            <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
              {error || 'Tente novamente em instantes'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchData()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  const planTotal =
    data.planCounts.free +
    data.planCounts.blue3 +
    data.planCounts.blue5 +
    data.planCounts.premium5
  const activePct = data.userCounts.total
    ? Math.round((data.activeUsers / data.userCounts.total) * 100)
    : 0

  const blockLabels: { key: keyof EarningsByBlock; label: string }[] = [
    { key: 'mobility', label: 'Mobilidade' },
    { key: 'shopping', label: 'Compras' },
    { key: 'food', label: 'Refeição' },
    { key: 'pharmacy', label: 'Farmácia' },
    { key: 'gratification', label: 'Gratificação' },
    { key: 'paymentInvoice', label: 'Pagamento Fatura' },
  ]

  const matrixRows: {
    key: keyof MatrixDistribution
    label: string
    color: string
  }[] = [
    { key: 'entrada', label: 'Entrada (4x5)', color: 'text-blue-600' },
    { key: 'residual', label: 'Residual (4x7)', color: 'text-emerald-600' },
    { key: 'vendas', label: 'Vendas (4x9)', color: 'text-amber-600' },
  ]

  return (
    <div className="space-y-4">
      {/* Header with export button */}
      <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <FileSpreadsheet className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                Relatórios Admin — Visão Plataforma
              </h3>
              <p className="text-xs text-muted-foreground">
                Métricas consolidadas de toda a plataforma (motoristas, passageiros, comércios,
                entregadores, matrizes e saques). Gerado em{' '}
                {new Date(data.generatedAt).toLocaleString('pt-BR')}.
              </p>
            </div>
          </div>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shrink-0"
          >
            {exporting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? 'Exportando...' : 'Exportar Excel'}
          </Button>
        </CardContent>
      </Card>

      {/* Summary cards — user counts by qualification (§19 items 1-5) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'Total Usuários',
            value: data.userCounts.total,
            icon: Users,
            color: 'text-gray-600',
            bg: 'bg-gray-50 dark:bg-gray-950/30',
          },
          {
            label: 'Motoristas',
            value: data.userCounts.motorista,
            icon: Car,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-950/30',
          },
          {
            label: 'Passageiros',
            value: data.userCounts.passageiro,
            icon: Users,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          },
          {
            label: 'Comércios',
            value: data.userCounts.comercio,
            icon: Store,
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-950/30',
          },
          {
            label: 'Entregadores',
            value: data.userCounts.entregador,
            icon: Bike,
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-950/30',
          },
          {
            label: 'Passageiros 60+',
            value: data.seniorsCount,
            icon: UserCheck,
            color: 'text-rose-600',
            bg: 'bg-rose-50 dark:bg-rose-950/30',
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`${card.bg} border-0 shadow-sm`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {card.label}
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {card.value.toLocaleString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Usuários Ativos
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {data.activeUsers.toLocaleString('pt-BR')}
              <span className="text-xs font-normal text-muted-foreground ml-1">
                / {data.inactiveUsers.toLocaleString('pt-BR')} inativos
              </span>
            </p>
            <Progress value={activePct} className="mt-2 h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1">{activePct}% ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Novos Cadastros (30d)
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {data.recentSignups.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Saldo em Circulação
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(data.totalInCirculation)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Total Transações
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {data.totalTransactions.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Plan distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4 text-emerald-600" /> Distribuição por Plano
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: 'free', label: 'Free', color: 'bg-gray-400' },
              { key: 'blue3', label: 'Blue 3', color: 'bg-blue-500' },
              { key: 'blue5', label: 'Blue 5', color: 'bg-emerald-500' },
              { key: 'premium5', label: 'Premium 5', color: 'bg-amber-500' },
            ].map((p) => {
              const count = data.planCounts[p.key] || 0
              const pct = planTotal ? Math.round((count / planTotal) * 100) : 0
              return (
                <div key={p.key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${p.color}`} />
                      <span className="font-medium">{p.label}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {count.toLocaleString('pt-BR')} ({pct}%)
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Active vs Inactive */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-600" /> Status de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3">
                <p className="text-xs text-muted-foreground">Ativos</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  {data.activeUsers.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3">
                <p className="text-xs text-muted-foreground">Inativos</p>
                <p className="text-xl font-bold text-red-700 dark:text-red-300">
                  {data.inactiveUsers.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Taxa de ativação
              </div>
              <Progress value={activePct} className="h-2" />
              <p className="text-[10px] text-muted-foreground mt-1">
                {activePct}% dos usuários cadastrados estão ativos
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Matrix distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Network className="h-4 w-4 text-blue-600" /> Distribuição nas Matrizes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Matriz</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                  <TableHead className="text-xs">Distribuição por nível</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrixRows.map((m) => {
                  const dist = data.matrixDistribution[m.key]
                  const sortedLevels = Object.keys(dist.byLevel)
                    .map((l) => parseInt(l))
                    .sort((a, b) => a - b)
                  return (
                    <TableRow key={m.key}>
                      <TableCell className={`text-xs font-medium ${m.color}`}>
                        {m.label}
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold">
                        {dist.total.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-xs">
                        {sortedLevels.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {sortedLevels.map((lvl) => (
                              <Badge
                                key={lvl}
                                variant="outline"
                                className="text-[10px] px-1.5 py-0"
                              >
                                L{lvl}: {dist.byLevel[lvl]}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Earnings by app block (§19 item 6) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <HandCoins className="h-4 w-4 text-amber-600" /> Ganhos por Bloco de App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {blockLabels.map((b) => (
              <div
                key={b.key}
                className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0"
              >
                <span className="font-medium text-foreground">{b.label}</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(data.earningsByBlock[b.key])}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Matrix earnings (§19 items 7-8) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Network className="h-4 w-4 text-purple-600" /> Ganhos por Matriz
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { key: 'entrada' as const, label: 'Entrada', color: 'text-blue-600' },
              { key: 'residual' as const, label: 'Residual', color: 'text-emerald-600' },
              { key: 'vendas' as const, label: 'Vendas', color: 'text-amber-600' },
            ].map((m) => (
              <div
                key={m.key}
                className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0"
              >
                <span className={`font-medium ${m.color}`}>{m.label}</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(data.matrixEarnings[m.key])}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Withdrawal summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4 text-rose-600" /> Resumo de Saques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Pendentes</p>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                  {data.withdrawals.pending}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Aprovados</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {data.withdrawals.approved}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Rejeitados</p>
                <p className="text-lg font-bold text-red-700 dark:text-red-300">
                  {data.withdrawals.rejected}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <span className="text-xs font-medium text-muted-foreground">
                Total já sacado
              </span>
              <span className="text-sm font-mono font-bold text-foreground">
                {formatCurrency(data.withdrawals.totalWithdrawn)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending withdrawals quick-action table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" /> Saques Pendentes — Ação Rápida
            {data.withdrawals.recent.length > 0 && (
              <Badge variant="outline" className="text-xs ml-1">
                {data.withdrawals.recent.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.withdrawals.recent.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Nenhum saque pendente no momento.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Usuário</TableHead>
                  <TableHead className="text-xs">Descrição</TableHead>
                  <TableHead className="text-xs text-right">Valor</TableHead>
                  <TableHead className="text-xs">Solicitado em</TableHead>
                  <TableHead className="text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.withdrawals.recent.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="text-xs font-mono">
                      {w.userId.slice(0, 12)}…
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {w.description || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono">
                      {formatCurrency(Math.abs(w.amount))}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(w.createdAt).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                          disabled={processingId === w.id}
                          onClick={() => void handleWithdrawalAction(w.id, 'approve')}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs gap-1 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/40"
                          disabled={processingId === w.id}
                          onClick={() => void handleWithdrawalAction(w.id, 'reject')}
                        >
                          Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
