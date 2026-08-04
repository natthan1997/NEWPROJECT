-- Add z_report_data to pos_shifts to store the exact Z-Report payload generated at shift close
ALTER TABLE pos_shifts ADD COLUMN IF NOT EXISTS z_report_data JSONB;
