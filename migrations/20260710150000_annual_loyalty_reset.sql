-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- IMPORTANT FIX: Add missing total_accumulated_points column
ALTER TABLE public.pos_members ADD COLUMN IF NOT EXISTS total_accumulated_points INTEGER DEFAULT 0;

-- Backfill legacy members so they don't lose their tier progress
UPDATE public.pos_members 
SET total_accumulated_points = points 
WHERE total_accumulated_points = 0 AND points > 0;

-- Create the Stored Procedure to perform the smart reset
CREATE OR REPLACE FUNCTION public.reset_annual_loyalty()
RETURNS void AS $$
BEGIN
    -- We update member_tier using a "Soft Landing" logic:
    -- A member will drop at most 1 level per year if they don't meet the points requirement.
    
    WITH RankedTiers AS (
        SELECT 
            name, 
            min_points,
            ROW_NUMBER() OVER (ORDER BY min_points ASC) as level_index
        FROM public.pos_member_tiers
    ),
    MemberNewTiers AS (
        SELECT 
            pm.id,
            -- Find the level index of their current tier (default to 1 if null)
            COALESCE((SELECT level_index FROM RankedTiers WHERE name = pm.member_tier), 1) as current_level,
            -- Find the level index of the tier they earned this year
            COALESCE((SELECT level_index FROM RankedTiers WHERE min_points <= pm.total_accumulated_points ORDER BY min_points DESC LIMIT 1), 1) as earned_level
        FROM public.pos_members pm
    ),
    CalculatedNewTiers AS (
        SELECT 
            mnt.id,
            -- New level is the MAX of earned_level and (current_level - 1)
            GREATEST(mnt.earned_level, mnt.current_level - 1) as final_level
        FROM MemberNewTiers mnt
    )
    UPDATE public.pos_members pm
    SET 
        member_tier = (SELECT name FROM RankedTiers WHERE level_index = cnt.final_level LIMIT 1),
        points = 0,
        total_accumulated_points = 0
    FROM CalculatedNewTiers cnt
    WHERE pm.id = cnt.id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Unschedule if it already exists to prevent duplicates (ignore errors if it doesn't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('annual-loyalty-reset');
EXCEPTION WHEN OTHERS THEN
  -- Do nothing
END $$;

-- Schedule the job to run every January 1st at 00:00 (midnight)
-- The cron expression is '0 0 1 1 *' (Minute: 0, Hour: 0, Day of month: 1, Month: 1, Day of week: *)
SELECT cron.schedule(
  'annual-loyalty-reset',
  '0 0 1 1 *',
  'SELECT public.reset_annual_loyalty()'
);
