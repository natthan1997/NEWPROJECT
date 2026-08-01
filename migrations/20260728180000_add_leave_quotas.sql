-- Add quota columns for labor law compliance
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS quota_sick_leave integer DEFAULT 30;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS quota_personal_leave integer DEFAULT 3;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS quota_annual_leave integer DEFAULT 6;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS quota_public_holiday integer DEFAULT 13;
