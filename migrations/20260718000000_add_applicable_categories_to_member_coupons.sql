-- Migration: Re-create pos_member_coupons table cleanly to ensure all columns exist
DROP TABLE IF EXISTS public.pos_member_coupons CASCADE;

CREATE TABLE public.pos_member_coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES public.pos_members(id) ON DELETE CASCADE,
    coupon_id UUID REFERENCES public.pos_loyalty_coupons(id) ON DELETE SET NULL,
    coupon_name TEXT,
    discount_type TEXT,
    discount_value DECIMAL(12,2),
    applicable_categories JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active', -- 'active', 'claiming', 'used', 'expired'
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pos_member_coupons ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Allow all for pos_member_coupons" ON public.pos_member_coupons;
CREATE POLICY "Allow all for pos_member_coupons" ON public.pos_member_coupons FOR ALL TO public USING (true) WITH CHECK (true);

-- Enable realtime replication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pos_member_coupons'
  ) then
    alter publication supabase_realtime add table pos_member_coupons;
  end if;
end $$;
