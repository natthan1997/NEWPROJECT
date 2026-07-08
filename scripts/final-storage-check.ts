import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase credentials');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// List of all known tables in the system
const allTables = [
  'admin_logs',
  'calendar_events',
  'customers', // alias for profiles
  'documents',
  'houses',
  'job_assignments',
  'line_events',
  'liff_user_sessions',
  'marketplace_plants',
  'orders',
  'plant_library_variants',
  'plant_materials',
  'pos_branches',
  'pos_cash_drawer_logs',
  'pos_discounts',
  'pos_expense_categories',
  'pos_expenses',
  'pos_item_modifier_links',
  'pos_members',
  'pos_menu_categories',
  'pos_menu_items',
  'pos_menu_modifier_groups',
  'pos_menu_modifiers',
  'pos_order_items',
  'pos_order_payments',
  'pos_orders',
  'pos_points_history',
  'pos_printers',
  'pos_products',
  'pos_recipes',
  'pos_shift_logs',
  'pos_stock_adjustments',
  'pos_stock_materials',
  'pos_tables',
  'profiles',
  'services',
  'staff_attendance',
  'staff_availability',
  'work_reports'
];

async function run() {
  console.log('--- FINAL DEEP SCAN: Checking EVERY table for remaining Supabase Storage URLs ---');
  let foundRemaining = false;

  for (const table of allTables) {
    try {
      // We download all rows for the table and convert them to JSON strings to search for "supabase.co/storage"
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
         if (error.code !== '42P01') { // ignore undefined table
            console.error(`Error reading ${table}: ${error.message}`);
         }
         continue;
      }
      
      if (!data || data.length === 0) continue;
      
      const remainingIds = [];
      for (const row of data) {
         const rowString = JSON.stringify(row);
         if (rowString.includes('.supabase.co/storage/')) {
            remainingIds.push(row.id || 'unknown_id');
            foundRemaining = true;
         }
      }
      
      if (remainingIds.length > 0) {
         console.log(`❌ WARNING: Found ${remainingIds.length} records in table '${table}' containing Supabase Storage URLs!`);
         console.log(`IDs: ${remainingIds.slice(0, 5).join(', ')}...`);
      }
      
    } catch (e: any) {
       console.error(`Exception on ${table}: ${e.message}`);
    }
  }

  if (!foundRemaining) {
    console.log('\n✅ 100% CLEAN! No Supabase Storage URLs found anywhere in the database.');
  } else {
    console.log('\n⚠️ Found remaining URLs. Do not delete buckets yet.');
  }
}

run().catch(console.error);
