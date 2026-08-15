import React, { useState, useEffect } from 'react';
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
                setEditData({ ...DEFAULT_DATA, ...parsed });
            } catch (e) {
                console.error("Failed to parse SOP data", e);
            }
        }
    }, [shopSettings]);

    const handleEditClick = () => {
        setEditData(data);
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setEditData(data); // revert
        setIsEditing(false);
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

    const updateField = (field: keyof SOPData, value: string) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 print-container relative">
            
            {/* Admin Actions */}
            {isAdmin && !isEditing && (
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

            {isAdmin && isEditing && (
                <div className="flex items-center justify-between gap-3 mb-4 print:hidden sticky top-4 z-50 bg-blue-50/90 backdrop-blur-md p-4 rounded-2xl border border-blue-200 shadow-lg">
                    <div className="text-blue-800 font-bold flex items-center gap-2">
                        <Edit size={20} />
                        โหมดแก้ไข (คลิกที่ข้อความเพื่อพิมพ์แก้ได้เลย)
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-white text-gray-500 rounded-xl font-bold shadow-sm hover:bg-gray-100 transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            <Save size={16} /> {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                        </button>
                    </div>
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
                    <div className="flex justify-between items-center border-b border-dashed border-[#E5E5DF] pb-2 mb-2 print:border-black">
                        <span className="font-bold text-[#6B3E11] text-[13px] print:text-black w-1/3">ชื่อร้าน:</span>
                        <span className="text-gray-500 text-[13px] print:text-black w-2/3 text-right">
                            <InlineInput isEditing={isEditing} value={isEditing ? editData.shopName : data.shopName} onChange={(v) => updateField('shopName', v)} className="text-right w-full" />
                        </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-dashed border-[#E5E5DF] pb-2 mb-2 print:border-black">
                        <span className="font-bold text-[#6B3E11] text-[13px] print:text-black w-1/3">สาขา:</span>
                        <span className="text-[#4A2C11] font-medium text-[13px] print:text-black w-2/3 text-right">
                            <InlineInput isEditing={isEditing} value={isEditing ? editData.branchName : data.branchName} onChange={(v) => updateField('branchName', v)} className="text-right w-full font-medium text-[#4A2C11]" />
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-[#6B3E11] text-[13px] print:text-black w-1/3">วันที่อัปเดต:</span>
                        <span className="text-[#4A2C11] font-medium text-[13px] print:text-black w-2/3 text-right">
                            <InlineInput isEditing={isEditing} value={isEditing ? editData.updatedDate : data.updatedDate} onChange={(v) => updateField('updatedDate', v)} className="text-right w-full font-medium text-[#4A2C11]" />
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Section 1 */}
            <Section title="หมวดที่ 1: มาตรฐานรูปลักษณ์ สุขอนามัย และการแต่งกาย" icon={<Sparkles size={20}/>}>
                <SubSection title="1.1 เครื่องแบบและสุขอนามัย (Grooming & Hygiene)">
                    <ListItem><strong>เครื่องแต่งกาย:</strong> <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec1_uniform : data.sec1_uniform} onChange={(v) => updateField('sec1_uniform', v)} /></ListItem>
                    <ListItem><strong>ทรงผมและใบหน้า:</strong> <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec1_hair : data.sec1_hair} onChange={(v) => updateField('sec1_hair', v)} /></ListItem>
                    <ListItem><strong>เล็บและเครื่องประดับ:</strong> <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec1_nails : data.sec1_nails} onChange={(v) => updateField('sec1_nails', v)} /></ListItem>
                    <ListItem><strong>กลิ่นกาย:</strong> <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec1_scent : data.sec1_scent} onChange={(v) => updateField('sec1_scent', v)} /></ListItem>
                </SubSection>
            </Section>

            {/* Section 2 */}
            <Section title="หมวดที่ 2: การตรงต่อเวลา การเข้า-ออกงาน และการลางาน" icon={<Clock size={20}/>}>
                <SubSection title="2.1 การลงเวลาและการลางาน (Attendance Standards)">
                    <ListItem><strong>การเข้างาน:</strong> <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec2_arrive : data.sec2_arrive} onChange={(v) => updateField('sec2_arrive', v)} /></ListItem>
                    <ListItem><strong>การลงเวลา:</strong> <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec2_clock : data.sec2_clock} onChange={(v) => updateField('sec2_clock', v)} /></ListItem>
                    <ListItem><strong>การลาป่วย/ลากิจ:</strong> <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec2_leave : data.sec2_leave} onChange={(v) => updateField('sec2_leave', v)} /></ListItem>
                    <ListItem><strong>การขาดงาน:</strong> <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec2_absent : data.sec2_absent} onChange={(v) => updateField('sec2_absent', v)} /></ListItem>
                </SubSection>
            </Section>

            {/* Section 3 */}
            <Section title="หมวดที่ 3: พฤติกรรม มารยาท และข้อห้ามขณะปฏิบัติงาน" icon={<AlertTriangle size={20}/>}>
                <SubSection title="3.1 กฎเหล็กพื้นที่บริการ (On-Duty Conduct)">
                    <div className="bg-[#FFF0F0] text-[#B02A2A] p-4 rounded-xl mb-4 border border-[#FAD2D2] print:bg-white print:border-black print:rounded-none print:text-black">
                        <h4 className="font-bold text-[14px] mb-1 print:text-black">กฎระเบียบเรื่องโทรศัพท์มือถือ:</h4>
                        <div className="text-[13px] font-medium leading-relaxed print:text-black">
                            <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec3_phone : data.sec3_phone} onChange={(v) => updateField('sec3_phone', v)} />
                        </div>
                    </div>
                    <ListItem><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec3_talk : data.sec3_talk} onChange={(v) => updateField('sec3_talk', v)} /></ListItem>
                    <ListItem><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec3_eat : data.sec3_eat} onChange={(v) => updateField('sec3_eat', v)} /></ListItem>
                    <ListItem><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec3_rude : data.sec3_rude} onChange={(v) => updateField('sec3_rude', v)} /></ListItem>
                </SubSection>
            </Section>

            {/* Section 4 */}
            <Section title="หมวดที่ 4: มาตรฐานการบริการและการสื่อสารกับลูกค้า" icon={<Users size={20}/>}>
                <SubSection title="4.1 ขั้นตอนบริการและการรับมือข้อร้องเรียน">
                    <ListItem><strong>การต้อนรับ:</strong> <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec4_greet : data.sec4_greet} onChange={(v) => updateField('sec4_greet', v)} /></ListItem>
                    <ListItem><strong>การรับ-เสิร์ฟออเดอร์:</strong> <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec4_order : data.sec4_order} onChange={(v) => updateField('sec4_order', v)} /></ListItem>
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
                    <ListItem><strong>สเตชันบาร์:</strong> <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec5_bar : data.sec5_bar} onChange={(v) => updateField('sec5_bar', v)} /></ListItem>
                    <ListItem><strong>หน้าร้าน:</strong> <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec5_front : data.sec5_front} onChange={(v) => updateField('sec5_front', v)} /></ListItem>
                    <ListItem><strong>การจัดการขยะ:</strong> <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec5_trash : data.sec5_trash} onChange={(v) => updateField('sec5_trash', v)} /></ListItem>
                </SubSection>
            </Section>

            {/* Section 6 */}
            <Section title="หมวดที่ 6: ระเบียบวินัยและบทลงโทษ" icon={<AlertTriangle size={20}/>}>
                <SubSection title="6.1 ลำดับขั้นบทลงโทษ (Disciplinary Action)">
                    <ListItem><strong>ความผิดทั่วไป:</strong> <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec6_general : data.sec6_general} onChange={(v) => updateField('sec6_general', v)} /></ListItem>
                    <ListItem><strong>ความผิดร้ายแรง (เลิกจ้างทันที):</strong> <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec6_severe : data.sec6_severe} onChange={(v) => updateField('sec6_severe', v)} /></ListItem>
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

                {/* Evaluation Conclusion Box (New) */}
                <div className="p-6 border-t border-[#E5E5DF] bg-[#FFFAF0] print:bg-white print:border-black">
                    <h3 className="text-[16px] font-bold text-[#6B3E11] mb-4 print:text-black">สรุปผลการประเมิน (Evaluation Conclusion)</h3>
                    
                    <div className="bg-white border border-[#E5E5DF] rounded-xl p-4 mb-4 flex items-center gap-3 print:border-black">
                        <span className="font-bold text-[#4A2C11] print:text-black">คะแนนรวมที่ได้:</span>
                        <div className="text-gray-400 font-black text-2xl flex items-baseline gap-1 print:text-black">
                            <span className="text-3xl text-gray-300 print:text-black">0</span> 
                            <span className="text-sm font-medium text-gray-500 print:text-black">/ 75 คะแนน</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-[13px] font-bold text-[#6B3E11] mb-2 print:text-black">จุดเด่นที่ควรชื่นชม:</label>
                        <div className="w-full min-h-[80px] bg-[#F9F9F9] border border-dashed border-[#CCCCCC] rounded-lg p-3 text-gray-400 text-[13px] print:border-black print:text-white">
                            <span className="print:hidden">[คลิกเพื่อพิมพ์ข้อความแสดงความคิดเห็น...]</span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-[13px] font-bold text-[#6B3E11] mb-2 print:text-black">จุดที่ต้องพัฒนา:</label>
                        <div className="w-full min-h-[80px] bg-[#F9F9F9] border border-dashed border-[#CCCCCC] rounded-lg p-3 text-gray-400 text-[13px] print:border-black print:text-white">
                            <span className="print:hidden">[คลิกเพื่อพิมพ์ข้อความแสดงความคิดเห็น...]</span>
                        </div>
                    </div>

                    <div className="bg-[#FFFDF5] border border-[#FDE6A6] rounded-xl p-4 flex flex-wrap items-center gap-4 print:bg-white print:border-black">
                        <span className="font-bold text-[#6B3E11] print:text-black">ผลการประเมิน:</span>
                        <label className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E5E5DF] print:border-none">
                            <div className="w-4 h-4 rounded-full border border-gray-400 print:border-black"></div>
                            <span className="text-[13px] text-[#4A2C11] font-medium print:text-black">ผ่านเกณฑ์</span>
                        </label>
                        <label className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E5E5DF] print:border-none">
                            <div className="w-4 h-4 rounded-full border border-gray-400 print:border-black"></div>
                            <span className="text-[13px] text-[#4A2C11] font-medium print:text-black">ขยายเวลาทดลองงาน</span>
                        </label>
                        <label className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E5E5DF] print:border-none">
                            <div className="w-4 h-4 rounded-full border border-gray-400 print:border-black"></div>
                            <span className="text-[13px] text-[#4A2C11] font-medium print:text-black">ไม่ผ่านเกณฑ์</span>
                        </label>
                    </div>
                </div>
            </motion.div>

            <div className="h-8 print:hidden"></div>

            {/* Signature Area (Visible on screen and print) */}
            <div className="mt-12 mb-16 break-inside-avoid">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center text-[#4A2C11] print:text-black pt-8">
                    <div>
                        <div className="flex items-end justify-center gap-2 mb-2">
                            <span>(</span>
                            <div className="border-b border-dashed border-gray-400 w-48 text-gray-300 text-[13px] pb-1 print:border-black print:text-white">พิมพ์ชื่อพนักงาน</div>
                            <span>)</span>
                        </div>
                        <p className="text-[14px] font-black">พนักงานผู้รับการประเมิน</p>
                        <p className="text-[13px] mt-2 text-gray-600 print:text-black flex items-center justify-center gap-2">
                            วันที่: <span className="border-b border-gray-300 w-24 inline-block text-center pb-1 text-gray-500 print:text-black print:border-black">{new Date().toLocaleDateString('en-GB')}</span>
                        </p>
                    </div>
                    <div>
                        <div className="flex items-end justify-center gap-2 mb-2">
                            <span>(</span>
                            <div className="border-b border-dashed border-gray-400 w-48 text-gray-300 text-[13px] pb-1 print:border-black print:text-white">พิมพ์ชื่อผู้จัดการ</div>
                            <span>)</span>
                        </div>
                        <p className="text-[14px] font-black">ผู้จัดการร้าน / ผู้ประเมิน</p>
                        <p className="text-[13px] mt-2 text-gray-600 print:text-black flex items-center justify-center gap-2">
                            วันที่: <span className="border-b border-gray-300 w-24 inline-block text-center pb-1 text-gray-500 print:text-black print:border-black">{new Date().toLocaleDateString('en-GB')}</span>
                        </p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    /* Force the body and html to stretch fully, eliminating scroll boundaries */
                    html, body {
                        height: max-content !important;
                        overflow: visible !important;
                        min-height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    /* Force ALL elements that might wrap the content to allow overflow */
                    #__next, main, div, section, article {
                        height: max-content !important;
                        min-height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                    }
                    /* Hide everything by default */
                    body * {
                        visibility: hidden;
                    }
                    /* Show only print-container and its children */
                    .print-container, .print-container * {
                        visibility: visible;
                    }
                    /* Position print-container properly */
                    .print-container {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

// Editable Inline Components
function InlineInput({ isEditing, value, onChange, className = "" }: { isEditing: boolean, value: string, onChange: (v: string) => void, className?: string }) {
    if (isEditing) {
        return (
            <input 
                type="text" 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                className={`bg-blue-50 border-b-2 border-blue-400 focus:outline-none focus:border-blue-600 px-1 text-[#4A2C11] ${className}`} 
            />
        );
    }
    return <span className={className}>{value}</span>;
}

function InlineTextArea({ isEditing, value, onChange, className = "" }: { isEditing: boolean, value: string, onChange: (v: string) => void, className?: string }) {
    if (isEditing) {
        return (
            <textarea 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                rows={2}
                className={`w-full bg-blue-50 border border-blue-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#4A2C11] resize-y ${className}`} 
            />
        );
    }
    return <span className={className}>{value}</span>;
}


// Subcomponents for View
function Section({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-3xl overflow-hidden border border-[#E5E5DF] shadow-sm print:rounded-none print:border-black break-inside-avoid print:break-inside-avoid">
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
        <div className="break-inside-avoid">
            <h3 className="text-[14px] font-bold text-[#6B3E11] mb-3 pb-2 border-b border-dashed border-[#E5E5DF] inline-block print:text-black print:border-black">{title}</h3>
            <ul className="space-y-3">
                {children}
            </ul>
        </div>
    );
}

function ListItem({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex items-start gap-2 text-[14px] leading-relaxed text-[#4A2C11] print:text-black break-inside-avoid">
            <div className="min-w-[6px] h-[6px] rounded-full bg-[#965A27] mt-[8px] print:hidden"></div>
            <div className="hidden print:block mt-[6px] text-black">•</div>
            <div className="w-full">{children}</div>
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
        <tr className={`border-b border-[#E5E5DF] ${bg} print:border-black print:bg-white break-inside-avoid`}>
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
