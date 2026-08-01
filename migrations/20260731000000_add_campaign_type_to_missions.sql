-- Add campaign_type to gamification_missions
-- Types: 'daily', 'weekly', 'monthly', 'special'

ALTER TABLE public.gamification_missions
ADD COLUMN IF NOT EXISTS campaign_type TEXT DEFAULT 'weekly';

COMMENT ON COLUMN public.gamification_missions.campaign_type IS 'Categories: daily, weekly, monthly, special';
