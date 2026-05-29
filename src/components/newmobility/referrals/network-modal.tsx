'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency, getPlanName } from '@/lib/utils'
import {
  Search, Users, DollarSign, TrendingUp, ChevronDown, ChevronRight,
  ZoomIn, ZoomOut, Maximize2, UserCheck, Award
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface TreeNode {
  id: string
  name: string
  plan: string
  status: 'active' | 'inactive'
  level: number
  cashback: number
  children: TreeNode[]
}

const mockTreeData: TreeNode = {
  id: 'root',
  name: 'Carlos Eduardo Silva',
  plan: 'blue5',
  status: 'active',
  level: 0,
  cashback: 1250000,
  children: [
    {
      id: '1', name: 'Ana Paula Santos', plan: 'blue5', status: 'active', level: 1, cashback: 234000,
      children: [
        { id: '5', name: 'Lucas Mendes', plan: 'blue3', status: 'active', level: 2, cashback: 67000, children: [
          { id: '11', name: 'Diego Martins', plan: 'blue3', status: 'active', level: 3, cashback: 95000, children: [] },
        ] },
        { id: '6', name: 'Fernanda Oliveira', plan: 'blue3', status: 'active', level: 2, cashback: 156000, children: [] },
        { id: '7', name: 'Ricardo Souza', plan: 'blue5', status: 'active', level: 2, cashback: 312000, children: [
          { id: '12', name: 'Elisa Barbosa', plan: 'blue5', status: 'active', level: 3, cashback: 445000, children: [] },
          { id: '15', name: 'Marcos Ribeiro', plan: 'blue3', status: 'active', level: 3, cashback: 50000, children: [] },
        ] },
      ]
    },
    {
      id: '2', name: 'Roberto Ferreira', plan: 'blue3', status: 'active', level: 1, cashback: 89000,
      children: [
        { id: '8', name: 'Patricia Alves', plan: 'free', status: 'inactive', level: 2, cashback: 12000, children: [] },
      ]
    },
    {
      id: '3', name: 'Maria Clara Costa', plan: 'blue5', status: 'active', level: 1, cashback: 234000,
      children: [
        { id: '9', name: 'Bruno Carvalho', plan: 'blue3', status: 'active', level: 2, cashback: 78000, children: [] },
        { id: '10', name: 'Camila Rodrigues', plan: 'blue5', status: 'active', level: 2, cashback: 198000, children: [
          { id: '16', name: 'Juliana Santos', plan: 'blue5', status: 'active', level: 3, cashback: 88000, children: [] },
        ] },
      ]
    },
    {
      id: '4', name: 'João Pedro Lima', plan: 'blue3', status: 'inactive', level: 1, cashback: 45000,
      children: []
    },
    {
      id: '13', name: 'Thiago Nascimento', plan: 'blue3', status: 'active', level: 1, cashback: 32000,
      children: []
    },
    {
      id: '14', name: 'Carla Ferreira', plan: 'blue5', status: 'active', level: 1, cashback: 15000,
      children: []
    },
  ]
}

function countNodes(node: TreeNode): number {
  let count = 1
  for (const child of node.children) {
    count += countNodes(child)
  }
  return count
}

function getLevelStats(node: TreeNode, levelMap: Map<number, { users: number; earnings: number }> = new Map()) {
  const existing = levelMap.get(node.level) || { users: 0, earnings: 0 }
  levelMap.set(node.level, {
    users: existing.users + 1,
    earnings: existing.earnings + node.cashback,
  })
  for (const child of node.children) {
    getLevelStats(child, levelMap)
  }
  return levelMap
}

function searchTree(node: TreeNode, query: string): boolean {
  if (node.name.toLowerCase().includes(query.toLowerCase())) return true
  return node.children.some(child => searchTree(child, query))
}

function TreeNodeView({
  node,
  depth,
  expanded,
  toggleExpand,
  searchQuery,
  selectedId,
  onSelect,
}: {
  node: TreeNode
  depth: number
  expanded: Set<string>
  toggleExpand: (id: string) => void
  searchQuery: string
  selectedId: string | null
  onSelect: (node: TreeNode) => void
}) {
  const isExpanded = expanded.has(node.id)
  const hasChildren = node.children.length > 0
  const matchesSearch = searchQuery ? searchTree(node, searchQuery) : true
  const isDirectMatch = node.name.toLowerCase().includes(searchQuery.toLowerCase())

  if (!matchesSearch) return null

  const statusColor = node.status === 'active'
    ? 'border-emerald-300 dark:border-emerald-700'
    : 'border-red-200 dark:border-red-800 opacity-60'

  return (
    <div className="ml-0">
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${isDirectMatch && searchQuery ? 'bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-300' : ''} ${selectedId === node.id ? 'bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-300' : ''}`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); toggleExpand(node.id) }}
            className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-4.5 shrink-0" />
        )}
        <Avatar className="h-7 w-7 border shrink-0">
          <AvatarFallback className={`text-[9px] font-medium ${statusColor}`}>
            {node.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-foreground truncate block">{node.name}</span>
        </div>
        <Badge variant="outline" className="text-[9px] shrink-0">{getPlanName(node.plan)}</Badge>
        {node.level > 0 && (
          <span className="text-[9px] text-muted-foreground shrink-0">N{node.level}</span>
        )}
      </div>
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {node.children.map(child => (
              <TreeNodeView
                key={child.id}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                toggleExpand={toggleExpand}
                searchQuery={searchQuery}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface NetworkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NetworkModal({ open, onOpenChange }: NetworkModalProps) {
  const { t } = useTranslation()
  const { user } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']))
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [zoom, setZoom] = useState(100)

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => {
    const allIds = new Set<string>()
    const collect = (node: TreeNode) => {
      allIds.add(node.id)
      node.children.forEach(collect)
    }
    collect(mockTreeData)
    setExpanded(allIds)
  }

  const collapseAll = () => {
    setExpanded(new Set(['root']))
    setSelectedNode(null)
  }

  const levelStats = useMemo(() => {
    const stats = getLevelStats(mockTreeData)
    stats.delete(0) // Remove root level
    return Array.from(stats.entries())
      .sort(([a], [b]) => a - b)
      .map(([level, data]) => ({ level, ...data }))
  }, [])

  const totalNetwork = countNodes(mockTreeData) - 1 // Exclude root
  const totalEarnings = levelStats.reduce((acc, l) => acc + l.earnings, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            {t('network.title')}
          </DialogTitle>
          <DialogDescription className="sr-only">Full network tree visualization with level statistics</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Search + Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('network.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="text-xs h-9" onClick={expandAll}>
                {t('network.expandAll')}
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-9" onClick={collapseAll}>
                {t('network.collapseAll')}
              </Button>
              <div className="flex items-center gap-1 border rounded-md px-2 h-9">
                <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="text-muted-foreground hover:text-foreground">
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="text-[10px] font-medium w-8 text-center">{zoom}%</span>
                <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="text-muted-foreground hover:text-foreground">
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Level Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Card className="shadow-none">
              <CardContent className="p-2.5 text-center">
                <Users className="h-4 w-4 text-emerald-600 mx-auto mb-0.5" />
                <p className="text-lg font-bold text-foreground">{totalNetwork}</p>
                <p className="text-[9px] text-muted-foreground">{t('network.totalMembers')}</p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-2.5 text-center">
                <UserCheck className="h-4 w-4 text-teal-600 mx-auto mb-0.5" />
                <p className="text-lg font-bold text-foreground">{levelStats.reduce((a, l) => a + l.users, 0)}</p>
                <p className="text-[9px] text-muted-foreground">{t('network.activeMembers')}</p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-2.5 text-center">
                <DollarSign className="h-4 w-4 text-amber-600 mx-auto mb-0.5" />
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalEarnings)}</p>
                <p className="text-[9px] text-muted-foreground">{t('network.totalEarnings')}</p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-2.5 text-center">
                <Award className="h-4 w-4 text-purple-600 mx-auto mb-0.5" />
                <p className="text-lg font-bold text-foreground">{levelStats.length}</p>
                <p className="text-[9px] text-muted-foreground">{t('network.levels')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Level Breakdown */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {levelStats.map(lv => (
              <div key={lv.level} className="flex-shrink-0 bg-muted/50 rounded-lg px-3 py-1.5 text-center border border-border">
                <p className="text-[9px] text-muted-foreground">{t('network.level')} {lv.level}</p>
                <p className="text-sm font-bold text-foreground">{lv.users}</p>
                <p className="text-[9px] text-emerald-600">{formatCurrency(lv.earnings)}</p>
              </div>
            ))}
          </div>

          {/* Tree View */}
          <div className="flex-1 border border-border rounded-xl overflow-y-auto custom-scrollbar bg-muted/20" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
            <TreeNodeView
              node={mockTreeData}
              depth={0}
              expanded={expanded}
              toggleExpand={toggleExpand}
              searchQuery={searchQuery}
              selectedId={selectedNode?.id || null}
              onSelect={setSelectedNode}
            />
          </div>

          {/* Selected Node Details */}
          <AnimatePresence>
            {selectedNode && selectedNode.id !== 'root' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                  <Avatar className="h-10 w-10 border-2 border-emerald-200 dark:border-emerald-700">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm dark:bg-emerald-900/40 dark:text-emerald-400">
                      {selectedNode.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{selectedNode.name}</span>
                      <Badge variant="outline" className="text-[9px]">{getPlanName(selectedNode.plan)}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">{t('network.level')} {selectedNode.level}</span>
                      <span className="text-xs text-emerald-600 font-medium">{formatCurrency(selectedNode.cashback)}</span>
                      <span className="text-xs text-muted-foreground">{selectedNode.children.length} {t('network.directReferrals')}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
