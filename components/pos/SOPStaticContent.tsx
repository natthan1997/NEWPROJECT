import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Users, Sparkles, Star, Edit, Printer, X, Save } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface SOPData {
    shopName: string;
    branchName: string;
    updatedDate: string;
    sec1_uniform: string;
    sec1_hair: string;
    sec1_nails: string;
    sec1_scent: string;
    sec2_arrive: string;
    sec2_clock: string;
    sec2_leave: string;
    sec2_absent: string;
    sec3_phone: string;
    sec3_talk: string;
    sec3_eat: string;
    sec3_rude: string;
    sec4_greet: string;
    sec4_order: string;
    sec5_bar: string;
    sec5_front: string;
    sec5_trash: string;
    sec6_general: string;
    sec6_severe: string;
}

const DEFAULT_DATA: SOPData = {
    shopName: "[กรอกชื่อร้าน]",
    branchName: "สันกำแพง",
    updatedDate: "31 กรกฎาคม 2026",
    sec1_uniform: "สวมใส่เสื้อฟอร์มที่สะอาด รีดเรียบร้อย กางเกงขายาวสีสุภาพ สวมผ้ากันเปื้อนตลอดเวลา และสวมรองเท้าหุ้มส้นกันลื่นเสมอ",
    sec1_hair: "ชายตัดผมสั้น โกนหนวดเครา หญิงผมยาวต้องรวบตึงและใส่เน็ตคลุมผม หน้าตาสดใสยิ้มแย้ม",
    sec1_nails: "ตัดเล็บสั้น ห้ามทาสีเล็บ/ต่อเล็บ ห้ามสวมนาฬิกาข้อมือหรือสร้อยข้อมือขณะปฏิบัติงานในบาร์เพื่อป้องกันการปนเปื้อน",
    sec1_scent: "ระงับกลิ่นกายให้ดี ห้ามฉีดน้ำหอมที่มีกลิ่นฉุนรุนแรง เพราะจะไปรบกวนกลิ่นของกาแฟและอาหาร",
    sec2_arrive: "ต้องมาถึงร้านและเตรียมความพร้อม (เปลี่ยนชุด) เพื่อสแตนด์บายก่อนเวลาเข้ากะจริงอย่างน้อย 15-30 นาที",
    sec2_clock: "ต้องลงเวลาเข้า-ออกด้วยตนเอง ห้ามฝากเพื่อนลงเวลาเด็ดขาด (ถือเป็นความผิดร้ายแรง)",
    sec2_leave: "ลาป่วยต้องแจ้งล่วงหน้าอย่างน้อย 2 ชม. (หยุดเกิน 2 วันต้องมีใบรับรองแพทย์) ลากิจต้องส่งใบลาก่อนล่วงหน้า 3-5 วัน",
    sec2_absent: "ขาดงานโดยไม่แจ้งล่วงหน้า (ทิ้งกะ) หรือติดต่อไม่ได้เกิน 3 วัน ร้านจะเลิกจ้างทันทีโดยไม่จ่ายค่าชดเชย",
    sec3_phone: "ห้ามเล่นโทรศัพท์มือถือส่วนตัว โซเชียลมีเดีย หรือเกม ในพื้นที่บริการและหน้าบาร์โดยเด็ดขาด ให้ใช้ได้เฉพาะช่วงพักในพื้นที่หลังร้านเท่านั้น",
    sec3_talk: "ห้ามจับกลุ่มคุยเล่นเสียงดัง หยอกล้อ หรือแสดงอาการเหนื่อยหน่าย ฟุบโต๊ะ ในพื้นที่ที่ลูกค้ามองเห็น",
    sec3_eat: "ห้ามรับประทานอาหาร ขนม หรือเคี้ยวหมากฝรั่งในพื้นที่บริการ (ให้ทานในจุดพักหลังร้านเท่านั้น)",
    sec3_rude: "ห้ามใช้วาจาหยาบคาย พูดส่อเสียด หรือนินทาลูกค้า/เพื่อนร่วมงานในระยะที่ลูกค้าอาจได้ยิน",
    sec4_greet: "กล่าวคำทักทาย \"สวัสดีครับ/ค่ะ ยินดีต้อนรับครับ/ค่ะ\" พร้อมรอยยิ้มและการสบตา (Eye Contact) ทุกครั้ง",
    sec4_order: "ทวนรายการอาหาร/เครื่องดื่มทุกครั้งก่อนคิดเงิน เสิร์ฟอย่างระมัดระวัง หันโลโก้เข้าหาลูกค้าเสมอ",
    sec5_bar: "เช็ดทำความสะอาดก้านชง (Portafilter) และพ่นไอน้ำไล่นมทันทีหลังใช้งาน โต๊ะบาร์ต้องแห้งตลอดเวลา",
    sec5_front: "เมื่อลูกค้าลุกออกจากโต๊ะ ต้องรีบเคลียร์จานชามและเช็ดโต๊ะด้วยน้ำยาฆ่าเชื้อทันที",
    sec5_trash: "เมื่อขยะเต็ม 3/4 ของถัง ต้องมัดปากถุงนำไปทิ้งจุดรวมขยะหลังร้าน ห้ามปล่อยให้ขยะล้นหรือส่งกลิ่นเหม็น",
    sec6_general: "ครั้งที่ 1 ตักเตือนด้วยวาจา > ครั้งที่ 2 ออกใบเตือนฉบับที่ 1 > ครั้งที่ 3 ออกใบเตือนฉบับที่ 2 และพักงาน > ครั้งที่ 4 เลิกจ้าง",
    sec6_severe: "ทุจริตยักยอกเงิน, ทะเลาะวิวาททำร้ายร่างกาย, ดื่มแอลกอฮอล์/เสพยาในเวลางาน, ขาดงานเกิน 3 วันโดยไม่แจ้ง, ขโมยสูตรความลับร้านไปเผยแพร่",
};

