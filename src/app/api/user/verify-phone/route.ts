import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId } = body
    if (!userId) return error('userId is required', 400)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return error('User not found', 404)

    // Simulate phone verification - create a notification
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    await db.notification.create({
      data: {
        userId,
        title: 'Verificação de Telefone',
        message: `Seu código de verificação SMS é: ${code}. Use este código para verificar seu telefone.`,
        type: 'info',
      },
    })

    // Store verification code
    await db.systemConfig.upsert({
      where: { key: `phone_verify_${userId}` },
      update: { value: JSON.stringify({ code, verified: false, sentAt: new Date().toISOString() }) },
      create: { key: `phone_verify_${userId}`, value: JSON.stringify({ code, verified: false, sentAt: new Date().toISOString() }), description: `Phone verification for user ${userId}` },
    })

    return success({ message: 'Verification SMS sent (simulated)', code: code }) // In dev mode, return the code
  } catch (err) {
    return error('Failed to send verification SMS', 500)
  }
}
