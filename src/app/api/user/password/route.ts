import { db } from '@/lib/db'
import { verifyPassword, hashPassword, success, error } from '@/lib/api-utils'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { userId, currentPassword, newPassword } = body

    if (!userId || !currentPassword || !newPassword) {
      return error('userId, currentPassword, and newPassword are required')
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return error('User not found', 404)
    }

    if (!verifyPassword(currentPassword, user.password)) {
      return error('Current password is incorrect', 401)
    }

    const hashedNewPassword = hashPassword(newPassword)
    await db.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    })

    return success({ message: 'Password updated successfully' })
  } catch (err) {
    console.error('Password change error:', err)
    return error('Internal server error', 500)
  }
}
