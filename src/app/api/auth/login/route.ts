import { db } from '@/lib/db'
import { verifyPassword, success, error, sanitizeUser } from '@/lib/api-utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return error('Email and password are required')
    }

    const user = await db.findOne('User', '"email" = $1', [email])
    if (!user) {
      return error('Invalid credentials', 401)
    }

    if (!verifyPassword(password, user.password)) {
      return error('Invalid credentials', 401)
    }

    const safeUser = sanitizeUser(user)

    return success({
      user: safeUser,
      balances: {
        withdrawal: user.balanceWithdrawal,
        mobility: user.balanceMobility,
        shopping: user.balanceShopping,
        food: user.balanceFood,
        pharmacy: user.balancePharmacy,
        gratification: user.balanceGratification,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return error('Internal server error', 500)
  }
}
