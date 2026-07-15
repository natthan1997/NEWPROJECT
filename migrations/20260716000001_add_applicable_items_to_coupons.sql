-- Migration to add applicable_items to pos_loyalty_coupons and pos_member_coupons
ALTER TABLE pos_loyalty_coupons ADD COLUMN IF NOT EXISTS applicable_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE pos_member_coupons ADD COLUMN IF NOT EXISTS applicable_items JSONB DEFAULT '[]'::jsonb;
