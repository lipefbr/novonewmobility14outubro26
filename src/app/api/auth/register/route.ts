import { db } from '@/lib/db'
import { hashPassword, generateReferralCode, success, error, sanitizeUser } from '@/lib/api-utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, cpf, password, referralCode, plan } = body

    if (!name || !email || !password) {
      return error('Name, email, and password are required')
    }

    // Check unique email
    const existingEmail = await db.user.findUnique({ where: { email } })
    if (existingEmail) {
      return error('Email already registered', 409)
    }

    // Check unique CPF if provided
    if (cpf) {
      const existingCpf = await db.user.findUnique({ where: { cpf } })
      if (existingCpf) {
        return error('CPF already registered', 409)
      }
    }

    // Find referrer if referral code provided
    let referrer = null
    if (referralCode) {
      referrer = await db.user.findUnique({ where: { referralCode } })
      if (!referrer) {
        return error('Invalid referral code', 404)
      }
    }

    const hashedPassword = hashPassword(password)
    let userReferralCode = generateReferralCode(name)

    // Ensure unique referral code
    let codeExists = await db.user.findUnique({ where: { referralCode: userReferralCode } })
    while (codeExists) {
      userReferralCode = generateReferralCode(name)
      codeExists = await db.user.findUnique({ where: { referralCode: userReferralCode } })
    }

    const userPlan = plan || 'free'
    const isActive = userPlan !== 'free'

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        username: email.split('@')[0], // Auto-generate username from email
        phone: phone || null,
        cpf: cpf || null,
        password: hashedPassword,
        referralCode: userReferralCode,
        referredById: referrer?.id || null,
        plan: userPlan,
        isActive,
      },
    })

    // Create matrix positions for the user in the "entrada" matrix
    if (referrer) {
      // Find the referrer's entrada matrix position
      const referrerPosition = await db.matrixPosition.findFirst({
        where: { userId: referrer.id, matrixType: 'entrada' },
      })

      if (referrerPosition) {
        // Find next available position under the referrer
        const existingPositions = await db.matrixPosition.count({
          where: { parentId: referrerPosition.id, matrixType: 'entrada' },
        })

        const newLevel = referrerPosition.level + 1
        const newPosition = existingPositions

        await db.matrixPosition.create({
          data: {
            userId: user.id,
            matrixType: 'entrada',
            parentId: referrerPosition.id,
            level: newLevel,
            position: newPosition,
          },
        })

        // Update user entrada level
        await db.user.update({
          where: { id: user.id },
          data: { entradaLevel: newLevel },
        })
      }
    } else {
      // No referrer - top-level position
      await db.matrixPosition.create({
        data: {
          userId: user.id,
          matrixType: 'entrada',
          level: 0,
          position: 0,
        },
      })
    }

    // Also create positions in residual and vendas matrices
    if (referrer) {
      const referrerResidual = await db.matrixPosition.findFirst({
        where: { userId: referrer.id, matrixType: 'residual' },
      })

      if (referrerResidual) {
        const existingResidualPositions = await db.matrixPosition.count({
          where: { parentId: referrerResidual.id, matrixType: 'residual' },
        })

        await db.matrixPosition.create({
          data: {
            userId: user.id,
            matrixType: 'residual',
            parentId: referrerResidual.id,
            level: referrerResidual.level + 1,
            position: existingResidualPositions,
          },
        })

        await db.user.update({
          where: { id: user.id },
          data: { residualLevel: referrerResidual.level + 1 },
        })
      }

      const referrerVendas = await db.matrixPosition.findFirst({
        where: { userId: referrer.id, matrixType: 'vendas' },
      })

      if (referrerVendas) {
        const existingVendasPositions = await db.matrixPosition.count({
          where: { parentId: referrerVendas.id, matrixType: 'vendas' },
        })

        await db.matrixPosition.create({
          data: {
            userId: user.id,
            matrixType: 'vendas',
            parentId: referrerVendas.id,
            level: referrerVendas.level + 1,
            position: existingVendasPositions,
          },
        })

        await db.user.update({
          where: { id: user.id },
          data: { vendasLevel: referrerVendas.level + 1 },
        })
      }
    } else {
      await db.matrixPosition.create({
        data: { userId: user.id, matrixType: 'residual', level: 0, position: 0 },
      })
      await db.matrixPosition.create({
        data: { userId: user.id, matrixType: 'vendas', level: 0, position: 0 },
      })
    }

    return success({ user: sanitizeUser(user as unknown as Record<string, unknown>) }, 201)
  } catch (err) {
    console.error('Registration error:', err)
    return error('Internal server error', 500)
  }
}
