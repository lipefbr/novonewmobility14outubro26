import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { getSession } from '@/lib/auth'

// Fallbacks — usados SOMENTE quando a tabela Plan está vazia/ilegível.
// Alinhados ao seed do banco (Task 2-b: blue3/blue5 = R$ 999,90 cada).
// Antes o fallback era 4990/9990 (valores antigos e errados).
const FALLBACK_PRICES: Record<string, number> = {
  free: 0,
  blue3: 99990, // R$ 999,90
  blue5: 99990, // R$ 999,90
}

/**
 * Monta o mapa <código do plano, preço em centavos> a partir da tabela
 * Plan a cada request — mesmo padrão do loadPlanCatalog() de
 * /api/plans/calculate-upgrade (Task 11). Cai nos fallbacks acima quando
 * o banco está vazio ou a query falha. `premium5` espelha `blue5`
 * (alias de exibição do client spec §1.1, mesma faixa de preço).
 */
async function loadPlanCatalog(): Promise<Map<string, number>> {
  const catalog = new Map<string, number>(Object.entries(FALLBACK_PRICES))
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { code: true, priceCents: true },
    })
    for (const plan of plans) {
      if (!plan?.code) continue
      if (typeof plan.priceCents === 'number' && plan.priceCents >= 0) {
        catalog.set(plan.code, plan.priceCents)
      }
    }
  } catch (err) {
    console.warn('ensure-monthly: falha ao carregar catálogo de Plan, usando fallbacks:', err)
  }
  // premium5 é alias de blue5 (mesmo tier) — precifica igual à linha do banco
  const blue5Price = catalog.get('blue5')
  if (blue5Price !== undefined) catalog.set('premium5', blue5Price)
  return catalog
}

/**
 * POST /api/billing/ensure-monthly
 *
 * Garante que todo usuário com plano ativo (não-free) tenha uma fatura mensal
 * pendente para pagar. Se o usuário não tem nenhuma fatura pendente do tipo
 * plan_, cria uma nova com vencimento em 30 dias.
 *
 * "Todo mês ele zera e tem que pagar de novo" — esta rota é o gatilho que
 * pode ser chamado por um cron job mensal ou manualmente pelo admin.
 *
 * Body (opcional): { userId } — restringe a um usuário específico.
 * Quando omitido, verifica TODOS os usuários ativos com plano pago.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return error('Unauthorized', 401)
    }

    // Apenas admin pode rodar em lote (sem userId)
    const body = await request.json().catch(() => ({} as any))
    const targetUserId = body?.userId as string | undefined

    const caller = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!caller) {
      return error('User not found', 404)
    }
    const isAdmin = caller.role === 'admin'

    if (!targetUserId && !isAdmin) {
      return error('Admin access required to scan all users', 403)
    }

    // Determinar quais usuários verificar
    const userWhere: any = {
      plan: { not: 'free' },
      isActive: true,
    }
    if (targetUserId) {
      userWhere.id = targetUserId
    }

    const users = await prisma.user.findMany({
      where: userWhere,
      select: { id: true, name: true, plan: true, userType: true },
    })

    const now = new Date()
    let created = 0
    let skipped = 0
    const createdInvoices: any[] = []
    // Usuários pulados por não terem preço no catálogo (Task 13-a)
    const skippedNoPrice: Array<{ userId: string; plan: string }> = []

    // Catálogo de preços mensais lido da tabela Plan (fonte da verdade
    // editável pelo admin via PUT /api/admin/plans). Antes era um map
    // estático com valores errados (blue3: 4990 / blue5: 9990 vs DB
    // 99990/99990), gerando faturas de renovação com valor incorreto.
    const planCatalog = await loadPlanCatalog()

    for (const user of users) {
      try {
        // Verificar se já existe uma fatura pendente do tipo plan_ com vencimento futuro
        const existingPending = await prisma.invoice.findFirst({
          where: {
            userId: user.id,
            status: 'pending',
            type: { startsWith: 'plan_' },
            dueDate: { gt: now },
          },
          select: { id: true },
        })

        if (existingPending) {
          skipped++
          continue
        }

        // Determinar o valor e tipo da fatura
        const planCode = user.plan || 'blue3'
        // Task 13-a: se o plano do usuário não existe no catálogo do banco,
        // NÃO criar fatura com valor "chutado" — pula este usuário (graça,
        // sem quebrar o loop dos demais) e sinaliza na resposta.
        const amount = planCatalog.get(planCode)
        if (amount === undefined) {
          skipped++
          skippedNoPrice.push({ userId: user.id, plan: planCode })
          console.error(
            `[ensure-monthly] plano "${planCode}" sem preço no catálogo (tabela Plan) — usuário ${user.id} pulado, nenhuma fatura criada.`
          )
          continue
        }
        const invoiceType = `plan_subscription_${planCode}`
        const nextDueDate = new Date(now)
        nextDueDate.setDate(nextDueDate.getDate() + 30)

        const invoice = await prisma.invoice.create({
          data: {
            userId: user.id,
            amount,
            type: invoiceType,
            status: 'pending',
            dueDate: nextDueDate,
            description: `Renovação mensal — Plano ${planCode.toUpperCase()}`,
          },
        })

        // Notificar o usuário
        try {
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: 'Fatura mensal disponível 📅',
              message: `Sua fatura de renovação do plano (${new Intl.NumberFormat(
                'pt-BR',
                { style: 'currency', currency: 'BRL' }
              ).format(amount / 100)}) vence em ${nextDueDate.toLocaleDateString(
                'pt-BR'
              )}. Acesse "Pagar Faturas" para pagar e evitar bloqueios.`,
              type: 'invoice',
            },
          })
        } catch (notifErr) {
          console.warn('[ensure-monthly] notification failed:', notifErr)
        }

        created++
        createdInvoices.push({
          userId: user.id,
          userName: user.name,
          invoiceId: invoice.id,
          amount,
          dueDate: nextDueDate,
        })
      } catch (userErr) {
        console.error(`[ensure-monthly] error for user ${user.id}:`, userErr)
      }
    }

    return success({
      scanned: users.length,
      created,
      skipped,
      skippedNoPrice, // usuários pulados por plano sem preço no catálogo
      createdInvoices: createdInvoices.slice(0, 50), // limit response size
    })
  } catch (err) {
    console.error('POST /api/billing/ensure-monthly error:', err)
    return error('Internal server error', 500)
  }
}
