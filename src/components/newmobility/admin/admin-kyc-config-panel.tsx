'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ShieldCheck,
  Loader2,
  Save,
  Plus,
  Pencil,
  Trash2,
  IdCard,
  FileText,
  MapPin,
  Camera,
  CreditCard,
  User,
  Briefcase,
  Home,
  Car,
  Plane,
  Award,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

// ---------- Types ----------

interface DocTypeMeta {
  id: string
  type: string
  label: string
  description: string
  icon: string
  isDefault: boolean
  sortOrder: number
}

interface DocTypeFull extends DocTypeMeta {
  isActive: boolean
}

interface KycConfigResponse {
  requiredDocTypes: string[]
  isConfigured: boolean
  allDocTypes: DocTypeMeta[]
}

interface DocTypesListResponse {
  types: DocTypeFull[]
}

// ---------- Icon mapping ----------
// Mapeia nome do ícone (string, vindo da API) para o componente lucide.
// Os 12 ícones permitidos pela API (ALLOWED_KYC_DOC_ICONS).
const ICON_MAP: Record<string, typeof IdCard> = {
  IdCard,
  FileText,
  MapPin,
  Camera,
  CreditCard,
  User,
  Briefcase,
  Home,
  Car,
  Plane,
  Award,
  ShieldCheck,
}

const ICON_OPTIONS = Object.keys(ICON_MAP)

// ---------- Component ----------

