-- Create Table for CRM Tiers
CREATE TABLE IF NOT EXISTS public.pos_member_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    min_points INTEGER NOT NULL,
    multiplier NUMERIC NOT NULL DEFAULT 1.0,
    discount_rate NUMERIC NOT NULL DEFAULT 0.0,
    benefits JSONB,
    bg_hex TEXT,
    text_hex TEXT,
    bar_hex TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Tiers
INSERT INTO public.pos_member_tiers (name, min_points, multiplier, discount_rate, benefits, bg_hex, text_hex, bar_hex, order_index)
VALUES 
('Bronze', 0, 1.0, 0.0, '["อัตราสะสมคะแนน 50 บาท = 1 คะแนน", "รับสิทธิ์ลุ้นกล่องสุ่มเมื่อครบ 50 คะแนน"]', '#F2ECE4', '#8C6D53', '#C19A6B', 1),
('Silver', 500, 1.2, 0.0, '["อัตราสะสมคะแนน x1.2", "เครื่องดื่มพิเศษในเดือนเกิด", "สิทธิ์สั่งซื้อต้นไม้คอลเลกชันใหม่ล่วงหน้า 12 ชม."]', '#F0F2F5', '#64748B', '#94A3B8', 2),
('Gold', 2000, 1.5, 5.0, '["อัตราสะสมคะแนน x1.5", "ส่วนลด 5% ทุกออเดอร์", "สิทธิ์ Fast Track ลัดคิวเข้ารับบริการ", "สิทธิ์สั่งซื้อต้นไม้ Rare Item ล่วงหน้า 24 ชม."]', '#FCF7E8', '#B48529', '#D4AF37', 3),
('Platinum', 5000, 2.0, 10.0, '["อัตราสะสมคะแนน x2.0", "ส่วนลด 10% ทุกออเดอร์", "สิทธิ์ Fast Track ขั้นสูงสุด", "เบอร์ติดต่อสายตรงปรึกษาผู้เชี่ยวชาญ 24 ชม."]', '#EBF1F5', '#3E6578', '#6495ED', 4);

-- Enable RLS
ALTER TABLE public.pos_member_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.pos_member_tiers FOR SELECT USING (true);
CREATE POLICY "Enable write access for service role" ON public.pos_member_tiers FOR ALL USING (auth.role() = 'service_role');
