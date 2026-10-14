import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
// Task 15-f — helper compartilhado de audiência (lib, não route file, para
// evitar import cycles e permitir reuso no claim).
import { userMatchesGoalAudience } from '@/lib/goal-audience'

// ============================================================================
// /api/goal-configs — Metas configuradas pelo admin para o usuário logado
// ----------------------------------------------------------------------------
// Retorna as metas ativas que se aplicam ao usuário com base em sua
// qualificação (user.qualification). Para cada meta, calcula o progresso
// atual (currentValue) com base na métrica (metricCode) e na periodicidade
// (frequency).
//
// Exemplo de resposta:
//   {
//     "goals": [
//       {
//         "id": "cmt...",
//         "name": "Meta Diária Motorista",
//         "description": "20 viagens finalizadas por dia",
//         "targetQualification": "motorista",
//         "metricCode": "trips_daily",
//         "metricLabel": "viagens finalizadas",
//         "targetValue": 20,
//         "currentValue": 12,       // progresso hoje
//         "rewardCents": 500,       // R$ 5,00
//         "rewardWallet": "gratification",
//         "frequency": "daily",
//         "progressPct": 60,
//         "isAchieved": false,
//         "isClaimed": false
//       }
//     ]
//   }
// ============================================================================

// Task 15-f — o filtro por igualdade estrita de user.qualification foi
// substituído por userMatchesGoalAudience() (src/lib/goal-audience.ts), que
// reconhece todas as categorias de condutor (mototaxista, taxista,
// motorista_app, caminhoneiro, motofretista), userType, as flags legacy
// isDriver/isDelivery e usuários sem qualificação preenchida.

// Compute current progress for a goal based on metricCode + frequency
async function computeProgress(
  userId: string,
  metricCode: string,
  frequency: string,
  totalRides: number
): Promise<number> {
  const now = new Date()
  let since: Date

  // Determine the time window based on frequency
  if (frequency === 'daily') {
    since = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (frequency === 'weekly') {
    const day = now.getDay() // 0 = Sunday
    since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day)
  } else if (frequency === 'monthly') {
    since = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    // one_time — since the beginning of time
    since = new Date(0)
  }

  try {
    // Task 15-f — MÉTRICA REAL DE VIAGENS: o schema NÃO possui tabela
    // Ride/Delivery (o código antigo chamava prisma.ride/prisma.delivery
    // com @ts-expect-error e SEMPRE retornava 0 — por isso o botão
    // "Resgatar Recompensa" nunca aparecia). A única contagem real que
    // existe é User.totalRides (total de corridas do usuário). Usamos esse
    // dado REAL; limitação documentada: como não há contagem por período,
    // metas daily/weekly/monthly de viagens mostram o total acumulado e o
    // resgate continua limitado a 1x por período pelo dedup do claim.
    if (metricCode === 'trips_daily' || metricCode === 'trips_monthly' || metricCode === 'trips_total') {
      return totalRides
    }
    // Entregas: NÃO existe nenhuma métrica de entregas no schema — progresso
    // honesto 0 (nunca inventamos dado).
    if (metricCode === 'deliveries_daily' || metricCode === 'deliveries_monthly') {
      return 0
    }
    if (metricCode === 'sales_total') {
      // Task 15-f — métrica REAL de "vendas": cada venda atribuída ao usuário
      // gera exatamente 1 registro CashbackSales de nível 1 (o cashback de
      // vendas credita o upline direto por venda). O código antigo consultava
      // prisma.marketplaceOrder com `sellerId` — campo que NÃO existe no
      // schema (MarketplaceOrder só tem o comprador `userId`) e nem
      // compilava. Limitação documentada: lançamentos manuais do admin
      // (fromUserId = admin) também entram na contagem.
      const count = await prisma.cashbackSales.count({
        where: { fromUserId: userId, level: 1, createdAt: { gte: since } },
      })
      return count
    }
    if (metricCode === 'referrals_total') {
      const count = await prisma.user.count({
        where: { referredById: userId, createdAt: { gte: since } },
      })
      return count
    }
    if (metricCode === 'kyc_approved') {
      // Count approved KYC documents
      const count = await prisma.kycDocument.count({
        where: { userId, status: 'approved', createdAt: { gte: since } },
      })
      return count
    }
  } catch {
    // If the query fails, fall back to 0
    return 0
  }

  return 0
}

// GET /api/goal-configs?userId=<userId>
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        qualification: true,
        userType: true,
        isDriver: true,
        isDelivery: true,
        role: true,
        isActive: true,
        totalRides: true,
      },
    })
    if (!user) return error('User not found', 404)

    // Fetch all active goal configs
    const configs = await prisma.goalConfig.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    // Filter by goal audience (Task 15-f — categories/userType/flags/empty)
    const applicable = configs.filter((c) => userMatchesGoalAudience(user, c.targetQualification))

    // Compute progress for each goal
    const goalsWithProgress = await Promise.all(
      applicable.map(async (c) => {
        const currentValue = await computeProgress(userId, c.metricCode, c.frequency, user.totalRides)
        const progressPct = c.targetValue > 0 ? Math.min(100, Math.round((currentValue / c.targetValue) * 100)) : 0
        const isAchieved = currentValue >= c.targetValue

        // Check if the user has already claimed this goal for the current period
        // (we look for a Gratification row with type='goal_claim' whose
        // description carries the dedup marker `[<goalConfig.id>]` — gravado
        // pelo POST /api/goal-configs/claim. Task 15-f: o schema Gratification
        // NÃO tem coluna referenceId, então o dedup é pela description
        // (typed, sem @ts-expect-error).
        let isClaimed = false
        try {
          const periodStart =
            c.frequency === 'daily'
              ? new Date(new Date().setHours(0, 0, 0, 0))
              : c.frequency === 'weekly'
                ? new Date(new Date().setDate(new Date().getDate() - new Date().getDay()))
                : c.frequency === 'monthly'
                  ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  : new Date(0)
          const claim = await prisma.gratification.findFirst({
            where: {
              userId,
              type: 'goal_claim',
              description: { contains: `[${c.id}]` },
              createdAt: { gte: periodStart },
            },
          })
          isClaimed = !!claim
        } catch {
          isClaimed = false
        }

        return {
          id: c.id,
          name: c.name,
          description: c.description,
          targetQualification: c.targetQualification,
          metricCode: c.metricCode,
          metricLabel: c.metricLabel,
          targetValue: c.targetValue,
          currentValue,
          rewardCents: c.rewardCents,
          rewardWallet: c.rewardWallet,
          frequency: c.frequency,
          progressPct,
          isAchieved,
          isClaimed,
        }
      })
    )

    return success({ goals: goalsWithProgress })
  } catch (err) {
    console.error('goal-configs GET error:', err)
    return error('Erro ao carregar as metas. Tente novamente.', 500)
  }
}
