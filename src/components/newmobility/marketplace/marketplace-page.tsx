'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Search, ShoppingCart, Star, Tag, Heart, Package, Truck, CreditCard,
  QrCode, Wallet, X, Plus, Minus, Check, ChevronRight, Filter,
  Zap, Shield, ArrowLeft, ShoppingBag, Clock, MapPin, Store, Users,
  Megaphone, Gift, Timer, MessageSquare, ThumbsUp, ChevronDown, Flame,
  TrendingUp, Award, Calendar
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  originalPrice: number | null
  category: string
  imageUrl: string | null
  stock: number
  isActive: boolean
  isFeatured: boolean
  cashbackPercent: number
  rating: number
  reviewCount: number
  sellerName: string | null
}

interface CartItem {
  product: Product
  quantity: number
}

interface ProductReview {
  id: string
  userName: string
  rating: number
  comment: string
  date: string
}

const categories = [
  { id: 'all', label: 'Todos', icon: ShoppingBag },
  { id: 'acessorios-veiculares', label: 'Acessórios Veiculares', icon: Truck },
  { id: 'eletronicos-auto', label: 'Eletrônicos Auto', icon: Package },
  { id: 'servicos-automotivos', label: 'Serviços Automotivos', icon: CreditCard },
  { id: 'estetica-veicular', label: 'Estética Veicular', icon: Zap },
  { id: 'electronics', label: 'Eletrônicos', icon: Package },
  { id: 'fashion', label: 'Moda', icon: Star },
  { id: 'home', label: 'Casa', icon: Shield },
  { id: 'health', label: 'Saúde', icon: Heart },
  { id: 'beauty', label: 'Beleza', icon: Zap },
  { id: 'food', label: 'Alimentos', icon: Tag },
  { id: 'services', label: 'Serviços', icon: CreditCard },
  { id: 'mobility', label: 'Mobilidade', icon: Truck },
  { id: 'digital', label: 'Digital', icon: QrCode },
]

// Promotional banners data
const promotionalBanners = [
  {
    id: 'daily-deal',
    title: 'Oferta do Dia',
    subtitle: 'Até 40% de desconto em eletrônicos selecionados',
    icon: Flame,
    gradient: 'from-red-500 to-orange-500',
    textColor: 'text-white',
  },
  {
    id: 'free-shipping',
    title: 'Frete Grátis',
    subtitle: 'Em compras acima de R$ 199 para todo o Brasil',
    icon: Truck,
    gradient: 'from-emerald-500 to-teal-500',
    textColor: 'text-white',
  },
  {
    id: 'cashback-boost',
    title: 'CashBack em Dobro',
    subtitle: 'Produtos com CashBack até 15% esta semana',
    icon: Zap,
    gradient: 'from-amber-500 to-yellow-500',
    textColor: 'text-white',
  },
]

// Mock reviews for product detail modal
const mockReviews: ProductReview[] = [
  { id: '1', userName: 'Ana Carolina S.', rating: 5, comment: 'Produto excelente! Entrega rápida e qualidade incrível.', date: '2026-02-15' },
  { id: '2', userName: 'Roberto M.', rating: 4, comment: 'Muito bom, recomendo. Só demorou um pouco na entrega.', date: '2026-02-10' },
  { id: '3', userName: 'Juliana P.', rating: 5, comment: 'Superou minhas expectativas! Vou comprar novamente.', date: '2026-01-28' },
  { id: '4', userName: 'Carlos A.', rating: 3, comment: 'Produto ok, mas achei o preço um pouco alto para a qualidade.', date: '2026-01-15' },
  { id: '5', userName: 'Mariana R.', rating: 5, comment: 'Perfeito! Exatamente como na descrição.', date: '2026-01-05' },
]

