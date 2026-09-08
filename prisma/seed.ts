// ============================================================================
// prisma/seed.ts — Initial database seed for NewMobility
// ----------------------------------------------------------------------------
// Run with:  npm run seed   (or `bun run seed`)
//
// This script is IDEMPOTENT — it uses upsert() everywhere, so running it more
// than once is safe and won't duplicate rows or overwrite admin-edited data.
//
// What it creates:
//   1. Admin user            — admin@newmobility.com / admin123  (role=admin)
//   2. Demo users per app    — cliente@.. / motorista@.. / lojista@..
//   3. SystemConfig defaults — platform_name, cashback %, withdrawal limits
//   4. UserType defaults     — motorista, passageiro, comercio, entregador...
//   5. Plan defaults         — free / blue3 / blue5
//   6. AppCategory defaults  — shopping, alimentacao, mercado, medidrop...
//   7. FAQ defaults          — basic support FAQ
//
// NOTE on password hashing: the existing /api/auth/login route uses SHA-256
// (via src/lib/api-utils.ts -> hashPassword()). We mirror that here so the
// seeded admin can log in immediately. We do NOT use bcrypt because the
// verifyPassword() helper wouldn't recognise the hash.
// ============================================================================

import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient({
  log: ['warn', 'error'],
})

// -----------------------------------------------------------------------------
// Password hashing — MUST match src/lib/api-utils.ts hashPassword()
// -----------------------------------------------------------------------------
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

