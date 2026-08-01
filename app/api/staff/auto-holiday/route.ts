import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Holidays from 'date-holidays';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string, {
        global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profileId, logId } = await req.json();

    if (!profileId || !logId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Use Thailand time for the date string to prevent timezone offset bugs
    const today = new Date();
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(today);

    // Use date-holidays library to check for Thai public holidays
    const hd = new Holidays('TH');
    const holidays = hd.getHolidays(today.getFullYear());
    const isHoliday = holidays.some(h => h.date.split(' ')[0] === todayStr);

    if (!isHoliday) {
      return NextResponse.json({ success: true, message: 'Not a public holiday' });
    }

    // Get current profile settings
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('holiday_compensation_type, quota_public_holiday')
      .eq('id', profileId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let nextStatus = 'approved_pay';

    if (profile.holiday_compensation_type === 'dayoff') {
        nextStatus = 'approved_dayoff';

        // Check if already accrued today to prevent double accrual (e.g. check-in then check-out)
        // Thailand time boundaries for UTC query
        const startOfDayUTC = new Date(`${todayStr}T00:00:00+07:00`).toISOString();
        const endOfDayUTC = new Date(`${todayStr}T23:59:59+07:00`).toISOString();

        const { data: existingLogs } = await supabase
          .from('attendance_logs')
          .select('id, holiday_pay_status')
          .eq('profile_id', profileId)
          .gte('timestamp', startOfDayUTC)
          .lte('timestamp', endOfDayUTC)
          .in('holiday_pay_status', ['approved_dayoff', 'approved_pay']);

        if (existingLogs && existingLogs.length > 0) {
             // Already accrued today, just update this log to match
             await supabase.from('attendance_logs').update({
                 holiday_pay_status: existingLogs[0].holiday_pay_status
             }).eq('id', logId);
             return NextResponse.json({ success: true, message: 'Already accrued today' });
        }

        const currentBalance = Number(profile.quota_public_holiday) || 0;
        
        // Auto increment balance
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ quota_public_holiday: currentBalance + 1 })
          .eq('id', profileId);

        if (updateErr) {
            console.error('Failed to update quota_public_holiday:', updateErr);
            return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
        }
    }

    // Update log status
    await supabase.from('attendance_logs').update({
        holiday_pay_status: nextStatus
    }).eq('id', logId);

    return NextResponse.json({ success: true, status: nextStatus });
  } catch (err: any) {
    console.error('Error in auto-holiday:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
