import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// ============================================================================
// /api/system-settings/public
// ----------------------------------------------------------------------------
// Retorna APENAS as configs marcadas como públicas (não sensíveis).
// Usado pelo sidebar para verificar features.bet_enabled e
// features.games_enabled sem precisar de autenticação admin.
//
// Task ID 6: agora também retorna branding público:
//   - platform_name / app_name → nome exibido no sidebar/header/footer/metadata
//   - app_logo_url             → URL da logo (data URL) para mostrar no backoffice
//   - primary_color            → cor primária do tema
// ============================================================================

const PUBLIC_KEYS = [
  'features.bet_enabled',
  'features.games_enabled',
  'platform.registration_enabled',
  'platform.maintenance_mode',
  // Branding público (Task ID 6)
  'platform_name',
  'app_name',
  'app_logo_url',
  'primary_color',
]

export async function GET(_req: NextRequest) {
  try {
    const settings = await prisma.systemConfig.findMany({
      where: { key: { in: PUBLIC_KEYS } },
      select: { key: true, value: true },
    })
    return success({ settings })
  } catch (err) {
    console.error('Public system-settings error:', err)
    return success({ settings: [] })
  }
}
