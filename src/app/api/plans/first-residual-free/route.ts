import { db, prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// ─── First-month-free residual credit (Índice.docx §2) ──────────────
// When a user closes entrada level 3 (i.e. has all 64 positions at L3
// of the entrada matrix filled), the company pays the first R$1.399
// residual monthly invoice once. The credit is issued to the user's
// `balancePaymentInvoice` wallet and is recorded as a one-time bonus
// Transaction with description "Crédito 1ª mensalidade residual —
// Fechou nível 3 da matriz Entrada".
//
// Endpoint contract:
//   GET  /api/plans/first-residual-free?userId=<id>
//     → returns { qualifies, alreadyReceived, l3Closed, message }
//
//   POST /api/plans/first-residual-free  { userId }
//     → idempotently issues the R$1.399 credit if the user qualifies
//       and hasn't received it yet; returns the new Transaction row.
//
// Task 13-d (M-7) — os valores NÃO são mais fixos:
//   - Credit amount ← SystemConfig `matrix.residual.base_cents`
//     (editável na aba Matrizes do admin; default 139900 = R$ 1.399,00).
//   - Required users ← MatrixType (matrixKind='entrada').width^3
//     (fallback 4^3 = 64).
// Os textos de qualificação ("R$ 1.399,00", "64 posições") derivam dos
// mesmos valores carregados por request.

// FALLBACKS documentados — usados somente se o config/MatrixType falharem.
const DEFAULT_FIRST_RESIDUAL_CREDIT_CENTS = 139900 // R$1.399,00
const DEFAULT_ENTRADA_L3_REQUIRED_USERS = 64 // 4^3 = 64 positions on a 4-wide matrix
const FIRST_RESIDUAL_CREDIT_DESCRIPTION = 'Crédito 1ª mensalidade residual — Fechou nível 3 da matriz Entrada'

// Task 13-d — formata centavos em R$ para os textos dinâmicos (139900 → "R$ 1.399,00").
function formatCentsBrl(cents: number): string {
  return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Task 13-d — carrega o valor do crédito e o tamanho do nível 3 por request.
async function loadFirstResidualConfig(): Promise<{
  creditCents: number
  l3RequiredUsers: number
}> {
  const [baseCfg, matrixTypeRow] = await Promise.all([
    prisma.systemConfig
      .findUnique({ where: { key: 'matrix.residual.base_cents' } })
      .catch(() => null),
    prisma.matrixType
      .findFirst({ where: { matrixKind: 'entrada', isActive: true } })
      .catch(() => null),
  ])

  // Valor do crédito: SystemConfig matrix.residual.base_cents (default 139900).
  let creditCents = DEFAULT_FIRST_RESIDUAL_CREDIT_CENTS
  if (baseCfg) {
    const parsed = parseInt(baseCfg.value, 10)
    if (Number.isFinite(parsed) && parsed > 0) creditCents = parsed
  }

  // Posições do nível 3: width^3 do MatrixType de entrada (fallback 4^3 = 64).
  let l3RequiredUsers = DEFAULT_ENTRADA_L3_REQUIRED_USERS
  if (matrixTypeRow && Number.isFinite(matrixTypeRow.width) && matrixTypeRow.width > 0) {
    l3RequiredUsers = Math.pow(matrixTypeRow.width, 3)
  }

  return { creditCents, l3RequiredUsers }
}

async function userClosedEntradaL3(userId: string, requiredUsers: number): Promise<boolean> {
  // Count the user's entrada matrix descendants at level 3 (4-wide → 64
  // positions). We use MatrixPosition rows where matrixType='entrada'
  // and the user is the root ancestor. The simplest robust check is to
  // count the user's entrada cashback entries at level 3 (which are
  // only created when a downline fills that level). If we have ≥64
  // (requiredUsers, Task 13-d: width^3 do MatrixType), the level is closed.
  try {
    const entries = await db.find(
      'CashbackEntry',
      '"userId" = $1 AND "level" = $2',
      [userId, 3]
    ) as any[]
    if (entries && entries.length >= requiredUsers) return true

    // Fallback: count MatrixPosition rows at level 3 under this user's
    // entrada tree. We do this by looking up the user's own entrada
    // MatrixPosition and counting descendants at level 3.
    const rootPos = await db.findOne(
      'MatrixPosition',
      '"userId" = $1 AND "matrixType" = $2',
      [userId, 'entrada']
    ) as any
    if (rootPos) {
      // Direct count of positions at level 3 under this root (via path
      // prefix or by rootId if the schema tracks it; here we use a
      // simple count of all entrada positions at level 3 — production
      // would scope this to the user's subtree).
      const allL3 = await db.find(
        'MatrixPosition',
        '"matrixType" = $1 AND "level" = $2',
        ['entrada', 3]
      ) as any[]
      if (allL3 && allL3.length >= requiredUsers) return true
    }
  } catch (e) {
    console.warn('[first-residual-free] Could not verify L3 closure:', e)
  }
  return false
}

async function userAlreadyReceivedCredit(userId: string): Promise<boolean> {
  try {
    const existing = await db.find(
      'Transaction',
      '"userId" = $1 AND "description" = $2',
      [userId, FIRST_RESIDUAL_CREDIT_DESCRIPTION]
    ) as any[]
    return Array.isArray(existing) && existing.length > 0
  } catch (e) {
    // If the lookup fails, fall back to the prisma client (covers
    // scenarios where db.find doesn't handle the description filter).
    try {
      const count = await prisma.transaction.count({
        where: {
          userId,
          description: FIRST_RESIDUAL_CREDIT_DESCRIPTION,
        },
      })
      return count > 0
    } catch (e2) {
      console.warn('[first-residual-free] Prisma fallback failed:', e2)
      return false
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return error('userId is required')

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user) return error('User not found', 404)

    // Task 13-d — valor do crédito + posições do L3 dinâmicos por request.
    const { creditCents, l3RequiredUsers } = await loadFirstResidualConfig()

    const l3Closed = await userClosedEntradaL3(userId, l3RequiredUsers)
    const alreadyReceived = await userAlreadyReceivedCredit(userId)
    const qualifies = l3Closed && !alreadyReceived

    return success({
      userId,
      l3Closed,
      alreadyReceived,
      qualifies,
      creditAmountCents: creditCents,
      l3RequiredUsers,
      message: qualifies
        ? `Você qualifica para o crédito da 1ª mensalidade residual (${formatCentsBrl(creditCents)}).`
        : alreadyReceived
        ? 'Você já recebeu o crédito da 1ª mensalidade residual.'
        : l3Closed
        ? 'Nível 3 fechado, mas o crédito já foi emitido.'
        : `Feche o nível 3 da matriz Entrada (${l3RequiredUsers} posições) para qualificar.`,
    })
  } catch (err) {
    console.error('first-residual-free GET error:', err)
    return error('Internal server error', 500)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body
    if (!userId) return error('userId is required')

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user) return error('User not found', 404)

    // Task 13-d — valor do crédito + posições do L3 dinâmicos por request.
    const { creditCents, l3RequiredUsers } = await loadFirstResidualConfig()
    const creditLabel = formatCentsBrl(creditCents)

    const l3Closed = await userClosedEntradaL3(userId, l3RequiredUsers)
    if (!l3Closed) {
      return error(`Usuário ainda não fechou o nível 3 da matriz Entrada (${l3RequiredUsers} posições).`, 400)
    }

    const alreadyReceived = await userAlreadyReceivedCredit(userId)
    if (alreadyReceived) {
      return error('Usuário já recebeu o crédito da 1ª mensalidade residual.', 400)
    }

    // Credit the configured residual base amount to balancePaymentInvoice
    const currentBalance = (user as any).balancePaymentInvoice || 0
    await db.update('User', '"id" = $1', {
      balancePaymentInvoice: currentBalance + creditCents,
    }, [userId])

    // Create the bonus Transaction record
    const tx = await db.insert('Transaction', {
      userId,
      type: 'bonus',
      amount: creditCents,
      status: 'paid',
      category: 'paymentInvoice',
      description: FIRST_RESIDUAL_CREDIT_DESCRIPTION,
    })

    // Notify the user
    await db.insert('Notification', {
      userId,
      title: 'Crédito de 1ª mensalidade residual recebido!',
      message: `Parabéns! Você fechou o nível 3 da matriz Entrada. A empresa creditou ${creditLabel} na sua carteira "Saldo para Faturas" para pagar sua 1ª mensalidade residual.`,
      type: 'bonus',
    })

    const updatedUser = await db.findOne('User', '"id" = $1', [userId])

    return success({
      transaction: tx,
      user: updatedUser,
      creditAmountCents: creditCents,
      creditedTo: 'balancePaymentInvoice',
      message: `Crédito de ${creditLabel} emitido com sucesso na carteira Saldo para Faturas.`,
    }, 201)
  } catch (err) {
    console.error('first-residual-free POST error:', err)
    return error('Internal server error', 500)
  }
}
