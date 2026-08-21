-- Migration: Add numeric merchant_code to pos_merchants
-- Run this in the Supabase SQL Editor

-- 1. Create sequence starting at 3399100
CREATE SEQUENCE IF NOT EXISTS merchant_code_seq START WITH 3399100;

-- 2. Add column merchant_code to pos_merchants
ALTER TABLE pos_merchants 
ADD COLUMN IF NOT EXISTS merchant_code integer UNIQUE DEFAULT nextval('merchant_code_seq');

-- 3. Show the generated codes for current merchants
SELECT id, name, merchant_code FROM pos_merchants;

-- 4. Refresh schema cache
NOTIFY pgrst, 'reload schema';
