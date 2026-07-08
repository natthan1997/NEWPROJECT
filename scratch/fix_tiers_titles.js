const fs = require('fs');
const target = 'app/liff/member/page.tsx';
let c = fs.readFileSync(target, 'utf8');

// 1. Add `titles` state.
if (!c.includes('const [titles, setTitles]')) {
  c = c.replace('const [tiers, setTiers] = useState([', 
    'const [titles, setTitles] = useState<any[]>([]);\n  const [tiers] = useState([');
}

// 2. Change `setTiers` in fetchData to `setTitles`
const searchFetchData = `setTiers(titlesData.titles.map((t: any) => ({`;
const replaceFetchData = `setTitles(titlesData.titles.map((t: any) => ({`;
c = c.replace(searchFetchData, replaceFetchData);

// 3. In the Catalog Modal, use `titles.map` instead of `tiers.map`
// Also keep `tiers` for the Benefits modal which we will add back.
// But first, let's fix the Catalog Modal rendering map.
const searchCatalogMap = `{tiers.map((tier, idx) => (
                    <div 
                      key={idx}`;
const replaceCatalogMap = `{titles.map((tier, idx) => (
                    <div 
                      key={idx}`;
c = c.replace(searchCatalogMap, replaceCatalogMap);

// 4. Put the original Tiers listing BACK into the Benefits Modal.
const searchBenefitsModal = `<div className="flex items-start gap-3">
                      <div className="bg-white p-2 rounded-full shadow-sm">
                        <User size={16} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-gray-900">สะสมฉายาสุดเท่</p>
                        <p className="text-[13px] text-gray-500">ทำภารกิจลับเพื่อปลดล็อกฉายาพิเศษ</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setShowBenefits(false);
                        setShowCatalog(true);
                      }}
                      className="w-full mt-4 py-3 bg-gray-900 text-white rounded-xl text-[14px] font-medium"
                    >
                      ดูแคตตาล็อคฉายาทั้งหมด
                    </button>
                  </div>
                </div>`;

const replaceBenefitsModal = `<div className="flex items-start gap-3">
                      <div className="bg-white p-2 rounded-full shadow-sm">
                        <User size={16} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-gray-900">สะสมฉายาสุดเท่</p>
                        <p className="text-[13px] text-gray-500">ทำภารกิจลับเพื่อปลดล็อกฉายาพิเศษ</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setShowBenefits(false);
                        setShowCatalog(true);
                      }}
                      className="w-full mt-4 py-3 bg-gray-900 text-white rounded-xl text-[14px] font-medium"
                    >
                      ดูแคตตาล็อคฉายาทั้งหมด
                    </button>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Tiers List */}
                <div>
                  <h4 className="text-[13px] text-gray-500 mb-4 uppercase tracking-wider font-semibold">สิทธิประโยชน์ตามระดับ</h4>
                  <div className="space-y-6">
                    {tiers.map((tier) => (
                      <div key={tier.name} className="flex gap-4">
                        <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-[13px] font-bold uppercase tracking-wider shadow-sm" style={{ backgroundColor: tier.bgHex || '#F2ECE4', color: tier.textHex || '#1A1A18' }}>
                          {tier.name[0]}
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2 mb-2">
                            <h4 className="text-[15px] font-bold text-gray-900">{tier.name}</h4>
                            <span className="text-[12px] text-gray-400 font-medium">{tier.minPoints.toLocaleString()} {dict.pts}</span>
                          </div>
                          <ul className="space-y-2">
                            {tier.benefits && tier.benefits.map((b, i) => (
                              <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
                                <Check size={16} strokeWidth={2} className="text-green-500 flex-shrink-0 mt-0.5" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>`;
c = c.replace(searchBenefitsModal, replaceBenefitsModal);

fs.writeFileSync(target, c);
console.log('Fixed tiers and titles');
