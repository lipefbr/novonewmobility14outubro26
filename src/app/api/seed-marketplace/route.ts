import { db } from '@/lib/db'
import { hashPassword, generateReferralCode, success, error } from '@/lib/api-utils'

export async function POST() {
  try {
    const now = new Date().toISOString()
    const password = hashPassword('123456')
    const lojistaName = 'Ricardo Mendes Lojista'

    // ============== CHECK / CREATE LOJISTA USER ==============
    let lojista = await db.findOne('User', '"email" = $1', ['lojista@newmobility.com']) as any

    if (lojista) {
      console.log('[seed-marketplace] Lojista user already exists:', lojista.email)
    } else {
      lojista = await db.insert('User', {
        email: 'lojista@newmobility.com',
        name: lojistaName,
        username: 'ricardo.lojista',
        phone: '(11) 98888-7777',
        cpf: '987.654.321-00',
        password,
        role: 'user',
        userType: 'lojista',
        referralCode: generateReferralCode(lojistaName),
        plan: 'blue5',
        isActive: true,
        balanceWithdrawal: 0,
        balanceMobility: 0,
        balanceShopping: 0,
        balanceFood: 0,
        balancePharmacy: 0,
        balanceGratification: 0,
        balanceFree: 500000,
        balancePending: 0,
        careerPoints: 0,
        personalPoints: 0,
        stars: 0,
        city: 'São Paulo',
        state: 'SP',
        country: 'BR',
        createdAt: now,
        updatedAt: now,
      }) as any
      console.log('[seed-marketplace] Created lojista user:', lojista.email)
    }

    // ============== CHECK / SEED MARKETPLACE PRODUCTS ==============
    const existingProductCount = await db.count('MarketplaceProduct')

    if (existingProductCount >= 20) {
      return success({
        message: `Marketplace already has ${existingProductCount} products. Skipping seed.`,
        skipped: true,
        lojista: {
          id: lojista.id,
          email: lojista.email,
          name: lojista.name,
          userType: lojista.userType,
        },
        existingProducts: existingProductCount,
      })
    }

    const products = [
      // ==================== ACESSÓRIOS VEICULARES (3 products) ====================
      {
        name: 'Suporte Celular Magnético para Painel',
        description: 'Suporte magnético universal para celular com fixação no painel do veículo. Compatível com todos os smartphones. Rotação 360° e base antiderrapante. CashBack NewMobility!',
        price: 4900,
        originalPrice: 7900,
        category: 'acessorios-veiculares',
        cashbackPercent: 10,
        rating: 4.5,
        reviewCount: 234,
        sellerName: lojistaName,
        isFeatured: true,
        stock: 350,
        isActive: true,
        tags: 'suporte,celular,painel,veículo,magnético',
      },
      {
        name: 'Kit LED Interior Automotivo 8 Peças',
        description: 'Kit com 8 lâmpadas LED para iluminação interna do veículo. Super brilho branco 6000K. Instalação plug and play. Compatível com 95% dos carros. CashBack 8%!',
        price: 3900,
        originalPrice: 5900,
        category: 'acessorios-veiculares',
        cashbackPercent: 8,
        rating: 4.3,
        reviewCount: 178,
        sellerName: lojistaName,
        isFeatured: false,
        stock: 500,
        isActive: true,
        tags: 'led,iluminação,interna,automotivo,carro',
      },
      {
        name: 'Câmera de Ré HD com Linhas Guia',
        description: 'Câmera de ré em alta definição com linhas guia dinâmicas. À prova d\'água IP67. Visão noturna. Compatível com qualquer monitor/DVD automotivo. CashBack 7%!',
        price: 8900,
        originalPrice: 12900,
        category: 'acessorios-veiculares',
        cashbackPercent: 7,
        rating: 4.6,
        reviewCount: 312,
        sellerName: lojistaName,
        isFeatured: true,
        stock: 200,
        isActive: true,
        tags: 'câmera,ré,estacionamento,hd,automotivo',
      },

      // ==================== ELETRÔNICOS (2 products) ====================
      {
        name: 'Rádio Multimídia Android 10" Bluetooth',
        description: 'Rádio multimídia com tela 10 polegadas, Android 12, GPS integrado, Bluetooth, espelhamento de tela e câmera de ré inclusa. 2GB RAM + 32GB. CashBack 5%!',
        price: 49900,
        originalPrice: 64900,
        category: 'eletronicos-auto',
        cashbackPercent: 5,
        rating: 4.4,
        reviewCount: 145,
        sellerName: lojistaName,
        isFeatured: true,
        stock: 80,
        isActive: true,
        tags: 'rádio,multimídia,android,gps,bluetooth',
      },
      {
        name: 'Detector de Radar e Camera Anti-Radar',
        description: 'Detector de radares fixos e móveis com alerta sonoro e visual. Detecta radares de velocidade, semáforo e pórtico. Atualização gratuita por 1 ano. CashBack 6%!',
        price: 19900,
        originalPrice: 27900,
        category: 'eletronicos-auto',
        cashbackPercent: 6,
        rating: 4.2,
        reviewCount: 89,
        sellerName: lojistaName,
        isFeatured: false,
        stock: 150,
        isActive: true,
        tags: 'detector,radar,anti-radar,velocidade,alerta',
      },

      // ==================== SERVIÇOS AUTOMOTIVOS (3 products) ====================
      {
        name: 'Lavagem Completa + Enceramento',
        description: 'Serviço de lavagem completa externa e interna com enceramento e polimento. Inclui aspiração, limpeza de vidros e painel, hidratação de couro. Agende pelo app! CashBack 12%!',
        price: 8900,
        originalPrice: 12000,
        category: 'servicos-automotivos',
        cashbackPercent: 12,
        rating: 4.7,
        reviewCount: 423,
        sellerName: lojistaName,
        isFeatured: true,
        stock: 9999,
        isActive: true,
        tags: 'lavagem,enceramento,limpeza,carro,serviço',
      },
      {
        name: 'Troca de Óleo + Filtro Semi-Sintético',
        description: 'Troca de óleo semi-sintético 5W30 + filtro de óleo. Mão de obra inclusa. Atendimento domiciliar disponível na região de SP. Agende o melhor horário! CashBack 8%!',
        price: 14900,
        originalPrice: 19900,
        category: 'servicos-automotivos',
        cashbackPercent: 8,
        rating: 4.5,
        reviewCount: 267,
        sellerName: lojistaName,
        isFeatured: false,
        stock: 9999,
        isActive: true,
        tags: 'troca,óleo,filtro,manutenção,carro',
      },
      {
        name: 'Vistoria Cautelar Completa',
        description: 'Vistoria cautelar completa com laudo detalhado. Verificação de chassi, motor, pintura, funilaria e leilão. Laudo emitido em até 24h. CashBack 5%!',
        price: 12000,
        originalPrice: null,
        category: 'servicos-automotivos',
        cashbackPercent: 5,
        rating: 4.8,
        reviewCount: 156,
        sellerName: lojistaName,
        isFeatured: false,
        stock: 9999,
        isActive: true,
        tags: 'vistoria,cautelar,laudo,compra,veículo',
      },

      // ==================== ESTÉTICA VEICULAR (2 products) ====================
      {
        name: 'Película Automotiva G5 30% VLT',
        description: 'Película automotiva G5 premium com 30% VLT (escura). Rejeção de calor até 70%. Proteção UV 99%. Instalação profissional inclusa (SP capital). CashBack 10%!',
        price: 29900,
        originalPrice: 45000,
        category: 'estetica-veicular',
        cashbackPercent: 10,
        rating: 4.9,
        reviewCount: 387,
        sellerName: lojistaName,
        isFeatured: true,
        stock: 9999,
        isActive: true,
        tags: 'película,g5,insulfilm,automotiva,escuro',
      },
      {
        name: 'Polimento e Cristalização de Pintura',
        description: 'Polimento mecânico + cristalização com nano-tecnologia. Remove riscos leves e protege a pintura por até 6 meses. Brilho intenso garantido. CashBack 8%!',
        price: 19900,
        originalPrice: 28000,
        category: 'estetica-veicular',
        cashbackPercent: 8,
        rating: 4.6,
        reviewCount: 198,
        sellerName: lojistaName,
        isFeatured: false,
        stock: 9999,
        isActive: true,
        tags: 'polimento,cristalização,pintura,brilho,carro',
      },
    ]

    // Insert all products
    for (const p of products) {
      await db.insert('MarketplaceProduct', {
        ...p,
        createdAt: now,
        updatedAt: now,
      })
    }

    const totalProducts = await db.count('MarketplaceProduct')

    return success({
      message: 'Marketplace seeded successfully with vehicle-specific products',
      lojista: {
        id: lojista.id,
        email: lojista.email,
        name: lojista.name,
        username: lojista.username,
        userType: lojista.userType,
        plan: lojista.plan,
      },
      productsSeeded: products.length,
      totalProductsNow: totalProducts,
      categories: {
        'acessorios-veiculares': products.filter(p => p.category === 'acessorios-veiculares').length,
        'eletronicos-auto': products.filter(p => p.category === 'eletronicos-auto').length,
        'servicos-automotivos': products.filter(p => p.category === 'servicos-automotivos').length,
        'estetica-veicular': products.filter(p => p.category === 'estetica-veicular').length,
      },
      credentials: {
        email: 'lojista@newmobility.com',
        password: '123456',
      },
    }, 201)
  } catch (err) {
    console.error('Marketplace seed error:', err)
    return error('Failed to seed marketplace: ' + (err instanceof Error ? err.message : String(err)), 500)
  }
}
