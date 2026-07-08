-- Create pos_loyalty_titles table
CREATE TABLE IF NOT EXISTS pos_loyalty_titles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- e.g., 'menu_quantity', 'total_visits', 'total_spend'
    rule_target TEXT, -- e.g., menu item ID, category ID, or NULL
    rule_threshold INTEGER NOT NULL,
    badge_color TEXT DEFAULT '#111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pos_loyalty_coupons table
CREATE TABLE IF NOT EXISTS pos_loyalty_coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    cost_points INTEGER NOT NULL,
    discount_type TEXT DEFAULT 'free_item', -- 'free_item', 'percent', 'fixed'
    discount_value DECIMAL(12,2),
    applicable_categories JSONB DEFAULT '[]'::jsonb, -- Array of category IDs
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pos_loyalty_campaigns table
CREATE TABLE IF NOT EXISTS pos_loyalty_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    multiplier DECIMAL(4,2) DEFAULT 1.0,
    applicable_categories JSONB DEFAULT '[]'::jsonb, -- Array of category IDs or 'all'
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modify pos_members
ALTER TABLE pos_members ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE pos_members ADD COLUMN IF NOT EXISTS total_visits INTEGER DEFAULT 0;
ALTER TABLE pos_members ADD COLUMN IF NOT EXISTS lifetime_spend DECIMAL(12,2) DEFAULT 0;

-- Create pos_member_coupons
CREATE TABLE IF NOT EXISTS pos_member_coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES pos_members(id) ON DELETE CASCADE,
    coupon_id UUID REFERENCES pos_loyalty_coupons(id) ON DELETE SET NULL,
    coupon_name TEXT,
    discount_type TEXT,
    discount_value DECIMAL(12,2),
    applicable_categories JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active', -- 'active', 'used', 'expired'
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop policies if exists
DROP POLICY IF EXISTS "Allow all for pos_loyalty_titles" ON pos_loyalty_titles;
DROP POLICY IF EXISTS "Allow all for pos_loyalty_coupons" ON pos_loyalty_coupons;
DROP POLICY IF EXISTS "Allow all for pos_loyalty_campaigns" ON pos_loyalty_campaigns;
DROP POLICY IF EXISTS "Allow all for pos_member_coupons" ON pos_member_coupons;

-- Enable RLS
ALTER TABLE pos_loyalty_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_loyalty_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_loyalty_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_member_coupons ENABLE ROW LEVEL SECURITY;

-- Create generous policies for POS environment
CREATE POLICY "Allow all for pos_loyalty_titles" ON pos_loyalty_titles FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for pos_loyalty_coupons" ON pos_loyalty_coupons FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for pos_loyalty_campaigns" ON pos_loyalty_campaigns FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for pos_member_coupons" ON pos_member_coupons FOR ALL TO public USING (true) WITH CHECK (true);

-- Grant privileges
GRANT ALL ON TABLE pos_loyalty_titles TO anon, authenticated, service_role;
GRANT ALL ON TABLE pos_loyalty_coupons TO anon, authenticated, service_role;
GRANT ALL ON TABLE pos_loyalty_campaigns TO anon, authenticated, service_role;
GRANT ALL ON TABLE pos_member_coupons TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
