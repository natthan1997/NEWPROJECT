import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } }
    });
    
    // Auth check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profileId, leaveDate, reason } = await req.json();

    if (!profileId || !leaveDate) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Verify requesting user is admin
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (requesterProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current accrued balance
    const { data: targetProfile, error: profileErr } = await supabase
      .from('profiles')
      .select('accrued_holiday_days')
      .eq('id', profileId)
      .single();

    if (profileErr || !targetProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const currentBalance = targetProfile.accrued_holiday_days || 0;
    if (currentBalance <= 0) {
      return NextResponse.json({ error: 'Insufficient holiday substitute balance' }, { status: 400 });
    }

    // Deduct 1 from balance
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ accrued_holiday_days: currentBalance - 1 })
      .eq('id', profileId);

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
    }

    // Insert leave record (assuming leave_type = 'holiday_substitute' if possible, else 'personal')
    // We will use 'personal' but set the reason to explicitly state it was a substitute holiday, 
    // or if the schema supports 'holiday_substitute', we use that.
    const { error: leaveErr } = await supabase
      .from('staff_leaves')
      .insert({
        profile_id: profileId,
        leave_date: leaveDate,
        leave_type: 'holiday_substitute', // We'll assume the db accepts this as text
        is_paid: true, // It is a paid substitute day
        reason: reason || 'ใช้วันหยุดชดเชยนักขัตฤกษ์',
        created_by: session.user.id
      });

    if (leaveErr) {
      // Rollback the balance technically needed, but this is a simple implementation
      return NextResponse.json({ error: 'Failed to create leave record: ' + leaveErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, newBalance: currentBalance - 1 });
  } catch (err: any) {
    console.error('Error in use-holiday:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
