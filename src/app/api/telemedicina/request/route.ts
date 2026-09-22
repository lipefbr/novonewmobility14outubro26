import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

/**
 * Telemedicina activation request API.
 *
 *   POST /api/telemedicina/request        — user submits/updates their activation request
 *   GET  /api/telemedicina/request?userId=X — fetches the user's most recent request
 *
 * A user may have at most ONE active (status !== 'cancelled') request at a
 * time. If they submit again while a pending request exists, we update it
 * in place (so they can correct typos). If a previous request was approved
 * or rejected, a new submission creates a new row.
 *
 * The TelemedicinaRequest model has no `paymentMethod` column (we cannot
 * modify the schema), so the chosen payment method is stored as a prefix
 * on the `notes` field in the format `[Pagamento: PIX] <user-notes>`.
 * Likewise, the chosen plan + price snapshot is stored as a second prefix
 * `[Plano: <planName> R$ X]` (Task ID 4 — sistema de planos igual ao
 * TalkMobi). `serializePaymentMethod()` and `parsePlanFromNotes()` parse
 * them back out so the admin panel and the user's own page can display
 * them cleanly.
 */

interface Dependent {
  name?: string
  kinship?: string
  birthDate?: string
  cpf?: string
}

/**
 * Preço padrão (em centavos) usado quando o usuário NÃO escolhe um plano do
 * catálogo (ex.: pedidos antigos antes do catálogo existir). Mantido por
 * compat — nunca mais é o preço "real", que agora vem de `TelemedicinaPlan`.
 */
export const TELEMEDICINA_PRICE_CENTS = 4990

/**
 * Accepted payment-method identifiers (lowercase, matching Invoice's
 * `paymentMethod` column convention). The label map is shared with the
 * frontend for consistent display.
 */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  credit_card: 'Cartão de Crédito',
}

export function normalizePaymentMethod(input: unknown): string | null {
  if (!input || typeof input !== 'string') return null
  const v = input.trim().toLowerCase()
  if (v === 'pix') return 'pix'
  if (v === 'boleto' || v === 'bank_slip') return 'boleto'
  if (v === 'credit_card' || v === 'creditcard' || v === 'cartao' || v === 'cartão') return 'credit_card'
  return null
}

export function paymentMethodLabel(method: string | null): string | null {
  if (!method) return null
  return PAYMENT_METHOD_LABELS[method] ?? method
}

/**
 * Parse the `[Pagamento: PIX] ` prefix from a notes string.
 * Returns `{ method, notes }` where `notes` is the user's original text
 * without the prefix.
 */
export function parsePaymentFromNotes(raw: string | null): {
  method: string | null
  notes: string | null
} {
  if (!raw) return { method: null, notes: null }
  // Match `[Pagamento: <method>] <rest>` at the start of the string. Use
  // [\s\S] instead of the `s` (dotAll) flag because the project's
  // tsconfig targets ES2017 and the `s` flag requires ES2018+.
  const match = raw.match(/^\[Pagamento:\s*([^\]]+)\]\s*([\s\S]*)$/i)
  if (!match) return { method: null, notes: raw }
  const method = normalizePaymentMethod(match[1]) ?? match[1].trim()
  const rest = match[2].trim()
  return { method, notes: rest || null }
}

export function buildNotesWithPayment(method: string | null, userNotes: string | null): string | null {
  if (!method) return userNotes ? String(userNotes) : null
  const label = paymentMethodLabel(method) ?? method
  const rest = userNotes ? String(userNotes).trim() : ''
  return rest ? `[Pagamento: ${label}] ${rest}` : `[Pagamento: ${label}]`
}

/**
 * Parse the `[Plano: <planName> R$ <price>] ` prefix from a notes string.
 * Returns `{ planName, priceCents, notes }` where `notes` is the remaining
 * text without the prefix (which may still contain the `[Pagamento: …]`
 * prefix if the caller didn't strip it first — caller is responsible for
 * chaining parsePaymentFromNotes afterwards).
 */
