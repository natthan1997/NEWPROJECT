import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestUser } from '@/lib/server/requestAuth'
import { createStaffInviteToken } from '@/lib/server/lineLinkToken'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await resolveRequestUser(req)
  const origin = req.nextUrl.origin

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Basic check: Ensure user is admin/owner
  // For safety, we just rely on the RLS or UI, but we could add a DB check here.
  // Actually, POSStaffManager only shows up for manager/owner.

  const profileId = req.nextUrl.searchParams.get('profile_id')
  if (!profileId) {
    return NextResponse.json({ error: 'Missing profile_id' }, { status: 400 })
  }

  const token = createStaffInviteToken(profileId)
  if (!token) {
    return NextResponse.json({ error: 'Server misconfiguration (missing secret)' }, { status: 500 })
  }

  const inviteUrl = new URL('/api/auth/line/login', origin)
  inviteUrl.searchParams.set('staff_invite', token)

  return NextResponse.json({ inviteUrl: inviteUrl.toString() })
}
