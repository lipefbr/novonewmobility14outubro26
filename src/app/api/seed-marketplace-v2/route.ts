import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { hashPassword } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Check if lojista user already exists
    let lojista = await prisma.user.findUnique({
      where: { email: 'ricardo.lojista@email.com' },
    })

    if (!lojista) {
      // Create lojista user
      const hashedPassword = hashPassword('123456')
      lojista = await prisma.user.create({
        data: {
          name: 'Ricardo Mendes',
          email: 'ricardo.lojista@email.com',
          password: hashedPassword,
          userType: 'lojista',
          role: 'user',
          referralCode: 'RICARDO2025',
          plan: 'blue5',
          isActive: true,
          balanceFree: 500000,
          phone: '(11) 99999-0001',
          city: 'São Paulo',
          state: 'SP',
          country: 'BR',
        },
      })
    }

    // Check if products already exist for this seller
    const existingProducts = await prisma.marketplaceProduct.count({
      where: { sellerName: 'Ricardo Mendes' },
    })

    if (existingProducts > 0) {
      return success({
        message: 'Seed already completed',
        lojista: { id: lojista.id, name: lojista.name, email: lojista.email },
        productsCount: existingProducts,
      })
    }

    // Create marketplace products
    const productsData = [
      // Electronics
      { name: 'Fone Bluetooth Premium', description: 'Fone de ouvido Bluetooth com cancelamento de ruído ativo, bateria de 30h e driver de 40mm. Perfeito para música e chamadas.', price: 8990, originalPrice: 12990, category: 'electronics', cashbackPercent: 8, rating: 4.7, reviewCount: 156, stock: 200, isFeatured: true, tags: ['bluetooth', 'noise-canceling', 'premium'] },
      { name: 'Smartwatch Fitness', description: 'Relógio inteligente com monitor cardíaco, GPS integrado, resistência à água IP68 e mais de 100 modos de exercício.', price: 24990, originalPrice: 29990, category: 'electronics', cashbackPercent: 6, rating: 4.5, reviewCount: 89, stock: 150, isFeatured: false, tags: ['smartwatch', 'fitness', 'gps'] },
      { name: 'Carregador Solar Portátil', description: 'Carregador solar de 20000mAh com 2 portas USB e carregamento rápido. Ideal para trilhas e viagens.', price: 12990, originalPrice: 15990, category: 'electronics', cashbackPercent: 10, rating: 4.3, reviewCount: 67, stock: 300, isFeatured: false, tags: ['solar', 'portable', 'outdoor'] },

      // Fashion
      { name: 'Camiseta Dry-Fit Esportiva', description: 'Camiseta com tecnologia Dry-Fit que mantém o corpo seco e fresco durante os treinos. Disponível em 5 cores.', price: 5990, originalPrice: 7990, category: 'fashion', cashbackPercent: 5, rating: 4.6, reviewCount: 203, stock: 999, isFeatured: false, tags: ['dry-fit', 'sport', 'fitness'] },
      { name: 'Bolsa Elegante Couro Sintético', description: 'Bolsa elegante em couro sintético premium com compartimento para notebook 14". Design sofisticado e funcional.', price: 15990, originalPrice: 19990, category: 'fashion', cashbackPercent: 7, rating: 4.4, reviewCount: 45, stock: 80, isFeatured: false, tags: ['bag', 'vegan-leather', 'elegant'] },

      // Home
      { name: 'Luminária LED Inteligente', description: 'Luminária LED com controle por app, 16 milhões de cores, compatível com Alexa e Google Home. 12W de potência.', price: 7990, originalPrice: 9990, category: 'home', cashbackPercent: 6, rating: 4.8, reviewCount: 134, stock: 250, isFeatured: true, tags: ['smart-home', 'led', 'wifi'] },
      { name: 'Organizador Multiuso', description: 'Organizador com 6 compartimentos ajustáveis, ideal para cozinha, banheiro ou escritório. Material resistente à água.', price: 3490, originalPrice: 4990, category: 'home', cashbackPercent: 4, rating: 4.2, reviewCount: 78, stock: 500, isFeatured: false, tags: ['organizer', 'multi-purpose', 'home'] },

      // Health
      { name: 'Kit Vitaminas D+C', description: 'Kit com 60 cápsulas de Vitamina D3 (2000 UI) + Vitamina C (500mg). Reforça a imunidade e a saúde óssea.', price: 4990, originalPrice: 6990, category: 'health', cashbackPercent: 12, rating: 4.9, reviewCount: 189, stock: 400, isFeatured: true, tags: ['vitamins', 'immunity', 'health'] },
      { name: 'Pulseira Monitor Sono', description: 'Pulseira inteligente que monitora qualidade do sono, batimentos e nível de oxigênio no sangue. Bateria de 7 dias.', price: 6990, originalPrice: 9990, category: 'health', cashbackPercent: 8, rating: 4.1, reviewCount: 34, stock: 180, isFeatured: false, tags: ['sleep-tracker', 'health', 'wearable'] },

      // Beauty
      { name: 'Set Skincare Natural', description: 'Kit de skincare com limpeza, tônico e hidratante. Ingredientes naturais, sem parabenos. Para todos os tipos de pele.', price: 12990, originalPrice: 16990, category: 'beauty', cashbackPercent: 9, rating: 4.6, reviewCount: 112, stock: 120, isFeatured: false, tags: ['skincare', 'natural', 'beauty'] },
      { name: 'Perfume Premium 50ml', description: 'Perfume exclusivo com notas de bergamota, jasmim e sândalo. Fixação de até 12h. Frasco de vidro premium.', price: 18990, originalPrice: 24990, category: 'beauty', cashbackPercent: 7, rating: 4.8, reviewCount: 87, stock: 60, isFeatured: true, tags: ['perfume', 'premium', 'fragrance'] },

      // Food
      { name: 'Café Gourmet 500g', description: 'Café gourmet torrado e moído, blend especial 100% Arábica. Notas de chocolate e caramelo. Certificação Fair Trade.', price: 3490, originalPrice: 4490, category: 'food', cashbackPercent: 5, rating: 4.7, reviewCount: 198, stock: 350, isFeatured: false, tags: ['coffee', 'gourmet', 'organic'] },
      { name: 'Chocolate Artesanal Box', description: 'Caixa com 12 bombons artesanais de chocolate belga 70% cacau. Sabores variados: laranja, pimenta, maracujá e sal rosa.', price: 5990, originalPrice: 7490, category: 'food', cashbackPercent: 4, rating: 4.9, reviewCount: 56, stock: 100, isFeatured: false, tags: ['chocolate', 'artisan', 'gift'] },

      // Services
      { name: 'Consultoria Nutricional Online', description: '3 sessões de consultoria nutricional personalizada com nutricionista certificado. Plano alimentar personalizado incluso.', price: 19990, originalPrice: 29990, category: 'services', cashbackPercent: 15, rating: 4.5, reviewCount: 23, stock: 50, isFeatured: false, tags: ['nutrition', 'consulting', 'health'] },
      { name: 'Aula Personalizada Fitness', description: 'Pack de 4 aulas de treinamento personalizado com educador físico. Treino adaptado ao seu nível e objetivos.', price: 15990, originalPrice: 19990, category: 'services', cashbackPercent: 10, rating: 4.6, reviewCount: 41, stock: 50, isFeatured: false, tags: ['fitness', 'personal-trainer', 'class'] },

      // Mobility
      { name: 'Passe Mensal Transporte', description: 'Passe mensal para transporte público em todas as linhas da cidade. Válido por 30 dias a partir da ativação.', price: 18990, originalPrice: 22000, category: 'mobility', cashbackPercent: 3, rating: 4.0, reviewCount: 10, stock: 999, isFeatured: false, tags: ['transport', 'monthly-pass', 'public'] },
      { name: 'Voucher Uber R$100', description: 'Voucher de R$100 para viagens Uber. Válido por 90 dias. Pode ser usado em múltiplas viagens.', price: 10000, originalPrice: 10000, category: 'mobility', cashbackPercent: 5, rating: 4.3, reviewCount: 67, stock: 500, isFeatured: false, tags: ['uber', 'voucher', 'ride'] },

      // Digital
      { name: 'Curso Marketing Digital', description: 'Curso completo de Marketing Digital com 120h de conteúdo. Certificado incluso. Acesso vitalício e atualizações gratuitas.', price: 4990, originalPrice: 19990, category: 'digital', cashbackPercent: 12, rating: 4.4, reviewCount: 145, stock: 999, isFeatured: false, tags: ['course', 'marketing', 'digital'] },
      { name: 'E-book Investimentos', description: 'E-book completo sobre investimentos para iniciantes. Do Tesouro Direto às Criptomoedas. 200+ páginas com estratégias práticas.', price: 2990, originalPrice: 4990, category: 'digital', cashbackPercent: 8, rating: 4.2, reviewCount: 89, stock: 999, isFeatured: false, tags: ['ebook', 'investment', 'finance'] },
    ]

    const createdProducts = []
    for (const productData of productsData) {
      const product = await prisma.marketplaceProduct.create({
        data: {
          ...productData,
          sellerName: 'Ricardo Mendes',
          imageUrl: null,
          images: null,
        },
      })
      createdProducts.push(product)
    }

    return success({
      message: 'Seed completed successfully',
      lojista: { id: lojista.id, name: lojista.name, email: lojista.email, userType: lojista.userType },
      productsCreated: createdProducts.length,
      products: createdProducts.map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price })),
    }, 201)
  } catch (err) {
    console.error('Seed marketplace v2 error:', err)
    return error('Internal server error', 500)
  }
}