interface Props {
    shopSettings?: any;
    isAdmin?: boolean;
    onSaveSuccess?: () => void;
}

export default function SOPStaticContent({ shopSettings, isAdmin, onSaveSuccess }: Props) {
    const [data, setData] = useState<SOPData>(DEFAULT_DATA);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<SOPData>(DEFAULT_DATA);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (shopSettings?.opening_hours?.sop_ui_data) {
            try {
                const parsed = JSON.parse(shopSettings.opening_hours.sop_ui_data);
                setData({ ...DEFAULT_DATA, ...parsed });
            } catch (e) {
                console.error("Failed to parse SOP data", e);
            }
        }
    }, [shopSettings]);

    const handleEditClick = () => {
        setEditData(data);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!shopSettings?.branch_id) {
            alert("ไม่พบรหัสสาขา");
            return;
        }
        setIsSaving(true);
        try {
            const updatedOpeningHours = {
                ...(shopSettings?.opening_hours || {}),
                sop_ui_data: JSON.stringify(editData)
            };

            const { error } = await supabase
                .from('pos_shop_settings')
                .update({ opening_hours: updatedOpeningHours })
                .eq('branch_id', shopSettings.branch_id);

            if (error) throw error;
            
            setData(editData);
            setIsEditing(false);
            if (onSaveSuccess) onSaveSuccess();
            alert('บันทึกคู่มือ SOP สำเร็จ');
            
        } catch (err: any) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการบันทึก SOP');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 print-container relative">
            
            {/* Admin Actions */}
            {isAdmin && (
                <div className="flex items-center justify-end gap-3 mb-4 print:hidden sticky top-4 z-50">
                    <button 
                        onClick={handleEditClick}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-[#6B3E11] border border-[#965A27] rounded-xl font-bold shadow-sm hover:bg-[#FFFFAF] transition-colors"
                    >
                        <Edit size={16} /> แก้ไขคู่มือ
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-[#6B3E11] text-white rounded-xl font-bold shadow-sm hover:bg-[#4A2C11] transition-colors"
                    >
                        <Printer size={16} /> สั่งพิมพ์
                    </button>
                </div>
            )}

            {/* Title Card */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 border border-[#E5E5DF] shadow-sm text-center print:border-black print:rounded-none"
            >
                <h2 className="text-[22px] font-black text-[#6B3E11] mb-2 leading-tight print:text-black">คู่มือปฏิบัติงานและประเมินผลพนักงาน<br/>ฉบับสมบูรณ์</h2>
                <p className="text-[13px] font-semibold text-[#965A27] mb-6 print:text-black">Comprehensive Operations & Evaluation Manual</p>
                
                <div className="border border-[#965A27] text-[#6B3E11] font-bold text-[14px] py-2 px-4 inline-block mb-6 print:border-black print:text-black">
                    มาตรฐานการบริการและกฎระเบียบภายใน
                </div>

                <div className="bg-[#FFFAF0] border border-[#FDE6A6] rounded-2xl p-4 text-left max-w-sm mx-auto print:bg-white print:border-black print:rounded-none">
                    <div className="flex justify-between border-b border-dashed border-[#E5E5DF] pb-2 mb-2 print:border-black">
                        <span className="font-bold text-[#6B3E11] text-[13px] print:text-black">ชื่อร้าน:</span>
                        <span className="text-gray-500 text-[13px] print:text-black">{data.shopName}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-[#E5E5DF] pb-2 mb-2 print:border-black">
                        <span className="font-bold text-[#6B3E11] text-[13px] print:text-black">สาขา:</span>
                        <span className="text-[#4A2C11] font-medium text-[13px] print:text-black">{data.branchName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-bold text-[#6B3E11] text-[13px] print:text-black">วันที่อัปเดต:</span>
                        <span className="text-[#4A2C11] font-medium text-[13px] print:text-black">{data.updatedDate}</span>
                    </div>
                </div>
            </motion.div>

            {/* Section 1 */}
            <Section title="หมวดที่ 1: มาตรฐานรูปลักษณ์ สุขอนามัย และการแต่งกาย" icon={<Sparkles size={20}/>}>
                <SubSection title="1.1 เครื่องแบบและสุขอนามัย (Grooming & Hygiene)">
                    <ListItem><strong>เครื่องแต่งกาย:</strong> {data.sec1_uniform}</ListItem>
                    <ListItem><strong>ทรงผมและใบหน้า:</strong> {data.sec1_hair}</ListItem>
                    <ListItem><strong>เล็บและเครื่องประดับ:</strong> {data.sec1_nails}</ListItem>
                    <ListItem><strong>กลิ่นกาย:</strong> {data.sec1_scent}</ListItem>
                </SubSection>
            </Section>

            {/* Section 2 */}
            <Section title="หมวดที่ 2: การตรงต่อเวลา การเข้า-ออกงาน และการลางาน" icon={<Clock size={20}/>}>
                <SubSection title="2.1 การลงเวลาและการลางาน (Attendance Standards)">
                    <ListItem><strong>การเข้างาน:</strong> {data.sec2_arrive}</ListItem>
                    <ListItem><strong>การลงเวลา:</strong> {data.sec2_clock}</ListItem>
                    <ListItem><strong>การลาป่วย/ลากิจ:</strong> {data.sec2_leave}</ListItem>
                    <ListItem><strong>การขาดงาน:</strong> {data.sec2_absent}</ListItem>
                </SubSection>
            </Section>

            {/* Section 3 */}
            <Section title="หมวดที่ 3: พฤติกรรม มารยาท และข้อห้ามขณะปฏิบัติงาน" icon={<AlertTriangle size={20}/>}>
                <SubSection title="3.1 กฎเหล็กพื้นที่บริการ (On-Duty Conduct)">
                    <div className="bg-[#FFF0F0] text-[#B02A2A] p-4 rounded-xl mb-4 border border-[#FAD2D2] print:bg-white print:border-black print:rounded-none print:text-black">
                        <h4 className="font-bold text-[14px] mb-1 print:text-black">กฎระเบียบเรื่องโทรศัพท์มือถือ:</h4>
                        <p className="text-[13px] font-medium leading-relaxed print:text-black">{data.sec3_phone}</p>
                    </div>
                    <ListItem>{data.sec3_talk}</ListItem>
                    <ListItem>{data.sec3_eat}</ListItem>
                    <ListItem>{data.sec3_rude}</ListItem>
                </SubSection>
            </Section>

            {/* Section 4 */}
            <Section title="หมวดที่ 4: มาตรฐานการบริการและการสื่อสารกับลูกค้า" icon={<Users size={20}/>}>
                <SubSection title="4.1 ขั้นตอนบริการและการรับมือข้อร้องเรียน">
                    <ListItem><strong>การต้อนรับ:</strong> {data.sec4_greet}</ListItem>
                    <ListItem><strong>การรับ-เสิร์ฟออเดอร์:</strong> {data.sec4_order}</ListItem>
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
                    <ListItem><strong>สเตชันบาร์:</strong> {data.sec5_bar}</ListItem>
                    <ListItem><strong>หน้าร้าน:</strong> {data.sec5_front}</ListItem>
                    <ListItem><strong>การจัดการขยะ:</strong> {data.sec5_trash}</ListItem>
                </SubSection>
            </Section>

            {/* Section 6 */}
            <Section title="หมวดที่ 6: ระเบียบวินัยและบทลงโทษ" icon={<AlertTriangle size={20}/>}>
                <SubSection title="6.1 ลำดับขั้นบทลงโทษ (Disciplinary Action)">
                    <ListItem><strong>ความผิดทั่วไป:</strong> {data.sec6_general}</ListItem>
                    <ListItem><strong>ความผิดร้ายแรง (เลิกจ้างทันที):</strong> {data.sec6_severe}</ListItem>
                </SubSection>
            </Section>

            {/* Section 7 - Evaluation Form */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl overflow-hidden border border-[#E5E5DF] shadow-sm print:rounded-none print:border-black break-inside-avoid"
            >
                <div className="bg-[#965A27] text-white p-4 font-bold text-[16px] flex items-center gap-2 print:bg-gray-200 print:text-black">
                    <Star size={20} className="print:hidden" /> ส่วนที่ 7: แบบประเมินประสิทธิภาพการทำงาน
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                            <tr className="bg-[#6B3E11] text-white text-[12px] print:bg-black print:text-white">
                                <th className="p-3 font-semibold print:border-black">หัวข้อการประเมินประสิทธิภาพ (Performance Criteria)</th>
                                <th className="p-3 text-center w-8 print:border-black">5</th>
                                <th className="p-3 text-center w-8 print:border-black">4</th>
                                <th className="p-3 text-center w-8 print:border-black">3</th>
                                <th className="p-3 text-center w-8 print:border-black">2</th>
                                <th className="p-3 text-center w-8 print:border-black">1</th>
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

                            <EvaluationGroup title="2. งานบริการและการขาย (Customer Service & Upselling)" bg="bg-[#FFF8E6]" text="text-[#965A27]" printBg="print:bg-gray-100" />
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

            <div className="h-8 print:hidden"></div>

            {/* Signature Area (Only visible when printing) */}
            <div className="hidden print:block mt-16 break-inside-avoid">
                <div className="grid grid-cols-2 gap-12 text-center text-black pt-8">
                    <div>
                        <div className="border-b border-black w-48 mx-auto mb-2"></div>
                        <p className="text-[13px] font-bold">( ผู้จัดการสาขา / แอดมิน )</p>
                        <p className="text-[13px] mt-1">วันที่: ....../....../......</p>
                    </div>
                    <div>
                        <div className="border-b border-black w-48 mx-auto mb-2"></div>
                        <p className="text-[13px] font-bold">( พนักงาน / ผู้รับการประเมิน )</p>
                        <p className="text-[13px] mt-1">วันที่: ....../....../......</p>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <Edit size={24} className="text-blue-600" />
                                แก้ไขคู่มือ SOP
                            </h2>
                            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            <FormGroup title="ข้อมูลทั่วไป">
                                <InputField label="ชื่อร้าน" value={editData.shopName} onChange={v => setEditData({...editData, shopName: v})} />
                                <InputField label="สาขา" value={editData.branchName} onChange={v => setEditData({...editData, branchName: v})} />
                                <InputField label="วันที่อัปเดต" value={editData.updatedDate} onChange={v => setEditData({...editData, updatedDate: v})} />
                            </FormGroup>

                            <FormGroup title="หมวดที่ 1: มาตรฐานรูปลักษณ์">
                                <TextAreaField label="เครื่องแต่งกาย" value={editData.sec1_uniform} onChange={v => setEditData({...editData, sec1_uniform: v})} />
                                <TextAreaField label="ทรงผมและใบหน้า" value={editData.sec1_hair} onChange={v => setEditData({...editData, sec1_hair: v})} />
                                <TextAreaField label="เล็บและเครื่องประดับ" value={editData.sec1_nails} onChange={v => setEditData({...editData, sec1_nails: v})} />
                                <TextAreaField label="กลิ่นกาย" value={editData.sec1_scent} onChange={v => setEditData({...editData, sec1_scent: v})} />
                            </FormGroup>

                            <FormGroup title="หมวดที่ 2: การตรงต่อเวลา">
                                <TextAreaField label="การเข้างาน" value={editData.sec2_arrive} onChange={v => setEditData({...editData, sec2_arrive: v})} />
                                <TextAreaField label="การลงเวลา" value={editData.sec2_clock} onChange={v => setEditData({...editData, sec2_clock: v})} />
                                <TextAreaField label="การลาป่วย/ลากิจ" value={editData.sec2_leave} onChange={v => setEditData({...editData, sec2_leave: v})} />
                                <TextAreaField label="การขาดงาน" value={editData.sec2_absent} onChange={v => setEditData({...editData, sec2_absent: v})} />
                            </FormGroup>

                            <FormGroup title="หมวดที่ 3: พฤติกรรมและมารยาท">
                                <TextAreaField label="กฎโทรศัพท์มือถือ" value={editData.sec3_phone} onChange={v => setEditData({...editData, sec3_phone: v})} />
                                <TextAreaField label="การพูดคุยเล่น" value={editData.sec3_talk} onChange={v => setEditData({...editData, sec3_talk: v})} />
                                <TextAreaField label="การรับประทานอาหาร" value={editData.sec3_eat} onChange={v => setEditData({...editData, sec3_eat: v})} />
                                <TextAreaField label="คำหยาบคาย/นินทา" value={editData.sec3_rude} onChange={v => setEditData({...editData, sec3_rude: v})} />
                            </FormGroup>

                            <FormGroup title="หมวดที่ 4: การบริการลูกค้า">
                                <TextAreaField label="การต้อนรับ" value={editData.sec4_greet} onChange={v => setEditData({...editData, sec4_greet: v})} />
                                <TextAreaField label="การรับ-เสิร์ฟออเดอร์" value={editData.sec4_order} onChange={v => setEditData({...editData, sec4_order: v})} />
                            </FormGroup>

                            <FormGroup title="หมวดที่ 5: ความสะอาด">
                                <TextAreaField label="สเตชันบาร์" value={editData.sec5_bar} onChange={v => setEditData({...editData, sec5_bar: v})} />
                                <TextAreaField label="หน้าร้าน" value={editData.sec5_front} onChange={v => setEditData({...editData, sec5_front: v})} />
                                <TextAreaField label="การจัดการขยะ" value={editData.sec5_trash} onChange={v => setEditData({...editData, sec5_trash: v})} />
                            </FormGroup>

                            <FormGroup title="หมวดที่ 6: บทลงโทษ">
                                <TextAreaField label="ความผิดทั่วไป" value={editData.sec6_general} onChange={v => setEditData({...editData, sec6_general: v})} />
                                <TextAreaField label="ความผิดร้ายแรง" value={editData.sec6_severe} onChange={v => setEditData({...editData, sec6_severe: v})} />
                            </FormGroup>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
                            >
                                ยกเลิก
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Save size={18} />
                                {isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-container, .print-container * {
                        visibility: visible;
                    }
                    .print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

// Subcomponents for Modal
function FormGroup({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <h3 className="font-black text-gray-800 mb-4 text-[15px]">{title}</h3>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}

function InputField({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-[13px] font-bold text-gray-600 mb-1">{label}</label>
            <input 
                type="text" 
                value={value} 
                onChange={e => onChange(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
        </div>
    );
}

function TextAreaField({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-[13px] font-bold text-gray-600 mb-1">{label}</label>
            <textarea 
                value={value} 
                onChange={e => onChange(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-y"
            />
        </div>
    );
}

// Subcomponents for View
function Section({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-3xl overflow-hidden border border-[#E5E5DF] shadow-sm print:rounded-none print:border-black break-inside-avoid">
            <div className="bg-[#965A27] text-white p-4 font-bold text-[16px] flex items-center gap-2 print:bg-gray-200 print:text-black">
                <span className="print:hidden">{icon}</span>
                {title}
            </div>
            <div className="p-5 space-y-6">
                {children}
            </div>
        </div>
    );
}

function SubSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-[14px] font-bold text-[#6B3E11] mb-3 pb-2 border-b border-dashed border-[#E5E5DF] inline-block print:text-black print:border-black">{title}</h3>
            <ul className="space-y-3">
                {children}
            </ul>
        </div>
    );
}

function ListItem({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex items-start gap-2 text-[14px] leading-relaxed text-[#4A2C11] print:text-black">
            <div className="min-w-[6px] h-[6px] rounded-full bg-[#965A27] mt-[8px] print:hidden"></div>
            <div className="hidden print:block mt-[6px] text-black">•</div>
            <div>{children}</div>
        </li>
    );
}

function EvaluationGroup({ title, bg = "bg-[#FCF7E8]", text = "text-[#6B3E11]", printBg = "print:bg-gray-100" }: { title: string, bg?: string, text?: string, printBg?: string }) {
    return (
        <tr>
            <td colSpan={6} className={`p-3 font-bold text-[13px] ${bg} ${text} border-b border-[#E5E5DF] print:border-black print:text-black ${printBg}`}>
                {title}
            </td>
        </tr>
    );
}

function EvaluationRow({ title, desc, bg = "bg-white" }: { title: string, desc: string, bg?: string }) {
    return (
        <tr className={`border-b border-[#E5E5DF] ${bg} print:border-black print:bg-white`}>
            <td className="p-3 print:border-black">
                <div className="font-bold text-[13px] text-[#4A2C11] print:text-black">{title}:</div>
                <div className="text-[12px] text-gray-600 mt-1 print:text-black">{desc}</div>
            </td>
            {[5,4,3,2,1].map(num => (
                <td key={num} className="p-3 text-center align-middle print:border-l print:border-black">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 mx-auto bg-white flex items-center justify-center print:border-black">
                        {/* Empty circle like in image */}
                    </div>
                </td>
            ))}
        </tr>
    );
}
