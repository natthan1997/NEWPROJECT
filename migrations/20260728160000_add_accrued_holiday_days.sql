ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accrued_holiday_days NUMERIC DEFAULT 0;
