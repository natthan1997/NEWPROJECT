const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const normalizeQueueNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null
}

async function simulate() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayIso = startOfDay.toISOString();
  
  const shiftId = '1c2e29ba-4162-467f-b93a-29c9a52322fb';
  
  let queueQuery = supabase
    .from('pos_orders')
    .select('queue_number, created_at')
    .not('queue_number', 'is', null)
    .gte('created_at', startOfDayIso)
    .eq('shift_id', shiftId)
    .order('queue_number', { ascending: false })
    .limit(1)

  const latestQueueResult = await queueQuery.maybeSingle()
  console.log('latestQueueResult:', latestQueueResult.data)
  
  const latestQueue = normalizeQueueNumber(latestQueueResult.data?.queue_number) || 0
  const queueNumber = latestQueue + 1
  
  console.log('Calculated queueNumber:', queueNumber);
}

simulate();
