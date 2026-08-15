import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Users, Sparkles, Star, Edit, Printer, Save, CheckCircle2, XCircle, FileText, ChevronRight } from 'lucide-react';
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
        <div className="max-w-4xl mx-auto space-y-8 print-container relative pb-20">
            
            {/* Admin Actions */}
            {isAdmin && !isEditing && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-6 print:hidden sticky top-4 z-50 bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-200 shadow-sm"
                >
                    <div className="flex items-center gap-3 text-slate-800">
                        <FileText size={20} className="text-amber-500" />
                        <h2 className="font-bold text-sm tracking-wide uppercase">Document Management</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleEditClick}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all text-sm"
                        >
                            <Edit size={16} className="text-slate-400" /> Edit Manual
                        </button>
                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-md hover:bg-slate-800 hover:shadow-lg transition-all text-sm"
                        >
                            <Printer size={16} className="text-slate-400" /> Print Document
                        </button>
                    </div>
                </motion.div>
            )}

            {isAdmin && isEditing && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-6 print:hidden sticky top-4 z-50 bg-amber-500/10 backdrop-blur-xl px-6 py-4 rounded-2xl border border-amber-500/30 shadow-lg"
                >
                    <div className="text-amber-700 font-bold flex items-center gap-3">
                        <div className="p-2 bg-amber-500 rounded-lg shadow-sm">
                            <Edit size={18} className="text-white" />
                        </div>
                        <div>
                            <div className="text-sm">Edit Mode Active</div>
                            <div className="text-[11px] font-medium opacity-80 mt-0.5">Click directly on any text below to edit</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleCancelEdit}
                            className="px-5 py-2.5 bg-white/80 text-slate-600 rounded-xl font-bold hover:bg-white transition-all text-sm"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-md hover:bg-slate-800 transition-all text-sm disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={16} className="text-slate-400" />
                            )}
                            Save Changes
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Premium Document Container */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden print:shadow-none print:border-none print:rounded-none">
                
                {/* Header Section */}
                <div className="relative bg-slate-900 px-10 pt-12 pb-16 print:bg-white print:px-0 print:pt-4 print:pb-8">
                    <div className="absolute inset-0 overflow-hidden print:hidden">
                        <div className="absolute -top-[50%] -right-[10%] w-[70%] h-[150%] bg-gradient-to-b from-white/5 to-transparent rotate-12 blur-3xl pointer-events-none" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 mb-6 print:border-slate-800 print:bg-transparent">
                            <Star size={12} className="text-amber-400 print:text-slate-800" fill="currentColor" />
                            <span className="text-xs font-semibold text-white/90 tracking-widest uppercase print:text-slate-800">Standard Operating Procedure</span>
                        </div>
                        
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-2 print:text-slate-900">
                            คู่มือปฏิบัติงานและประเมินผล
                        </h1>
                        <p className="text-amber-400 font-medium tracking-wide print:text-slate-600">
                            Comprehensive Operations & Evaluation Manual
                        </p>
                    </div>
                </div>

                {/* Info Bar (Floating Overlapping Layout) */}
                <div className="px-6 md:px-10 -mt-8 relative z-20 mb-12 print:px-0 print:mt-0 print:mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 print:shadow-none print:border-y print:border-slate-300 print:rounded-none print:gap-4 print:p-4 print:bg-transparent">
                        
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Shop Name</span>
                            <span className="text-[15px] font-bold text-slate-800">
                                <InlineInput isEditing={isEditing} value={isEditing ? editData.shopName : data.shopName} onChange={(v) => updateField('shopName', v)} className="font-bold text-slate-800" />
                            </span>
                        </div>
                        
                        <div className="flex flex-col gap-1 md:border-l border-slate-100 md:pl-6 print:border-slate-300">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Branch</span>
                            <span className="text-[15px] font-bold text-slate-800">
                                <InlineInput isEditing={isEditing} value={isEditing ? editData.branchName : data.branchName} onChange={(v) => updateField('branchName', v)} className="font-bold text-slate-800" />
                            </span>
                        </div>
                        
                        <div className="flex flex-col gap-1 md:border-l border-slate-100 md:pl-6 print:border-slate-300">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Last Updated</span>
                            <span className="text-[15px] font-bold text-slate-800">
                                <InlineInput isEditing={isEditing} value={isEditing ? editData.updatedDate : data.updatedDate} onChange={(v) => updateField('updatedDate', v)} className="font-bold text-slate-800" />
                            </span>
                        </div>

                    </div>
                </div>

                {/* Content Sections */}
                <div className="px-6 md:px-10 space-y-12 pb-16 print:px-0 print:pb-8">
                    
                    {/* Section 1 */}
                    <Section number="01" title="มาตรฐานรูปลักษณ์ สุขอนามัย และการแต่งกาย" icon={<Sparkles size={18}/>}>
                        <SubSection title="เครื่องแบบและสุขอนามัย (Grooming & Hygiene)">
                            <ListItem title="เครื่องแต่งกาย"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec1_uniform : data.sec1_uniform} onChange={(v) => updateField('sec1_uniform', v)} /></ListItem>
                            <ListItem title="ทรงผมและใบหน้า"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec1_hair : data.sec1_hair} onChange={(v) => updateField('sec1_hair', v)} /></ListItem>
                            <ListItem title="เล็บและเครื่องประดับ"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec1_nails : data.sec1_nails} onChange={(v) => updateField('sec1_nails', v)} /></ListItem>
                            <ListItem title="กลิ่นกาย"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec1_scent : data.sec1_scent} onChange={(v) => updateField('sec1_scent', v)} /></ListItem>
                        </SubSection>
                    </Section>

                    {/* Section 2 */}
                    <Section number="02" title="การตรงต่อเวลา การเข้า-ออกงาน และการลางาน" icon={<Clock size={18}/>}>
                        <SubSection title="การลงเวลาและการลางาน (Attendance Standards)">
                            <ListItem title="การเข้างาน"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec2_arrive : data.sec2_arrive} onChange={(v) => updateField('sec2_arrive', v)} /></ListItem>
                            <ListItem title="การลงเวลา"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec2_clock : data.sec2_clock} onChange={(v) => updateField('sec2_clock', v)} /></ListItem>
                            <ListItem title="การลาป่วย/ลากิจ"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec2_leave : data.sec2_leave} onChange={(v) => updateField('sec2_leave', v)} /></ListItem>
                            <ListItem title="การขาดงาน"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec2_absent : data.sec2_absent} onChange={(v) => updateField('sec2_absent', v)} /></ListItem>
                        </SubSection>
                    </Section>

                    {/* Section 3 */}
                    <Section number="03" title="พฤติกรรม มารยาท และข้อห้ามขณะปฏิบัติงาน" icon={<AlertTriangle size={18}/>}>
                        <SubSection title="กฎเหล็กพื้นที่บริการ (On-Duty Conduct)">
                            <div className="bg-red-50/50 border border-red-100 rounded-xl p-5 mb-6 print:bg-white print:border-slate-300 print:rounded-none">
                                <h4 className="font-bold text-sm text-red-800 mb-2 flex items-center gap-2 print:text-slate-900">
                                    <AlertTriangle size={16} className="print:hidden" />
                                    กฎระเบียบเรื่องโทรศัพท์มือถือ:
                                </h4>
                                <div className="text-sm text-red-900/80 leading-relaxed print:text-slate-800">
                                    <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec3_phone : data.sec3_phone} onChange={(v) => updateField('sec3_phone', v)} />
                                </div>
                            </div>
                            <ListItem><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec3_talk : data.sec3_talk} onChange={(v) => updateField('sec3_talk', v)} /></ListItem>
                            <ListItem><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec3_eat : data.sec3_eat} onChange={(v) => updateField('sec3_eat', v)} /></ListItem>
                            <ListItem><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec3_rude : data.sec3_rude} onChange={(v) => updateField('sec3_rude', v)} /></ListItem>
                        </SubSection>
                    </Section>

                    {/* Section 4 */}
                    <Section number="04" title="มาตรฐานการบริการและการสื่อสารกับลูกค้า" icon={<Users size={18}/>}>
                        <SubSection title="ขั้นตอนบริการและการรับมือข้อร้องเรียน">
                            <ListItem title="การต้อนรับ"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec4_greet : data.sec4_greet} onChange={(v) => updateField('sec4_greet', v)} /></ListItem>
                            <ListItem title="การรับ-เสิร์ฟออเดอร์"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec4_order : data.sec4_order} onChange={(v) => updateField('sec4_order', v)} /></ListItem>
                            <ListItem title="หลัก LAST รับมือข้อร้องเรียน">
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm print:bg-transparent print:border-slate-300">
                                        <span className="font-bold text-slate-800">1. L-Listen:</span> รับฟังอย่างตั้งใจ
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm print:bg-transparent print:border-slate-300">
                                        <span className="font-bold text-slate-800">2. A-Apologize:</span> กล่าวขอโทษด้วยความจริงใจ
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm print:bg-transparent print:border-slate-300">
                                        <span className="font-bold text-slate-800">3. S-Solve:</span> เสนอทางแก้ไขทันที
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm print:bg-transparent print:border-slate-300">
                                        <span className="font-bold text-slate-800">4. T-Thank:</span> ขอบคุณลูกค้าที่ช่วยติชม
                                    </div>
                                </div>
                            </ListItem>
                        </SubSection>
                    </Section>

                    {/* Section 5 */}
                    <Section number="05" title="มาตรฐานความสะอาดและการจัดการร้าน" icon={<Sparkles size={18}/>}>
                        <SubSection title="ความสะอาด (Clean as you go)">
                            <ListItem title="สเตชันบาร์"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec5_bar : data.sec5_bar} onChange={(v) => updateField('sec5_bar', v)} /></ListItem>
                            <ListItem title="หน้าร้าน"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec5_front : data.sec5_front} onChange={(v) => updateField('sec5_front', v)} /></ListItem>
                            <ListItem title="การจัดการขยะ"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec5_trash : data.sec5_trash} onChange={(v) => updateField('sec5_trash', v)} /></ListItem>
                        </SubSection>
                    </Section>

                    {/* Section 6 */}
                    <Section number="06" title="ระเบียบวินัยและบทลงโทษ" icon={<AlertTriangle size={18}/>}>
                        <SubSection title="ลำดับขั้นบทลงโทษ (Disciplinary Action)">
                            <ListItem title="ความผิดทั่วไป"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec6_general : data.sec6_general} onChange={(v) => updateField('sec6_general', v)} /></ListItem>
                            <ListItem title="ความผิดร้ายแรง"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec6_severe : data.sec6_severe} onChange={(v) => updateField('sec6_severe', v)} /></ListItem>
                        </SubSection>
                    </Section>

                </div>
            </div>

            {/* Evaluation Form Component */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mt-8 print:shadow-none print:border-none print:rounded-none break-inside-avoid">
                <div className="bg-slate-50 px-6 md:px-10 py-6 border-b border-slate-100 flex items-center gap-3 print:bg-transparent print:border-slate-300 print:px-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center print:hidden">
                        <Star size={20} className="text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">แบบประเมินประสิทธิภาพการทำงาน</h2>
                        <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Performance Evaluation Form</p>
                    </div>
                </div>
                
                <div className="overflow-x-auto p-6 md:p-10 print:p-0 print:pt-6">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="border-b-2 border-slate-200 print:border-slate-400">
                                <th className="py-4 px-2 font-bold text-slate-800 text-sm">หัวข้อการประเมิน (Criteria)</th>
                                <th className="py-4 px-2 text-center w-12 font-bold text-slate-400 text-sm">5</th>
                                <th className="py-4 px-2 text-center w-12 font-bold text-slate-400 text-sm">4</th>
                                <th className="py-4 px-2 text-center w-12 font-bold text-slate-400 text-sm">3</th>
                                <th className="py-4 px-2 text-center w-12 font-bold text-slate-400 text-sm">2</th>
                                <th className="py-4 px-2 text-center w-12 font-bold text-slate-400 text-sm">1</th>
                            </tr>
                        </thead>
                        <tbody>
                            <EvaluationGroup title="1. ทักษะวิชาชีพและคุณภาพเครื่องดื่ม (Barista Hard Skills)" />
                            <EvaluationRow title="1.1 การสกัดช็อต (Extraction)" desc="ตั้งค่าเครื่องบดแม่นยำ สกัดช็อตได้รสชาติและปริมาณตามมาตรฐานร้าน" />
                            <EvaluationRow title="1.2 การสตีมนม (Steaming)" desc="อุณหภูมินมถูกต้อง โฟมนมเนียนละเอียด เทลาเต้อาร์ตพื้นฐานได้" />
                            <EvaluationRow title="1.3 ความแม่นยำของสูตร (Recipe Consistency)" desc="ชงเครื่องดื่มได้รสชาติสม่ำเสมอ ไม่ลืมส่วนผสม ใส่ใจรายละเอียด" />
                            <EvaluationRow title="1.4 ความเร็วและความแม่นยำ (Speed)" desc="จัดการออเดอร์ช่วงลูกค้าหนาแน่นได้รวดเร็ว ไม่ทำสลับคิว" />

                            <EvaluationGroup title="2. งานบริการและการขาย (Customer Service & Upselling)" bg="bg-slate-50/50" />
                            <EvaluationRow title="2.1 การต้อนรับ" desc="ทักทายลูกค้าอย่างอบอุ่น สุภาพ ยิ้มแย้ม และมี Service Mind เสมอ" bg="bg-slate-50/50" />
                            <EvaluationRow title="2.2 ความรู้เรื่องเมนู" desc="อธิบายคาแรคเตอร์เมล็ดกาแฟ ส่วนผสม และแนะนำเมนูให้ตรงใจลูกค้าได้" bg="bg-slate-50/50" />
                            <EvaluationRow title="2.3 การเสนอขาย (Upsell)" desc="มีทักษะเสนอขายขนม เบเกอรี่ หรือสินค้าเพิ่มเติมได้อย่างเป็นธรรมชาติ" bg="bg-slate-50/50" />
                            <EvaluationRow title="2.4 การแก้ปัญหา" desc="รับมือข้อร้องเรียนของลูกค้า (Complaint) ได้อย่างสุภาพและเป็นมืออาชีพ" bg="bg-slate-50/50" />

                            <EvaluationGroup title="3. การจัดการสเตชันและความสะอาด (Station Management)" />
                            <EvaluationRow title="3.1 Clean as you go" desc="เคาะกาก เช็ดหัวกรุ๊ป ล้างก้านนมทันที โต๊ะบาร์แห้งและสะอาดเสมอ" />
                        </tbody>
                    </table>
                </div>

                {/* Evaluation Conclusion Box */}
                <div className="bg-slate-50 border-t border-slate-100 p-6 md:p-10 print:bg-transparent print:border-t-2 print:border-slate-300 print:px-0">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">สรุปผลการประเมิน (Conclusion)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                        {/* Score Box */}
                        <div className="md:col-span-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center items-center print:border-slate-300 print:shadow-none">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Score</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-300 print:text-slate-800">0</span> 
                                <span className="text-sm font-bold text-slate-400">/ 75</span>
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="md:col-span-8 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">จุดเด่นที่ควรชื่นชม (Strengths)</label>
                                <div className="w-full min-h-[70px] bg-white border border-slate-200 rounded-xl p-4 text-slate-400 text-sm print:border-slate-300">
                                    <span className="print:hidden italic opacity-50">คลิกเพื่อพิมพ์ข้อความแสดงความคิดเห็น...</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">จุดที่ต้องพัฒนา (Areas for improvement)</label>
                                <div className="w-full min-h-[70px] bg-white border border-slate-200 rounded-xl p-4 text-slate-400 text-sm print:border-slate-300">
                                    <span className="print:hidden italic opacity-50">คลิกเพื่อพิมพ์ข้อความแสดงความคิดเห็น...</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Final Result */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-wrap items-center gap-6 print:border-slate-300 print:shadow-none">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Result:</span>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-amber-500 transition-colors print:border-slate-800"></div>
                                <span className="text-sm font-bold text-slate-700">ผ่านเกณฑ์</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-amber-500 transition-colors print:border-slate-800"></div>
                                <span className="text-sm font-bold text-slate-700">ขยายเวลาทดลองงาน</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-red-500 transition-colors print:border-slate-800"></div>
                                <span className="text-sm font-bold text-slate-700">ไม่ผ่านเกณฑ์</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Signature Area (Visible on screen and print) */}
            <div className="mt-16 mb-24 break-inside-avoid px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-center pt-8">
                    <div className="flex flex-col items-center">
                        <div className="w-64 border-b-2 border-dashed border-slate-300 mb-4 print:border-slate-800"></div>
                        <p className="text-sm font-bold text-slate-800">พนักงานผู้รับการประเมิน</p>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Employee Signature</p>
                        <p className="text-sm font-medium text-slate-500 mt-6 flex items-center justify-center gap-3">
                            Date: <span className="border-b border-slate-300 w-32 inline-block print:border-slate-800"></span>
                        </p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-64 border-b-2 border-dashed border-slate-300 mb-4 print:border-slate-800"></div>
                        <p className="text-sm font-bold text-slate-800">ผู้จัดการร้าน / ผู้ประเมิน</p>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Manager Signature</p>
                        <p className="text-sm font-medium text-slate-500 mt-6 flex items-center justify-center gap-3">
                            Date: <span className="border-b border-slate-300 w-32 inline-block print:border-slate-800"></span>
                        </p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 15mm; }
                    html, body {
                        height: max-content !important;
                        overflow: visible !important;
                        min-height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        color: black !important;
                    }
                    #__next, main, div, section, article {
                        height: max-content !important;
                        min-height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                    }
                    body * { visibility: hidden; }
                    .print-container, .print-container * { visibility: visible; }
                    .print-container {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .print\\:hidden { display: none !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:border-none { border: none !important; }
                    .print\\:bg-white { background-color: white !important; }
                    .print\\:bg-transparent { background-color: transparent !important; }
                    .print\\:text-slate-800 { color: #1e293b !important; }
                    .print\\:text-slate-900 { color: #0f172a !important; }
                    .print\\:border-slate-300 { border-color: #cbd5e1 !important; }
                    .print\\:border-slate-800 { border-color: #1e293b !important; }
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
                className={`bg-amber-50/50 border-b-2 border-amber-400 focus:outline-none focus:border-amber-600 px-2 py-0.5 rounded-t text-slate-900 transition-colors ${className}`} 
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
                className={`w-full bg-amber-50/30 border border-amber-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-800 resize-y transition-all ${className}`} 
            />
        );
    }
    return <span className={className}>{value}</span>;
}

// Subcomponents for View
function Section({ number, title, icon, children }: { number: string, title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="relative break-inside-avoid group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-100 rounded-full group-hover:bg-amber-400 transition-colors print:bg-slate-300"></div>
            <div className="pl-6 md:pl-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-amber-500 group-hover:bg-amber-50 group-hover:border-amber-100 transition-all print:border-slate-300 print:text-slate-800">
                        {icon}
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 print:text-slate-500">Section {number}</div>
                        <h2 className="text-base font-bold text-slate-800 tracking-tight print:text-slate-900">{title}</h2>
                    </div>
                </div>
                <div className="space-y-8">
                    {children}
                </div>
            </div>
        </div>
    );
}

function SubSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="break-inside-avoid">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 print:text-slate-800">
                {title}
            </h3>
            <ul className="space-y-4">
                {children}
            </ul>
        </div>
    );
}

function ListItem({ title, children }: { title?: string, children: React.ReactNode }) {
    return (
        <li className="flex items-start gap-3 text-sm leading-relaxed text-slate-600 print:text-slate-700 break-inside-avoid">
            <div className="mt-[6px] print:hidden">
                <ChevronRight size={14} className="text-amber-500" />
            </div>
            <div className="hidden print:block mt-1 font-bold text-slate-400">-</div>
            <div className="w-full">
                {title && <span className="font-bold text-slate-800 mr-2 print:text-slate-900">{title}:</span>}
                {children}
            </div>
        </li>
    );
}

function EvaluationGroup({ title, bg = "bg-white" }: { title: string, bg?: string }) {
    return (
        <tr className={bg}>
            <td colSpan={6} className="py-4 px-2 font-bold text-sm text-slate-800 border-b border-slate-100 print:border-slate-300 print:text-slate-900">
                {title}
            </td>
        </tr>
    );
}

function EvaluationRow({ title, desc, bg = "bg-white" }: { title: string, desc: string, bg?: string }) {
    return (
        <tr className={`border-b border-slate-100 print:border-slate-300 break-inside-avoid hover:bg-slate-50 transition-colors ${bg}`}>
            <td className="py-3 px-2">
                <div className="font-bold text-sm text-slate-700 print:text-slate-800">{title}</div>
                <div className="text-xs text-slate-500 mt-1 print:text-slate-600">{desc}</div>
            </td>
            {[5,4,3,2,1].map(num => (
                <td key={num} className="py-3 px-2 text-center align-middle">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 mx-auto bg-white print:border-slate-400"></div>
                </td>
            ))}
        </tr>
    );
}
