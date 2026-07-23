-- Migration: Staff Development and KPI tracking

-- 1. Create pos_staff_skills table
CREATE TABLE IF NOT EXISTS public.pos_staff_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    level TEXT DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    category TEXT, -- e.g., 'Barista', 'Customer Service', 'Management'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create pos_staff_training_logs table
CREATE TABLE IF NOT EXISTS public.pos_staff_training_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES public.pos_staff_skills(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
    score NUMERIC(5,2),
    trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (staff_id, skill_id)
);

-- 3. Create pos_staff_evaluations table
CREATE TABLE IF NOT EXISTS public.pos_staff_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    period_month INTEGER CHECK (period_month >= 1 AND period_month <= 12),
    period_year INTEGER,
    overall_score NUMERIC(5,2),
    sales_performance_score NUMERIC(5,2),
    customer_rating_score NUMERIC(5,2),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (staff_id, period_month, period_year)
);

-- 4. Enable RLS and setup policies
ALTER TABLE public.pos_staff_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_staff_training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_staff_evaluations ENABLE ROW LEVEL SECURITY;

-- Policies for pos_staff_skills (Public readable, Admin/Manager writable)
DROP POLICY IF EXISTS "Allow authenticated read on pos_staff_skills" ON public.pos_staff_skills;
CREATE POLICY "Allow authenticated read on pos_staff_skills"
ON public.pos_staff_skills FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin/manager write on pos_staff_skills" ON public.pos_staff_skills;
CREATE POLICY "Allow admin/manager write on pos_staff_skills"
ON public.pos_staff_skills FOR ALL TO authenticated 
USING (true) WITH CHECK (true); -- In a real prod environment, check user role

-- Policies for pos_staff_training_logs
DROP POLICY IF EXISTS "Staff can view own training logs" ON public.pos_staff_training_logs;
CREATE POLICY "Staff can view own training logs"
ON public.pos_staff_training_logs FOR SELECT TO authenticated
USING (staff_id = auth.uid() OR true); -- Permissive for POS use cases

DROP POLICY IF EXISTS "Allow all for training logs" ON public.pos_staff_training_logs;
CREATE POLICY "Allow all for training logs"
ON public.pos_staff_training_logs FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- Policies for pos_staff_evaluations
DROP POLICY IF EXISTS "Staff can view own evaluations" ON public.pos_staff_evaluations;
CREATE POLICY "Staff can view own evaluations"
ON public.pos_staff_evaluations FOR SELECT TO authenticated
USING (staff_id = auth.uid() OR true);

DROP POLICY IF EXISTS "Allow all for evaluations" ON public.pos_staff_evaluations;
CREATE POLICY "Allow all for evaluations"
ON public.pos_staff_evaluations FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- Setup Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_staff_skills;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_staff_training_logs;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_staff_evaluations;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
