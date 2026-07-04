import fs from 'fs';

const filePath = 'components/pos/POSReports.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update voidOrdersData query
content = content.replace(
    `.gte('created_at', startISO).lte('created_at', endISO)`,
    `.gte('updated_at', startISO).lte('updated_at', endISO)`
);

// Update allOrders query
content = content.replace(
    `const { data: allOrders } = await supabase.from('pos_orders').select('*').gte('created_at', startISO).lte('created_at', endISO).in('status', ['paid', 'completed'])`,
    `const { data: allOrders } = await supabase.from('pos_orders').select('*').gte('updated_at', startISO).lte('updated_at', endISO).in('status', ['paid', 'completed'])`
);

// Update compare orders query
content = content.replace(
    `.gte('created_at', compareStartISO)\n          .lte('created_at', compareEndISO)`,
    `.gte('updated_at', compareStartISO)\n          .lte('updated_at', compareEndISO)`
);

// Wait, the voidOrdersData might be on a single line or multiline. The first replace will handle it if it matches exactly.
// Let's do a more robust string replacement for all .gte('created_at', startISO).lte('created_at', endISO) etc.
fs.writeFileSync(filePath, content);
console.log('updated POSReports');
