import { db } from '@/lib/db'
import { success, error, sanitizeUser } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return error('userId is required')
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        referrals: {
          select: { id: true, name: true, email: true, createdAt: true, isActive: true, plan: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!user) {
      return error('User not found', 404)
    }

    return success(sanitizeUser(user as unknown as Record<string, unknown>))
  } catch (err) {
    console.error('Profile fetch error:', err)
    return error('Internal server error', 500)
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { userId, name, phone, address, city, state, bankCode, bankAgency, bankAccount, bankType, language } = body

    if (!userId) {
      return error('userId is required')
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return error('User not found', 404)
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (bankCode !== undefined) updateData.bankCode = bankCode
    if (bankAgency !== undefined) updateData.bankAgency = bankAgency
    if (bankAccount !== undefined) updateData.bankAccount = bankAccount
    if (bankType !== undefined) updateData.bankType = bankType
    if (language !== undefined) updateData.language = language

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
    })

    return success(sanitizeUser(updatedUser as unknown as Record<string, unknown>))
  } catch (err) {
    console.error('Profile update error:', err)
    return error('Internal server error', 500)
  }
}
