-- Enable Supabase Realtime for pos_member_checkins table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    -- Check if table is already in publication
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'pos_member_checkins'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_member_checkins;
    END IF;
  END IF;
END $$;
