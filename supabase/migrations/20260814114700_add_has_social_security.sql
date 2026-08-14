-- Add has_social_security column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_social_security BOOLEAN DEFAULT false;
