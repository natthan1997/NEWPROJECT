const fs = require('fs');
const path = require('path');
const filepath = path.join(__dirname, '..', 'app', 'dashboard', 'staff', 'leaves', 'page.tsx');
let content = fs.readFileSync(filepath, 'utf8');

// Add the missing state
if (!content.includes('approvedHolidaysCount')) {
    content = content.replace(
        /const \[leaves, setLeaves\] = useState<StaffLeave\[\]>\(\[\]\);/,
        "const [leaves, setLeaves] = useState<StaffLeave[]>([]);\n  const [approvedHolidaysCount, setApprovedHolidaysCount] = useState(0);"
    );
}

// Add the missing fetch logic
if (!content.includes('const { count } = await supabase')) {
    const fetchLogic = `
        const currentYear = new Date().getFullYear();
        const { count } = await supabase
            .from('attendance_logs')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profile.id)
            .in('holiday_pay_status', ['approved_pay', 'approved_dayoff'])
            .gte('timestamp', \`\${currentYear}-01-01\`)
            .lte('timestamp', \`\${currentYear}-12-31\`);
        setApprovedHolidaysCount(count || 0);
`;
    content = content.replace(
        /if \(!error && data\) {/,
        fetchLogic + "\n        if (!error && data) {"
    );
}

fs.writeFileSync(filepath, content);
console.log("Fixed leaves/page.tsx");
