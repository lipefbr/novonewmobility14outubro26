import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// ============================================================================
// /api/admin/system-settings — CRUD for ALL configurable system values
// ----------------------------------------------------------------------------
// SETTINGS-1 — A comprehensive "System Settings" admin page where the admin
// can edit EVERYTHING in the system: matrix values (Entrada 4x5, Residual
// 4x7, Vendas 4x9), cashback percentages (entrada 35%, residual 45%,
// vendas 0.9%, direct referral 10%), plan prices (Blue3 R$ 999,90,
// Blue5 R$ 999,90), withdrawal limits (min/max/fee), points config,
// vouchers, metas, platform name/tagline, and any custom value the admin
// wants to add at runtime.
//
// Backed by the existing SystemConfig table (key/value/category). On the
// first GET, seeds the database with the full default catalog across 10
// categories. The seed is idempotent — only missing keys are inserted, so
// any value previously edited by the admin is preserved.
// ============================================================================

export interface SystemSettingItem {
  id: string
  key: string
  value: string
  description: string | null
  category: string
  updatedAt: string
}

type SeedEntry = { key: string; value: string; description?: string; category: string }

// Default catalog of configurable system values grouped by category. These
// mirror every value the admin may want to tweak without a deploy. The
// admin can also create new entries via POST (and delete them via DELETE).
//
// Categories:
//   - matrizes    : matrix structure (levels, width, base value, pct per level)
//   - cashback    : top-level cashback percentages (entrada/residual/vendas/direct)
//   - planos      : plan names, prices (in cents), cashback level counts
//   - saques      : withdrawal limits + fee
//   - pontos      : points-per-action configuration
//   - vouchers    : voucher welcome / signup bonus amounts
//   - metas       : daily/monthly goals + bonuses
//   - geral       : platform name, tagline, description, support email
//
// NOTE: the existing /api/admin/content-texts route already seeds the
// `geral`, `dashboard`, `menu`, and `planos` text labels (platform_name,
// menu_dashboard, plan_blue3_name, etc.). Those keys use underscores
// (snake_case). The keys below use the dot-style naming convention
// (matrix.entrada.pct_level_1, cashback.entrada_pct, plan.blue3.price_cents)
// so they don't collide with the content-texts keys. Both sets are visible
// in this UI; the admin can edit either one.
const DEFAULT_SYSTEM_SETTINGS: SeedEntry[] = [
  // -------- matrizes --------
  // Entrada 4x5 — base R$ 999,00, percentages per level
  { key: 'matrix.entrada.levels', value: '5', description: 'Número de níveis da Matriz de Entrada (4x5)', category: 'matrizes' },
  { key: 'matrix.entrada.width', value: '4', description: 'Largura da Matriz de Entrada (4 indicados diretos por nível)', category: 'matrizes' },
  { key: 'matrix.entrada.pct_level_1', value: '5', description: '% de comissão no nível 1 da Matriz de Entrada', category: 'matrizes' },
  { key: 'matrix.entrada.pct_level_2', value: '10', description: '% de comissão no nível 2 da Matriz de Entrada', category: 'matrizes' },
  { key: 'matrix.entrada.pct_level_3', value: '10', description: '% de comissão no nível 3 da Matriz de Entrada', category: 'matrizes' },
  { key: 'matrix.entrada.pct_level_4', value: '5', description: '% de comissão no nível 4 da Matriz de Entrada', category: 'matrizes' },
  { key: 'matrix.entrada.pct_level_5', value: '5', description: '% de comissão no nível 5 da Matriz de Entrada', category: 'matrizes' },
  { key: 'matrix.entrada.base_cents', value: '99900', description: 'Valor base da Matriz de Entrada em centavos (R$ 999,00)', category: 'matrizes' },

  // Residual 4x7 — base R$ 1.399,00, percentages per level
  { key: 'matrix.residual.levels', value: '7', description: 'Número de níveis da Matriz Residual (4x7)', category: 'matrizes' },
  { key: 'matrix.residual.width', value: '4', description: 'Largura da Matriz Residual', category: 'matrizes' },
  { key: 'matrix.residual.pct_level_1', value: '10', description: '% de comissão no nível 1 da Matriz Residual', category: 'matrizes' },
  { key: 'matrix.residual.pct_level_2', value: '9', description: '% de comissão no nível 2 da Matriz Residual', category: 'matrizes' },
  { key: 'matrix.residual.pct_level_3', value: '5', description: '% de comissão no nível 3 da Matriz Residual', category: 'matrizes' },
  { key: 'matrix.residual.pct_level_4', value: '5', description: '% de comissão no nível 4 da Matriz Residual', category: 'matrizes' },
  { key: 'matrix.residual.pct_level_5', value: '4', description: '% de comissão no nível 5 da Matriz Residual', category: 'matrizes' },
  { key: 'matrix.residual.pct_level_6', value: '3', description: '% de comissão no nível 6 da Matriz Residual', category: 'matrizes' },
  { key: 'matrix.residual.pct_level_7', value: '2', description: '% de comissão no nível 7 da Matriz Residual', category: 'matrizes' },
  { key: 'matrix.residual.base_cents', value: '139900', description: 'Valor base da Matriz Residual em centavos (R$ 1.399,00)', category: 'matrizes' },

  // Vendas 4x9 — base R$ 199,90, 0.10% per level
  { key: 'matrix.vendas.levels', value: '9', description: 'Número de níveis da Matriz de Vendas (4x9)', category: 'matrizes' },
  { key: 'matrix.vendas.width', value: '4', description: 'Largura da Matriz de Vendas', category: 'matrizes' },
  { key: 'matrix.vendas.pct_per_level', value: '0.1', description: '% de comissão por nível da Matriz de Vendas (0.10%)', category: 'matrizes' },
  { key: 'matrix.vendas.base_cents', value: '19990', description: 'Valor base da Matriz de Vendas em centavos (R$ 199,90)', category: 'matrizes' },
  { key: 'matrix.vendas.salesLimit', value: '1000', description: 'Limite de vendas da Matriz de Vendas (teto para comissões)', category: 'matrizes' },

  // -------- cashback --------
  { key: 'cashback.entrada_pct', value: '35', description: '% de CashBack da Matriz de Entrada (35%)', category: 'cashback' },
  { key: 'cashback.residual_pct', value: '45', description: '% de CashBack da Matriz Residual (45%)', category: 'cashback' },
  { key: 'cashback.vendas_pct', value: '0.9', description: '% de CashBack da Matriz de Vendas (0.9%)', category: 'cashback' },
  { key: 'cashback.direct_referral_pct', value: '10', description: '% de bônus por indicação direta (10%)', category: 'cashback' },

  // -------- planos --------
  { key: 'plan.free.name', value: 'Gratuito', description: 'Nome do plano gratuito', category: 'planos' },
  { key: 'plan.free.price_cents', value: '0', description: 'Preço do plano gratuito em centavos', category: 'planos' },
  { key: 'plan.blue3.name', value: 'Blue 3', description: 'Nome do plano Blue 3', category: 'planos' },
  { key: 'plan.blue3.price_cents', value: '99990', description: 'Preço do plano Blue 3 em centavos (R$ 999,90)', category: 'planos' },
  { key: 'plan.blue3.cashback_levels_entrada', value: '3', description: 'Quantidade de níveis de CashBack de Entrada liberados para o plano Blue 3', category: 'planos' },
  { key: 'plan.blue5.name', value: 'Blue 5 Premium', description: 'Nome do plano Blue 5 Premium', category: 'planos' },
  { key: 'plan.blue5.price_cents', value: '99990', description: 'Preço do plano Blue 5 Premium em centavos (R$ 999,90)', category: 'planos' },
  { key: 'plan.blue5.cashback_levels_entrada', value: '5', description: 'Níveis de CashBack de Entrada liberados para o Blue 5', category: 'planos' },
  { key: 'plan.blue5.cashback_levels_residual', value: '7', description: 'Níveis de CashBack Residual liberados para o Blue 5', category: 'planos' },
  { key: 'plan.blue5.cashback_levels_vendas', value: '9', description: 'Níveis de CashBack de Vendas liberados para o Blue 5', category: 'planos' },
  { key: 'plan.mensalidade_cents', value: '99990', description: 'Mensalidade do plano Premium em centavos (R$ 999,90)', category: 'planos' },

  // -------- saques --------
  { key: 'saque.min_cents', value: '5000', description: 'Valor mínimo de saque em centavos (R$ 50,00)', category: 'saques' },
  { key: 'saque.max_cents', value: '500000', description: 'Valor máximo de saque em centavos (R$ 5.000,00)', category: 'saques' },
  { key: 'saque.fee_pct', value: '2', description: 'Taxa de saque em % (2%)', category: 'saques' },

  // -------- pontos --------
  { key: 'pontos.per_referral', value: '100', description: 'Pontos ganhos por cada indicação confirmada', category: 'pontos' },
  { key: 'pontos.per_purchase', value: '1', description: 'Pontos ganhos por cada R$1 em compras', category: 'pontos' },
  { key: 'pontos.per_cashback_claim', value: '50', description: 'Pontos ganhos por resgate de cashback', category: 'pontos' },
  { key: 'pontos.daily_login', value: '1', description: 'Pontos ganhos por login diário', category: 'pontos' },
  { key: 'pontos.per_star', value: '2', description: 'Multiplicador de pontos por estrela de carreira', category: 'pontos' },

  // -------- vouchers --------
  { key: 'voucher.welcome_bonus_cents', value: '1000', description: 'Bônus de boas-vindas em centavos (R$ 10,00)', category: 'vouchers' },
  { key: 'voucher.signup_bonus_cents', value: '1000', description: 'Bônus de cadastro em centavos (R$ 10,00)', category: 'vouchers' },

  // -------- metas --------
  { key: 'metas.daily_goal_rides', value: '18', description: 'Meta diária de corridas (18 corridas/dia)', category: 'metas' },
  { key: 'metas.monthly_goal_rides', value: '384', description: 'Meta mensal de corridas (384 corridas/mês)', category: 'metas' },
  { key: 'metas.daily_bonus_cents', value: '500', description: 'Bônus diário em centavos ao atingir a meta (R$ 5,00)', category: 'metas' },
  { key: 'metas.monthly_bonus_cents', value: '3000', description: 'Bônus mensal em centavos ao atingir a meta (R$ 30,00)', category: 'metas' },

  // -------- geral (extra platform-wide keys) --------
  // NOTE: platform_name / platform_tagline / platform_description already
  // exist in the content-texts seed (snake_case). We add the dot-style
  // variants here for the support email + a few extra platform-wide keys
  // so the admin has a single tab to edit everything platform-related.
  { key: 'platform.support_email', value: 'suporte@newmobility.com', description: 'E-mail de suporte da plataforma', category: 'geral' },
]

