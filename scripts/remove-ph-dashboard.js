const fs = require('fs');
const path = require('path');

const posPath = path.join(__dirname, '..', 'components', 'pos', 'POSStaffManager.tsx');
let posContent = fs.readFileSync(posPath, 'utf8');

// Remove the public holiday quota from POSStaffManager
posContent = posContent.replace(
    /\s*\{\s*label:\s*'นักขัตฤกษ์',\s*used:\s*approvedHolidaysCount,\s*quota:\s*selectedStaff\.quota_public_holiday\s*\?\?\s*13,\s*color:\s*'text-pink-600',\s*bg:\s*'bg-pink-50'\s*\},/g,
    ''
);

fs.writeFileSync(posPath, posContent);
console.log("Removed from POSStaffManager");
