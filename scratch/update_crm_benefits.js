const fs = require('fs');
const target = 'app/dashboard/admin/pos-settings/crm/page.tsx';
let c = fs.readFileSync(target, 'utf8');

const search = `<div>
              <label className="block text-xs text-gray-500 mb-1">คำอธิบาย (How to get)</label>
              <textarea 
                value={title.description || ''} 
                onChange={e => setTitles(titles.map(t => t.id === title.id ? { ...t, description: e.target.value } : t))}
                className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                rows={2}
                placeholder="อธิบายให้ลูกค้าเข้าใจว่าต้องทำอย่างไรถึงจะได้ฉายานี้..."
              />
            </div>`;

const replace = `<div>
              <label className="block text-xs text-gray-500 mb-1">คำอธิบาย (How to get)</label>
              <textarea 
                value={title.description || ''} 
                onChange={e => setTitles(titles.map(t => t.id === title.id ? { ...t, description: e.target.value } : t))}
                className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mb-3"
                rows={2}
                placeholder="อธิบายให้ลูกค้าเข้าใจว่าต้องทำอย่างไรถึงจะได้ฉายานี้..."
              />
              <label className="block text-xs text-gray-500 mb-1">สิทธิประโยชน์ (Benefits)</label>
              <textarea 
                value={title.benefits || ''} 
                onChange={e => setTitles(titles.map(t => t.id === title.id ? { ...t, benefits: e.target.value } : t))}
                className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                rows={2}
                placeholder="เช่น ส่วนลด 10%, รับฟรีเค้ก 1 ชิ้น..."
              />
            </div>`;

c = c.replace(search, replace);

// Add benefits to handleAddTitle
const searchAdd = `description: ''`;
const replaceAdd = `description: '', benefits: ''`;
c = c.replace(searchAdd, replaceAdd);

fs.writeFileSync(target, c);
console.log('CRM updated');
