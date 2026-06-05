import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// POST - Seed test support tickets for admin panel testing
export async function POST() {
  try {
    // Get existing users to assign tickets to
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      take: 10,
    })

    if (users.length === 0) {
      return error('No users found in database. Please seed users first.', 400)
    }

    // Get admin user for replies
    const admin = users.find(u => u.role === 'admin') || users[0]
    const nonAdminUsers = users.filter(u => u.role !== 'admin')
    if (nonAdminUsers.length === 0) {
      return error('No non-admin users found for ticket creation.', 400)
    }

    // Check if test tickets already exist
    const existingTestTickets = await prisma.ticket.findMany({
      where: { subject: { startsWith: '[TEST]' } },
    })
    if (existingTestTickets.length > 0) {
      return success({
        message: `Test tickets already exist (${existingTestTickets.length} found). Skipping creation.`,
        existingCount: existingTestTickets.length,
      })
    }

    const ticketData = [
      {
        userId: nonAdminUsers[0 % nonAdminUsers.length].id,
        subject: '[TEST] Não consigo acessar minha conta',
        category: 'account',
        status: 'open',
        priority: 'high',
        messages: [
          { userId: nonAdminUsers[0 % nonAdminUsers.length].id, message: 'Olá, não estou conseguindo fazer login na minha conta. Já tentei redefinir a senha mas o email não chega. Podem me ajudar?', isAdmin: false },
        ],
      },
      {
        userId: nonAdminUsers[1 % nonAdminUsers.length].id,
        subject: '[TEST] Saque pendente há mais de 7 dias',
        category: 'financial',
        status: 'in_progress',
        priority: 'urgent',
        messages: [
          { userId: nonAdminUsers[1 % nonAdminUsers.length].id, message: 'Solicitei um saque há 7 dias atrás e ainda está pendente. Preciso urgente desse valor!', isAdmin: false },
          { userId: admin.id, message: 'Olá! Verificamos que seu saque está na fila de processamento. Pedimos desculpas pela demora. Vamos priorizar a análise do seu pedido.', isAdmin: true },
        ],
      },
      {
        userId: nonAdminUsers[2 % nonAdminUsers.length].id,
        subject: '[TEST] Cashback não creditado na conta',
        category: 'financial',
        status: 'open',
        priority: 'high',
        messages: [
          { userId: nonAdminUsers[2 % nonAdminUsers.length].id, message: 'Fiz uma indicação há 2 semanas e o cashback de entrada ainda não foi creditado. O indicado já ativou o plano Blue 3.', isAdmin: false },
        ],
      },
      {
        userId: nonAdminUsers[3 % nonAdminUsers.length].id,
        subject: '[TEST] Erro ao usar o app de mobilidade',
        category: 'technical',
        status: 'resolved',
        priority: 'normal',
        messages: [
          { userId: nonAdminUsers[3 % nonAdminUsers.length].id, message: 'O app de mobilidade está fechando sozinho quando tento solicitar uma corrida. Já tentei reinstalar mas o problema persiste.', isAdmin: false },
          { userId: admin.id, message: 'Identificamos o problema! Era um bug na versão 2.1.0 que já foi corrigido na versão 2.1.1. Por favor, atualize o app e tente novamente.', isAdmin: true },
          { userId: nonAdminUsers[3 % nonAdminUsers.length].id, message: 'Atualizei o app e está funcionando perfeitamente agora. Obrigado pelo suporte!', isAdmin: false },
        ],
      },
      {
        userId: nonAdminUsers[0 % nonAdminUsers.length].id,
        subject: '[TEST] Dúvida sobre o plano Blue 5',
        category: 'account',
        status: 'closed',
        priority: 'normal',
        messages: [
          { userId: nonAdminUsers[0 % nonAdminUsers.length].id, message: 'Gostaria de saber mais detalhes sobre o plano Blue 5. Quais são as diferenças para o Blue 3? Vale a pena fazer o upgrade?', isAdmin: false },
          { userId: admin.id, message: 'O plano Blue 5 inclui tudo do Blue 3 mais: gratificações exclusivas, prioridade no suporte, bônus de adesão aumentado, App Pet, Seguro telefone, Telemedicina e Assistência funerária. O valor é R$ 147,00/mês. Vale muito a pena se você usa os benefícios adicionais!', isAdmin: true },
          { userId: nonAdminUsers[0 % nonAdminUsers.length].id, message: 'Perfeito, vou fazer o upgrade! Obrigado pelas informações.', isAdmin: false },
        ],
      },
      {
        userId: nonAdminUsers[1 % nonAdminUsers.length].id,
        subject: '[TEST] Problema com chave PIX',
        category: 'technical',
        status: 'in_progress',
        priority: 'normal',
        messages: [
          { userId: nonAdminUsers[1 % nonAdminUsers.length].id, message: 'Tentei cadastrar minha chave PIX mas aparece uma mensagem de erro dizendo que a chave já está em uso. No entanto, nunca cadastrei em outra conta.', isAdmin: false },
          { userId: admin.id, message: 'Vamos verificar isso para você. Pode nos informar qual tipo de chave PIX está tentando cadastrar (CPF, email, telefone ou chave aleatória)?', isAdmin: true },
        ],
      },
      {
        userId: nonAdminUsers[2 % nonAdminUsers.length].id,
        subject: '[TEST] Solicitar reembolso de compra no marketplace',
        category: 'financial',
        status: 'open',
        priority: 'normal',
        messages: [
          { userId: nonAdminUsers[2 % nonAdminUsers.length].id, message: 'Comprei um produto no marketplace mas veio com defeito. Quero solicitar o reembolso. O pedido foi feito há 3 dias.', isAdmin: false },
        ],
      },
      {
        userId: nonAdminUsers[3 % nonAdminUsers.length].id,
        subject: '[TEST] Como funciona o plano de carreira?',
        category: 'other',
        status: 'resolved',
        priority: 'low',
        messages: [
          { userId: nonAdminUsers[3 % nonAdminUsers.length].id, message: 'Gostaria de entender melhor como funciona o plano de carreira. Quais são os níveis e como subo de rank?', isAdmin: false },
          { userId: admin.id, message: 'O plano de carreira tem os seguintes níveis: Associado (0 pontos), Bronze (10 pontos), Prata (25 pontos), Ouro (50 pontos), Safira (100 pontos) e Diamante (250 pontos). Você ganha pontos através de indicações e atividades na plataforma. Cada nível desbloqueia novos benefícios!', isAdmin: true },
          { userId: nonAdminUsers[3 % nonAdminUsers.length].id, message: 'Muito bom! Vou começar a indicar mais pessoas para subir de nível.', isAdmin: false },
        ],
      },
    ]

    const createdTickets = []

    for (const td of ticketData) {
      const { messages, ...ticketFields } = td

      // Create the ticket
      const ticket = await prisma.ticket.create({
        data: {
          userId: ticketFields.userId,
          subject: ticketFields.subject,
          category: ticketFields.category,
          status: ticketFields.status,
          priority: ticketFields.priority,
        },
      })

      // Create the messages
      for (const msg of messages) {
        await prisma.ticketMessage.create({
          data: {
            ticketId: ticket.id,
            userId: msg.userId,
            message: msg.message,
            isAdmin: msg.isAdmin,
          },
        })
      }

      createdTickets.push({
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        messageCount: messages.length,
      })
    }

    return success({
      message: `${createdTickets.length} test tickets created successfully!`,
      tickets: createdTickets,
      usersUsed: nonAdminUsers.map(u => ({ id: u.id, name: u.name })),
      adminUsed: { id: admin.id, name: admin.name },
    })
  } catch (err) {
    console.error('Seed tickets error:', err)
    return error('Failed to seed test tickets: ' + (err instanceof Error ? err.message : 'Unknown error'), 500)
  }
}
