import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'

// GET /api/admin/reports/export
// Generates an .xlsx workbook with multiple sheets covering all platform-wide
// admin reports required by client spec (Índice.docx §19):
//   Sheet 1: Usuários     — all users with qualification, plan, balances, status
//   Sheet 2: Matrizes     — matrix distribution by type and level
//   Sheet 3: Transações   — all transactions
//   Sheet 4: Saques       — withdrawal requests with status
//   Sheet 5: Cashbacks    — cashback entries by matrix type
//   Sheet 6: Resumo       — summary counts (counts, plans, earnings per block)
//
// Returns the xlsx file as a downloadable attachment.
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    })
    if (!requester || requester.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // ----- Fetch all data in parallel -----
    const [
      users,
      matrixPositions,
      transactions,
      cashbackEntries,
      cashbackResiduals,
      cashbackSales,
    ] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          cpf: true,
          username: true,
          role: true,
          qualification: true,
          plan: true,
          isActive: true,
          balanceWithdrawal: true,
          balanceMobility: true,
          balanceShopping: true,
          balanceFood: true,
          balancePharmacy: true,
          balanceGratification: true,
          balancePaymentInvoice: true,
          careerPoints: true,
          referralCode: true,
          referredById: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.matrixPosition.findMany({
        select: {
          id: true,
          userId: true,
          matrixType: true,
          parentId: true,
          level: true,
          position: true,
          isFilled: true,
          createdAt: true,
        },
      }),
      prisma.transaction.findMany({
        select: {
          id: true,
          userId: true,
          type: true,
          amount: true,
          status: true,
          category: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cashbackEntry.findMany({
        select: {
          id: true,
          userId: true,
          fromUserId: true,
          amount: true,
          level: true,
          percentage: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cashbackResidual.findMany({
        select: {
          id: true,
          userId: true,
          fromUserId: true,
          amount: true,
          level: true,
          percentage: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cashbackSales.findMany({
        select: {
          id: true,
          userId: true,
          fromUserId: true,
          amount: true,
          level: true,
          percentage: true,
          category: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // ----- Build sheet data -----

    // Sheet 1: Usuários — all users
    const usersSheet = users.map((u) => ({
      ID: u.id,
      Nome: u.name,
      Email: u.email,
      Telefone: u.phone || '',
      CPF: u.cpf || '',
      Username: u.username || '',
      Role: u.role,
      Qualificação: u.qualification || 'passageiro',
      Plano: u.plan,
      Ativo: u.isActive ? 'Sim' : 'Não',
      'Saldo Saque (cents)': u.balanceWithdrawal,
      'Saldo Mobilidade (cents)': u.balanceMobility,
      'Saldo Compras (cents)': u.balanceShopping,
      'Saldo Refeição (cents)': u.balanceFood,
      'Saldo Farmácia (cents)': u.balancePharmacy,
      'Saldo Gratificação (cents)': u.balanceGratification,
      'Saldo Pagamento Fatura (cents)': u.balancePaymentInvoice,
      'Pontos Carreira': u.careerPoints,
      'Código Indicação': u.referralCode,
      'Indicado Por (ID)': u.referredById || '',
      'Criado Em': u.createdAt.toISOString(),
      'Atualizado Em': u.updatedAt.toISOString(),
    }))

    // Sheet 2: Matrizes — distribution by type+level
    const matrixDist: Record<string, Record<number, number>> = {
      entrada: {},
      residual: {},
      vendas: {},
    }
    for (const mp of matrixPositions) {
      const kind = mp.matrixType
      if (!matrixDist[kind]) continue
      matrixDist[kind][mp.level] = (matrixDist[kind][mp.level] || 0) + 1
    }
    const matrixSheet: Record<string, string | number>[] = []
    for (const kind of ['entrada', 'residual', 'vendas']) {
      const levels = matrixDist[kind]
      const total = Object.values(levels).reduce((a, b) => a + b, 0)
      matrixSheet.push({
        'Tipo Matriz': kind,
        Nível: 'TOTAL',
        Usuários: total,
      })
      const sortedLevels = Object.keys(levels)
        .map((l) => parseInt(l))
        .sort((a, b) => a - b)
      for (const lvl of sortedLevels) {
        matrixSheet.push({
          'Tipo Matriz': kind,
          Nível: `Nível ${lvl}`,
          Usuários: levels[lvl],
        })
      }
    }

    // Sheet 3: Transações — all transactions
    const transactionsSheet = transactions.map((t) => ({
      ID: t.id,
      'User ID': t.userId,
      Tipo: t.type,
      'Valor (cents)': t.amount,
      Status: t.status,
      Categoria: t.category || '',
      Descrição: t.description || '',
      'Criado Em': t.createdAt.toISOString(),
      'Atualizado Em': t.updatedAt.toISOString(),
    }))

    // Sheet 4: Saques — withdrawal requests
    const withdrawals = transactions.filter((t) => t.type === 'withdrawal')
    const userMap = new Map(users.map((u) => [u.id, u]))
    const withdrawalsSheet = withdrawals.map((w) => {
      const u = userMap.get(w.userId)
      return {
        ID: w.id,
        'User ID': w.userId,
        Nome: u?.name || '',
        Email: u?.email || '',
        'Valor (cents)': w.amount,
        Status: w.status,
        Descrição: w.description || '',
        'Criado Em': w.createdAt.toISOString(),
      }
    })

    // Sheet 5: Cashbacks — entries by matrix type
    const cashbackSheet: Record<string, string | number>[] = []
    for (const c of cashbackEntries) {
      cashbackSheet.push({
        'Tipo Matriz': 'entrada',
        ID: c.id,
        'User ID': c.userId,
        'From User ID': c.fromUserId,
        'Valor (cents)': c.amount,
        Nível: c.level,
        Percentual: c.percentage,
        Descrição: c.description || '',
        'Criado Em': c.createdAt.toISOString(),
      })
    }
    for (const c of cashbackResiduals) {
      cashbackSheet.push({
        'Tipo Matriz': 'residual',
        ID: c.id,
        'User ID': c.userId,
        'From User ID': c.fromUserId,
        'Valor (cents)': c.amount,
        Nível: c.level,
        Percentual: c.percentage,
        Descrição: c.description || '',
        'Criado Em': c.createdAt.toISOString(),
      })
    }
    for (const c of cashbackSales) {
      cashbackSheet.push({
        'Tipo Matriz': 'vendas',
        ID: c.id,
        'User ID': c.userId,
        'From User ID': c.fromUserId,
        'Valor (cents)': c.amount,
        Nível: c.level,
        Percentual: c.percentage,
        Descrição: c.description || '',
        'Criado Em': c.createdAt.toISOString(),
      })
    }

    // Sheet 6: Resumo — summary counts and totals
    const counts: Record<string, number> = {
      motorista: 0,
      passageiro: 0,
      passageiro_60: 0,
      passageiro_pcd: 0,
      comercio: 0,
      entregador: 0,
    }
    const planCounts: Record<string, number> = {
      free: 0,
      blue3: 0,
      blue5: 0,
      premium5: 0,
    }
    let activeUsers = 0
    let inactiveUsers = 0
    for (const u of users) {
      const q = (u.qualification || 'passageiro') as string
      if (counts[q] !== undefined) counts[q]++
      else counts['passageiro']++
      const p = (u.plan || 'free') as string
      if (planCounts[p] !== undefined) planCounts[p]++
      else planCounts['free']++
      if (u.isActive) activeUsers++
      else inactiveUsers++
    }

    const earningsByBlock: Record<string, number> = {
      mobility: 0,
      shopping: 0,
      food: 0,
      pharmacy: 0,
      gratification: 0,
      withdrawal: 0,
      paymentInvoice: 0,
    }
    for (const t of transactions) {
      const cat = (t.category || '') as string
      if (earningsByBlock[cat] !== undefined) {
        earningsByBlock[cat] += t.amount || 0
      }
    }

    const withdrawalsList = transactions.filter((t) => t.type === 'withdrawal')
    const pendingWithdrawals = withdrawalsList.filter(
      (w) => w.status === 'pending'
    ).length
    const approvedWithdrawals = withdrawalsList.filter(
      (w) => w.status === 'approved' || w.status === 'paid'
    ).length
    const rejectedWithdrawals = withdrawalsList.filter(
      (w) => w.status === 'rejected'
    ).length
    const totalWithdrawn = withdrawalsList
      .filter((w) => w.status === 'paid' || w.status === 'approved')
      .reduce((sum, w) => sum + Math.abs(w.amount || 0), 0)

    const totalCashbackEntrada = cashbackEntries.reduce(
      (s, c) => s + (c.amount || 0),
      0
    )
    const totalCashbackResidual = cashbackResiduals.reduce(
      (s, c) => s + (c.amount || 0),
      0
    )
    const totalCashbackVendas = cashbackSales.reduce(
      (s, c) => s + (c.amount || 0),
      0
    )

    const summarySheet: Record<string, string | number>[] = [
      { Métrica: 'Total de Usuários', Valor: users.length },
      { Métrica: 'Usuários Ativos', Valor: activeUsers },
      { Métrica: 'Usuários Inativos', Valor: inactiveUsers },
      { Métrica: '— Motoristas', Valor: counts['motorista'] },
      { Métrica: '— Passageiros', Valor: counts['passageiro'] },
      { Métrica: '— Passageiros 60+', Valor: counts['passageiro_60'] },
      { Métrica: '— Passageiros PCD', Valor: counts['passageiro_pcd'] },
      { Métrica: '— Comércios', Valor: counts['comercio'] },
      { Métrica: '— Entregadores', Valor: counts['entregador'] },
      { Métrica: 'Plano Free', Valor: planCounts['free'] },
      { Métrica: 'Plano Blue 3', Valor: planCounts['blue3'] },
      { Métrica: 'Plano Blue 5', Valor: planCounts['blue5'] },
      { Métrica: 'Plano Premium 5', Valor: planCounts['premium5'] },
      {
        Métrica: 'Posições Matriz Entrada (total)',
        Valor: matrixDist['entrada']
          ? Object.values(matrixDist['entrada']).reduce((a, b) => a + b, 0)
          : 0,
      },
      {
        Métrica: 'Posições Matriz Residual (total)',
        Valor: matrixDist['residual']
          ? Object.values(matrixDist['residual']).reduce((a, b) => a + b, 0)
          : 0,
      },
      {
        Métrica: 'Posições Matriz Vendas (total)',
        Valor: matrixDist['vendas']
          ? Object.values(matrixDist['vendas']).reduce((a, b) => a + b, 0)
          : 0,
      },
      {
        Métrica: 'Ganhos Mobilidade (cents)',
        Valor: earningsByBlock['mobility'],
      },
      {
        Métrica: 'Ganhos Compras (cents)',
        Valor: earningsByBlock['shopping'],
      },
      {
        Métrica: 'Ganhos Refeição (cents)',
        Valor: earningsByBlock['food'],
      },
      {
        Métrica: 'Ganhos Farmácia (cents)',
        Valor: earningsByBlock['pharmacy'],
      },
      {
        Métrica: 'Ganhos Gratificação (cents)',
        Valor: earningsByBlock['gratification'],
      },
      {
        Métrica: 'Cashback Entrada (cents)',
        Valor: totalCashbackEntrada,
      },
      {
        Métrica: 'Cashback Residual (cents)',
        Valor: totalCashbackResidual,
      },
      {
        Métrica: 'Cashback Vendas (cents)',
        Valor: totalCashbackVendas,
      },
      {
        Métrica: 'Saques Pendentes',
        Valor: pendingWithdrawals,
      },
      {
        Métrica: 'Saques Aprovados',
        Valor: approvedWithdrawals,
      },
      {
        Métrica: 'Saques Rejeitados',
        Valor: rejectedWithdrawals,
      },
      {
        Métrica: 'Total Sacado (cents)',
        Valor: totalWithdrawn,
      },
      {
        Métrica: 'Total de Transações',
        Valor: transactions.length,
      },
      {
        Métrica: 'Gerado Em',
        Valor: new Date().toISOString(),
      },
    ]

    // ----- Build workbook -----
    const wb = XLSX.utils.book_new()

    const ws1 = XLSX.utils.json_to_sheet(
      usersSheet.length ? usersSheet : [{ Aviso: 'Nenhum usuário cadastrado' }]
    )
    XLSX.utils.book_append_sheet(wb, ws1, 'Usuários')

    const ws2 = XLSX.utils.json_to_sheet(
      matrixSheet.length ? matrixSheet : [{ Aviso: 'Nenhuma posição em matriz' }]
    )
    XLSX.utils.book_append_sheet(wb, ws2, 'Matrizes')

    const ws3 = XLSX.utils.json_to_sheet(
      transactionsSheet.length
        ? transactionsSheet
        : [{ Aviso: 'Nenhuma transação registrada' }]
    )
    XLSX.utils.book_append_sheet(wb, ws3, 'Transações')

    const ws4 = XLSX.utils.json_to_sheet(
      withdrawalsSheet.length
        ? withdrawalsSheet
        : [{ Aviso: 'Nenhum saque solicitado' }]
    )
    XLSX.utils.book_append_sheet(wb, ws4, 'Saques')

    const ws5 = XLSX.utils.json_to_sheet(
      cashbackSheet.length
        ? cashbackSheet
        : [{ Aviso: 'Nenhum cashback registrado' }]
    )
    XLSX.utils.book_append_sheet(wb, ws5, 'Cashbacks')

    const ws6 = XLSX.utils.json_to_sheet(summarySheet)
    XLSX.utils.book_append_sheet(wb, ws6, 'Resumo')

    // ----- Serialize to xlsx (Node Buffer) -----
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
    const bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
    const blob = new Blob([bytes as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const filename = `newmobility-relatorio-${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(bytes.byteLength),
      },
    })
  } catch (err) {
    console.error('[Admin Reports Export] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to generate Excel export' },
      { status: 500 }
    )
  }
}
