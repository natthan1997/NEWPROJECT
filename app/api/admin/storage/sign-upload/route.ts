import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestUser } from '@/lib/server/requestAuth'
import { getPresignedUploadUrl, getR2PublicUrl } from '@/lib/r2'

export const dynamic = 'force-dynamic'

const createServiceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}

const ensureAdmin = async (supabase: any, userId: string) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  return String(profile?.role || '').toLowerCase() === 'admin'
}

export async function POST(req: NextRequest) {
  try {
    const user = await resolveRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServiceClient()
    const isAdmin = await ensureAdmin(supabase, user.id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { path, bucket = 'work-reports' } = await req.json()
    if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

    // Simulate Supabase buckets using R2 folder prefixes
    const fullPath = `${bucket}/${path}`
    const signedUrl = await getPresignedUploadUrl(fullPath)
    const publicUrl = getR2PublicUrl(fullPath)

    return NextResponse.json({
      success: true,
      signedUrl,
      path: fullPath,
      publicUrl,
    })
  } catch (error: any) {
    console.error('POST /api/admin/storage/sign-upload error', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}

