import fs from 'fs';

const filePath = 'lib/posOrderIdentity.ts';
let content = fs.readFileSync(filePath, 'utf8');

const target = `  // 1. Check if there are any active orders today
  let activeOrdersQuery = supabase
    .from('pos_orders')
    .select('id')
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .gte('created_at', startOfDayIso)
    .limit(1)

  if (options.shiftId) {
    activeOrdersQuery = activeOrdersQuery.eq('shift_id', options.shiftId)
  } else if (options.branchId) {
    activeOrdersQuery = activeOrdersQuery.eq('branch_id', options.branchId)
  }

  const { data: activeOrders } = await activeOrdersQuery
  const hasActiveOrders = activeOrders && activeOrders.length > 0

  let latestQueue = 0

  if (hasActiveOrders) {
    // 2. Find the max queue_number for TODAY
    let queueQuery = supabase
      .from('pos_orders')
      .select('queue_number')
      .not('queue_number', 'is', null)
      .neq('status', 'cancelled')
      .gte('created_at', startOfDayIso)
      .order('queue_number', { ascending: false })
      .limit(1)`;

const replacement = `  let latestQueue = 0

  // Find the max queue_number for TODAY, regardless of active orders
  let queueQuery = supabase
    .from('pos_orders')
    .select('queue_number')
    .not('queue_number', 'is', null)
    .neq('status', 'cancelled')
    .gte('created_at', startOfDayIso)
    .order('queue_number', { ascending: false })
    .limit(1)`;

content = content.replace(target, replacement);

fs.writeFileSync(filePath, content);
console.log('Fixed posOrderIdentity');