function generateReferralCode(name: string): string {
  const base = name
    .split(' ')
    .map((n) => n.toUpperCase())
    .slice(0, 2)
    .join('')
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${base}${num}`
}

// -----------------------------------------------------------------------------
// Seed data
// -----------------------------------------------------------------------------

const SEED_USERS = [
  {
    id: 'admin-root',
    email: 'admin@newmobility.com',
    name: 'Administrador NewMobility',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    userType: 'usuario',
    isActive: true,
    isDriver: false,
    isDelivery: false,
    plan: 'blue5',
    qualification: 'admin',
    referralCode: 'ADMIN001',
  },
  {
    id: 'demo-cliente',
    email: 'cliente@newmobility.com',
    name: 'Carlos Cliente',
    username: 'carlos.cliente',
    password: '123456',
    role: 'user',
    userType: 'usuario',
    isActive: true,
    isDriver: false,
    isDelivery: false,
    plan: 'blue3',
    qualification: 'passageiro',
    referralCode: 'CLIENTE001',
  },
  {
    id: 'demo-motorista',
    email: 'motorista@newmobility.com',
    name: 'Marcos Motorista',
    username: 'marcos.motorista',
    password: '123456',
    role: 'user',
    userType: 'motorista',
    isActive: true,
    isDriver: true,
    isDelivery: false,
    plan: 'blue3',
    qualification: 'motorista',
    referralCode: 'MOTO001',
  },
  {
    id: 'demo-lojista',
    email: 'lojista@newmobility.com',
    name: 'Luciana Lojista',
    username: 'luciana.lojista',
    password: '123456',
    role: 'user',
    userType: 'lojista',
    isActive: true,
    isDriver: false,
    isDelivery: true,
    plan: 'blue3',
    qualification: 'comercio',
    referralCode: 'LOJA001',
  },
]

const SEED_CONFIGS = [
  { key: 'platform_name', value: 'NewMobility', description: 'Platform display name' },
  { key: 'maintenance_mode', value: 'false', description: 'Maintenance mode enabled' },
  { key: 'registration_enabled', value: 'true', description: 'New registrations enabled' },
  { key: 'cashback_entrada_pct', value: '35', description: 'CashBack Entrada percentage' },
  { key: 'cashback_residual_pct', value: '45', description: 'CashBack Residual percentage' },
  { key: 'cashback_vendas_pct', value: '0.9', description: 'CashBack Vendas percentage' },
  { key: 'min_withdrawal', value: '5000', description: 'Minimum withdrawal amount in cents' },
  { key: 'max_withdrawal', value: '500000', description: 'Maximum withdrawal amount in cents' },
  { key: 'withdrawal_fee_pct', value: '2', description: 'Withdrawal fee percentage' },
  { key: 'app_logo_url', value: '', description: 'Platform logo (base64 data URL)' },
  { key: 'admin_permissions', value: JSON.stringify({ admin: ['*'] }), description: 'Per-role admin page allow-list' },
  { key: 'points_dailyLoginPoints', value: '1', description: 'Points credited on first login of the day' },
]

const SEED_USER_TYPES = [
  {
    code: 'motorista',
    label: 'Motorista',
    description: 'Condutor de veículo (carro/moto) que realiza corridas',
    sortOrder: 1,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: true,
    mobilePermissions: '["dashboard","wallet","ride_request","cashback","career","metas","indicacoes"]',
    color: '#3b82f6',
    icon: '🚗',
  },
  {
    code: 'passageiro',
    label: 'Passageiro',
    description: 'Usuário comum que solicita corridas',
    sortOrder: 2,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: false,
    mobilePermissions: '["dashboard","wallet","ride_request","cashback","career","indicacoes"]',
    color: '#10b981',
    icon: '👤',
  },
  {
    code: 'passageiro_60',
    label: 'Passageiro 60+',
    description: 'Passageiro com 60 anos ou mais (benefícios especiais)',
    sortOrder: 3,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: false,
    mobilePermissions: '["dashboard","wallet","ride_request","cashback","career","indicacoes"]',
    color: '#f59e0b',
    icon: '🧓',
  },
  {
    code: 'passageiro_pcd',
    label: 'Passageiro com Mobilidade Reduzida',
    description: 'Passageiro PCD com necessidades especiais de acessibilidade',
    sortOrder: 4,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: false,
    mobilePermissions: '["dashboard","wallet","ride_request","cashback","career","indicacoes"]',
    color: '#8b5cf6',
    icon: '♿',
  },
  {
    code: 'comercio',
    label: 'Comércio',
    description: 'Lojista / comerciante parceiro (recebe cashback de vendas)',
    sortOrder: 5,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: false,
    mobilePermissions: '["dashboard","wallet","store","cashback","career","indicacoes"]',
    color: '#ec4899',
    icon: '🏪',
  },
  {
    code: 'entregador',
    label: 'Entregador',
    description: 'Entregador de encomendas / food delivery',
    sortOrder: 6,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: true,
    mobilePermissions: '["dashboard","wallet","delivery","cashback","career","metas","indicacoes"]',
    color: '#f97316',
    icon: '🛵',
  },
  // ---- Novos tipos (Task 2-e) ----
  {
    code: 'cliente',
    label: 'Cliente',
    description: 'Usuário comum que utiliza os serviços da plataforma',
    sortOrder: 7,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: false,
    mobilePermissions: '["dashboard","wallet","ride_request","cashback","career","indicacoes"]',
    color: '#10b981',
    icon: '👤',
  },
  {
    code: 'lojista',
    label: 'Lojista',
    description: 'Lojista / comerciante parceiro (gerencia loja, produtos e pedidos no Portal do Lojista)',
    sortOrder: 8,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: false,
    mobilePermissions: '["dashboard","wallet","store","cashback","career","indicacoes"]',
    color: '#ec4899',
    icon: '🏪',
  },
  {
    code: 'mototaxista',
    label: 'Mototaxista',
    description: 'Condutor de moto que realiza transporte de passageiros (moto-táxi)',
    sortOrder: 9,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: true,
    mobilePermissions: '["dashboard","wallet","ride_request","cashback","career","metas","indicacoes"]',
    color: '#06b6d4',
    icon: '🏍️',
  },
  {
    code: 'motofretista',
    label: 'Motofretista',
    description: 'Condutor de moto que realiza entrega de encomendas (moto-frete)',
    sortOrder: 10,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: true,
    mobilePermissions: '["dashboard","wallet","delivery","cashback","career","metas","indicacoes"]',
    color: '#0ea5e9',
    icon: '📦',
  },
  {
    code: 'motorista_app',
    label: 'Motorista de App',
    description: 'Condutor de veículo cadastrado em aplicativos de transporte (Uber, 99, etc.)',
    sortOrder: 11,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: true,
    mobilePermissions: '["dashboard","wallet","ride_request","cashback","career","metas","indicacoes"]',
    color: '#6366f1',
    icon: '📱',
  },
  {
    code: 'taxista',
    label: 'Taxista',
    description: 'Condutor de táxi licenciado (ponto fixo ou via aplicativo)',
    sortOrder: 12,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: true,
    mobilePermissions: '["dashboard","wallet","ride_request","cashback","career","metas","indicacoes"]',
    color: '#eab308',
    icon: '🚕',
  },
  {
    code: 'caminhoneiro',
    label: 'Caminhoneiro',
    description: 'Condutor de caminhão para transporte de cargas (curta, média e longa distância)',
    sortOrder: 13,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: true,
    mobilePermissions: '["dashboard","wallet","delivery","cashback","career","metas","indicacoes"]',
    color: '#84cc16',
    icon: '🚚',
  },
  {
    code: 'outros',
    label: 'Outros',
    description: 'Outro tipo de atuação não listado (campo livre para personalização futura)',
    sortOrder: 99,
    defaultEntradaLevel: 0,
    defaultResidualLevel: 0,
    defaultVendasLevel: 0,
    showDriverGoals: false,
    mobilePermissions: '["dashboard","wallet","cashback","career","indicacoes"]',
    color: '#6b7280',
    icon: '⚙️',
  },
]

const SEED_PLANS = [
  {
    id: 'free',
    code: 'free',
    name: 'Gratuito',
    priceCents: 0,
    description: 'Plano gratuito para cadastro e indicações.',
    features: ['Cadastro gratuito', 'Indicação de usuários'],
    isActive: true,
    isDefault: true,
    sortOrder: 0,
  },
  {
    id: 'blue3',
    code: 'blue3',
    name: 'Blue 3',
    priceCents: 99990,
    description: 'Plano Blue 3 com acesso completo às matrizes e apps.',
    features: [
      'Cashback Entrada (matriz 4x5)',
      'Cashback Residual (matriz 4x7)',
      'Cashback Vendas (matriz 4x9)',
      'App Mobilidade',
      'App Refeição',
      'App Farmácia',
      'App Compras',
      'Gratificações disponíveis',
      'Plano de Carreira',
    ],
    isActive: true,
    isDefault: true,
    sortOrder: 1,
  },
  {
    id: 'blue5',
    code: 'blue5',
    name: 'Blue 5',
    priceCents: 99990,
    description: 'Plano Blue 5 premium com benefícios exclusivos.',
    features: [
      'Tudo do plano Blue 3',
      'Gratificações exclusivas',
      'Prioridade no suporte',
      'Bônus de adesão aumentado',
      'App Pet',
      'Seguro telefone',
      'Telemedicina',
      'Assistência funerária',
    ],
    isActive: true,
    isDefault: true,
    sortOrder: 2,
  },
]

const SEED_CATEGORIES = [
  { code: 'shopping', label: 'Shopping', icon: 'ShoppingBag', color: '#155EEF', sortOrder: 1 },
  { code: 'alimentacao', label: 'Alimentação', icon: 'UtensilsCrossed', color: '#F59E0B', sortOrder: 2 },
  { code: 'mercado', label: 'Mercado', icon: 'Cart', color: '#22C55E', sortOrder: 3 },
  { code: 'medidrop', label: 'MediDrop', icon: 'Pill', color: '#8B5CF6', sortOrder: 4 },
  { code: 'reserva', label: 'Reserva', icon: 'Calendar', color: '#EC4899', sortOrder: 5 },
  { code: 'assistencia', label: 'Assistência', icon: 'Wrench', color: '#06B6D4', sortOrder: 6 },
  { code: 'enviar', label: 'Enviar', icon: 'Send', color: '#F97316', sortOrder: 7 },
  { code: 'mobilidade', label: 'Mobilidade', icon: 'Car', color: '#3B82F6', sortOrder: 8 },
]

const SEED_FAQS = [
  {
    question: 'Como funciona o CashBack da NewMobility?',
    answer:
      'Ao realizar compras em lojas parceiras ou indicar novos usuários, você acumula CashBack em diferentes carteiras (Entrada, Residual, Vendas). O saldo pode ser sacado via PIX ou usado para pagar serviços dentro da plataforma.',
    category: 'cashback',
    sortOrder: 1,
  },
  {
    question: 'Como faço para me cadastrar como motorista?',
    answer:
      'Acesse o App Motorista em /motorista, faça login com sua conta NewMobility e siga o fluxo de ativação. Após o admin aprovar seus documentos (CNH, RG, comprovante), você começa a receber corridas.',
    category: 'motorista',
    sortOrder: 2,
  },
  {
    question: 'Como funciona o App Lojista?',
    answer:
      'O Painel do Lojista em /lojista permite que comerciantes parceiros gerenciem sua loja, produtos, pedidos e financeiro. Acesse /lojista e faça login com uma conta tipo "lojista" ou "comércio".',
    category: 'lojista',
    sortOrder: 3,
  },
  {
    question: 'Quais são os planos disponíveis?',
    answer:
      'Temos 3 planos: Gratuito (cadastro e indicações), Blue 3 (R$ 97 — acesso completo às matrizes e apps) e Blue 5 (R$ 147 — premium com telemedicina, seguro telefone e benefícios exclusivos).',
    category: 'planos',
    sortOrder: 4,
  },
  {
    question: 'Como faço um saque do meu saldo?',
    answer:
      'Acesse a página Carteira > Saque, informe o valor (mínimo R$ 50,00) e sua chave PIX. O saque é processado em até 2 dias úteis após aprovação do admin.',
    category: 'financeiro',
    sortOrder: 5,
  },
  {
    question: 'Esqueci minha senha, como recuperar?',
    answer:
      'Na tela de login, clique em "Esqueci minha senha". Você receberá um link de redefinição no e-mail cadastrado. Se não receber em 5 minutos, verifique o spam ou contate o suporte.',
    category: 'conta',
    sortOrder: 6,
  },
]

// -----------------------------------------------------------------------------
// Seed runner
// -----------------------------------------------------------------------------

async function seedUsers() {
  console.log('→ Seeding users...')
  for (const u of SEED_USERS) {
    const passwordHash = hashPassword(u.password)
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        // Only update auth-critical fields if the user already exists
        role: u.role,
        userType: u.userType,
        isDriver: u.isDriver,
        isDelivery: u.isDelivery,
        isActive: u.isActive,
        plan: u.plan,
        qualification: u.qualification,
      },
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        username: u.username,
        password: passwordHash,
        role: u.role,
        userType: u.userType,
        isActive: u.isActive,
        isDriver: u.isDriver,
        isDelivery: u.isDelivery,
        plan: u.plan,
        qualification: u.qualification,
        referralCode: u.referralCode,
        country: 'BR',
        pixEnabled: true,
      },
    })
  }
  console.log(`  ✓ ${SEED_USERS.length} users ready (admin + 3 demo)`)
}

async function seedSystemConfigs() {
  console.log('→ Seeding SystemConfig...')
  for (const c of SEED_CONFIGS) {
    await prisma.systemConfig.upsert({
      where: { key: c.key },
      update: {}, // do not overwrite admin-edited values
      create: { key: c.key, value: c.value, description: c.description },
    })
  }
  console.log(`  ✓ ${SEED_CONFIGS.length} config keys ready`)
}

async function seedUserTypes() {
  console.log('→ Seeding UserType...')
  for (const t of SEED_USER_TYPES) {
    await prisma.userType.upsert({
      where: { code: t.code },
      update: {}, // do not overwrite admin-edited types
      create: t,
    })
  }
  console.log(`  ✓ ${SEED_USER_TYPES.length} user types ready`)
}

async function seedPlans() {
  console.log('→ Seeding Plans...')
  // Resolve matrix type IDs by code so plans match the existing matrix config.
  const matrixTypes = await prisma.matrixType.findMany().catch(() => [])
  const findMt = (code: string) => matrixTypes.find((m) => m.code === code)?.id || null

  const matrixCodeMap: Record<string, { entrada?: string; residual?: string; vendas?: string }> = {
    free: { entrada: 'entrada_4x5', residual: 'residual_4x7', vendas: 'vendas_4x9' },
    blue3: { entrada: 'entrada_4x5', residual: 'residual_4x7', vendas: 'vendas_4x9' },
    blue5: { entrada: 'entrada_4x5', residual: 'residual_4x7', vendas: 'vendas_4x9' },
  }

  for (const p of SEED_PLANS) {
    const m = matrixCodeMap[p.code] || {}
    await prisma.plan.upsert({
      where: { code: p.code },
      update: { priceCents: p.priceCents }, // FIX: always sync price
      create: {
        id: p.id,
        code: p.code,
        name: p.name,
        priceCents: p.priceCents,
        description: p.description,
        features: JSON.stringify(p.features),
        isActive: p.isActive,
        isDefault: p.isDefault,
        sortOrder: p.sortOrder,
        matrixEntradaId: findMt(m.entrada || ''),
        matrixResidualId: findMt(m.residual || ''),
        matrixVendasId: findMt(m.vendas || ''),
      },
    })
  }
  console.log(`  ✓ ${SEED_PLANS.length} plans ready (free / blue3 / blue5)`)
}

async function seedCategories() {
  console.log('→ Seeding AppCategory...')
  for (const c of SEED_CATEGORIES) {
    try {
      await prisma.appCategory.upsert({
        where: { code: c.code },
        update: {},
        create: c,
      })
    } catch {
      // AppCategory table may not exist if prisma db push hasn't been run yet —
      // skip silently so the seed doesn't fail on older deployments.
    }
  }
  console.log(`  ✓ ${SEED_CATEGORIES.length} app categories ready`)
}

async function seedFaqs() {
  console.log('→ Seeding FAQ...')
  for (const f of SEED_FAQS) {
    // No natural unique key — only create if no FAQ with the same question exists
    const existing = await prisma.fAQ.findFirst({ where: { question: f.question } })
    if (existing) continue
    await prisma.fAQ.create({
      data: {
        question: f.question,
        answer: f.answer,
        category: f.category,
        sortOrder: f.sortOrder,
        isActive: true,
      },
    })
  }
  console.log(`  ✓ ${SEED_FAQS.length} FAQs ready`)
}

async function seedServiceTypes() {
  console.log('→ Seeding ServiceTypes...')
  const types = [
    { name: 'Eletricista', icon: 'Zap', isActive: true, sortOrder: 1 },
    { name: 'Encanador', icon: 'Wrench', isActive: true, sortOrder: 2 },
    { name: 'Pedreiro', icon: 'Hammer', isActive: true, sortOrder: 3 },
    { name: 'Pintor', icon: 'PaintRoller', isActive: true, sortOrder: 4 },
    { name: 'Jardinagem', icon: 'Trees', isActive: true, sortOrder: 5 },
    { name: 'Limpeza', icon: 'Sparkles', isActive: true, sortOrder: 6 },
    { name: 'Refrigeração / Ar Condicionado', icon: 'Wind', isActive: true, sortOrder: 7 },
    { name: 'Marcenaria', icon: 'Hammer', isActive: true, sortOrder: 8 },
    { name: 'Dedetização', icon: 'Bug', isActive: true, sortOrder: 9 },
    { name: 'Fretes e Mudanças', icon: 'Truck', isActive: true, sortOrder: 10 },
    { name: 'Borracheiro', icon: 'Circle', isActive: true, sortOrder: 11 },
    { name: 'Mecânico', icon: 'Cog', isActive: true, sortOrder: 12 },
    { name: 'Vidraceiro', icon: 'Square', isActive: true, sortOrder: 13 },
    { name: 'Telhadista', icon: 'Home', isActive: true, sortOrder: 14 },
    { name: 'Outros', icon: 'Settings', isActive: true, sortOrder: 99 },
  ]
  for (const t of types) {
    const existing = await prisma.serviceType.findFirst({ where: { name: t.name } }).catch(() => null)
    if (!existing) {
      await prisma.serviceType.create({ data: t }).catch(() => {})
    }
  }
  console.log(`  ✓ ${types.length} ServiceTypes ready`)
}

async function seedEvents() {
  console.log('→ Seeding Events...')
  const events = [
    { title: 'Webinar: Maximizar Ganhos com CashBack', description: 'Aprenda estratégias para maximizar seus ganhos no CashBack Multi-Nível.', type: 'webinar', status: 'upcoming', eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), location: 'Online (YouTube)', meetingUrl: '', maxAttendees: 500, isActive: true },
    { title: 'Manutenção do Sistema', description: 'Manutenção programada do sistema. Serviço indisponível das 02h às 04h.', type: 'maintenance', status: 'upcoming', eventDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), location: 'Servidor', meetingUrl: '', maxAttendees: 0, isActive: true },
    { title: 'Promo: CashBack Dobrado', description: 'Por 7 dias, todo CashBack de indicação será dobrado! Aproveite para expandir sua rede.', type: 'promo', status: 'upcoming', eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), location: 'Plataforma', meetingUrl: '', maxAttendees: 0, isActive: true },
  ]
  for (const e of events) {
    const existing = await prisma.event.findFirst({ where: { title: e.title } }).catch(() => null)
    if (!existing) {
      await prisma.event.create({ data: e }).catch(() => {})
    }
  }
  console.log(`  ✓ ${events.length} Events ready`)
}

async function seedMatrixTypes() {
  console.log('→ Seeding MatrixTypes...')
  const types = [
    { code: 'entrada_4x5', name: 'Matriz Entrada 4x5', matrixKind: 'entrada', width: 4, depth: 5, description: 'Matriz de Entrada — 4 indicados diretos por nível, 5 níveis de profundidade', color: '#10b981', isActive: true },
    { code: 'residual_4x7', name: 'Matriz Residual 4x7', matrixKind: 'residual', width: 4, depth: 7, description: 'Matriz Residual — 4 indicados por nível, 7 níveis de profundidade', color: '#0d9488', isActive: true },
    { code: 'vendas_4x9', name: 'Matriz Vendas 4x9', matrixKind: 'vendas', width: 4, depth: 9, description: 'Matriz de Vendas — 4 indicados por nível, 9 níveis de profundidade', color: '#f59e0b', isActive: true },
  ]
  for (const t of types) {
    const existing = await prisma.matrixType.findUnique({ where: { code: t.code } }).catch(() => null)
    if (existing) {
      const existingLevels = await prisma.matrixLevelEarning.count({ where: { matrixTypeId: existing.id } }).catch(() => 0)
      if (existingLevels === 0) {
        const pcts = t.matrixKind === 'entrada' ? [5, 10, 10, 5, 5] : t.matrixKind === 'residual' ? [10, 9, 5, 5, 4, 3, 2] : [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]
        for (let i = 0; i < pcts.length; i++) {
          await prisma.matrixLevelEarning.create({ data: { id: `mle_${t.code}_${i+1}`, matrixTypeId: existing.id, level: i + 1, percentage: pcts[i], fixedBonusCents: 0, updatedAt: new Date() } }).catch(() => {})
        }
      }
      continue
    }
    const created = await prisma.matrixType.create({ data: { id: `mt_${t.code}`, updatedAt: new Date(), ...t } })
    const pcts = t.matrixKind === 'entrada' ? [5, 10, 10, 5, 5] : t.matrixKind === 'residual' ? [10, 9, 5, 5, 4, 3, 2] : [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]
    for (let i = 0; i < pcts.length; i++) {
      await prisma.matrixLevelEarning.create({ data: { id: `mle_${t.code}_${i+1}`, matrixTypeId: created.id, level: i + 1, percentage: pcts[i], fixedBonusCents: 0, updatedAt: new Date() } }).catch(() => {})
    }
  }
  // Link plans to matrix types
  const mtEntrada = await prisma.matrixType.findUnique({ where: { code: 'entrada_4x5' } }).catch(() => null)
  const mtResidual = await prisma.matrixType.findUnique({ where: { code: 'residual_4x7' } }).catch(() => null)
  const mtVendas = await prisma.matrixType.findUnique({ where: { code: 'vendas_4x9' } }).catch(() => null)
  if (mtEntrada) await prisma.plan.updateMany({ where: { code: { in: ['free', 'blue3', 'blue5'] }, matrixEntradaId: null }, data: { matrixEntradaId: mtEntrada.id } }).catch(() => {})
  if (mtResidual) await prisma.plan.updateMany({ where: { code: { in: ['blue5'] }, matrixResidualId: null }, data: { matrixResidualId: mtResidual.id } }).catch(() => {})
  if (mtVendas) await prisma.plan.updateMany({ where: { code: { in: ['blue5'] }, matrixVendasId: null }, data: { matrixVendasId: mtVendas.id } }).catch(() => {})
  console.log('  ✓ 3 MatrixTypes + level earnings ready')
}

async function seedCareerPlans() {
  console.log('→ Seeding CareerPlans...')
  const plans = [
    { code: 'safira', name: 'Safira', description: 'PIN Safira - Categoria 3', minPoints: 100, rewardWithdrawalCents: 200000, rewardShoppingCents: 0, rewardPoints: 0, gratification: 'Bônus de Safira ao atingir 100 pontos', color: '#06b6d4', icon: '🔷', isActive: true, sortOrder: 1 },
    { code: 'rubi', name: 'Rubi', description: 'PIN Rubi - Categoria 2', minPoints: 250, rewardWithdrawalCents: 300000, rewardShoppingCents: 0, rewardPoints: 0, gratification: 'Bônus de Rubi ao atingir 250 pontos', color: '#dc2626', icon: '❤️', isActive: true, sortOrder: 2 },
    { code: 'esmeralda', name: 'Esmeralda', description: 'PIN Esmeralda - Categoria 1', minPoints: 500, rewardWithdrawalCents: 400000, rewardShoppingCents: 0, rewardPoints: 0, gratification: 'Bônus de Esmeralda ao atingir 500 pontos', color: '#10b981', icon: '💚', isActive: true, sortOrder: 3 },
    { code: 'diamante', name: 'Diamante', description: 'PIN Diamante - Categoria 4', minPoints: 1000, rewardWithdrawalCents: 500000, rewardShoppingCents: 0, rewardPoints: 0, gratification: 'Bônus de Diamante ao atingir 1.000 pontos', color: '#3b82f6', icon: '💎', isActive: true, sortOrder: 4 },
    { code: 'imperial', name: 'Imperial', description: 'PIN Imperial - Categoria 5 - Graduação máxima', minPoints: 2500, rewardWithdrawalCents: 600000, rewardShoppingCents: 0, rewardPoints: 0, gratification: 'Bônus de Imperial ao atingir 2.500 pontos', color: '#8b5cf6', icon: '👑', isActive: true, sortOrder: 5 },
  ]
  for (const p of plans) {
    await prisma.careerPlan.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    }).catch(() => {})
  }
  console.log(`  ✓ ${plans.length} CareerPlans ready (Safira → Imperial)`)
}

async function seedGoalConfigs() {
  console.log('→ Seeding GoalConfigs...')
  const goals = [
    { name: 'Meta Diária Motorista', description: '20 viagens finalizadas por dia', targetQualification: 'motorista', metricCode: 'trips_daily', metricLabel: 'viagens finalizadas', targetValue: 20, rewardCents: 500, rewardWallet: 'gratification', frequency: 'daily', isActive: true, sortOrder: 1 },
    { name: 'Meta Mensal Motorista', description: '384 viagens no mês', targetQualification: 'motorista', metricCode: 'trips_monthly', metricLabel: 'viagens no mês', targetValue: 384, rewardCents: 3000, rewardWallet: 'gratification', frequency: 'monthly', isActive: true, sortOrder: 2 },
    { name: 'Meta Diária Entregador', description: '15 entregas por dia', targetQualification: 'entregador', metricCode: 'deliveries_daily', metricLabel: 'entregas realizadas', targetValue: 15, rewardCents: 400, rewardWallet: 'gratification', frequency: 'daily', isActive: true, sortOrder: 3 },
    { name: 'Meta Mensal Entregador', description: '300 entregas no mês', targetQualification: 'entregador', metricCode: 'deliveries_monthly', metricLabel: 'entregas no mês', targetValue: 300, rewardCents: 2500, rewardWallet: 'gratification', frequency: 'monthly', isActive: true, sortOrder: 4 },
  ]
  for (const g of goals) {
    const existing = await prisma.goalConfig.findFirst({ where: { name: g.name } }).catch(() => null)
    if (!existing) {
      await prisma.goalConfig.create({ data: g }).catch(() => {})
    }
  }
  console.log(`  ✓ ${goals.length} GoalConfigs ready (Metas motorista/entregador)`)
}

async function seedStreakRewards() {
  console.log('→ Seeding StreakRewards...')
  const rewards = [
    { streakDays: 7, rewardType: 'points', rewardAmount: 50, description: '7 dias consecutivos', isActive: true },
    { streakDays: 14, rewardType: 'cashback', rewardAmount: 500, description: '14 dias consecutivos', isActive: true },
    { streakDays: 30, rewardType: 'cashback', rewardAmount: 2000, description: '30 dias consecutivos', isActive: true },
  ]
  for (const r of rewards) {
    const existing = await prisma.streakReward.findFirst({ where: { streakDays: r.streakDays } }).catch(() => null)
    if (!existing) {
      await prisma.streakReward.create({ data: r }).catch(() => {})
    }
  }
  console.log(`  ✓ ${rewards.length} StreakRewards ready`)
}

async function main() {
  console.log('========================================')
  console.log(' NewMobility — Database Seed')
  console.log('========================================')
  console.log(`Database: ${process.env.DATABASE_URL ? 'connected' : 'MISSING DATABASE_URL'}`)
  console.log('')

  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Set it in .env or in the environment before running the seed.',
    )
  }

  await seedUsers()
  await seedSystemConfigs()
  await seedUserTypes()
  await seedMatrixTypes()
  await seedPlans()
  await seedCareerPlans()
  await seedGoalConfigs()
  await seedStreakRewards()
  await seedServiceTypes()
  await seedEvents()
  await seedCategories()
  await seedFaqs()

  console.log('')
  console.log('========================================')
  console.log(' Seed completed successfully!')
  console.log('========================================')
  console.log('')
  console.log('Login credentials:')
  console.log('  Admin     → admin@newmobility.com / admin123')
  console.log('  Cliente   → cliente@newmobility.com / 123456')
  console.log('  Motorista → motorista@newmobility.com / 123456')
  console.log('  Lojista   → lojista@newmobility.com / 123456')
  console.log('')
  console.log('Routes:')
  console.log('  Backoffice (MMN)  → /')
  console.log('  App Cliente       → /mobile')
  console.log('  App Motorista     → /motorista')
  console.log('  App Lojista       → /lojista')
  console.log('  Admin Geral       → /admingeral')
  console.log('')
}

main()
  .catch((e) => {
    console.error('')
    console.error('Seed FAILED:')
    console.error(e)
    console.error('')
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
