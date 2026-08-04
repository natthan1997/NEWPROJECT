import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function createSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(req: Request) {
  try {
    const { branch_code, start, end } = await req.json()
    
    if (!branch_code || !start || !end) {
      return NextResponse.json({ hasPhotos: false, error: 'Missing required parameters' }, { status: 400 })
    }

    const supabase = createSupabaseServiceClient()

    // 1. Get all staff in this branch
    const { data: staffInBranch } = await supabase
      .from('profiles')
      .select('id')
      .eq('branch_code', branch_code)

    const staffIds = staffInBranch?.map((s) => s.id) || []

    if (staffIds.length === 0) {
      return NextResponse.json({ hasPhotos: false })
    }

    // 2. Check if any of these staff have uploaded checkout photos today
    const { data: logsWithPhotos } = await supabase
      .from('attendance_logs')
      .select('id, checkout_zone_photos')
      .in('profile_id', staffIds)
      .eq('type', 'check_out')
      .gte('timestamp', start)
      .lte('timestamp', end)
      .not('checkout_zone_photos', 'is', null)
      .limit(10) // fetch a few to ensure we find one with actual photos

    // A log might exist with '[]' if no photos were actually uploaded, 
    // but the logic relies on anyone who uploaded real photos.
    // Let's ensure it has an actual photo by checking array length.
    const hasPhotos = logsWithPhotos?.some(log => {
      let photos = log.checkout_zone_photos;
      if (typeof photos === 'string') {
        try { photos = JSON.parse(photos); } catch(e) { return false; }
      }
      return Array.isArray(photos) && photos.length > 0;
    }) || false;

    return NextResponse.json({ hasPhotos })

  } catch (error: any) {
    console.error('Error checking branch photos:', error)
    return NextResponse.json({ hasPhotos: false, error: error.message }, { status: 500 })
  }
}
