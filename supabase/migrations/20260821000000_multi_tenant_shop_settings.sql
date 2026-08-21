-- Migration: Add merchant_id to pos_shop_settings and apply Multi-Tenant RLS
-- Run this in the Supabase SQL Editor

-- 1. Add the column
ALTER TABLE pos_shop_settings 
ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES pos_merchants(id) ON DELETE CASCADE;

-- 2. Drop old policies (if any)
DROP POLICY IF EXISTS "Enable read access for all users" ON pos_shop_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON pos_shop_settings;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON pos_shop_settings;
DROP POLICY IF EXISTS "Allow public read access to pos_shop_settings" ON pos_shop_settings;
DROP POLICY IF EXISTS "Allow authenticated to insert pos_shop_settings" ON pos_shop_settings;
DROP POLICY IF EXISTS "Allow authenticated to update pos_shop_settings" ON pos_shop_settings;

-- 3. Create Multi-Tenant Policies
-- For LIFF apps and public GPS checks, anonymous users need to read shop settings
CREATE POLICY "Allow public read access to pos_shop_settings" 
ON pos_shop_settings FOR SELECT 
USING (true);

-- For inserts, staff/admin must belong to the same merchant_id (if we enforce it at DB level, otherwise just authenticated)
CREATE POLICY "Allow authenticated to insert pos_shop_settings"
ON pos_shop_settings FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- For updates, ensure the authenticated user has access. 
-- You might want to restrict this further based on your specific multi-tenant logic.
CREATE POLICY "Allow authenticated to update pos_shop_settings"
ON pos_shop_settings FOR UPDATE
USING (auth.role() = 'authenticated');
