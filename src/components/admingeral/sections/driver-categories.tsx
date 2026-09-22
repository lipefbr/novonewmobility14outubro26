'use client'

import { useState, useEffect } from 'react'
import { Car, Info, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { useStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatBRL } from '@/components/admingeral/types'

// ============================================================================
// Seção "Categorias de Motorista" do painel Admin Geral.
// ----------------------------------------------------------------------------
// READ-ONLY: lista as categorias de veículo (Safira, Rubi, Esmeralda,
// Diamante, Imperial) criadas no painel NewMobility admin. Aqui o admin do
// ecossistema de apps consegue ver as categorias e quantos motoristas estão
// vinculados a cada uma — mas a edição (criar/editar/excluir/ativar) fica no
// painel NewMobility (botão "Gerenciar no painel NewMobility" leva para `/`).
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

export function DriverCategoriesSection() {
  const { user } = useStore()
  const [categories, setCategories] = useState<DriverCategory[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user?.id) return
    try {
      const r = await apiFetch<{ categories: DriverCategory[] }>(
        `/admingeral/driver-categories?userId=${user.id}`
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

      {/* Header com contagem e botão para gerenciar no painel NewMobility */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-slate-500">
          <Badge variant="secondary" className="mr-1.5">{categories.length}</Badge>
          {categories.length === 1 ? 'categoria cadastrada' : 'categorias cadastradas'}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            // Vai para a raiz do site, onde fica o painel NewMobility admin
            // (o usuário verá a aba "Categorias de Motorista" dentro dele).
            window.location.href = '/'
          }}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          Gerenciar no painel NewMobility
        </Button>
      </div>

      {/* Empty state */}
      {categories.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="p-10 text-center flex flex-col items-center gap-2">
            <Car className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">Nenhuma categoria de motorista cadastrada</p>
            <p className="text-[11px] text-slate-400">
              Crie categorias (Safira, Rubi, Esmeralda, Diamante, Imperial) no painel NewMobility admin — aba &quot;Categorias de Motorista&quot;.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              className={`border-slate-200 ${!cat.isActive ? 'opacity-60' : ''}`}
              style={{
                borderTopColor: cat.color || undefined,
                borderTopWidth: cat.color ? 4 : undefined,
              }}
            >
              <CardContent className="p-4">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
