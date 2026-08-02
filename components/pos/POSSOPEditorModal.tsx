import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Printer, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useReactToPrint } from 'react-to-print';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    shopSettings: any;
    branchId: string;
}

const DEFAULT_SOP = `คู่มือมาตรฐานการปฏิบัติงาน (SOP) ประจำสาขา

1. การแต่งกายและสุขอนามัย
- พนักงานต้องแต่งกายด้วยชุดยูนิฟอร์มของร้านให้เรียบร้อย
- ดูแลความสะอาดของร่างกายและมืออยู่เสมอ
- สวมใส่หน้ากากอนามัยและผ้ากันเปื้อนขณะปฏิบัติงาน

2. การเปิด-ปิดร้าน
- ก่อนเปิดร้าน: ตรวจสอบความสะอาดของพื้นที่ เครื่องทำกาแฟ และสต็อกสินค้า
- หลังปิดร้าน: ทำความสะอาดอุปกรณ์ทั้งหมด นับสต็อก และสรุปยอดขายรายวัน

3. การบริการลูกค้า
- กล่าวทักทายลูกค้าด้วยความสุภาพและยิ้มแย้มเสมอ
- รับออเดอร์อย่างระมัดระวังและทวนรายการสั่งซื้อทุกครั้ง
- กรณีลูกค้ามีข้อร้องเรียน ให้รับฟังด้วยความใจเย็นและแจ้งผู้จัดการสาขาทันที

4. บทลงโทษทางวินัย
- มาสายเกิน 3 ครั้งใน 1 เดือน: ตักเตือนด้วยวาจา
- ขาดงานโดยไม่แจ้งล่วงหน้า: หักค่าจ้างและตักเตือนเป็นลายลักษณ์อักษร
- ทุจริตต่อหน้าที่: เลิกจ้างทันทีโดยไม่มีเงินชดเชย
`;

export default function POSSOPEditorModal({ isOpen, onClose, shopSettings, branchId }: Props) {
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setContent(shopSettings?.opening_hours?.sop_content || DEFAULT_SOP);
        }
    }, [isOpen, shopSettings]);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `SOP_${shopSettings?.opening_hours?.name_en || 'Shop'}`
    });

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedOpeningHours = {
                ...(shopSettings?.opening_hours || {}),
                sop_content: content
            };

            const { error } = await supabase
                .from('pos_shop_settings')
                .update({ opening_hours: updatedOpeningHours })
                .eq('branch_id', branchId);

            if (error) throw error;
            alert('บันทึกคู่มือ SOP สำเร็จ');
            
            // Note: Since we are not passing an onUpdate callback right now, 
            // the parent component will reload the setting on next refresh.
            // In a more robust setup, we'd trigger a reload or update local state.
        } catch (err: any) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการบันทึก SOP');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-[#1A1A18]/60 backdrop-blur-sm" 
                onClick={onClose} 
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900">แก้ไขคู่มือมาตรฐาน (SOP)</h2>
                            <p className="text-xs font-bold text-gray-500">ปรับแต่งข้อความก่อนพิมพ์หรือดาวน์โหลด PDF</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Editor Area */}
                <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-full min-h-[400px] p-6 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none font-medium text-gray-700 leading-relaxed text-sm bg-white shadow-sm"
                        placeholder="พิมพ์ข้อความ SOP ของคุณที่นี่..."
                    />
                </div>

                {/* Footer / Actions */}
                <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อความ'}
                    </button>

                    <button 
                        onClick={() => handlePrint()}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                    >
                        <Printer size={18} />
                        พิมพ์ / ดาวน์โหลด PDF
                    </button>
                </div>
                
                {/* Hidden Printable Area */}
                <div className="hidden">
                    <div ref={printRef} className="p-12 font-sans bg-white text-black print:p-8">
                        <div className="text-center border-b-2 border-black pb-6 mb-8">
                            <h1 className="text-3xl font-black mb-2">{shopSettings?.opening_hours?.name_en || shopSettings?.opening_hours?.branch_name_th || 'SHOP SOP'}</h1>
                            <h2 className="text-xl font-bold text-gray-600">คู่มือมาตรฐานการปฏิบัติงาน (Standard Operating Procedure)</h2>
                            <p className="text-sm mt-2 text-gray-500">อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH')}</p>
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed text-base font-medium">
                            {content}
                        </div>
                    </div>
                </div>

            </motion.div>
        </div>
    );
}
