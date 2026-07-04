import fs from 'fs';

const filePath = 'lib/posOrderIdentity.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Restore the activeOrders check for latestQueue
const latestQueueRegex = /let latestQueue = 0\s*\/\/ Find the max queue_number for TODAY, regardless of active orders\s*let queueQuery = supabase([\s\S]*?)latestQueue = normalizeQueueNumber\(latestQueueResult\.data\?\.queue_number\) \|\| 0/m;

const restoredQueueLogic = `  // 1. Check if there are any active orders today
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
    let queueQuery = supabase$1    latestQueue = normalizeQueueNumber(latestQueueResult.data?.queue_number) || 0
  }`;

content = content.replace(latestQueueRegex, restoredQueueLogic);

// Change how orderNumber is generated
const orderNumLogic = `  if (!existingOrderNumber) {
    if (options.orderType === 'dine_in' && options.tableName) {
      orderNumber = options.tableName
    } else {
      orderNumber = \`A\${String(queueNumber).padStart(3, '0')}\`
    }
  }`;

const newOrderNumLogic = `  if (!existingOrderNumber) {
    if (options.orderType === 'dine_in' && options.tableName) {
      orderNumber = options.tableName
    } else {
      orderNumber = fallbackOrderNumber(prefix)
    }
  }`;

content = content.replace(orderNumLogic, newOrderNumLogic);

fs.writeFileSync(filePath, content);
console.log('Restored identity logic');
