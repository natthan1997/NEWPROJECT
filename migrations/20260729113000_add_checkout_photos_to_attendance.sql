-- Add checkout_photo_urls array to attendance_logs
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS checkout_photo_urls TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.attendance_logs.checkout_photo_urls IS 'Array of photo URLs taken by the staff during clock out for discipline and zone checks';
