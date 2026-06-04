import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error, hashPassword, generateReferralCode, sanitizeUser } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, name, email, phone, cpf, plan, role, password, referredByCode } = body

    if (!userId) return error('userId is required', 400)

    const admin = await db.user.findUnique({ where: { id: userId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    if (!name || !email || !password) {
      return error('name, email, and password are required', 400)
    }

    // Check email uniqueness
    const emailExists = await db.user.findUnique({ where: { email } })
    if (emailExists) return error('Email already in use', 400)

    // Check cpf uniqueness if provided
    if (cpf) {
      const cpfExists = await db.user.findUnique({ where: { cpf } })
      if (cpfExists) return error('CPF already in use', 400)
    }

    // Generate unique referral code
    let referralCode = generateReferralCode(name)
    let codeExists = await db.user.findUnique({ where: { referralCode } })
    let attempts = 0
    while (codeExists && attempts < 10) {
      referralCode = generateReferralCode(name)
      codeExists = await db.user.findUnique({ where: { referralCode } })
      attempts++
    }
    if (codeExists) return error('Failed to generate unique referral code', 500)

    // Resolve referral relationship
    let referredById: string | null = null
    if (referredByCode) {
      const referrer = await db.user.findUnique({ where: { referralCode: referredByCode } })
      if (!referrer) return error('Referral code not found', 400)
      referredById = referrer.id
    }

    const hashedPassword = hashPassword(password)

    const newUser = await db.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        cpf: cpf || null,
        password: hashedPassword,
        plan: plan || 'free',
        role: role || 'user',
        referralCode,
        referredById,
        isActive: true,
      },
    })

    return success(sanitizeUser(newUser), 201)
  } catch (err) {
    return error('Failed to create user', 500)
  }
}
