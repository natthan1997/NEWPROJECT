ALTER TABLE pos_loyalty_coupons 
ADD COLUMN IF NOT EXISTS min_order_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_discount_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS excluded_categories JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS excluded_items JSONB DEFAULT '[]'::jsonb;

ALTER TABLE pos_member_coupons 
ADD COLUMN IF NOT EXISTS min_order_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_discount_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS excluded_categories JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS excluded_items JSONB DEFAULT '[]'::jsonb;
