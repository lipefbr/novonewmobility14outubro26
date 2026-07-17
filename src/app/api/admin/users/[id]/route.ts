import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error, sanitizeUser } from '@/lib/api-utils'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const adminId = req.nextUrl.searchParams.get('userId')
    if (!adminId) return error('userId is required', 400)

    const admin = await prisma.user.findUnique({ where: { id: adminId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { referrals: true } },
        referredBy: { select: { id: true, name: true, email: true } },
      },
    })
    if (!user) return error('User not found', 404)

    const safeUser = sanitizeUser(user as unknown as Record<string, unknown>)

    return success({
      ...safeUser,
      _count: { referrals: user._count.referrals },
      referrer: user.referredBy || null,
    })
  } catch (err) {
    console.error('Get user error:', err)
    return error('Failed to fetch user', 500)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      userId,
      name, email, phone, cpf,
      plan, isActive,
      balanceWithdrawal, balanceMobility, balanceShopping,
      balanceFood, balancePharmacy, balanceGratification,
      careerPoints, personalPoints, stars,
      city, state, country,
      bankCode, bankAgency, bankAccount, bankType,
      pixKey, pixEnabled,
      isDriver, isDelivery,
      qualification,
      role,
    } = body

    if (!userId) return error('userId is required', 400)

    // Verify admin
    const admin = await prisma.user.findUnique({ where: { id: userId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) return error('User not found', 404)

    // Build update data - all editable fields
    const updateData: Record<string, unknown> = {}

    // Personal info
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (cpf !== undefined) updateData.cpf = cpf

    // Plan & status
    if (plan !== undefined) updateData.plan = plan
    if (isActive !== undefined) updateData.isActive = isActive

    // All balances
    if (balanceWithdrawal !== undefined) updateData.balanceWithdrawal = balanceWithdrawal
    if (balanceMobility !== undefined) updateData.balanceMobility = balanceMobility
    if (balanceShopping !== undefined) updateData.balanceShopping = balanceShopping
    if (balanceFood !== undefined) updateData.balanceFood = balanceFood
    if (balancePharmacy !== undefined) updateData.balancePharmacy = balancePharmacy
    if (balanceGratification !== undefined) updateData.balanceGratification = balanceGratification

    // Career info
    if (careerPoints !== undefined) updateData.careerPoints = careerPoints
    if (personalPoints !== undefined) updateData.personalPoints = personalPoints
    if (stars !== undefined) updateData.stars = stars

    // Location
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (country !== undefined) updateData.country = country

    // Bank details
    if (bankCode !== undefined) updateData.bankCode = bankCode
    if (bankAgency !== undefined) updateData.bankAgency = bankAgency
    if (bankAccount !== undefined) updateData.bankAccount = bankAccount
    if (bankType !== undefined) updateData.bankType = bankType
    if (pixKey !== undefined) updateData.pixKey = pixKey
    if (pixEnabled !== undefined) updateData.pixEnabled = pixEnabled

    // Driver / delivery
    if (isDriver !== undefined) updateData.isDriver = isDriver
    if (isDelivery !== undefined) updateData.isDelivery = isDelivery

    // BACK-4 — qualification (one of: motorista | passageiro | passageiro_60 |
    // passageiro_pcd | comercio | entregador). Mirrors the registration
    // dropdown. Allow clearing by sending an empty string.
    if (qualification !== undefined) updateData.qualification = qualification || null

    // Role
    if (role !== undefined) updateData.role = role

    if (Object.keys(updateData).length === 0) {
      return error('No fields to update', 400)
    }

    const updated = await prisma.user.update({ where: { id }, data: updateData })

    // Remove password from response
    const { password: _password, ...safeUser } = updated

    return success(safeUser)
  } catch (err) {
    console.error('Update user error:', err)
    return error('Failed to update user', 500)
  }
}
