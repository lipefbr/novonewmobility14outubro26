import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error, centsToReais } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    const type = url.searchParams.get('type') || 'earnings' // earnings, referrals, points
    const period = url.searchParams.get('period') || 'monthly' // monthly, quarterly, yearly

    if (!userId) {
      return error('userId é obrigatório')
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return error('Usuário não encontrado', 404)
    }

    // Get all users for ranking calculations
    const allUsers = await db.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        plan: true,
        profileImage: true,
        balanceWithdrawal: true,
        careerPoints: true,
        personalPoints: true,
        referrals: { select: { id: true } },
      },
      take: 500,
    })

    // Compute date range for period filtering
    const now = new Date()
    let periodStart: Date
    switch (period) {
      case 'quarterly':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case 'yearly':
        periodStart = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        break
      default: // monthly
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    }

    // Get transactions for the period for earnings-based ranking
    const transactions = await db.transaction.findMany({
      where: {
        userId: { in: allUsers.map(u => u.id) },
        type: { in: ['cashback_entry', 'cashback_residual', 'cashback_sales', 'gratification', 'bonus'] },
        status: 'paid',
        createdAt: { gte: periodStart },
      },
      select: { userId: true, amount: true },
    })

    // Calculate earnings per user
    const earningsMap = new Map<string, number>()
    for (const tx of transactions) {
      const current = earningsMap.get(tx.userId) || 0
      earningsMap.set(tx.userId, current + tx.amount)
    }

    // Build ranking based on type
    let rankedUsers: { id: string; name: string; plan: string; profileImage: string | null; value: number; valueDisplay: string }[]

    switch (type) {
      case 'referrals':
        rankedUsers = allUsers.map(u => ({
          id: u.id,
          name: u.name,
          plan: u.plan,
          profileImage: u.profileImage,
          value: u.referrals.length,
          valueDisplay: `${u.referrals.length}`,
        })).sort((a, b) => b.value - a.value)
        break

      case 'points':
        rankedUsers = allUsers.map(u => ({
          id: u.id,
          name: u.name,
          plan: u.plan,
          profileImage: u.profileImage,
          value: u.careerPoints + u.personalPoints,
          valueDisplay: `${u.careerPoints + u.personalPoints} pts`,
        })).sort((a, b) => b.value - a.value)
        break

      default: // earnings
        rankedUsers = allUsers.map(u => {
          const earnings = earningsMap.get(u.id) || 0
          return {
            id: u.id,
            name: u.name,
            plan: u.plan,
            profileImage: u.profileImage,
            value: earnings,
            valueDisplay: `R$ ${centsToReais(earnings).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          }
        }).sort((a, b) => b.value - a.value)
    }

    // Add rank positions
    const ranked = rankedUsers.map((u, i) => ({ ...u, rank: i + 1 }))

    // Get top 10
    const top10 = ranked.slice(0, 10)

    // Find current user's rank
    const userRank = ranked.find(u => u.id === userId)
    const userPosition = userRank ? userRank.rank : ranked.length + 1

    // User rank summary for all categories
    const userEarnings = earningsMap.get(userId) || 0
    const userReferrals = allUsers.find(u => u.id === userId)?.referrals.length || 0
    const userPoints = allUsers.find(u => u.id === userId)?.careerPoints || 0

    return success({
      type,
      period,
      top10,
      userRank: {
        position: userPosition,
        earnings: {
          position: rankedUsers.sort((a, b) => b.value - a.value).findIndex(u => u.id === userId) + 1,
          value: `R$ ${centsToReais(userEarnings).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        },
        referrals: {
          position: allUsers.map(u => ({ id: u.id, count: u.referrals.length })).sort((a, b) => b.count - a.count).findIndex(u => u.id === userId) + 1,
          value: `${userReferrals}`,
        },
        points: {
          position: allUsers.map(u => ({ id: u.id, pts: u.careerPoints + u.personalPoints })).sort((a, b) => b.pts - a.pts).findIndex(u => u.id === userId) + 1,
          value: `${userPoints} pts`,
        },
      },
      totalUsers: allUsers.length,
    })
  } catch (err: any) {
    return error(err.message || 'Erro ao buscar ranking', 500)
  }
}
