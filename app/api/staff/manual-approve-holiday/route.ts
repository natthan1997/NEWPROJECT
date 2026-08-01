import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Use SERVICE_ROLE_KEY to bypass RLS for internal POS endpoint
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const { logId, status } = await req.json();

    if (!logId) {
      return NextResponse.json({ error: 'Missing logId' }, { status: 400 });
    }

    // Get current log
    const { data: log, error: logErr } = await supabase
      .from('attendance_logs')
      .select('id, profile_id, holiday_pay_status')
      .eq('id', logId)
      .single();

    if (logErr || !log) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    const oldStatus = log.holiday_pay_status;
    const profileId = log.profile_id;

    // Get current profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('accrued_holiday_days, holiday_compensation_type')
      .eq('id', profileId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Determine the status automatically if none provided (from the new single button)
    let newStatus = status;
    if (!newStatus) {
        newStatus = profile.holiday_compensation_type === 'dayoff' ? 'approved_dayoff' : 'approved_pay';
    }

    let currentBalance = Number(profile.accrued_holiday_days) || 0;

    // If changing TO approved_dayoff and it wasn't before, increment
    if (newStatus === 'approved_dayoff' && oldStatus !== 'approved_dayoff') {
        currentBalance += 1;
    }
    // If changing FROM approved_dayoff to something else, decrement
    else if (oldStatus === 'approved_dayoff' && newStatus !== 'approved_dayoff') {
        currentBalance = Math.max(0, currentBalance - 1);
    }

    // Update log
    const { error: updateLogErr } = await supabase.from('attendance_logs').update({
        holiday_pay_status: newStatus
    }).eq('id', logId);

    if (updateLogErr) {
        throw updateLogErr;
    }

    // Update profile
    const { error: updateProfileErr } = await supabase.from('profiles').update({
        accrued_holiday_days: currentBalance
    }).eq('id', profileId);

    if (updateProfileErr) {
        throw updateProfileErr;
    }

    return NextResponse.json({ success: true, newBalance: currentBalance, newStatus });
  } catch (err: any) {
    console.error('Error in manual-approve-holiday:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
