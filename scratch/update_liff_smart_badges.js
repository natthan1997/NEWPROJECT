const fs = require('fs');
const targetFile = 'app/liff/member/page.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

const oldTiersFetch = `const { data: tiersData, error: tiersError } = await supabase.from('pos_loyalty_titles').select('*').order('rule_threshold', { ascending: true });
      if (tiersData && !tiersError) {
        setTiers(tiersData.map(t => ({
          name: t.name, 
          minPoints: t.rule_threshold, 
          bgHex: t.badge_color || '#F2ECE4', 
          textHex: '#1A1A18', 
          barHex: '#1A1A18', 
          benefits: t.description ? [t.description] : []
        })));
      }`;

const newTiersFetch = `// Fetch smart badges from our new API
      const lineUserId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
      try {
        const titlesRes = await fetch('/api/liff/member/titles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineUserId, memberId: member?.id || userId })
        });
        const titlesData = await titlesRes.json();
        if (titlesData.success) {
          setTiers(titlesData.titles.map((t: any) => ({
            name: t.name,
            minPoints: t.rule_threshold, // used for progress threshold
            bgHex: t.badge_color || '#F2ECE4',
            textHex: '#1A1A18',
            barHex: '#1A1A18',
            benefits: t.description ? [t.description] : [],
            isUnlocked: t.isUnlocked,
            progress: t.progress,
            currentValue: t.currentValue
          })));
        }
      } catch (err) {
        console.error('Failed to load smart badges', err);
      }`;

content = content.replace(oldTiersFetch, newTiersFetch);

// Update Tiers State Type
const oldTiersType = `const [tiers, setTiers] = useState<any[]>([]);`;
const newTiersType = `const [tiers, setTiers] = useState<any[]>([]);`;

// Update currentTier computation
const oldCurrentTier = `const currentTier = tiers.length > 0 ? [...tiers].reverse().find(t => (memberInfo?.points || 0) >= t.minPoints) || tiers[0] : null;`;
const newCurrentTier = `const currentTier = tiers.length > 0 ? [...tiers].reverse().find(t => t.isUnlocked) || tiers[0] : null;`;

content = content.replace(oldCurrentTier, newCurrentTier);

// Update Progress calculation in main card
const oldProgress = `const progress = currentTier && nextTier ? Math.min(100, Math.floor(((memberInfo?.points || 0) - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints) * 100)) : 100;`;
const newProgress = `const progress = currentTier ? (currentTier.progress || 0) : 0;`;

content = content.replace(oldProgress, newProgress);

// Render Badges Collection instead of Tiers List
// Find the Tiers List render section
const oldListHeader = `<h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6">{locale === 'en' ? 'Member Tiers' : 'ระดับสมาชิก'}</h3>`;
const newListHeader = `<h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6">{locale === 'en' ? 'Smart Badges Collection' : 'ตู้เก็บฉายา (Badges)'}</h3>`;
content = content.replace(oldListHeader, newListHeader);

const oldTiersRender = `{tiers.map((tier) => (
                    <div key={tier.name} className="flex gap-4">
                      <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-[13px] font-bold uppercase tracking-wider" style={{ backgroundColor: tier.bgHex, color: tier.textHex }}>
                        {tier.name[0]}
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <h4 className="text-[15px] font-medium text-gray-900">{tier.name}</h4>
                          <span className="text-[11px] text-gray-400 font-medium">/ {tier.minPoints.toLocaleString()} {dict.pts}</span>
                        </div>
                        <ul className="space-y-2">
                          {tier.benefits && tier.benefits.map((benefit: any, idx: number) => (
                            <li key={idx} className="text-[13px] text-gray-600 flex items-start gap-2">
                              <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: tier.bgHex }} />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}`;

const newTiersRender = `<div className="grid grid-cols-2 gap-4">
                  {tiers.map((tier) => (
                    <div key={tier.name} className={\`p-4 rounded-xl border relative overflow-hidden transition-all \${tier.isUnlocked ? 'border-gray-200 bg-white shadow-sm' : 'border-dashed border-gray-200 bg-gray-50 opacity-75'}\`}>
                      <div className="flex flex-col items-center text-center gap-3 relative z-10">
                        <div 
                          className={\`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shadow-inner \${tier.isUnlocked ? '' : 'grayscale opacity-50'}\`} 
                          style={{ backgroundColor: tier.isUnlocked ? tier.bgHex : '#e5e7eb', color: tier.isUnlocked ? tier.textHex : '#9ca3af' }}
                        >
                          {tier.name[0]}
                        </div>
                        <div>
                          <h4 className={\`text-[14px] font-bold \${tier.isUnlocked ? 'text-gray-900' : 'text-gray-500'}\`}>{tier.name}</h4>
                          {tier.benefits && tier.benefits[0] && (
                            <p className="text-[11px] text-gray-500 mt-1 leading-tight min-h-[30px]">{tier.benefits[0]}</p>
                          )}
                        </div>
                        
                        {/* Progress Bar inside badge */}
                        <div className="w-full mt-2">
                          <div className="flex justify-between text-[10px] font-medium mb-1">
                            <span className={tier.isUnlocked ? 'text-gray-700' : 'text-gray-400'}>ความคืบหน้า</span>
                            <span className={tier.isUnlocked ? 'text-gray-900' : 'text-gray-500'}>{tier.currentValue} / {tier.minPoints}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-1000" 
                              style={{ 
                                width: \`\${tier.progress}%\`, 
                                backgroundColor: tier.isUnlocked ? tier.bgHex : '#9ca3af' 
                              }} 
                            />
                          </div>
                        </div>
                      </div>
                      {tier.isUnlocked && (
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/20 rounded-full blur-xl" style={{ backgroundColor: tier.bgHex }} />
                      )}
                    </div>
                  ))}
                </div>`;

content = content.replace(oldTiersRender, newTiersRender);

// Also need to fix nextTier logic in the main card
const oldNextTier = `const nextTier = currentTier ? tiers.find(t => t.minPoints > currentTier.minPoints) : null;`;
const newNextTier = `const nextTier = currentTier ? tiers.find(t => t.minPoints > currentTier.minPoints) : null; // Kept for layout compatibility, but progress is now driven by currentTier.progress`;
content = content.replace(oldNextTier, newNextTier);

const oldCardSubtitle = `<p className="text-[12px] font-medium text-white/70 tracking-wide">{memberInfo?.points?.toLocaleString() || 0} {dict.pts}</p>`;
const newCardSubtitle = `<p className="text-[12px] font-medium text-white/70 tracking-wide">{currentTier ? \`ความคืบหน้า: \${currentTier.progress}%\` : \`\${memberInfo?.points?.toLocaleString() || 0} \${dict.pts}\`}</p>`;
content = content.replace(oldCardSubtitle, newCardSubtitle);


fs.writeFileSync(targetFile, content);
console.log('Update successful');
