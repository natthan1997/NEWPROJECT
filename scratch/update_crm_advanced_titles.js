const fs = require('fs');
const target = 'app/dashboard/admin/pos-settings/crm/page.tsx';
let c = fs.readFileSync(target, 'utf8');

// 1. Add states
if (!c.includes('const [menuItems, setMenuItems] = useState')) {
  c = c.replace('const [loading, setLoading] = useState(true);', 
    'const [loading, setLoading] = useState(true);\n  const [menuItems, setMenuItems] = useState<any[]>([]);\n  const [categories, setCategories] = useState<any[]>([]);'
  );
}

// 2. Fetch data in loadData
const fetchSearch = `const [t, c, camp] = await Promise.all([`;
const fetchReplace = `const [t, c, camp, m, cat] = await Promise.all([
      supabase.from('pos_loyalty_titles').select('*').order('rule_threshold', { ascending: true }),
      supabase.from('pos_loyalty_coupons').select('*').order('cost_points', { ascending: true }),
      supabase.from('pos_loyalty_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('pos_menu_items').select('id, name, is_active').order('name'),
      supabase.from('pos_menu_categories').select('id, name').order('name')
    ]);
    
    // We replace the old promise array entirely
    `;

// Since there is a Promise.all, let's just replace the whole block
const blockSearch = `const [t, c, camp] = await Promise.all([
      supabase.from('pos_loyalty_titles').select('*').order('rule_threshold', { ascending: true }),
      supabase.from('pos_loyalty_coupons').select('*').order('cost_points', { ascending: true }),
      supabase.from('pos_loyalty_campaigns').select('*').order('created_at', { ascending: false })
    ]);
    if (t.data) setTitles(t.data);
    if (c.data) setCoupons(c.data);
    if (camp.data) setCampaigns(camp.data);`;

const blockReplace = `const [t, c, camp, m, cat] = await Promise.all([
      supabase.from('pos_loyalty_titles').select('*').order('rule_threshold', { ascending: true }),
      supabase.from('pos_loyalty_coupons').select('*').order('cost_points', { ascending: true }),
      supabase.from('pos_loyalty_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('pos_menu_items').select('id, name').eq('is_active', true).order('name'),
      supabase.from('pos_menu_categories').select('id, name').order('name')
    ]);
    if (t.data) setTitles(t.data);
    if (c.data) setCoupons(c.data);
    if (camp.data) setCampaigns(camp.data);
    if (m.data) setMenuItems(m.data);
    if (cat.data) setCategories(cat.data);`;

c = c.replace(blockSearch, blockReplace);

// 3. Update Rule Type Select and add Rule Target Select
const optionsSearch = `<option value="party_buyer">สายเหมา (จำนวนแก้วต่อบิล)</option>
                <option value="same_menu_streak">แฟนพันธุ์แท้ (สั่งเมนูเดิมซ้ำครบ X ครั้ง)</option>
                <option value="morning_visits">นกตื่นเช้า (มาก่อน 9 โมงครบ X ครั้ง)</option>
                <option value="evening_visits">สายดึก (มาหลัง 6 โมงเย็นครบ X ครั้ง)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">คำอธิบาย (How to get)</label>`;

const optionsReplace = `<option value="party_buyer">สายเหมา (จำนวนแก้วต่อบิล)</option>
                <option value="same_menu_streak">แฟนพันธุ์แท้ (สุ่มสั่งเมนูเดิมซ้ำครบ X ครั้ง)</option>
                <option value="category_purchase">ซื้อหมวดหมู่เฉพาะ (ระบุหมวด)</option>
                <option value="specific_menu_purchase">ซื้อเมนูเฉพาะ (ระบุเมนู)</option>
                <option value="morning_visits">นกตื่นเช้า (มาก่อน 9 โมงครบ X ครั้ง)</option>
                <option value="evening_visits">สายดึก (มาหลัง 6 โมงเย็นครบ X ครั้ง)</option>
              </select>
            </div>
            
            {(title.rule_type === 'category_purchase' || title.rule_type === 'specific_menu_purchase') && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">เป้าหมาย ({title.rule_type === 'category_purchase' ? 'เลือกหมวดหมู่' : 'เลือกเมนู'})</label>
                <select 
                  value={title.rule_target || ''} 
                  onChange={e => setTitles(titles.map(t => t.id === title.id ? { ...t, rule_target: e.target.value } : t))}
                  className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">-- เลือก --</option>
                  {title.rule_type === 'category_purchase' && categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                  {title.rule_type === 'specific_menu_purchase' && menuItems.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-1">คำอธิบาย (How to get)</label>`;

c = c.replace(optionsSearch, optionsReplace);

fs.writeFileSync(target, c);
console.log('CRM Updated');
