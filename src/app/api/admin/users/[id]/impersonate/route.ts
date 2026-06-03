import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error, sanitizeUser } from '@/lib/api-utils'

// POST - Generate an impersonation token for a user (admin only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const adminId = body.userId

    if (!adminId) return error('userId is required', 400)

    const admin = await db.findOne('User', '"id" = $1', [adminId])
    if (!admin || admin.role !== 'admin') return error('Unauthorized', 403)

    // Get the target user
    const targetUser = await db.findOne('User', '"id" = $1', [id])
    if (!targetUser) return error('User not found', 404)

    // Don't allow impersonating other admins
    if (targetUser.role === 'admin') return error('Cannot impersonate admin users', 403)

    // Log the impersonation action as a transaction record for audit trail
    await db.insert('Transaction', {
      id: `tx_imp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId: adminId,
      type: 'admin_action',
      amount: 0,
      status: 'approved',
      category: 'impersonation',
      description: `Admin ${admin.name || admin.email} impersonated user ${targetUser.name || targetUser.email}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    // Return the target user data (client will use this to "log in" as the user)
    const safeUser = sanitizeUser(targetUser)

    return success({
      impersonatedUser: safeUser,
      impersonatedBy: admin.name || admin.email,
      message: `Agora acessando como ${targetUser.name || targetUser.email}`,
    })
  } catch (err) {
    console.error('Admin impersonate POST error:', err)
    return error('Failed to impersonate user', 500)
  }
}
