-- Create pos_member_checkins table
CREATE TABLE IF NOT EXISTS public.pos_member_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    line_user_id TEXT NOT NULL,
    member_id UUID REFERENCES public.pos_members(id) ON DELETE CASCADE,
    customer_name TEXT,
    customer_image TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'linked', 'completed', 'cancelled'
    order_id UUID REFERENCES public.pos_orders(id) ON DELETE SET NULL,
    points_earned INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.pos_member_checkins ENABLE ROW LEVEL SECURITY;

-- Create generous policy for POS and LIFF environment
DROP POLICY IF EXISTS "Allow all for pos_member_checkins" ON public.pos_member_checkins;
CREATE POLICY "Allow all for pos_member_checkins" ON public.pos_member_checkins FOR ALL TO public USING (true) WITH CHECK (true);

-- Grant privileges
GRANT ALL ON TABLE public.pos_member_checkins TO anon, authenticated, service_role;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
