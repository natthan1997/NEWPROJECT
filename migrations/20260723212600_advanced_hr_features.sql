-- 1. เพิ่มคอลัมน์สิทธิ์และเบี้ยขยันใน profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS diligence_allowance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS can_void_orders boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_give_discounts boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_open_cash_drawer boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_manage_stock boolean DEFAULT false;

-- 2. สร้างตารางบันทึกการเบิกเงินล่วงหน้า (staff_cash_advances)
CREATE TABLE IF NOT EXISTS public.staff_cash_advances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    advance_date date NOT NULL,
    reason text,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now()
);

-- 3. สร้างตารางจัดกะทำงานรายวัน (staff_shifts)
CREATE TABLE IF NOT EXISTS public.staff_shifts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    work_date date NOT NULL,
    shift_start text NOT NULL DEFAULT '08:30',
    shift_end text NOT NULL DEFAULT '17:30',
    is_off boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    UNIQUE(profile_id, work_date)
);

-- RLS Policies
ALTER TABLE public.staff_cash_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read staff_cash_advances" ON public.staff_cash_advances FOR SELECT USING (true);
CREATE POLICY "Allow manager manage staff_cash_advances" ON public.staff_cash_advances FOR ALL USING (true);

CREATE POLICY "Allow public read staff_shifts" ON public.staff_shifts FOR SELECT USING (true);
CREATE POLICY "Allow manager manage staff_shifts" ON public.staff_shifts FOR ALL USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_cash_advances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_shifts;
