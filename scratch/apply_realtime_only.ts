import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import pg from 'pg'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sql = `
do $$
begin
  -- 1. pos_orders
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pos_orders'
  ) then
    alter publication supabase_realtime add table pos_orders;
  end if;

  -- 2. pos_shifts
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pos_shifts'
  ) then
    alter publication supabase_realtime add table pos_shifts;
  end if;

  -- 3. pos_shop_settings
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pos_shop_settings'
  ) then
    alter publication supabase_realtime add table pos_shop_settings;
  end if;

  -- 4. pos_order_payments
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pos_order_payments'
  ) then
    alter publication supabase_realtime add table pos_order_payments;
  end if;

  -- 5. pos_shift_transactions
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pos_shift_transactions'
  ) then
    alter publication supabase_realtime add table pos_shift_transactions;
  end if;

  -- 6. pos_tables
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pos_tables'
  ) then
    alter publication supabase_realtime add table pos_tables;
  end if;

  -- 7. pos_menu_items
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pos_menu_items'
  ) then
    alter publication supabase_realtime add table pos_menu_items;
  end if;

  -- 8. pos_promotions
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pos_promotions'
  ) then
    alter publication supabase_realtime add table pos_promotions;
  end if;

  -- 9. pos_members
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pos_members'
  ) then
    alter publication supabase_realtime add table pos_members;
  end if;

  -- 10. pos_points_history
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pos_points_history'
  ) then
    alter publication supabase_realtime add table pos_points_history;
  end if;

  -- 11. pos_member_coupons
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pos_member_coupons'
  ) then
    alter publication supabase_realtime add table pos_member_coupons;
  end if;
end $$;
`

async function run() {
  console.log('🔄 Executing Realtime replication SQL script directly via PostgreSQL connection...')
  
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set in .env files.')
    process.exit(1)
  }

  const { Client } = pg
  const client = new Client({ connectionString })
  await client.connect()
  try {
    await client.query(sql)
    console.log('✅ Successfully executed SQL and enabled realtime replication for all POS & Kitchen tables!')
  } catch (pgErr) {
    console.error('❌ Direct postgres query failed:', pgErr)
  } finally {
    await client.end()
  }
}

run()
