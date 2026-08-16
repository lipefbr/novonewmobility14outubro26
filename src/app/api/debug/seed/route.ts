import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createHash } from 'crypto'

// ============================================================================
// /api/debug/seed — Run the database seed from the browser (NO AUTH — debug)
// ----------------------------------------------------------------------------
// POST body: { confirm: true }   (require explicit confirmation to avoid
//                                  accidental GET-triggered seeds)
//
// Mirrors prisma/seed.ts but runs inline so we can return a structured result
// to the /debug page. IDEMPOTENT — uses upsert() everywhere.
//
// This endpoint is intentionally public so it can be hit immediately after
// deploy to create the admin user without needing CLI access to the VPS.
// ============================================================================

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

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
    priceCents: 9700,
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
    priceCents: 14700,
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

export async function POST(req: NextRequest) {
  const startedAt = Date.now()
  const log: string[] = []
  const steps: Array<{ name: string; status: 'ok' | 'skip' | 'error'; detail?: string; count?: number }> = []

  try {
    const body = await req.json().catch(() => ({}))
    if (!body?.confirm) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Confirmation required — send { confirm: true } in the POST body to run the seed.',
        },
        { status: 400 },
      )
    }

    log.push(`[${new Date().toISOString()}] Seed started`)
    log.push(`DATABASE_URL: ${process.env.DATABASE_URL ? 'present' : 'MISSING'}`)

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { ok: false, error: 'DATABASE_URL is not set — cannot seed.', log },
        { status: 500 },
      )
    }

    // --- 1. Users --------------------------------------------------------------
    log.push('→ Seeding users...')
    let usersCreated = 0
    let usersUpdated = 0
    for (const u of SEED_USERS) {
      const passwordHash = hashPassword(u.password)
      const existing = await prisma.user.findUnique({ where: { email: u.email } })
      if (existing) {
        // Update auth-critical fields so the user can always log in
        await prisma.user.update({
          where: { email: u.email },
          data: {
            password: passwordHash,
            role: u.role,
            userType: u.userType,
            isDriver: u.isDriver,
            isDelivery: u.isDelivery,
            isActive: u.isActive,
            plan: u.plan,
            qualification: u.qualification,
          },
        })
        usersUpdated++
      } else {
        await prisma.user.create({
          data: {
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
        usersCreated++
      }
    }
    steps.push({
      name: 'Users',
      status: 'ok',
      count: SEED_USERS.length,
      detail: `${usersCreated} created, ${usersUpdated} updated`,
    })
    log.push(`  ✓ ${usersCreated} created, ${usersUpdated} updated`)

    // --- 2. SystemConfig -------------------------------------------------------
    log.push('→ Seeding SystemConfig...')
    let configCreated = 0
    for (const c of SEED_CONFIGS) {
      const existing = await prisma.systemConfig.findUnique({ where: { key: c.key } })
      if (!existing) {
        await prisma.systemConfig.create({ data: c })
        configCreated++
      }
    }
    steps.push({
      name: 'SystemConfig',
      status: 'ok',
      count: SEED_CONFIGS.length,
      detail: `${configCreated} created, ${SEED_CONFIGS.length - configCreated} already existed`,
    })
    log.push(`  ✓ ${configCreated} created`)

    // --- 3. UserType -----------------------------------------------------------
    log.push('→ Seeding UserType...')
    let typesCreated = 0
    for (const t of SEED_USER_TYPES) {
      const existing = await prisma.userType.findUnique({ where: { code: t.code } })
      if (!existing) {
        await prisma.userType.create({ data: t })
        typesCreated++
      }
    }
    steps.push({
      name: 'UserType',
      status: 'ok',
      count: SEED_USER_TYPES.length,
      detail: `${typesCreated} created`,
    })
    log.push(`  ✓ ${typesCreated} created`)

    // --- 4. Plans --------------------------------------------------------------
    log.push('→ Seeding Plans...')
    const matrixTypes = await prisma.matrixType.findMany().catch(() => [])
    const findMt = (code: string) => matrixTypes.find((m) => m.code === code)?.id || null
    let plansCreated = 0
    for (const p of SEED_PLANS) {
      const existing = await prisma.plan.findUnique({ where: { code: p.code } })
      if (!existing) {
        await prisma.plan.create({
          data: {
            id: p.id,
            code: p.code,
            name: p.name,
            priceCents: p.priceCents,
            description: p.description,
            features: JSON.stringify(p.features),
            isActive: p.isActive,
            isDefault: p.isDefault,
            sortOrder: p.sortOrder,
            matrixEntradaId: findMt('entrada_4x5'),
            matrixResidualId: findMt('residual_4x7'),
            matrixVendasId: findMt('vendas_4x9'),
          },
        })
        plansCreated++
      }
    }
    steps.push({
      name: 'Plans',
      status: 'ok',
      count: SEED_PLANS.length,
      detail: `${plansCreated} created`,
    })
    log.push(`  ✓ ${plansCreated} created`)

    // --- 5. AppCategory (optional — table may not exist on older deploys) -----
    log.push('→ Seeding AppCategory...')
    let catCreated = 0
    let catError: string | null = null
    try {
      for (const c of SEED_CATEGORIES) {
        const existing = await prisma.appCategory.findUnique({ where: { code: c.code } })
        if (!existing) {
          await prisma.appCategory.create({ data: c })
          catCreated++
        }
      }
      steps.push({
        name: 'AppCategory',
        status: 'ok',
        count: SEED_CATEGORIES.length,
        detail: `${catCreated} created`,
      })
    } catch (err) {
      catError = err instanceof Error ? err.message : String(err)
      steps.push({
        name: 'AppCategory',
        status: 'skip',
        detail: `Table not available: ${catError.slice(0, 80)}`,
      })
    }
    log.push(`  ✓ ${catCreated} created${catError ? ` (with note: ${catError.slice(0, 60)})` : ''}`)

    // --- 6. FAQ ----------------------------------------------------------------
    log.push('→ Seeding FAQ...')
    let faqCreated = 0
    for (const f of SEED_FAQS) {
      const existing = await prisma.fAQ.findFirst({ where: { question: f.question } })
      if (!existing) {
        await prisma.fAQ.create({
          data: {
            question: f.question,
            answer: f.answer,
            category: f.category,
            sortOrder: f.sortOrder,
            isActive: true,
          },
        })
        faqCreated++
      }
    }
    steps.push({
      name: 'FAQ',
      status: 'ok',
      count: SEED_FAQS.length,
      detail: `${faqCreated} created`,
    })
    log.push(`  ✓ ${faqCreated} created`)

    const totalMs = Date.now() - startedAt
    log.push(`[${new Date().toISOString()}] Seed completed in ${totalMs}ms`)

    return NextResponse.json({
      ok: true,
      durationMs: totalMs,
      steps,
      log,
      credentials: {
        admin: 'admin@newmobility.com / admin123',
        cliente: 'cliente@newmobility.com / 123456',
        motorista: 'motorista@newmobility.com / 123456',
        lojista: 'lojista@newmobility.com / 123456',
      },
    })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    log.push(`[ERROR] ${errMsg}`)
    return NextResponse.json(
      {
        ok: false,
        error: errMsg,
        steps,
        log,
        durationMs: Date.now() - startedAt,
      },
      { status: 500 },
    )
  }
}

// GET returns a help message — actual seeding requires POST for safety
export async function GET() {
  return NextResponse.json({
    ok: false,
    error: 'Use POST with body { confirm: true } to run the seed.',
    info: 'This endpoint is idempotent — running it multiple times is safe.',
  })
}