// Seller location map (simulated)
const sellerLocations: Record<string, { city: string; state: string; memberSince: string; totalSales: number }> = {
  'Ricardo Mendes Lojista': { city: 'São Paulo', state: 'SP', memberSince: 'Dez 2024', totalSales: 567 },
  'Ricardo Mendes': { city: 'São Paulo', state: 'SP', memberSince: 'Jan 2025', totalSales: 234 },
  'Patrícia Almeida': { city: 'Rio de Janeiro', state: 'RJ', memberSince: 'Mar 2025', totalSales: 189 },
  'Lucas Ferreira': { city: 'Belo Horizonte', state: 'MG', memberSince: 'Fev 2025', totalSales: 156 },
  'Camila Rocha': { city: 'Curitiba', state: 'PR', memberSince: 'Abr 2025', totalSales: 142 },
  'André Costa': { city: 'Salvador', state: 'BA', memberSince: 'Mai 2025', totalSales: 98 },
  'Juliana Santos': { city: 'Porto Alegre', state: 'RS', memberSince: 'Jan 2025', totalSales: 276 },
  'Fernando Oliveira': { city: 'Brasília', state: 'DF', memberSince: 'Mar 2025', totalSales: 167 },
  'Mariana Dias': { city: 'Recife', state: 'PE', memberSince: 'Jun 2025', totalSales: 87 },
}

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getDiscountPercent(price: number, originalPrice: number | null): number {
  if (!originalPrice || originalPrice <= price) return 0
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}

const categoryColors: Record<string, string> = {
  'acessorios-veiculares': 'from-rose-500 to-rose-600',
  'eletronicos-auto': 'from-sky-500 to-sky-600',
  'servicos-automotivos': 'from-lime-500 to-lime-600',
  'estetica-veicular': 'from-fuchsia-500 to-fuchsia-600',
  electronics: 'from-blue-500 to-blue-600',
  fashion: 'from-pink-500 to-pink-600',
  home: 'from-amber-500 to-amber-600',
  health: 'from-emerald-500 to-emerald-600',
  beauty: 'from-purple-500 to-purple-600',
  food: 'from-orange-500 to-orange-600',
  services: 'from-cyan-500 to-cyan-600',
  mobility: 'from-teal-500 to-teal-600',
  digital: 'from-violet-500 to-violet-600',
}

const categoryIcons: Record<string, string> = {
  'acessorios-veiculares': '🚙',
  'eletronicos-auto': '📡',
  'servicos-automotivos': '🔧',
  'estetica-veicular': '✨',
  electronics: '📱',
  fashion: '👕',
  home: '🏠',
  health: '💊',
  beauty: '💄',
  food: '☕',
  services: '⚡',
  mobility: '🚗',
  digital: '🎮',
}

