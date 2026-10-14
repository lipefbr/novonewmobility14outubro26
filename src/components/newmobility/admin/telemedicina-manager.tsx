'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, RefreshCw, Star, Sparkles, Gift, HeartPulse,
  Loader2, CheckCircle2, Award, Users,
} from 'lucide-react'

import { useStore } from '@/lib/store'
import { telemedicinaApi } from '@/lib/api'
import { cn, formatCurrency } from '@/lib/utils'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// ---------- Types ----------
interface Plan {
  id: string
  name: string
  dataAmount: string
  priceCents: number
  cashbackCents: number
  rewardPoints: number
  description?: string | null
  features: string[]
  isPopular: boolean
  isRecommended: boolean
  isActive: boolean
  sortOrder: number
}

interface FormState {
  id: string
  name: string
  dataAmount: string
  priceCents: string
  cashbackCents: string
  rewardPoints: string
  description: string
  features: string
  isPopular: boolean
  isRecommended: boolean
  isActive: boolean
  sortOrder: string
}

const EMPTY_FORM: FormState = {
  id: '',
  name: '',
  dataAmount: '',
  priceCents: '0',
  cashbackCents: '0',
  rewardPoints: '0',
  description: '',
  features: '',
  isPopular: false,
  isRecommended: false,
  isActive: true,
  sortOrder: '0',
}

