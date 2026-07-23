-- Create pos_zones table
CREATE TABLE IF NOT EXISTS public.pos_zones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.pos_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to pos_zones" ON public.pos_zones
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public insert to pos_zones" ON public.pos_zones
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public update to pos_zones" ON public.pos_zones
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete to pos_zones" ON public.pos_zones
    FOR DELETE
    TO public
    USING (true);
