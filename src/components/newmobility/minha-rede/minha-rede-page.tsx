'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency, getPlanName, cn } from '@/lib/utils'
import {
  Users, UserCheck, Network, Search, ChevronDown, ChevronRight,
  ZoomIn, ZoomOut, Layers, Crown, UserPlus, Sparkles, AlertCircle,
  TrendingUp, Award, GitBranch, Mail, Calendar, Star
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'

type MatrixType = 'direta' | 'residual' | 'vendas'

interface TreeNode {
  id: string
  name: string
  email: string
  plan: string
  isActive: boolean
  referralCode: string | null
  profileImage: string | null
  stars: number
  createdAt: string
  level: number
  children: TreeNode[]
}

interface LevelInfo {
  level: number
  percentage: number
  capacity: number
  currentUsers: number
  fillPercentage: number
}

interface MinhaRedeData {
  type: string
  label: string
  maxDepth: number
  rootUser: {
    id: string
    name: string
    email: string
    plan: string
    referralCode: string
    stars: number
  }
  tree: TreeNode[]
  levels: LevelInfo[]
  totalUsers: number
  directReferrals: number
  maxMatrixSize: number
}

// ---------- helpers ----------
function countNodes(nodes: TreeNode[]): number {
  let count = 0
  for (const n of nodes) {
    count += 1
    count += countNodes(n.children)
  }
  return count
}

function collectAllIds(nodes: TreeNode[], set: Set<string>) {
  for (const n of nodes) {
    set.add(n.id)
    collectAllIds(n.children, set)
  }
}

function searchInTree(node: TreeNode, query: string): boolean {
  if (node.name.toLowerCase().includes(query.toLowerCase())) return true
  if (node.email?.toLowerCase().includes(query.toLowerCase())) return true
  return node.children.some(c => searchInTree(c, query))
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  } catch {
    return '-'
  }
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

// ---------- sub-component: pyramid node card ----------
function PyramidNodeCard({
  node,
  isRoot,
  isSelected,
  onSelect,
  searchQuery,
}: {
  node: TreeNode
  isRoot?: boolean
  isSelected: boolean
  onSelect: (node: TreeNode) => void
  searchQuery: string
}) {
  const matchesSearch = searchQuery
    ? node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.email?.toLowerCase().includes(searchQuery.toLowerCase())
    : false
  const statusColor = node.isActive
    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20'
    : 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10 opacity-70'

  return (
    <motion.button
      layout
      onClick={() => onSelect(node)}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'relative flex flex-col items-center gap-1 rounded-lg sm:rounded-xl border-2 px-2 sm:px-3 py-2 transition-all text-center min-w-[88px] sm:min-w-[110px] max-w-[130px] sm:max-w-[150px]',
        statusColor,
        isRoot && 'ring-2 ring-amber-400 shadow-lg shadow-amber-500/20',
        isSelected && 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20',
        matchesSearch && 'ring-2 ring-amber-400',
      )}
    >
      {isRoot && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Crown className="h-2 w-2" /> VOCÊ
        </span>
      )}
      <div className="relative">
        <Avatar className={cn('border-2', isRoot ? 'h-10 w-10 sm:h-12 sm:w-12 border-amber-400' : 'h-8 w-8 sm:h-9 sm:w-9 border-emerald-300 dark:border-emerald-700')}>
          <AvatarFallback className={cn(
            'text-xs font-bold',
            isRoot ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
          )}>
            {getInitials(node.name)}
          </AvatarFallback>
        </Avatar>
        {node.isActive && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-white dark:border-gray-900" />
        )}
      </div>
      <span className="text-[10px] sm:text-[11px] font-semibold text-foreground leading-tight line-clamp-2">
        {node.name}
      </span>
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0">
          {getPlanName(node.plan)}
        </Badge>
        {node.level > 0 && (
          <Badge className="text-[8px] h-3.5 px-1 py-0 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-0">
            N{node.level}
          </Badge>
        )}
      </div>
      {node.children.length > 0 && (
        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
          <GitBranch className="h-2.5 w-2.5" />
          {node.children.length} {node.children.length === 1 ? 'indicado' : 'indicados'}
        </span>
      )}
    </motion.button>
  )
}

