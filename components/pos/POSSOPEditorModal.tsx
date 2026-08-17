import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Printer, FileText, FileSignature } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useReactToPrint } from 'react-to-print';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { 
    ssr: false, 
    loading: () => <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200">กำลังโหลดเครื่องมือจัดหน้า...</div>
});

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        [{ 'color': [] }, { 'background': [] }],
        ['clean']
    ],
};

const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'color', 'background'
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    shopSettings: any;
    branchId: string;
}

interface SOPData {
    docNo: string;
    revision: string;
    effectiveDate: string;
    preparedBy: string;
    approvedBy: string;
    content: string;
}

const DEFAULT_CONTENT = `<h2><strong>1. วัตถุประสงค์ (Purpose)</strong></h2>
<p>เพื่อกำหนดมาตรฐานการปฏิบัติงานในการเปิด-ปิดร้าน การแต่งกาย การให้บริการลูกค้า และบทลงโทษ เพื่อให้พนักงานทุกคนปฏิบัติงานได้อย่างถูกต้องและมีมาตรฐานเดียวกัน</p>

<h2><strong>2. ขอบเขต (Scope)</strong></h2>
<p>ครอบคลุมพนักงานทุกคนที่ปฏิบัติงานภายในร้าน ตั้งแต่ระดับพนักงานบริการ พนักงานชงเครื่องดื่ม ไปจนถึงผู้จัดการสาขา</p>

<h2><strong>3. ขั้นตอนการปฏิบัติงาน (Procedure)</strong></h2>
<h3><strong>3.1 การแต่งกายและสุขอนามัยส่วนบุคคล</strong></h3>
<ul>
  <li>สวมใส่ชุดยูนิฟอร์มของร้านให้เรียบร้อยและสะอาดอยู่เสมอ</li>
  <li>ผู้ชาย: ตัดผมสั้น หรือเซ็ตให้เรียบร้อย ห้ามไว้หนวดเครา</li>
  <li>ผู้หญิง: รวบผมให้เรียบร้อย และสวมตาข่ายคลุมผม (ถ้ามี)</li>
  <li>สวมหน้ากากอนามัย และล้างมือทุกครั้งก่อนสัมผัสอาหารหรือเครื่องดื่ม</li>
</ul>

<h3><strong>3.2 การเปิดร้าน (Opening Store)</strong></h3>
<ol>
  <li>มาถึงร้านก่อนเวลาเปิดให้บริการอย่างน้อย 30 นาที</li>
  <li>ตรวจสอบความสะอาดของพื้นที่ให้บริการ โต๊ะ เก้าอี้ และห้องน้ำ</li>
  <li>เปิดระบบเครื่องคิดเงิน (POS) และนับเงินทอนเตรียมไว้</li>
  <li>เปิดเครื่องชงกาแฟ อุปกรณ์ต่างๆ และตรวจสอบวัตถุดิบ (Stock) ว่าเพียงพอต่อการขาย</li>
</ol>

<h3><strong>3.3 การบริการลูกค้า (Customer Service)</strong></h3>
<ul>
  <li>กล่าวทักทายลูกค้าทันทีที่เดินเข้ามาในร้าน ด้วยคำว่า "สวัสดีครับ/ค่ะ ยินดีต้อนรับครับ/ค่ะ"</li>
  <li>รับออเดอร์ด้วยความยิ้มแย้ม และทวนรายการอาหาร/เครื่องดื่มทุกครั้งก่อนคิดเงิน</li>
  <li>หากลูกค้ามีข้อร้องเรียน ให้รับฟังอย่างตั้งใจ กล่าวคำขอโทษ และแจ้งผู้จัดการร้านทันที</li>
</ul>

<h3><strong>3.4 การปิดร้าน (Closing Store)</strong></h3>
<ol>
  <li>สรุปยอดขายรายวัน (End of Day) ในระบบ POS และนำเงินส่งผู้จัดการ</li>
  <li>ทำความสะอาดเครื่องชงกาแฟ พื้นที่เตรียมอาหาร และล้างอุปกรณ์ทั้งหมด</li>
  <li>เคลียร์ขยะ นำไปทิ้งในจุดที่กำหนด</li>
  <li>ตรวจสอบการปิดไฟ แอร์ และล็อคประตูร้านให้เรียบร้อยก่อนกลับ</li>
</ol>

<h2><strong>4. บทลงโทษทางวินัย (Disciplinary Action)</strong></h2>
<ul>
  <li><strong>มาสายเกิน 3 ครั้ง/เดือน:</strong> ตักเตือนด้วยวาจา และบันทึกประวัติ</li>
  <li><strong>ขาดงานโดยไม่แจ้งล่วงหน้า (ละทิ้งหน้าที่):</strong> หักค่าจ้างตามสัดส่วน และออกหนังสือเตือน</li>
  <li><strong>ทุจริตต่อหน้าที่ (เช่น ขโมยเงิน/สินค้า):</strong> เลิกจ้างทันทีโดยไม่มีเงินชดเชย และดำเนินคดีตามกฎหมาย</li>
</ul>
`;

