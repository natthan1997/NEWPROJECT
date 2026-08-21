-- Create public.pos_staff_invites table
CREATE TABLE IF NOT EXISTS public.pos_staff_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.pos_merchants(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'staff',
    branch_code TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.pos_staff_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read invites by token" ON public.pos_staff_invites;
DROP POLICY IF EXISTS "Allow admins/managers to manage invites" ON public.pos_staff_invites;

-- Create policies
CREATE POLICY "Allow public read invites by token" ON public.pos_staff_invites
    FOR SELECT USING (true); -- Anyone can read invite details by checking token

CREATE POLICY "Allow admins/managers to manage invites" ON public.pos_staff_invites
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
              AND public.profiles.merchant_id = public.pos_staff_invites.merchant_id
              AND (public.profiles.role = 'owner' OR public.profiles.role = 'super' OR public.profiles.role = 'admin')
        )
    );
