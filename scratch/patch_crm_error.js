const fs = require('fs');
const path = 'app/dashboard/admin/pos-settings/crm/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const handleSaveTitle = async (title: any) => {",
  "const handleSaveTitle = async (title: any) => { console.log('Saving title:', title);"
);

code = code.replace(
  "if (id.startsWith('new-')) {\n      await supabase.from('pos_loyalty_titles').insert([data]);",
  "if (id.startsWith('new-')) {\n      const { error } = await supabase.from('pos_loyalty_titles').insert([data]);\n      if(error) alert('Insert Error: ' + error.message);"
);

code = code.replace(
  "} else {\n      await supabase.from('pos_loyalty_titles').update(data).eq('id', id);",
  "} else {\n      const { error } = await supabase.from('pos_loyalty_titles').update(data).eq('id', id);\n      if(error) alert('Update Error: ' + error.message);"
);

fs.writeFileSync(path, code);
