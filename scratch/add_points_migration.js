import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/app/database-migration/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const injectionPoint = '{/* Feature: Queue Number */}';

const newFeature = `          {/* Feature: Fix Points RPC */}
          <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50 mt-4">
            <h2 className="text-lg font-semibold text-indigo-800 mb-3">
              🎯 อัปเดตระบบสะสมแต้ม (Points Calculation Fix)
            </h2>
            <p className="text-indigo-700 text-sm mb-3">
              รันคำสั่งนี้เพื่อให้ฟังก์ชันสะสมแต้มรองรับทั้งลูกค้าระบบ Line (LIFF) และลูกค้าหน้าร้าน (POS):
            </p>
            <div className="bg-gray-900 text-indigo-400 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
{\`CREATE OR REPLACE FUNCTION public.increment_member_points(user_id TEXT, points_to_add INTEGER)
RETURNS VOID AS \\\$\\\$
BEGIN
  UPDATE public.pos_members
  SET points = COALESCE(points, 0) + points_to_add,
    updated_at = now()
  WHERE line_user_id = user_id OR id::text = user_id;
END;
\\\$\\\$ LANGUAGE plpgsql SECURITY DEFINER;\`}
            </div>
            <p className="text-indigo-600 text-xs mt-2">
              ✅ เมื่อรันเสร็จ แต้มจะสะสมได้อย่างถูกต้องทั้งสองช่องทาง
            </p>
          </div>

          `;

content = content.replace(injectionPoint, newFeature + injectionPoint);
fs.writeFileSync(filePath, content);
console.log('Migration added');
