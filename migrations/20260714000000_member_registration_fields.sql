-- Add new columns for the detailed Member Registration Form
ALTER TABLE public.pos_members 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS favorite_menu JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pdpa_consent BOOLEAN DEFAULT false;