export function AdminKycConfigPanel() {
  const user = useStore((s) => s.user)
  const adminUserId = user?.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [allDocTypes, setAllDocTypes] = useState<DocTypeFull[]>([])
  const [requiredDocTypes, setRequiredDocTypes] = useState<string[]>([])
  const [isConfigured, setIsConfigured] = useState(false)

  // Dialog states
  const [editOpen, setEditOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [newOpenCounter, setNewOpenCounter] = useState(0)
  const [editingType, setEditingType] = useState<DocTypeFull | null>(null)
  const [savingType, setSavingType] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ---------- Carrega config (requiredDocTypes) ----------
  const loadConfig = useCallback(async () => {
    if (!adminUserId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [cfgRes, typesRes] = await Promise.all([
        fetch(`/api/admin/kyc-config?userId=${encodeURIComponent(adminUserId)}`, {
          cache: 'no-store',
        }),
        fetch(`/api/admin/kyc-doc-types?userId=${encodeURIComponent(adminUserId)}`, {
          cache: 'no-store',
        }),
      ])
      const cfgJson = await cfgRes.json()
      if (!cfgRes.ok) {
        throw new Error(
          (cfgJson as { error?: string })?.error ||
            'Falha ao carregar configuração KYC'
        )
      }
      const typesJson = await typesRes.json()
      if (!typesRes.ok) {
        throw new Error(
          (typesJson as { error?: string })?.error ||
            'Falha ao carregar tipos de documento'
        )
      }
      const cfg = cfgJson as KycConfigResponse
      const types = (typesJson as DocTypesListResponse).types ?? []
      setAllDocTypes(types)
      setRequiredDocTypes(cfg.requiredDocTypes ?? [])
      setIsConfigured(Boolean(cfg.isConfigured))
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Falha ao carregar configuração KYC'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [adminUserId])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // ---------- Toggle required ----------
  const toggleRequired = useCallback((type: string) => {
    setRequiredDocTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }, [])

  // ---------- Salvar config de exigência ----------
  const handleSave = useCallback(async () => {
    if (!adminUserId) {
      toast.error('Sessão expirada. Faça login novamente.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(
        `/api/admin/kyc-config?userId=${encodeURIComponent(adminUserId)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: adminUserId,
            requiredDocTypes,
          }),
        }
      )
      const json = await res.json()
      if (!res.ok) {
        throw new Error(
          (json as { error?: string })?.error ||
            'Falha ao salvar configuração KYC'
        )
      }
      const data = json as { message?: string }
      setIsConfigured(true)
      toast.success(data.message ?? 'Configuração KYC salva.', {
        description:
          requiredDocTypes.length === 0
            ? 'Usuários não verão campos de upload — o KYC é opcional.'
            : `Usuários verão apenas ${requiredDocTypes.length} campo(s) de upload.`,
      })
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Falha ao salvar configuração KYC'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }, [adminUserId, requiredDocTypes])

  // ---------- Toggle active (Switch) ----------
  const handleToggleActive = useCallback(
    async (docType: DocTypeFull, nextActive: boolean) => {
      if (!adminUserId) return
      // Otimismo: atualiza o estado local imediatamente.
      setAllDocTypes((prev) =>
        prev.map((d) =>
          d.id === docType.id ? { ...d, isActive: nextActive } : d
        )
      )
      // Se desativou um tipo que estava marcado como exigido, remove ele da
      // lista de exigidos (a API também faria isso ao salvar, mas atualizamos
      // o UI para refletir imediatamente).
      if (!nextActive) {
        setRequiredDocTypes((prev) =>
          prev.filter((t) => t !== docType.type)
        )
      }
      try {
        const res = await fetch(
          `/api/admin/kyc-doc-types/${encodeURIComponent(docType.id)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: adminUserId,
              isActive: nextActive,
            }),
          }
        )
        const json = await res.json()
        if (!res.ok) {
          throw new Error(
            (json as { error?: string })?.error ||
              'Falha ao atualizar tipo de documento'
          )
        }
        toast.success(
          nextActive
            ? `"${docType.label}" ativado.`
            : `"${docType.label}" desativado. Usuários não verão este tipo.`,
          {
            description: nextActive
              ? undefined
              : 'Se estava nos exigidos, foi removido da lista.',
          }
        )
      } catch (err) {
        // Reverte o estado em caso de erro.
        setAllDocTypes((prev) =>
          prev.map((d) =>
            d.id === docType.id ? { ...d, isActive: docType.isActive } : d
          )
        )
        const msg =
          err instanceof Error
            ? err.message
            : 'Falha ao atualizar tipo de documento'
        toast.error(msg)
      }
    },
    [adminUserId]
  )

  // ---------- Abrir dialog de edição ----------
  const openEdit = useCallback((docType: DocTypeFull) => {
    setEditingType(docType)
    setEditOpen(true)
  }, [])

  // ---------- Salvar edição ----------
  const handleSaveEdit = useCallback(
    async (data: {
      label: string
      description: string
      icon: string
      isActive: boolean
      sortOrder: number
    }) => {
      if (!adminUserId || !editingType) return
      setSavingType(true)
      try {
        const res = await fetch(
          `/api/admin/kyc-doc-types/${encodeURIComponent(editingType.id)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: adminUserId,
              ...data,
            }),
          }
        )
        const json = await res.json()
        if (!res.ok) {
          throw new Error(
            (json as { error?: string })?.error ||
              'Falha ao atualizar tipo de documento'
          )
        }
        // Atualiza o estado local com os novos dados.
        setAllDocTypes((prev) =>
          prev.map((d) =>
            d.id === editingType.id
              ? {
                  ...d,
                  label: data.label,
                  description: data.description,
                  icon: data.icon,
                  isActive: data.isActive,
                  sortOrder: data.sortOrder,
                }
              : d
          )
        )
        // Se desativou um tipo que estava marcado como exigido, remove da lista.
        if (!data.isActive) {
          setRequiredDocTypes((prev) =>
            prev.filter((t) => t !== editingType.type)
          )
        }
        toast.success(`"${data.label}" atualizado.`)
        setEditOpen(false)
        setEditingType(null)
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Falha ao atualizar tipo de documento'
        toast.error(msg)
      } finally {
        setSavingType(false)
      }
    },
    [adminUserId, editingType]
  )

  // ---------- Criar novo tipo ----------
  const handleCreateNew = useCallback(
    async (data: {
      code: string
      label: string
      description: string
      icon: string
      isActive: boolean
      sortOrder: number
    }) => {
      if (!adminUserId) return
      setSavingType(true)
      try {
        const res = await fetch(
          `/api/admin/kyc-doc-types?userId=${encodeURIComponent(adminUserId)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: adminUserId,
              ...data,
            }),
          }
        )
        const json = await res.json()
        if (!res.ok) {
          throw new Error(
            (json as { error?: string })?.error ||
              'Falha ao criar tipo de documento'
          )
        }
        const created = json as DocTypeFull
        // Recarrega a lista completa para garantir ordenação correta.
        await loadConfig()
        toast.success(`"${created.label}" criado com sucesso.`, {
          description: 'Agora você pode marcá-lo como exigido acima.',
        })
        setNewOpen(false)
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Falha ao criar tipo de documento'
        toast.error(msg)
      } finally {
        setSavingType(false)
      }
    },
    [adminUserId, loadConfig]
  )

  // ---------- Excluir tipo ----------
  const handleDelete = useCallback(
    async (docType: DocTypeFull) => {
      if (!adminUserId) return
      if (docType.isDefault) return // já desabilitado no UI, mas proteção extra
      // Confirmação nativa simples — o projeto não usa AlertDialog aqui.
      const ok = window.confirm(
        `Excluir o tipo "${docType.label}" (${docType.type})?\n\nDocumentos KYC já enviados com este tipo continuarão existindo no banco, mas não aparecerão mais na UI nem serão aceitos em novos uploads.`
      )
      if (!ok) return
      setDeletingId(docType.id)
      try {
        const res = await fetch(
          `/api/admin/kyc-doc-types/${encodeURIComponent(docType.id)}?userId=${encodeURIComponent(adminUserId)}`,
          { method: 'DELETE' }
        )
        const json = await res.json()
        if (!res.ok) {
          throw new Error(
            (json as { error?: string })?.error ||
              'Falha ao excluir tipo de documento'
          )
        }
        // Remove do estado local + tira da lista de exigidos se estava.
        setAllDocTypes((prev) => prev.filter((d) => d.id !== docType.id))
        setRequiredDocTypes((prev) =>
          prev.filter((t) => t !== docType.type)
        )
        toast.success(`"${docType.label}" excluído.`)
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Falha ao excluir tipo de documento'
        toast.error(msg)
      } finally {
        setDeletingId(null)
      }
    },
    [adminUserId]
  )

  // ---------- Has unsaved changes ----------
  // Há alterações não persistidas nos requiredDocTypes? Comparação via Set
  // (ordem não importa para o diff visual). O "configurado" inicial é a
  // própria lista requiredDocTypes recebida do servidor — não temos um
  // snapshot separado porque mantemos o estado original após load.
  // Para detectar mudanças, comparamos com a lista de tipos ativos que
  // estão marcados no estado `requiredDocTypes` atual vs. o último salvo.
  // Há alterações não persistidas nos requiredDocTypes? Comparação via Set
  // (ordem não importa para o diff visual). Snapshot inicial é tirado quando
  // o loadConfig termina (loading=false).
  const [savedRequired, setSavedRequired] = useState<string[]>([])
  const [prevLoading, setPrevLoading] = useState(true)
  if (prevLoading !== loading) {
    setPrevLoading(loading)
    if (!loading) {
      // Snapshot do estado carregado do servidor.
      setSavedRequired([...requiredDocTypes])
    }
  }

  const hasUnsavedChanges = useMemo(() => {
    const a = new Set(requiredDocTypes)
    const b = new Set(savedRequired)
    if (a.size !== b.size) return true
    for (const t of a) if (!b.has(t)) return true
    return false
  }, [requiredDocTypes, savedRequired])

  // ---------- Render ----------

  if (!adminUserId) {
    return (
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <ShieldCheck className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Faça login como administrador para configurar o KYC.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Tipos de documento KYC
            </CardTitle>
            <CardDescription className="mt-1">
              Adicione, edite ou desative tipos de documento. Marque como
              exigido os que o usuário deverá enviar. Tipos padrão não podem
              ser excluídos — apenas desativados.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isConfigured ? (
              <Badge className="border-transparent bg-emerald-100 text-emerald-800">
                Configurado
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-800">
                Padrão
              </Badge>
            )}
            <Button
              type="button"
              size="sm"
              className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => {
                setNewOpenCounter((c) => c + 1)
                setNewOpen(true)
              }}
              disabled={loading}
            >
              <Plus className="h-4 w-4" /> Novo Tipo
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
          </div>
        ) : (
          <>
            {/* Aviso quando nenhum documento está marcado como exigido */}
            {requiredDocTypes.length === 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">Nenhum documento exigido</p>
                  <p className="mt-0.5">
                    Com essa configuração, o KYC será opcional — os usuários
                    poderão sacar, liberar cashback e evoluir de plano sem
                    enviar nenhum documento.
                  </p>
                </div>
              </div>
            )}

            {/* Grid editável de tipos */}
            {allDocTypes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-muted-foreground dark:border-gray-700">
                Nenhum tipo de documento cadastrado. Clique em &quot;Novo Tipo&quot; para criar.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {allDocTypes.map((doc) => {
                  const checked = requiredDocTypes.includes(doc.type)
                  const Icon = ICON_MAP[doc.icon] ?? FileText
                  const isDeleting = deletingId === doc.id
                  return (
                    <div
                      key={doc.id}
                      className={cn(
                        'flex flex-col gap-3 rounded-xl border p-3 transition-colors',
                        checked
                          ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30'
                          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40',
                        !doc.isActive && 'opacity-60'
                      )}
                    >
                      {/* Linha 1 — checkbox exigir + badges */}
                      <div className="flex items-start justify-between gap-2">
                        <label
                          htmlFor={`kyc-cb-${doc.id}`}
                          className="flex cursor-pointer items-start gap-2"
                        >
                          <Checkbox
                            id={`kyc-cb-${doc.id}`}
                            checked={checked}
                            onCheckedChange={() => toggleRequired(doc.type)}
                            disabled={!doc.isActive}
                            className="mt-0.5"
                          />
                          <span className="text-xs text-muted-foreground">
                            Exigir deste tipo
                          </span>
                        </label>
                        {doc.isDefault ? (
                          <Badge
                            variant="outline"
                            className="border-transparent bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                          >
                            Padrão
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-transparent bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                          >
                            Customizado
                          </Badge>
                        )}
                      </div>

                      {/* Linha 2 — ícone + label + descrição */}
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-gray-100 p-2 dark:bg-gray-800">
                          <Icon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {doc.label}
                            </span>
                            {checked && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {doc.description || '—'}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
                            {doc.type}
                          </p>
                        </div>
                      </div>

                      {/* Linha 3 — ações */}
                      <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2 dark:border-gray-800">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch
                            checked={doc.isActive}
                            onCheckedChange={(next) =>
                              handleToggleActive(doc, Boolean(next))
                            }
                            aria-label={`Ativar/Desativar ${doc.label}`}
                          />
                          <span>{doc.isActive ? 'Ativo' : 'Inativo'}</span>
                        </label>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                            onClick={() => openEdit(doc)}
                            title="Editar tipo"
                            aria-label="Editar tipo"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-red-950/40"
                            onClick={() => handleDelete(doc)}
                            disabled={doc.isDefault || isDeleting}
                            title={
                              doc.isDefault
                                ? 'Tipos padrão não podem ser excluídos, apenas desativados'
                                : 'Excluir tipo'
                            }
                            aria-label="Excluir tipo"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Rodapé — salvar exigência */}
            <div className="flex flex-col gap-3 border-t border-gray-100 pt-3 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {requiredDocTypes.length} documento(s) marcado(s) como exigido(s).
                {hasUnsavedChanges && (
                  <span className="ml-1 font-medium text-amber-700 dark:text-amber-400">
                    (alterações não salvas)
                  </span>
                )}
              </p>
              <Button
                type="button"
                size="sm"
                className="rounded-xl"
                disabled={saving || !hasUnsavedChanges}
                onClick={handleSave}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Salvar Exigência
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>

      {/* ---------- Dialog Editar ---------- */}
      {/* key={editingType?.id} garante que o componente remonte quando o
          admin clica em editar outro tipo — useState inicializa dos props. */}
      {editOpen && editingType && (
        <EditDocTypeDialog
          key={editingType.id}
          open={editOpen}
          onOpenChange={setEditOpen}
          docType={editingType}
          saving={savingType}
          onSave={handleSaveEdit}
        />
      )}

      {/* ---------- Dialog Novo ---------- */}
      {/* key força remonte a cada abertura — form começa limpo. */}
      {newOpen && (
        <NewDocTypeDialog
          key={`new-${newOpenCounter}`}
          open={newOpen}
          onOpenChange={setNewOpen}
          saving={savingType}
          onSave={handleCreateNew}
        />
      )}
    </Card>
  )
}

// ---------- Edit Dialog ----------

interface EditDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  docType: DocTypeFull | null
  saving: boolean
  onSave: (data: {
    label: string
    description: string
    icon: string
    isActive: boolean
    sortOrder: number
  }) => Promise<void>
}

function EditDocTypeDialog({
  open,
  onOpenChange,
  docType,
  saving,
  onSave,
}: EditDialogProps) {
  // Estado inicial derivado de docType. O componente é remontado quando
  // `docType.id` muda (via `key` prop no parent), então o useState só
  // executa no mount — não há sincronização via useEffect.
  const [label, setLabel] = useState(docType?.label ?? '')
  const [description, setDescription] = useState(docType?.description ?? '')
  const [icon, setIcon] = useState(docType?.icon ?? 'FileText')
  const [isActive, setIsActive] = useState(docType?.isActive ?? true)
  const [sortOrder, setSortOrder] = useState(docType?.sortOrder ?? 99)

  const Icon = ICON_MAP[icon] ?? FileText

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) {
      toast.error('Label é obrigatório')
      return
    }
    await onSave({
      label: label.trim(),
      description: description.trim(),
      icon,
      isActive,
      sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 99,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar tipo de documento</DialogTitle>
          <DialogDescription>
            {docType
              ? `Editando "${docType.label}" (${docType.type}). O código não pode ser alterado.`
              : ''}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-label">Label *</Label>
            <Input
              id="edit-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={80}
              placeholder="Ex: Passaporte"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Descrição</Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={280}
              placeholder="Ex: Foto nítida da página de identificação do passaporte"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Ícone</Label>
            <div className="flex items-center gap-2">
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um ícone" />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((ic) => {
                    const I = ICON_MAP[ic] ?? FileText
                    return (
                      <SelectItem key={ic} value={ic}>
                        <div className="flex items-center gap-2">
                          <I className="h-4 w-4" />
                          <span>{ic}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <div className="rounded-full bg-gray-100 p-2.5 dark:bg-gray-800">
                <Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="edit-active">Ativo</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-active"
                checked={isActive}
                onCheckedChange={(v) => setIsActive(Boolean(v))}
              />
              <span className="text-xs text-muted-foreground">
                {isActive ? 'Visível para usuários' : 'Oculto'}
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-sort">Ordem</Label>
            <Input
              id="edit-sort"
              type="number"
              min={0}
              max={999}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Tipos aparecem ordenados por este número (crescente).
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------- New Dialog ----------

interface NewDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  saving: boolean
  onSave: (data: {
    code: string
    label: string
    description: string
    icon: string
    isActive: boolean
    sortOrder: number
  }) => Promise<void>
}

function NewDocTypeDialog({
  open,
  onOpenChange,
  saving,
  onSave,
}: NewDialogProps) {
  // Estado inicial limpo. O parent usa `key={`new-${counter}`}` para forçar
  // remount a cada abertura — useState inicializa vazio no mount.
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('FileText')
  const [isActive, setIsActive] = useState(true)
  const [sortOrder, setSortOrder] = useState(50)

  const Icon = ICON_MAP[icon] ?? FileText

  // Normaliza code: minúsculas + remove caracteres inválidos.
  const normalizedCode = code.toLowerCase().replace(/[^a-z0-9_]/g, '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!normalizedCode) {
      toast.error('Código é obrigatório')
      return
    }
    if (!label.trim()) {
      toast.error('Label é obrigatório')
      return
    }
    await onSave({
      code: normalizedCode,
      label: label.trim(),
      description: description.trim(),
      icon,
      isActive,
      sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 50,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo tipo de documento</DialogTitle>
          <DialogDescription>
            Crie um tipo customizado (ex: Passaporte, Comprovante de Renda,
            Carteira de Trabalho). Tipos criados aqui podem ser excluídos
            depois.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-code">Código *</Label>
            <Input
              id="new-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={40}
              placeholder="ex: passport, income_proof, work_card"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              required
            />
            <p className="text-xs text-muted-foreground">
              Só letras minúsculas, dígitos e underscore. Máx 40 chars. Não
              pode ser editado depois.
            </p>
            {code && code !== normalizedCode && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Será salvo como: <code>{normalizedCode}</code>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-label">Label *</Label>
            <Input
              id="new-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={80}
              placeholder="Ex: Passaporte"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-desc">Descrição</Label>
            <Textarea
              id="new-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={280}
              placeholder="Ex: Foto nítida da página de identificação"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Ícone</Label>
            <div className="flex items-center gap-2">
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um ícone" />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((ic) => {
                    const I = ICON_MAP[ic] ?? FileText
                    return (
                      <SelectItem key={ic} value={ic}>
                        <div className="flex items-center gap-2">
                          <I className="h-4 w-4" />
                          <span>{ic}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <div className="rounded-full bg-gray-100 p-2.5 dark:bg-gray-800">
                <Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="new-active">Ativo</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="new-active"
                checked={isActive}
                onCheckedChange={(v) => setIsActive(Boolean(v))}
              />
              <span className="text-xs text-muted-foreground">
                {isActive ? 'Visível para usuários' : 'Oculto (criar inativo)'}
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-sort">Ordem</Label>
            <Input
              id="new-sort"
              type="number"
              min={0}
              max={999}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Criando…
                </>
              ) : (
                'Criar Tipo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
