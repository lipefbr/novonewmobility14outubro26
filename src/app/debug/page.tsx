'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Database, RefreshCw, AlertCircle, CheckCircle2, XCircle,
  Terminal, Shield, Users, Settings, Zap, Clock, Cpu, HardDrive,
  KeyRound, Play, Copy, ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

// ============================================================================
// /debug — Página de diagnóstico e seed do banco
// ----------------------------------------------------------------------------
// Mostra:
//   1. Status do sistema (DB, env, tabelas, usuários)
//   2. Erros se houver
//   3. Botão pra rodar o seed (cria admin + usuários demo + configs)
//   4. Log detalhado do que foi feito
//   5. Credenciais de acesso após o seed
//
// ROTA PÚBLICA — não requer login. É intencional: precisa funcionar mesmo
// quando o banco está vazio e não há admin ainda.
// ============================================================================

interface StatusResponse {
  ok: boolean
  healthy?: boolean
  timestamp: string
  totalLatencyMs?: number
  error?: string
  runtime: {
    nodeVersion: string
    platform: string
    arch: string
    nodeEnv: string
    pid: number
    uptimeSec: number
    memoryMb: {
      rss: number
      heapUsed: number
      heapTotal: number
    }
  }
  env: {
    DATABASE_URL: string
    NEXTAUTH_URL: string
    NEXTAUTH_SECRET: string
    ASAAS_API_KEY: string
    ZAI_API_KEY: string
  }
  db: {
    urlPresent: boolean
    urlProtocol: string
    connected: boolean
    error: string | null
    latencyMs: number
  }
  tables: Record<string, number | string>
  users: {
    total: number
    admin: boolean
    demoUsers: string[]
    adminPasswordMatches?: boolean
    adminPasswordHash?: string | null
    error?: string
  }
  seed: {
    hasSeedFile: boolean
    adminEmail: string
    adminPasswordHint: string
    demoEmails: string[]
  }
}

interface SeedResponse {
  ok: boolean
  durationMs?: number
  error?: string
  steps: Array<{
    name: string
    status: 'ok' | 'skip' | 'error'
    detail?: string
    count?: number
  }>
  log: string[]
  credentials?: {
    admin: string
    cliente: string
    motorista: string
    lojista: string
  }
}

