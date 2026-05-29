import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    const status = url.searchParams.get('status') || 'upcoming'
    const limit = parseInt(url.searchParams.get('limit') || '20')

    // Try to get real events from database, fall back to mock data
    let events = await db.event.findMany({
      where: {
        isActive: true,
        ...(status !== 'all' ? { status } : {}),
      },
      include: {
        registrations: userId ? { where: { userId } } : true,
      },
      orderBy: { eventDate: 'asc' },
      take: limit,
    })

    // If no events in DB, return mock data
    if (events.length === 0) {
      const now = new Date()
      events = [
        {
          id: 'evt_01',
          title: 'Webinar: Como Maximizar seus Ganhos',
          description: 'Aprenda estratégias avançadas para maximizar seus ganhos com CashBack e indicações na NewMobility.',
          type: 'webinar',
          status: 'upcoming',
          eventDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
          location: null,
          meetingUrl: 'https://meet.google.com/abc-defg-hij',
          maxAttendees: 100,
          imageUrl: null,
          isActive: true,
          createdBy: null,
          createdAt: now,
          updatedAt: now,
          registrations: userId ? await db.eventRegistration.findMany({ where: { eventId: 'evt_01', userId } }) : [],
          _count: { registrations: 45 },
        },
        {
          id: 'evt_02',
          title: 'Promoção: CashBack Dobrado no Shopping',
          description: 'Durante uma semana, todos os CashBack de compras no Shopping serão dobrados! Aproveite essa oportunidade.',
          type: 'promo',
          status: 'upcoming',
          eventDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          location: null,
          meetingUrl: null,
          maxAttendees: null,
          imageUrl: null,
          isActive: true,
          createdBy: null,
          createdAt: now,
          updatedAt: now,
          registrations: [],
          _count: { registrations: 0 },
        },
        {
          id: 'evt_03',
          title: 'Lançamento: App Mobilidade v3.0',
          description: 'Estamos lançando a nova versão do app com funcionalidades incríveis: rastreamento em tempo real, avaliação de motoristas e muito mais.',
          type: 'launch',
          status: 'upcoming',
          eventDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          endDate: null,
          location: 'Online + Evento Presencial em SP',
          meetingUrl: null,
          maxAttendees: 500,
          imageUrl: null,
          isActive: true,
          createdBy: null,
          createdAt: now,
          updatedAt: now,
          registrations: userId ? await db.eventRegistration.findMany({ where: { eventId: 'evt_03', userId } }) : [],
          _count: { registrations: 128 },
        },
        {
          id: 'evt_04',
          title: 'Encontro Regional - Sudeste',
          description: 'Encontro presencial de membros da região Sudeste. Networking, palestras e premiações especiais.',
          type: 'meetup',
          status: 'upcoming',
          eventDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
          location: 'Hotel Pullman - São Paulo, SP',
          meetingUrl: null,
          maxAttendees: 200,
          imageUrl: null,
          isActive: true,
          createdBy: null,
          createdAt: now,
          updatedAt: now,
          registrations: userId ? await db.eventRegistration.findMany({ where: { eventId: 'evt_04', userId } }) : [],
          _count: { registrations: 67 },
        },
        {
          id: 'evt_05',
          title: 'Manutenção Programada do Sistema',
          description: 'O sistema passará por manutenção programada para melhorias de performance e segurança. Algumas funcionalidades podem estar temporariamente indisponíveis.',
          type: 'maintenance',
          status: 'upcoming',
          eventDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
          location: null,
          meetingUrl: null,
          maxAttendees: null,
          imageUrl: null,
          isActive: true,
          createdBy: null,
          createdAt: now,
          updatedAt: now,
          registrations: [],
          _count: { registrations: 0 },
        },
        {
          id: 'evt_06',
          title: 'Webinar: Plano de Carreira 2025',
          description: 'Descubra como alcançar o topo do plano de carreira NewMobility em 2025. Dicas práticas de líderes de sucesso.',
          type: 'webinar',
          status: 'ongoing',
          eventDate: new Date(now.getTime() - 30 * 60 * 1000),
          endDate: new Date(now.getTime() + 90 * 60 * 1000),
          location: null,
          meetingUrl: 'https://meet.google.com/xyz-abcd-efg',
          maxAttendees: 150,
          imageUrl: null,
          isActive: true,
          createdBy: null,
          createdAt: now,
          updatedAt: now,
          registrations: userId ? await db.eventRegistration.findMany({ where: { eventId: 'evt_06', userId } }) : [],
          _count: { registrations: 89 },
        },
      ] as any
    }

    const formattedEvents = events.map((evt: any) => ({
      id: evt.id,
      title: evt.title,
      description: evt.description,
      type: evt.type,
      status: evt.status,
      eventDate: evt.eventDate instanceof Date ? evt.eventDate.toISOString() : evt.eventDate,
      endDate: evt.endDate instanceof Date ? evt.endDate?.toISOString() : evt.endDate,
      location: evt.location,
      meetingUrl: evt.meetingUrl,
      maxAttendees: evt.maxAttendees,
      registrationCount: evt._count?.registrations ?? evt.registrations?.length ?? 0,
      isRegistered: evt.registrations?.length > 0,
    }))

    return success({ events: formattedEvents, total: formattedEvents.length })
  } catch (err: any) {
    return error(err.message || 'Erro ao buscar eventos', 500)
  }
}
