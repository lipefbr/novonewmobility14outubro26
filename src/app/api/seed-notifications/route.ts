import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function POST(req: Request) {
  try {
    const users = await prisma.user.findMany({ take: 5 })

    const notificationTypes = ['cashback', 'referral', 'career', 'voucher', 'system', 'gratification', 'withdrawal']
    const titles = [
      'CashBack Recebido!', 'Novo Indicado', 'Progresso na Carreira',
      'Voucher Disponível', 'Atualização do Sistema', 'Gratificação Liberada',
      'Saque Processado',
    ]
    const messages = [
      'Você recebeu R$ 45,00 de CashBack Entrada.',
      'Um novo membro se cadastrou usando seu código!',
      'Faltam 5 pontos para o próximo rank!',
      'Seu voucher de R$ 100,00 está pronto.',
      'Nova versão disponível. Atualize o app!',
      'Gratificação semanal de R$ 25,00 creditada.',
      'Seu saque de R$ 200,00 foi processado com sucesso!',
    ]

    for (const user of users) {
      for (let i = 0; i < 7; i++) {
        const notifId = `notif_seed_${user.id}_${i}`
        const type = notificationTypes[i] === 'withdrawal' ? 'info' : notificationTypes[i] === 'cashback' ? 'success' : notificationTypes[i] === 'career' ? 'success' : 'info'
        const isRead = i > 3

        await prisma.notification.upsert({
          where: { id: notifId },
          update: {},
          create: { id: notifId, userId: user.id, title: titles[i], message: messages[i], type, isRead },
        }).catch(() => {})
      }
    }

    const announcements = [
      { id: 'ann_promo_high', title: 'CashBack em Dobro!', message: 'Todos os CashBacks de Entrada são dobrados este mês!', type: 'promo', priority: 'high', actionLabel: 'Saber mais', isActive: true },
      { id: 'ann_feature_normal', title: 'Autenticação 2FA', message: 'Ative 2FA na sua conta para mais segurança.', type: 'feature', priority: 'normal', actionLabel: 'Configurar', isActive: true },
      { id: 'ann_maintenance_high', title: 'Manutenção Programada', message: 'Dia 15/03 das 02h às 06h manutenção programada.', type: 'maintenance', priority: 'high', isActive: true },
      { id: 'ann_feature_normal2', title: 'Portal Gamer Atualizado', message: 'Novos jogos e torneios disponíveis no Portal Gamer!', type: 'feature', priority: 'normal', actionLabel: 'Ver novidades', isActive: true },
    ]

    for (const a of announcements) {
      await prisma.announcement.upsert({
        where: { id: a.id },
        update: {},
        create: a,
      }).catch(() => {})
    }

    const challenges = [
      { id: 'challenge_weekly_1', title: 'Indicar 1 Amigo', description: 'Faça sua primeira indicação', type: 'weekly', targetValue: 1, rewardPoints: 20, isActive: true },
      { id: 'challenge_weekly_3', title: '3 Indicações na Semana', description: 'Indique 3 amigos esta semana', type: 'weekly', targetValue: 3, rewardPoints: 50, isActive: true },
      { id: 'challenge_weekly_withdraw', title: 'Primeiro Saque', description: 'Solicite seu primeiro saque', type: 'weekly', targetValue: 1, rewardPoints: 30, isActive: true },
      { id: 'challenge_weekly_7days', title: 'Ativo por 7 Dias', description: 'Faça login por 7 dias seguidos', type: 'weekly', targetValue: 7, rewardPoints: 40, isActive: true },
      { id: 'challenge_monthly_10', title: '10 Indicações Mensais', description: 'Indique 10 amigos este mês', type: 'monthly', targetValue: 10, rewardPoints: 200, isActive: true },
    ]

    for (const c of challenges) {
      await prisma.challenge.upsert({
        where: { id: c.id },
        update: {},
        create: c,
      }).catch(() => {})
    }

    return success({ message: 'Notifications, announcements, and challenges seeded successfully' })
  } catch (err) {
    console.error('Seed notifications error:', err)
    return error('Failed to seed data', 500)
  }
}
