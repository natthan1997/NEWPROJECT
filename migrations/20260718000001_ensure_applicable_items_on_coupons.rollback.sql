-- Rollback: Remove applicable_items column from both tables
ALTER TABLE public.pos_loyalty_coupons DROP COLUMN IF EXISTS applicable_items;
ALTER TABLE public.pos_member_coupons DROP COLUMN IF EXISTS applicable_items;
