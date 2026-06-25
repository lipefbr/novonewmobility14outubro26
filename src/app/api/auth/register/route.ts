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
    const {
      name,
      email,
      phone,
      cpf,
      password,
      referralCode,
      plan,
      // New personal data fields
      qualification,
      sponsorId,
      birthDate,
      rg,
      maritalStatus,
      gender,
      education,
      zipCode,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
    } = body

    // --- Validation ---
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return error('Nome é obrigatório e deve ter pelo menos 2 caracteres')
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return error('Email válido é obrigatório')
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return error('Senha é obrigatória e deve ter pelo menos 6 caracteres')
    }

    // Qualification is REQUIRED at registration
    const validQualifications = [
      'motorista',
      'passageiro',
      'passageiro_60',
      'passageiro_pcd',
      'comercio',
      'entregador',
    ]
    if (!qualification || typeof qualification !== 'string' || !validQualifications.includes(qualification)) {
      return error('Qualificação é obrigatória e deve ser uma das opções válidas')
    }

    // Check unique email
    console.log('[Register] Checking email uniqueness:', email)
    let existingEmail: any
    try {
      existingEmail = await db.findOne('User', '"email" = $1', [email])
    } catch (dbErr) {
      console.error('[Register] Error checking email uniqueness:', dbErr)
      return error('Erro ao verificar email. Tente novamente.', 500)
    }
    if (existingEmail) {
      return error('Email já cadastrado', 409)
    }

    // Check unique CPF if provided
    if (cpf) {
      // Strip mask: keep only digits for consistent comparison
      const cpfDigits = String(cpf).replace(/\D/g, '')
      const cpfFormatted = cpfDigits.length === 11
        ? `${cpfDigits.slice(0,3)}.${cpfDigits.slice(3,6)}.${cpfDigits.slice(6,9)}-${cpfDigits.slice(9)}`
        : cpf
      console.log('[Register] Checking CPF uniqueness:', cpfFormatted)
      try {
        // Try both formatted and digits-only lookup for robustness
        const existingCpfFormatted = await db.findOne('User', '"cpf" = $1', [cpfFormatted])
        const existingCpfDigits = cpfDigits !== cpfFormatted
          ? await db.findOne('User', '"cpf" = $1', [cpfDigits])
          : null
        if (existingCpfFormatted || existingCpfDigits) {
          return error('CPF já cadastrado', 409)
        }
        // Use formatted CPF for storage
        body.cpf = cpfFormatted
      } catch (dbErr) {
        console.error('[Register] Error checking CPF uniqueness:', dbErr)
        // Don't block registration if CPF check fails - proceed with caution
        console.warn('[Register] Proceeding without CPF uniqueness verification')
      }
    }

    // Find referrer if referral code provided
    // Referral code is OPTIONAL - if invalid, proceed without referrer (warning only)
    let referrer = null
    let referralWarning = null
    if (referralCode) {
      console.log('[Register] Looking up referrer with code:', referralCode)
      try {
        referrer = await db.findOne('User', '"referralCode" = $1', [referralCode])
        if (!referrer) {
          // Don't block registration - just proceed without referrer
          console.warn('[Register] Referral code not found, proceeding without referrer:', referralCode)
          referralWarning = 'Código de indicação não encontrado. Cadastro realizado sem indicador.'
        }
      } catch (dbErr) {
        console.error('[Register] Error looking up referrer:', dbErr)
        // Don't block registration - proceed without referrer
        referralWarning = 'Não foi possível verificar o código de indicação. Cadastro realizado sem indicador.'
      }
    }

    const hashedPassword = hashPassword(password)
    let userReferralCode = generateReferralCode(name)

    // Ensure unique referral code
    try {
      let codeExists = await db.findOne('User', '"referralCode" = $1', [userReferralCode])
      while (codeExists) {
        userReferralCode = generateReferralCode(name)
        codeExists = await db.findOne('User', '"referralCode" = $1', [userReferralCode])
      }
    } catch (dbErr) {
      console.error('[Register] Error ensuring unique referral code:', dbErr)
      // Non-critical, proceed with the current code
    }

    const userPlan = plan || 'free'
    const isActive = userPlan !== 'free'
    const userId = generateId()

    // --- Create user (CRITICAL) ---
    console.log('[Register] Creating user:', email)
    let user: any
    try {
      const now = new Date().toISOString()

      // Build optional personal data fields - only include if provided and non-empty
      const personalData: Record<string, any> = {}
      if (sponsorId && typeof sponsorId === 'string') personalData.sponsorId = sponsorId
      if (birthDate && typeof birthDate === 'string') {
        const parsed = new Date(birthDate)
        if (!isNaN(parsed.getTime())) {
          personalData.birthDate = parsed
        }
      }
      if (rg && typeof rg === 'string') personalData.rg = rg
      if (maritalStatus && typeof maritalStatus === 'string') personalData.maritalStatus = maritalStatus
      if (gender && typeof gender === 'string') personalData.gender = gender
      if (education && typeof education === 'string') personalData.education = education
      if (zipCode && typeof zipCode === 'string') personalData.zipCode = zipCode
      if (emergencyName && typeof emergencyName === 'string') personalData.emergencyName = emergencyName
      if (emergencyPhone && typeof emergencyPhone === 'string') personalData.emergencyPhone = emergencyPhone
      if (emergencyRelation && typeof emergencyRelation === 'string') personalData.emergencyRelation = emergencyRelation

      user = await db.insert('User', {
        id: userId,
        name,
        email,
        username: email.split('@')[0],
        phone: phone || null,
        cpf: body.cpf || cpf || null,
        password: hashedPassword,
        referralCode: userReferralCode,
        referredById: referrer?.id || null,
        plan: userPlan,
        isActive,
        qualification,
        ...personalData,
        createdAt: now,
        updatedAt: now,
      })
      console.log('[Register] User created successfully:', userId)
      console.log('[Register] Saved qualification:', qualification)
    } catch (dbErr) {
      console.error('[Register] CRITICAL: Error creating user:', dbErr)
      return error('Erro ao criar conta. Tente novamente.', 500)
    }

    // --- Create matrix positions (OPTIONAL - failures should NOT block registration) ---

    // Entrada matrix
    try {
      if (referrer) {
        console.log('[Register] Creating entrada matrix position for user:', userId)
        const referrerPosition = await db.findOne(
          'MatrixPosition',
          '"userId" = $1 AND "matrixType" = $2',
          [referrer.id, 'entrada']
        )

        if (referrerPosition) {
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
            createdAt: new Date().toISOString(),
          })

          // Update user entrada level (optional - don't fail if column doesn't exist)
          try {
            await db.update('User', '"id" = $1', { entradaLevel: newLevel }, [user.id])
          } catch (updateErr) {
            console.warn('[Register] Warning: Could not update entradaLevel:', updateErr)
          }
        } else {
          console.warn('[Register] Referrer has no entrada matrix position, creating top-level position')
          await db.insert('MatrixPosition', {
            id: generateId(),
            userId: user.id,
            matrixType: 'entrada',
            level: 0,
            position: 0,
            isFilled: true,
            createdAt: new Date().toISOString(),
          })
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
          createdAt: new Date().toISOString(),
        })
      }
      console.log('[Register] Entrada matrix position created')
    } catch (matrixErr) {
      console.error('[Register] NON-CRITICAL: Error creating entrada matrix position:', matrixErr)
      // Continue - matrix position is optional
    }

    // Residual matrix
    try {
      if (referrer) {
        console.log('[Register] Creating residual matrix position for user:', userId)
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
            createdAt: new Date().toISOString(),
          })

          try {
            await db.update('User', '"id" = $1', { residualLevel }, [user.id])
          } catch (updateErr) {
            console.warn('[Register] Warning: Could not update residualLevel:', updateErr)
          }
        } else {
          console.warn('[Register] Referrer has no residual matrix position, creating top-level position')
          await db.insert('MatrixPosition', {
            id: generateId(),
            userId: user.id,
            matrixType: 'residual',
            level: 0,
            position: 0,
            isFilled: true,
            createdAt: new Date().toISOString(),
          })
        }
      } else {
        await db.insert('MatrixPosition', {
          id: generateId(),
          userId: user.id,
          matrixType: 'residual',
          level: 0,
          position: 0,
          isFilled: true,
          createdAt: new Date().toISOString(),
        })
      }
      console.log('[Register] Residual matrix position created')
    } catch (matrixErr) {
      console.error('[Register] NON-CRITICAL: Error creating residual matrix position:', matrixErr)
      // Continue - matrix position is optional
    }

    // Vendas matrix
    try {
      if (referrer) {
        console.log('[Register] Creating vendas matrix position for user:', userId)
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
            createdAt: new Date().toISOString(),
          })

          try {
            await db.update('User', '"id" = $1', { vendasLevel }, [user.id])
          } catch (updateErr) {
            console.warn('[Register] Warning: Could not update vendasLevel:', updateErr)
          }
        } else {
          console.warn('[Register] Referrer has no vendas matrix position, creating top-level position')
          await db.insert('MatrixPosition', {
            id: generateId(),
            userId: user.id,
            matrixType: 'vendas',
            level: 0,
            position: 0,
            isFilled: true,
            createdAt: new Date().toISOString(),
          })
        }
      } else {
        await db.insert('MatrixPosition', {
          id: generateId(),
          userId: user.id,
          matrixType: 'vendas',
          level: 0,
          position: 0,
          isFilled: true,
          createdAt: new Date().toISOString(),
        })
      }
      console.log('[Register] Vendas matrix position created')
    } catch (matrixErr) {
      console.error('[Register] NON-CRITICAL: Error creating vendas matrix position:', matrixErr)
      // Continue - matrix position is optional
    }

    // --- Return success with user data ---
    let safeUser: any
    try {
      safeUser = sanitizeUser(user)
    } catch (sanitizeErr) {
      console.warn('[Register] Warning: sanitizeUser failed, constructing manually:', sanitizeErr)
      // Fallback: manually construct safe user without password
      const { password: _pwd, ...rest } = user as any
      safeUser = rest
    }

    const responseData: any = { user: safeUser }
    if (referralWarning) {
      responseData.warning = referralWarning
    }

    return success(responseData, 201)
  } catch (err) {
    console.error('[Register] Unhandled registration error:', err)
    return error('Erro interno do servidor. Tente novamente.', 500)
  }
}
