const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'components', 'dashboard', 'AttendanceCheckIn.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add staffLeaves state
content = content.replace(
    /const \[todayLogs, setTodayLogs\] = useState<AttendanceLog\[\]>\(\[\]\)/,
    "const [todayLogs, setTodayLogs] = useState<AttendanceLog[]>([])\n  const [staffLeaves, setStaffLeaves] = useState<any[]>([])"
);

// 2. Add fetchStaffLeaves
const fetchLeavesFunc = `
  const fetchStaffLeaves = async () => {
    if (!profile?.id) return;
    const currentYear = new Date().getFullYear();
    const { data } = await supabase
        .from('staff_leaves')
        .select('*')
        .eq('profile_id', profile.id)
        .gte('leave_date', \`\${currentYear}-01-01\`)
        .lte('leave_date', \`\${currentYear}-12-31\`);
    if (data) setStaffLeaves(data);
  }
`;
content = content.replace(
    /const fetchBranchLocation = async \(\) => {/,
    fetchLeavesFunc + "\n  const fetchBranchLocation = async () => {"
);

// 3. Call fetchStaffLeaves in useEffect
content = content.replace(
    /fetchTodayLogs\(\)/,
    "fetchTodayLogs()\n    fetchStaffLeaves()"
);

// 4. Inject the Quota card
const quotaCard = `
        <div className="mb-8 p-5 border border-[#EFEFEF] bg-white rounded-xl">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#111111] mb-4">สิทธิวันหยุดและวันลา (โควตาปีนี้)</h4>
          <div className="grid grid-cols-2 gap-4">
            {[
                { label: 'ลาป่วย', used: staffLeaves.filter(l => l.leave_type === 'sick').length, quota: (profile as any)?.quota_sick_leave ?? 30, color: 'text-rose-600', bg: 'bg-rose-50' },
                { label: 'ลากิจ', used: staffLeaves.filter(l => l.leave_type === 'personal').length, quota: (profile as any)?.quota_personal_leave ?? 3, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'ลาพักร้อน', used: staffLeaves.filter(l => l.leave_type === 'vacation').length, quota: (profile as any)?.quota_annual_leave ?? 6, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'นักขัตฤกษ์', used: staffLeaves.filter(l => l.leave_type === 'public_holiday').length, quota: (profile as any)?.quota_public_holiday ?? 13, color: 'text-pink-600', bg: 'bg-pink-50' },
            ].map(q => (
                <div key={q.label} className="flex flex-col p-3 rounded-lg bg-[#FAFAFA] border border-[#EFEFEF]">
                    <span className="text-[10px] font-bold text-[#666666] mb-1">{q.label} (เหลือ {q.quota - q.used} วัน)</span>
                    <div className="flex items-end justify-between">
                        <span className={\`text-lg font-black \${q.used >= q.quota && q.quota > 0 ? 'text-[#E54D2E]' : 'text-[#111111]'}\`}>{q.used}</span>
                        <span className="text-[10px] font-bold text-[#A3A3A3] mb-0.5">/ {q.quota}</span>
                    </div>
                    <div className="w-full bg-[#EFEFEF] rounded-full h-1 mt-2">
                        <div className={\`h-1 rounded-full \${q.used >= q.quota && q.quota > 0 ? 'bg-[#E54D2E]' : 'bg-[#111111]'}\`} style={{ width: \`\${Math.min(100, q.quota > 0 ? (q.used / q.quota) * 100 : 100)}%\` }}></div>
                    </div>
                </div>
            ))}
          </div>
        </div>

        <div className="mb-8 p-4 border border-[#EFEFEF] bg-white">`;

content = content.replace(
    /<div className="mb-8 p-4 border border-\[\#EFEFEF\] bg-white">/,
    quotaCard
);

fs.writeFileSync(file, content);
console.log("Patched AttendanceCheckIn.tsx");
