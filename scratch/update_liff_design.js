const fs = require('fs');

const targetFile = 'app/liff/member/page.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Fix fetchCampaigns mapping to restore gradients
const oldCampaignFetch = `const { data: campData, error: campError } = await supabase.from('pos_loyalty_campaigns').select('*').eq('is_active', true);
      if (campData && !campError) {
        setCampaigns(campData);
      } else {`;

const newCampaignFetch = `const { data: campData, error: campError } = await supabase.from('pos_loyalty_campaigns').select('*').eq('is_active', true);
      if (campData && !campError) {
        const defaultGradients = [
          { from: 'from-orange-100', to: 'to-amber-50', text: 'text-orange-900', tag: 'text-orange-800' },
          { from: 'from-blue-100', to: 'to-cyan-50', text: 'text-blue-900', tag: 'text-blue-800' },
          { from: 'from-purple-100', to: 'to-pink-50', text: 'text-purple-900', tag: 'text-purple-800' },
          { from: 'from-emerald-100', to: 'to-teal-50', text: 'text-emerald-900', tag: 'text-emerald-800' },
        ];
        
        setCampaigns(campData.map((c, i) => {
          const style = defaultGradients[i % defaultGradients.length];
          return {
            ...c,
            title: c.name,
            description: c.applicable_categories && c.applicable_categories.length > 0 ? \`เฉพาะหมวด: \${c.applicable_categories.join(', ')}\` : 'ทุกหมวดหมู่',
            bg_gradient_from: style.from,
            bg_gradient_to: style.to,
            text_color: style.text,
            tag_color: style.tag,
            icon: '✨',
            type_tag: \`แต้ม x\${c.point_multiplier}\`
          };
        }));
      } else {`;

content = content.replace(oldCampaignFetch, newCampaignFetch);

// 2. Fix Tiers fetching
const oldTiersFetch = `const { data: tiersData, error: tiersError } = await supabase.from('pos_loyalty_titles').select('*').order('rule_threshold', { ascending: true });
      if (tiersData && !tiersError) {
        setTiers(tiersData.map(t => ({
          name: t.name, minPoints: t.rule_threshold, bg: t.badge_color ? \`bg-[\${t.badge_color}]\` : 'bg-[#F2ECE4]', text: 'text-[#1A1A18]', barColor: 'bg-[#1A1A18]', benefits: []
        })));
      }`;

const newTiersFetch = `const { data: tiersData, error: tiersError } = await supabase.from('pos_loyalty_titles').select('*').order('rule_threshold', { ascending: true });
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

content = content.replace(oldTiersFetch, newTiersFetch);

// 3. Fix Tiers Render in the Card
const oldCardRender = `className={\`w-full rounded-2xl p-6 \${currentTier.bg} transition-colors duration-500\`}`;
const newCardRender = `className="w-full rounded-2xl p-6 transition-colors duration-500" style={{ backgroundColor: currentTier.bgHex || '#F2ECE4' }}`;
content = content.replace(oldCardRender, newCardRender);

// 4. Fix Progress Bar Render
const oldBarRender = `className={\`h-full rounded-full transition-all duration-1000 \${currentTier.barColor}\`}`;
const newBarRender = `className="h-full rounded-full transition-all duration-1000" style={{ backgroundColor: currentTier.barHex || '#1A1A18' }}`;
content = content.replace(oldBarRender, newBarRender);

// 5. Fix Tier Tag Render (Card text)
const oldTagRender = `className={\`px-3 py-1 rounded-full bg-black/5 text-[10px] font-black uppercase tracking-widest \${currentTier.text}\`}`;
const newTagRender = `className="px-3 py-1 rounded-full bg-black/5 text-[10px] font-black uppercase tracking-widest" style={{ color: currentTier.textHex || '#1A1A18' }}`;
content = content.replace(oldTagRender, newTagRender);

// 6. Fix Tiers List Render
const oldListAvatar = `className={\`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center \${tier.bg} \${tier.text} text-[13px] font-bold uppercase tracking-wider\`}`;
const newListAvatar = `className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-[13px] font-bold uppercase tracking-wider" style={{ backgroundColor: tier.bgHex, color: tier.textHex }}`;
content = content.replace(oldListAvatar, newListAvatar);

// 7. Fix Tiers Bullet Render
const oldBullet = `className={\`mt-1.5 w-1 h-1 rounded-full \${tier.bg} flex-shrink-0\`} />`;
const newBullet = `className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: tier.bgHex }} />`;
content = content.replace(oldBullet, newBullet);

// 8. Fix Campaign Tag background (camp.tag_color had 'bg-white/50' in original but mapped differently now)
const oldCampTag = `className={\`text-[10px] font-bold uppercase tracking-wider \${camp.tag_color} bg-white/50 px-2 py-1 rounded-md mb-2 inline-block\`}`;
const newCampTag = `className={\`text-[10px] font-bold uppercase tracking-wider \${camp.tag_color} bg-white/60 px-2 py-1 rounded-md mb-2 inline-block\`}`;
content = content.replace(oldCampTag, newCampTag);


fs.writeFileSync(targetFile, content);
console.log('Done fixing design');
