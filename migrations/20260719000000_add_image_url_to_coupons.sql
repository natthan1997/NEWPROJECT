-- Add image_url to loyalty coupons and member coupons tables
ALTER TABLE pos_loyalty_coupons ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE pos_member_coupons ADD COLUMN IF NOT EXISTS image_url TEXT;
