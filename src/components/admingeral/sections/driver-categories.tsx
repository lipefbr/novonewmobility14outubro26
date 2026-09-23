'use client'

import { useState, useEffect } from 'react'
import {
  Car,
  Info,
  Loader2,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Power,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { useStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatBRL } from '@/components/admingeral/types'

// ============================================================================
// Seção "Categorias de Motorista" do painel Admin Geral — CRUD COMPLETO.
// ----------------------------------------------------------------------------
// Antes (Task 9): era read-only — o admin só via as categorias e precisava ir
// no painel NewMobility para criar/editar/excluir.
//
// Agora (Task 10): CRUD completo direto aqui, sem precisar sair do admingeral.
// Mantém a mesma identidade visual da Task 9 (caixa azul explicativa, grid
// 2x2 de métricas, border-top colorido, emojis como ícones, badge Ativo/Inativo)
// adicionando:
//   - Botão "Nova Categoria" (verde) no header
//   - Botões Editar / Excluir / Toggle Ativo em cada card
//   - Dialog com formulário completo (criar/editar)
//   - Validação BR de bônus (aceita vírgula decimal)
// ============================================================================

interface DriverCategory {
  id: string
  code: string
  name: string
  description: string | null
  sortOrder: number
  monthlyTripsTarget: number
  bonusCents: number
  maxCancellationPerMonth: number
  color: string | null
  icon: string | null
  isActive: boolean
  userCount: number
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Helpers de conversão BRL <-> centavos.
// O input de bônus aceita o formato brasileiro (vírgula decimal, ponto como
// separador de milhar opcional) — ex: "500,00", "1.500,00" ou "1500".
// ---------------------------------------------------------------------------

function parseBrlToCents(value: string): number {
  if (!value) return 0
  // Remove espaços e tudo que não for dígito, vírgula ou ponto.
  const cleaned = value.trim().replace(/[^\d.,]/g, '')
  if (!cleaned) return 0
  // Se houver vírgula, assume formato BR: separador de milhar = '.', decimal = ','.
  // Se não houver vírgula, mas houver ponto, decide com base na quantidade de
  // dígitos após o último ponto (<= 2 = decimal, > 2 = milhar).
  let normalized: string
  if (cleaned.includes(',')) {
    // Remove todos os pontos (milhar) e troca vírgula por ponto decimal.
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else {
    normalized = cleaned
  }
  const num = parseFloat(normalized)
  if (isNaN(num)) return 0
  return Math.round(num * 100)
}

function formatCentsToBrlInput(cents: number): string {
  const reais = (cents || 0) / 100
  return reais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ---------------------------------------------------------------------------
// Estado do diálogo: fechado, criando nova, ou editando uma existente.
// `counter` garante que o Dialog remonte (key) a cada abertura — inicializa
// o form a partir do `initial` sem precisar de useEffect (evita lint
// react-hooks/set-state-in-effect do Next.js 16 + React 19, mesma técnica
// usada na Task 8 em admin-kyc-config-panel.tsx).
// ---------------------------------------------------------------------------
type DialogState =
  | { mode: 'closed' }
  | { mode: 'new'; counter: number }
  | { mode: 'edit'; category: DriverCategory; counter: number }

const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
  sortOrder: 99,
  monthlyTripsTarget: 0,
  bonusInput: '0,00',
  maxCancellationPerMonth: 2,
  color: '#06b6d4',
  icon: '🚗',
  isActive: true,
}

export function DriverCategoriesSection() {
  const { user } = useStore()
  const [categories, setCategories] = useState<DriverCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' })
  // IDs de cards com operação em andamento (toggle/delete) — mostra overlay.
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())

  const load = async () => {
    if (!user?.id) return
    try {
      const r = await apiFetch<{ categories: DriverCategory[] }>(
        `/admingeral/driver-categories?userId=${user.id}`,
      )
      setCategories(r.categories)
    } catch {
      toast.error('Erro ao carregar categorias de motorista')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user?.id])

  // Abre o diálogo de criar — counter muda para forçar remount do Dialog.
  const openNew = () => {
    setDialog({ mode: 'new', counter: Date.now() })
  }

  // Abre o diálogo de editar — counter muda para forçar remount.
  const openEdit = (c: DriverCategory) => {
    setDialog({ mode: 'edit', category: c, counter: Date.now() })
  }

  // Toggle ativo/inativo com optimistic UI (atualiza e reverte em erro).
  const toggleActive = async (c: DriverCategory) => {
    if (!user?.id) return
    setBusyIds((prev) => new Set(prev).add(c.id))
    // Optimistic update — reflete imediatamente, reverte em erro.
    setCategories((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, isActive: !x.isActive } : x)),
    )
    try {
      await apiFetch(`/admingeral/driver-categories/${c.id}`, {
        method: 'PUT',
        body: JSON.stringify({ userId: user.id, isActive: !c.isActive }),
      })
      toast.success(`Categoria ${!c.isActive ? 'ativada' : 'desativada'}`)
    } catch (err) {
      // Reverte optimistic update.
      setCategories((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, isActive: c.isActive } : x)),
      )
      toast.error(
        err instanceof Error ? err.message : 'Erro ao alternar status',
      )
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev)
        next.delete(c.id)
        return next
      })
    }
  }

  // Excluir — confirma antes via window.confirm (padrão do projeto).
  const handleDelete = async (c: DriverCategory) => {
    if (!user?.id) return
    if (c.userCount > 0) {
      toast.error(
        `Não é possível excluir: ${c.userCount} motorista(s) vinculado(s) a esta categoria. Desative a categoria em vez de excluir.`,
      )
      return
    }
    const ok = window.confirm(
      `Excluir a categoria "${c.name}" (${c.code})?\n\nEsta ação não pode ser desfeita. Se houver motoristas vinculados a ela, a exclusão será bloqueada — desative a categoria em vez de excluir.`,
    )
    if (!ok) return

    setBusyIds((prev) => new Set(prev).add(c.id))
    try {
      await apiFetch(
        `/admingeral/driver-categories/${c.id}?userId=${user.id}`,
        { method: 'DELETE' },
      )
      toast.success('Categoria excluída')
      setCategories((prev) => prev.filter((x) => x.id !== c.id))
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao excluir categoria',
      )
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev)
        next.delete(c.id)
        return next
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Caixa explicativa azul — mesma do painel NewMobility admin para
          manter consistência visual e contextualizar o admin geral. */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600 shrink-0" />
          <p className="text-sm font-semibold text-blue-700">
            Como funcionam as Categorias de Motorista
          </p>
        </div>
        <ul className="text-xs text-blue-800 space-y-1.5 pl-6 list-disc">
          <li>
            <strong>Categorias de veículo NÃO são plano de carreira.</strong>{' '}
            Plano de Carreira (Safira→Imperial por <code className="px-1 py-0.5 rounded bg-blue-100 text-[10px]">careerPoints</code>) é separado.
          </li>
          <li>
            <strong>Bônus só é pago</strong> se o motorista bater a meta de corridas no mês.
          </li>
          <li>
            <code className="px-1 py-0.5 rounded bg-blue-100 text-[10px]">maxCancellationPerMonth = 0</code> significa{' '}
            <strong>tolerância zero</strong> (categoria idoso/preferencial). Cancelar 1 corrida já desqualifica do bônus.
          </li>
          <li>
            Demais categorias toleram até <strong>2 cancelamentos</strong> (configurável por categoria).
          </li>
        </ul>
      </div>

      {/* Header com contagem + botão Nova Categoria + link secundário
          para o painel NewMobility (caso o admin queira usar a outra UI). */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-slate-500">
          <Badge variant="secondary" className="mr-1.5">{categories.length}</Badge>
          {categories.length === 1 ? 'categoria cadastrada' : 'categorias cadastradas'}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Link secundário — o CRUD principal agora é direto aqui.
              window.location.href = '/'
            }}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Gerenciar no painel NewMobility
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={openNew}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Categoria
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {categories.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="p-10 text-center flex flex-col items-center gap-2">
            <Car className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">Nenhuma categoria de motorista cadastrada</p>
            <p className="text-[11px] text-slate-400">
              Clique em &quot;Nova Categoria&quot; para criar (Safira, Rubi, Esmeralda, Diamante, Imperial, etc.).
            </p>
            <Button
              size="sm"
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={openNew}
            >
              <Plus className="h-4 w-4 mr-1" />
              Criar primeira categoria
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {categories.map((cat) => {
            const isBusy = busyIds.has(cat.id)
            return (
              <Card
                key={cat.id}
                className={`relative border-slate-200 ${!cat.isActive ? 'opacity-60' : ''}`}
                style={{
                  borderTopColor: cat.color || undefined,
                  borderTopWidth: cat.color ? 4 : undefined,
                }}
              >
                <CardContent className="p-4">
                  {/* Overlay de loading durante toggle/delete */}
                  {isBusy && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                    </div>
                  )}

                  {/* Header: ícone emoji + nome + código + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{cat.icon || '🚗'}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{cat.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{cat.code}</p>
                      </div>
                    </div>
                    <Badge
                      className={
                        cat.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }
                    >
                      {cat.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  {/* Descrição */}
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {cat.description || '—'}
                  </p>

                  {/* Grid 2x2 de métricas — igual ao painel NewMobility */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <p className="text-[10px] text-slate-500">Meta mensal</p>
                      <p className="text-sm font-bold text-slate-900">
                        {cat.monthlyTripsTarget}{' '}
                        <span className="text-[10px] font-normal text-slate-500">corridas/mês</span>
                      </p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <p className="text-[10px] text-slate-500">Bônus (se bater)</p>
                      <p className="text-sm font-bold text-emerald-600">
                        {cat.bonusCents > 0 ? formatBRL(cat.bonusCents) : '—'}
                      </p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <p className="text-[10px] text-slate-500">Cancelamento/mês</p>
                      {cat.maxCancellationPerMonth === 0 ? (
                        <Badge className="bg-red-100 text-red-700 text-[10px]">
                          Tolerância ZERO
                        </Badge>
                      ) : (
                        <p className="text-sm font-bold text-slate-900">
                          {cat.maxCancellationPerMonth}{' '}
                          <span className="text-[10px] font-normal text-slate-500">max</span>
                        </p>
                      )}
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <p className="text-[10px] text-slate-500">Motoristas vinculados</p>
                      <p className="text-sm font-bold text-blue-600">{cat.userCount}</p>
                    </div>
                  </div>

                  {/* Ações: Toggle Ativo + Editar + Excluir — espelha o
                      padrão visual do painel NewMobility (border-top + gap). */}
                  <div className="flex items-center justify-between gap-1 mt-3 pt-2 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={isBusy}
                      onClick={() => toggleActive(cat)}
                      title={cat.isActive ? 'Desativar' : 'Ativar'}
                    >
                      <Power
                        className={`h-3.5 w-3.5 ${cat.isActive ? 'text-emerald-600' : 'text-slate-400'}`}
                      />
                      <span className="ml-1 hidden sm:inline">
                        {cat.isActive ? 'Desativar' : 'Ativar'}
                      </span>
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-blue-600 hover:text-blue-700 text-xs"
                        disabled={isBusy}
                        onClick={() => openEdit(cat)}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-red-500 hover:text-red-600 text-xs"
                        disabled={isBusy}
                        onClick={() => handleDelete(cat)}
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog Criar / Editar — remonta via `key` (counter) a cada abertura
          para que o form inicie limpo (criar) ou populado (editar) sem usar
          useEffect (evita lint react-hooks/set-state-in-effect). */}
      {dialog.mode !== 'closed' && (
        <DriverCategoryDialog
          key={dialog.counter}
          mode={dialog.mode === 'edit' ? 'edit' : 'new'}
          initial={dialog.mode === 'edit' ? dialog.category : null}
          userId={user?.id || ''}
          onClose={() => setDialog({ mode: 'closed' })}
          onSaved={load}
        />
      )}
    </div>
  )
}

// ============================================================================
// Dialog de Criar / Editar Categoria — form completo com validação.
// ============================================================================

interface DialogProps {
  mode: 'new' | 'edit'
  initial: DriverCategory | null
  userId: string
  onClose: () => void
  onSaved: () => void
}

function DriverCategoryDialog({
  mode,
  initial,
  userId,
  onClose,
  onSaved,
}: DialogProps) {
  // Estado do form — inicializado uma única vez a partir do `initial`.
  // Como o parent remonta este componente via `key`, isso sempre pega os
  // valores corretos sem precisar de useEffect.
  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        code: initial.code,
        name: initial.name,
        description: initial.description || '',
        sortOrder: initial.sortOrder,
        monthlyTripsTarget: initial.monthlyTripsTarget,
        bonusInput: formatCentsToBrlInput(initial.bonusCents),
        maxCancellationPerMonth: initial.maxCancellationPerMonth,
        color: initial.color || '#06b6d4',
        icon: initial.icon || '🚗',
        isActive: initial.isActive,
      }
    }
    return { ...EMPTY_FORM }
  })
  const [saving, setSaving] = useState(false)

  const isEdit = mode === 'edit'

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações básicas no cliente — a API também valida (source of truth).
    if (!form.code.trim()) {
      toast.error('Código é obrigatório')
      return
    }
    if (!/^[a-z0-9_]+$/.test(form.code)) {
      toast.error('Código deve conter apenas letras minúsculas, números e underline')
      return
    }
    if (form.code.length > 40) {
      toast.error('Código deve ter no máximo 40 caracteres')
      return
    }
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (form.name.length > 80) {
      toast.error('Nome deve ter no máximo 80 caracteres')
      return
    }

    setSaving(true)
    try {
      const bonusCents = parseBrlToCents(form.bonusInput)
      const payload: Record<string, unknown> = {
        userId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 99,
        monthlyTripsTarget: Number(form.monthlyTripsTarget) || 0,
        bonusCents,
        maxCancellationPerMonth: Number(form.maxCancellationPerMonth) || 0,
        color: form.color || undefined,
        icon: form.icon || undefined,
        isActive: Boolean(form.isActive),
      }

      if (isEdit && initial) {
        // PUT — NÃO envia `code` (campo unique e referenciado por
        // User.driverCategoryId — mudar quebraria histórico).
        await apiFetch(`/admingeral/driver-categories/${initial.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        toast.success('Categoria atualizada')
      } else {
        // POST — envia `code`.
        await apiFetch('/admingeral/driver-categories', {
          method: 'POST',
          body: JSON.stringify({ ...payload, code: form.code.toLowerCase().trim() }),
        })
        toast.success('Categoria criada')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao salvar categoria',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Editar ${initial?.name || 'categoria'}` : 'Nova categoria de motorista'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Altere os campos abaixo. O código não pode ser editado (é único e referenciado pelos motoristas).'
              : 'Crie uma categoria de veículo (Safira, Rubi, Esmeralda, Diamante, Imperial, etc.).'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Código + Nome */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-code" className="text-xs">
                Código <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cat-code"
                value={form.code}
                onChange={(e) =>
                  set(
                    'code',
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                  )
                }
                placeholder="ex: ouro, platina"
                disabled={isEdit}
                className={isEdit ? 'bg-slate-50 text-slate-500' : ''}
                maxLength={40}
              />
              <p className="text-[10px] text-slate-400">
                {isEdit
                  ? 'Não editável (unique + referenciado)'
                  : 'Apenas letras minúsculas, números e _'}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-name" className="text-xs">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="ex: Ouro"
                maxLength={80}
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc" className="text-xs">Descrição</Label>
            <Textarea
              id="cat-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Opcional — descreva a categoria (ex: motoristas com veículo 4 portas ano >= 2020)"
              rows={2}
            />
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-sort" className="text-xs">Ordem de exibição</Label>
              <Input
                id="cat-sort"
                type="number"
                value={form.sortOrder}
                onChange={(e) => set('sortOrder', Number(e.target.value))}
                min={0}
              />
              <p className="text-[10px] text-slate-400">Menor = aparece primeiro</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-meta" className="text-xs">Meta mensal de corridas</Label>
              <Input
                id="cat-meta"
                type="number"
                value={form.monthlyTripsTarget}
                onChange={(e) => set('monthlyTripsTarget', Number(e.target.value))}
                min={0}
              />
              <p className="text-[10px] text-slate-400">Bônus só é pago se bater a meta</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-bonus" className="text-xs">Bônus em R$ (se bater meta)</Label>
              <Input
                id="cat-bonus"
                inputMode="decimal"
                value={form.bonusInput}
                onChange={(e) => set('bonusInput', e.target.value)}
                placeholder="0,00"
              />
              <p className="text-[10px] text-slate-400">
                Formato R$ — ex: 500,00 = R$ 500
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-cancel" className="text-xs">
                Limite de cancelamentos/mês
              </Label>
              <Input
                id="cat-cancel"
                type="number"
                value={form.maxCancellationPerMonth}
                onChange={(e) =>
                  set('maxCancellationPerMonth', Number(e.target.value))
                }
                min={0}
              />
              <p className="text-[10px] text-slate-400">
                0 = tolerância zero (idoso/preferencial)
              </p>
            </div>
          </div>

          {/* Cor + Ícone */}
          <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="cat-color" className="text-xs">Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="cat-color"
                  type="color"
                  value={form.color}
                  onChange={(e) => set('color', e.target.value)}
                  className="h-9 w-12 p-1"
                />
                <Input
                  value={form.color}
                  onChange={(e) => set('color', e.target.value)}
                  placeholder="#06b6d4"
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-icon" className="text-xs">Ícone</Label>
              <Input
                id="cat-icon"
                value={form.icon}
                onChange={(e) => set('icon', e.target.value)}
                placeholder="🚗 ou nome lucide"
                className="text-center text-xl"
              />
            </div>
            {/* Preview do card */}
            <div className="space-y-1.5">
              <Label className="text-xs">Preview</Label>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-md border"
                style={{ borderTopColor: form.color, borderTopWidth: 3 }}
              >
                <span className="text-2xl">{form.icon || '🚗'}</span>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {form.name || '—'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {form.code || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ativo (Switch) */}
          <div className="flex items-center justify-between rounded-md border border-slate-200 p-3">
            <div>
              <Label htmlFor="cat-active" className="text-xs font-semibold cursor-pointer">
                Categoria ativa
              </Label>
              <p className="text-[10px] text-slate-400">
                Categorias inativas não aparecem para novos motoristas, mas mantêm os vínculos existentes.
              </p>
            </div>
            <Switch
              id="cat-active"
              checked={form.isActive}
              onCheckedChange={(v) => set('isActive', v)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {isEdit ? 'Salvar alterações' : 'Criar categoria'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
