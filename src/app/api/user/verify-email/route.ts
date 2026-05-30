import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId } = body
    if (!userId) return error('userId is required', 400)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return error('User not found', 404)

    // Simulate email verification - create a notification
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    await db.notification.create({
      data: {
        userId,
        title: 'Verificação de E-mail',
        message: `Seu código de verificação é: ${code}. Use este código para verificar seu e-mail.`,
        type: 'info',
      },
    })

    // Store verification code
    await db.systemConfig.upsert({
      where: { key: `email_verify_${userId}` },
      update: { value: JSON.stringify({ code, verified: false, sentAt: new Date().toISOString() }) },
      create: { key: `email_verify_${userId}`, value: JSON.stringify({ code, verified: false, sentAt: new Date().toISOString() }), description: `Email verification for user ${userId}` },
    })

    return success({ message: 'Verification email sent (simulated)', code: code }) // In dev mode, return the code
  } catch (err) {
    return error('Failed to send verification email', 500)
  }
}
