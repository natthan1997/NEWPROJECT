const fs = require('fs');
const path = require('path');

function patchFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');

    // 1. Change the array mapping to include 'text' function
    // Old:
    // { label: 'ลาป่วย', used: staffLeaves.filter(l => l.leave_type === 'sick').length, quota: (profile as any)?.quota_sick_leave ?? 30, color: 'text-rose-600', bg: 'bg-rose-50' },
    // ...
    // { label: 'นักขัตฤกษ์', used: staffLeaves.filter(l => l.leave_type === 'public_holiday').length + approvedHolidaysCount, quota: (profile as any)?.quota_public_holiday ?? 13, color: 'text-pink-600', bg: 'bg-pink-50' },
    
    // New: We need to replace the static "เหลือ..." text with dynamic text based on the label.

    content = content.replace(
        /span className="(text-\[10px\] font-bold text-\[\#666666\] mb-1|text-\[10px\] font-bold text-gray-500)">\{q\.label\} \(เหลือ \{q\.quota - q\.used\} วัน\)<\/span>/g,
        'span className="$1">{q.label} ({q.label === \'นักขัตฤกษ์\' ? `อนุมัติแล้ว ${q.used} วัน` : `เหลือ ${q.quota - q.used} วัน`})</span>'
    );

    // Also update the "used" calculation for นักขัตฤกษ์ to ONLY use approvedHolidaysCount, because the user said "พออนุมัติ สิทมันถึงจะอัพเดท ตามการอนุมติ"
    // So we don't count `leave_type === 'public_holiday'` if they want it purely driven by the manager's approval.
    content = content.replace(
        /used: (staffLeaves|leaves)\.filter\(l => l\.leave_type === 'public_holiday'\)\.length \+ approvedHolidaysCount/,
        "used: approvedHolidaysCount"
    );

    fs.writeFileSync(filepath, content);
    console.log("Patched " + filepath);
}

patchFile(path.join(__dirname, '..', 'components', 'pos', 'POSStaffManager.tsx'));
patchFile(path.join(__dirname, '..', 'components', 'dashboard', 'AttendanceCheckIn.tsx'));
patchFile(path.join(__dirname, '..', 'app', 'dashboard', 'staff', 'leaves', 'page.tsx'));

