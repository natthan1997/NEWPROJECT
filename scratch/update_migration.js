const fs = require('fs');

const targetFile = 'app/database-migration/page.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

const searchTarget = `CREATE POLICY "Allow all for pos_member_coupons" ON pos_member_coupons FOR ALL TO public USING (true) WITH CHECK (true);

-- Insert Seed Data (Default settings)
INSERT INTO pos_loyalty_titles (name, rule_type, rule_target, rule_threshold, badge_color) 
VALUES ('นักอนุรักษ์ความจำเจ', 'total_visits', NULL, 10, '#4b5563');

INSERT INTO pos_loyalty_titles (name, rule_type, rule_target, rule_threshold, badge_color) 
VALUES ('VVIP ประจำร้าน', 'total_visits', NULL, 50, '#eab308');

INSERT INTO pos_loyalty_coupons (name, cost_points, discount_type, discount_value, applicable_categories)
VALUES ('ฟรีเครื่องดื่ม 1 แก้ว', 1000, 'free_item', NULL, '[]'::jsonb);`;

const replaceWith = `CREATE POLICY "Allow all for pos_member_coupons" ON pos_member_coupons FOR ALL TO public USING (true) WITH CHECK (true);

-- Add description column if missing
ALTER TABLE pos_loyalty_titles ADD COLUMN IF NOT EXISTS description TEXT;

-- Clean up old weird titles
DELETE FROM pos_loyalty_titles;

-- Insert Smart Titles Seed Data
INSERT INTO pos_loyalty_titles (name, rule_type, rule_threshold, badge_color, description) 
VALUES ('ขาจรแวะทักทาย', 'total_visits', 1, '#9ca3af', 'สั่งซื้อออเดอร์แรกกับทางร้าน');

INSERT INTO pos_loyalty_titles (name, rule_type, rule_threshold, badge_color, description) 
VALUES ('คอกาแฟมือใหม่', 'total_visits', 5, '#8b5cf6', 'มาใช้บริการครบ 5 ครั้ง');

INSERT INTO pos_loyalty_titles (name, rule_type, rule_threshold, badge_color, description) 
VALUES ('นกตื่นเช้า', 'morning_visits', 3, '#f59e0b', 'มาใช้บริการช่วง 06:00-09:00 ครบ 3 ครั้ง');

INSERT INTO pos_loyalty_titles (name, rule_type, rule_threshold, badge_color, description) 
VALUES ('สายเหมาปาร์ตี้', 'party_buyer', 5, '#ec4899', 'สั่งซื้อ 5 แก้วขึ้นไปในบิลเดียว');

INSERT INTO pos_loyalty_titles (name, rule_type, rule_threshold, badge_color, description) 
VALUES ('เจ้าสัวคาเฟ่', 'single_receipt_spend', 1000, '#10b981', 'มียอดซื้อเกิน 1,000 บาทในบิลเดียว');

INSERT INTO pos_loyalty_titles (name, rule_type, rule_threshold, badge_color, description) 
VALUES ('VVIP สายแข็ง', 'total_visits', 50, '#eab308', 'มาใช้บริการครบ 50 ครั้ง');

INSERT INTO pos_loyalty_coupons (name, cost_points, discount_type, discount_value, applicable_categories)
VALUES ('ฟรีเครื่องดื่ม 1 แก้ว', 1000, 'free_item', NULL, '[]'::jsonb);`;

if (content.includes(searchTarget)) {
  content = content.replace(searchTarget, replaceWith);
  fs.writeFileSync(targetFile, content);
  console.log('Successfully updated migration script');
} else {
  console.log('Target string not found');
}
