-- Create pos_staff_sops table for storing rich text documents/SOPs
CREATE TABLE IF NOT EXISTS public.pos_staff_sops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'ทั่วไป',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_pos_staff_sops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_pos_staff_sops_updated_at ON public.pos_staff_sops;
CREATE TRIGGER set_pos_staff_sops_updated_at
BEFORE UPDATE ON public.pos_staff_sops
FOR EACH ROW
EXECUTE FUNCTION update_pos_staff_sops_updated_at();

-- Add policies
ALTER TABLE public.pos_staff_sops ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read sops" 
ON public.pos_staff_sops 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow all authenticated users to manage (for simplicity, real app would restrict to admins)
CREATE POLICY "Allow authenticated users to manage sops" 
ON public.pos_staff_sops 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
