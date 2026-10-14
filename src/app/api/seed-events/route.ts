import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// POST — seed real events into the database (idempotent)
export async function POST() {
  try {
    const now = new Date()
    const day = 24 * 60 * 60 * 1000

    // Find an admin user to set as createdBy
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
    const adminId = admin?.id || null

    const seedEvents = [
      {
        title: 'Webinar: Como Maximizar seus Ganhos',
        description:
          'Aprenda estratégias avançadas para maximizar seus ganhos com CashBack e indicações na NewMobility. Participação dos nossos top líderes.',
        type: 'webinar',
        status: 'upcoming',
        eventDate: new Date(now.getTime() + 3 * day),
        endDate: new Date(now.getTime() + 3 * day + 2 * 60 * 60 * 1000),
        location: null,
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        maxAttendees: 100,
        imageUrl: null,
        isActive: true,
      },
      {
        title: 'Promoção: CashBack Dobrado no Shopping',
        description:
          'Durante uma semana, todos os CashBack de compras no Shopping serão dobrados! Aproveite essa oportunidade única.',
        type: 'promo',
        status: 'upcoming',
        eventDate: new Date(now.getTime() + 7 * day),
        endDate: new Date(now.getTime() + 14 * day),
        location: null,
        meetingUrl: null,
        maxAttendees: null,
        imageUrl: null,
        isActive: true,
      },
      {
        title: 'Lançamento: App Mobilidade v3.0',
        description:
          'Estamos lançando a nova versão do app com funcionalidades incríveis: rastreamento em tempo real, avaliação de motoristas e muito mais.',
        type: 'launch',
        status: 'upcoming',
        eventDate: new Date(now.getTime() + 14 * day),
        endDate: null,
        location: 'Online + Evento Presencial em SP',
        meetingUrl: null,
        maxAttendees: 500,
        imageUrl: null,
        isActive: true,
      },
      {
        title: 'Encontro Regional - Sudeste',
        description:
          'Encontro presencial de membros da região Sudeste. Networking, palestras e premiações especiais para os melhores colocados.',
        type: 'meetup',
        status: 'upcoming',
        eventDate: new Date(now.getTime() + 21 * day),
        endDate: new Date(now.getTime() + 21 * day + 8 * 60 * 60 * 1000),
        location: 'Hotel Pullman - São Paulo, SP',
        meetingUrl: null,
        maxAttendees: 200,
        imageUrl: null,
        isActive: true,
      },
      {
        title: 'Manutenção Programada do Sistema',
        description:
          'O sistema passará por manutenção programada para melhorias de performance e segurança. Algumas funcionalidades podem estar temporariamente indisponíveis.',
        type: 'maintenance',
        status: 'upcoming',
        eventDate: new Date(now.getTime() + 2 * day),
        endDate: new Date(now.getTime() + 2 * day + 4 * 60 * 60 * 1000),
        location: null,
        meetingUrl: null,
        maxAttendees: null,
        imageUrl: null,
        isActive: true,
      },
      {
        title: 'Webinar: Plano de Carreira 2025',
        description:
          'Descubra como alcançar o topo do plano de carreira NewMobility em 2025. Dicas práticas de líderes de sucesso.',
        type: 'webinar',
        status: 'ongoing',
        eventDate: new Date(now.getTime() - 30 * 60 * 1000),
        endDate: new Date(now.getTime() + 90 * 60 * 1000),
        location: null,
        meetingUrl: 'https://meet.google.com/xyz-abcd-efg',
        maxAttendees: 150,
        imageUrl: null,
        isActive: true,
      },
      {
        title: 'Convenção Anual NewMobility 2025',
        description:
          'Maior evento do ano! Premiações, palestras motivacionais, lançamentos exclusivos e muito networking. Vagas limitadas.',
        type: 'meetup',
        status: 'upcoming',
        eventDate: new Date(now.getTime() + 45 * day),
        endDate: new Date(now.getTime() + 46 * day),
        location: 'Centro de Convenções - Rio de Janeiro, RJ',
        meetingUrl: null,
        maxAttendees: 1000,
        imageUrl: null,
        isActive: true,
      },
      {
        title: 'Promoção: Indique e Ganhe o Dobro',
        description:
          'Por tempo limitado, todas as indicações que ativarem um plano renderão o dobro de bônus! Não perca essa chance de alavancar sua rede.',
        type: 'promo',
        status: 'upcoming',
        eventDate: new Date(now.getTime() + 5 * day),
        endDate: new Date(now.getTime() + 12 * day),
        location: null,
        meetingUrl: null,
        maxAttendees: null,
        imageUrl: null,
        isActive: true,
      },
    ]

    let created = 0
    let skipped = 0

    for (const evt of seedEvents) {
      // Check by title to avoid duplicates
      const existing = await prisma.event.findFirst({ where: { title: evt.title } })
      if (existing) {
        skipped++
        continue
      }
      await prisma.event.create({
        data: {
          ...evt,
          createdBy: adminId,
        },
      })
      created++
    }

    return success({
      message: `Seed concluído: ${created} eventos criados, ${skipped} já existiam.`,
      created,
      skipped,
      total: created + skipped,
    })
  } catch (err: any) {
    console.error('Seed events error:', err)
    return error(err.message || 'Erro ao popular eventos', 500)
  }
}
