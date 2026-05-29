'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatDate, getStatusLabel, getStatusVariant } from '@/lib/utils'
import {
  Headphones,
  Plus,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Filter,
} from 'lucide-react'
import { motion } from 'framer-motion'

const mockTickets = [
  {
    id: '1',
    subject: 'Problema com saque',
    category: 'financial',
    status: 'open',
    priority: 'high',
    messages: [
      { id: '1', message: 'Não consigo solicitar saque há 3 dias. O botão está desabilitado.', isAdmin: false, date: '2025-01-15T10:00:00Z' },
      { id: '2', message: 'Olá! Vamos verificar seu caso. Pode nos informar o valor que tentou sacar?', isAdmin: true, date: '2025-01-15T11:30:00Z' },
    ],
    createdAt: '2025-01-15',
  },
  {
    id: '2',
    subject: 'App não funciona no Android',
    category: 'technical',
    status: 'in_progress',
    priority: 'normal',
    messages: [
      { id: '3', message: 'O app fecha sozinho quando tento abrir o mapa.', isAdmin: false, date: '2025-01-13T09:00:00Z' },
      { id: '4', message: 'Nossa equipe técnica está investigando. Qual modelo do seu celular?', isAdmin: true, date: '2025-01-13T14:00:00Z' },
      { id: '5', message: 'Samsung Galaxy A54, Android 14.', isAdmin: false, date: '2025-01-13T15:00:00Z' },
    ],
    createdAt: '2025-01-13',
  },
  {
    id: '3',
    subject: 'Dúvida sobre CashBack Residual',
    category: 'support',
    status: 'resolved',
    priority: 'normal',
    messages: [
      { id: '6', message: 'Como funciona o CashBack Residual?', isAdmin: false, date: '2025-01-10T08:00:00Z' },
      { id: '7', message: 'O CashBack Residual é gerado a partir das atividades da sua rede. Cada nível tem uma porcentagem diferente.', isAdmin: true, date: '2025-01-10T10:00:00Z' },
    ],
    createdAt: '2025-01-10',
  },
  {
    id: '4',
    subject: 'Voucher não aplicado',
    category: 'shopping',
    status: 'closed',
    priority: 'low',
    messages: [
      { id: '8', message: 'Tentei usar um voucher mas não foi aplicado o desconto.', isAdmin: false, date: '2025-01-08T12:00:00Z' },
    ],
    createdAt: '2025-01-08',
  },
]

const categoryLabels: Record<string, string> = {
  support: 'Suporte',
  financial: 'Financeiro',
  technical: 'Técnico',
  mobility: 'Mobilidade',
  shopping: 'Compras',
  food: 'Refeição',
  pharmacy: 'Farmácia',
}

const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
}

const statusIcons: Record<string, React.ElementType> = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle2,
  closed: CheckCircle2,
}

export function SupportPage() {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [newTicketOpen, setNewTicketOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [newMessage, setNewMessage] = useState('')

  const filtered = mockTickets.filter((t) => {
    if (categoryFilter === 'all') return true
    return t.category === categoryFilter
  })

  const activeTicket = mockTickets.find((t) => t.id === selectedTicket)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Suporte</h2>
          <p className="text-sm text-gray-500">Gerencie seus tickets de suporte</p>
        </div>
        <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="h-4 w-4" />
              Novo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Assunto</Label>
                <Input placeholder="Descreva resumidamente seu problema" />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="support">Suporte</SelectItem>
                    <SelectItem value="financial">Financeiro</SelectItem>
                    <SelectItem value="technical">Técnico</SelectItem>
                    <SelectItem value="mobility">Mobilidade</SelectItem>
                    <SelectItem value="shopping">Compras</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea placeholder="Descreva seu problema em detalhes..." rows={4} />
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setNewTicketOpen(false)}
              >
                Enviar Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Ticket List */}
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                <SelectItem value="support">Suporte</SelectItem>
                <SelectItem value="financial">Financeiro</SelectItem>
                <SelectItem value="technical">Técnico</SelectItem>
                <SelectItem value="shopping">Compras</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y max-h-[500px] overflow-y-auto custom-scrollbar">
                {filtered.map((ticket, i) => {
                  const StatusIcon = statusIcons[ticket.status] || Clock
                  return (
                    <motion.button
                      key={ticket.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedTicket(ticket.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                        selectedTicket === ticket.id ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <StatusIcon className={`h-4 w-4 mt-0.5 shrink-0 ${
                          ticket.status === 'open' ? 'text-amber-500' :
                          ticket.status === 'in_progress' ? 'text-blue-500' :
                          'text-emerald-500'
                        }`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px]">
                              {categoryLabels[ticket.category]}
                            </Badge>
                            <Badge variant={getStatusVariant(ticket.status)} className="text-[10px]">
                              {getStatusLabel(ticket.status)}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(ticket.createdAt)}</p>
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-3">
          {activeTicket ? (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">{activeTicket.subject}</CardTitle>
                  <Badge variant={getStatusVariant(activeTicket.status)}>
                    {getStatusLabel(activeTicket.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Badge variant="outline" className="text-[10px]">
                    {categoryLabels[activeTicket.category]}
                  </Badge>
                  <span>Prioridade: {priorityLabels[activeTicket.priority]}</span>
                  <span>•</span>
                  <span>{formatDate(activeTicket.createdAt)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar mb-4">
                  {activeTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                          msg.isAdmin
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${
                          msg.isAdmin ? 'text-gray-500' : 'text-emerald-200'
                        }`}>
                          {msg.isAdmin ? 'Atendimento' : 'Você'} • {formatDate(msg.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {activeTicket.status !== 'closed' && activeTicket.status !== 'resolved' && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="p-12 text-center">
                <Headphones className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Selecione um ticket para ver os detalhes</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
