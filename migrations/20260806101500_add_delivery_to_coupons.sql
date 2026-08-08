ALTER TABLE pos_loyalty_coupons
ADD COLUMN IF NOT EXISTS is_applicable_delivery BOOLEAN DEFAULT true;
