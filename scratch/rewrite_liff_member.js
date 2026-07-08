const fs = require('fs');
const target = 'app/liff/member/page.tsx';
let c = fs.readFileSync(target, 'utf8');

// 1. Add earnRate state
if (!c.includes('const [earnRate, setEarnRate]')) {
  c = c.replace('const [showBenefits, setShowBenefits] = useState(false);', 
    'const [showBenefits, setShowBenefits] = useState(false);\n  const [earnRate, setEarnRate] = useState(100);\n  const [showCatalog, setShowCatalog] = useState(false);\n  const [selectedBadge, setSelectedBadge] = useState<any>(null);');
}

// 2. Fetch earn rate in fetchData
const searchFetchData = `const { data: member } = await supabase.from('pos_members').select('*').eq('line_user_id', userId).maybeSingle();`;
const replaceFetchData = `const { data: member } = await supabase.from('pos_members').select('*').eq('line_user_id', userId).maybeSingle();
      const { data: shopSettings } = await supabase.from('pos_shop_settings').select('loyalty_earn_rate').limit(1).maybeSingle();
      if (shopSettings && shopSettings.loyalty_earn_rate) {
        setEarnRate(shopSettings.loyalty_earn_rate);
      }`;
if (!c.includes('shopSettings.loyalty_earn_rate')) {
  c = c.replace(searchFetchData, replaceFetchData);
}

// 3. Update earnRule string
const searchEarnRule = `earnRule: '100 THB = 1 Point'`;
const replaceEarnRule = `earnRule: \`\${earnRate} THB = 1 Point\``;
c = c.replace(searchEarnRule, replaceEarnRule);

const searchEarnRuleTh = `earnRule: 'ทุก 100 บาท = 1 คะแนน'`;
const replaceEarnRuleTh = `earnRule: \`ทุก \${earnRate} บาท = 1 คะแนน\``;
c = c.replace(searchEarnRuleTh, replaceEarnRuleTh);

// 4. Update the titles data format to handle benefits
const searchTiers = `benefits: t.description ? [t.description] : [],`;
const replaceTiers = `description: t.description || '',\n            benefits: t.benefits || '',`;
c = c.replace(searchTiers, replaceTiers);

// 5. Replace Benefits modal
const replaceModal = `{showBenefits && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBenefits(false)}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] max-h-[90vh] overflow-y-auto pb-safe"
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-6 py-5 flex items-center justify-between border-b border-gray-50">
                <h3 className="text-[16px] font-medium text-gray-900">{dict.benefitsTitle}</h3>
                <button onClick={() => setShowBenefits(false)} className="p-2 -mr-2 text-gray-400 hover:text-gray-900 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-8">
                
                {/* Benefits Section */}
                <div>
                  <h4 className="text-[13px] text-gray-500 mb-3 uppercase tracking-wider font-semibold">สิทธิประโยชน์สมาชิก</h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-white p-2 rounded-full shadow-sm">
                        <Gift size={16} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-gray-900">{dict.howToEarn}</p>
                        <p className="text-[13px] text-gray-500">{dict.earnRule}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
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

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 👑 CATALOG MODAL */}
      <AnimatePresence>
        {showCatalog && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCatalog(false)}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] max-h-[90vh] overflow-y-auto pb-safe flex flex-col"
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-6 py-5 flex items-center justify-between border-b border-gray-50 shrink-0">
                <h3 className="text-[16px] font-medium text-gray-900">แคตตาล็อคฉายา</h3>
                <button onClick={() => setShowCatalog(false)} className="p-2 -mr-2 text-gray-400 hover:text-gray-900 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-3">
                  {tiers.map((tier, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedBadge(tier)}
                      className={\`relative flex flex-col items-center justify-center p-4 rounded-2xl border cursor-pointer hover:shadow-md transition-shadow \${tier.isUnlocked ? 'bg-white border-gray-200' : 'bg-gray-50 border-transparent grayscale opacity-80'}\`}
                    >
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-[20px] font-bold shadow-sm mb-3" style={{ backgroundColor: tier.bgHex, color: tier.textHex }}>
                        {tier.name[0]}
                      </div>
                      <h4 className="text-[13px] font-medium text-center text-gray-900 leading-tight mb-1">{tier.name}</h4>
                      
                      {/* Mini Progress */}
                      {!tier.isUnlocked && (
                        <div className="w-full mt-2">
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: \`\${tier.progress}%\` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🏆 BADGE DETAIL MODAL */}
      <AnimatePresence>
        {selectedBadge && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedBadge(null)}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[90%] max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header colored banner */}
              <div className="h-24 w-full flex items-center justify-center relative" style={{ backgroundColor: selectedBadge.bgHex }}>
                <button onClick={() => setSelectedBadge(null)} className="absolute top-3 right-3 p-2 bg-black/10 hover:bg-black/20 rounded-full text-black/50 transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              {/* Avatar floating */}
              <div className="relative flex justify-center -mt-10">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-[28px] font-bold shadow-lg bg-white border-4 border-white" style={{ backgroundColor: selectedBadge.bgHex, color: selectedBadge.textHex }}>
                  {selectedBadge.name[0]}
                </div>
              </div>

              <div className="px-6 pb-6 pt-4 text-center">
                <h3 className="text-[20px] font-bold text-gray-900 mb-1">{selectedBadge.name}</h3>
                
                {selectedBadge.isUnlocked ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-[12px] font-medium rounded-full mb-6">
                    <Check size={14} /> ปลดล็อกแล้ว
                  </div>
                ) : (
                  <div className="text-[12px] text-gray-500 mb-6">
                    ยังไม่ปลดล็อก
                  </div>
                )}

                <div className="text-left space-y-5">
                  {/* How to get */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">🎯 ภารกิจรับฉายา</h4>
                    <p className="text-[14px] text-gray-800 leading-relaxed">{selectedBadge.description || \`สะสม \${selectedBadge.minPoints} เป้าหมาย\`}</p>
                    
                    {!selectedBadge.isUnlocked && (
                      <div className="mt-4">
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-gray-500">ความคืบหน้า</span>
                          <span className="font-medium">{selectedBadge.currentValue} / {selectedBadge.minPoints}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: \`\${selectedBadge.progress}%\` }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Benefits */}
                  {selectedBadge.benefits && (
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100/50">
                      <h4 className="text-[12px] font-bold text-amber-600 uppercase tracking-wider mb-2">🎁 สิทธิพิเศษ</h4>
                      <p className="text-[14px] text-gray-800 leading-relaxed whitespace-pre-line">{selectedBadge.benefits}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}`;

const startIdx = c.indexOf('{showBenefits && (');
if (startIdx !== -1) {
  const endIdx = c.indexOf('{/* 🎁 MYSTERY BOX MODAL */}');
  
  if (endIdx !== -1) {
    const exactStart = c.lastIndexOf('<AnimatePresence>', startIdx);
    const exactEnd = c.lastIndexOf('</AnimatePresence>', endIdx) + '</AnimatePresence>'.length;
    
    const head = c.substring(0, exactStart);
    const tail = c.substring(exactEnd);
    
    c = head + '\n<AnimatePresence>\n' + replaceModal + '\n</AnimatePresence>\n' + tail;
  }
}

fs.writeFileSync(target, c);
console.log('Updated UI');
