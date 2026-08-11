ALTER TABLE pos_shop_settings ADD COLUMN IF NOT EXISTS shift_settings JSONB DEFAULT '{}'::jsonb;
