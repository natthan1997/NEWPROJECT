-- Migration: Migrate from placeholder '00000000-0000-0000-0000-000000000000' to a real production UUID
-- Run this in the Supabase SQL Editor

BEGIN;

-- 1. Create a temporary table to hold the newly generated UUID
CREATE TEMP TABLE new_merchant_info AS 
SELECT gen_random_uuid() AS new_id;

-- 2. Insert the new merchant record with the new UUID
INSERT INTO pos_merchants (id, name, logo_url, owner_id, created_at, updated_at)
SELECT new_id, 'XYL STUDIO', NULL, NULL, NOW(), NOW()
FROM new_merchant_info;

-- 3. Update all referencing tables to the new merchant UUID
UPDATE branches SET merchant_id = (SELECT new_id FROM new_merchant_info) WHERE merchant_id = '00000000-0000-0000-0000-000000000000';
UPDATE profiles SET merchant_id = (SELECT new_id FROM new_merchant_info) WHERE merchant_id = '00000000-0000-0000-0000-000000000000';
UPDATE pos_shop_settings SET merchant_id = (SELECT new_id FROM new_merchant_info) WHERE merchant_id = '00000000-0000-0000-0000-000000000000';
UPDATE pos_menu_items SET merchant_id = (SELECT new_id FROM new_merchant_info) WHERE merchant_id = '00000000-0000-0000-0000-000000000000';
UPDATE pos_menu_categories SET merchant_id = (SELECT new_id FROM new_merchant_info) WHERE merchant_id = '00000000-0000-0000-0000-000000000000';
UPDATE pos_orders SET merchant_id = (SELECT new_id FROM new_merchant_info) WHERE merchant_id = '00000000-0000-0000-0000-000000000000';
UPDATE pos_members SET merchant_id = (SELECT new_id FROM new_merchant_info) WHERE merchant_id = '00000000-0000-0000-0000-000000000000';
UPDATE pos_loyalty_coupons SET merchant_id = (SELECT new_id FROM new_merchant_info) WHERE merchant_id = '00000000-0000-0000-0000-000000000000';

-- 4. Safely delete the old placeholder merchant row
DELETE FROM pos_merchants WHERE id = '00000000-0000-0000-0000-000000000000';

-- 5. Output the new Merchant ID
SELECT new_id AS "New Merchant ID" FROM new_merchant_info;

COMMIT;
