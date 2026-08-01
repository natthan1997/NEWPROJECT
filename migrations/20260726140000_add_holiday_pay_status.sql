-- Add holiday_pay_status to attendance_logs
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS holiday_pay_status TEXT DEFAULT 'pending';
