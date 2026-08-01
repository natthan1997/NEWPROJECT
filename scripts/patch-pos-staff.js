const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'components', 'pos', 'POSStaffManager.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add state for staff leaves
content = content.replace(
    /const \[staffShifts, setStaffShifts\] = useState<any\[\]>\(\[\]\)/,
    "const [staffShifts, setStaffShifts] = useState<any[]>([])\n    const [staffLeaves, setStaffLeaves] = useState<any[]>([])"
);

// 2. Add fetchStaffLeaves
const fetchLeavesFunc = `
    const fetchStaffLeaves = async (staffId: string) => {
        const currentYear = new Date().getFullYear();
        const { data } = await supabase
            .from('staff_leaves')
            .select('*')
            .eq('profile_id', staffId)
            .gte('leave_date', \`\${currentYear}-01-01\`)
            .lte('leave_date', \`\${currentYear}-12-31\`);
        if (data) setStaffLeaves(data);
    }
`;
content = content.replace(
    /const fetchCashAdvances = async/,
    fetchLeavesFunc + "\n    const fetchCashAdvances = async"
);

// 3. Call fetchStaffLeaves in useEffect
content = content.replace(
    /fetchStaffShifts\(selectedStaff\.id\)/,
    "fetchStaffShifts(selectedStaff.id)\n            fetchStaffLeaves(selectedStaff.id)"
);

fs.writeFileSync(file, content);
console.log("Patched POSStaffManager.tsx states");