// Idempotent seed: inserts only the default system settings that don't
// already exist in the database. Uses a per-row create() loop wrapped in
// try/catch so a unique-key race (two admins loading the page at the same
// time) doesn't break the listing.
async function seedDefaults() {
  const existingKeys = new Set(
    (await prisma.systemConfig.findMany({ select: { key: true } })).map((c) => c.key)
  )
  const missing = DEFAULT_SYSTEM_SETTINGS.filter((d) => !existingKeys.has(d.key))
  if (missing.length === 0) return
  for (const m of missing) {
    try {
      await prisma.systemConfig.create({
        data: {
          key: m.key,
          value: m.value,
          description: m.description ?? null,
          category: m.category,
        },
      })
    } catch {
      // Ignore individual insert failures — the unique constraint on
      // SystemConfig.key is the final safety net.
    }
  }
}

// GET /api/admin/system-settings?userId=<adminId>&category=<optional>
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return error('userId is required', 400)

    const admin = await prisma.user.findUnique({ where: { id: userId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    // Seed defaults on first load (idempotent).
    try {
      await seedDefaults()
    } catch (seedErr) {
      console.error('system-settings seed error:', seedErr)
      // Listing still works even if the seed fails (e.g. race condition).
    }

    const category = req.nextUrl.searchParams.get('category') || undefined

    const items = await prisma.systemConfig.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    })

    const data: SystemSettingItem[] = items.map((c) => ({
      id: c.id,
      key: c.key,
      value: c.value,
      description: c.description,
      category: c.category,
      updatedAt: c.updatedAt.toISOString(),
    }))

    return success({ items: data })
  } catch (err) {
    console.error('Admin system-settings GET error:', err)
    return error('Failed to fetch system settings', 500)
  }
}

