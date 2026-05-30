'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Search, ShoppingCart, Star, Tag, Heart, Package, Truck, CreditCard,
  QrCode, Wallet, X, Plus, Minus, Check, ChevronRight, Filter,
  Zap, Shield, ArrowLeft, ShoppingBag, Clock, MapPin
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

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

const categories = [
  { id: 'all', label: 'Todos', icon: ShoppingBag },
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

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getDiscountPercent(price: number, originalPrice: number | null): number {
  if (!originalPrice || originalPrice <= price) return 0
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}

const categoryColors: Record<string, string> = {
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn('h-3 w-3', i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300')}
      />
    ))
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    delivered: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
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
          {/* Cart button */}
          <Button
            variant="outline"
            size="sm"
            className="relative gap-2"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            Carrinho
            {cartCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-emerald-600 text-white text-[10px]">
                {cartCount}
              </Badge>
            )}
          </Button>
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
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'orders' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('orders')}
        >
          Meus Pedidos
        </button>
      </div>

      {activeTab === 'products' ? (
        <>
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
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
                            <div className="flex items-center gap-1">
                              {renderStars(product.rating)}
                              <span className="text-[10px] text-muted-foreground ml-0.5">
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
        /* Orders Tab */
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum pedido realizado ainda</p>
              <Button
                variant="outline"
                className="mt-4 border-emerald-300 text-emerald-600"
                onClick={() => setActiveTab('products')}
              >
                Explorar Marketplace
              </Button>
            </div>
          ) : (
            orders.map((order) => {
              const status = statusLabels[order.status] || statusLabels.pending
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Pedido #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge className={cn('text-[10px]', status.color)}>
                        {status.label}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{item.productName} x{item.quantity}</span>
                          <span className="text-muted-foreground">{formatPrice(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-sm font-semibold">Total</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-600">{formatPrice(order.totalAmount)}</span>
                        {order.cashbackEarned > 0 && (
                          <p className="text-[10px] text-emerald-500">+{formatPrice(order.cashbackEarned)} CashBack</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogDescription className="sr-only">Detalhes do produto</DialogDescription>
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{categoryIcons[selectedProduct.category]}</span>
                  {selectedProduct.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Product Image */}
                <div className={cn(
                  'aspect-video bg-gradient-to-br rounded-xl flex items-center justify-center',
                  categoryColors[selectedProduct.category] || 'from-gray-400 to-gray-500'
                )}>
                  <span className="text-8xl opacity-80">{categoryIcons[selectedProduct.category] || '📦'}</span>
                </div>

                {/* Price & CashBack */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-emerald-600">{formatPrice(selectedProduct.price)}</span>
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
                  <div className="flex items-center gap-1">
                    {renderStars(selectedProduct.rating)}
                    <span className="text-xs text-muted-foreground ml-1">({selectedProduct.reviewCount})</span>
                  </div>
                </div>

                {/* Description */}
                {selectedProduct.description && (
                  <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                )}

                {/* Seller & Stock */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Vendido por <strong className="text-foreground">{selectedProduct.sellerName || 'NewMobility'}</strong></span>
                  <span>{selectedProduct.stock > 0 ? `${selectedProduct.stock} em estoque` : 'Indisponível'}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
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
                <span className="text-muted-foreground">Subtotal</span>
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
