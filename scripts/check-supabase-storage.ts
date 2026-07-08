import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase credentials');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRemaining() {
  const tablesToCheck = [
    { name: 'houses', col: 'image_url' },
    { name: 'marketplace_plants', col: 'image_url' },
    { name: 'plant_library_variants', col: 'image_url' },
    { name: 'documents', col: 'file_url' },
    { name: 'profiles', col: 'avatar_url' } // just in case
  ];

  let totalFound = 0;

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select(`id, ${table.col}`)
        .not(table.col, 'is', null)
        .like(table.col, '%.supabase.co/storage/%');

      if (error) {
         if (error.code !== '42P01') { // Ignore undefined table
           console.error(`Error checking ${table.name}:`, error.message);
         }
         continue;
      }

      if (data && data.length > 0) {
        console.log(`Table '${table.name}' still has ${data.length} records using Supabase Storage.`);
        totalFound += data.length;
      } else {
        console.log(`Table '${table.name}' is clean.`);
      }
    } catch (e: any) {
      console.error(`Exception checking ${table.name}:`, e.message);
    }
  }

  if (totalFound === 0) {
    console.log('\n✅ Great news! No remaining Supabase Storage URLs found in the checked tables.');
  } else {
    console.log(`\n⚠️ Found ${totalFound} remaining records across tables that still use Supabase Storage.`);
  }
}

checkRemaining().catch(console.error);
