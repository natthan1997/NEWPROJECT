const fs = require('fs');
const target = 'app/liff/member/page.tsx';
let c = fs.readFileSync(target, 'utf8');

// Add state for activeTitle
if (!c.includes('const [activeTitle, setActiveTitle] = useState')) {
  c = c.replace('const [tiers, setTiers] = useState<any[]>([]);', 'const [tiers, setTiers] = useState<any[]>([]);\n  const [activeTitle, setActiveTitle] = useState<any>(null);');
}

// Update the fetch to set activeTitle
const searchFetch = `if (titlesData.success) {
          setTiers(titlesData.titles.map((t: any) => ({`;
const replaceFetch = `if (titlesData.success) {
          setActiveTitle(titlesData.activeTitle);
          setTiers(titlesData.titles.map((t: any) => ({`;
c = c.replace(searchFetch, replaceFetch);

// Update Profile Display to show the Active Title or 'สมาชิกระดับเริ่มต้น'
// The profile displays: <p className="text-[13px] font-medium text-gray-400 mt-0.5 max-w-[200px] truncate">{memberInfo?.customer_id}</p>
// Let's add the badge right below it.
const searchProfile = `<p className="text-[13px] font-medium text-gray-400 mt-0.5 max-w-[200px] truncate">{memberInfo?.customer_id}</p>`;
const replaceProfile = `<p className="text-[13px] font-medium text-gray-400 mt-0.5 max-w-[200px] truncate">{memberInfo?.customer_id}</p>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold" 
                             style={{ 
                               backgroundColor: activeTitle ? (activeTitle.badge_color || '#F2ECE4') : '#f3f4f6', 
                               color: activeTitle ? '#1A1A18' : '#6b7280',
                               border: \`1px solid \${activeTitle ? 'transparent' : '#e5e7eb'}\`
                             }}>
                          {activeTitle ? \`🏆 \${activeTitle.name}\` : '🌱 สมาชิกระดับเริ่มต้น (ลูกค้าใหม่)'}
                        </div>`;
c = c.replace(searchProfile, replaceProfile);

fs.writeFileSync(target, c);
console.log('Updated LIFF');
