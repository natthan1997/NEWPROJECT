const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: rows, error } = await supabase
    .from('pos_shop_settings')
    .select('*')
    .order('updated_at', { ascending: true });

  if (error) {
    console.error('Error fetching settings:', error);
    return;
  }

  console.log(`Found ${rows.length} rows in pos_shop_settings`);

  // Group by branch_id
  const byBranch = {};
  for (const row of rows) {
    const branch = row.branch_id || 'GLOBAL';
    if (!byBranch[branch]) byBranch[branch] = [];
    byBranch[branch].push(row);
  }

  for (const branch of Object.keys(byBranch)) {
    const branchRows = byBranch[branch];
    if (branchRows.length > 1) {
      console.log(`Branch ${branch} has ${branchRows.length} rows. Merging and cleaning up...`);
      // The oldest row likely has the original data. The newest rows might be empty/defaults created by bug.
      // We will merge properties from all rows, prioritizing the oldest ones if the new ones are empty arrays/objects, or we just keep the one that has role_permissions etc.
      let bestRow = null;
      let maxKeys = 0;
      for (const row of branchRows) {
         let keys = 0;
         if (row.role_permissions && Object.keys(row.role_permissions).length > 0) keys++;
         if (row.qr_tables && row.qr_tables.length > 0) keys++;
         if (row.receipt_header) keys++;
         if (row.printers && row.printers.length > 0) keys++;
         if (keys >= maxKeys) {
             maxKeys = keys;
             bestRow = row;
         }
      }
      
      console.log(`Best row for branch ${branch} is ${bestRow.id} with ${maxKeys} key settings.`);
      
      // Update best row to have updated_at = now() so it becomes the latest
      await supabase.from('pos_shop_settings').update({ updated_at: new Date().toISOString() }).eq('id', bestRow.id);

      // Delete the other rows
      for (const row of branchRows) {
        if (row.id !== bestRow.id) {
          console.log(`Deleting duplicate row ${row.id}`);
          await supabase.from('pos_shop_settings').delete().eq('id', row.id);
        }
      }
    } else {
      console.log(`Branch ${branch} has only 1 row. OK.`);
    }
  }
}

run().catch(console.error);
