const fs = require('fs');
const target = 'app/database-migration/page.tsx';
let c = fs.readFileSync(target, 'utf8');

const search = `INSERT INTO pos_loyalty_titles (name, rule_type, rule_threshold, badge_color, description) 
VALUES ('VVIP สายแข็ง', 'total_visits', 50, '#eab308', 'มาใช้บริการครบ 50 ครั้ง');`;

const replace = `INSERT INTO pos_loyalty_titles (name, rule_type, rule_threshold, badge_color, description) 
VALUES ('แฟนพันธุ์แท้', 'same_menu_streak', 5, '#3b82f6', 'สั่งซื้อเมนูเดิมครบ 5 แก้ว');

INSERT INTO pos_loyalty_titles (name, rule_type, rule_threshold, badge_color, description) 
VALUES ('VVIP สายแข็ง', 'total_visits', 50, '#eab308', 'มาใช้บริการครบ 50 ครั้ง');`;

c = c.replace(search, replace);
fs.writeFileSync(target, c);
