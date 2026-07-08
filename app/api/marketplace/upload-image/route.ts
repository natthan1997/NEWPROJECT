import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { uploadToR2 } from '@/lib/r2'

export const dynamic = 'force-dynamic'

const BUCKET = 'marketplace-images'

function getEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return { supabaseUrl, supabaseAnonKey }
}

export async function POST(request: NextRequest) {
  try {
    const { supabaseUrl, supabaseAnonKey } = getEnv()

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '').trim()

    if (!token) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนอัปโหลดรูป' }, { status: 401 })
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'สิทธิ์การใช้งานไม่ถูกต้อง' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'อนุญาตเฉพาะ admin เท่านั้น' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileName = (formData.get('fileName') as string | null)?.trim() || 'plant-image'

    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์ที่อัปโหลด' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'ไฟล์ต้องเป็นรูปภาพเท่านั้น' }, { status: 400 })
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const random = Math.random().toString(36).slice(2, 10)
    const objectPath = `${BUCKET}/plants/${Date.now()}_${random}_${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    let publicUrl = ''
    try {
      publicUrl = await uploadToR2(fileBuffer, objectPath, file.type)
    } catch (uploadError: any) {
      console.error('R2 Upload Error:', uploadError)
      return NextResponse.json({ error: `อัปโหลดรูปไม่สำเร็จ: ${uploadError?.message}` }, { status: 500 })
    }

    return NextResponse.json({
      publicUrl,
      path: objectPath,
    })
  } catch (error: any) {
    console.error('POST /api/marketplace/upload-image error', error)
    return NextResponse.json(
      {
        error: 'ไม่สามารถอัปโหลดรูปได้',
        details: error?.message || 'unknown error',
      },
      { status: 500 }
    )
  }
}

