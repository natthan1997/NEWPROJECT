ALTER TABLE pos_orders ADD COLUMN estimated_prep_completion TIMESTAMPTZ; ALTER TABLE pos_orders ADD COLUMN delivery_distance_km NUMERIC;
