import { db } from '@/lib/db'
import { hashPassword, generateReferralCode, success, error, CAREER_RANKS } from '@/lib/api-utils'

// Deterministic referral code for seed
function seededReferralCode(name: string, idx: number): string {
  const base = name
    .split(' ')
    .map((n) => n.toUpperCase().substring(0, 4))
    .join('')
    .substring(0, 8)
  return `${base}${String(idx).padStart(4, '0')}`
}

export async function POST() {
  try {
    // Clear all existing data
    await db.pointTransaction.deleteMany()
    await db.ticketMessage.deleteMany()
    await db.ticket.deleteMany()
    await db.notification.deleteMany()
    await db.gratification.deleteMany()
    await db.careerMilestone.deleteMany()
    await db.cashbackEntry.deleteMany()
    await db.cashbackResidual.deleteMany()
    await db.cashbackSales.deleteMany()
    await db.transaction.deleteMany()
    await db.voucher.deleteMany()
    await db.invoice.deleteMany()
    await db.matrixPosition.deleteMany()
    await db.user.deleteMany()

    // Clear marketplace data
    await db.marketplaceOrderItem.deleteMany()
    await db.marketplaceOrder.deleteMany()
    await db.marketplaceProduct.deleteMany()

    const password = hashPassword('123456')

    // ============== CREATE ADMIN USER ==============
    const admin = await db.user.create({
      data: {
        name: 'Admin NewMobility',
        email: 'admin@newmobility.com',
        phone: '(11) 99999-0000',
        cpf: '000.000.000-00',
        password,
        role: 'admin',
        referralCode: 'ADMIN2025',
        plan: 'blue5',
        isActive: true,
        balanceWithdrawal: 500000,
        balanceMobility: 200000,
        balanceShopping: 300000,
        balanceFood: 150000,
        balancePharmacy: 100000,
        balanceGratification: 80000,
        careerPoints: 300,
        personalPoints: 50,
        stars: 5,
        city: 'São Paulo',
        state: 'SP',
        country: 'BR',
      },
    })

    // Create admin matrix positions
    await db.matrixPosition.createMany({
      data: [
        { userId: admin.id, matrixType: 'entrada', level: 0, position: 0 },
        { userId: admin.id, matrixType: 'residual', level: 0, position: 0 },
        { userId: admin.id, matrixType: 'vendas', level: 0, position: 0 },
      ],
    })

    // ============== CREATE MAIN DEMO USER ==============
    const mainUser = await db.user.create({
      data: {
        name: 'Carlos Eduardo Silva',
        email: 'carlos.silva@email.com',
        phone: '(11) 99876-5432',
        cpf: '123.456.789-00',
        password,
        role: 'user',
        referralCode: 'CARLOS2025',
        referredById: admin.id,
        plan: 'blue5',
        isActive: true,
        balanceWithdrawal: 3258000,
        balanceMobility: 727000,
        balanceShopping: 2727000,
        balanceFood: 687000,
        balancePharmacy: 558000,
        balanceGratification: 845000,
        careerPoints: 42,
        personalPoints: 18,
        stars: 3,
        isDriver: true,
        city: 'São Paulo',
        state: 'SP',
        country: 'BR',
        address: 'Rua Augusta, 1500',
        bankCode: '001',
        bankAgency: '1234',
        bankAccount: '56789-0',
        bankType: 'cc',
        createdAt: new Date('2023-06-15T10:00:00Z'),
      },
    })

    // Main user matrix positions
    const adminEntradaPos = await db.matrixPosition.findFirst({
      where: { userId: admin.id, matrixType: 'entrada' },
    })
    const adminResidualPos = await db.matrixPosition.findFirst({
      where: { userId: admin.id, matrixType: 'residual' },
    })
    const adminVendasPos = await db.matrixPosition.findFirst({
      where: { userId: admin.id, matrixType: 'vendas' },
    })

    await db.matrixPosition.createMany({
      data: [
        { userId: mainUser.id, matrixType: 'entrada', parentId: adminEntradaPos?.id, level: 1, position: 0 },
        { userId: mainUser.id, matrixType: 'residual', parentId: adminResidualPos?.id, level: 1, position: 0 },
        { userId: mainUser.id, matrixType: 'vendas', parentId: adminVendasPos?.id, level: 1, position: 0 },
      ],
    })

    // ============== CREATE DIRECT REFERRALS (Level 1) ==============
    const directReferralNames = [
      'Ana Paula Santos',
      'Roberto Lima Costa',
      'Fernanda Oliveira',
      'João Pedro Almeida',
    ]

    const directReferrals = []
    for (let i = 0; i < directReferralNames.length; i++) {
      const name = directReferralNames[i]
      const code = seededReferralCode(name, i + 1)
      const plan = i < 2 ? 'blue5' : 'blue3'

      const ref = await db.user.create({
        data: {
          name,
          email: name.toLowerCase().replace(/\s/g, '.') + '@email.com',
          phone: `(11) 99${String(100 + i).padStart(4, '0')}-${String(5000 + i).padStart(4, '0')}`,
          cpf: `${String(100 + i).padStart(3, '0')}.${String(200 + i).padStart(3, '0')}.${String(300 + i).padStart(3, '0')}-${String(10 + i).padStart(2, '0')}`,
          password,
          role: 'user',
          referralCode: code,
          referredById: mainUser.id,
          plan,
          isActive: true,
          balanceWithdrawal: Math.floor(Math.random() * 2000000) + 500000,
          balanceMobility: Math.floor(Math.random() * 500000) + 100000,
          balanceShopping: Math.floor(Math.random() * 1000000) + 200000,
          balanceFood: Math.floor(Math.random() * 300000) + 50000,
          balancePharmacy: Math.floor(Math.random() * 200000) + 30000,
          balanceGratification: Math.floor(Math.random() * 500000) + 100000,
          careerPoints: Math.floor(Math.random() * 50) + 5,
          personalPoints: Math.floor(Math.random() * 20) + 2,
          stars: Math.floor(Math.random() * 4) + 1,
          isDriver: i % 2 === 0,
          city: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba'][i],
          state: ['SP', 'RJ', 'MG', 'PR'][i],
          country: 'BR',
        },
      })

      directReferrals.push(ref)

      // Create matrix positions for each direct referral
      const mainEntradaPos = await db.matrixPosition.findFirst({
        where: { userId: mainUser.id, matrixType: 'entrada' },
      })
      const mainResidualPos = await db.matrixPosition.findFirst({
        where: { userId: mainUser.id, matrixType: 'residual' },
      })
      const mainVendasPos = await db.matrixPosition.findFirst({
        where: { userId: mainUser.id, matrixType: 'vendas' },
      })

      await db.matrixPosition.createMany({
        data: [
          { userId: ref.id, matrixType: 'entrada', parentId: mainEntradaPos?.id, level: 2, position: i },
          { userId: ref.id, matrixType: 'residual', parentId: mainResidualPos?.id, level: 2, position: i },
          { userId: ref.id, matrixType: 'vendas', parentId: mainVendasPos?.id, level: 2, position: i },
        ],
      })
    }

    // ============== CREATE LEVEL 2 REFERRALS (16 users) ==============
    const level2Users = []
    const l2Names = [
      'Maria Souza', 'Pedro Henrique', 'Lucas Martins', 'Julia Ferreira',
      'Marcos Ribeiro', 'Camila Dias', 'Rafael Gomes', 'Patricia Alves',
      'Bruno Costa', 'Larissa Nascimento', 'Diego Rocha', 'Beatriz Carvalho',
      'Thiago Moreira', 'Amanda Lopes', 'Gabriel Freitas', 'Isabela Rodrigues',
    ]

    for (let i = 0; i < l2Names.length; i++) {
      const name = l2Names[i]
      const parentRef = directReferrals[i % directReferrals.length]
      const code = seededReferralCode(name, i + 10)
      const plan = i % 3 === 0 ? 'blue5' : i % 3 === 1 ? 'blue3' : 'free'

      const user = await db.user.create({
        data: {
          name,
          email: name.toLowerCase().replace(/\s/g, '.') + '@email.com',
          phone: `(11) 98${String(2000 + i).padStart(4, '0')}-${String(6000 + i).padStart(4, '0')}`,
          cpf: `${String(400 + i).padStart(3, '0')}.${String(500 + i).padStart(3, '0')}.${String(600 + i).padStart(3, '0')}-${String(20 + i).padStart(2, '0')}`,
          password,
          role: 'user',
          referralCode: code,
          referredById: parentRef.id,
          plan,
          isActive: plan !== 'free',
          balanceWithdrawal: Math.floor(Math.random() * 1000000) + 100000,
          balanceMobility: Math.floor(Math.random() * 300000) + 50000,
          balanceShopping: Math.floor(Math.random() * 500000) + 100000,
          balanceFood: Math.floor(Math.random() * 200000) + 20000,
          balancePharmacy: Math.floor(Math.random() * 100000) + 10000,
          balanceGratification: Math.floor(Math.random() * 300000) + 50000,
          careerPoints: Math.floor(Math.random() * 20) + 1,
          personalPoints: Math.floor(Math.random() * 10),
          stars: Math.floor(Math.random() * 3),
          isDriver: i % 3 === 0,
          city: ['São Paulo', 'Rio de Janeiro', 'Salvador', 'Fortaleza', 'Porto Alegre'][i % 5],
          state: ['SP', 'RJ', 'BA', 'CE', 'RS'][i % 5],
          country: 'BR',
        },
      })

      level2Users.push(user)

      // Create matrix positions for level 2
      const parentEntradaPos = await db.matrixPosition.findFirst({
        where: { userId: parentRef.id, matrixType: 'entrada' },
      })
      const parentResidualPos = await db.matrixPosition.findFirst({
        where: { userId: parentRef.id, matrixType: 'residual' },
      })
      const parentVendasPos = await db.matrixPosition.findFirst({
        where: { userId: parentRef.id, matrixType: 'vendas' },
      })

      await db.matrixPosition.createMany({
        data: [
          { userId: user.id, matrixType: 'entrada', parentId: parentEntradaPos?.id, level: 3, position: i },
          { userId: user.id, matrixType: 'residual', parentId: parentResidualPos?.id, level: 3, position: i },
          { userId: user.id, matrixType: 'vendas', parentId: parentVendasPos?.id, level: 3, position: i },
        ],
      })
    }

    // ============== CREATE CASHBACK ENTRADA ENTRIES ==============
    // Simulate the 1,066 users in the cashback entrada matrix
    const entradaPercentages = [5, 10, 10, 5, 5]
    const entradaUserCounts = [4, 16, 64, 256, 1024]
    const entradaEarnedPerLevel = [48500, 194000, 388000, 194000, 388000] // in cents

    for (let level = 1; level <= 5; level++) {
      const numEntries = Math.min(entradaUserCounts[level - 1], 50) // Create representative entries
      for (let j = 0; j < numEntries; j++) {
        const fromUser = level === 1
          ? directReferrals[j % directReferrals.length]
          : level2Users[j % level2Users.length]

        await db.cashbackEntry.create({
          data: {
            userId: mainUser.id,
            fromUserId: fromUser.id,
            amount: Math.floor(entradaEarnedPerLevel[level - 1] / numEntries),
            level,
            percentage: entradaPercentages[level - 1],
            description: `Cashback entrada nível ${level}`,
          },
        })
      }
    }

    // ============== CREATE CASHBACK RESIDUAL ENTRIES ==============
    const residualPercentages = [5, 5.5, 6, 6.5, 7, 7.5, 8]
    for (let level = 1; level <= 7; level++) {
      const numEntries = level <= 2 ? 2 : 1
      for (let j = 0; j < numEntries; j++) {
        const fromUser = j < directReferrals.length ? directReferrals[j] : level2Users[j % level2Users.length]
        await db.cashbackResidual.create({
          data: {
            userId: mainUser.id,
            fromUserId: fromUser.id,
            amount: Math.floor(Math.random() * 50000) + 10000,
            level,
            percentage: residualPercentages[level - 1],
            description: `Cashback residual nível ${level}`,
          },
        })
      }
    }

    // ============== CREATE CASHBACK VENDAS ENTRIES ==============
    const vendasCategories = ['mobility', 'food', 'pharmacy', 'pet', 'shopping']
    const vendasPercentages = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.2]
    for (let level = 1; level <= 9; level++) {
      const numEntries = level <= 3 ? 5 : 3
      for (let j = 0; j < numEntries; j++) {
        const fromUser = j < directReferrals.length ? directReferrals[j] : level2Users[j % level2Users.length]
        await db.cashbackSales.create({
          data: {
            userId: mainUser.id,
            fromUserId: fromUser.id,
            amount: Math.floor(Math.random() * 30000) + 5000,
            level,
            percentage: vendasPercentages[level - 1],
            category: vendasCategories[(level + j) % vendasCategories.length],
            description: `Cashback vendas nível ${level}`,
          },
        })
      }
    }

    // ============== CREATE TRANSACTIONS ==============
    const transactionTypes = [
      { type: 'deposit', amount: 14700, status: 'approved', category: 'plan_upgrade', desc: 'Upgrade para plano Blue 5' },
      { type: 'cashback_entry', amount: 48500, status: 'approved', category: 'withdrawal', desc: 'Cashback Entrada - Nível 1' },
      { type: 'cashback_entry', amount: 194000, status: 'approved', category: 'withdrawal', desc: 'Cashback Entrada - Nível 2' },
      { type: 'cashback_residual', amount: 35000, status: 'approved', category: 'withdrawal', desc: 'Cashback Residual - Nível 1' },
      { type: 'cashback_sales', amount: 15000, status: 'approved', category: 'mobility', desc: 'Cashback Vendas - Mobilidade' },
      { type: 'cashback_sales', amount: 8500, status: 'approved', category: 'food', desc: 'Cashback Vendas - Refeição' },
      { type: 'cashback_sales', amount: 5200, status: 'approved', category: 'pharmacy', desc: 'Cashback Vendas - Farmácia' },
      { type: 'cashback_sales', amount: 12000, status: 'approved', category: 'shopping', desc: 'Cashback Vendas - Compras' },
      { type: 'gratification', amount: 50000, status: 'approved', category: 'gratification', desc: 'Gratificação - Equipe Mobilidade' },
      { type: 'withdrawal', amount: -200000, status: 'approved', category: 'withdrawal', desc: 'Saque realizado' },
      { type: 'deposit', amount: 9700, status: 'approved', category: 'plan_blue3', desc: 'Pagamento plano Blue 3' },
      { type: 'voucher', amount: 25000, status: 'approved', category: 'mobility', desc: 'Voucher Mobilidade R$250' },
      { type: 'cashback_entry', amount: 388000, status: 'approved', category: 'withdrawal', desc: 'Cashback Entrada - Nível 3' },
      { type: 'bonus', amount: 100000, status: 'approved', category: 'withdrawal', desc: 'Bônus de liderança' },
      { type: 'withdrawal', amount: -150000, status: 'pending', category: 'withdrawal', desc: 'Saque solicitado' },
    ]

    for (const tx of transactionTypes) {
      const daysAgo = Math.floor(Math.random() * 90) + 1
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      await db.transaction.create({
        data: {
          userId: mainUser.id,
          type: tx.type,
          amount: tx.amount,
          status: tx.status,
          category: tx.category,
          description: tx.desc,
          createdAt,
        },
      })
    }

    // ============== CREATE VOUCHERS ==============
    const voucherData = [
      { code: 'MOB2025001', amount: 50000, type: 'mobility', isUsed: false },
      { code: 'PAY2025002', amount: 30000, type: 'payment', isUsed: false },
      { code: 'BON2025003', amount: 100000, type: 'bonus', isUsed: false },
      { code: 'MOB2025004', amount: 25000, type: 'mobility', isUsed: true },
      { code: 'PAY2025005', amount: 50000, type: 'payment', isUsed: true },
    ]

    for (const v of voucherData) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + (v.isUsed ? -30 : 90))
      await db.voucher.create({
        data: {
          userId: mainUser.id,
          code: v.code,
          amount: v.amount,
          type: v.type,
          isUsed: v.isUsed,
          usedAt: v.isUsed ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : null,
          expiresAt,
        },
      })
    }

    // ============== CREATE INVOICES ==============
    const invoiceData = [
      { amount: 14700, type: 'plan_blue5', status: 'paid' },
      { amount: 9700, type: 'plan_blue3', status: 'paid' },
      { amount: 14700, type: 'monthly_fee', status: 'pending' },
    ]

    for (const inv of invoiceData) {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + (inv.status === 'paid' ? -30 : 15))
      await db.invoice.create({
        data: {
          userId: mainUser.id,
          amount: inv.amount,
          type: inv.type,
          status: inv.status,
          dueDate,
          paidAt: inv.status === 'paid' ? new Date(dueDate.getTime() - 2 * 24 * 60 * 60 * 1000) : null,
        },
      })
    }

    // ============== CREATE CAREER MILESTONES ==============
    for (const rank of CAREER_RANKS) {
      const achieved = mainUser.careerPoints >= rank.minPoints
      await db.careerMilestone.create({
        data: {
          userId: mainUser.id,
          milestone: rank.name,
          pointsRequired: rank.minPoints,
          achieved,
          achievedAt: achieved ? new Date() : null,
        },
      })
    }

    // ============== CREATE GRATIFICATIONS ==============
    const gratificationData = [
      { type: 'mobility_team', amount: 150000, category: 'mobility', description: 'Equipe de Mobilidade' },
      { type: 'shopping', amount: 80000, category: 'shopping', description: 'Gratificação Compras' },
      { type: 'leadership', amount: 200000, category: 'withdrawal', description: 'Bônus Liderança' },
      { type: 'telemedicine', amount: 50000, category: 'service', description: 'Telemedicina' },
      { type: 'dental', amount: 40000, category: 'service', description: 'Plano Odontológico' },
      { type: 'insurance_phone', amount: 30000, category: 'service', description: 'Seguro Celular' },
      { type: 'fuel_aid', amount: 60000, category: 'mobility', description: 'Auxílio Combustível' },
    ]

    for (const g of gratificationData) {
      const isClaimed = Math.random() > 0.5
      await db.gratification.create({
        data: {
          userId: mainUser.id,
          type: g.type,
          amount: g.amount,
          category: g.category,
          description: g.description,
          isClaimed,
          claimedAt: isClaimed ? new Date() : null,
        },
      })
    }

    // ============== CREATE POINT TRANSACTIONS ==============
    const pointTypes = [
      { amount: 10, type: 'direct_referral', description: 'Indicação direta - Ana Paula' },
      { amount: 10, type: 'direct_referral', description: 'Indicação direta - Roberto' },
      { amount: 10, type: 'direct_referral', description: 'Indicação direta - Fernanda' },
      { amount: 10, type: 'direct_referral', description: 'Indicação direta - João Pedro' },
      { amount: 5, type: 'service_use', description: 'Uso do app mobilidade' },
      { amount: 3, type: 'purchase', description: 'Compra no app de compras' },
      { amount: 2, type: 'evaluation_received', description: 'Avaliação recebida' },
      { amount: 2, type: 'evaluation_upline', description: 'Avaliação upline' },
    ]

    for (const pt of pointTypes) {
      const daysAgo = Math.floor(Math.random() * 60) + 1
      await db.pointTransaction.create({
        data: {
          userId: mainUser.id,
          amount: pt.amount,
          type: pt.type,
          description: pt.description,
          createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        },
      })
    }

    // ============== CREATE SUPPORT TICKETS ==============
    const ticketData = [
      { subject: 'Dúvida sobre saque', category: 'financial', message: 'Gostaria de saber como realizar um saque do saldo disponível.' },
      { subject: 'Problema no app de mobilidade', category: 'technical', message: 'O app de mobilidade está apresentando erro ao tentar solicitar corrida.' },
      { subject: 'Voucher não funcionou', category: 'shopping', message: 'Tentei usar o voucher MOB2025004 mas não foi aplicado o desconto.' },
    ]

    for (const t of ticketData) {
      const ticket = await db.ticket.create({
        data: {
          userId: mainUser.id,
          subject: t.subject,
          category: t.category,
          status: 'open',
          messages: {
            create: {
              userId: mainUser.id,
              message: t.message,
              isAdmin: false,
            },
          },
        },
      })

      // Add admin reply to some tickets
      if (Math.random() > 0.3) {
        await db.ticketMessage.create({
          data: {
            ticketId: ticket.id,
            userId: admin.id,
            message: 'Olá! Estamos analisando sua solicitação. Em breve retornaremos com uma resposta.',
            isAdmin: true,
          },
        })
        await db.ticket.update({
          where: { id: ticket.id },
          data: { status: 'in_progress' },
        })
      }
    }

    // ============== CREATE NOTIFICATIONS ==============
    const notificationData = [
      { title: 'Bem-vindo!', message: 'Sua conta foi ativada com sucesso no plano Blue 5.', type: 'success' },
      { title: 'Cashback recebido', message: 'Você recebeu R$ 485,00 de cashback entrada nível 1.', type: 'success' },
      { title: 'Nova indicação', message: 'Ana Paula Santos se cadastrou com seu código.', type: 'info' },
      { title: 'Gratificação disponível', message: 'Você tem uma nova gratificação de Equipe de Mobilidade disponível.', type: 'info' },
      { title: 'Saque processado', message: 'Seu saque de R$ 2.000,00 foi processado com sucesso.', type: 'success' },
    ]

    for (const n of notificationData) {
      await db.notification.create({
        data: {
          userId: mainUser.id,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: Math.random() > 0.5,
        },
      })
    }

    // ============== CREATE SOME ADDITIONAL FREE USERS FOR CHART DATA ==============
    const additionalUserNames = [
      'Luciana Barbosa', 'Felipe Andrade', 'Carolina Mendes', 'Vinicius Santos',
      'Priscila Teixeira', 'Rodrigo Pinto', 'Daniela Farias', 'Eduardo Nogueira',
    ]

    for (let i = 0; i < additionalUserNames.length; i++) {
      const name = additionalUserNames[i]
      const code = seededReferralCode(name, i + 30)
      const plan = i < 3 ? 'free' : i < 6 ? 'blue3' : 'blue5'

      await db.user.create({
        data: {
          name,
          email: name.toLowerCase().replace(/\s/g, '.') + '@email.com',
          phone: `(21) 9${String(3000 + i).padStart(4, '0')}-${String(7000 + i).padStart(4, '0')}`,
          cpf: `${String(700 + i).padStart(3, '0')}.${String(800 + i).padStart(3, '0')}.${String(900 + i).padStart(3, '0')}-${String(30 + i).padStart(2, '0')}`,
          password,
          role: 'user',
          referralCode: code,
          referredById: level2Users[i % level2Users.length]?.id || mainUser.id,
          plan,
          isActive: plan !== 'free',
          balanceWithdrawal: Math.floor(Math.random() * 200000),
          balanceMobility: Math.floor(Math.random() * 100000),
          balanceShopping: Math.floor(Math.random() * 150000),
          balanceFood: Math.floor(Math.random() * 80000),
          balancePharmacy: Math.floor(Math.random() * 50000),
          balanceGratification: Math.floor(Math.random() * 100000),
          careerPoints: Math.floor(Math.random() * 10),
          personalPoints: Math.floor(Math.random() * 5),
          stars: plan === 'free' ? 0 : 1,
          city: 'Rio de Janeiro',
          state: 'RJ',
          country: 'BR',
        },
      })
    }

    // ============== CREATE MARKETPLACE PRODUCTS ==============
    const marketplaceProducts = [
      { name: 'Smartphone X Pro', description: 'Smartphone premium com câmera de 108MP, tela AMOLED 6.7" e bateria de 5000mAh. Compre e ganhe CashBack na sua conta NewMobility!', price: 299900, originalPrice: 349900, category: 'electronics', cashbackPercent: 5, rating: 4.5, reviewCount: 128, sellerName: 'TechStore', isFeatured: true, stock: 50 },
      { name: 'Fone Bluetooth Elite', description: 'Fone de ouvido Bluetooth com cancelamento de ruído ativo, 30h de bateria e áudio Hi-Res. CashBack NewMobility!', price: 19900, originalPrice: 29900, category: 'electronics', cashbackPercent: 8, rating: 4.2, reviewCount: 89, sellerName: 'AudioMax', isFeatured: true, stock: 200 },
      { name: 'Camiseta Premium', description: 'Camiseta 100% algodão egípcio, corte moderno e confortável. Disponível em várias cores. Ganhe CashBack!', price: 8900, originalPrice: 12900, category: 'fashion', cashbackPercent: 10, rating: 4.0, reviewCount: 56, sellerName: 'ModaFit', isFeatured: false, stock: 500 },
      { name: 'Tênis Esportivo Run', description: 'Tênis de corrida com tecnologia de amortecimento responsive e palmilha anatômica. CashBack NewMobility!', price: 29900, originalPrice: 39900, category: 'fashion', cashbackPercent: 7, rating: 4.7, reviewCount: 203, sellerName: 'SportLife', isFeatured: true, stock: 150 },
      { name: 'Purificador de Ar', description: 'Purificador de ar com filtro HEPA, ideal para quartos e salas até 40m². CashBack NewMobility!', price: 45900, originalPrice: 59900, category: 'home', cashbackPercent: 6, rating: 4.3, reviewCount: 42, sellerName: 'HomeClean', isFeatured: false, stock: 80 },
      { name: 'Kit Organização', description: 'Kit completo de organização para casa com 12 peças em plástico premium. Ganhe CashBack!', price: 7900, originalPrice: 11900, category: 'home', cashbackPercent: 12, rating: 4.1, reviewCount: 34, sellerName: 'OrgBrasil', isFeatured: false, stock: 300 },
      { name: 'Vitamínico Complex', description: 'Suplemento vitamínico com 25 vitaminas e minerais essenciais. 60 cápsulas. CashBack NewMobility!', price: 6900, originalPrice: 8900, category: 'health', cashbackPercent: 15, rating: 4.6, reviewCount: 167, sellerName: 'VidaSaúde', isFeatured: true, stock: 1000 },
      { name: 'Kit Skincare', description: 'Kit de cuidados com a pele: sérum, hidratante e protetor solar FPS 50. CashBack NewMobility!', price: 12900, originalPrice: 18900, category: 'beauty', cashbackPercent: 10, rating: 4.4, reviewCount: 95, sellerName: 'BeautyPro', isFeatured: false, stock: 200 },
      { name: 'Café Especial 500g', description: 'Café especial 100% arábica, torra média, moído. Direto do produtor. CashBack NewMobility!', price: 4500, originalPrice: 5900, category: 'food', cashbackPercent: 8, rating: 4.8, reviewCount: 312, sellerName: 'CaféBrasil', isFeatured: false, stock: 5000 },
      { name: 'Acesso Streaming 1 ano', description: 'Assinatura anual de plataforma de streaming. Acesso ilimitado a filmes e séries. CashBack 20%!', price: 19900, originalPrice: 29900, category: 'digital', cashbackPercent: 20, rating: 4.0, reviewCount: 78, sellerName: 'DigitalPlus', isFeatured: false, stock: 9999 },
      { name: 'Recarga Celular R$50', description: 'Recarga de celular instantânea para qualquer operadora. Valor: R$ 50,00. CashBack 3%!', price: 5000, originalPrice: null, category: 'services', cashbackPercent: 3, rating: 5.0, reviewCount: 520, sellerName: 'RecargaFast', isFeatured: false, stock: 9999 },
      { name: 'Corrida Premium 30km', description: 'Crédito de corrida premium no app de mobilidade. Válido para 30km. CashBack 5%!', price: 4500, originalPrice: 6000, category: 'mobility', cashbackPercent: 5, rating: 4.3, reviewCount: 89, sellerName: 'NMobilidade', isFeatured: false, stock: 9999 },
    ]

    for (const mp of marketplaceProducts) {
      await db.marketplaceProduct.create({ data: mp })
    }

    return success({
      message: 'Database seeded successfully',
      users: {
        total: (await db.user.count()),
        admin: admin.email,
        mainUser: mainUser.email,
      },
      credentials: {
        email: 'carlos.silva@email.com',
        password: '123456',
        adminEmail: 'admin@newmobility.com',
        adminPassword: '123456',
      },
    }, 201)
  } catch (err) {
    console.error('Seed error:', err)
    return error('Internal server error: ' + (err instanceof Error ? err.message : String(err)), 500)
  }
}
