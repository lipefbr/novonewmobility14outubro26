import { prisma } from '@/lib/db'

/**
 * Catálogo canônico de planos de Telemedicina (Task ID 4).
 *
 * Quatro SKUs que aparecem na página pública de Telemedicina. Os preços são
 * armazenados em centavos para aritmética inteira; a API formata como BRL
 * antes de enviar ao cliente.
 *
 * O `dataAmount` aqui NÃO é volume de dados (como no TalkMobi) e sim a
 * cobertura do plano: "1 pessoa", "Até 4 dependentes", "Ilimitado", "Equipe".
 *
 * O `id` é um slug estável e legível para que re-executar o seed seja
 * idempotente (o upsert não cria duplicatas) e os admins possam referenciar
 * os planos por uma chave previsível em pedidos/faturas.
 */
export const DEFAULT_TELEMEDICINA_PLANS = [
  {
    id: 'telemed-individual',
    name: 'Plano Individual',
    dataAmount: '1 pessoa',
    priceCents: 2990,
    cashbackCents: 0,
    rewardPoints: 0,
    description: 'Telemedicina para uma pessoa — consultas online 24h, receitas digitais e suporte médico ilimitado.',
    features: [
      'Consultas ilimitadas',
      'Receitas digitais',
      'Suporte 24h',
    ],
    isPopular: false,
    isRecommended: false,
    sortOrder: 1,
  },
  {
    id: 'telemed-familia',
    name: 'Plano Família',
    dataAmount: 'Até 4 dependentes',
    priceCents: 4990,
    cashbackCents: 0,
    rewardPoints: 0,
    description: 'Cobertura para toda a família — inclui até 4 dependentes e suporte psicológico.',
    features: [
      'Consultas ilimitadas',
      'Receitas digitais',
      'Suporte 24h',
      'Até 4 dependentes',
      'Suporte psicológico',
    ],
    isPopular: true,
    isRecommended: false,
    sortOrder: 2,
  },
  {
    id: 'telemed-premium',
    name: 'Plano Premium',
    dataAmount: 'Ilimitado',
    priceCents: 8990,
    cashbackCents: 0,
    rewardPoints: 0,
    description: 'O plano mais completo: dependentes ilimitados, descontos em farmácias e acompanhamento de crônicos.',
    features: [
      'Consultas ilimitadas',
      'Receitas digitais',
      'Suporte 24h',
      'Dependentes ilimitados',
      'Suporte psicológico',
      'Descontos em farmácias',
      'Acompanhamento crônicos',
    ],
    isPopular: false,
    isRecommended: true,
    sortOrder: 3,
  },
  {
    id: 'telemed-empresarial',
    name: 'Plano Empresarial',
    dataAmount: 'Equipe',
    priceCents: 19990,
    cashbackCents: 0,
    rewardPoints: 0,
    description: 'Para empresas e equipes — até 10 dependentes por titular, com orientação pediátrica e gerontológica.',
    features: [
      'Consultas ilimitadas',
      'Receitas digitais',
      'Suporte 24h',
      'Até 10 dependentes',
      'Suporte psicológico',
      'Descontos em farmácias',
      'Acompanhamento crônicos',
      'Orientação pediátrica',
      'Gerontologia',
    ],
    isPopular: false,
    isRecommended: false,
    sortOrder: 4,
  },
] as const

/**
 * Insere os quatro planos canônicos de Telemedicina se nenhum existir.
 *
 * Idempotente: usa `upsert` com chave no slug `id` estável, então re-rodar o
 * seed (ou rodá-lo de vários workers) nunca cria linhas duplicadas. Planos
 * existentes NÃO são sobrescritos — se um admin mudou um preço no backoffice,
 * o seed não mexe.
 *
 * @returns a contagem de planos que existem após o seed rodar.
 */
export async function seedTelemedicinaPlansIfEmpty(): Promise<number> {
  const existing = await prisma.telemedicinaPlan.count()
  if (existing > 0) return existing

  for (const plan of DEFAULT_TELEMEDICINA_PLANS) {
    await prisma.telemedicinaPlan.upsert({
      where: { id: plan.id },
      create: {
        id: plan.id,
        name: plan.name,
        dataAmount: plan.dataAmount,
        priceCents: plan.priceCents,
        cashbackCents: plan.cashbackCents,
        rewardPoints: plan.rewardPoints,
        description: plan.description,
        features: JSON.stringify(plan.features),
        isPopular: plan.isPopular,
        isRecommended: plan.isRecommended,
        isActive: true,
        sortOrder: plan.sortOrder,
      },
      update: {},
    })
  }

  return prisma.telemedicinaPlan.count()
}

/**
 * Force-seed: limpa a tabela TelemedicinaPlan e insere os quatro planos
 * canônicos. Use quando o DB tem planos antigos/errados de um seed anterior
 * e você precisa resetar para o catálogo canônico de marketing.
 *
 * A tabela TelemedicinaPlan não tem FKs de entrada (é uma tabela pura de
 * marketing — o botão "Quero Ativar" na página só cria um pedido que
 * referencia o plano por id), então um delete hard é seguro e não órfã
 * faturas/assinaturas.
 *
 * @returns a contagem de planos após o reset (sempre 4 em caso de sucesso).
 */
export async function seedTelemedicinaPlansForce(): Promise<number> {
  await prisma.telemedicinaPlan.deleteMany({})
  for (const plan of DEFAULT_TELEMEDICINA_PLANS) {
    await prisma.telemedicinaPlan.create({
      data: {
        id: plan.id,
        name: plan.name,
        dataAmount: plan.dataAmount,
        priceCents: plan.priceCents,
        cashbackCents: plan.cashbackCents,
        rewardPoints: plan.rewardPoints,
        description: plan.description,
        features: JSON.stringify(plan.features),
        isPopular: plan.isPopular,
        isRecommended: plan.isRecommended,
        isActive: true,
        sortOrder: plan.sortOrder,
      },
    })
  }
  return prisma.telemedicinaPlan.count()
}

/**
 * Entry-point standalone para executar este arquivo diretamente com
 *   bun run src/lib/seed-telemedicina.ts
 * ou
 *   bunx tsx src/lib/seed-telemedicina.ts
 *
 * Guardado por um "is main module" check para que importar o módulo da API
 * nunca dispare um seed acidental. Suporta Bun (`import.meta.main`) e
 * Node/tsx (`import.meta.url === pathToFileURL(argv[1])`).
 */
const isMainModule =
  typeof (import.meta as { main?: boolean }).main === 'boolean'
    ? (import.meta as { main: boolean }).main
    : import.meta.url ===
      (typeof process !== 'undefined' && process.argv[1]
        ? `file://${process.argv[1]}`
        : '')

if (isMainModule) {
  void (async () => {
    try {
      const count = await seedTelemedicinaPlansIfEmpty()
      console.log(`Telemedicina seed OK — ${count} plan(s) in DB.`)
    } catch (err) {
      console.error('Telemedicina seed failed:', err)
      process.exitCode = 1
    } finally {
      await prisma.$disconnect()
    }
  })()
}
