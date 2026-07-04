import fs from 'fs';

const filePath = 'app/liff/member/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// We need to inject a "Campaigns" section just below the Tier Card (section 1).
// Look for `</section>` which closes the Tier Card.
const insertPoint = content.indexOf('</section>') + '</section>'.length;

const campaignsSection = `
        {/* 📢 Special Campaigns / Gamification Banners */}
        <section className="space-y-3">
          <h3 className="text-[14px] font-medium text-gray-900 px-1">{locale === 'en' ? 'Special Campaigns' : 'แคมเปญพิเศษ'}</h3>
          
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x no-scrollbar -mx-5 px-5">
            {/* Banner 1: Double Points (Random/Weather) */}
            <div className="min-w-[240px] snap-center bg-gradient-to-br from-[#EBF1F5] to-[#D6E4EE] rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-6xl opacity-10">🌧️</div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3E6578] bg-white/50 px-2 py-1 rounded-md mb-2 inline-block">
                  Flash Event
                </span>
                <h4 className="text-[14px] font-semibold text-[#1F333C] leading-tight mb-1">ฝนตกรับคะแนน x2</h4>
                <p className="text-[12px] text-[#3E6578]">รับคะแนนสองเท่าทุกออเดอร์ในวันฝนตก!</p>
              </div>
            </div>

            {/* Banner 2: Surprise Box / Gamification */}
            <div className="min-w-[240px] snap-center bg-gradient-to-br from-[#FCF7E8] to-[#F5E6C4] rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-6xl opacity-10">🎁</div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B48529] bg-white/50 px-2 py-1 rounded-md mb-2 inline-block">
                  Milestone
                </span>
                <h4 className="text-[14px] font-semibold text-[#8B651B] leading-tight mb-1">ลุ้นกล่องสุ่มทุก 50 Pts</h4>
                <p className="text-[12px] text-[#B48529]">สะสมครบทุก 50 คะแนน รับสิทธิ์เปิดกล่องสุ่มส่วนลด!</p>
              </div>
            </div>

            {/* Banner 3: FOMO / Expiry */}
            <div className="min-w-[240px] snap-center bg-gradient-to-br from-[#FFF0F0] to-[#FFE0E0] rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-6xl opacity-10">⚠️</div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D94C4C] bg-white/50 px-2 py-1 rounded-md mb-2 inline-block">
                  Expiring Soon
                </span>
                <h4 className="text-[14px] font-semibold text-[#B33535] leading-tight mb-1">รักษาสถานะของคุณ</h4>
                <p className="text-[12px] text-[#D94C4C]">อย่าลืมซื้อสินค้า 1 ชิ้นภายใน 30 วันเพื่อคงระดับ {currentTier.name}</p>
              </div>
            </div>
          </div>
        </section>
`;

const updatedContent = content.substring(0, insertPoint) + '\n' + campaignsSection + content.substring(insertPoint);
fs.writeFileSync(filePath, updatedContent);

// Also let's update the Benefits texts to reflect the Exclusive benefits
let benefitsContent = fs.readFileSync(filePath, 'utf8');

// Replace the old tier definitions
const oldTiers = `  const TIERS = [
    { 
      name: 'Bronze', minPoints: 0, 
      bg: 'bg-[#F2ECE4]', 
      text: 'text-[#8C6D53]', 
      barColor: 'bg-[#C19A6B]',
      benefits: ['อัตราสะสมคะแนนปกติ']
    },
    { 
      name: 'Silver', minPoints: 500, 
      bg: 'bg-[#F0F2F5]', 
      text: 'text-[#64748B]', 
      barColor: 'bg-[#94A3B8]',
      benefits: ['อัตราสะสมคะแนน x1.2', 'รับเครื่องดื่มฟรีในเดือนเกิด']
    },
    { 
      name: 'Gold', minPoints: 2000, 
      bg: 'bg-[#FCF7E8]', 
      text: 'text-[#B48529]', 
      barColor: 'bg-[#D4AF37]',
      benefits: ['อัตราสะสมคะแนน x1.5', 'ส่วนลด 5% ทุกออเดอร์', 'เค้กและเครื่องดื่มฟรีในเดือนเกิด']
    },
    { 
      name: 'Platinum', minPoints: 5000, 
      bg: 'bg-[#EBF1F5]', 
      text: 'text-[#3E6578]', 
      barColor: 'bg-[#6495ED]',
      benefits: ['อัตราสะสมคะแนน x2.0', 'ส่วนลด 10% ทุกออเดอร์', 'เข้าร่วมเวิร์กชอปประจำปีฟรี']
    }
  ];`;

const newTiers = `  const TIERS = [
    { 
      name: 'Bronze', minPoints: 0, 
      bg: 'bg-[#F2ECE4]', 
      text: 'text-[#8C6D53]', 
      barColor: 'bg-[#C19A6B]',
      benefits: ['อัตราสะสมคะแนน 100 บาท = 1 คะแนน', 'รับสิทธิ์ลุ้นกล่องสุ่มเมื่อครบ 50 คะแนน']
    },
    { 
      name: 'Silver', minPoints: 500, 
      bg: 'bg-[#F0F2F5]', 
      text: 'text-[#64748B]', 
      barColor: 'bg-[#94A3B8]',
      benefits: ['อัตราสะสมคะแนน x1.2', 'เครื่องดื่มพิเศษในเดือนเกิด', 'สิทธิ์สั่งซื้อต้นไม้คอลเลกชันใหม่ล่วงหน้า 12 ชม.']
    },
    { 
      name: 'Gold', minPoints: 2000, 
      bg: 'bg-[#FCF7E8]', 
      text: 'text-[#B48529]', 
      barColor: 'bg-[#D4AF37]',
      benefits: ['อัตราสะสมคะแนน x1.5', 'ส่วนลด 5% ทุกออเดอร์', 'สิทธิ์ Fast Track ลัดคิวเข้ารับบริการ', 'สิทธิ์สั่งซื้อต้นไม้ Rare Item ล่วงหน้า 24 ชม.']
    },
    { 
      name: 'Platinum', minPoints: 5000, 
      bg: 'bg-[#EBF1F5]', 
      text: 'text-[#3E6578]', 
      barColor: 'bg-[#6495ED]',
      benefits: ['อัตราสะสมคะแนน x2.0', 'ส่วนลด 10% ทุกออเดอร์', 'สิทธิ์ Fast Track ขั้นสูงสุด', 'เบอร์ติดต่อสายตรง (Direct Line) ปรึกษาผู้เชี่ยวชาญ 24 ชม.']
    }
  ];`;

benefitsContent = benefitsContent.replace(oldTiers, newTiers);
// Also hide the scrollbar with CSS if not existing, but Tailwind no-scrollbar requires a plugin usually, 
// let's just add style directly to the div.
benefitsContent = benefitsContent.replace('no-scrollbar', 'style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} [&::-webkit-scrollbar]:hidden');

fs.writeFileSync(filePath, benefitsContent);
console.log('Added Campaigns and updated Tier Benefits');
