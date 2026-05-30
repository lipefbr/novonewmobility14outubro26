import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  const random2 = Math.random().toString(36).substring(2, 10)
  return `c${timestamp}${random}${random2}`
}

export async function POST() {
  try {
    const now = new Date().toISOString()

    // Check if products already exist
    const existingCount = await db.count('MarketplaceProduct')
    if (existingCount > 0) {
      return success({ message: `Already have ${existingCount} products`, skipped: true })
    }

    const products = [
      { name: 'Smartphone Galaxy Ultra', description: 'Smartphone premium com câmera de 200MP, tela AMOLED 6.8"', price: 329900, originalPrice: 399900, category: 'electronics', cashbackPercent: 5, rating: 4.7, reviewCount: 142, sellerName: 'Ricardo Mendes', isFeatured: true, stock: 45, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Fone Bluetooth NoisePro', description: 'Fone de ouvido Bluetooth com cancelamento de ruído ativo, 35h de bateria', price: 19900, originalPrice: 29900, category: 'electronics', cashbackPercent: 8, rating: 4.3, reviewCount: 89, sellerName: 'Lucas Ferreira', isFeatured: true, stock: 200, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Smartwatch Fit Pulse', description: 'Relógio inteligente com monitor cardíaco e GPS integrado', price: 59900, originalPrice: 79900, category: 'electronics', cashbackPercent: 6, rating: 4.5, reviewCount: 67, sellerName: 'Fernando Oliveira', isFeatured: false, stock: 120, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Camiseta Algodão Premium', description: 'Camiseta 100% algodão egípcio, corte moderno e confortável', price: 8900, originalPrice: 12900, category: 'fashion', cashbackPercent: 10, rating: 4.1, reviewCount: 56, sellerName: 'Patrícia Almeida', isFeatured: false, stock: 500, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Tênis Esportivo Runner Pro', description: 'Tênis de corrida com tecnologia de amortecimento responsive', price: 29900, originalPrice: 39900, category: 'fashion', cashbackPercent: 7, rating: 4.8, reviewCount: 203, sellerName: 'André Costa', isFeatured: true, stock: 150, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Purificador de Ar HEPA', description: 'Purificador de ar com filtro HEPA, ideal para quartos até 40m²', price: 45900, originalPrice: 59900, category: 'home', cashbackPercent: 6, rating: 4.3, reviewCount: 42, sellerName: 'Camila Rocha', isFeatured: false, stock: 80, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Kit Organização Lar 12pc', description: 'Kit completo de organização para casa com 12 peças', price: 7900, originalPrice: 11900, category: 'home', cashbackPercent: 12, rating: 4.2, reviewCount: 34, sellerName: 'Mariana Dias', isFeatured: false, stock: 300, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Vitamínico Complex Plus', description: 'Suplemento vitamínico com 25 vitaminas e minerais essenciais', price: 6900, originalPrice: 8900, category: 'health', cashbackPercent: 15, rating: 4.6, reviewCount: 167, sellerName: 'Juliana Santos', isFeatured: true, stock: 1000, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Whey Protein Premium 900g', description: 'Whey Protein isolado com 27g de proteína por dose', price: 12900, originalPrice: 16900, category: 'health', cashbackPercent: 10, rating: 4.4, reviewCount: 234, sellerName: 'Ricardo Mendes', isFeatured: false, stock: 350, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Kit Skincare Completo', description: 'Kit de cuidados com a pele: sérum vitamina C, hidratante e protetor solar', price: 14900, originalPrice: 21900, category: 'beauty', cashbackPercent: 10, rating: 4.5, reviewCount: 95, sellerName: 'Patrícia Almeida', isFeatured: true, stock: 200, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Café Especial Cerrado 500g', description: 'Café especial 100% arábica do Cerrado Mineiro, torra média', price: 4500, originalPrice: 5900, category: 'food', cashbackPercent: 8, rating: 4.9, reviewCount: 312, sellerName: 'André Costa', isFeatured: false, stock: 5000, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Azeite Extra Virgem 500ml', description: 'Azeite extra virgem premium prensado a frio, acidez 0,3%', price: 3900, originalPrice: 5400, category: 'food', cashbackPercent: 5, rating: 4.7, reviewCount: 189, sellerName: 'Camila Rocha', isFeatured: false, stock: 2000, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Recarga Celular R$50', description: 'Recarga de celular instantânea para qualquer operadora', price: 5000, originalPrice: null, category: 'services', cashbackPercent: 3, rating: 5.0, reviewCount: 520, sellerName: 'Lucas Ferreira', isFeatured: false, stock: 9999, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Crédito Corrida Premium 30km', description: 'Crédito de corrida premium no app de mobilidade', price: 4500, originalPrice: 6000, category: 'mobility', cashbackPercent: 5, rating: 4.3, reviewCount: 89, sellerName: 'Fernando Oliveira', isFeatured: false, stock: 9999, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Assinatura Streaming 1 ano', description: 'Assinatura anual de plataforma de streaming, acesso ilimitado', price: 19900, originalPrice: 29900, category: 'digital', cashbackPercent: 12, rating: 4.0, reviewCount: 78, sellerName: 'Juliana Santos', isFeatured: false, stock: 9999, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Curso Online Marketing Digital', description: 'Curso completo com 120 horas de conteúdo e certificado', price: 9700, originalPrice: 19700, category: 'digital', cashbackPercent: 8, rating: 4.6, reviewCount: 156, sellerName: 'Mariana Dias', isFeatured: true, stock: 9999, isActive: true, createdAt: now, updatedAt: now },
    ]

    for (const p of products) {
      await db.insert('MarketplaceProduct', { id: generateId(), ...p })
    }

    return success({ message: `${products.length} marketplace products seeded`, count: products.length }, 201)
  } catch (err) {
    console.error('Marketplace seed error:', err)
    return error('Failed to seed marketplace: ' + (err instanceof Error ? err.message : String(err)), 500)
  }
}
