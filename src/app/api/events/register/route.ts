import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, eventId } = body

    if (!userId || !eventId) {
      return error('userId e eventId são obrigatórios')
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return error('Usuário não encontrado', 404)
    }

    // Check if event exists (could be mock or real)
    const existingReg = await db.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    })

    if (existingReg) {
      return error('Você já está inscrito neste evento')
    }

    await db.eventRegistration.create({
      data: { eventId, userId },
    })

    return success({ message: 'Inscrição realizada com sucesso', eventId, userId })
  } catch (err: any) {
    return error(err.message || 'Erro ao registrar inscrição', 500)
  }
}