// ---------- sub-component: recursive pyramid ----------
function PyramidLevel({
  nodes,
  expanded,
  toggleExpand,
  selectedId,
  onSelect,
  searchQuery,
  levelLabel,
}: {
  nodes: TreeNode[]
  expanded: Set<string>
  toggleExpand: (id: string) => void
  selectedId: string | null
  onSelect: (node: TreeNode) => void
  searchQuery: string
  levelLabel?: string
}) {
  if (nodes.length === 0) return null

  return (
    <div className="flex flex-col items-center">
      {levelLabel && (
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
          {levelLabel}
        </div>
      )}
      <div className="flex flex-wrap items-start justify-center gap-3 relative">
        {nodes.map(node => {
          const isExpanded = expanded.has(node.id)
          const hasChildren = node.children.length > 0
          const visibleBySearch = !searchQuery || searchInTree(node, searchQuery)
          if (!visibleBySearch) return null

          return (
            <motion.div
              key={node.id}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center"
            >
              <div className="relative flex flex-col items-center">
                <PyramidNodeCard
                  node={node}
                  isSelected={selectedId === node.id}
                  onSelect={onSelect}
                  searchQuery={searchQuery}
                />
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); toggleExpand(node.id) }}
                    className="mt-1 h-6 px-2 text-[10px] gap-1 rounded-full border border-emerald-300/50 bg-background/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {isExpanded ? 'Recolher' : `Ver ${node.children.length}`}
                  </Button>
                )}
              </div>

              {/* Vertical connector to children */}
              <AnimatePresence>
                {hasChildren && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden w-full"
                  >
                    {/* connector line */}
                    <div className="w-px h-4 bg-emerald-300/60 mx-auto" />
                    <div className="w-full p-3 mt-1 rounded-2xl border border-dashed border-emerald-300/40 bg-emerald-50/30 dark:bg-emerald-950/10">
                      <PyramidLevel
                        nodes={node.children}
                        expanded={expanded}
                        toggleExpand={toggleExpand}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        searchQuery={searchQuery}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ---------- main tree panel ----------
function MinhaRedeTreePanel({ type }: { type: MatrixType }) {
  const { user } = useStore()
  const { t } = useTranslation()
  const [data, setData] = useState<MinhaRedeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [zoom, setZoom] = useState(100)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    fetch(`/api/minha-rede/${type}?userId=${user.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
        // Auto-expand root's direct children for first view
        const initialExpanded = new Set<string>()
        ;(d.tree || []).forEach(n => initialExpanded.add(n.id))
        setExpanded(initialExpanded)
      })
      .catch(e => setError(e.message || 'Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [type, user?.id])

  const toggleExpand = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    if (!data) return
    const all = new Set<string>()
    collectAllIds(data.tree, all)
    setExpanded(all)
  }, [data])

  const collapseAll = useCallback(() => {
    setExpanded(new Set())
    setSelectedNode(null)
  }, [])

  // Level stats from current data
  const levelStats = useMemo(() => {
    if (!data) return []
    return data.levels
  }, [data])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20 sm:h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Erro ao carregar sua rede</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const totalCapacity = data.maxMatrixSize
  const fillPct = totalCapacity > 0 ? Math.min((data.totalUsers / totalCapacity) * 100, 100) : 0
  const activeMembers = (() => {
    let active = 0
    function walk(nodes: TreeNode[]) {
      for (const n of nodes) {
        if (n.isActive) active++
        walk(n.children)
      }
    }
    walk(data.tree)
    return active
  })()

  const inactiveMembers = data.totalUsers - activeMembers

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-background">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              <Badge variant="outline" className="text-[9px]">{data.label}</Badge>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground mt-2">{data.totalUsers}</p>
            <p className="text-[10px] text-muted-foreground">Total na sua rede</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground mt-2">{data.directReferrals}</p>
            <p className="text-[10px] text-muted-foreground">Indicações diretas (Nível 1)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground mt-2">{activeMembers}</p>
            <p className="text-[10px] text-muted-foreground">Membros ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              <span className="text-[10px] text-muted-foreground">{fillPct.toFixed(2)}%</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground mt-2">{data.totalUsers}<span className="text-xs sm:text-sm text-muted-foreground">/{totalCapacity.toLocaleString('pt-BR')}</span></p>
            <p className="text-[10px] text-muted-foreground">Vagas preenchidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Non-payers indicator — hidden for Residual matrix per user request */}
      {type !== 'residual' && (
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50/60 to-rose-50/30 dark:from-amber-950/20 dark:to-rose-950/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-xs sm:text-sm font-semibold">Status de Pagamento</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {data.totalUsers === 0 ? 'Sem dados' : `${data.totalUsers > 0 ? ((activeMembers / data.totalUsers) * 100).toFixed(0) : 0}% pagos`}
              </Badge>
            </div>
            {/* Stacked bar — paid vs non-payers */}
            <div className="flex h-3 w-full rounded-full overflow-hidden bg-muted">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                style={{ width: `${data.totalUsers > 0 ? (activeMembers / data.totalUsers) * 100 : 0}%` }}
                title={`${activeMembers} pagos`}
              />
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all"
                style={{ width: `${data.totalUsers > 0 ? (inactiveMembers / data.totalUsers) * 100 : 0}%` }}
                title={`${inactiveMembers} não pagos`}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                <span className="text-muted-foreground">Pagos:</span>
                <span className="font-bold text-emerald-600">{activeMembers}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
                <span className="text-muted-foreground">Não pagos:</span>
                <span className="font-bold text-amber-600">{inactiveMembers}</span>
              </div>
            </div>
            {inactiveMembers > 0 && (
              <p className="text-[10px] text-muted-foreground mt-2 italic leading-snug">
                {inactiveMembers} {inactiveMembers === 1 ? 'cadastro entrou na matriz mas ainda não ativou o pagamento' : 'cadastros entraram na matriz mas ainda não ativaram o pagamento'}. Quando ativarem, entrarão oficialmente na rede.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Level breakdown */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" />
              <span className="text-xs sm:text-sm font-semibold">Distribuição por Nível</span>
            </div>
            <Badge variant="outline" className="text-[10px]">{data.maxDepth} níveis</Badge>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {levelStats.map(lv => (
              <div
                key={lv.level}
                className="flex-shrink-0 min-w-[88px] sm:min-w-[100px] rounded-lg border border-border bg-muted/40 p-2 sm:p-2.5"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-muted-foreground">Nível {lv.level}</span>
                  <span className="text-[10px] text-emerald-600 font-bold">{lv.percentage}%</span>
                </div>
                <p className="text-base font-bold text-foreground leading-none">
                  {lv.currentUsers}
                  <span className="text-[10px] text-muted-foreground">/{lv.capacity}</span>
                </p>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                    style={{ width: `${lv.fillPercentage}%` }}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">{lv.fillPercentage.toFixed(1)}% preenchido</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tree visualization */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3 sm:mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pessoa na rede por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 sm:h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button variant="outline" size="sm" className="min-h-[44px] sm:min-h-0 h-11 sm:h-9 text-xs px-2 sm:px-3" onClick={expandAll}>
                <ChevronDown className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Expandir tudo</span>
              </Button>
              <Button variant="outline" size="sm" className="min-h-[44px] sm:min-h-0 h-11 sm:h-9 text-xs px-2 sm:px-3" onClick={collapseAll}>
                <ChevronRight className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Recolher tudo</span>
              </Button>
              <div className="flex items-center gap-1 border rounded-md px-2 h-11 sm:h-9">
                <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="text-muted-foreground hover:text-foreground p-1.5" aria-label="Diminuir zoom">
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-[10px] font-medium w-9 text-center tabular-nums">{zoom}%</span>
                <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="text-muted-foreground hover:text-foreground p-1.5" aria-label="Aumentar zoom">
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Pyramid Tree Container */}
          <div
            className="border border-border rounded-xl sm:rounded-2xl bg-gradient-to-b from-emerald-50/30 via-background to-background dark:from-emerald-950/10 overflow-auto custom-scrollbar min-h-[320px] sm:min-h-[400px] max-h-[70vh] p-2 sm:p-4"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {data.totalUsers === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center px-4">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mb-3">
                  <Network className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-foreground">Sua rede está vazia</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Comece a indicar pessoas usando seu código <Badge variant="secondary" className="font-mono ml-1">{data.rootUser.referralCode}</Badge> para preencher sua matriz {data.label.toLowerCase()}.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* Root user */}
                <PyramidNodeCard
                  node={{
                    ...data.rootUser,
                    isActive: true,
                    profileImage: null,
                    createdAt: new Date().toISOString(),
                    level: 0,
                    children: data.tree,
                  } as TreeNode}
                  isRoot
                  isSelected={selectedNode?.id === data.rootUser.id}
                  onSelect={setSelectedNode}
                  searchQuery={searchQuery}
                />
                <div className="w-px h-6 bg-emerald-300/60 my-1" />

                {/* Level 1+ */}
                <PyramidLevel
                  nodes={data.tree}
                  expanded={expanded}
                  toggleExpand={toggleExpand}
                  selectedId={selectedNode?.id || null}
                  onSelect={setSelectedNode}
                  searchQuery={searchQuery}
                  levelLabel={data.tree.length > 0 ? `Nível 1 — ${data.directReferrals}/${levelStats[0]?.capacity || 4} vagas` : undefined}
                />
              </div>
            )}
          </div>

          {/* Selected node details */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-3"
              >
                <div className="flex flex-col sm:flex-row items-start gap-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                  <Avatar className="h-11 w-11 sm:h-12 sm:w-12 border-2 border-emerald-300 dark:border-emerald-700 shrink-0">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm dark:bg-emerald-900/40 dark:text-emerald-300">
                      {getInitials(selectedNode.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground break-words">{selectedNode.name}</span>
                      <Badge variant="outline" className="text-[10px]">{getPlanName(selectedNode.plan)}</Badge>
                      {selectedNode.level > 0 && (
                        <Badge className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-0">Nível {selectedNode.level}</Badge>
                      )}
                      {selectedNode.isActive ? (
                        <Badge className="text-[10px] bg-emerald-500 border-0">Ativo</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">Inativo</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                      {selectedNode.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{selectedNode.email}</span>
                        </div>
                      )}
                      {selectedNode.referralCode && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Sparkles className="h-3 w-3" />
                          <span className="font-mono">{selectedNode.referralCode}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Entrou em {formatDate(selectedNode.createdAt)}</span>
                      </div>
                      {selectedNode.stars > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 text-amber-500" />
                          <span>{selectedNode.stars} estrelas</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <GitBranch className="h-3 w-3" />
                        <span>{selectedNode.children.length} indicados diretos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------- main page ----------
export function MinhaRedePage() {
  const { t } = useTranslation()
  const { user } = useStore()
  const [tab, setTab] = useState<MatrixType>('direta')

  const tabConfig: Record<MatrixType, { icon: any; color: string; bg: string; gradient: string; description: string }> = {
    direta: {
      icon: UserPlus,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500',
      gradient: 'from-emerald-500 to-emerald-600',
      description: 'Matriz de Entrada 4×5 — 5 níveis, até 1.364 vagas. Indicações diretas e indiretas da sua linha principal.',
    },
    residual: {
      icon: TrendingUp,
      color: 'text-teal-600',
      bg: 'bg-teal-500',
      gradient: 'from-teal-500 to-teal-600',
      description: 'Matriz Residual 4×7 — 7 níveis, até 21.844 vagas. Renda recorrente das indicações em todos os níveis.',
    },
    vendas: {
      icon: Award,
      color: 'text-amber-600',
      bg: 'bg-amber-500',
      gradient: 'from-amber-500 to-amber-600',
      description: 'Matriz de Vendas 4×9 — 9 níveis, até 349.524 vagas. Cashback das compras realizadas pela sua rede.',
    },
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
            <Network className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              {t('sidebar.minha-rede')}
              <Badge className="bg-rose-500 text-white text-[9px] px-1.5 h-4 border-0 animate-bounce-subtle">NOVO</Badge>
            </h1>
            <p className="text-xs text-muted-foreground">
              Visualize sua rede em formato de pirâmide para cada matriz
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as MatrixType)} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-xl h-auto gap-1 p-1">
          {(Object.keys(tabConfig) as MatrixType[]).map(key => {
            const cfg = tabConfig[key]
            const Icon = cfg.icon
            return (
              <TabsTrigger
                key={key}
                value={key}
                className={cn(
                  'flex flex-col items-center gap-1 min-h-[44px] py-2 sm:py-2 data-[state=active]:bg-gradient-to-b data-[state=active]:text-white',
                  tab === key && cfg.gradient
                )}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-[10px] sm:text-xs font-semibold capitalize">
                  {key === 'direta' ? 'Direta' : key === 'residual' ? 'Residual' : 'Vendas'}
                </span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Description banner */}
        <div className={cn(
          'rounded-xl border p-2.5 sm:p-3 bg-gradient-to-r text-white shadow-md',
          tabConfig[tab].gradient
        )}>
          <div className="flex items-start gap-2 sm:gap-3">
            {(() => {
              const Icon = tabConfig[tab].icon
              return <Icon className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 shrink-0" />
            })()}
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold">{tabConfig[tab].description.split('—')[0].trim()}</p>
              <p className="text-[11px] sm:text-xs text-white/90 mt-0.5">{tabConfig[tab].description.split('—')[1]?.trim()}</p>
            </div>
          </div>
        </div>

        {(Object.keys(tabConfig) as MatrixType[]).map(key => (
          <TabsContent key={key} value={key} className="mt-4">
            {tab === key && <MinhaRedeTreePanel type={key} />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
