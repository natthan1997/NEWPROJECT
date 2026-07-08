const fs = require('fs');
const target = 'app/liff/member/page.tsx';
let c = fs.readFileSync(target, 'utf8');

const search = `const [tiers] = useState([
    { name: 'Bronze', minPoints: 0, bg: 'bg-[#F2ECE4]', text: 'text-[#8C6D53]', barColor: 'bg-[#C19A6B]', benefits: ['อัตราสะสมคะแนน 100 บาท = 1 คะแนน', 'รับสิทธิ์ลุ้นกล่องสุ่มเมื่อครบ 50 คะแนน'] },
    { name: 'Silver', minPoints: 500, bg: 'bg-[#F0F2F5]', text: 'text-[#64748B]', barColor: 'bg-[#94A3B8]', benefits: ['อัตราสะสมคะแนน x1.2', 'เครื่องดื่มพิเศษในเดือนเกิด', 'สิทธิ์สั่งซื้อต้นไม้คอลเลกชันใหม่ล่วงหน้า 12 ชม.'] },
    { name: 'Gold', minPoints: 2000, bg: 'bg-[#FCF7E8]', text: 'text-[#B48529]', barColor: 'bg-[#D4AF37]', benefits: ['อัตราสะสมคะแนน x1.5', 'ส่วนลด 5% ทุกออเดอร์', 'สิทธิ์ Fast Track ลัดคิวเข้ารับบริการ', 'สิทธิ์สั่งซื้อต้นไม้ Rare Item ล่วงหน้า 24 ชม.'] },
    { name: 'Platinum', minPoints: 5000, bg: 'bg-[#EBF1F5]', text: 'text-[#3E6578]', barColor: 'bg-[#6495ED]', benefits: ['อัตราสะสมคะแนน x2.0', 'ส่วนลด 10% ทุกออเดอร์', 'สิทธิ์ Fast Track ขั้นสูงสุด', 'เบอร์ติดต่อสายตรง (Direct Line) ปรึกษาผู้เชี่ยวชาญ 24 ชม.'] }
  ]);`;

const replace = `const [tiers] = useState([
    { name: 'Bronze', minPoints: 0, bg: 'bg-[#F2ECE4]', text: 'text-[#8C6D53]', barColor: 'bg-[#C19A6B]', bgHex: '#F2ECE4', textHex: '#8C6D53', benefits: ['อัตราสะสมคะแนน 100 บาท = 1 คะแนน', 'รับสิทธิ์ลุ้นกล่องสุ่มเมื่อครบ 50 คะแนน'] },
    { name: 'Silver', minPoints: 500, bg: 'bg-[#F0F2F5]', text: 'text-[#64748B]', barColor: 'bg-[#94A3B8]', bgHex: '#F0F2F5', textHex: '#64748B', benefits: ['อัตราสะสมคะแนน x1.2', 'เครื่องดื่มพิเศษในเดือนเกิด', 'สิทธิ์สั่งซื้อต้นไม้คอลเลกชันใหม่ล่วงหน้า 12 ชม.'] },
    { name: 'Gold', minPoints: 2000, bg: 'bg-[#FCF7E8]', text: 'text-[#B48529]', barColor: 'bg-[#D4AF37]', bgHex: '#FCF7E8', textHex: '#B48529', benefits: ['อัตราสะสมคะแนน x1.5', 'ส่วนลด 5% ทุกออเดอร์', 'สิทธิ์ Fast Track ลัดคิวเข้ารับบริการ', 'สิทธิ์สั่งซื้อต้นไม้ Rare Item ล่วงหน้า 24 ชม.'] },
    { name: 'Platinum', minPoints: 5000, bg: 'bg-[#EBF1F5]', text: 'text-[#3E6578]', barColor: 'bg-[#6495ED]', bgHex: '#EBF1F5', textHex: '#3E6578', benefits: ['อัตราสะสมคะแนน x2.0', 'ส่วนลด 10% ทุกออเดอร์', 'สิทธิ์ Fast Track ขั้นสูงสุด', 'เบอร์ติดต่อสายตรง (Direct Line) ปรึกษาผู้เชี่ยวชาญ 24 ชม.'] }
  ]);`;

c = c.replace(search, replace);
fs.writeFileSync(target, c);
console.log('Fixed tier hex colors');
