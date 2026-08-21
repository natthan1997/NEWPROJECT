import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import crypto from 'crypto';

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

    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Resolve merchant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('merchant_id, role')
      .eq('id', user.id)
      .maybeSingle();

    const merchantId = profile?.merchant_id;
    const isOwnerOrAdmin = profile?.role === 'owner' || profile?.role === 'super' || profile?.role === 'admin';
    if (!merchantId || !isOwnerOrAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only owners or admins can invite staff' }, { status: 403 });
    }

    // 3. Parse payload
    const body = await req.json();
    const { role, branchCode } = body;

    if (!role) {
      return NextResponse.json({ success: false, error: 'Missing required field: role' }, { status: 400 });
    }

    // 4. Generate random secure token
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 5. Insert invite record
    const { data: invite, error: insertError } = await supabaseAdmin
      .from('pos_staff_invites')
      .insert({
        merchant_id: merchantId,
        token,
        role,
        branch_code: branchCode || null,
        created_by: user.id,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://101-blush.vercel.app').replace(/\/$/, '');
    const inviteLink = `${appUrl}/staff/accept-invite?token=${token}`;

    return NextResponse.json({
      success: true,
      inviteLink,
      token,
      expiresAt: expiresAt.toISOString()
    });

  } catch (err: any) {
    console.error('Invite API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