export default function DebugPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<SeedResponse | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true)
    try {
      const res = await fetch('/api/debug/status')
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      console.error('Status fetch failed:', err)
      toast.error('Falha ao buscar status do sistema')
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchStatus])

  const runSeed = async () => {
    if (!confirm('Confirmar execução do seed? Isso vai criar o admin@newmobility.com + 3 usuários demo + configs padrão. É idempotente — seguro rodar mais de uma vez.')) {
      return
    }
    setSeeding(true)
    setSeedResult(null)
    try {
      const res = await fetch('/api/debug/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      const data = await res.json()
      setSeedResult(data)
      if (data.ok) {
        toast.success(`Seed concluído em ${data.durationMs}ms`)
        // Refresh status to show new user counts
        setTimeout(fetchStatus, 500)
      } else {
        toast.error(`Seed falhou: ${data.error}`)
      }
    } catch (err) {
      console.error('Seed failed:', err)
      toast.error('Falha ao executar seed')
    } finally {
      setSeeding(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para a área de transferência')
  }

  const tableEntries = status
    ? Object.entries(status.tables).filter(([k]) => !k.endsWith('_error'))
    : []

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
              <Terminal className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">NewMobility Debug</h1>
              <p className="text-xs text-slate-400">Diagnóstico do sistema + seed do banco</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`border-slate-700 ${autoRefresh ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700' : 'text-slate-300'}`}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto 5s' : 'Auto'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStatus}
              disabled={loadingStatus}
              className="border-slate-700 text-slate-300"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loadingStatus ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-400">
                Voltar
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Overall status banner */}
        {status && (
          <Card className={`border-2 ${status.healthy ? 'border-emerald-700 bg-emerald-950/30' : 'border-red-700 bg-red-950/30'}`}>
            <CardContent className="p-4 flex items-center gap-4">
              {status.healthy ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="h-8 w-8 text-red-400 shrink-0" />
              )}
              <div className="flex-1">
                <h2 className={`text-base font-bold ${status.healthy ? 'text-emerald-300' : 'text-red-300'}`}>
                  {status.healthy ? 'Sistema saudável' : 'Sistema com problemas'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {status.error || `Tudo funcionando — latência total ${status.totalLatencyMs}ms`}
                </p>
              </div>
              {status.timestamp && (
                <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(status.timestamp).toLocaleTimeString('pt-BR')}
                </Badge>
              )}
            </CardContent>
          </Card>
        )}

        {/* DB + Runtime grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* DB Connection */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-200">
                <Database className="h-4 w-4 text-blue-400" />
                Conexão com Banco
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!status ? (
                <p className="text-xs text-slate-500">Carregando...</p>
              ) : (
                <>
                  <Row label="URL presente" value={status.db.urlPresent ? 'Sim' : 'NÃO'} ok={status.db.urlPresent} />
                  <Row label="Protocolo" value={status.db.urlProtocol} />
                  <Row
                    label="Conectado"
                    value={status.db.connected ? `Sim (${status.db.latencyMs}ms)` : 'NÃO'}
                    ok={status.db.connected}
                  />
                  {status.db.error && (
                    <div className="mt-2 p-2 rounded bg-red-950/50 border border-red-900 text-red-300 text-xs font-mono break-all">
                      {status.db.error}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Runtime */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-200">
                <Cpu className="h-4 w-4 text-purple-400" />
                Runtime
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!status ? (
                <p className="text-xs text-slate-500">Carregando...</p>
              ) : (
                <>
                  <Row label="Node" value={status.runtime.nodeVersion} />
                  <Row label="Plataforma" value={`${status.runtime.platform}/${status.runtime.arch}`} />
                  <Row label="NODE_ENV" value={status.runtime.nodeEnv} />
                  <Row label="Uptime" value={`${status.runtime.uptimeSec}s`} />
                  <Row
                    label="Memória"
                    value={`${status.runtime.memoryMb.heapUsed}/${status.runtime.memoryMb.heapTotal} MB heap · ${status.runtime.memoryMb.rss} MB RSS`}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Environment vars */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-200">
              <KeyRound className="h-4 w-4 text-amber-400" />
              Variáveis de Ambiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!status ? (
              <p className="text-xs text-slate-500">Carregando...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(status.env).map(([key, val]) => {
                  const isSet = val !== '(not set)'
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isSet ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        )}
                        <span className="text-xs font-mono text-slate-300 truncate">{key}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-500 ml-2 truncate">{val}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tables */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-200">
              <HardDrive className="h-4 w-4 text-emerald-400" />
              Tabelas do Banco
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!status ? (
              <p className="text-xs text-slate-500">Carregando...</p>
            ) : tableEntries.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhuma tabela encontrada</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {tableEntries.map(([key, val]) => {
                  const numVal = typeof val === 'number' ? val : -1
                  const errorKey = `${key}_error`
                  const hasError = errorKey in status.tables
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded border ${
                        hasError
                          ? 'bg-red-950/30 border-red-900'
                          : numVal === 0
                            ? 'bg-amber-950/30 border-amber-900'
                            : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <p className="text-xs text-slate-400 truncate">{key}</p>
                      <p className={`text-lg font-bold ${numVal > 0 ? 'text-emerald-300' : numVal === 0 ? 'text-amber-300' : 'text-red-300'}`}>
                        {numVal >= 0 ? numVal : 'ERR'}
                      </p>
                      {hasError && (
                        <p className="text-[10px] text-red-400 mt-1 truncate" title={String(status.tables[errorKey])}>
                          {String(status.tables[errorKey]).slice(0, 40)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-200">
              <Users className="h-4 w-4 text-sky-400" />
              Usuários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!status ? (
              <p className="text-xs text-slate-500">Carregando...</p>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Total</p>
                    <p className="text-2xl font-bold text-slate-100">{status.users.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Admin existe</p>
                    {status.users.admin ? (
                      <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-700">Sim</Badge>
                    ) : (
                      <Badge className="bg-red-900/50 text-red-300 border-red-700">NÃO — rode o seed</Badge>
                    )}
                  </div>
                  {status.users.adminPasswordMatches !== undefined && (
                    <div>
                      <p className="text-xs text-slate-400">Senha admin OK</p>
                      {status.users.adminPasswordMatches ? (
                        <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-700">Sim (admin123)</Badge>
                      ) : (
                        <Badge className="bg-amber-900/50 text-amber-300 border-amber-700">Não bate — rode o seed</Badge>
                      )}
                    </div>
                  )}
                </div>
                {status.users.demoUsers.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Usuários demo encontrados:</p>
                    <div className="flex flex-wrap gap-1">
                      {status.users.demoUsers.map((u) => (
                        <Badge key={u} variant="outline" className="border-slate-700 text-slate-300 text-xs">
                          {u}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {status.users.error && (
                  <div className="p-2 rounded bg-red-950/50 border border-red-900 text-red-300 text-xs font-mono break-all">
                    {status.users.error}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Seed Action */}
        <Card className="bg-slate-900 border-2 border-emerald-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-300">
              <Zap className="h-4 w-4" />
              Seed do Banco
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <p className="text-xs text-slate-300 mb-2">
                Roda o <code className="text-emerald-400">prisma/seed.ts</code> inline e cria:
              </p>
              <ul className="text-xs text-slate-400 space-y-0.5 ml-4 list-disc">
                <li>Admin: <code className="text-emerald-400">admin@newmobility.com / admin123</code></li>
                <li>Cliente: <code className="text-emerald-400">cliente@newmobility.com / 123456</code></li>
                <li>Motorista: <code className="text-emerald-400">motorista@newmobility.com / 123456</code></li>
                <li>Lojista: <code className="text-emerald-400">lojista@newmobility.com / 123456</code></li>
                <li>SystemConfig defaults (12 chaves)</li>
                <li>UserType defaults (6 tipos)</li>
                <li>Plan defaults (free / blue3 / blue5)</li>
                <li>AppCategory defaults (8 categorias)</li>
                <li>FAQ defaults (6 entradas)</li>
              </ul>
              <p className="text-xs text-amber-300 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Idempotente — seguro rodar mais de uma vez. Não sobrescreve dados editados pelo admin.
              </p>
            </div>

            <Button
              onClick={runSeed}
              disabled={seeding}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              size="lg"
            >
              {seeding ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Executando seed...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Rodar Seed Agora
                </>
              )}
            </Button>

            {/* Seed result */}
            {seedResult && (
              <div className="space-y-3">
                {/* Result banner */}
                <div
                  className={`p-3 rounded border ${
                    seedResult.ok
                      ? 'bg-emerald-950/50 border-emerald-800'
                      : 'bg-red-950/50 border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {seedResult.ok ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                    <span className={`font-bold ${seedResult.ok ? 'text-emerald-300' : 'text-red-300'}`}>
                      {seedResult.ok ? `Seed concluído em ${seedResult.durationMs}ms` : 'Seed falhou'}
                    </span>
                  </div>
                  {seedResult.error && (
                    <p className="text-xs text-red-300 font-mono break-all">{seedResult.error}</p>
                  )}
                </div>

                {/* Steps */}
                {seedResult.steps.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">Etapas</p>
                    {seedResult.steps.map((step, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          {step.status === 'ok' ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : step.status === 'skip' ? (
                            <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-400" />
                          )}
                          <span className="text-xs font-semibold text-slate-200">{step.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {step.count !== undefined && (
                            <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                              {step.count}
                            </Badge>
                          )}
                          {step.detail && (
                            <span className="text-xs text-slate-500">{step.detail}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Credentials */}
                {seedResult.credentials && (
                  <div className="p-3 rounded bg-slate-950 border border-emerald-900">
                    <p className="text-xs font-bold text-emerald-300 uppercase mb-2 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Credenciais criadas
                    </p>
                    <div className="space-y-1">
                      {Object.entries(seedResult.credentials).map(([role, creds]) => (
                        <div key={role} className="flex items-center gap-2">
                          <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs w-20 justify-center">
                            {role}
                          </Badge>
                          <code className="text-xs text-slate-300 flex-1">{creds}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-slate-500 hover:text-slate-200"
                            onClick={() => copyToClipboard(creds)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Log */}
                {seedResult.log.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Log</p>
                    <div className="p-3 rounded bg-black border border-slate-800 max-h-64 overflow-y-auto">
                      <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                        {seedResult.log.join('\n')}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Quick links after seed */}
                {seedResult.ok && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Link href="/">
                      <Button size="sm" variant="outline" className="border-slate-700 text-slate-300">
                        Ir pro Login →
                      </Button>
                    </Link>
                    <Link href="/mobile/login">
                      <Button size="sm" variant="outline" className="border-sky-700 text-sky-300">
                        App Cliente →
                      </Button>
                    </Link>
                    <Link href="/motorista/login">
                      <Button size="sm" variant="outline" className="border-emerald-700 text-emerald-300">
                        App Motorista →
                      </Button>
                    </Link>
                    <Link href="/lojista/login">
                      <Button size="sm" variant="outline" className="border-amber-700 text-amber-300">
                        Painel Lojista →
                      </Button>
                    </Link>
                    <Link href="/admingeral/login">
                      <Button size="sm" variant="outline" className="border-slate-600 text-slate-200">
                        Admin Geral →
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer note */}
        <div className="text-center py-4">
          <p className="text-xs text-slate-600">
            Rota pública de diagnóstico — não expõe segredos, apenas presença/máscara das variáveis.
            <br />
            Em produção, considere proteger ou remover <code className="text-slate-500">/debug</code> após o deploy.
          </p>
        </div>
      </main>
    </div>
  )
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span
        className={`font-mono ${
          ok === undefined
            ? 'text-slate-300'
            : ok
              ? 'text-emerald-400'
              : 'text-red-400'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
