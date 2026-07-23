-- Rollback: Remove image_url from loyalty coupons and member coupons tables
ALTER TABLE pos_loyalty_coupons DROP COLUMN IF EXISTS image_url;
ALTER TABLE pos_member_coupons DROP COLUMN IF EXISTS image_url;
