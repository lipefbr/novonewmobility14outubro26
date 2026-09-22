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
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ShieldCheck,
  Loader2,
  Save,
  RotateCcw,
  IdCard,
  FileText,
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

// ---------- Types ----------

interface DocTypeMeta {
  type: string
  label: string
  description: string
  icon: string
}

interface KycConfigResponse {
  requiredDocTypes: string[]
  isConfigured: boolean
  allDocTypes: DocTypeMeta[]
}

// Mapeia nome do ícone (string, vindo da API) para o componente lucide.
// Fazemos isso para evitar serializar funções no payload JSON.
const ICON_MAP: Record<string, typeof IdCard> = {
  IdCard,
  FileText,
  MapPin,
  Camera,
}

// Os 6 tipos na ordem canônica — usado pelo botão "Restaurar Padrão".
const ALL_DEFAULT_TYPES = [
  'cnh_front',
  'cnh_back',
  'rg_front',
  'rg_back',
  'proof_address',
  'selfie_document',
]

// ---------- Component ----------

export function AdminKycConfigPanel() {
  const user = useStore((s) => s.user)
  const adminUserId = user?.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [allDocTypes, setAllDocTypes] = useState<DocTypeMeta[]>([])
  const [requiredDocTypes, setRequiredDocTypes] = useState<string[]>([])
  const [isConfigured, setIsConfigured] = useState(false)

  const loadConfig = useCallback(async () => {
    if (!adminUserId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/kyc-config?userId=${encodeURIComponent(adminUserId)}`,
        { cache: 'no-store' }
      )
      const json = await res.json()
      if (!res.ok) {
        throw new Error(
          (json as { error?: string })?.error ||
            'Falha ao carregar configuração KYC'
        )
      }
      const data = json as KycConfigResponse
      setAllDocTypes(data.allDocTypes ?? [])
      setRequiredDocTypes(data.requiredDocTypes ?? [])
      setIsConfigured(Boolean(data.isConfigured))
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

  const toggleType = useCallback((type: string) => {
    setRequiredDocTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }, [])

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
      const data = json as { message?: string; requiredDocTypes?: string[] }
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

  const handleRestoreDefault = useCallback(async () => {
    // Marca todos os 6 localmente sem salvar — usuário precisa clicar em Salvar
    // para persistir (evita salvar por acidente).
    setRestoring(true)
    try {
      // Pequeno delay apenas para feedback visual do botão.
      await new Promise((r) => setTimeout(r, 150))
      setRequiredDocTypes([...ALL_DEFAULT_TYPES])
      toast.info('Padrão restaurado (todos os 6 documentos). Clique em Salvar para aplicar.')
    } finally {
      setRestoring(false)
    }
  }, [])

  // Há alterações não persistidas? Comparação simples de array (ordem não
  // importa para o diff visual).
  const hasUnsavedChanges = useMemo(() => {
    const a = new Set(requiredDocTypes)
    const b = new Set(allDocTypes.map((d) => d.type))
    if (a.size !== b.size) return true
    for (const t of a) if (!b.has(t)) return true
    return false
  }, [requiredDocTypes, allDocTypes])

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
              Documentos exigidos no KYC
            </CardTitle>
            <CardDescription className="mt-1">
              Marque quais tipos de documento o usuário deverá enviar. Desmarque
              os que não são necessários (ex: não exigir RG se já tem CNH). O
              usuário só verá os campos marcados abaixo.
            </CardDescription>
          </div>
          {isConfigured ? (
            <Badge className="border-transparent bg-emerald-100 text-emerald-800">
              Configurado
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-800">
              Padrão (todos os 6)
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
          </div>
        ) : (
          <>
            {/* Aviso quando nenhum documento está marcado */}
            {requiredDocTypes.length === 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">
                    Nenhum documento exigido
                  </p>
                  <p className="mt-0.5">
                    Com essa configuração, o KYC será opcional — os usuários
                    poderão sacar, liberar cashback e evoluir de plano sem
                    enviar nenhum documento.
                  </p>
                </div>
              </div>
            )}

            {/* Lista de checkboxes — 1 coluna no mobile, 2 no desktop */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {allDocTypes.map((doc) => {
                const checked = requiredDocTypes.includes(doc.type)
                const Icon = ICON_MAP[doc.icon] ?? FileText
                return (
                  <label
                    key={doc.type}
                    htmlFor={`kyc-cb-${doc.type}`}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                      checked
                        ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30'
                        : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40 dark:hover:bg-gray-800/40'
                    )}
                  >
                    <Checkbox
                      id={`kyc-cb-${doc.type}`}
                      checked={checked}
                      onCheckedChange={() => toggleType(doc.type)}
                      className="mt-0.5"
                    />
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
                        {doc.description}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>

            {/* Resumo + ações */}
            <div className="flex flex-col gap-3 border-t border-gray-100 pt-3 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {requiredDocTypes.length} de {allDocTypes.length} documentos
                selecionados.
                {hasUnsavedChanges && (
                  <span className="ml-1 font-medium text-amber-700 dark:text-amber-400">
                    (alterações não salvas)
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={restoring || saving}
                  onClick={handleRestoreDefault}
                >
                  {restoring ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Restaurar Padrão
                </Button>
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
                      <Save className="h-4 w-4" /> Salvar Configuração
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
