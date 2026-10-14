'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

// ============================================================================
// useBranding — Hook client-side que carrega o branding público da plataforma
// ----------------------------------------------------------------------------
// Task ID 6: o nome da plataforma editado pelo admin em
// `Configurações do Sistema → Nome da Plataforma` é gravado em
// `SystemConfig.platform_name` (via PUT /api/admin/config). Antes este valor
// não chegava até a UI (sidebar/header/footer/metadata) porque esses locais
// tinham "NewMobility" hardcodeado.
//
// Este hook busca as chaves públicas (platform_name, app_name, app_logo_url,
// primary_color) na rota pública `/api/system-settings/public` (que não
// exige auth admin) e expõe um objeto `{ name, logoUrl, primaryColor, loading }`
// pronto para usar em qualquer componente client.
//
// Para evitar refetch em toda navegação, o resultado é cacheado em
// localStorage com TTL de 5 minutos. O admin pode forçar a invalidação do
// cache após salvar (função `invalidateBrandingCache` exportada abaixo).
// ============================================================================

const CACHE_KEY = 'nm-branding-cache-v1'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos

const DEFAULT_NAME = 'NewMobility'

export interface BrandingData {
  name: string
  logoUrl: string | null
  primaryColor: string | null
}

interface BrandingCache {
  data: BrandingData
  fetchedAt: number
}

interface PublicSettingsResponse {
  settings: Array<{ key: string; value: string }>
}

function readCache(): BrandingCache | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BrandingCache
    if (!parsed || typeof parsed.fetchedAt !== 'number' || !parsed.data) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(data: BrandingData) {
  if (typeof window === 'undefined') return
  try {
    const cache: BrandingCache = { data, fetchedAt: Date.now() }
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage indisponível (modo privado etc.) — segue sem cache
  }
}

/** Invalida o cache local do branding (usar após salvar nova config no admin). */
export function invalidateBrandingCache() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(CACHE_KEY)
  } catch {
    // noop
  }
}

function resolveBranding(settings: Array<{ key: string; value: string }>): BrandingData {
  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value

  // platform_name é a chave canônica (criada pelo /api/admin/config defaults
  // e editada no admin-page.tsx Configurações da Plataforma). app_name é
  // legacy (escrita pelo admin-settings-panel.tsx). Damos prioridade à
  // platform_name mas aceitamos app_name como fallback para os usuários que
  // já tinham configurado o nome pelo painel de Identidade Visual.
  const name =
    (map['platform_name'] && map['platform_name'].trim()) ||
    (map['app_name'] && map['app_name'].trim()) ||
    DEFAULT_NAME

  const logoUrl = map['app_logo_url'] && map['app_logo_url'].trim() ? map['app_logo_url'] : null
  const primaryColor =
    map['primary_color'] && map['primary_color'].trim() ? map['primary_color'] : null

  return { name, logoUrl, primaryColor }
}

export interface UseBrandingResult extends BrandingData {
  loading: boolean
}

export function useBranding(): UseBrandingResult {
  const [state, setState] = useState<BrandingData>(() => {
    // Hidrata do cache síncrono para evitar flash de "NewMobility" quando
    // o usuário já tinha um nome custom salvo.
    const cached = readCache()
    return cached?.data ?? { name: DEFAULT_NAME, logoUrl: null, primaryColor: null }
  })
  const [loading, setLoading] = useState<boolean>(!readCache())

  useEffect(() => {
    let cancelled = false

    // Se o cache ainda é válido (< 5min), nem dispara fetch.
    const cached = readCache()
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      setState(cached.data)
      setLoading(false)
      return
    }

    async function fetchBranding() {
      try {
        const res = await apiFetch<PublicSettingsResponse>('/system-settings/public')
        if (cancelled || !res?.settings) return
        const resolved = resolveBranding(res.settings)
        setState(resolved)
        writeCache(resolved)
      } catch {
        // Em caso de erro mantém o que já estava (fallback NewMobility).
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchBranding()
    return () => {
      cancelled = true
    }
  }, [])

  return { ...state, loading }
}
