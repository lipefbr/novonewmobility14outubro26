import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// GET all plans (admin view)
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    // Try to get custom plans from database
    let customPlans: any[] = []
    try {
      customPlans = await db.find('Plan', '', [], 'ORDER BY "price" ASC')
    } catch {
      // Table might not exist yet, return defaults
    }

    // If no custom plans, return default plans
    if (!customPlans || customPlans.length === 0) {
      const defaultPlans = [
        {
          id: 'free',
          name: 'Gratuito',
          price: 0,
          features: ['Cadastro gratuito', 'Indicação de usuários'],
          matrixEntrada: '-',
          matrixResidual: '-',
          matrixVendas: '-',
          isActive: true,
        },
        {
          id: 'blue3',
          name: 'Blue 3',
          price: 9700,
          features: [
            'Cashback Entrada (matriz 4x5)',
            'Cashback Residual (matriz 4x7)',
            'Cashback Vendas (matriz 4x9)',
            'App Mobilidade',
            'App Refeição',
            'App Farmácia',
            'App Compras',
            'Gratificações disponíveis',
            'Plano de Carreira',
          ],
          matrixEntrada: '4x5',
          matrixResidual: '4x7',
          matrixVendas: '4x9',
          isActive: true,
        },
        {
          id: 'blue5',
          name: 'Blue 5',
          price: 14700,
          features: [
            'Tudo do plano Blue 3',
            'Gratificações exclusivas',
            'Prioridade no suporte',
            'Bônus de adesão aumentado',
            'App Pet',
            'Seguro telefone',
            'Telemedicina',
            'Assistência funerária',
          ],
          matrixEntrada: '4x5',
          matrixResidual: '4x7',
          matrixVendas: '4x9',
          isActive: true,
        },
      ]
      return success({ plans: defaultPlans })
    }

    return success({ plans: customPlans })
  } catch (err) {
    console.error('Get plans error:', err)
    return error('Failed to fetch plans', 500)
  }
}

// POST create a new plan
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, name, price, features, matrixEntrada, matrixResidual, matrixVendas } = body

    if (!userId) return error('userId is required', 400)

    const user = await db.findOne('User', '"id" = $1', [userId])
    if (!user || user.role !== 'admin') return error('Unauthorized', 403)

    if (!name || price === undefined) return error('name and price are required', 400)

    // Generate a plan ID from name
    const planId = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

    // Try to insert into Plan table
    let newPlan
    try {
      newPlan = await db.insert('Plan', {
        id: planId,
        name,
        price: Number(price),
        features: JSON.stringify(features || []),
        matrixEntrada: matrixEntrada || '-',
        matrixResidual: matrixResidual || '-',
        matrixVendas: matrixVendas || '-',
        isActive: true,
      })
    } catch {
      // If Plan table doesn't exist, return the plan data anyway
      newPlan = {
        id: planId,
        name,
        price: Number(price),
        features: features || [],
        matrixEntrada: matrixEntrada || '-',
        matrixResidual: matrixResidual || '-',
        matrixVendas: matrixVendas || '-',
        isActive: true,
      }
    }

    return success(newPlan)
  } catch (err) {
    console.error('Create plan error:', err)
    return error('Failed to create plan', 500)
  }
}
