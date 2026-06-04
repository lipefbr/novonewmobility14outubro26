'use client'

import { useState, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { formatCurrency, cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Wrench, Star, MapPin, Plus, Filter, Search, Clock, Users,
  ChevronRight, Phone, Heart, MessageSquare
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// --- Types ---

interface ServiceItem {
  id: string
  providerId: string
  providerName: string
  name: string
  description: string
  category: ServiceCategory
  price: number
  location: string
  rating: number
  reviewCount: number
  phone: string
  isAvailable: boolean
  isFavorite: boolean
  createdAt: string
}

type ServiceCategory = 'construção' | 'manutenção' | 'limpeza' | 'transporte' | 'tecnologia' | 'outros'

// --- Category Config ---

const categories: { id: ServiceCategory | 'all'; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'Todos', icon: Filter },
  { id: 'construção', label: 'Construção', icon: Wrench },
  { id: 'manutenção', label: 'Manutenção', icon: Wrench },
  { id: 'limpeza', label: 'Limpeza', icon: Wrench },
  { id: 'transporte', label: 'Transporte', icon: Wrench },
  { id: 'tecnologia', label: 'Tecnologia', icon: Wrench },
  { id: 'outros', label: 'Outros', icon: Wrench },
]

const categoryColors: Record<ServiceCategory, string> = {
  construção: 'from-amber-500 to-orange-500',
  manutenção: 'from-blue-500 to-cyan-500',
  limpeza: 'from-teal-500 to-emerald-500',
  transporte: 'from-purple-500 to-violet-500',
  tecnologia: 'from-sky-500 to-blue-500',
  outros: 'from-gray-500 to-slate-500',
}

const categoryIcons: Record<ServiceCategory, string> = {
  construção: '🏗️',
  manutenção: '🔧',
  limpeza: '🧹',
  transporte: '🚗',
  tecnologia: '💻',
  outros: '📦',
}

const categoryBadgeStyles: Record<ServiceCategory, string> = {
  construção: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  manutenção: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  limpeza: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  transporte: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  tecnologia: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  outros: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

// --- Mock Data ---

const mockServices: ServiceItem[] = [
  {
    id: 'srv_01',
    providerId: 'usr_lojista01',
    providerName: 'João Pedreiro',
    name: 'Pedreiro Profissional',
    description: 'Serviços de alvenaria, acabamento e construção em geral. Mais de 15 anos de experiência.',
    category: 'construção',
    price: 15000,
    location: 'São Paulo, SP',
    rating: 4.8,
    reviewCount: 42,
    phone: '(11) 99876-1234',
    isAvailable: true,
    isFavorite: false,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'srv_02',
    providerId: 'usr_lojista02',
    providerName: 'Maria Pintora',
    name: 'Pintura Residencial e Comercial',
    description: 'Pintura interna e externa, texturas e efeitos decorativos. Orçamento sem compromisso.',
    category: 'construção',
    price: 12000,
    location: 'Rio de Janeiro, RJ',
    rating: 4.6,
    reviewCount: 28,
    phone: '(21) 98765-4321',
    isAvailable: true,
    isFavorite: false,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'srv_03',
    providerId: 'usr_lojista03',
    providerName: 'Carlos Eletricista',
    name: 'Eletricista Certificado',
    description: 'Instalação elétrica, manutenção preventiva e corretiva. NR10 certificado.',
    category: 'manutenção',
    price: 18000,
    location: 'Belo Horizonte, MG',
    rating: 4.9,
    reviewCount: 56,
    phone: '(31) 97654-3210',
    isAvailable: true,
    isFavorite: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'srv_04',
    providerId: 'usr_lojista04',
    providerName: 'Ana Encanadora',
    name: 'Encanador 24h',
    description: 'Reparos hidráulicos, detecção de vazamentos, instalação de torneiras e válvulas.',
    category: 'manutenção',
    price: 13000,
    location: 'Curitiba, PR',
    rating: 4.5,
    reviewCount: 33,
    phone: '(41) 96543-2109',
    isAvailable: true,
    isFavorite: false,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'srv_05',
    providerId: 'usr_motorista01',
    providerName: 'Roberto Motorista',
    name: 'Motorista Particular',
    description: 'Motorista com carteira E, viagens longas e curtas, disponível finais de semana.',
    category: 'transporte',
    price: 25000,
    location: 'São Paulo, SP',
    rating: 4.7,
    reviewCount: 19,
    phone: '(11) 95432-1098',
    isAvailable: true,
    isFavorite: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'srv_06',
    providerId: 'usr_lojista05',
    providerName: 'Fernanda Diarista',
    name: 'Diarista Profissional',
    description: 'Limpeza residencial e comercial. Organização e cuidados especiais com seus ambientes.',
    category: 'limpeza',
    price: 8000,
    location: 'Salvador, BA',
    rating: 4.4,
    reviewCount: 61,
    phone: '(71) 94321-0987',
    isAvailable: true,
    isFavorite: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'srv_07',
    providerId: 'usr_lojista06',
    providerName: 'Pedro Mecânico',
    name: 'Mecânica Automotiva',
    description: 'Reparos em geral, troca de óleo, alinhamento, balanceamento e revisão completa.',
    category: 'manutenção',
    price: 20000,
    location: 'Porto Alegre, RS',
    rating: 4.3,
    reviewCount: 37,
    phone: '(51) 93210-9876',
    isAvailable: true,
    isFavorite: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'srv_08',
    providerId: 'usr_lojista07',
    providerName: 'Lucas Tech',
    name: 'Suporte de Informática',
    description: 'Formatação, instalação de programas, rede, backup e recuperação de dados.',
    category: 'tecnologia',
    price: 10000,
    location: 'Brasília, DF',
    rating: 4.6,
    reviewCount: 24,
    phone: '(61) 92109-8765',
    isAvailable: true,
    isFavorite: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'srv_09',
    providerId: 'usr_motorista02',
    providerName: 'Marcos Frete',
    name: 'Frete e Mudança',
    description: 'Transporte de móveis, eletrodomésticos e cargas em geral. Caminhão baú disponível.',
    category: 'transporte',
    price: 35000,
    location: 'Recife, PE',
    rating: 4.2,
    reviewCount: 15,
    phone: '(81) 91098-7654',
    isAvailable: true,
    isFavorite: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'srv_10',
    providerId: 'usr_lojista08',
    providerName: 'Juliana Eventos',
    name: 'Decoração para Festas',
    description: 'Decoração de festas infantis, casamentos e eventos corporativos. Personalizado.',
    category: 'outros',
    price: 45000,
    location: 'Fortaleza, CE',
    rating: 4.9,
    reviewCount: 48,
    phone: '(85) 90987-6543',
    isAvailable: false,
    isFavorite: false,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
]

// --- Component ---

export function ServicesPage() {
  const { user } = useStore()
  const isProvider = user?.userType === 'lojista' || user?.userType === 'motorista'

  const [services, setServices] = useState<ServiceItem[]>(mockServices)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const [showHireDialog, setShowHireDialog] = useState(false)

  // New service form state
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    category: '' as ServiceCategory | '',
    price: '',
    location: '',
  })

  // Filter services
  const filteredServices = useMemo(() => {
    let result = services

    if (selectedCategory !== 'all') {
      result = result.filter(s => s.category === selectedCategory)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.providerName.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q)
      )
    }

    return result
  }, [services, selectedCategory, search])

  // My services (for providers)
  const myServices = useMemo(() => {
    if (!isProvider || !user) return []
    return services.filter(s => s.providerId === user.id)
  }, [services, isProvider, user])

  const handleAddService = () => {
    if (!newService.name || !newService.category || !newService.price || !newService.location) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const priceValue = Math.round(parseFloat(newService.price.replace(',', '.')) * 100)
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error('Preço inválido')
      return
    }

    const service: ServiceItem = {
      id: `srv_${Date.now()}`,
      providerId: user!.id,
      providerName: user!.name,
      name: newService.name,
      description: newService.description,
      category: newService.category as ServiceCategory,
      price: priceValue,
      location: newService.location,
      rating: 0,
      reviewCount: 0,
      phone: user!.phone || '',
      isAvailable: true,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    }

    setServices(prev => [service, ...prev])
    setShowAddDialog(false)
    setNewService({ name: '', description: '', category: '', price: '', location: '' })
    toast.success('Serviço adicionado com sucesso!')
  }

  const handleToggleFavorite = (serviceId: string) => {
    setServices(prev =>
      prev.map(s =>
        s.id === serviceId ? { ...s, isFavorite: !s.isFavorite } : s
      )
    )
  }

  const handleHire = (service: ServiceItem) => {
    setSelectedService(service)
    setShowHireDialog(true)
  }

  const confirmHire = () => {
    if (!selectedService) return
    toast.success(`Solicitação enviada para ${selectedService.providerName}! Você receberá uma confirmação em breve.`)
    setShowHireDialog(false)
    setSelectedService(null)
  }

  const handleRemoveService = (serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId))
    toast.success('Serviço removido com sucesso!')
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          'h-3.5 w-3.5',
          i < Math.floor(rating)
            ? 'text-amber-400 fill-amber-400'
            : i < rating
              ? 'text-amber-400 fill-amber-200'
              : 'text-gray-300 dark:text-gray-600'
        )}
      />
    ))
  }

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Hoje'
    if (days === 1) return 'Ontem'
    if (days < 7) return `${days} dias atrás`
    if (days < 30) return `${Math.floor(days / 7)} semanas atrás`
    return `${Math.floor(days / 30)} meses atrás`
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 animate-gradient-shift relative">
            <div className="absolute inset-0 animate-shimmer" />
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            <CardContent className="p-5 md:p-6 relative">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-white">
                  <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    <Wrench className="h-7 w-7" />
                    Serviços
                  </h2>
                  <p className="text-sm text-emerald-100 mt-1">
                    Encontre profissionais qualificados ou ofereça seus serviços na rede NewMobility
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2">
                    <Users className="h-4 w-4 text-yellow-300" />
                    <span className="text-sm font-bold text-white">{services.length}</span>
                    <span className="text-xs text-emerald-100">serviços</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2">
                    <Star className="h-4 w-4 text-yellow-300" />
                    <span className="text-xs text-emerald-100">
                      {services.filter(s => s.rating >= 4.5).length} destaque
                    </span>
                  </div>
                  {isProvider && (
                    <Button
                      className="bg-white text-emerald-700 hover:bg-emerald-50 gap-1.5 font-semibold shadow-md"
                      onClick={() => setShowAddDialog(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Serviço
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* My Services Section (Providers only) */}
      {isProvider && myServices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-semibold text-foreground">Meus Serviços</h2>
                <Badge variant="secondary" className="text-[10px]">{myServices.length}</Badge>
              </div>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myServices.map((service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <Card className="group border hover:shadow-md transition-all hover:border-emerald-300 dark:hover:border-emerald-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn(
                            'w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0',
                            categoryColors[service.category]
                          )}>
                            <span className="text-base">{categoryIcons[service.category]}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{service.name}</p>
                            <Badge className={cn('text-[9px] px-1.5 py-0 h-4 border-0', categoryBadgeStyles[service.category])}>
                              {service.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {service.rating > 0 ? (
                            <>
                              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                              <span className="text-xs font-medium text-foreground">{service.rating}</span>
                            </>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Sem avaliações</span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                        {service.description}
                      </p>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(service.price)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[9px] h-5',
                              service.isAvailable
                                ? 'border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400'
                                : 'border-red-300 text-red-600 dark:border-red-700 dark:text-red-400'
                            )}
                          >
                            {service.isAvailable ? 'Disponível' : 'Indisponível'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-500"
                            onClick={() => handleRemoveService(service.id)}
                          >
                            <Plus className="h-3.5 w-3.5 rotate-45" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Search & Category Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="space-y-3"
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços, profissionais ou localidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="shadow-sm">
            <CardContent className="p-12 text-center">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">Nenhum serviço encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros ou buscar por outro termo</p>
              {isProvider && (
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Serviço
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <Card className="group cursor-pointer overflow-hidden border hover:shadow-lg transition-all hover:border-emerald-300 dark:hover:border-emerald-700 h-full flex flex-col">
                  <CardContent className="p-0 flex flex-col flex-1">
                    {/* Service Category Header */}
                    <div className={cn(
                      'h-2 bg-gradient-to-r',
                      categoryColors[service.category]
                    )} />

                    <div className="p-4 flex flex-col flex-1">
                      {/* Provider + Favorite */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn(
                            'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-sm',
                            categoryColors[service.category]
                          )}>
                            <span className="text-lg">{categoryIcons[service.category]}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {service.providerName}
                            </p>
                            <Badge className={cn('text-[9px] px-1.5 py-0 h-4 border-0 mt-0.5', categoryBadgeStyles[service.category])}>
                              {service.category}
                            </Badge>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleFavorite(service.id)
                          }}
                          className="shrink-0 p-1 rounded-full hover:bg-muted/50 transition-colors"
                        >
                          <Heart
                            className={cn(
                              'h-4 w-4 transition-colors',
                              service.isFavorite
                                ? 'text-red-500 fill-red-500'
                                : 'text-muted-foreground hover:text-red-400'
                            )}
                          />
                        </button>
                      </div>

                      {/* Service Name */}
                      <h3 className="text-sm font-bold text-foreground mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {service.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {service.description}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="flex items-center gap-0.5">
                          {renderStars(service.rating)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {service.rating > 0 ? `${service.rating} (${service.reviewCount})` : 'Novo'}
                        </span>
                      </div>

                      {/* Location & Time */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{service.location}</span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(service.createdAt)}
                        </span>
                      </div>

                      {/* Spacer to push bottom down */}
                      <div className="flex-1" />

                      {/* Price & Action */}
                      <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                        <div>
                          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(service.price)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">por serviço</p>
                        </div>
                        <Button
                          size="sm"
                          className={cn(
                            'text-xs h-8 gap-1.5',
                            service.isAvailable
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-muted text-muted-foreground cursor-not-allowed'
                          )}
                          disabled={!service.isAvailable}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (service.isAvailable) handleHire(service)
                          }}
                        >
                          {service.isAvailable ? (
                            <>
                              Contratar
                              <ChevronRight className="h-3.5 w-3.5" />
                            </>
                          ) : (
                            'Indisponível'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Service Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogDescription className="sr-only">Adicionar novo serviço</DialogDescription>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              Adicionar Serviço
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Service Name */}
            <div className="space-y-1.5">
              <Label htmlFor="service-name" className="text-sm font-medium">Nome do Serviço *</Label>
              <Input
                id="service-name"
                placeholder="Ex: Pedreiro Profissional"
                value={newService.name}
                onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="service-desc" className="text-sm font-medium">Descrição</Label>
              <Input
                id="service-desc"
                placeholder="Descreva o serviço que você oferece..."
                value={newService.description}
                onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Categoria *</Label>
              <Select
                value={newService.category}
                onValueChange={(value) => setNewService(prev => ({ ...prev, category: value as ServiceCategory }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="construção">🏗️ Construção</SelectItem>
                  <SelectItem value="manutenção">🔧 Manutenção</SelectItem>
                  <SelectItem value="limpeza">🧹 Limpeza</SelectItem>
                  <SelectItem value="transporte">🚗 Transporte</SelectItem>
                  <SelectItem value="tecnologia">💻 Tecnologia</SelectItem>
                  <SelectItem value="outros">📦 Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price & Location */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="service-price" className="text-sm font-medium">Preço (R$) *</Label>
                <Input
                  id="service-price"
                  placeholder="Ex: 150,00"
                  value={newService.price}
                  onChange={(e) => setNewService(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="service-location" className="text-sm font-medium">Localização *</Label>
                <Input
                  id="service-location"
                  placeholder="Ex: São Paulo, SP"
                  value={newService.location}
                  onChange={(e) => setNewService(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddDialog(false)
                  setNewService({ name: '', description: '', category: '', price: '', location: '' })
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleAddService}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hire Service Dialog */}
      <Dialog open={showHireDialog} onOpenChange={setShowHireDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogDescription className="sr-only">Contratar serviço</DialogDescription>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-emerald-500" />
              Contratar Serviço
            </DialogTitle>
          </DialogHeader>

          {selectedService && (
            <div className="space-y-4">
              {/* Service Summary */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0',
                    categoryColors[selectedService.category]
                  )}>
                    <span className="text-xl">{categoryIcons[selectedService.category]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedService.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedService.providerName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {renderStars(selectedService.rating)}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({selectedService.reviewCount})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    Localização
                  </span>
                  <span className="font-medium text-foreground">{selectedService.location}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Telefone
                  </span>
                  <span className="font-medium text-foreground">{selectedService.phone}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Avaliações
                  </span>
                  <span className="font-medium text-foreground">{selectedService.reviewCount} avaliações</span>
                </div>
              </div>

              {/* Description */}
              {selectedService.description && (
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {selectedService.description}
                </p>
              )}

              {/* Price */}
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Valor do serviço</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedService.price)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowHireDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={confirmHire}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Confirmar Contratação
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
