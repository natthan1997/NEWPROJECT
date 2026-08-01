-- Create public_holidays table
CREATE TABLE IF NOT EXISTS public.public_holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure date is unique to avoid duplicates
ALTER TABLE public.public_holidays ADD CONSTRAINT unique_holiday_date UNIQUE (date);

-- Insert Thai Public Holidays for 2026 (some examples, they can add more via admin later)
INSERT INTO public.public_holidays (date, name) VALUES
    ('2026-01-01', 'วันขึ้นปีใหม่ (New Year''s Day)'),
    ('2026-03-03', 'วันมาฆบูชา (Makha Bucha Day)'),
    ('2026-04-06', 'วันจักรี (Chakri Memorial Day)'),
    ('2026-04-13', 'วันสงกรานต์ (Songkran Festival)'),
    ('2026-04-14', 'วันสงกรานต์ (Songkran Festival)'),
    ('2026-04-15', 'วันสงกรานต์ (Songkran Festival)'),
    ('2026-05-01', 'วันแรงงานแห่งชาติ (National Labour Day)'),
    ('2026-05-04', 'วันฉัตรมงคล (Coronation Day)'),
    ('2026-05-31', 'วันวิสาขบูชา (Visakha Bucha Day)'),
    ('2026-06-03', 'วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าสุทิดาฯ (Queen Suthida''s Birthday)'),
    ('2026-07-28', 'วันเฉลิมพระชนมพรรษา ร.10 (King Vajiralongkorn''s Birthday)'),
    ('2026-07-29', 'วันอาสาฬหบูชา (Asahna Bucha Day)'),
    ('2026-07-30', 'วันเข้าพรรษา (Khao Phansa Day)'),
    ('2026-08-12', 'วันแม่แห่งชาติ (Her Majesty the Queen Mother''s Birthday)'),
    ('2026-10-13', 'วันคล้ายวันสวรรคต ร.9 (King Bhumibol Adulyadej Memorial Day)'),
    ('2026-10-23', 'วันปิยมหาราช (Chulalongkorn Day)'),
    ('2026-12-05', 'วันพ่อแห่งชาติ (King Bhumibol Adulyadej''s Birthday)'),
    ('2026-12-10', 'วันรัฐธรรมนูญ (Constitution Day)'),
    ('2026-12-31', 'วันสิ้นปี (New Year''s Eve)')
ON CONFLICT (date) DO NOTHING;

-- Grant access
ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users for public_holidays"
ON public.public_holidays FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all access to admin for public_holidays"
ON public.public_holidays FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);
