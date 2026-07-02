import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/app/database-migration/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `          {/* Feature: Delivery Platform Tracking + GP */}`;

const newMigration = `          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-4">
            <h2 className="text-lg font-semibold text-emerald-800 mb-3">
              🌙 ระบบสั่งอาหารนอกเวลา (After-hours Ordering)
            </h2>
            <p className="text-emerald-700 text-sm mb-3">
              รันคำสั่งนี้เพื่อเพิ่ม column สำหรับตั้งค่าให้บางโต๊ะเปิดรับออเดอร์ 24 ชม.:
            </p>
            <div className="bg-gray-900 text-emerald-400 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
{\`-- Add allow_after_hours to pos_tables
ALTER TABLE pos_tables ADD COLUMN IF NOT EXISTS allow_after_hours BOOLEAN DEFAULT false;\`}
            </div>
          </div>

`;

content = content.replace(targetStr, newMigration + targetStr);
fs.writeFileSync(filePath, content);
console.log("Updated database-migration page.");
