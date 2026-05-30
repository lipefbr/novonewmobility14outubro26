import { db } from '@/lib/db'
import { hashPassword, generateReferralCode, success, error, sanitizeUser } from '@/lib/api-utils'

function generateId(): string {
  // Generate a cuid-like ID
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  const random2 = Math.random().toString(36).substring(2, 10)
  return `c${timestamp}${random}${random2}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, cpf, password, referralCode, plan } = body

    if (!name || !email || !password) {
      return error('Name, email, and password are required')
    }

    // Check unique email
    const existingEmail = await db.findOne('User', '"email" = $1', [email])
    if (existingEmail) {
      return error('Email already registered', 409)
    }

    // Check unique CPF if provided
    if (cpf) {
      const existingCpf = await db.findOne('User', '"cpf" = $1', [cpf])
      if (existingCpf) {
        return error('CPF already registered', 409)
      }
    }

    // Find referrer if referral code provided
    let referrer = null
    if (referralCode) {
      referrer = await db.findOne('User', '"referralCode" = $1', [referralCode])
      if (!referrer) {
        return error('Invalid referral code', 404)
      }
    }

    const hashedPassword = hashPassword(password)
    let userReferralCode = generateReferralCode(name)

    // Ensure unique referral code
    let codeExists = await db.findOne('User', '"referralCode" = $1', [userReferralCode])
    while (codeExists) {
      userReferralCode = generateReferralCode(name)
      codeExists = await db.findOne('User', '"referralCode" = $1', [userReferralCode])
    }

    const userPlan = plan || 'free'
    const isActive = userPlan !== 'free'
    const userId = generateId()

    // Create user
    const user = await db.insert('User', {
      id: userId,
      name,
      email,
      username: email.split('@')[0],
      phone: phone || null,
      cpf: cpf || null,
      password: hashedPassword,
      referralCode: userReferralCode,
      referredById: referrer?.id || null,
      plan: userPlan,
      isActive,
    })

    // Create matrix positions for the user in the "entrada" matrix
    if (referrer) {
      // Find the referrer's entrada matrix position
      const referrerPosition = await db.findOne(
        'MatrixPosition',
        '"userId" = $1 AND "matrixType" = $2',
        [referrer.id, 'entrada']
      )

      if (referrerPosition) {
        // Find next available position under the referrer
        const existingPositions = await db.count(
          'MatrixPosition',
          '"parentId" = $1 AND "matrixType" = $2',
          [referrerPosition.id, 'entrada']
        )

        const newLevel = referrerPosition.level + 1
        const newPosition = existingPositions

        await db.insert('MatrixPosition', {
          id: generateId(),
          userId: user.id,
          matrixType: 'entrada',
          parentId: referrerPosition.id,
          level: newLevel,
          position: newPosition,
          isFilled: true,
        })

        // Update user entrada level
        await db.update('User', '"id" = $1', { entradaLevel: newLevel }, [user.id])
      }
    } else {
      // No referrer - top-level position
      await db.insert('MatrixPosition', {
        id: generateId(),
        userId: user.id,
        matrixType: 'entrada',
        level: 0,
        position: 0,
        isFilled: true,
      })
    }

    // Also create positions in residual and vendas matrices
    if (referrer) {
      const referrerResidual = await db.findOne(
        'MatrixPosition',
        '"userId" = $1 AND "matrixType" = $2',
        [referrer.id, 'residual']
      )

      if (referrerResidual) {
        const existingResidualPositions = await db.count(
          'MatrixPosition',
          '"parentId" = $1 AND "matrixType" = $2',
          [referrerResidual.id, 'residual']
        )

        const residualLevel = referrerResidual.level + 1

        await db.insert('MatrixPosition', {
          id: generateId(),
          userId: user.id,
          matrixType: 'residual',
          parentId: referrerResidual.id,
          level: residualLevel,
          position: existingResidualPositions,
          isFilled: true,
        })

        await db.update('User', '"id" = $1', { residualLevel }, [user.id])
      }

      const referrerVendas = await db.findOne(
        'MatrixPosition',
        '"userId" = $1 AND "matrixType" = $2',
        [referrer.id, 'vendas']
      )

      if (referrerVendas) {
        const existingVendasPositions = await db.count(
          'MatrixPosition',
          '"parentId" = $1 AND "matrixType" = $2',
          [referrerVendas.id, 'vendas']
        )

        const vendasLevel = referrerVendas.level + 1

        await db.insert('MatrixPosition', {
          id: generateId(),
          userId: user.id,
          matrixType: 'vendas',
          parentId: referrerVendas.id,
          level: vendasLevel,
          position: existingVendasPositions,
          isFilled: true,
        })

        await db.update('User', '"id" = $1', { vendasLevel }, [user.id])
      }
    } else {
      await db.insert('MatrixPosition', {
        id: generateId(),
        userId: user.id,
        matrixType: 'residual',
        level: 0,
        position: 0,
        isFilled: true,
      })
      await db.insert('MatrixPosition', {
        id: generateId(),
        userId: user.id,
        matrixType: 'vendas',
        level: 0,
        position: 0,
        isFilled: true,
      })
    }

    return success({ user: sanitizeUser(user) }, 201)
  } catch (err) {
    console.error('Registration error:', err)
    return error('Internal server error', 500)
  }
}
