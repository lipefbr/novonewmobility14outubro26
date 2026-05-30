import { db } from '@/lib/db'
import { success, error, sanitizeUser } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return error('userId is required')
    }

    const user = await db.findOne('User', '"id" = $1', [userId])

    if (!user) {
      return error('User not found', 404)
    }

    // Fetch referrals (users whose referredById matches this user's id)
    const referrals = await db.find(
      'User',
      '"referredById" = $1',
      [userId],
      'ORDER BY "createdAt" DESC LIMIT 10'
    )

    // Select only the fields that were included in the original Prisma select
    const safeUser = sanitizeUser(user)
    const mappedReferrals = (referrals as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      createdAt: r.createdAt,
      isActive: r.isActive,
      plan: r.plan,
    }))

    return success({ ...safeUser, referrals: mappedReferrals })
  } catch (err) {
    console.error('Profile fetch error:', err)
    return error('Internal server error', 500)
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const {
      userId,
      name,
      username,
      phone,
      address,
      city,
      state,
      bankCode,
      bankAgency,
      bankAccount,
      bankType,
      language,
      pixKey,
      pixEnabled,
    } = body

    if (!userId) {
      return error('userId is required')
    }

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user) {
      return error('User not found', 404)
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (username !== undefined) updateData.username = username
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (bankCode !== undefined) updateData.bankCode = bankCode
    if (bankAgency !== undefined) updateData.bankAgency = bankAgency
    if (bankAccount !== undefined) updateData.bankAccount = bankAccount
    if (bankType !== undefined) updateData.bankType = bankType
    if (language !== undefined) updateData.language = language
    if (pixKey !== undefined) updateData.pixKey = pixKey
    if (pixEnabled !== undefined) updateData.pixEnabled = pixEnabled

    const updatedUser = await db.update('User', '"id" = $1', updateData, [userId])

    return success(sanitizeUser(updatedUser))
  } catch (err) {
    console.error('Profile update error:', err)
    return error('Internal server error', 500)
  }
}
