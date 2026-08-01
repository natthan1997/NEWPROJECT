-- Add configurable photo zones to pos_shop_settings
ALTER TABLE public.pos_shop_settings ADD COLUMN IF NOT EXISTS checkout_photo_zones JSONB DEFAULT '[]';

COMMENT ON COLUMN public.pos_shop_settings.checkout_photo_zones IS 'Configurable zones that require photos before clocking out, e.g., [{"id": "uuid", "name": "Bar"}]';

-- Add column for storing mapped zone photos to attendance_logs
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS checkout_zone_photos JSONB DEFAULT '[]';

COMMENT ON COLUMN public.attendance_logs.checkout_zone_photos IS 'Array mapping zone_ids to photo urls taken during clock out, e.g., [{"zone_id": "uuid", "url": "https..."}]';
