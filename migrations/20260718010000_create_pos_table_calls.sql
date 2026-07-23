CREATE TABLE IF NOT EXISTS public.pos_table_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_no TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.pos_table_calls ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for customers scanning QR)
CREATE POLICY "Allow anonymous insert table calls"
    ON public.pos_table_calls
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow authenticated (staff/pos) to view all
CREATE POLICY "Allow authenticated to view table calls"
    ON public.pos_table_calls
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated to update (resolve) calls
CREATE POLICY "Allow authenticated to update table calls"
    ON public.pos_table_calls
    FOR UPDATE
    TO authenticated
    USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_table_calls;
