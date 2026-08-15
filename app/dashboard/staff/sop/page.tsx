'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, AlertTriangle, Clock, Users, Sparkles, Star, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function StaffSOPPage() {
    return (
        <div className="min-h-screen bg-[#F5F5F0] text-[#4A2C11] font-sans pb-16">
            
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E5E5DF] px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/staff" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ChevronLeft size={24} className="text-[#4A2C11]" />
                    </Link>
                    <div>
                        <h1 className="text-[18px] font-black text-[#4A2C11] leading-tight">คู่มือพนักงาน (SOP)</h1>
                        <p className="text-[11px] font-medium text-gray-500">มาตรฐานการบริการและกฎระเบียบภายใน</p>
                    </div>
                </div>
                <BookOpen size={24} className="text-[#965A27] opacity-20 absolute right-6" />
            </div>

            <div className="max-w-3xl mx-auto p-4 space-y-6 mt-2">
                
                {/* Title Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-6 border border-[#E5E5DF] shadow-sm text-center"
                >
                    <h2 className="text-[22px] font-black text-[#6B3E11] mb-2 leading-tight">คู่มือปฏิบัติงานและประเมินผลพนักงาน<br/>ฉบับสมบูรณ์</h2>
                    <p className="text-[13px] font-semibold text-[#965A27] mb-6">Comprehensive Operations & Evaluation Manual</p>
                    
                    <div className="border border-[#965A27] text-[#6B3E11] font-bold text-[14px] py-2 px-4 inline-block mb-6">
                        มาตรฐานการบริการและกฎระเบียบภายใน
                    </div>

                    <div className="bg-[#FFFAF0] border border-[#FDE6A6] rounded-2xl p-4 text-left max-w-sm mx-auto">
                        <div className="flex justify-between border-b border-dashed border-[#E5E5DF] pb-2 mb-2">
                            <span className="font-bold text-[#6B3E11] text-[13px]">ชื่อร้าน:</span>
                            <span className="text-gray-500 text-[13px]">[กรอกชื่อร้าน]</span>
                        </div>
                        <div className="flex justify-between border-b border-dashed border-[#E5E5DF] pb-2 mb-2">
                            <span className="font-bold text-[#6B3E11] text-[13px]">สาขา:</span>
                            <span className="text-[#4A2C11] font-medium text-[13px]">สันกำแพง</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold text-[#6B3E11] text-[13px]">วันที่อัปเดต:</span>
                            <span className="text-[#4A2C11] font-medium text-[13px]">31 กรกฎาคม 2026</span>
                        </div>
                    </div>
                </motion.div>

                {/* Section 1 */}
                <Section title="หมวดที่ 1: มาตรฐานรูปลักษณ์ สุขอนามัย และการแต่งกาย" icon={<Sparkles size={20}/>}>
                    <SubSection title="1.1 เครื่องแบบและสุขอนามัย (Grooming & Hygiene)">
                        <ListItem><strong>เครื่องแต่งกาย:</strong> สวมใส่เสื้อฟอร์มที่สะอาด รีดเรียบร้อย กางเกงขายาวสีสุภาพ สวมผ้ากันเปื้อนตลอดเวลา และสวมรองเท้าหุ้มส้นกันลื่นเสมอ</ListItem>
                        <ListItem><strong>ทรงผมและใบหน้า:</strong> ชายตัดผมสั้น โกนหนวดเครา หญิงผมยาวต้องรวบตึงและใส่เน็ตคลุมผม หน้าตาสดใสยิ้มแย้ม</ListItem>
                        <ListItem><strong>เล็บและเครื่องประดับ:</strong> ตัดเล็บสั้น ห้ามทาสีเล็บ/ต่อเล็บ ห้ามสวมนาฬิกาข้อมือหรือสร้อยข้อมือขณะปฏิบัติงานในบาร์เพื่อป้องกันการปนเปื้อน</ListItem>
                        <ListItem><strong>กลิ่นกาย:</strong> ระงับกลิ่นกายให้ดี ห้ามฉีดน้ำหอมที่มีกลิ่นฉุนรุนแรง เพราะจะไปรบกวนกลิ่นของกาแฟและอาหาร</ListItem>
                    </SubSection>
                </Section>

                {/* Section 2 */}
                <Section title="หมวดที่ 2: การตรงต่อเวลา การเข้า-ออกงาน และการลางาน" icon={<Clock size={20}/>}>
                    <SubSection title="2.1 การลงเวลาและการลางาน (Attendance Standards)">
                        <ListItem><strong>การเข้างาน:</strong> ต้องมาถึงร้านและเตรียมความพร้อม (เปลี่ยนชุด) เพื่อสแตนด์บายก่อนเวลาเข้ากะจริงอย่างน้อย 15-30 นาที</ListItem>
                        <ListItem><strong>การลงเวลา:</strong> ต้องลงเวลาเข้า-ออกด้วยตนเอง ห้ามฝากเพื่อนลงเวลาเด็ดขาด (ถือเป็นความผิดร้ายแรง)</ListItem>
                        <ListItem><strong>การลาป่วย/ลากิจ:</strong> ลาป่วยต้องแจ้งล่วงหน้าอย่างน้อย 2 ชม. (หยุดเกิน 2 วันต้องมีใบรับรองแพทย์) ลากิจต้องส่งใบลาก่อนล่วงหน้า 3-5 วัน</ListItem>
                        <ListItem><strong>การขาดงาน:</strong> ขาดงานโดยไม่แจ้งล่วงหน้า (ทิ้งกะ) หรือติดต่อไม่ได้เกิน 3 วัน ร้านจะเลิกจ้างทันทีโดยไม่จ่ายค่าชดเชย</ListItem>
                    </SubSection>
                </Section>

                {/* Section 3 */}
                <Section title="หมวดที่ 3: พฤติกรรม มารยาท และข้อห้ามขณะปฏิบัติงาน" icon={<AlertTriangle size={20}/>}>
                    <SubSection title="3.1 กฎเหล็กพื้นที่บริการ (On-Duty Conduct)">
                        <div className="bg-[#FFF0F0] text-[#B02A2A] p-4 rounded-xl mb-4 border border-[#FAD2D2]">
                            <h4 className="font-bold text-[14px] mb-1">กฎระเบียบเรื่องโทรศัพท์มือถือ:</h4>
                            <p className="text-[13px] font-medium leading-relaxed">ห้ามเล่นโทรศัพท์มือถือส่วนตัว โซเชียลมีเดีย หรือเกม ในพื้นที่บริการและหน้าบาร์โดยเด็ดขาด ให้ใช้ได้เฉพาะช่วงพักในพื้นที่หลังร้านเท่านั้น</p>
                        </div>
                        <ListItem>ห้ามจับกลุ่มคุยเล่นเสียงดัง หยอกล้อ หรือแสดงอาการเหนื่อยหน่าย ฟุบโต๊ะ ในพื้นที่ที่ลูกค้ามองเห็น</ListItem>
                        <ListItem>ห้ามรับประทานอาหาร ขนม หรือเคี้ยวหมากฝรั่งในพื้นที่บริการ (ให้ทานในจุดพักหลังร้านเท่านั้น)</ListItem>
                        <ListItem>ห้ามใช้วาจาหยาบคาย พูดส่อเสียด หรือนินทาลูกค้า/เพื่อนร่วมงานในระยะที่ลูกค้าอาจได้ยิน</ListItem>
                    </SubSection>
                </Section>

                {/* Section 4 */}
                <Section title="หมวดที่ 4: มาตรฐานการบริการและการสื่อสารกับลูกค้า" icon={<Users size={20}/>}>
                    <SubSection title="4.1 ขั้นตอนบริการและการรับมือข้อร้องเรียน">
                        <ListItem><strong>การต้อนรับ:</strong> กล่าวคำทักทาย "สวัสดีครับ/ค่ะ ยินดีต้อนรับครับ/ค่ะ" พร้อมรอยยิ้มและการสบตา (Eye Contact) ทุกครั้ง</ListItem>
                        <ListItem><strong>การรับ-เสิร์ฟออเดอร์:</strong> ทวนรายการอาหาร/เครื่องดื่มทุกครั้งก่อนคิดเงิน เสิร์ฟอย่างระมัดระวัง หันโลโก้เข้าหาลูกค้าเสมอ</ListItem>
                        <ListItem>
                            <strong>หลัก LAST รับมือข้อร้องเรียน:</strong>
                            <div className="ml-4 mt-2 space-y-1 text-[13px]">
                                <div>1. <strong>L-Listen:</strong> รับฟังอย่างตั้งใจ</div>
                                <div>2. <strong>A-Apologize:</strong> กล่าวขอโทษด้วยความจริงใจ</div>
                                <div>3. <strong>S-Solve:</strong> เสนอทางแก้ไขทันที (เช่น ทำแก้วใหม่ให้)</div>
                                <div>4. <strong>T-Thank:</strong> ขอบคุณลูกค้าที่ช่วยติชม</div>
                            </div>
                        </ListItem>
                    </SubSection>
                </Section>

                {/* Section 5 */}
                <Section title="หมวดที่ 5: มาตรฐานความสะอาดและการจัดการร้าน" icon={<Sparkles size={20}/>}>
                    <SubSection title="5.1 ความสะอาด (Clean as you go)">
                        <ListItem><strong>สเตชันบาร์:</strong> เช็ดทำความสะอาดก้านชง (Portafilter) และพ่นไอน้ำไล่นมทันทีหลังใช้งาน โต๊ะบาร์ต้องแห้งตลอดเวลา</ListItem>
                        <ListItem><strong>หน้าร้าน:</strong> เมื่อลูกค้าลุกออกจากโต๊ะ ต้องรีบเคลียร์จานชามและเช็ดโต๊ะด้วยน้ำยาฆ่าเชื้อทันที</ListItem>
                        <ListItem><strong>การจัดการขยะ:</strong> เมื่อขยะเต็ม 3/4 ของถัง ต้องมัดปากถุงนำไปทิ้งจุดรวมขยะหลังร้าน ห้ามปล่อยให้ขยะล้นหรือส่งกลิ่นเหม็น</ListItem>
                    </SubSection>
                </Section>

                {/* Section 6 */}
                <Section title="หมวดที่ 6: ระเบียบวินัยและบทลงโทษ" icon={<AlertTriangle size={20}/>}>
                    <SubSection title="6.1 ลำดับขั้นบทลงโทษ (Disciplinary Action)">
                        <ListItem><strong>ความผิดทั่วไป:</strong> ครั้งที่ 1 ตักเตือนด้วยวาจา &gt; ครั้งที่ 2 ออกใบเตือนฉบับที่ 1 &gt; ครั้งที่ 3 ออกใบเตือนฉบับที่ 2 และพักงาน &gt; ครั้งที่ 4 เลิกจ้าง</ListItem>
                        <ListItem><strong>ความผิดร้ายแรง (เลิกจ้างทันที):</strong> ทุจริตยักยอกเงิน, ทะเลาะวิวาททำร้ายร่างกาย, ดื่มแอลกอฮอล์/เสพยาในเวลางาน, ขาดงานเกิน 3 วันโดยไม่แจ้ง, ขโมยสูตรความลับร้านไปเผยแพร่</ListItem>
                    </SubSection>
                </Section>

                {/* Section 7 - Evaluation Form */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white rounded-3xl overflow-hidden border border-[#E5E5DF] shadow-sm"
                >
                    <div className="bg-[#965A27] text-white p-4 font-bold text-[16px] flex items-center gap-2">
                        <Star size={20} /> ส่วนที่ 7: แบบประเมินประสิทธิภาพการทำงาน
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead>
                                <tr className="bg-[#6B3E11] text-white text-[12px]">
                                    <th className="p-3 font-semibold">หัวข้อการประเมินประสิทธิภาพ (Performance Criteria)</th>
                                    <th className="p-3 text-center w-8">5</th>
                                    <th className="p-3 text-center w-8">4</th>
                                    <th className="p-3 text-center w-8">3</th>
                                    <th className="p-3 text-center w-8">2</th>
                                    <th className="p-3 text-center w-8">1</th>
                                </tr>
                            </thead>
                            <tbody>
                                <EvaluationGroup title="1. ทักษะวิชาชีพและคุณภาพเครื่องดื่ม (Barista Hard Skills)" />
                                <EvaluationRow 
                                    title="1.1 การสกัดช็อต (Extraction)" 
                                    desc="ตั้งค่าเครื่องบดแม่นยำ สกัดช็อตได้รสชาติและปริมาณตามมาตรฐานร้าน" 
                                />
                                <EvaluationRow 
                                    title="1.2 การสตีมนม (Steaming)" 
                                    desc="อุณหภูมินมถูกต้อง โฟมนมเนียนละเอียด เทลาเต้อาร์ตพื้นฐานได้" 
                                />
                                <EvaluationRow 
                                    title="1.3 ความแม่นยำของสูตร (Recipe Consistency)" 
                                    desc="ชงเครื่องดื่มได้รสชาติสม่ำเสมอ ไม่ลืมส่วนผสม ใส่ใจรายละเอียด" 
                                />
                                <EvaluationRow 
                                    title="1.4 ความเร็วและความแม่นยำ (Speed)" 
                                    desc="จัดการออเดอร์ช่วงลูกค้าหนาแน่นได้รวดเร็ว ไม่ทำสลับคิว" 
                                />

                                <EvaluationGroup title="2. งานบริการและการขาย (Customer Service & Upselling)" bg="bg-[#FFF8E6]" text="text-[#965A27]" />
                                <EvaluationRow 
                                    title="2.1 การต้อนรับ" 
                                    desc="ทักทายลูกค้าอย่างอบอุ่น สุภาพ ยิ้มแย้ม และมี Service Mind เสมอ" 
                                    bg="bg-[#FFF8E6]"
                                />
                                <EvaluationRow 
                                    title="2.2 ความรู้เรื่องเมนู" 
                                    desc="อธิบายคาแรคเตอร์เมล็ดกาแฟ ส่วนผสม และแนะนำเมนูให้ตรงใจลูกค้าได้" 
                                    bg="bg-[#FFF8E6]"
                                />
                                <EvaluationRow 
                                    title="2.3 การเสนอขาย (Upsell)" 
                                    desc="มีทักษะเสนอขายขนม เบเกอรี่ หรือสินค้าเพิ่มเติมได้อย่างเป็นธรรมชาติ" 
                                    bg="bg-[#FFF8E6]"
                                />
                                <EvaluationRow 
                                    title="2.4 การแก้ปัญหา" 
                                    desc="รับมือข้อร้องเรียนของลูกค้า (Complaint) ได้อย่างสุภาพและเป็นมืออาชีพ" 
                                    bg="bg-[#FFF8E6]"
                                />

                                <EvaluationGroup title="3. การจัดการสเตชันและความสะอาด (Station Management)" />
                                <EvaluationRow 
                                    title="3.1 Clean as you go" 
                                    desc="เคาะกาก เช็ดหัวกรุ๊ป ล้างก้านนมทันที โต๊ะบาร์แห้งและสะอาดเสมอ" 
                                />
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                <div className="h-8"></div>
            </div>
        </div>
    );
}

function Section({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-white rounded-3xl overflow-hidden border border-[#E5E5DF] shadow-sm"
        >
            <div className="bg-[#965A27] text-white p-4 font-bold text-[16px] flex items-center gap-2">
                {icon}
                {title}
            </div>
            <div className="p-5 space-y-6">
                {children}
            </div>
        </motion.div>
    );
}

function SubSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-[14px] font-bold text-[#6B3E11] mb-3 pb-2 border-b border-dashed border-[#E5E5DF] inline-block">{title}</h3>
            <ul className="space-y-3">
                {children}
            </ul>
        </div>
    );
}

function ListItem({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex items-start gap-2 text-[14px] leading-relaxed text-[#4A2C11]">
            <div className="min-w-[6px] h-[6px] rounded-full bg-[#965A27] mt-[8px]"></div>
            <div>{children}</div>
        </li>
    );
}

function EvaluationGroup({ title, bg = "bg-[#FCF7E8]", text = "text-[#6B3E11]" }: { title: string, bg?: string, text?: string }) {
    return (
        <tr>
            <td colSpan={6} className={`p-3 font-bold text-[13px] ${bg} ${text} border-b border-[#E5E5DF]`}>
                {title}
            </td>
        </tr>
    );
}

function EvaluationRow({ title, desc, bg = "bg-white" }: { title: string, desc: string, bg?: string }) {
    return (
        <tr className={`border-b border-[#E5E5DF] ${bg}`}>
            <td className="p-3">
                <div className="font-bold text-[13px] text-[#4A2C11]">{title}:</div>
                <div className="text-[12px] text-gray-600 mt-1">{desc}</div>
            </td>
            {[5,4,3,2,1].map(num => (
                <td key={num} className="p-3 text-center align-middle">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 mx-auto bg-white flex items-center justify-center">
                        {/* Empty circle like in image */}
                    </div>
                </td>
            ))}
        </tr>
    );
}
