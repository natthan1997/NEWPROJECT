const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'components', 'pos', 'POSStaffManager.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Update handleUpdateStaff to include quotas
const handleUpdateFuncOld = `
            rest_days: selectedStaff.rest_days || [],
            diligence_allowance: selectedStaff.diligence_allowance || 0,
`;
const handleUpdateFuncNew = `
            rest_days: selectedStaff.rest_days || [],
            diligence_allowance: selectedStaff.diligence_allowance || 0,
            quota_sick_leave: selectedStaff.quota_sick_leave ?? 30,
            quota_personal_leave: selectedStaff.quota_personal_leave ?? 3,
            quota_annual_leave: selectedStaff.quota_annual_leave ?? 6,
            quota_public_holiday: selectedStaff.quota_public_holiday ?? 13,
`;
content = content.replace(handleUpdateFuncOld, handleUpdateFuncNew);

fs.writeFileSync(file, content);
console.log("Patched POSStaffManager.tsx handleUpdateStaff");
