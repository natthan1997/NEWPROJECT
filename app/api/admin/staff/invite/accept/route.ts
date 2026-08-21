import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; }
        }
      }
    );

    // 1. Get authenticated user accepting the invite
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: You must be logged in to accept an invite' }, { status: 401 });
    }

    // 2. Parse payload
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing required field: token' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Fetch and validate invite
    const { data: invite, error: fetchError } = await supabaseAdmin
      .from('pos_staff_invites')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (fetchError || !invite) {
      return NextResponse.json({ success: false, error: 'Invalid invitation token' }, { status: 400 });
    }

    if (invite.accepted_at) {
      return NextResponse.json({ success: false, error: 'This invitation has already been accepted' }, { status: 400 });
    }

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: 'This invitation has expired' }, { status: 400 });
    }

    // 4. Update the user profile to be staff linked to the merchant
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'staff',
        merchant_id: invite.merchant_id,
        staff_level: invite.role, // e.g. 'staff', 'manager', 'admin'
        branch_code: invite.branch_code || null,
        is_verified: true, // Auto-verify upon accepting owner's invite link
        is_pos_account: true // Default to enabling POS access
      })
      .eq('id', user.id);

    if (profileError) {
      throw profileError;
    }

    // 5. Mark the invite as accepted
    const { error: updateInviteError } = await supabaseAdmin
      .from('pos_staff_invites')
      .update({
        accepted_at: new Date().toISOString(),
        accepted_by: user.id
      })
      .eq('id', invite.id);

    if (updateInviteError) {
      console.error('Warning: Failed to mark invite as accepted:', updateInviteError);
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully'
    });

  } catch (err: any) {
    console.error('Accept Invite API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
