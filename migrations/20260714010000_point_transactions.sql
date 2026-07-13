CREATE TABLE IF NOT EXISTS public.pos_point_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES public.pos_members(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'earn', 'redeem', 'refund'
    points INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

ALTER TABLE public.pos_point_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for point_transactions" ON public.pos_point_transactions;
CREATE POLICY "Allow all for point_transactions" ON public.pos_point_transactions FOR ALL USING (true) WITH CHECK (true);
