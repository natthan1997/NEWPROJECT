import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // We use the Service Role key to securely fetch KPI stats 
    // without relying on flaky client-side JWTs that might expire or be missing.
    // The route itself is protected by Next.js middleware.
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string, 
        process.env.SUPABASE_SERVICE_ROLE_KEY as string
    );
    
    const { profileId, branchCode } = await req.json();

    if (!profileId || !branchCode) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Fetch branch and profile in parallel
    const [branchRes, profileRes] = await Promise.all([
        supabase.from('branches').select('id, gamification_settings').eq('branch_code', branchCode).maybeSingle(),
        supabase.from('profiles').select('shift_start').eq('id', profileId).maybeSingle()
    ]);

    const branch = branchRes.data;
    const profile = profileRes.data;
    
    const branchId = branch?.id;
    const settings = branch?.gamification_settings || {
        salesTarget: 100000,
        salesReward: "โบนัสทีม 5,000.-",
        attendanceTarget: 3,
        attendanceReward: "เบี้ยขยัน 1,000.-",
        memberTarget: 200,
        memberReward: "โบนัสพิเศษ 2,000.-"
    };

    // 2. Setup date ranges for current month
    const now = new Date();
    // Use Thailand Timezone offset (+7 hours) for start/end of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const startISO = startOfMonth.toISOString();
    const endISO = endOfMonth.toISOString();

    let totalSales = 0;
    let lateDays = 0;
    let newMembers = 0;

    // 3. Fetch KPI data in parallel
    let ordersPromise: any = Promise.resolve({ data: null });
    let membersPromise: any = Promise.resolve({ count: 0 });

    if (branchId) {
        ordersPromise = supabase
            .from('pos_orders')
            .select('net_total')
            .eq('branch_id', branchId)
            .in('status', ['paid', 'completed'])
            .gte('created_at', startISO)
            .lte('created_at', endISO);
        
        membersPromise = supabase
            .from('pos_members')
            .select('*', { count: 'exact', head: true })
            .not('phone', 'is', null)
            .eq('pdpa_consent', true);
    }

    const attendancePromise = supabase
        .from('attendance_logs')
        .select('timestamp')
        .eq('profile_id', profileId)
        .eq('type', 'check_in')
        .gte('created_at', startISO)
        .lte('created_at', endISO);

    const [ordersRes, membersRes, attendanceLogsRes] = await Promise.all([
        ordersPromise,
        membersPromise,
        attendancePromise
    ]);

    // Process Orders
    if (ordersRes.data) {
        totalSales = ordersRes.data.reduce((sum: number, order: any) => sum + (Number(order.net_total) || 0), 0);
    }

    // Process Members
    newMembers = membersRes.count || 0;

    // Process Attendance
    const shiftStartStr = profile?.shift_start || '09:00'; // Default if null
    let shiftHr = 9, shiftMin = 0;
    if (shiftStartStr.includes(':')) {
        const parts = shiftStartStr.split(':').map(Number);
        shiftHr = parts[0] || 9;
        shiftMin = parts[1] || 0;
    } else {
        shiftHr = Number(shiftStartStr) || 9;
    }

    const attendanceLogs = attendanceLogsRes.data;
    
    if (attendanceLogs) {
        const checkedDays = new Set();
        for (const log of attendanceLogs) {
            const checkInTime = new Date(log.timestamp);
            
            // Convert to BKK time (UTC+7)
            const bkkTime = new Date(checkInTime.getTime() + (7 * 60 * 60 * 1000));
            const dateStr = bkkTime.toISOString().split('T')[0];
            
            if (!checkedDays.has(dateStr)) {
                const targetMins = (shiftHr * 60) + shiftMin;
                const checkInMins = (bkkTime.getUTCHours() * 60) + bkkTime.getUTCMinutes();
                
                // If they checked in AFTER the grace period (1 min)
                if (checkInMins > targetMins + 1) { 
                    lateDays += 1;
                }
                checkedDays.add(dateStr);
            }
        }
    }

    return NextResponse.json({
        success: true,
        data: {
            salesProgress: totalSales,
            salesTarget: settings.salesTarget,
            salesReward: settings.salesReward,
            attendanceProgress: lateDays,
            attendanceTarget: settings.attendanceTarget,
            attendanceReward: settings.attendanceReward,
            memberProgress: newMembers,
            memberTarget: settings.memberTarget,
            memberReward: settings.memberReward
        }
    });

  } catch (err: any) {
    console.error('Error in gamification-kpi:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
