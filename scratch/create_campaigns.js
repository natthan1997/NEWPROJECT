import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const envUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const envKey = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(envUrl, envKey);

async function run() {
  const sql = `
  CREATE TABLE IF NOT EXISTS public.pos_loyalty_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    point_multiplier NUMERIC NOT NULL DEFAULT 1.0,
    applicable_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );
  `;
  const { data, error } = await supabase.rpc('run_migration', { query: sql });
  if (error) {
    console.log("RPC Error:", error);
    // Let's just create an API route to run it since RPC might not exist.
  } else {
    console.log("Success:", data);
  }
}
run();
