import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-utils'

// ============================================================================
// /api/service-types
// ----------------------------------------------------------------------------
// Public endpoint (no auth required) used by the user-facing Services module
// to populate the category dropdown and filter chips.
//
// GET  → returns only ACTIVE service types, ordered by sortOrder then name.
//        If the table is empty, seeds the 8 default categories on first call
//        (same defaults as /api/admin/service-types) so the dropdown never
//        appears empty on a fresh deployment.
// ============================================================================

const DEFAULT_SERVICE_TYPES: { name: string; icon: string; sortOrder: number }[] = [
  { name: 'Automotivo', icon: '🚙', sortOrder: 1 },
  { name: 'Mobilidade', icon: '📱', sortOrder: 2 },
  { name: 'Construção', icon: '🏗️', sortOrder: 3 },
  { name: 'Manutenção', icon: '🔧', sortOrder: 4 },
  { name: 'Limpeza', icon: '🧹', sortOrder: 5 },
  { name: 'Transporte', icon: '🚗', sortOrder: 6 },
  { name: 'Tecnologia', icon: '💻', sortOrder: 7 },
  { name: 'Outros', icon: '📦', sortOrder: 99 },
]

async function seedDefaultServiceTypesIfEmpty() {
  const count = await prisma.serviceType.count()
  if (count > 0) return
  for (const t of DEFAULT_SERVICE_TYPES) {
    await prisma.serviceType.create({ data: t })
  }
}

export async function GET(_req: NextRequest) {
  try {
    await seedDefaultServiceTypesIfEmpty()

    const types = await prisma.serviceType.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, icon: true, sortOrder: true },
    })

    return success({ types })
  } catch (err) {
    console.error('Public service-types GET error:', err)
    // Soft-fail: return the static fallback list so the UI never breaks even
    // if the database is unreachable (e.g. local dev without postgres).
    return success({
      types: DEFAULT_SERVICE_TYPES.map((t, i) => ({
        id: `fallback_${i}`,
        name: t.name,
        icon: t.icon,
        sortOrder: t.sortOrder,
      })),
    })
  }
}

// Silence unused export warning — this file only exports GET.
export async function POST() {
  return error('Method Not Allowed', 405)
}
