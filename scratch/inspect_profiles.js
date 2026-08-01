const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

const DAY_MAP = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

async function testFullEligibilityFlow() {
  const branchId = '1f3fc496-d89e-4323-a66e-4fcd555444e9';
  const nowBangkok = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const todayDayOfWeek = DAY_MAP[nowBangkok.getDay()];

  let targetBranchCode = null;
  if (branchId) {
    const { data: bData } = await supabase
      .from('branches')
      .select('branch_code')
      .eq('id', branchId)
      .maybeSingle();

    if (bData?.branch_code) {
      targetBranchCode = bData.branch_code;
    } else {
      targetBranchCode = branchId;
    }
  }

  const { data: allStaff } = await supabase
    .from('profiles')
    .select('id, display_name, email, role, staff_level, staff_type, department, is_active, is_pos_device, is_pos_account, work_days, rest_days, branch_code');

  const realStaff = (allStaff || []).filter(s => {
    if (s.is_pos_device || s.is_pos_account) return false;
    if (s.is_active === false) return false;

    const r = (s.role || '').toLowerCase();
    if (r === 'customer') return false;

    const st = (s.staff_type || '').toLowerCase();
    if (st !== 'cafe') return false;

    if (targetBranchCode && s.branch_code && s.branch_code !== targetBranchCode && s.branch_code !== branchId) {
      return false;
    }

    return true;
  });

  const scheduledStaff = realStaff.filter(s => {
    // Check rest_days first if present
    if (s.rest_days && Array.isArray(s.rest_days) && s.rest_days.length > 0) {
      const todayFullDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][nowBangkok.getDay()];
      const isRestDay = s.rest_days.some(rd => String(rd).toLowerCase() === todayFullDay || String(rd).toLowerCase().slice(0, 3) === todayDayOfWeek);
      if (isRestDay) return false;
    }

    if (!s.work_days || !Array.isArray(s.work_days) || s.work_days.length === 0) {
      return true;
    }
    const normalizedDays = s.work_days.map(d => String(d).toLowerCase().slice(0, 3));
    return normalizedDays.includes(todayDayOfWeek);
  });

  console.log(`Resolved Target Branch Code: ${targetBranchCode}`);
  console.log(`Today is: ${todayDayOfWeek}`);
  console.log(`Scheduled Cafe Staff count today: ${scheduledStaff.length}`);
  console.log('Scheduled Cafe Staff names:', scheduledStaff.map(s => s.display_name));
}

testFullEligibilityFlow();
