-- Add rest_days to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rest_days text[] DEFAULT '{}';

-- Create staff_leaves table
CREATE TABLE IF NOT EXISTS public.staff_leaves (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    leave_date date NOT NULL,
    leave_type text NOT NULL, -- 'sick', 'personal', 'vacation'
    is_paid boolean DEFAULT false,
    reason text,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.staff_leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read staff_leaves" ON public.staff_leaves FOR SELECT USING (true);
CREATE POLICY "Allow admin/manager insert staff_leaves" ON public.staff_leaves FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin/manager update staff_leaves" ON public.staff_leaves FOR UPDATE USING (true);
CREATE POLICY "Allow admin/manager delete staff_leaves" ON public.staff_leaves FOR DELETE USING (true);

-- Add staff_leaves to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_leaves;
