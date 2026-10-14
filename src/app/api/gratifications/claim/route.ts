import { db, prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { isKycApproved } from '@/lib/kyc'
// Task 15-f — fonte única do catálogo (com overlay das edições do admin),
// compartilhada com GET /api/gratifications. Necessária para resolver os ids
// sintéticos `catalog_<type>_<idx>` que o front gera para itens de catálogo.
import { getCatalogItem } from '@/lib/gratification-catalog'

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  const random2 = Math.random().toString(36).substring(2, 10)
  return `c${timestamp}${random}${random2}`
}

// Task 15-f — extrai o `type` de um id sintético de catálogo gerado pelo
// front no formato `catalog_<type>_<idx>` (o `<idx>` é a posição na lista
// filtrada do client e NÃO é usado no servidor — o `type` identifica o item).
// Retorna null quando o id não é de catálogo. Obs.: o `<idx>` é sempre
// anexado pelo front, então o trailing `_<dígitos>` pode ser descartado com
// segurança; um type hipotético terminando em dígitos puros sem idx não é
// produzido pelo front atual.
function parseCatalogId(gratificationId: string): string | null {
  if (!gratificationId.startsWith('catalog_')) return null
  const raw = gratificationId.slice('catalog_'.length)
  if (!raw) return null
  const match = raw.match(/^(.*)_(\d+)$/)
  return match ? match[1] : raw
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, claimType } = body
    let { gratificationId } = body

    if (!userId || !gratificationId) {
      return error('userId e gratificationId são obrigatórios')
    }

    // Validate claimType
    const validClaimTypes = ['balance', 'prize']
    const resolvedClaimType = validClaimTypes.includes(claimType) ? claimType : 'balance'

    // Task 15-f — itens de CATÁLOGO (ids `catalog_<type>_<idx>`) não existem
    // na tabela Gratification: antes o findOne abaixo caía em 404 e o membro
    // via o toast genérico "Erro ao reivindicar gratificação". Agora
    // resolvemos o item no catálogo (com overlay do admin) e MATERIALIZAMOS
    // uma linha real de Gratification para o usuário; o fluxo comum abaixo
    // (ownership → claimed → KYC → creditação) segue idêntico.
    const catalogType = typeof gratificationId === 'string' ? parseCatalogId(gratificationId) : null
    if (catalogType !== null) {
      const item = await getCatalogItem(catalogType)
      if (!item) {
        return error('Gratificação não encontrada', 404)
      }
      if (!item.amount || item.amount <= 0) {
        // Itens de meta (amount 0, ex.: driver_daily_goal) não são
        // resgatáveis — o botão só aparece para itens com valor.
        return error('Este benefício não possui valor configurado para resgate', 400)
      }

      // Idempotência: o marker `[catalog:<type>]` na description identifica
      // a linha criada por este fluxo (o schema Gratification não tem
      // referenceId — mesmo padrão de dedup do goal-configs/claim).
      const catalogMarker = `[catalog:${item.type}]`
      const existing = await prisma.gratification.findFirst({
        where: {
          userId,
          type: item.type,
          description: { contains: catalogMarker },
        },
        orderBy: { createdAt: 'desc' },
      })
      if (existing?.isClaimed) {
        return error('Gratificação já resgatada', 400)
      }
      if (existing) {
        // Tentativa anterior interrompida (row criada, não resgatada):
        // reutiliza a row pendente em vez de duplicar.
        gratificationId = existing.id
      } else {
        const created = await prisma.gratification.create({
          data: {
            userId,
            type: item.type,
            amount: item.amount,
            category: item.category || 'benefits',
            description: `${catalogMarker} ${item.name}`,
            isClaimed: false,
          },
        })
        gratificationId = created.id
      }
    }

    // Find the gratification
    const gratification = await db.findOne('Gratification', '"id" = $1', [gratificationId])

    if (!gratification) {
      return error('Gratificação não encontrada', 404)
    }

    if (gratification.userId !== userId) {
      return error('Gratificação não pertence a este usuário', 403)
    }

    if (gratification.isClaimed) {
      return error('Gratificação já resgatada', 400)
    }

    // Find the user
    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user) {
      return error('Usuário não encontrado', 404)
    }

    // KYC gate: block gratification/cashback claims if user's KYC is not
    // approved (admins bypass).
    if (user.role !== 'admin' && user.userType !== 'admin' && user.userType !== 'ADMIN') {
      const kycOk = await isKycApproved(user.id as string)
      if (!kycOk) {
        return error(
          'KYC não aprovado. Complete sua verificação de documentos na aba KYC para resgatar gratificações.',
          403
        )
      }
    }

    // Mark as claimed
    await db.update(
      'Gratification',
      '"id" = $1',
      {
        isClaimed: true,
        claimedAt: new Date().toISOString(),
      },
      [gratificationId]
    )

    if (resolvedClaimType === 'balance') {
      // Add to appropriate balance based on category
      let balanceField = 'balanceGratification'
      if (gratification.category === 'mobility') balanceField = 'balanceMobility'
      else if (gratification.category === 'shopping') balanceField = 'balanceShopping'
      else if (gratification.category === 'withdrawal') balanceField = 'balanceWithdrawal'

      const currentBalance = (user as any)[balanceField] as number
      const newBalance = (currentBalance || 0) + (gratification.amount || 0)

      await db.update(
        'User',
        '"id" = $1',
        { [balanceField]: newBalance },
        [userId]
      )

      // Create transaction
      await db.insert('Transaction', {
        id: generateId(),
        userId,
        type: 'gratification',
        amount: gratification.amount,
        status: 'approved',
        category: 'gratification',
        description: `Gratificação resgatada: ${gratification.type} (saldo)`,
      })

      return success({
        gratification: { ...gratification, isClaimed: true, claimedAt: new Date().toISOString() },
        claimType: 'balance',
        balanceField,
        newBalance,
        message: 'Gratificação adicionada ao saldo com sucesso!',
      })
    }

    if (resolvedClaimType === 'prize') {
      // Create a support ticket requesting the prize
      const ticket = await db.insert('Ticket', {
        id: generateId(),
        userId,
        subject: `Solicitação de Prêmio: ${gratification.type}`,
        category: 'gratification',
        status: 'open',
      })

      await db.insert('TicketMessage', {
        id: generateId(),
        ticketId: (ticket as any).id,
        userId,
        message: `Olá! Gostaria de solicitar o prêmio referente à gratificação "${gratification.type}" no valor de ${gratification.amount} centavos. Agradeço desde já!`,
        isAdmin: false,
      })

      // Create transaction record for tracking
      await db.insert('Transaction', {
        id: generateId(),
        userId,
        type: 'gratification',
        amount: gratification.amount,
        status: 'pending',
        category: 'gratification',
        description: `Gratificação resgatada: ${gratification.type} (prêmio solicitado)`,
      })

      return success({
        gratification: { ...gratification, isClaimed: true, claimedAt: new Date().toISOString() },
        claimType: 'prize',
        ticketId: (ticket as any).id,
        message: 'Solicitação de prêmio criada com sucesso! Acompanhe pelo suporte.',
      })
    }

    return error('Tipo de reivindicação inválido')
  } catch (err) {
    console.error('[Gratifications Claim] Error:', err)
    return error('Erro interno do servidor. Tente novamente.', 500)
  }
}
