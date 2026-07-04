import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.trim()
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY.trim()

const supabase = createClient(supabaseUrl, supabaseKey)

const sql = `
-- 1. Create Tiers Table
CREATE TABLE IF NOT EXISTS public.member_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0,
  earn_multiplier NUMERIC DEFAULT 1.0,
  discount_percent NUMERIC DEFAULT 0,
  benefits JSONB DEFAULT '[]'::jsonb,
  color_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Tiers if empty
INSERT INTO public.member_tiers (name, min_points, earn_multiplier, discount_percent, color_code, benefits)
SELECT 'Seed', 0, 1.0, 0, '#86efac', '["Base Earning Rate"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.member_tiers WHERE name = 'Seed');

INSERT INTO public.member_tiers (name, min_points, earn_multiplier, discount_percent, color_code, benefits)
SELECT 'Sprout', 500, 1.2, 0, '#4ade80', '["1.2x Earning Rate", "Free Birthday Drink Coupon"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.member_tiers WHERE name = 'Sprout');

INSERT INTO public.member_tiers (name, min_points, earn_multiplier, discount_percent, color_code, benefits)
SELECT 'Tree', 2000, 1.5, 5, '#22c55e', '["1.5x Earning Rate", "5% Off All Orders", "Birthday Drink & Cake"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.member_tiers WHERE name = 'Tree');

INSERT INTO public.member_tiers (name, min_points, earn_multiplier, discount_percent, color_code, benefits)
SELECT 'Bloom', 5000, 2.0, 10, '#16a34a', '["2x Earning Rate", "10% Off All Orders", "Free Annual Workshop"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.member_tiers WHERE name = 'Bloom');

-- 2. Create Reward Catalogs Table
CREATE TABLE IF NOT EXISTS public.reward_catalogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT -1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Member Stamps Table (for 10 get 1 free)
CREATE TABLE IF NOT EXISTS public.member_stamps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_stamps INTEGER DEFAULT 0,
  total_cards_completed INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. Create Member Vouchers Table
CREATE TABLE IF NOT EXISTS public.member_vouchers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Update Profiles Table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES public.member_tiers(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_accumulated_points INTEGER DEFAULT 0;

-- 6. Enable RLS and Policies for new tables
ALTER TABLE public.member_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_vouchers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for member_tiers') THEN
        CREATE POLICY "Public read access for member_tiers" ON public.member_tiers FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for reward_catalogs') THEN
        CREATE POLICY "Public read access for reward_catalogs" ON public.reward_catalogs FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own stamps') THEN
        CREATE POLICY "Users can view own stamps" ON public.member_stamps FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own vouchers') THEN
        CREATE POLICY "Users can view own vouchers" ON public.member_vouchers FOR SELECT USING (auth.uid() = user_id);
    END IF;
END
$$;
`

async function run() {
  console.log('Running SQL Migration for Loyalty Program...')
  const { data, error } = await supabase.rpc('exec_sql', { query: sql })
  
  if (error) {
    console.error('Error applying migration via exec_sql:', error)
  } else {
    console.log('Loyalty Program Migration Applied Successfully!')
  }
}

run()
