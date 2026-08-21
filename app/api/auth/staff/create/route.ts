import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestUser } from '@/lib/server/requestAuth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const user = await resolveRequestUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { email, password, profile_data, is_offline } = body

    if (!profile_data || (!is_offline && (!email || !password))) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Fetch the current user's profile to get their merchant_id
    const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
      .from('profiles')
      .select('merchant_id, role, staff_level')
      .eq('id', user.id)
      .single()

    if (adminProfileError || !adminProfile) {
      return NextResponse.json({ error: 'Admin profile not found' }, { status: 403 })
    }

    // Verify permissions
    const isOwnerOrAdmin = adminProfile.role === 'admin' || adminProfile.role === 'owner' || adminProfile.staff_level === 'owner' || adminProfile.staff_level === 'superadmin' || adminProfile.staff_level === 'manager';
    if (!isOwnerOrAdmin) {
       return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    let newUserId = '';

    if (is_offline) {
      // Offline/LINE invite user: No Auth user, just generate a UUID for the profile
      newUserId = crypto.randomUUID();
    } else {
      // 1. Create the Auth User
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: profile_data.display_name,
          full_name: profile_data.display_name,
        }
      })

      if (authError || !authData.user) {
        return NextResponse.json({ error: authError?.message || 'Failed to create auth user' }, { status: 400 })
      }

      newUserId = authData.user.id
    }

    // Sanitize staff_type to match the db constraint CHECK (staff_type in ('cafe', 'garden'))
    let dbStaffType = null;
    if (profile_data.staff_type === 'cafe') {
      dbStaffType = 'cafe';
    } else if (profile_data.staff_type === 'garden' || profile_data.staff_type === 'landscape') {
      dbStaffType = 'garden';
    }

    // 2. Upsert the Profile Data (forcing the ID and merchant_id)
    const finalProfileData = {
      ...profile_data,
      staff_type: dbStaffType,
      id: newUserId,
      email: email || null,
      merchant_id: adminProfile.merchant_id,
      updated_at: new Date().toISOString()
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(finalProfileData, { onConflict: 'id' })

    if (profileError) {
      if (!is_offline) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId)
      }
      return NextResponse.json({ error: 'Failed to create profile: ' + profileError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, profileId: newUserId })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
