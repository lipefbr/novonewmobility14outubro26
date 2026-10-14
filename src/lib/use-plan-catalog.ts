'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { getPlanName } from '@/lib/utils'

// ============================================================================
// usePlanCatalog — Hook client-side que carrega o catálogo público de planos
// ----------------------------------------------------------------------------
// Task ID 13-b: os rótulos de plano na área do membro (Ranking, Indicações,
// Rede) eram literais fixos ('PRO', 'Blue 3', 'Free', ...). Quando o admin
// renomeava um plano na aba Plans (PUT /api/admin/plans → tabela Plan), as
// páginas do membro continuavam exibindo o nome antigo.
//
// Este hook busca o catálogo público `GET /api/plans` (que lê diretamente a
// tabela Plan — apenas planos isActive && isDefault) e expõe
// `{ plans, planName, loading }` para qualquer componente client.
//
// `planName(code)` resolve na ordem:
//   1. nome do plano no banco (catálogo já carregado);
//   2. mapa estático de getPlanName (Gratuito/Blue 3/Blue 5 Premium —
//      fallback pré-load);
//   3. o próprio código cru (comportamento do getPlanName para códigos
//      desconhecidos).
//
// Para evitar refetch em toda navegação, o resultado é cacheado em
// localStorage com TTL de 5 minutos (mesma mecânica do use-branding.ts).
// O admin pode forçar a invalidação após salvar um plano via
// `invalidatePlanCatalogCache()` (exportado abaixo).
// Falha de rede/timeout é tratada silenciosamente: mantém os fallbacks
// estáticos e NUNCA crasha a página.
// ============================================================================

const CACHE_KEY = 'plan_catalog_cache'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos

/**
 * Shape mínimo do plano consumido pelo hook (subconjunto do retorno de
 * GET /api/plans — o endpoint devolve campos extras como priceCents,
 * features, level, matrices; ignorados aqui).
 */
export interface PlanCatalogItem {
  id: string
  code: string
  name: string
  priceCents: number
}

interface PlanCatalogCache {
  plans: PlanCatalogItem[]
  fetchedAt: number
}

interface PlansResponse {
  plans?: PlanCatalogItem[]
}

function readCache(): PlanCatalogCache | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PlanCatalogCache
    if (!parsed || typeof parsed.fetchedAt !== 'number' || !Array.isArray(parsed.plans)) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(plans: PlanCatalogItem[]) {
  if (typeof window === 'undefined') return
  try {
    const cache: PlanCatalogCache = { plans, fetchedAt: Date.now() }
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage indisponível (modo privado etc.) — segue sem cache
  }
}

/** Invalida o cache local do catálogo de planos (usar após o admin salvar). */
export function invalidatePlanCatalogCache() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(CACHE_KEY)
  } catch {
    // noop
  }
}

export interface UsePlanCatalogResult {
  /** Planos do catálogo (vazio até o fetch resolver — usar planName p/ rótulos). */
  plans: PlanCatalogItem[]
  /** Rótulo do plano pelo código: nome do DB → mapa estático → código cru. */
  planName: (code: string) => string
  loading: boolean
}

export function usePlanCatalog(): UsePlanCatalogResult {
  const [plans, setPlans] = useState<PlanCatalogItem[]>(() => {
    // Hidrata do cache síncrono para evitar flash do fallback estático
    // quando o usuário já tem o catálogo em localStorage.
    return readCache()?.plans ?? []
  })
  const [loading, setLoading] = useState<boolean>(!readCache())

  useEffect(() => {
    let cancelled = false

    // Se o cache ainda é válido (< 5min), nem dispara fetch.
    const cached = readCache()
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      setPlans(cached.plans)
      setLoading(false)
      return
    }

    async function fetchCatalog() {
      try {
        const res = await apiFetch<PlansResponse>('/plans', { timeoutMs: 30000 })
        if (cancelled) return
        const list = Array.isArray(res?.plans) ? res.plans : []
        // Sanitização defensiva: só aceita itens com code + name úteis
        // (protege contra linhas malformadas quebrarem os rótulos).
        const sanitized = list.filter(
          (p) =>
            p &&
            typeof p.code === 'string' &&
            p.code.trim() !== '' &&
            typeof p.name === 'string' &&
            p.name.trim() !== '',
        )
        setPlans(sanitized)
        // Só cacheia se veio algo — resposta vazia/quebrada mantém o
        // fallback estático na próxima render.
        if (sanitized.length > 0) writeCache(sanitized)
      } catch {
        // Falha de rede/timeout — mantém os fallbacks estáticos (getPlanName).
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchCatalog()
    return () => {
      cancelled = true
    }
  }, [])

  // useCallback mantém a referência estável (pode ir como prop/dep sem
  // re-render em cascata nos consumidores).
  const planName = useCallback(
    (code: string): string => {
      const found = plans.find((p) => p.code === code)
      // 1) nome do banco · 2) mapa estático (Gratuito/Blue 3/Blue 5 Premium)
      //    · 3) código cru (fallback interno do getPlanName)
      return (found?.name && found.name.trim()) || getPlanName(code)
    },
    [plans],
  )

  return { plans, planName, loading }
}