export function parsePlanFromNotes(raw: string | null): {
  planName: string | null
  priceCents: number | null
  notes: string | null
} {
  if (!raw) return { planName: null, priceCents: null, notes: null }
  // Match `[Plano: <name> R$ <price>] <rest>` — o preço pode ter casa decimal
  // ("R$ 49,90" ou "R$ 49.90") ou ser inteiro ("R$ 49"). Aceitamos ambos.
  const match = raw.match(
    /^\[Plano:\s*(.+?)\s*R\$\s*([\d.,]+)\]\s*([\s\S]*)$/i,
  )
  if (!match) return { planName: null, priceCents: null, notes: raw }
  const planName = match[1].trim()
  // Normaliza "49,90" / "49.90" / "1.999,90" para centavos inteiros.
  const rawPrice = match[2].trim()
  const cleaned = rawPrice
    .replace(/\.(?=\d{3}(\D|$))/g, '') // strip thousands-separator dots
    .replace(',', '.')
  const price = Number(cleaned)
  const priceCents =
    Number.isFinite(price) && price >= 0 ? Math.round(price * 100) : null
  const rest = match[3].trim()
  return { planName, priceCents, notes: rest || null }
}

/**
 * Constrói o notes com DOIS prefixes:
 *   [Pagamento: <method>] [Plano: <planName> R$ <priceFormatted>] <user-notes>
 *
 * A ordem (Pagamento ANTES de Plano) é intencional: o painel admin em
 * `admin-telemedicina-panel.tsx` tem uma cópia LOCAL de parsePaymentFromNotes
 * que espera `[Pagamento: …]` no START da string. Mantendo esse prefixo
 * primeiro, o painel continua exibindo o badge "Pagamento via PIX"
 * corretamente, sem precisar de mudança. A serialize() aqui no route.ts
 * faz o parse em ordem inversa: PRIMEIRO extrai `[Plano: …]` (que agora
 * está no MEIO da string) e depois `[Pagamento: …]` do restante.
 */
