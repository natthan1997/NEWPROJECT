-- Migration to enable authenticated and anon roles to insert into pos_points_history
-- This is necessary to record points history when checking out/completing orders on the frontend.

ALTER TABLE public.pos_points_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insertion for authenticated and anon roles" ON public.pos_points_history;
CREATE POLICY "Allow insertion for authenticated and anon roles"
ON public.pos_points_history
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Update increment_member_points to match either line_user_id or UUID id column
CREATE OR REPLACE FUNCTION public.increment_member_points(user_id TEXT, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.pos_members
  SET points = COALESCE(points, 0) + points_to_add,
    updated_at = now()
  WHERE line_user_id = user_id OR id::text = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

