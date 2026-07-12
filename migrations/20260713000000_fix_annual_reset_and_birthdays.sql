-- 1. Ensure date_of_birth exists in pos_members
ALTER TABLE public.pos_members ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 2. Update the Stored Procedure to perform the smart reset WITHOUT clearing spendable points
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
        -- REMOVED: points = 0, (so spendable points are kept)
        total_accumulated_points = 0
    FROM CalculatedNewTiers cnt
    WHERE pm.id = cnt.id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
