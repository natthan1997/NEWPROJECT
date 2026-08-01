require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// We need a simple mock of the holidays since getThaiHoliday is in TS
// We'll just define the specific holidays for 2026 that passed
// 2026-07-28 is King's Birthday
// 2026-07-20 is Asanha Bucha
// 2026-07-21 is Khao Phansa
// 2026-05-01 is Labor Day
// 2026-05-04 is Coronation Day
// 2026-06-03 is Queen Suthida's Birthday
// 2026-05-31 is Visakha Bucha

function getThaiHoliday(dateStr) {
    const d = new Date(dateStr);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const y = d.getFullYear();

    const holidays = {
        '2026-07-20': 'Asanha Bucha',
        '2026-07-21': 'Khao Phansa',
        '2026-07-28': 'King Vajiralongkorn Birthday',
        '2026-05-01': 'National Labour Day',
        '2026-05-04': 'Coronation Day',
        '2026-06-03': 'Queen Suthida Birthday',
        '2026-05-31': 'Visakha Bucha'
    };
    
    const key = `${y}-${m.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return holidays[key] || null;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

async function run() {
  console.log("Fetching profiles and logs to backfill retroactive holidays...");
  
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  const { data: logs, error: lErr } = await supabase.from('attendance_logs').select('*').eq('type', 'check_in');

  if (pErr || lErr) {
    console.error(pErr, lErr);
    process.exit(1);
  }

  const profileMap = {};
  profiles.forEach(p => profileMap[p.id] = p);

  const updates = {};
  const logUpdates = [];

  for (const log of logs) {
    const profile = profileMap[log.profile_id];
    if (!profile) continue;

    const holiday = getThaiHoliday(log.timestamp);
    if (holiday && log.holiday_pay_status !== 'rejected') {
        const wantsDayoff = profile.holiday_compensation_type === 'dayoff' || log.holiday_pay_status === 'approved_dayoff';
        
        if (wantsDayoff) {
            updates[log.profile_id] = (updates[log.profile_id] || 0) + 1;
            
            if (log.holiday_pay_status !== 'approved_dayoff') {
                logUpdates.push({
                    id: log.id,
                    holiday_pay_status: 'approved_dayoff'
                });
            }
        }
    }
  }

  console.log("Accrual counts to apply:", updates);
  console.log("Logs to update:", logUpdates.length);

  for (const [profileId, count] of Object.entries(updates)) {
    await supabase.from('profiles').update({ accrued_holiday_days: count }).eq('id', profileId);
  }

  for (const logUpdate of logUpdates) {
    await supabase.from('attendance_logs').update({ holiday_pay_status: 'approved_dayoff' }).eq('id', logUpdate.id);
  }

  console.log("Done backfilling retroactive holidays.");
}

run();
