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

    const { profileId, logId } = await req.json();

    if (!profileId || !logId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Get current profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('holiday_compensation_type, quota_public_holiday')
      .eq('id', profileId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only accrue if the setting is dayoff
    if (profile.holiday_compensation_type === 'dayoff') {
        const currentBalance = Number(profile.quota_public_holiday) || 0;
        
        // Update balance
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ quota_public_holiday: currentBalance + 1 })
          .eq('id', profileId);

        if (updateErr) {
            console.error('Failed to update accrued_holiday_days:', updateErr);
            return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
        }

        // Also explicitly set the attendance log status to approved_dayoff to prevent double accrual
        await supabase.from('attendance_logs').update({
            holiday_pay_status: 'approved_dayoff'
        }).eq('id', logId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in accrue-holiday:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
