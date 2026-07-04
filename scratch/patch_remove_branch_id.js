const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/pos/POSInventoryCategoryManager.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Remove interface property
code = code.replace(/  branch_id\?: string \| null\n/g, '');

// Remove branch_id from fetchCategories
const fetchCategoriesTarget = `      if (branchId) {
        query = query.eq('branch_id', branchId)
      } else {
        query = query.is('branch_id', null)
      }`;
code = code.replace(fetchCategoriesTarget, '');

// Remove branch_id from insert
const payloadTarget = `      const payload: any = {
        name: formName.trim(),
        branch_id: branchId,
      }`;
const payloadReplacement = `      const payload: any = {
        name: formName.trim(),
      }`;
code = code.replace(payloadTarget, payloadReplacement);

// Fix useEffect dependency to not rely on branch_id for fetching? Or keep it since it only runs once anyway.
code = code.replace(/}, \[shopSettings\?\.branch_id\]\)/g, '}, [])');

fs.writeFileSync(filePath, code);
