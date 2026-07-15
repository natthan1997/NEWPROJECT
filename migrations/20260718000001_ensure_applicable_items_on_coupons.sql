-- Migration: Ensure applicable_items exists on both pos_loyalty_coupons and pos_member_coupons
ALTER TABLE public.pos_loyalty_coupons ADD COLUMN IF NOT EXISTS applicable_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.pos_member_coupons ADD COLUMN IF NOT EXISTS applicable_items JSONB DEFAULT '[]'::jsonb;
