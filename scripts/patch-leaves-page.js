const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'app', 'dashboard', 'staff', 'leaves', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

const quotaCard = `
      {/* Quota Usage Summary */}
      {!loading && profile && (
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
                { label: 'ลาป่วย', used: leaves.filter(l => l.leave_type === 'sick').length, quota: (profile as any)?.quota_sick_leave ?? 30, color: 'text-rose-600', bg: 'bg-rose-50' },
                { label: 'ลากิจ', used: leaves.filter(l => l.leave_type === 'personal').length, quota: (profile as any)?.quota_personal_leave ?? 3, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'ลาพักร้อน', used: leaves.filter(l => l.leave_type === 'vacation').length, quota: (profile as any)?.quota_annual_leave ?? 6, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'นักขัตฤกษ์', used: leaves.filter(l => l.leave_type === 'public_holiday').length, quota: (profile as any)?.quota_public_holiday ?? 13, color: 'text-pink-600', bg: 'bg-pink-50' },
            ].map(q => (
                <div key={q.label} className="flex flex-col p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-500">{q.label} (เหลือ {q.quota - q.used} วัน)</span>
                    <div className="mt-1 flex items-end justify-between">
                        <span className={\`text-xl font-black \${q.used >= q.quota && q.quota > 0 ? 'text-red-600' : 'text-gray-900'}\`}>{q.used}</span>
                        <span className="text-xs font-bold text-gray-400 mb-0.5">/ {q.quota}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div className={\`h-1.5 rounded-full \${q.used >= q.quota && q.quota > 0 ? 'bg-red-500' : 'bg-gray-900'}\`} style={{ width: \`\${Math.min(100, q.quota > 0 ? (q.used / q.quota) * 100 : 100)}%\` }}></div>
                    </div>
                </div>
            ))}
        </div>
      )}

      <div className="bg-white rounded-[24px] border border-gray-200/60 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">`;

content = content.replace(
    /<div className="bg-white rounded-\[24px\] border border-gray-200\/60 shadow-\[0_2px_15px_rgba\(0,0,0,0\.02\)\] overflow-hidden">/,
    quotaCard
);

fs.writeFileSync(file, content);
console.log("Patched leaves page");
