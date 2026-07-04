const fs = require('fs');
let code = fs.readFileSync('app/liff/member/page.tsx', 'utf8');

// Replace TIERS hardcoding with state and default
const defaultTiers = `
  const [tiers, setTiers] = useState([
    { name: 'Bronze', minPoints: 0, bg: 'bg-[#F2ECE4]', text: 'text-[#8C6D53]', barColor: 'bg-[#C19A6B]', benefits: ['อัตราสะสมคะแนน 100 บาท = 1 คะแนน', 'รับสิทธิ์ลุ้นกล่องสุ่มเมื่อครบ 50 คะแนน'] },
    { name: 'Silver', minPoints: 500, bg: 'bg-[#F0F2F5]', text: 'text-[#64748B]', barColor: 'bg-[#94A3B8]', benefits: ['อัตราสะสมคะแนน x1.2', 'เครื่องดื่มพิเศษในเดือนเกิด', 'สิทธิ์สั่งซื้อต้นไม้คอลเลกชันใหม่ล่วงหน้า 12 ชม.'] },
    { name: 'Gold', minPoints: 2000, bg: 'bg-[#FCF7E8]', text: 'text-[#B48529]', barColor: 'bg-[#D4AF37]', benefits: ['อัตราสะสมคะแนน x1.5', 'ส่วนลด 5% ทุกออเดอร์', 'สิทธิ์ Fast Track ลัดคิวเข้ารับบริการ', 'สิทธิ์สั่งซื้อต้นไม้ Rare Item ล่วงหน้า 24 ชม.'] },
    { name: 'Platinum', minPoints: 5000, bg: 'bg-[#EBF1F5]', text: 'text-[#3E6578]', barColor: 'bg-[#6495ED]', benefits: ['อัตราสะสมคะแนน x2.0', 'ส่วนลด 10% ทุกออเดอร์', 'สิทธิ์ Fast Track ขั้นสูงสุด', 'เบอร์ติดต่อสายตรง (Direct Line) ปรึกษาผู้เชี่ยวชาญ 24 ชม.'] }
  ]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
`;
code = code.replace(/const TIERS = \[[\s\S]*?\];/g, defaultTiers.trim());

// Update fetchData
const newFetchData = `
  const fetchData = async () => {
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    if (!userId) return;
    try {
      setLoading(true);
      const { data: member } = await supabase.from('pos_members').select('*').eq('line_user_id', userId).maybeSingle();
      if (member) setMemberInfo(member);
      const { data: history } = await supabase.from('pos_points_history').select('*').eq('member_id', userId).order('created_at', { ascending: false });
      if (history) setPointsHistory(history);
      const { data: rewardsData } = await supabase.from('pos_rewards').select('*').eq('is_active', true).order('points_required', { ascending: true });
      if (rewardsData) setRewards(rewardsData);
      
      const { data: tiersData, error: tiersError } = await supabase.from('pos_loyalty_tiers').select('*').eq('is_active', true).order('min_points', { ascending: true });
      if (tiersData && !tiersError) {
        setTiers(tiersData.map(t => ({
          name: t.name, minPoints: t.min_points, bg: t.bg_color, text: t.text_color, barColor: t.bar_color, benefits: t.benefits
        })));
      }
      
      const { data: campData, error: campError } = await supabase.from('pos_campaigns').select('*').eq('is_active', true).order('sort_order', { ascending: true });
      if (campData && !campError) {
        setCampaigns(campData);
      } else {
        // Fallback default campaigns if table not ready
        setCampaigns([
          { id: '1', title: 'ฝนตกรับคะแนน x2', description: 'รับคะแนนสองเท่าทุกออเดอร์ในวันฝนตก!', icon: '🌧️', type_tag: 'Flash Event', bg_gradient_from: 'from-[#EBF1F5]', bg_gradient_to: 'to-[#D6E4EE]', text_color: 'text-[#1F333C]', tag_color: 'text-[#3E6578]' },
          { id: '2', title: 'ลุ้นกล่องสุ่มทุก 50 Pts', description: 'สะสมครบทุก 50 คะแนน รับสิทธิ์เปิดกล่องสุ่มส่วนลด!', icon: '🎁', type_tag: 'Milestone', bg_gradient_from: 'from-[#FCF7E8]', bg_gradient_to: 'to-[#F5E6C4]', text_color: 'text-[#8B651B]', tag_color: 'text-[#B48529]' },
          { id: '3', title: 'รักษาสถานะของคุณ', description: 'อย่าลืมซื้อสินค้า 1 ชิ้นภายใน 30 วันเพื่อคงระดับ', icon: '⚠️', type_tag: 'Expiring Soon', bg_gradient_from: 'from-[#FFF0F0]', bg_gradient_to: 'to-[#FFE0E0]', text_color: 'text-[#B33535]', tag_color: 'text-[#D94C4C]' }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
`;
code = code.replace(/const fetchData = async \(\) => \{[\s\S]*?\}\s*catch[^\}]*\}\s*finally[^\}]*\}\s*\};/g, newFetchData.trim());

// Update Tier calculations to use 'tiers' state instead of TIERS
code = code.replace(/TIERS/g, 'tiers');
// Wait, we just replaced 'TIERS' with 'tiers'. Let's ensure currentTier default is safe if tiers is empty
// No, tiers will default to the fallback, so it's fine.

// Replace hardcoded banners with mapped campaigns
const bannersRegex = /\{\/\* Banner 1:[\s\S]*?Banner 3:[\s\S]*?<\/div>\s*<\/div>/g;
const newBanners = `
            {campaigns.map((camp) => (
              <div key={camp.id} className={\`min-w-[240px] snap-center bg-gradient-to-br \${camp.bg_gradient_from} \${camp.bg_gradient_to} rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden\`}>
                <div className="absolute -right-4 -top-4 text-6xl opacity-10">{camp.icon}</div>
                <div>
                  <span className={\`text-[10px] font-bold uppercase tracking-wider \${camp.tag_color} bg-white/50 px-2 py-1 rounded-md mb-2 inline-block\`}>
                    {camp.type_tag}
                  </span>
                  <h4 className={\`text-[14px] font-semibold \${camp.text_color} leading-tight mb-1\`}>{camp.title}</h4>
                  <p className={\`text-[12px] \${camp.tag_color}\`}>{camp.description}</p>
                </div>
              </div>
            ))}
`;
code = code.replace(bannersRegex, newBanners.trim());

fs.writeFileSync('app/liff/member/page.tsx', code);
console.log("Updated LIFF Member page!");
