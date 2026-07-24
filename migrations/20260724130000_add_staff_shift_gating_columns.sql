-- Add is_pos_device and work_days to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_pos_device BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS work_days JSONB DEFAULT '["mon", "tue", "wed", "thu", "fri", "sat", "sun"]'::jsonb;

-- Create table for emergency leave overrides
CREATE TABLE IF NOT EXISTS public.pos_staff_leave_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    reason TEXT DEFAULT 'Emergency Leave',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, date)
);

-- RLS Policies
ALTER TABLE public.pos_staff_leave_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for pos_staff_leave_overrides" ON public.pos_staff_leave_overrides;
CREATE POLICY "Allow all for pos_staff_leave_overrides" ON public.pos_staff_leave_overrides FOR ALL TO public USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.pos_staff_leave_overrides TO anon, authenticated, service_role;
