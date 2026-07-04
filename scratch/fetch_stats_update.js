import fs from 'fs';

const filePath = 'app/dashboard/pos/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `    let ordersQuery = supabase
      .from('pos_orders')
      .select('status, net_total, total_amount, payment_method, discount_amount, paid_at, branch_id, pos_order_payments(amount, payment_method)')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())`;
      
const replacement = `    let ordersQuery = supabase
      .from('pos_orders')
      .select('status, net_total, total_amount, payment_method, discount_amount, paid_at, branch_id, pos_order_payments(amount, payment_method)')
      .gte('updated_at', start.toISOString())
      .lt('updated_at', end.toISOString())`;

content = content.replace(target, replacement);

fs.writeFileSync(filePath, content);
console.log('page.tsx updated');
