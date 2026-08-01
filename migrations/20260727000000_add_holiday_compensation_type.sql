ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS holiday_compensation_type TEXT DEFAULT 'money' CHECK (holiday_compensation_type IN ('money', 'dayoff'));
