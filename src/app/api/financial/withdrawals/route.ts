import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const withdrawals = [
    {
      id: 'wd_001',
      amount: 200000,
      status: 'completed',
      requestedAt: '2025-01-13T10:30:00Z',
      processedAt: '2025-01-14T14:22:00Z',
      completedAt: '2025-01-16T09:00:00Z',
      estimatedCompletion: null,
      category: 'withdrawal',
      bankInfo: 'Banco do Brasil - Ag 1234-5 / CC 67890-1',
      fee: 350,
      notes: 'Saque processado normalmente.',
    },
    {
      id: 'wd_002',
      amount: 150000,
      status: 'completed',
      requestedAt: '2024-12-20T15:45:00Z',
      processedAt: '2024-12-21T08:30:00Z',
      completedAt: '2024-12-23T11:15:00Z',
      estimatedCompletion: null,
      category: 'withdrawal',
      bankInfo: 'Banco do Brasil - Ag 1234-5 / CC 67890-1',
      fee: 350,
      notes: 'Saque processado normalmente.',
    },
    {
      id: 'wd_003',
      amount: 500000,
      status: 'processing',
      requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      processedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      completedAt: null,
      estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'withdrawal',
      bankInfo: 'Banco do Brasil - Ag 1234-5 / CC 67890-1',
      fee: 850,
      notes: 'Saque em processamento bancário.',
    },
    {
      id: 'wd_004',
      amount: 100000,
      status: 'requested',
      requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      processedAt: null,
      completedAt: null,
      estimatedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'withdrawal',
      bankInfo: 'Banco do Brasil - Ag 1234-5 / CC 67890-1',
      fee: 350,
      notes: 'Aguardando processamento.',
    },
    {
      id: 'wd_005',
      amount: 75000,
      status: 'rejected',
      requestedAt: '2024-11-10T09:00:00Z',
      processedAt: '2024-11-10T16:45:00Z',
      completedAt: null,
      estimatedCompletion: null,
      category: 'withdrawal',
      bankInfo: 'Banco do Brasil - Ag 1234-5 / CC 67890-1',
      fee: 0,
      notes: 'Valor mínimo de saque não atingido (R$ 50,00).',
    },
  ]

  return NextResponse.json({ withdrawals })
}
