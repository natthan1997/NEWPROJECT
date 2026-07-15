-- Safe SQL script to enable Supabase Realtime replication for all POS & Kitchen tables
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
