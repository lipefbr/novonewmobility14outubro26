import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId } = body
    if (!userId) return error('userId is required', 400)

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user) return error('User not found', 404)

    // Simulate phone verification - create a notification
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    await db.insert('Notification', {
      userId,
      title: 'Verificação de Telefone',
      message: `Seu código de verificação SMS é: ${code}. Use este código para verificar seu telefone.`,
      type: 'info',
    })

    // Store verification code using upsert via raw SQL
    const verifyKey = `phone_verify_${userId}`
    const verifyValue = JSON.stringify({ code, verified: false, sentAt: new Date().toISOString() })
    const description = `Phone verification for user ${userId}`

    await db.execute(
      `INSERT INTO "SystemConfig" ("key", "value", "description") VALUES ($1, $2, $3)
       ON CONFLICT ("key") DO UPDATE SET "value" = $2, "description" = $3`,
      [verifyKey, verifyValue, description]
    )

    return success({ message: 'Verification SMS sent (simulated)', code: code }) // In dev mode, return the code
  } catch (err) {
    return error('Failed to send verification SMS', 500)
  }
}
