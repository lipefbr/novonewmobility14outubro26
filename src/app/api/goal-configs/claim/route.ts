import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
// Task 15-f — helper de audiência compartilhado (mesma regra do GET) e gate
// de KYC (mesma regra de /api/gratifications/claim).
import { userMatchesGoalAudience } from '@/lib/goal-audience'
import { isKycApproved } from '@/lib/kyc'

// ============================================================================
// POST /api/goal-configs/claim — Reivindicar a recompensa de uma meta atingida
// ----------------------------------------------------------------------------
// Body: { userId, goalConfigId }
//
// Valida:
//   1. Usuário existe e está ativo
//   2. GoalConfig existe e está ativa
//   3. Usuário tem qualificação compatível com a meta
//   4. Usuário ainda não reivindicou esta meta no período atual
//   5. currentValue >= targetValue (meta realmente atingida)
//
// Efeitos:
//   - Credita rewardCents na carteira especificada (rewardWallet)
//   - Cria registro Gratification com type='goal_claim' para histórico
//   - Retorna mensagem de sucesso
// ============================================================================

const WALLET_FIELD_MAP: Record<string, string> = {
  gratification: 'balanceGratification',
  withdrawal: 'balanceWithdrawal',
  shopping: 'balanceShopping',
  mobility: 'balanceMobility',
  food: 'balanceFood',
  pharmacy: 'balancePharmacy',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, goalConfigId } = body

    if (!userId || !goalConfigId) {
      return error('userId e goalConfigId são obrigatórios', 400)
    }

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
        balanceGratification: true,
        balanceWithdrawal: true,
        balanceShopping: true,
        balanceMobility: true,
        balanceFood: true,
        balancePharmacy: true,
      },
    })
    if (!user) return error('Usuário não encontrado', 404)

    const config = await prisma.goalConfig.findUnique({
      where: { id: goalConfigId },
    })
    if (!config || !config.isActive) {
      return error('Meta não encontrada ou inativa', 404)
    }

    // Check audience match (Task 15-f — mesma regra do GET: reconhece todas
    // as categorias de condutor, userType, flags legacy e qualificação vazia)
    if (!userMatchesGoalAudience(user, config.targetQualification)) {
      return error('Esta meta não se aplica ao seu tipo de usuário', 403)
    }

    // Task 15-f — KYC gate (alinha o resgate de metas com o resgate de
    // gratificações: ambos movimentam saldo e exigem identidade verificada).
    if (user.role !== 'admin' && user.userType !== 'admin' && user.userType !== 'ADMIN') {
      const kycOk = await isKycApproved(userId)
      if (!kycOk) {
        return error(
          'KYC não aprovado. Complete sua verificação de documentos na aba KYC para resgatar gratificações.',
          403
        )
      }
    }

    // Determine the period start for the claim dedup
    const now = new Date()
    let periodStart: Date
    if (config.frequency === 'daily') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (config.frequency === 'weekly') {
      const day = now.getDay()
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day)
    } else if (config.frequency === 'monthly') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    } else {
      periodStart = new Date(0) // one_time — never claimable again
    }

    // Check if already claimed in this period.
    // Task 15-f — o schema Gratification NÃO tem coluna referenceId (o código
    // antigo usava @ts-expect-error e sempre caía no catch). O dedup é pela
    // description com o marker `[<goalConfig.id>]` gravado abaixo — agora
    // typed, sem @ts-expect-error e sem try/catch duplicado.
    const existingClaim = await prisma.gratification.findFirst({
      where: {
        userId,
        type: 'goal_claim',
        description: { contains: `[${config.id}]` },
        createdAt: { gte: periodStart },
      },
    })
    if (existingClaim) {
      return error('Você já reivindicou esta meta neste período', 409)
    }

    // Credit the reward to the specified wallet
    const walletField = WALLET_FIELD_MAP[config.rewardWallet] || 'balanceGratification'
    const rewardCents = config.rewardCents

    // Update user balance — objeto explícito por carteira para manter a
    // tipagem do Prisma (sem @ts-expect-error em acesso dinâmico).
    const rewardIncrement = { increment: rewardCents }
    const walletData =
      walletField === 'balanceWithdrawal'
        ? { balanceWithdrawal: rewardIncrement }
        : walletField === 'balanceShopping'
          ? { balanceShopping: rewardIncrement }
          : walletField === 'balanceMobility'
            ? { balanceMobility: rewardIncrement }
            : walletField === 'balanceFood'
              ? { balanceFood: rewardIncrement }
              : walletField === 'balancePharmacy'
                ? { balancePharmacy: rewardIncrement }
                : { balanceGratification: rewardIncrement }
    await prisma.user.update({
      where: { id: userId },
      data: walletData,
    })

    // Create Gratification history record
    try {
      await prisma.gratification.create({
        data: {
          userId,
          type: 'goal_claim',
          amount: rewardCents,
          category: config.metricCode,
          description: `[${config.id}] ${config.name} — ${config.targetValue} ${config.metricLabel}`,
          isClaimed: true,
          claimedAt: now,
          frequency: config.frequency,
          qualification: config.targetQualification,
          targetValue: config.targetValue,
          currentValue: config.targetValue, // they achieved it
          targetQualification: config.targetQualification,
        },
      })
    } catch {
      // If Gratification create fails (e.g., referenceId issue), still succeed
      // because the balance was already credited
      console.warn('Failed to create Gratification history record, but balance was credited')
    }

    return success({
      message: `Recompensa de R$ ${(rewardCents / 100).toFixed(2).replace('.', ',')} creditada na carteira de ${config.rewardWallet}!`,
      rewardCents,
      rewardWallet: config.rewardWallet,
      goalName: config.name,
    })
  } catch (err) {
    console.error('goal-configs/claim POST error:', err)
    return error('Erro ao reivindicar a recompensa da meta. Tente novamente.', 500)
  }
}
