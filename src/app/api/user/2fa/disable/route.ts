import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { verifyPassword } from '@/lib/api-utils'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, password } = body
    if (!userId || !password) return error('userId and password are required', 400)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return error('User not found', 404)

    // Verify password
    if (!verifyPassword(password, user.password)) {
      return error('Invalid password', 401)
    }

    // Disable 2FA
    const setupKey = `2fa_setup_${userId}`
    const enabledKey = `2fa_enabled_${userId}`

    await Promise.all([
      db.systemConfig.deleteMany({ where: { key: setupKey } }),
      db.systemConfig.deleteMany({ where: { key: enabledKey } }),
    ])

    return success({ enabled: false, message: '2FA has been disabled' })
  } catch (err) {
    return error('Failed to disable 2FA', 500)
  }
}
