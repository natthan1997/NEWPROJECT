import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.development.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL.trim();
dotenv.config({ path: '.env.local' });
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function addColumn() {
  const { error } = await supabase.rpc('execute_sql', {
    query: `ALTER TABLE public.pos_tables ADD COLUMN IF NOT EXISTS allow_after_hours BOOLEAN DEFAULT false;`
  });
  
  if (error) {
    console.log("RPC failed:", error.message);
  } else {
    console.log("RPC executed successfully. Column added.");
  }
}
addColumn();