// POST /api/admin/system-settings
// Body: { userId, key, value, description?, category? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, key, value, description, category = 'geral' } = body

    if (!userId) return error('userId is required', 400)

    const admin = await prisma.user.findUnique({ where: { id: userId } })
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    // Validations
    if (!key || typeof key !== 'string' || !key.trim()) {
      return error('Chave (key) é obrigatória', 400)
    }
    // Allow dots, underscores, letters, and digits so admins can use either
    // snake_case (menu_dashboard) or dotted (matrix.entrada.pct_level_1)
    // naming. Anything else is rejected to avoid surprises in URLs/JSON.
    if (!/^[a-z0-9_.]+$/i.test(key.trim())) {
      return error('Chave deve conter apenas letras, números, ponto e underline', 400)
    }
    if (value === undefined || value === null || typeof value !== 'string' || !value.trim()) {
      return error('Valor é obrigatório', 400)
    }

    const keyNorm = key.trim().toLowerCase()

    const existing = await prisma.systemConfig.findUnique({ where: { key: keyNorm } })
    if (existing) {
      return error(`Já existe uma configuração com a chave "${keyNorm}"`, 409)
    }

    const created = await prisma.systemConfig.create({
      data: {
        key: keyNorm,
        value: value.trim(),
        description: typeof description === 'string' && description.trim() ? description.trim() : null,
        category: typeof category === 'string' && category.trim() ? category.trim() : 'geral',
      },
    })

    return success(
      {
        message: 'Configuração criada com sucesso',
        item: {
          id: created.id,
          key: created.key,
          value: created.value,
          description: created.description,
          category: created.category,
          updatedAt: created.updatedAt.toISOString(),
        },
      },
      201
    )
  } catch (err) {
    console.error('Admin system-settings POST error:', err)
    return error('Failed to create system setting', 500)
  }
}
