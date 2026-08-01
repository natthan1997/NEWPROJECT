const fs = require('fs');
const path = require('path');

function patchFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');

    // Add state for approvedHolidaysCount if not exists
    if (!content.includes('approvedHolidaysCount')) {
        content = content.replace(
            /const \[staffLeaves, setStaffLeaves\] = useState<any\[\]>\(\[\]\)/,
            "const [staffLeaves, setStaffLeaves] = useState<any[]>([])\n  const [approvedHolidaysCount, setApprovedHolidaysCount] = useState(0)"
        );
        
        // Update the fetchStaffLeaves function to also fetch the approved holiday count
        const countQuery = `
    const { count } = await supabase
        .from('attendance_logs')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileIdToUse)
        .in('holiday_pay_status', ['approved_pay', 'approved_dayoff'])
        .gte('timestamp', \`\${currentYear}-01-01\`)
        .lte('timestamp', \`\${currentYear}-12-31\`);
    
    setApprovedHolidaysCount(count || 0);
`;
        
        // find profileId reference
        if (content.includes('fetchStaffLeaves = async (staffId: string)')) {
            // POSStaffManager.tsx
            content = content.replace(
                /const currentYear = new Date\(\)\.getFullYear\(\);/,
                "const currentYear = new Date().getFullYear();\n    const profileIdToUse = staffId;"
            );
            content = content.replace(
                /if \(data\) setStaffLeaves\(data\);/,
                "if (data) setStaffLeaves(data);\n" + countQuery
            );
        } else {
            // AttendanceCheckIn.tsx / leaves/page.tsx
            content = content.replace(
                /const currentYear = new Date\(\)\.getFullYear\(\);/,
                "const currentYear = new Date().getFullYear();\n    const profileIdToUse = profile?.id;"
            );
            content = content.replace(
                /if \(data\) setStaffLeaves\(data\);/,
                "if (data) setStaffLeaves(data);\n" + countQuery
            );
        }

        // Replace the "นักขัตฤกษ์" calculation
        content = content.replace(
            /used: (staffLeaves|leaves)\.filter\(l => l\.leave_type === 'public_holiday'\)\.length/,
            "used: $1.filter(l => l.leave_type === 'public_holiday').length + approvedHolidaysCount"
        );
        
        fs.writeFileSync(filepath, content);
        console.log("Patched " + filepath);
    }
}

patchFile(path.join(__dirname, '..', 'components', 'pos', 'POSStaffManager.tsx'));
patchFile(path.join(__dirname, '..', 'components', 'dashboard', 'AttendanceCheckIn.tsx'));
patchFile(path.join(__dirname, '..', 'app', 'dashboard', 'staff', 'leaves', 'page.tsx'));

