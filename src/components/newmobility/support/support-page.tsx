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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { formatDate, getStatusLabel, getStatusVariant, formatDateTime } from '@/lib/utils'
import {
  Headphones, Plus, MessageCircle, Clock, CheckCircle2, AlertCircle,
  Send, Filter, Mail, Phone, MessageSquare, HelpCircle, Zap, CreditCard,
  Smartphone, ShoppingBag, ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

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
    updatedAt: '2025-01-15T11:30:00Z',
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
    updatedAt: '2025-01-13T15:00:00Z',
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
    updatedAt: '2025-01-10T10:00:00Z',
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
    updatedAt: '2025-01-08T12:00:00Z',
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

const faqItems = [
  {
    question: 'Como funciona o CashBack Entrada 4x5?',
    answer: 'O CashBack Entrada 4x5 é calculado sobre as atividades dos seus 5 primeiros níveis de indicações. Cada nível gera uma porcentagem diferente de CashBack, variando conforme seu plano.',
  },
  {
    question: 'Como solicitar um saque?',
    answer: 'Acesse a seção Financeiro, clique em "Solicitar Saque" e informe o valor desejado. O valor mínimo para saque é R$ 50,00. O saque é processado em até 5 dias úteis na sua conta bancária cadastrada.',
  },
  {
    question: 'Qual a diferença entre os planos Blue 3 e Blue 5?',
    answer: 'O plano Blue 3 oferece CashBack Entrada e Residual com benefícios básicos. O Blue 5 Premium inclui CashBack Vendas (9 níveis), Portal Gamer, Sport Bet, seguros, telemedicina e muito mais.',
  },
  {
    question: 'Como usar meus vouchers?',
    answer: 'Na seção Voucher, copie o código do voucher ativo e use-o no app ou no parceiro correspondente. Vouchers de mobilidade são usados no app de corridas, vouchers de farmácia nas redes credenciadas.',
  },
  {
    question: 'Como acompanhar meu progresso na carreira?',
    answer: 'Acesse "Plano de Carreira" para ver sua patente atual, pontos acumulados e o que falta para o próximo nível. Você ganha pontos através de indicações, uso do app e pagamentos em dia.',
  },
]

const quickActions = [
  { icon: CreditCard, label: 'Problema com Saque', category: 'financial' },
  { icon: Smartphone, label: 'Problema no App', category: 'technical' },
  { icon: ShoppingBag, label: 'Voucher não funciona', category: 'shopping' },
  { icon: Zap, label: 'CashBack não creditado', category: 'financial' },
]

export function SupportPage() {
  const { toast } = useToast()
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [newTicketOpen, setNewTicketOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [newMessage, setNewMessage] = useState('')
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: '',
    priority: 'normal',
    message: '',
  })

  const filtered = mockTickets.filter((t) => {
    if (categoryFilter === 'all') return true
    return t.category === categoryFilter
  })

  const activeTicket = mockTickets.find((t) => t.id === selectedTicket)

  const handleQuickAction = (category: string) => {
    setNewTicket((prev) => ({ ...prev, category }))
    setNewTicketOpen(true)
  }

  const handleSubmitTicket = () => {
    if (!newTicket.subject || !newTicket.category || !newTicket.message) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' })
      return
    }
    setNewTicketOpen(false)
    setNewTicket({ subject: '', category: '', priority: 'normal', message: '' })
    toast({ title: 'Ticket criado com sucesso!', description: 'Nossa equipe responderá em breve.' })
  }

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
                <Input
                  placeholder="Descreva resumidamente seu problema"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket((prev) => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(v) => setNewTicket((prev) => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
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
                  <Label>Prioridade</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(v) => setNewTicket((prev) => ({ ...prev, priority: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  placeholder="Descreva seu problema em detalhes..."
                  rows={4}
                  value={newTicket.message}
                  onChange={(e) => setNewTicket((prev) => ({ ...prev, message: e.target.value }))}
                />
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleSubmitTicket}
              >
                Enviar Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handleQuickAction(action.category)}
            className="bg-white border border-gray-200 rounded-xl p-3 hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                <action.icon className="h-4 w-4" />
              </div>
              <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-emerald-600 ml-auto" />
            </div>
            <p className="text-xs font-medium text-gray-700">{action.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Contact Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: MessageSquare, title: 'Chat Online', desc: 'Atendimento em tempo real', detail: 'Disponível 9h-18h', color: 'bg-emerald-100 text-emerald-600' },
          { icon: Mail, title: 'E-mail', desc: 'suporte@newmobility.com.br', detail: 'Resposta em até 24h', color: 'bg-blue-100 text-blue-600' },
          { icon: Phone, title: 'Telefone', desc: '0800 123 4567', detail: 'Seg-Sex 8h-20h', color: 'bg-amber-100 text-amber-600' },
        ].map((contact, i) => (
          <motion.div key={contact.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
            <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`p-2.5 rounded-lg ${contact.color}`}>
                  <contact.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{contact.title}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">{contact.desc}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{contact.detail}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* FAQ */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-emerald-600" />
            Perguntas Frequentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm text-left hover:text-emerald-700">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600 pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Active Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Ticket List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Seus Tickets</h3>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 text-xs w-36">
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
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-[10px]">
                              {categoryLabels[ticket.category]}
                            </Badge>
                            <Badge variant={getStatusVariant(ticket.status)} className="text-[10px]">
                              {getStatusLabel(ticket.status)}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">
                            Atualizado: {ticket.updatedAt ? formatDateTime(ticket.updatedAt) : formatDate(ticket.createdAt)}
                          </p>
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
                <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    {categoryLabels[activeTicket.category]}
                  </Badge>
                  <span>Prioridade: {priorityLabels[activeTicket.priority]}</span>
                  <span>·</span>
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
                          {msg.isAdmin ? 'Atendimento' : 'Você'} · {formatDateTime(msg.date)}
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
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" size="icon">
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
