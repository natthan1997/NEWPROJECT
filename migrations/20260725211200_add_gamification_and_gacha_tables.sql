-- Gamification, Gacha, and Weekly Missions

-- 1. Add gacha_tickets to pos_members
ALTER TABLE public.pos_members ADD COLUMN IF NOT EXISTS gacha_tickets INTEGER DEFAULT 0;

-- 2. gamification_missions table
CREATE TABLE IF NOT EXISTS public.gamification_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    condition_rules JSONB NOT NULL DEFAULT '{}',
    reward_tickets INTEGER DEFAULT 1,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.gamification_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read gamification_missions" ON public.gamification_missions FOR SELECT USING (true);
CREATE POLICY "Allow all gamification_missions" ON public.gamification_missions FOR ALL USING (true) WITH CHECK (true);

-- 3. member_mission_progress table
CREATE TABLE IF NOT EXISTS public.member_mission_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.pos_members(id) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES public.gamification_missions(id) ON DELETE CASCADE,
    progress_data JSONB NOT NULL DEFAULT '{}',
    is_completed BOOLEAN DEFAULT false,
    claimed_at TIMESTAMPTZ,
    reset_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(member_id, mission_id)
);

ALTER TABLE public.member_mission_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read member_mission_progress" ON public.member_mission_progress FOR SELECT USING (true);
CREATE POLICY "Allow all member_mission_progress" ON public.member_mission_progress FOR ALL USING (true) WITH CHECK (true);

-- 4. gacha_rewards_pool table
CREATE TABLE IF NOT EXISTS public.gacha_rewards_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    reward_type TEXT NOT NULL, -- e.g. 'points', 'coupon', 'physical'
    item_id TEXT, -- e.g. coupon_id, or null if points
    value_points INTEGER DEFAULT 0, -- the point value for duplicate compensation or if type is 'points'
    probability_weight INTEGER DEFAULT 1,
    rarity_tier TEXT NOT NULL DEFAULT 'N', -- 'N', 'R', 'SR', 'UR'
    max_quantity INTEGER, -- null for unlimited
    current_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.gacha_rewards_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read gacha_rewards_pool" ON public.gacha_rewards_pool FOR SELECT USING (true);
CREATE POLICY "Allow all gacha_rewards_pool" ON public.gacha_rewards_pool FOR ALL USING (true) WITH CHECK (true);

-- 5. member_gacha_history table
CREATE TABLE IF NOT EXISTS public.member_gacha_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.pos_members(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES public.gacha_rewards_pool(id) ON DELETE SET NULL,
    is_pity BOOLEAN DEFAULT false,
    compensated_with_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.member_gacha_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read member_gacha_history" ON public.member_gacha_history FOR SELECT USING (true);
CREATE POLICY "Allow all member_gacha_history" ON public.member_gacha_history FOR ALL USING (true) WITH CHECK (true);
