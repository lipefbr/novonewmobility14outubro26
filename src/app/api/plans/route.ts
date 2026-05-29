import { success } from '@/lib/api-utils'

const PLANS = [
  {
    id: 'blue3',
    name: 'Blue 3',
    price: 9700, // R$ 97.00 in cents
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
  },
  {
    id: 'blue5',
    name: 'Blue 5',
    price: 14700, // R$ 147.00 in cents
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
  },
]

export async function GET() {
  return success({ plans: PLANS })
}
