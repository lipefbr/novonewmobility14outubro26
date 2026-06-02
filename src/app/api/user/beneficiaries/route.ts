import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/user/beneficiaries?userId=xxx - List beneficiaries for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return error('userId is required')
    }

    // Ensure table exists
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS "Beneficiary" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "cpf" TEXT,
          "relationship" TEXT NOT NULL,
          "percentage" INTEGER NOT NULL,
          "age" INTEGER,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
        )
      `)
    } catch {
      // Table likely already exists
    }

    const beneficiaries = await db.find(
      'Beneficiary',
      '"userId" = $1',
      [userId],
      'ORDER BY "createdAt" ASC'
    )

    return success({ beneficiaries })
  } catch (err) {
    console.error('Beneficiaries GET error:', err)
    return error('Erro ao buscar beneficiários', 500)
  }
}

// POST /api/user/beneficiaries - Create a new beneficiary
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, cpf, relationship, percentage, age } = body

    if (!userId || !name || !relationship || percentage === undefined) {
      return error('userId, nome, relação e percentual são obrigatórios')
    }

    if (percentage < 1 || percentage > 100) {
      return error('Percentual deve ser entre 1 e 100')
    }

    // Check total percentage doesn't exceed 100
    const existing = await db.find('Beneficiary', '"userId" = $1', [userId])
    const currentTotal = (existing as any[]).reduce((sum: number, b: any) => sum + (b.percentage || 0), 0)

    if (currentTotal + percentage > 100) {
      return error(`Total de percentuais excederia 100%. Disponível: ${100 - currentTotal}%`)
    }

    const id = `ben_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    const beneficiary = await db.insert('Beneficiary', {
      id,
      userId,
      name,
      cpf: cpf || null,
      relationship,
      percentage,
      age: age || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return success({ beneficiary }, 201)
  } catch (err) {
    console.error('Beneficiary POST error:', err)
    return error('Erro ao criar beneficiário', 500)
  }
}

// PUT /api/user/beneficiaries - Update a beneficiary
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, name, cpf, relationship, percentage, age } = body

    if (!id || !userId) {
      return error('id e userId são obrigatórios')
    }

    // Verify ownership
    const existing = await db.findOne('Beneficiary', '"id" = $1 AND "userId" = $2', [id, userId])
    if (!existing) {
      return error('Beneficiário não encontrado', 404)
    }

    if (percentage !== undefined) {
      // Check total percentage doesn't exceed 100 (excluding current)
      const allBeneficiaries = await db.find('Beneficiary', '"userId" = $1', [userId])
      const otherTotal = (allBeneficiaries as any[])
        .filter((b: any) => b.id !== id)
        .reduce((sum: number, b: any) => sum + (b.percentage || 0), 0)

      if (otherTotal + percentage > 100) {
        return error(`Total de percentuais excederia 100%. Disponível: ${100 - otherTotal}%`)
      }
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    }
    if (name !== undefined) updateData.name = name
    if (cpf !== undefined) updateData.cpf = cpf || null
    if (relationship !== undefined) updateData.relationship = relationship
    if (percentage !== undefined) updateData.percentage = percentage
    if (age !== undefined) updateData.age = age || null

    const updated = await db.update(
      'Beneficiary',
      '"id" = $1 AND "userId" = $2',
      updateData,
      [id, userId]
    )

    return success({ beneficiary: updated })
  } catch (err) {
    console.error('Beneficiary PUT error:', err)
    return error('Erro ao atualizar beneficiário', 500)
  }
}

// DELETE /api/user/beneficiaries?id=xxx&userId=xxx - Delete a beneficiary
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return error('id e userId são obrigatórios')
    }

    // Verify ownership
    const existing = await db.findOne('Beneficiary', '"id" = $1 AND "userId" = $2', [id, userId])
    if (!existing) {
      return error('Beneficiário não encontrado', 404)
    }

    await db.deleteFrom('Beneficiary', '"id" = $1 AND "userId" = $2', [id, userId])

    return success({ message: 'Beneficiário removido com sucesso' })
  } catch (err) {
    console.error('Beneficiary DELETE error:', err)
    return error('Erro ao remover beneficiário', 500)
  }
}
