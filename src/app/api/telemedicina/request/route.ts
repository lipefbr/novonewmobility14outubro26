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
 */

interface Dependent {
  name?: string
  kinship?: string
  birthDate?: string
  cpf?: string
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
          notes: notes ? String(notes) : null,
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
        notes: notes ? String(notes) : null,
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
  return {
    id: r.id,
    userId: r.userId,
    fullName: r.fullName,
    cpf: r.cpf,
    birthDate: r.birthDate ?? null,
    phone: r.phone,
    email: r.email,
    dependents,
    notes: r.notes ?? null,
    status: r.status,
    adminNotes: r.adminNotes ?? null,
    activationLink: r.activationLink ?? null,
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
    rejectedAt: r.rejectedAt ? r.rejectedAt.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
  }
}