export function MarketplacePage() {
  const { user } = useStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products')
  const [orders, setOrders] = useState<any[]>([])
  const [checkoutStep, setCheckoutStep] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [address, setAddress] = useState('')
  const [processing, setProcessing] = useState(false)
  const [activeBanner, setActiveBanner] = useState(0)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  // Auto-rotate promotional banners
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % promotionalBanners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Compute sellers with product counts from products data
  const sellers = useMemo(() => {
    const sellerMap = new Map<string, { name: string; productCount: number; categories: Set<string>; avgRating: number; totalRatings: number }>()
    for (const p of products) {
      if (!p.sellerName) continue
      const existing = sellerMap.get(p.sellerName)
      if (existing) {
        existing.productCount++
        existing.categories.add(p.category)
        existing.totalRatings += p.reviewCount
        existing.avgRating = Math.round(((existing.avgRating * (existing.productCount - 1)) + p.rating) / existing.productCount * 10) / 10
      } else {
        sellerMap.set(p.sellerName, {
          name: p.sellerName,
          productCount: 1,
          categories: new Set([p.category]),
          avgRating: p.rating,
          totalRatings: p.reviewCount,
        })
      }
    }
    return Array.from(sellerMap.values()).sort((a, b) => b.productCount - a.productCount)
  }, [products])

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (selectedCategory !== 'all') params.set('category', selectedCategory)
      const data = await apiFetch<any>(`/marketplace/products?${params}`)
      setProducts(data.products || [])
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }, [search, selectedCategory])

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return
    try {
      const data = await apiFetch<any>(`/marketplace/orders?userId=${user.id}`)
      setOrders(data.orders || [])
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    }
  }, [user?.id])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders()
  }, [activeTab, fetchOrders])

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    toast.success(`${product.name} adicionado ao carrinho!`)
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta
        if (newQty <= 0) return item
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const cartCashback = cart.reduce((sum, item) => sum + Math.round(item.product.price * item.quantity * item.product.cashbackPercent / 100), 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleCheckout = async () => {
    if (!user?.id || cart.length === 0) return
    setProcessing(true)
    try {
      const data = await apiFetch<any>('/marketplace/orders', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          shippingAddress: address,
          paymentMethod,
        }),
      })
      if (data.order) {
        toast.success('Pedido realizado com sucesso!')
        setCart([])
        setShowCheckout(false)
        setActiveTab('orders')
        fetchOrders()
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar pedido')
    } finally {
      setProcessing(false)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3 w-3'
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => {
          const fillPercent = rating >= i + 1 ? 100 : rating > i ? (rating - i) * 100 : 0
          return (
            <div key={i} className="relative">
              <Star className={cn(sizeClass, 'text-gray-200 dark:text-gray-700')} />
              {fillPercent > 0 && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                  <Star className={cn(sizeClass, 'text-amber-400 fill-amber-400')} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const statusLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
    processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Package },
    shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Truck },
    delivered: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Check },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: X },
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-emerald-500" />
            Marketplace
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Compre produtos e ganhe CashBack na sua rede</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Cart button with total */}
          <Button
            variant="outline"
            size="sm"
            className="relative gap-2"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            Carrinho
            {cartCount > 0 && (
              <>
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-emerald-600 text-white text-[10px]">
                  {cartCount}
                </Badge>
                <span className="text-xs font-semibold text-emerald-600 ml-1">
                  {formatPrice(cartTotal)}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Promotional Banners */}
      <div className="relative overflow-hidden rounded-xl">
        <div className="relative h-24 sm:h-28">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeBanner}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.4 }}
              className={cn(
                'absolute inset-0 bg-gradient-to-r rounded-xl flex items-center px-6 gap-4',
                promotionalBanners[activeBanner].gradient
              )}
            >
              {(() => {
                const banner = promotionalBanners[activeBanner]
                const BannerIcon = banner.icon
                return (
                  <>
                    <div className="bg-white/20 rounded-xl p-3 shrink-0">
                      <BannerIcon className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white">{banner.title}</h3>
                      <p className="text-sm text-white/90 truncate">{banner.subtitle}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                      {promotionalBanners.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveBanner(idx)}
                          className={cn(
                            'h-2 rounded-full transition-all',
                            idx === activeBanner ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                          )}
                        />
                      ))}
                    </div>
                  </>
                )
              })()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        <button
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'products' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('products')}
        >
          Produtos
        </button>
        <button
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all relative',
            activeTab === 'orders' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('orders')}
        >
          Meus Pedidos
          {orders.length > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 p-0 flex items-center justify-center bg-emerald-600 text-white text-[9px]">
              {orders.length}
            </Badge>
          )}
        </button>
      </div>

      {activeTab === 'products' ? (
        <>
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos ou vendedores..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Categories */}
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

          {/* Vendedores Section - Enhanced with more details */}
          {sellers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-foreground">Vendedores</h2>
                <Badge variant="secondary" className="text-[10px]">{sellers.length}</Badge>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {sellers.map((seller) => {
                  const location = sellerLocations[seller.name]
                  return (
                    <button
                      key={seller.name}
                      onClick={() => setSearch(seller.name)}
                      className="flex flex-col min-w-[160px] p-4 rounded-xl bg-card border border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-12 w-12 border-2 border-emerald-100 dark:border-emerald-900 group-hover:border-emerald-400 transition-colors">
                          <AvatarFallback className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-sm font-bold">
                            {seller.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-foreground line-clamp-1">{seller.name.split(' ')[0]}</p>
                          <div className="flex items-center gap-1">
                            {renderStars(seller.avgRating, 'sm')}
                            <span className="text-[10px] font-medium text-foreground">{seller.avgRating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Package className="h-3 w-3" />
                          <span>{seller.productCount} {seller.productCount === 1 ? 'produto' : 'produtos'}</span>
                        </div>
                        {location && (
                          <>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{location.city}/{location.state}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <TrendingUp className="h-3 w-3" />
                              <span>{location.totalSales} vendas</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Desde {location.memberSince}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-xl mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {products.map((product, i) => {
                  const discount = getDiscountPercent(product.price, product.originalPrice)
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                    >
                      <Card
                        className="group cursor-pointer overflow-hidden border hover:shadow-lg transition-all hover:border-emerald-300 dark:hover:border-emerald-700"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <CardContent className="p-0">
                          {/* Product Image Placeholder */}
                          <div className={cn(
                            'aspect-square bg-gradient-to-br flex items-center justify-center relative',
                            categoryColors[product.category] || 'from-gray-400 to-gray-500'
                          )}>
                            <span className="text-5xl opacity-80 group-hover:scale-110 transition-transform">
                              {categoryIcons[product.category] || '📦'}
                            </span>
                            {product.isFeatured && (
                              <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] border-0">
                                ⭐ DESTAQUE
                              </Badge>
                            )}
                            {discount > 0 && (
                              <Badge className="absolute top-2 right-2 bg-red-500 text-white text-[9px] border-0">
                                -{discount}%
                              </Badge>
                            )}
                            {product.cashbackPercent > 0 && (
                              <Badge className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[9px] border-0">
                                <Zap className="h-2.5 w-2.5 mr-0.5" />
                                {product.cashbackPercent}% CB
                              </Badge>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="p-3 space-y-1.5">
                            <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
                              {product.name}
                            </p>
                            {product.sellerName && (
                              <p className="text-[10px] text-muted-foreground">
                                por {product.sellerName}
                              </p>
                            )}
                            {/* Enhanced Rating Display */}
                            <div className="flex items-center gap-1.5">
                              {renderStars(product.rating)}
                              <span className="text-[10px] font-medium text-foreground">
                                {product.rating.toFixed(1)}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                ({product.reviewCount})
                              </span>
                            </div>
                            <div className="flex items-end gap-2">
                              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                                {formatPrice(product.price)}
                              </span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-[10px] text-muted-foreground line-through">
                                  {formatPrice(product.originalPrice)}
                                </span>
                              )}
                            </div>
                            <Button
                              size="sm"
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                addToCart(product)
                              }}
                            >
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              Comprar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      ) : (
        /* Orders Tab - Enhanced */
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum pedido realizado ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Explore o marketplace e faça sua primeira compra!</p>
              <Button
                variant="outline"
                className="mt-4 border-emerald-300 text-emerald-600"
                onClick={() => setActiveTab('products')}
              >
                Explorar Marketplace
              </Button>
            </div>
          ) : (
            <>
              {/* Orders Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 text-center border border-emerald-100 dark:border-emerald-900/50">
                  <ShoppingBag className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground">{orders.length}</p>
                  <p className="text-[10px] text-muted-foreground">Total Pedidos</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-center border border-amber-100 dark:border-amber-900/50">
                  <Clock className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground">{orders.filter(o => o.status === 'pending' || o.status === 'processing').length}</p>
                  <p className="text-[10px] text-muted-foreground">Em Andamento</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 text-center border border-purple-100 dark:border-purple-900/50">
                  <Truck className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground">{orders.filter(o => o.status === 'shipped').length}</p>
                  <p className="text-[10px] text-muted-foreground">Enviados</p>
                </div>
                <div className="bg-teal-50 dark:bg-teal-950/30 rounded-lg p-3 text-center border border-teal-100 dark:border-teal-900/50">
                  <Check className="h-4 w-4 text-teal-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground">{orders.filter(o => o.status === 'delivered').length}</p>
                  <p className="text-[10px] text-muted-foreground">Entregues</p>
                </div>
              </div>

              {/* Orders List */}
              {orders.map((order) => {
                const status = statusLabels[order.status] || statusLabels.pending
                const StatusIcon = status.icon
                const isExpanded = expandedOrder === order.id
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="overflow-hidden border hover:shadow-md transition-all">
                      <CardContent className="p-0">
                        {/* Order Header */}
                        <div
                          className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'h-10 w-10 rounded-lg flex items-center justify-center',
                                order.status === 'delivered' ? 'bg-emerald-100 dark:bg-emerald-950/30' :
                                order.status === 'shipped' ? 'bg-purple-100 dark:bg-purple-950/30' :
                                order.status === 'processing' ? 'bg-blue-100 dark:bg-blue-950/30' :
                                order.status === 'cancelled' ? 'bg-red-100 dark:bg-red-950/30' :
                                'bg-amber-100 dark:bg-amber-950/30'
                              )}>
                                <StatusIcon className={cn(
                                  'h-5 w-5',
                                  order.status === 'delivered' ? 'text-emerald-600' :
                                  order.status === 'shipped' ? 'text-purple-600' :
                                  order.status === 'processing' ? 'text-blue-600' :
                                  order.status === 'cancelled' ? 'text-red-600' :
                                  'text-amber-600'
                                )} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  Pedido #{order.id.slice(-8).toUpperCase()}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-bold text-emerald-600">{formatPrice(order.totalAmount)}</p>
                                {order.cashbackEarned > 0 && (
                                  <p className="text-[10px] text-emerald-500 flex items-center gap-0.5 justify-end">
                                    <Zap className="h-2.5 w-2.5" /> +{formatPrice(order.cashbackEarned)} CB
                                  </p>
                                )}
                              </div>
                              <Badge className={cn('text-[10px]', status.color)}>
                                {status.label}
                              </Badge>
                              <ChevronDown className={cn(
                                'h-4 w-4 text-muted-foreground transition-transform',
                                isExpanded && 'rotate-180'
                              )} />
                            </div>
                          </div>
                        </div>

                        {/* Order Details (expandable) */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 space-y-3">
                                <Separator />
                                {/* Items */}
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Itens</p>
                                  {order.items?.map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between py-1.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">{categoryIcons[item.category] || '📦'}</span>
                                        <div>
                                          <span className="text-sm text-foreground">{item.productName}</span>
                                          <span className="text-xs text-muted-foreground ml-2">x{item.quantity}</span>
                                        </div>
                                      </div>
                                      <span className="text-sm text-muted-foreground">{formatPrice(item.unitPrice * item.quantity)}</span>
                                    </div>
                                  ))}
                                </div>
                                <Separator />
                                {/* Order Info */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {order.shippingAddress && (
                                    <div>
                                      <p className="text-muted-foreground">Endereço</p>
                                      <p className="text-foreground font-medium">{order.shippingAddress}</p>
                                    </div>
                                  )}
                                  {order.paymentMethod && (
                                    <div>
                                      <p className="text-muted-foreground">Pagamento</p>
                                      <p className="text-foreground font-medium">
                                        {order.paymentMethod === 'pix' ? 'PIX' :
                                         order.paymentMethod === 'credit_card' ? 'Cartão de Crédito' :
                                         order.paymentMethod === 'balance' ? 'Saldo NM' : order.paymentMethod}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                {/* Status Timeline */}
                                <div className="flex items-center gap-2 pt-1">
                                  {['pending', 'processing', 'shipped', 'delivered'].map((step, idx) => {
                                    const stepStatus = statusLabels[step]
                                    const isCompleted = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status) >= idx
                                    const isCurrent = order.status === step
                                    return (
                                      <div key={step} className="flex items-center gap-1">
                                        <div className={cn(
                                          'h-2 w-2 rounded-full transition-all',
                                          isCompleted ? 'bg-emerald-500' : 'bg-muted-foreground/20'
                                        )} />
                                        <span className={cn(
                                          'text-[9px] font-medium',
                                          isCompleted ? 'text-emerald-600' : 'text-muted-foreground/40'
                                        )}>
                                          {stepStatus.label}
                                        </span>
                                        {idx < 3 && (
                                          <div className={cn(
                                            'h-0.5 w-3 sm:w-6',
                                            isCompleted && ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status) > idx
                                              ? 'bg-emerald-500' : 'bg-muted-foreground/10'
                                          )} />
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* Product Detail Modal - Enhanced */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogDescription className="sr-only">Detalhes do produto</DialogDescription>
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{categoryIcons[selectedProduct.category]}</span>
                  {selectedProduct.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                {/* Product Image - Larger */}
                <div className={cn(
                  'aspect-video bg-gradient-to-br rounded-xl flex items-center justify-center relative overflow-hidden',
                  categoryColors[selectedProduct.category] || 'from-gray-400 to-gray-500'
                )}>
                  <span className="text-8xl opacity-80">{categoryIcons[selectedProduct.category] || '📦'}</span>
                  {selectedProduct.isFeatured && (
                    <Badge className="absolute top-3 left-3 bg-amber-500 text-white border-0">
                      <Star className="h-3 w-3 mr-1" /> DESTAQUE
                    </Badge>
                  )}
                  {getDiscountPercent(selectedProduct.price, selectedProduct.originalPrice) > 0 && (
                    <Badge className="absolute top-3 right-3 bg-red-500 text-white border-0 text-xs">
                      -{getDiscountPercent(selectedProduct.price, selectedProduct.originalPrice)}% OFF
                    </Badge>
                  )}
                </div>

                {/* Price & CashBack & Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-emerald-600">{formatPrice(selectedProduct.price)}</span>
                      {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(selectedProduct.originalPrice)}
                        </span>
                      )}
                    </div>
                    {selectedProduct.cashbackPercent > 0 && (
                      <p className="text-sm text-emerald-500 flex items-center gap-1 mt-1">
                        <Zap className="h-3.5 w-3.5" />
                        {selectedProduct.cashbackPercent}% CashBack = {formatPrice(Math.round(selectedProduct.price * selectedProduct.cashbackPercent / 100))}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end gap-1">
                      {renderStars(selectedProduct.rating, 'md')}
                      <span className="text-xs text-muted-foreground">
                        {selectedProduct.rating.toFixed(1)} ({selectedProduct.reviewCount} {selectedProduct.reviewCount === 1 ? 'avaliação' : 'avaliações'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedProduct.description && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">Descrição</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedProduct.description}</p>
                  </div>
                )}

                {/* Seller Info Card */}
                <div className="bg-muted/50 rounded-xl p-4 border border-border space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Store className="h-4 w-4 text-emerald-600" />
                    Informações do Vendedor
                  </h4>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-emerald-200 dark:border-emerald-800">
                      <AvatarFallback className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-xs font-bold">
                        {selectedProduct.sellerName?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'NM'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{selectedProduct.sellerName || 'NewMobility'}</p>
                      {selectedProduct.sellerName && sellerLocations[selectedProduct.sellerName] && (
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {sellerLocations[selectedProduct.sellerName].city}/{sellerLocations[selectedProduct.sellerName].state}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {sellerLocations[selectedProduct.sellerName].totalSales} vendas
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Desde {sellerLocations[selectedProduct.sellerName].memberSince}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-emerald-500" />
                      Vendedor verificado
                    </span>
                    <span>{selectedProduct.stock > 0 ? `${selectedProduct.stock} em estoque` : 'Indisponível'}</span>
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-emerald-600" />
                      Avaliações dos Clientes
                    </h4>
                    <Badge variant="secondary" className="text-[10px]">
                      {selectedProduct.reviewCount} reviews
                    </Badge>
                  </div>
                  {/* Rating summary */}
                  <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-foreground">{selectedProduct.rating.toFixed(1)}</p>
                      {renderStars(selectedProduct.rating, 'md')}
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map(stars => {
                        const percent = stars === 5 ? 60 : stars === 4 ? 25 : stars === 3 ? 10 : stars === 2 ? 3 : 2
                        return (
                          <div key={stars} className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-3">{stars}</span>
                            <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percent}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground w-7">{percent}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  {/* Sample reviews */}
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {mockReviews.slice(0, 3).map(review => (
                      <div key={review.id} className="p-3 bg-card rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[8px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                                {review.userName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-foreground">{review.userName}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(review.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="mb-1">{renderStars(review.rating, 'sm')}</div>
                        <p className="text-xs text-muted-foreground">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setSelectedProduct(null)}
                  >
                    Voltar
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      addToCart(selectedProduct)
                      setSelectedProduct(null)
                    }}
                    disabled={selectedProduct.stock <= 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Adicionar ao Carrinho
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Sidebar */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="sm:max-w-md">
          <DialogDescription className="sr-only">Carrinho de compras</DialogDescription>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-emerald-500" />
              Carrinho ({cartCount} {cartCount === 1 ? 'item' : 'itens'})
            </DialogTitle>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Seu carrinho está vazio</p>
              <Button
                variant="outline"
                className="mt-3 border-emerald-300 text-emerald-600"
                onClick={() => setShowCart(false)}
              >
                Continuar Comprando
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className={cn(
                    'w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0',
                    categoryColors[item.product.category] || 'from-gray-400 to-gray-500'
                  )}>
                    <span className="text-lg">{categoryIcons[item.product.category] || '📦'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                    <p className="text-xs text-emerald-600 font-semibold">{formatPrice(item.product.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-6 w-6"
                      onClick={() => updateCartQuantity(item.product.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-6 w-6"
                      onClick={() => updateCartQuantity(item.product.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-red-500"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'itens'})</span>
                <span className="font-semibold">{formatPrice(cartTotal)}</span>
              </div>
              {cartCashback > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-600 flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" />
                    CashBack estimado
                  </span>
                  <span className="font-semibold text-emerald-600">+{formatPrice(cartCashback)}</span>
                </div>
              )}
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
                onClick={() => {
                  setShowCart(false)
                  setShowCheckout(true)
                  setCheckoutStep(0)
                }}
              >
                Finalizar Compra
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-md">
          <DialogDescription className="sr-only">Finalizar compra</DialogDescription>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-500" />
              Finalizar Compra
            </DialogTitle>
          </DialogHeader>

          {checkoutStep === 0 && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Resumo do Pedido</p>
                <p className="text-xs text-muted-foreground mt-1">{cartCount} {cartCount === 1 ? 'item' : 'itens'}</p>
                <p className="text-lg font-bold text-emerald-600 mt-1">{formatPrice(cartTotal)}</p>
                {cartCashback > 0 && (
                  <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                    <Zap className="h-3 w-3" /> +{formatPrice(cartCashback)} CashBack
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Endereço de Entrega</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rua, número, bairro, cidade - UF"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setCheckoutStep(1)}
              >
                Continuar
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {checkoutStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">Forma de Pagamento</p>
              <div className="space-y-2">
                {[
                  { id: 'pix', icon: QrCode, label: 'PIX', desc: 'Pagamento instantâneo' },
                  { id: 'credit_card', icon: CreditCard, label: 'Cartão de Crédito', desc: 'Até 12x sem juros' },
                  { id: 'balance', icon: Wallet, label: 'Saldo NewMobility', desc: user ? `Disponível: ${formatPrice(user.balanceWithdrawal)}` : 'Sem saldo' },
                ].map(method => {
                  const Icon = method.icon
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                        paymentMethod === method.id
                          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm'
                          : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                      )}
                    >
                      <Icon className={cn('h-5 w-5', paymentMethod === method.id ? 'text-emerald-600' : 'text-muted-foreground')} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{method.label}</p>
                        <p className="text-[10px] text-muted-foreground">{method.desc}</p>
                      </div>
                      {paymentMethod === method.id && <Check className="h-4 w-4 text-emerald-600" />}
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCheckoutStep(0)}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleCheckout}
                  disabled={!paymentMethod || processing}
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processando...
                    </span>
                  ) : (
                    <>
                      Confirmar Pedido
                      <Check className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