export default function POSSOPEditorModal({ isOpen, onClose, shopSettings, branchId }: Props) {
    const [sopData, setSopData] = useState<SOPData>({
        docNo: 'SOP-001',
        revision: '1.0',
        effectiveDate: new Date().toISOString().split('T')[0],
        preparedBy: '',
        approvedBy: '',
        content: DEFAULT_CONTENT
    });
    
    const [isSaving, setIsSaving] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && shopSettings?.opening_hours?.sop_content) {
            try {
                const parsed = JSON.parse(shopSettings.opening_hours.sop_content);
                if (parsed && typeof parsed === 'object' && parsed.content) {
                    setSopData(parsed);
                } else {
                    // Fallback for old plain text format
                    setSopData(prev => ({ ...prev, content: shopSettings.opening_hours.sop_content }));
                }
            } catch (e) {
                // Fallback for old plain text format
                setSopData(prev => ({ ...prev, content: shopSettings.opening_hours.sop_content }));
            }
        }
    }, [isOpen, shopSettings]);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `SOP_${sopData.docNo}_${shopSettings?.opening_hours?.name_en || 'Shop'}`
    });

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedOpeningHours = {
                ...(shopSettings?.opening_hours || {}),
                sop_content: JSON.stringify(sopData)
            };

            const { error } = await supabase
                .from('pos_shop_settings')
                .update({ opening_hours: updatedOpeningHours })
                .eq('branch_id', branchId);

            if (error) throw error;
            alert('บันทึกคู่มือ SOP สำเร็จ');
            
        } catch (err: any) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการบันทึก SOP');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFieldChange = (field: keyof SOPData, value: string) => {
        setSopData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-[#D3202B]/60 backdrop-blur-sm" 
                onClick={onClose} 
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <FileSignature size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900">เอกสารมาตรฐานปฏิบัติงาน (SOP)</h2>
                            <p className="text-xs font-bold text-gray-500">จัดการรายละเอียดเอกสารและฟอร์มเซ็นรับทราบพนักงาน</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Editor Area (A4 Paper Simulation) */}
                <div className="flex-1 p-4 sm:p-8 overflow-y-auto bg-gray-100/80 flex justify-center gap-8 items-start">
                    
                    {/* Metadata Sidebar */}
                    <div className="w-[300px] bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex-shrink-0 sticky top-0">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3">
                            รายละเอียดหัวเอกสาร
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">รหัสเอกสาร (Document No.)</label>
                                <input 
                                    type="text" 
                                    value={sopData.docNo}
                                    onChange={(e) => handleFieldChange('docNo', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">ครั้งที่แก้ไข (Revision)</label>
                                <input 
                                    type="text" 
                                    value={sopData.revision}
                                    onChange={(e) => handleFieldChange('revision', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">วันที่บังคับใช้ (Effective Date)</label>
                                <input 
                                    type="date" 
                                    value={sopData.effectiveDate}
                                    onChange={(e) => handleFieldChange('effectiveDate', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">ผู้จัดทำ (Prepared By)</label>
                                <input 
                                    type="text" 
                                    placeholder="ชื่อผู้จัดการ หรือแผนก"
                                    value={sopData.preparedBy}
                                    onChange={(e) => handleFieldChange('preparedBy', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">ผู้อนุมัติ (Approved By)</label>
                                <input 
                                    type="text" 
                                    placeholder="ชื่อผู้บริหาร หรือเจ้าของ"
                                    value={sopData.approvedBy}
                                    onChange={(e) => handleFieldChange('approvedBy', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-full max-w-[800px] bg-white shadow-xl min-h-[1131px] rounded-sm flex flex-col border border-gray-200 print-a4-page">
                        {/* Document Header (Formal SOP Style) */}
                        <div className="pt-12 px-12 pb-4 mb-4 mt-4">
                            <table className="w-full border-collapse border border-[#D3202B] text-sm">
                                <tbody>
                                    <tr>
                                        <td rowSpan={3} className="border border-[#D3202B] p-4 text-center font-black text-2xl w-[35%] align-middle bg-gray-50">
                                            {shopSettings?.opening_hours?.name_en || shopSettings?.opening_hours?.branch_name_th || 'LOGO / BRAND'}
                                        </td>
                                        <td className="border border-[#D3202B] p-2 font-bold bg-gray-50 w-[20%]">Document Title</td>
                                        <td colSpan={3} className="border border-[#D3202B] p-2 font-black text-lg text-center">
                                            Standard Operating Procedure (SOP)
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-[#D3202B] p-2 font-bold bg-gray-50">Document No.</td>
                                        <td className="border border-[#D3202B] p-2 text-center font-semibold">{sopData.docNo || '-'}</td>
                                        <td className="border border-[#D3202B] p-2 font-bold bg-gray-50 w-[15%]">Revision</td>
                                        <td className="border border-[#D3202B] p-2 text-center font-semibold w-[15%]">{sopData.revision || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-[#D3202B] p-2 font-bold bg-gray-50">Effective Date</td>
                                        <td className="border border-[#D3202B] p-2 text-center font-semibold">{sopData.effectiveDate ? new Date(sopData.effectiveDate).toLocaleDateString('en-GB') : '-'}</td>
                                        <td className="border border-[#D3202B] p-2 font-bold bg-gray-50">Page</td>
                                        <td className="border border-[#D3202B] p-2 text-center font-semibold">1 of 1</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Editor Content */}
                        <div className="px-12 pb-16 flex-1 flex flex-col">
                            <ReactQuill 
                                theme="snow"
                                value={sopData.content}
                                onChange={(val) => handleFieldChange('content', val)}
                                modules={modules}
                                formats={formats}
                                className="flex-1 border-none document-quill"
                                placeholder="พิมพ์ข้อความ SOP ของคุณที่นี่..."
                            />
                        </div>

                        {/* Signature Preview */}
                        <div className="px-12 pb-12 mt-auto">
                            <div className="border-t border-dashed border-gray-300 pt-8 mt-8">
                                <h3 className="font-bold text-center text-gray-500 mb-6">ส่วนแสดงผลใบเซ็นรับทราบพนักงาน (จะแสดงตอนพิมพ์)</h3>
                                <div className="p-8 bg-gray-50 rounded-xl border border-gray-200 opacity-70">
                                    <p className="text-sm font-semibold mb-8 text-center text-gray-600">
                                        "ข้าพเจ้าได้รับทราบและเข้าใจถึงระเบียบข้อบังคับและมาตรฐานการปฏิบัติงานฉบับนี้เป็นอย่างดี และยินดีปฏิบัติตามอย่างเคร่งครัด หากฝ่าฝืนยินยอมให้บริษัทดำเนินการตามบทลงโทษ"
                                    </p>
                                    <div className="flex justify-between items-end px-10">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-48 border-b border-gray-400"></div>
                                            <p className="text-xs text-gray-500 font-bold">( ลงชื่อพนักงาน )</p>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-48 border-b border-gray-400"></div>
                                            <p className="text-xs text-gray-500 font-bold">( วันที่ )</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center z-10">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-[#D3202B] text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {isSaving ? 'กำลังบันทึก...' : 'บันทึกแบบฟอร์ม'}
                    </button>

                    <button 
                        onClick={() => handlePrint()}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                    >
                        <Printer size={18} />
                        พิมพ์เพื่อนำไปเซ็น (PDF)
                    </button>
                </div>
                
                {/* Hidden Printable Area */}
                <div className="hidden">
                    <div ref={printRef} className="p-0 font-sans bg-white text-black print-a4-page">
                        <div className="pt-8 px-12 pb-4 mb-4 mt-4">
                            <table className="w-full border-collapse border border-black text-[13px] leading-snug">
                                <tbody>
                                    <tr>
                                        <td rowSpan={3} className="border border-black p-4 text-center font-black text-2xl w-[35%] align-middle bg-gray-100 print:bg-gray-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                            {shopSettings?.opening_hours?.name_en || shopSettings?.opening_hours?.branch_name_th || 'LOGO / BRAND'}
                                        </td>
                                        <td className="border border-black p-2 font-bold bg-gray-100 print:bg-gray-100 w-[20%]" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Document Title</td>
                                        <td colSpan={3} className="border border-black p-2 font-black text-lg text-center">
                                            Standard Operating Procedure (SOP)
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2 font-bold bg-gray-100 print:bg-gray-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Document No.</td>
                                        <td className="border border-black p-2 text-center font-semibold">{sopData.docNo || '-'}</td>
                                        <td className="border border-black p-2 font-bold bg-gray-100 print:bg-gray-100 w-[15%]" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Revision</td>
                                        <td className="border border-black p-2 text-center font-semibold w-[15%]">{sopData.revision || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2 font-bold bg-gray-100 print:bg-gray-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Effective Date</td>
                                        <td className="border border-black p-2 text-center font-semibold">{sopData.effectiveDate ? new Date(sopData.effectiveDate).toLocaleDateString('en-GB') : '-'}</td>
                                        <td className="border border-black p-2 font-bold bg-gray-100 print:bg-gray-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Page</td>
                                        <td className="border border-black p-2 text-center font-semibold">1 of 1</td>
                                    </tr>
                                </tbody>
                            </table>
                            {/* Prepared By / Approved By row */}
                            <table className="w-full border-collapse border-l border-r border-b border-black text-[13px] leading-snug mt-[-1px]">
                                <tbody>
                                    <tr>
                                        <td className="border border-black p-2 font-bold bg-gray-100 print:bg-gray-100 w-[15%]" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Prepared By</td>
                                        <td className="border border-black p-2 text-center font-semibold w-[35%]">{sopData.preparedBy || '-'}</td>
                                        <td className="border border-black p-2 font-bold bg-gray-100 print:bg-gray-100 w-[15%]" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Approved By</td>
                                        <td className="border border-black p-2 text-center font-semibold w-[35%]">{sopData.approvedBy || '-'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="px-12 pb-16 whitespace-pre-wrap leading-relaxed text-[15px] font-medium quill-print-content min-h-[500px]" dangerouslySetInnerHTML={{ __html: sopData.content }} />

                        {/* Formal Signature Section */}
                        <div className="px-12 pb-12 mt-auto" style={{ pageBreakInside: 'avoid' }}>
                            <div className="border-t-2 border-black pt-8 mt-8">
                                <h3 className="font-bold text-center text-lg mb-6 underline">บันทึกข้อตกลงและรับทราบระเบียบข้อบังคับ</h3>
                                <p className="text-sm font-semibold mb-12 text-center leading-relaxed">
                                    "ข้าพเจ้าได้รับทราบและเข้าใจถึงระเบียบข้อบังคับและมาตรฐานการปฏิบัติงาน (SOP) ฉบับนี้เป็นอย่างดี <br/>และยินดีปฏิบัติตามอย่างเคร่งครัด หากฝ่าฝืนยินยอมให้บริษัทดำเนินการตามบทลงโทษ"
                                </p>
                                
                                <div className="grid grid-cols-2 gap-12 max-w-2xl mx-auto">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-full border-b border-black mt-8"></div>
                                        <div className="flex w-full justify-between px-2 text-sm">
                                            <span>(</span>
                                            <span className="text-gray-400">ตัวบรรจง</span>
                                            <span>)</span>
                                        </div>
                                        <p className="text-sm font-bold mt-[-8px]">ผู้รับรอง/พนักงาน</p>
                                    </div>
                                    <div className="flex flex-col justify-end gap-4">
                                        <div className="flex items-end gap-2 w-full">
                                            <span className="text-sm font-bold">ตำแหน่ง:</span>
                                            <div className="flex-1 border-b border-black border-dotted"></div>
                                        </div>
                                        <div className="flex items-end gap-2 w-full mt-4">
                                            <span className="text-sm font-bold">วันที่:</span>
                                            <div className="flex-1 border-b border-black border-dotted"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </motion.div>
            
            <style jsx global>{`
                .quill-print-content h1 { font-size: 1.8em; font-weight: bold; margin-bottom: 0.5em; margin-top: 1em; color: #111827; }
                .quill-print-content h2 { font-size: 1.4em; font-weight: bold; margin-bottom: 0.5em; margin-top: 1em; color: #1f2937; }
                .quill-print-content h3 { font-size: 1.15em; font-weight: bold; margin-bottom: 0.5em; margin-top: 1em; color: #374151; }
                .quill-print-content ul { list-style-type: disc; padding-left: 2.5em; margin-bottom: 1em; }
                .quill-print-content ol { list-style-type: decimal; padding-left: 2.5em; margin-bottom: 1em; }
                .quill-print-content li { margin-bottom: 0.4em; }
                .quill-print-content p { margin-bottom: 1em; line-height: 1.6; }
                .quill-print-content strong { font-weight: bold; }
                .quill-print-content em { font-style: italic; }
                .quill-print-content u { text-decoration: underline; }
                .quill-print-content .ql-align-center { text-align: center; }
                .quill-print-content .ql-align-right { text-align: right; }
                .quill-print-content .ql-align-justify { text-align: justify; }
                
                /* Ensure tables inside print match exactly */
                @media print {
                    .print-a4-page { width: 210mm !important; margin: 0 auto; box-shadow: none !important; }
                    .print-a4-page table { border-color: black !important; }
                    .print-a4-page td { border-color: black !important; }
                }

                /* Quill Editor overrides for document look */
                .document-quill .ql-container.ql-snow {
                    border: none;
                    font-size: 15px;
                    font-family: inherit;
                    line-height: 1.6;
                }
                .document-quill .ql-editor {
                    padding: 0;
                    min-height: 300px;
                }
                .document-quill .ql-toolbar.ql-snow {
                    border: none;
                    border-bottom: 2px dashed #e5e7eb;
                    padding: 12px 0;
                    margin-bottom: 20px;
                    background-color: transparent;
                    position: sticky;
                    top: -16px;
                    z-index: 10;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(4px);
                }
            `}</style>
        </div>
    );
}