export function buildNotesWithPlanAndPayment(
  planName: string | null,
  priceCents: number | null,
  method: string | null,
  userNotes: string | null,
): string | null {
  // Primeiro monta o "miolo" com o prefixo [Plano: …] + user-notes.
  let middle: string | null
  if (!planName || priceCents == null || priceCents < 0) {
    middle = userNotes ? String(userNotes) : null
  } else {
    const priceBRL = (priceCents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
    const planPrefix = `[Plano: ${planName} ${priceBRL}]`
    middle = userNotes && String(userNotes).trim()
      ? `${planPrefix} ${String(userNotes).trim()}`
      : planPrefix
  }
  // Agora envolve com o prefixo [Pagamento: …] se houver método.
  if (!method) return middle
  const label = paymentMethodLabel(method) ?? method
  return middle ? `[Pagamento: ${label}] ${middle}` : `[Pagamento: ${label}]`
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const req_row = await prisma.telemedicinaRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    if (!req_row) {
      return success({ request: null })
    }

    return success({ request: serialize(req_row) })
  } catch (err) {
    console.error('Telemedicina GET my-request error:', err)
    return error('Failed to fetch Telemedicina request', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId,
      fullName,
      cpf,
      birthDate,
      phone,
      email,
      dependents = [],
      notes,
      paymentMethod,
      planId,
      planName,
      priceCents,
    } = body ?? {}

    if (!userId) return error('userId is required', 400)
    if (!fullName || !cpf || !phone || !email) {
      return error('fullName, cpf, phone e email são obrigatórios', 400)
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return error('Usuário não encontrado', 404)

    // Normalize dependents to a JSON string
    const dependentsStr = Array.isArray(dependents)
      ? JSON.stringify(dependents.filter((d: Dependent) => d && d.name))
      : '[]'

    // Validate + normalize the chosen payment method. The schema has no
    // dedicated column, so we persist it as a `[Pagamento: PIX]` prefix on
    // the notes field (see buildNotesWithPayment / parsePaymentFromNotes).
    const method = normalizePaymentMethod(paymentMethod)
    if (paymentMethod && !method) {
      return error('Forma de pagamento inválida. Use: pix, boleto ou credit_card', 400)
    }

    // ===== Plano snapshot (Task ID 4) =====
    // Se o caller passou um planId, validamos que o plano existe e está
    // ativo no catálogo — para evitar que um usuário forje um plano com
    // preço menor. O snapshot (planName, priceCents) vem do banco; se o
    // caller também enviou esses campos, ignoramos em favor do banco.
    let resolvedPlanName: string | null = null
    let resolvedPriceCents: number | null = null
    if (planId && typeof planId === 'string') {
      const plan = await prisma.telemedicinaPlan.findUnique({
        where: { id: planId },
      })
      if (!plan || !plan.isActive) {
        return error('Plano de Telemedicina inválido ou inativo.', 400)
      }
      resolvedPlanName = plan.name
      resolvedPriceCents = plan.priceCents
    } else if (typeof planName === 'string' && planName.trim()) {
      // Sem planId mas com planName — usamos o que o caller passou (backward
      // compat para clientes que só sabem o nome). Aceitamos priceCents se
      // veio, senão caímos no default histórico (não recomendado).
      resolvedPlanName = planName.trim()
      resolvedPriceCents =
        typeof priceCents === 'number' && Number.isFinite(priceCents) && priceCents >= 0
          ? Math.round(priceCents)
          : TELEMEDICINA_PRICE_CENTS
    }

    const notesWithPlanAndPayment = buildNotesWithPlanAndPayment(
      resolvedPlanName,
      resolvedPriceCents,
      method,
      notes ?? null,
    )

    // Check for an existing PENDING request — update in place instead of
    // creating duplicates. (Approved/rejected requests stay archived; a
    // new submission creates a fresh row in those cases.)
    const existing = await prisma.telemedicinaRequest.findFirst({
      where: { userId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    })

    if (existing) {
      const updated = await prisma.telemedicinaRequest.update({
        where: { id: existing.id },
        data: {
          fullName: String(fullName),
          cpf: String(cpf),
          birthDate: birthDate ? String(birthDate) : null,
          phone: String(phone),
          email: String(email),
          dependents: dependentsStr,
          notes: notesWithPlanAndPayment,
        },
      })
      return success({ request: serialize(updated), message: 'Pedido atualizado com sucesso.' })
    }

    const created = await prisma.telemedicinaRequest.create({
      data: {
        userId,
        fullName: String(fullName),
        cpf: String(cpf),
        birthDate: birthDate ? String(birthDate) : null,
        phone: String(phone),
        email: String(email),
        dependents: dependentsStr,
        notes: notesWithPlanAndPayment,
        status: 'pending',
      },
    })

    return success({ request: serialize(created), message: 'Pedido enviado com sucesso! Equipe irá analisar.' }, 201)
  } catch (err) {
    console.error('Telemedicina POST request error:', err)
    return error('Failed to submit Telemedicina request', 500)
  }
}

function serialize(r: any) {
  let dependents: any[] = []
  try {
    const parsed = JSON.parse(r.dependents || '[]')
    if (Array.isArray(parsed)) dependents = parsed
  } catch {
    dependents = []
  }
  // ===== Parse dos dois prefixes do notes (Task ID 4) =====
  //  1. [Pagamento: <method>]  → no START da string (parsePaymentFromNotes)
  //  2. [Plano: <name> R$ <price>]  → no restante após o payment (parsePlanFromNotes)
  // O restante final é o texto do usuário (limpo).
  //
  // A ordem [Pagamento] → [Plano] é mantida no buildNotesWithPlanAndPayment
  // para compatibilidade com o painel admin (que tem cópia local do
  // parsePaymentFromNotes esperando `[Pagamento: …]` no start da string).
  const { method, notes: afterPayment } = parsePaymentFromNotes(r.notes ?? null)
  const { planName, priceCents, notes: cleanNotes } = parsePlanFromNotes(afterPayment)
  return {
    id: r.id,
    userId: r.userId,
    fullName: r.fullName,
    cpf: r.cpf,
    birthDate: r.birthDate ?? null,
    phone: r.phone,
    email: r.email,
    dependents,
    notes: cleanNotes,
    paymentMethod: method,
    paymentMethodLabel: paymentMethodLabel(method),
    planId: null, // não persistimos planId (snapshot pelo notes) — mantemos por compat de tipo
    planName,
    priceCents,
    status: r.status,
    adminNotes: r.adminNotes ?? null,
    activationLink: r.activationLink ?? null,
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
    rejectedAt: r.rejectedAt ? r.rejectedAt.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
  }
}
