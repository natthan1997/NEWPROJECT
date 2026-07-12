import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { uploadToR2 } from '@/lib/r2'
import { resolveRequestUser } from '@/lib/server/requestAuth'

export const dynamic = 'force-dynamic'

const createServiceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}

const ensureAdminOrManager = async (supabase: any, userId: string) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  const role = String(profile?.role || '').toLowerCase()
  return role === 'admin' || role === 'manager' || role === 'staff'
}

export async function POST(req: NextRequest) {
  try {
    const user = await resolveRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServiceClient()
    const isAllowed = await ensureAdminOrManager(supabase, user.id)
    if (!isAllowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bucket = (formData.get('bucket') as string | null) || 'marketplace-images'
    let path = (formData.get('path') as string | null)

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    if (!path) {
       const fileExt = file.name.split('.').pop()
       const fileName = `${Math.random()}.${fileExt}`
       path = `pos-menus/${fileName}`
    }

    const fullPath = `${bucket}/${path}`
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const publicUrl = await uploadToR2(fileBuffer, fullPath, file.type)

    return NextResponse.json({
      success: true,
      path: fullPath,
      publicUrl,
    })
  } catch (error: any) {
    console.error('POST /api/admin/storage/upload error', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