export function TelemedicinaManager() {
  const { user } = useStore()
  const userId = user?.id ?? ''

  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Active toggle
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchPlans = useCallback(
    async (isRefresh = false) => {
      if (!userId) return
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      try {
        const res = await telemedicinaApi.getPlans(userId)
        setPlans(Array.isArray(res.plans) ? res.plans : [])
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Falha ao carregar planos.'
        toast.error(message)
        setPlans([])
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [userId]
  )

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      const sa = Number(a.sortOrder) || 0
      const sb = Number(b.sortOrder) || 0
      if (sa !== sb) return sa - sb
      return a.priceCents - b.priceCents
    })
  }, [plans])

  const stats = useMemo(() => {
    const total = plans.length
    const active = plans.filter((p) => p.isActive).length
    const popular = plans.filter((p) => p.isPopular).length
    const recommended = plans.filter((p) => p.isRecommended).length
    return { total, active, popular, recommended }
  }, [plans])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, sortOrder: String(plans.length + 1) })
    setDialogOpen(true)
  }

  const openEdit = (p: Plan) => {
    setEditing(p)
    setForm({
      id: p.id ?? '',
      name: p.name ?? '',
      dataAmount: p.dataAmount ?? '',
      priceCents: String(p.priceCents ?? 0),
      cashbackCents: String(p.cashbackCents ?? 0),
      rewardPoints: String(p.rewardPoints ?? 0),
      description: p.description ?? '',
      features: Array.isArray(p.features) ? p.features.join('\n') : '',
      isPopular: !!p.isPopular,
      isRecommended: !!p.isRecommended,
      isActive: p.isActive !== false,
      sortOrder: String(p.sortOrder ?? 0),
    })
    setDialogOpen(true)
  }

  const handleToggleActive = async (p: Plan) => {
    if (!userId) return
    setTogglingId(p.id)
    const prev = plans
    setPlans((arr) =>
      arr.map((x) => (x.id === p.id ? { ...x, isActive: !x.isActive } : x))
    )
    try {
      await telemedicinaApi.updatePlan(userId, p.id, { isActive: !p.isActive })
      toast.success(p.isActive ? 'Plano desativado.' : 'Plano ativado.')
    } catch (err: unknown) {
      setPlans(prev)
      const message = err instanceof Error ? err.message : 'Erro ao alterar status.'
      toast.error(message)
    } finally {
      setTogglingId(null)
    }
  }

  const handleSave = async () => {
    if (!userId) return
    if (!form.name.trim()) {
      toast.error('Informe o nome do plano.')
      return
    }
    if (!form.dataAmount.trim()) {
      toast.error('Informe a cobertura do plano (ex.: 1 pessoa, Até 4 dependentes, Ilimitado).')
      return
    }
    const price = Number(form.priceCents)
    if (!Number.isFinite(price) || price < 0) {
      toast.error('Informe um preço válido em centavos.')
      return
    }
    const featuresArr = form.features
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    // Ao editar, não enviamos `id` (a chave primária não muda). Ao criar,
    // só enviamos `id` se o admin preencheu o campo explicitamente — caso
    // contrário a API gera um slug a partir do nome.
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      dataAmount: form.dataAmount.trim(),
      priceCents: Math.floor(price),
      cashbackCents: Math.max(0, Math.floor(Number(form.cashbackCents) || 0)),
      rewardPoints: Math.max(0, Math.floor(Number(form.rewardPoints) || 0)),
      description: form.description.trim() || null,
      features: featuresArr,
      isPopular: form.isPopular,
      isRecommended: form.isRecommended,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
    }
    if (!editing && form.id.trim()) {
      payload.id = form.id.trim()
    }
    setSaving(true)
    try {
      if (editing) {
        await telemedicinaApi.updatePlan(userId, editing.id, payload)
        toast.success('Plano atualizado com sucesso.')
      } else {
        await telemedicinaApi.createPlan(userId, payload)
        toast.success('Plano criado com sucesso.')
      }
      setDialogOpen(false)
      fetchPlans()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar plano.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!userId || !deleteTarget) return
    setDeleting(true)
    try {
      await telemedicinaApi.deletePlan(userId, deleteTarget.id)
      toast.success('Plano removido.')
      setDeleteTarget(null)
      fetchPlans()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao remover plano.'
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="overflow-hidden border-border/60">
        <CardHeader className="bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
                <HeartPulse className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Telemedicina — Planos</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Gerencie os planos de telemedicina oferecidos na página pública.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPlans(true)}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
              <Button size="sm" onClick={openCreate}>
                <Plus className="size-4" />
                Novo Plano
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={<HeartPulse className="size-4" />} />
        <StatCard label="Ativos" value={stats.active} icon={<Sparkles className="size-4" />} accent="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Populares" value={stats.popular} icon={<Star className="size-4" />} accent="text-amber-500" />
        <StatCard label="Recomendados" value={stats.recommended} icon={<Award className="size-4" />} accent="text-rose-600 dark:text-rose-400" />
      </div>

      {/* Plan cards grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : sortedPlans.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title="Nenhum plano cadastrado"
              description="Crie o primeiro plano de Telemedicina para começar."
              onCreate={openCreate}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedPlans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
            >
              <Card
                className={cn(
                  'relative flex h-full flex-col overflow-hidden',
                  plan.isPopular && 'border-emerald-500/50',
                  plan.isRecommended && 'border-amber-500/50',
                  !plan.isActive && 'opacity-60'
                )}
              >
                {(plan.isPopular || plan.isRecommended) && (
                  <div className="absolute right-0 top-0 flex gap-1 p-2">
                    {plan.isPopular && (
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                        <Star className="mr-1 size-3 fill-current" />
                        Popular
                      </Badge>
                    )}
                    {plan.isRecommended && (
                      <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                        <Sparkles className="mr-1 size-3" />
                        Recomendado
                      </Badge>
                    )}
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <HeartPulse className="size-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      {plan.name}
                    </span>
                  </div>
                  <CardTitle className="pt-1 text-2xl font-bold">
                    {plan.dataAmount}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-3">
                  <div>
                    <span className="text-2xl font-semibold">
                      {formatCurrency(plan.priceCents)}
                    </span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">CashBack</p>
                      <p className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                        <Gift className="size-3.5" />
                        {formatCurrency(plan.cashbackCents)}
                      </p>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">Pontos</p>
                      <p className="flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
                        <Award className="size-3.5" />
                        {plan.rewardPoints}
                      </p>
                    </div>
                  </div>

                  {plan.features.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {plan.features.slice(0, 8).map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                      {plan.features.length > 8 && (
                        <li className="text-xs text-muted-foreground">
                          +{plan.features.length - 8} outros benefícios
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem benefícios cadastrados.</p>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={plan.isActive}
                        disabled={togglingId === plan.id}
                        onCheckedChange={() => handleToggleActive(plan)}
                        aria-label={`Alternar status de ${plan.name}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {plan.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(plan)}
                      >
                        <Pencil className="size-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(plan)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Atualize as informações do plano de Telemedicina.'
                : 'Preencha os dados para cadastrar um novo plano de telemedicina.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            {!editing && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="telemed-id">Código (slug)</Label>
                <Input
                  id="telemed-id"
                  value={form.id}
                  onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                  placeholder="Ex.: telemed-familia (gerado automaticamente se vazio)"
                />
                <p className="text-xs text-muted-foreground">
                  Identificador único do plano. Use apenas letras, números e hifens.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="telemed-name">Nome do plano *</Label>
              <Input
                id="telemed-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex.: Plano Família"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telemed-data">Cobertura *</Label>
              <Input
                id="telemed-data"
                value={form.dataAmount}
                onChange={(e) => setForm((f) => ({ ...f, dataAmount: e.target.value }))}
                placeholder="Ex.: 1 pessoa / Até 4 dependentes / Ilimitado"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telemed-price">Preço (em centavos)</Label>
              <Input
                id="telemed-price"
                type="number"
                min={0}
                value={form.priceCents}
                onChange={(e) => setForm((f) => ({ ...f, priceCents: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                R$ 49,90 = <span className="font-mono">4990</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telemed-cashback">Cashback (em centavos)</Label>
              <Input
                id="telemed-cashback"
                type="number"
                min={0}
                value={form.cashbackCents}
                onChange={(e) => setForm((f) => ({ ...f, cashbackCents: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                R$ 0,50 = <span className="font-mono">50</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telemed-points">Pontos de recompensa</Label>
              <Input
                id="telemed-points"
                type="number"
                min={0}
                value={form.rewardPoints}
                onChange={(e) => setForm((f) => ({ ...f, rewardPoints: e.target.value }))}
                placeholder="Ex.: 40"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telemed-sort">Ordem</Label>
              <Input
                id="telemed-sort"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="telemed-description">Descrição</Label>
              <Textarea
                id="telemed-description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Texto curto exibido abaixo do nome do plano (opcional)."
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="telemed-features">Benefícios (um por linha)</Label>
              <Textarea
                id="telemed-features"
                rows={10}
                value={form.features}
                onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                placeholder={
                  'Consultas ilimitadas\nReceitas digitais\nSuporte 24h\nAté 4 dependentes\nSuporte psicológico'
                }
              />
              <p className="text-xs text-muted-foreground">
                Cada linha vira um item na lista de benefícios do plano — sem limite
                de linhas; itens além dos primeiros ficam atrás de um botão
                "+N benefícios" para o membro expandir.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Star className="size-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">Plano popular</p>
                  <p className="text-xs text-muted-foreground">Destaque visual na vitrine.</p>
                </div>
              </div>
              <Switch
                checked={form.isPopular}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isPopular: v }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Award className="size-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">Plano recomendado</p>
                  <p className="text-xs text-muted-foreground">Destaque visual na vitrine.</p>
                </div>
              </div>
              <Switch
                checked={form.isRecommended}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isRecommended: v }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">Plano ativo</p>
                  <p className="text-xs text-muted-foreground">
                    Quando desativado, não aparece na vitrine pública.
                  </p>
                </div>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? 'Salvar alterações' : 'Criar plano'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O plano{' '}
              <strong className="text-foreground">{deleteTarget?.name}</strong> será desativado
              (soft-delete) e não aparecerá mais na vitrine pública de Telemedicina.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------- Sub-components ----------
function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: number
  icon: React.ReactNode
  accent?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={cn('mt-1 text-2xl font-semibold', accent)}>{value}</p>
        </div>
        <div className={cn('rounded-md bg-muted p-2', accent)}>{icon}</div>
      </CardContent>
    </Card>
  )
}

function EmptyState({
  title,
  description,
  onCreate,
}: {
  title: string
  description: string
  onCreate: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Users className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Button size="sm" onClick={onCreate}>
        <Plus className="size-4" />
        Novo Plano
      </Button>
    </div>
  )
}
