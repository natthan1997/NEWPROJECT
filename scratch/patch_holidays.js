const fs = require('fs');
const file = 'components/pos/POSStaffManager.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add state
code = code.replace(
  "const [staffLeaves, setStaffLeaves] = useState<any[]>([])",
  "const [staffLeaves, setStaffLeaves] = useState<any[]>([])\n    const [publicHolidays, setPublicHolidays] = useState<any[]>([])"
);

// Add fetch
code = code.replace(
  "const fetchStaff = async () => {",
  "const fetchPublicHolidays = async () => {\n        const { data } = await supabase.from('public_holidays').select('*');\n        if (data) setPublicHolidays(data);\n    }\n\n    const checkPublicHoliday = (d: Date | string) => {\n        const dateStr = new Date(new Date(d).getTime() - (new Date(d).getTimezoneOffset() * 60000)).toISOString().split('T')[0];\n        return publicHolidays.find(h => h.date === dateStr);\n    }\n\n    const fetchStaff = async () => {"
);

// Call fetch
code = code.replace(
  "fetchPendingCount()",
  "fetchPendingCount()\n        fetchPublicHolidays()"
);

// Replace getThaiHoliday
code = code.replace(/getThaiHoliday/g, "checkPublicHoliday");

fs.writeFileSync(file, code);
