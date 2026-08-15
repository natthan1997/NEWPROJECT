import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Users, Sparkles, Star, Edit, Printer, Save, FileText, ChevronRight } from 'lucide-react';
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
        const sop = data;

        const row = (t: string, txt: string) => `<li><strong>${t}:</strong> ${txt}</li>`;
        const plain = (txt: string) => `<li>${txt}</li>`;
        const sub = (title: string, items: string) =>
            `<div class="sub"><h4>${title}</h4><ul>${items}</ul></div>`;
        const sec = (n: string, title: string, body: string) =>
            `<div class="sec"><h3>หมวดที่ ${n}: ${title}</h3><div class="sec-body">${body}</div></div>`;

        const sectionsHTML = [
            sec('1','มาตรฐานรูปลักษณ์ สุขอนามัย และการแต่งกาย', sub('เครื่องแบบและสุขอนามัย (Grooming & Hygiene)', [row('เครื่องแต่งกาย',sop.sec1_uniform),row('ทรงผมและใบหน้า',sop.sec1_hair),row('เล็บและเครื่องประดับ',sop.sec1_nails),row('กลิ่นกาย',sop.sec1_scent)].join(''))),
            sec('2','การตรงต่อเวลา การเข้า-ออกงาน และการลางาน', sub('การลงเวลาและการลางาน (Attendance Standards)', [row('การเข้างาน',sop.sec2_arrive),row('การลงเวลา',sop.sec2_clock),row('การลาป่วย/ลากิจ',sop.sec2_leave),row('การขาดงาน',sop.sec2_absent)].join(''))),
            sec('3','พฤติกรรม มารยาท และข้อห้ามขณะปฏิบัติงาน', sub('กฎเหล็กพื้นที่บริการ (On-Duty Conduct)', `<div class="rule-box"><strong>กฎระเบียบเรื่องโทรศัพท์มือถือ:</strong><br>${sop.sec3_phone}</div>`+plain(sop.sec3_talk)+plain(sop.sec3_eat)+plain(sop.sec3_rude))),
            sec('4','มาตรฐานการบริการและการสื่อสารกับลูกค้า', sub('ขั้นตอนบริการและการรับมือข้อร้องเรียน', [row('การต้อนรับ',sop.sec4_greet),row('การรับ-เสิร์ฟออเดอร์',sop.sec4_order),`<li><strong>หลัก LAST รับมือข้อร้องเรียน:</strong><div class="last-box"><div><strong>L-Listen:</strong> รับฟังอย่างตั้งใจ</div><div><strong>A-Apologize:</strong> กล่าวขอโทษด้วยความจริงใจ</div><div><strong>S-Solve:</strong> เสนอทางแก้ไขทันที</div><div><strong>T-Thank:</strong> ขอบคุณลูกค้าที่ช่วยติชม</div></div></li>`].join(''))),
            sec('5','มาตรฐานความสะอาดและการจัดการร้าน', sub('ความสะอาด (Clean as you go)', [row('สเตชันบาร์',sop.sec5_bar),row('หน้าร้าน',sop.sec5_front),row('การจัดการขยะ',sop.sec5_trash)].join(''))),
            sec('6','ระเบียบวินัยและบทลงโทษ', sub('ลำดับขั้นบทลงโทษ (Disciplinary Action)', [row('ความผิดทั่วไป',sop.sec6_general),row('ความผิดร้ายแรง',sop.sec6_severe)].join(''))),
        ].join('');

        const evalData = [
            {g:'1. ทักษะวิชาชีพและคุณภาพเครื่องดื่ม'},
            {t:'1.1 การสกัดช็อต',d:'ตั้งค่าเครื่องบดแม่นยำ สกัดช็อตได้รสชาติและปริมาณตามมาตรฐานร้าน'},
            {t:'1.2 การสตีมนม',d:'อุณหภูมินมถูกต้อง โฟมนมเนียนละเอียด เทลาเต้อาร์ตพื้นฐานได้'},
            {t:'1.3 ความแม่นยำของสูตร',d:'ชงเครื่องดื่มได้รสชาติสม่ำเสมอ ไม่ลืมส่วนผสม ใส่ใจรายละเอียด'},
            {t:'1.4 ความเร็วและความแม่นยำ',d:'จัดการออเดอร์ช่วงลูกค้าหนาแน่นได้รวดเร็ว ไม่ทำสลับคิว'},
            {g:'2. งานบริการและการขาย'},
            {t:'2.1 การต้อนรับ',d:'ทักทายลูกค้าอย่างอบอุ่น สุภาพ ยิ้มแย้ม และมี Service Mind เสมอ'},
            {t:'2.2 ความรู้เรื่องเมนู',d:'อธิบายคาแรคเตอร์เมล็ดกาแฟ ส่วนผสม และแนะนำเมนูให้ตรงใจลูกค้าได้'},
            {t:'2.3 การเสนอขาย',d:'มีทักษะเสนอขายขนม เบเกอรี่ หรือสินค้าเพิ่มเติมได้อย่างเป็นธรรมชาติ'},
            {t:'2.4 การแก้ปัญหา',d:'รับมือข้อร้องเรียนของลูกค้าได้อย่างสุภาพและเป็นมืออาชีพ'},
            {g:'3. การจัดการสเตชันและความสะอาด'},
            {t:'3.1 Clean as you go',d:'เคาะกาก เช็ดหัวกรุ๊ป ล้างก้านนมทันที โต๊ะบาร์แห้งและสะอาดเสมอ'},
            {t:'3.2 การจัดพื้นที่',d:'วัตถุดิบเรียงอย่างเป็นระบบ สต็อกครบก่อนเปิดร้าน ลิ้นชักสะอาดตลอด'},
            {t:'3.3 ห้องน้ำและพื้นที่ส่วนกลาง',d:'ตรวจสอบและทำความสะอาดอย่างน้อยทุก 2 ชั่วโมง ในช่วงเวลาทำการ'},
            {g:'4. การตรงต่อเวลาและความรับผิดชอบ'},
            {t:'4.1 การมาตรงเวลา',d:'มาถึงครบถ้วนตามกะที่ได้รับมอบหมาย ไม่สายและไม่ขาดงานโดยไม่แจ้ง'},
            {t:'4.2 การสวมเครื่องแบบ',d:'แต่งกายตามมาตรฐานร้านครบถ้วน สะอาด เรียบร้อยทุกวันทำงาน'},
            {t:'4.3 ความรับผิดชอบงาน',d:'ทำงานที่ได้รับมอบหมายได้ครบถ้วน ไม่ต้องให้หัวหน้าตามบ่อยครั้ง'},
            {g:'5. ทัศนคติและการทำงานร่วมกัน'},
            {t:'5.1 ทัศนคติเชิงบวก',d:'มองโลกในแง่ดี พร้อมรับคำแนะนำ ปรับตัวเก่งเมื่อเกิดปัญหา'},
            {t:'5.2 การทำงานเป็นทีม',d:'ช่วยเหลือเพื่อนร่วมงาน แบ่งปันงาน ไม่ปล่อยให้ใครทำคนเดียว'},
            {t:'5.3 การรับและให้ Feedback',d:'รับฟังคำแนะนำอย่างเปิดใจ และสื่อสารปัญหาได้อย่างตรงไปตรงมา'},
        ];

        const evalRows = evalData.map(r => {
            if ('g' in r) return `<tr class="eg"><td colspan="6">${r.g}</td></tr>`;
            const dots = [1,2,3,4,5].map(()=>`<td><span class="dot"></span></td>`).join('');
            return `<tr class="er"><td><div class="rt">${(r as any).t}</div><div class="rd">${(r as any).d}</div></td>${dots}</tr>`;
        }).join('');

        const win = window.open('', '_blank', 'width=900,height=1200');
        if (!win) { alert('กรุณาอนุญาต popup เพื่อสั่งพิมพ์'); return; }

        win.document.write(`<!DOCTYPE html><html lang="th"><head>
<meta charset="UTF-8"><title>คู่มือปฏิบัติงาน - ${sop.shopName}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
@page{size:A4 portrait;margin:0}
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
body{font-family:'Sarabun','TH Sarabun New',sans-serif;font-size:13px;line-height:1.65;color:#111;background:#fff;padding:20mm}
.hdr{text-align:center;border-bottom:2px solid #222;padding-bottom:12px;margin-bottom:12px}
.badge{display:inline-block;border:1px solid #666;color:#666;font-size:10px;font-weight:700;padding:2px 10px;border-radius:99px;margin-bottom:6px}
h1{font-size:20px;font-weight:900;color:#000;margin-bottom:2px}
.sub1{font-size:11px;color:#666}
.info{display:flex;justify-content:center;gap:36px;padding:8px 0 10px;border-bottom:1px solid #ccc;margin-bottom:14px}
.info-item{text-align:center}
.info-label{font-size:9px;font-weight:700;color:#888;display:block;margin-bottom:1px;text-transform:uppercase;letter-spacing:.5px}
.info-value{font-size:13px;font-weight:700;color:#000}
.sec{margin-bottom:14px}
.sec h3{font-size:13px;font-weight:800;color:#000;border-bottom:1.5px solid #222;padding-bottom:3px;margin-bottom:8px;page-break-after:avoid}
.sec-body{padding-left:8px}
.sub{margin-bottom:8px}
.sub h4{font-size:11.5px;font-weight:700;color:#333;border-bottom:1px dashed #bbb;padding-bottom:2px;margin-bottom:6px;page-break-after:avoid}
ul{list-style:none;padding:0}
li{position:relative;padding-left:12px;font-size:11.5px;line-height:1.6;color:#222;margin-bottom:4px;page-break-inside:avoid}
li::before{content:"–";position:absolute;left:0;color:#555}
li strong{font-weight:700}
.rule-box{border-left:3px solid #666;padding:6px 10px;margin-bottom:7px;background:#f7f7f7;font-size:11.5px;line-height:1.6;color:#333}
.last-box{border-left:2px solid #ccc;padding-left:10px;margin-top:4px}
.last-box div{font-size:11px;line-height:1.55;color:#333}
.eval{page-break-before:always}
.eval-hdr{text-align:center;border-bottom:2px solid #222;padding-bottom:10px;margin-bottom:12px}
.eval-hdr h2{font-size:16px;font-weight:900}
.eval-hdr p{font-size:10px;color:#666;margin-top:2px}
table{width:100%;border-collapse:collapse;font-size:11px}
th{border-bottom:2px solid #222;padding:5px 6px;font-weight:800;font-size:11px}
th:first-child{text-align:left}
th:not(:first-child){text-align:center;width:32px}
tr.eg td{background:#eee;font-weight:800;font-size:11.5px;padding:6px 8px;border-top:1px solid #aaa;border-bottom:1px solid #aaa}
tr.er td{padding:5px 6px;border-bottom:1px solid #e0e0e0;vertical-align:top}
tr.er td:not(:first-child){text-align:center;vertical-align:middle}
.rt{font-weight:700;font-size:11px}
.rd{font-size:10px;color:#666;margin-top:1px}
.dot{width:12px;height:12px;border-radius:50%;border:1.5px solid #555;display:inline-block}
tr{page-break-inside:avoid}
.summary{margin-top:14px;border-top:2px solid #222;padding-top:12px}
.summary h3{font-size:13px;font-weight:800;margin-bottom:10px}
.sgrid{display:grid;grid-template-columns:1fr 2fr;gap:10px;margin-bottom:10px}
.sbox{border:1px solid #bbb;padding:10px;text-align:center}
.slabel{font-size:9px;font-weight:700;color:#777}
.sval{font-size:24px;font-weight:900;line-height:1.2}
.smax{font-size:10px;color:#777}
.cgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cbox label{font-size:9px;font-weight:700;color:#666;display:block;margin-bottom:3px}
.carea{border:1px solid #bbb;height:52px}
.fgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:10px}
.fbox{border:1px solid #bbb;padding:7px 10px}
.fbox label{font-size:9px;font-weight:700;color:#666;display:block;margin-bottom:18px}
.fline{border-top:1px solid #bbb;margin-bottom:3px}
.fname{font-size:9px;color:#777;text-align:center}
</style></head><body>
<div class="hdr"><div class="badge">มาตรฐานการปฏิบัติงาน (SOP)</div><h1>คู่มือปฏิบัติงานและประเมินผล</h1><p class="sub1">Comprehensive Operations &amp; Evaluation Manual</p></div>
<div class="info">
<div class="info-item"><span class="info-label">ชื่อร้าน</span><span class="info-value">${sop.shopName}</span></div>
<div class="info-item"><span class="info-label">สาขา</span><span class="info-value">${sop.branchName}</span></div>
<div class="info-item"><span class="info-label">อัปเดตล่าสุด</span><span class="info-value">${sop.updatedDate}</span></div>
</div>
${sectionsHTML}
<div class="eval">
<div class="eval-hdr"><h2>แบบฟอร์มประเมินการปฏิบัติงาน</h2><p>ส่วนที่ 7: Performance Evaluation Form</p></div>
<table><thead><tr><th>หัวข้อการประเมิน</th><th>5</th><th>4</th><th>3</th><th>2</th><th>1</th></tr></thead>
<tbody>${evalRows}</tbody></table>
<div class="summary">
<h3>สรุปผลการประเมิน</h3>
<div class="sgrid">
<div class="sbox"><div class="slabel">คะแนนรวมที่ได้</div><div class="sval">____</div><div class="smax">/ 75 คะแนน</div></div>
<div class="cgrid">
<div class="cbox"><label>จุดเด่นที่ควรชื่นชม</label><div class="carea"></div></div>
<div class="cbox"><label>จุดที่ต้องพัฒนา</label><div class="carea"></div></div>
</div></div>
<div class="fgrid">
<div class="fbox"><label>ผลการประเมิน</label><div style="display:flex;gap:12px;font-size:11px"><span>☐ ผ่าน (≥60%)</span><span>☐ ต้องพัฒนา</span></div></div>
<div class="fbox"><label>ลายมือชื่อพนักงาน</label><div class="fline"></div><div class="fname">(__________________)</div></div>
<div class="fbox"><label>ลายมือชื่อผู้ประเมิน / วันที่</label><div class="fline"></div><div class="fname">(__________________)</div></div>
</div></div></div>
<script>document.fonts.ready.then(function(){setTimeout(function(){window.print()},300);window.onafterprint=function(){window.close()}})</script>
</body></html>`);
        win.document.close();
    };

    const updateField = (field: keyof SOPData, value: string) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 print-container relative pb-20 font-sans text-gray-800">
            
            {/* Admin Actions */}
            {isAdmin && !isEditing && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-6 print:hidden sticky top-4 z-50 bg-white/90 backdrop-blur-md px-6 py-4 rounded-xl border border-gray-200 shadow-sm"
                >
                    <div className="flex items-center gap-3 text-gray-800">
                        <FileText size={20} className="text-gray-500" />
                        <h2 className="font-bold text-[15px] tracking-wide">จัดการเอกสารคู่มือ</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleEditClick}
                            className="flex items-center gap-2 px-5 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-bold shadow-sm hover:border-gray-400 hover:bg-gray-50 transition-all text-[14px]"
                        >
                            <Edit size={16} className="text-gray-500" /> แก้ไขคู่มือ
                        </button>
                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-lg font-bold shadow-sm hover:bg-black transition-all text-[14px]"
                        >
                            <Printer size={16} className="text-gray-400" /> สั่งพิมพ์
                        </button>
                    </div>
                </motion.div>
            )}

            {isAdmin && isEditing && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-6 print:hidden sticky top-4 z-50 bg-blue-50/90 backdrop-blur-md px-6 py-4 rounded-xl border border-blue-200 shadow-sm"
                >
                    <div className="text-blue-800 font-bold flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                            <Edit size={18} className="text-white" />
                        </div>
                        <div>
                            <div className="text-[15px]">โหมดแก้ไขเอกสาร</div>
                            <div className="text-[12px] font-medium opacity-80 mt-0.5">คลิกที่ข้อความด้านล่างเพื่อทำการแก้ไขได้ทันที</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleCancelEdit}
                            className="px-5 py-2 bg-white text-gray-600 rounded-lg font-bold border border-gray-200 shadow-sm hover:bg-gray-50 transition-all text-[14px]"
                        >
                            ยกเลิก
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-sm hover:bg-blue-700 transition-all text-[14px] disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={16} className="text-blue-200" />
                            )}
                            บันทึกการแก้ไข
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Document Container */}
            <div className="bg-white p-8 md:p-12 shadow-sm border border-gray-200 rounded-xl print:shadow-none print:border-none print:p-0 print:rounded-none">
                
                {/* Header Section */}
                <div className="border-b border-gray-200 pb-8 mb-8 text-center print:border-black">
                    <div className="inline-block border border-gray-300 text-gray-500 text-[11px] font-bold px-3 py-1 rounded-full mb-6 print:border-black print:text-black">
                        มาตรฐานการปฏิบัติงาน (SOP)
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-2 print:text-black">
                        คู่มือปฏิบัติงานและประเมินผล
                    </h1>
                    <p className="text-[14px] font-medium text-gray-500 print:text-black">
                        Comprehensive Operations & Evaluation Manual
                    </p>
                </div>

                {/* Info Bar */}
                <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-12">
                    <div className="flex flex-col items-center">
                        <span className="text-[11px] font-bold text-gray-400 mb-1 print:text-black">ชื่อร้าน</span>
                        <span className="text-[15px] font-bold text-gray-800 print:text-black">
                            <InlineInput isEditing={isEditing} value={isEditing ? editData.shopName : data.shopName} onChange={(v) => updateField('shopName', v)} className="text-center font-bold" />
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[11px] font-bold text-gray-400 mb-1 print:text-black">สาขา</span>
                        <span className="text-[15px] font-bold text-gray-800 print:text-black">
                            <InlineInput isEditing={isEditing} value={isEditing ? editData.branchName : data.branchName} onChange={(v) => updateField('branchName', v)} className="text-center font-bold" />
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[11px] font-bold text-gray-400 mb-1 print:text-black">อัปเดตล่าสุด</span>
                        <span className="text-[15px] font-bold text-gray-800 print:text-black">
                            <InlineInput isEditing={isEditing} value={isEditing ? editData.updatedDate : data.updatedDate} onChange={(v) => updateField('updatedDate', v)} className="text-center font-bold" />
                        </span>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-10 pb-8">
                    
                    {/* Section 1 */}
                    <Section number="1" title="มาตรฐานรูปลักษณ์ สุขอนามัย และการแต่งกาย" icon={<Sparkles size={16}/>}>
                        <SubSection title="เครื่องแบบและสุขอนามัย (Grooming & Hygiene)">
                            <ListItem title="เครื่องแต่งกาย"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec1_uniform : data.sec1_uniform} onChange={(v) => updateField('sec1_uniform', v)} /></ListItem>
                            <ListItem title="ทรงผมและใบหน้า"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec1_hair : data.sec1_hair} onChange={(v) => updateField('sec1_hair', v)} /></ListItem>
                            <ListItem title="เล็บและเครื่องประดับ"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec1_nails : data.sec1_nails} onChange={(v) => updateField('sec1_nails', v)} /></ListItem>
                            <ListItem title="กลิ่นกาย"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec1_scent : data.sec1_scent} onChange={(v) => updateField('sec1_scent', v)} /></ListItem>
                        </SubSection>
                    </Section>

                    {/* Section 2 */}
                    <Section number="2" title="การตรงต่อเวลา การเข้า-ออกงาน และการลางาน" icon={<Clock size={16}/>}>
                        <SubSection title="การลงเวลาและการลางาน (Attendance Standards)">
                            <ListItem title="การเข้างาน"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec2_arrive : data.sec2_arrive} onChange={(v) => updateField('sec2_arrive', v)} /></ListItem>
                            <ListItem title="การลงเวลา"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec2_clock : data.sec2_clock} onChange={(v) => updateField('sec2_clock', v)} /></ListItem>
                            <ListItem title="การลาป่วย/ลากิจ"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec2_leave : data.sec2_leave} onChange={(v) => updateField('sec2_leave', v)} /></ListItem>
                            <ListItem title="การขาดงาน"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec2_absent : data.sec2_absent} onChange={(v) => updateField('sec2_absent', v)} /></ListItem>
                        </SubSection>
                    </Section>

                    {/* Section 3 */}
                    <Section number="3" title="พฤติกรรม มารยาท และข้อห้ามขณะปฏิบัติงาน" icon={<AlertTriangle size={16}/>}>
                        <SubSection title="กฎเหล็กพื้นที่บริการ (On-Duty Conduct)">
                            <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mb-4 text-sm print:bg-white print:border-gray-800 print:border-l-[3px]">
                                <h4 className="font-bold text-gray-800 mb-1 print:text-black">
                                    กฎระเบียบเรื่องโทรศัพท์มือถือ:
                                </h4>
                                <div className="text-gray-600 print:text-black">
                                    <InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec3_phone : data.sec3_phone} onChange={(v) => updateField('sec3_phone', v)} />
                                </div>
                            </div>
                            <ListItem><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec3_talk : data.sec3_talk} onChange={(v) => updateField('sec3_talk', v)} /></ListItem>
                            <ListItem><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec3_eat : data.sec3_eat} onChange={(v) => updateField('sec3_eat', v)} /></ListItem>
                            <ListItem><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec3_rude : data.sec3_rude} onChange={(v) => updateField('sec3_rude', v)} /></ListItem>
                        </SubSection>
                    </Section>

                    {/* Section 4 */}
                    <Section number="4" title="มาตรฐานการบริการและการสื่อสารกับลูกค้า" icon={<Users size={16}/>}>
                        <SubSection title="ขั้นตอนบริการและการรับมือข้อร้องเรียน">
                            <ListItem title="การต้อนรับ"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec4_greet : data.sec4_greet} onChange={(v) => updateField('sec4_greet', v)} /></ListItem>
                            <ListItem title="การรับ-เสิร์ฟออเดอร์"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec4_order : data.sec4_order} onChange={(v) => updateField('sec4_order', v)} /></ListItem>
                            <ListItem title="หลัก LAST รับมือข้อร้องเรียน">
                                <div className="mt-2 ml-1 border-l-2 border-gray-200 pl-3 space-y-1 text-sm text-gray-600 print:border-black print:text-black">
                                    <div><span className="font-bold text-gray-800 print:text-black">L-Listen:</span> รับฟังอย่างตั้งใจ</div>
                                    <div><span className="font-bold text-gray-800 print:text-black">A-Apologize:</span> กล่าวขอโทษด้วยความจริงใจ</div>
                                    <div><span className="font-bold text-gray-800 print:text-black">S-Solve:</span> เสนอทางแก้ไขทันที</div>
                                    <div><span className="font-bold text-gray-800 print:text-black">T-Thank:</span> ขอบคุณลูกค้าที่ช่วยติชม</div>
                                </div>
                            </ListItem>
                        </SubSection>
                    </Section>

                    {/* Section 5 */}
                    <Section number="5" title="มาตรฐานความสะอาดและการจัดการร้าน" icon={<Sparkles size={16}/>}>
                        <SubSection title="ความสะอาด (Clean as you go)">
                            <ListItem title="สเตชันบาร์"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec5_bar : data.sec5_bar} onChange={(v) => updateField('sec5_bar', v)} /></ListItem>
                            <ListItem title="หน้าร้าน"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec5_front : data.sec5_front} onChange={(v) => updateField('sec5_front', v)} /></ListItem>
                            <ListItem title="การจัดการขยะ"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec5_trash : data.sec5_trash} onChange={(v) => updateField('sec5_trash', v)} /></ListItem>
                        </SubSection>
                    </Section>

                    {/* Section 6 */}
                    <Section number="6" title="ระเบียบวินัยและบทลงโทษ" icon={<AlertTriangle size={16}/>}>
                        <SubSection title="ลำดับขั้นบทลงโทษ (Disciplinary Action)">
                            <ListItem title="ความผิดทั่วไป"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec6_general : data.sec6_general} onChange={(v) => updateField('sec6_general', v)} /></ListItem>
                            <ListItem title="ความผิดร้ายแรง"><InlineTextArea isEditing={isEditing} value={isEditing ? editData.sec6_severe : data.sec6_severe} onChange={(v) => updateField('sec6_severe', v)} /></ListItem>
                        </SubSection>
                    </Section>

                </div>
            </div>

            {/* Evaluation Form Component */}
            <div className="bg-white p-8 md:p-12 shadow-sm border border-gray-200 rounded-xl mt-8 print:shadow-none print:border-none print:p-0 print:rounded-none print:break-before-page">
                <div className="flex flex-col items-center border-b border-gray-200 pb-6 mb-6 print:border-black">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight print:text-black">แบบฟอร์มประเมินการปฏิบัติงาน</h2>
                    <p className="text-[13px] text-gray-500 mt-1 print:text-black">ส่วนที่ 7: Performance Evaluation Form</p>
                </div>
                
                <div className="overflow-x-auto pb-4">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="border-b border-gray-300 print:border-gray-800">
                                <th className="py-3 px-2 font-bold text-gray-800 text-[13px] print:text-black">หัวข้อการประเมิน</th>
                                <th className="py-3 px-2 text-center w-10 font-bold text-gray-500 text-[13px] print:text-black">5</th>
                                <th className="py-3 px-2 text-center w-10 font-bold text-gray-500 text-[13px] print:text-black">4</th>
                                <th className="py-3 px-2 text-center w-10 font-bold text-gray-500 text-[13px] print:text-black">3</th>
                                <th className="py-3 px-2 text-center w-10 font-bold text-gray-500 text-[13px] print:text-black">2</th>
                                <th className="py-3 px-2 text-center w-10 font-bold text-gray-500 text-[13px] print:text-black">1</th>
                            </tr>
                        </thead>
                        <tbody>
                            <EvaluationGroup title="1. ทักษะวิชาชีพและคุณภาพเครื่องดื่ม" />
                            <EvaluationRow title="1.1 การสกัดช็อต" desc="ตั้งค่าเครื่องบดแม่นยำ สกัดช็อตได้รสชาติและปริมาณตามมาตรฐานร้าน" />
                            <EvaluationRow title="1.2 การสตีมนม" desc="อุณหภูมินมถูกต้อง โฟมนมเนียนละเอียด เทลาเต้อาร์ตพื้นฐานได้" />
                            <EvaluationRow title="1.3 ความแม่นยำของสูตร" desc="ชงเครื่องดื่มได้รสชาติสม่ำเสมอ ไม่ลืมส่วนผสม ใส่ใจรายละเอียด" />
                            <EvaluationRow title="1.4 ความเร็วและความแม่นยำ" desc="จัดการออเดอร์ช่วงลูกค้าหนาแน่นได้รวดเร็ว ไม่ทำสลับคิว" />

                            <EvaluationGroup title="2. งานบริการและการขาย" />
                            <EvaluationRow title="2.1 การต้อนรับ" desc="ทักทายลูกค้าอย่างอบอุ่น สุภาพ ยิ้มแย้ม และมี Service Mind เสมอ" />
                            <EvaluationRow title="2.2 ความรู้เรื่องเมนู" desc="อธิบายคาแรคเตอร์เมล็ดกาแฟ ส่วนผสม และแนะนำเมนูให้ตรงใจลูกค้าได้" />
                            <EvaluationRow title="2.3 การเสนอขาย" desc="มีทักษะเสนอขายขนม เบเกอรี่ หรือสินค้าเพิ่มเติมได้อย่างเป็นธรรมชาติ" />
                            <EvaluationRow title="2.4 การแก้ปัญหา" desc="รับมือข้อร้องเรียนของลูกค้าได้อย่างสุภาพและเป็นมืออาชีพ" />

                            <EvaluationGroup title="3. การจัดการสเตชันและความสะอาด" />
                            <EvaluationRow title="3.1 Clean as you go" desc="เคาะกาก เช็ดหัวกรุ๊ป ล้างก้านนมทันที โต๊ะบาร์แห้งและสะอาดเสมอ" />
                        </tbody>
                    </table>
                </div>

                {/* Evaluation Conclusion Box */}
                <div className="mt-8 pt-8 border-t border-gray-200 print:border-black">
                    <h3 className="text-[15px] font-bold text-gray-900 mb-6 print:text-black">สรุปผลการประเมิน</h3>
                    
                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                        {/* Score Box */}
                        <div className="md:w-1/3 bg-gray-50 rounded-xl p-5 border border-gray-200 flex flex-col justify-center items-center print:bg-white print:border-black print:rounded-none">
                            <span className="text-[12px] font-bold text-gray-500 mb-1 print:text-black">คะแนนรวมที่ได้</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-gray-800 print:text-black">0</span> 
                                <span className="text-[13px] font-bold text-gray-500 print:text-black">/ 75</span>
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="md:w-2/3 flex gap-4">
                            <div className="w-1/2 flex flex-col">
                                <label className="text-[12px] font-bold text-gray-600 mb-1 print:text-black">จุดเด่นที่ควรชื่นชม</label>
                                <div className="flex-1 bg-white border border-gray-300 rounded-lg p-3 text-gray-400 text-[13px] print:border-black print:rounded-none">
                                    <span className="print:hidden">คลิกเพื่อพิมพ์ข้อความแสดงความคิดเห็น...</span>
                                </div>
                            </div>
                            <div className="w-1/2 flex flex-col">
                                <label className="text-[12px] font-bold text-gray-600 mb-1 print:text-black">จุดที่ต้องพัฒนา</label>
                                <div className="flex-1 bg-white border border-gray-300 rounded-lg p-3 text-gray-400 text-[13px] print:border-black print:rounded-none">
                                    <span className="print:hidden">คลิกเพื่อพิมพ์ข้อความแสดงความคิดเห็น...</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Final Result */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-wrap items-center gap-6 print:bg-white print:border-black print:rounded-none">
                        <span className="text-[13px] font-bold text-gray-800 print:text-black">ผลการประเมิน:</span>
                        <div className="flex items-center gap-5">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <div className="w-4 h-4 rounded-full border border-gray-400 print:border-black"></div>
                                <span className="text-[13px] text-gray-700 print:text-black">ผ่านเกณฑ์</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <div className="w-4 h-4 rounded-full border border-gray-400 print:border-black"></div>
                                <span className="text-[13px] text-gray-700 print:text-black">ขยายเวลาทดลองงาน</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <div className="w-4 h-4 rounded-full border border-gray-400 print:border-black"></div>
                                <span className="text-[13px] text-gray-700 print:text-black">ไม่ผ่านเกณฑ์</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Signature Area */}
                <div className="mt-16 mb-4 break-inside-avoid">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-56 border-b border-gray-400 mb-3 print:border-black"></div>
                            <p className="text-[13px] font-bold text-gray-800 print:text-black">พนักงานผู้รับการประเมิน</p>
                            <p className="text-[12px] text-gray-500 mt-3 flex items-center justify-center gap-2 print:text-black">
                                วันที่ <span className="border-b border-gray-300 w-24 inline-block print:border-black"></span>
                            </p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-56 border-b border-gray-400 mb-3 print:border-black"></div>
                            <p className="text-[13px] font-bold text-gray-800 print:text-black">ผู้จัดการร้าน / ผู้ประเมิน</p>
                            <p className="text-[12px] text-gray-500 mt-3 flex items-center justify-center gap-2 print:text-black">
                                วันที่ <span className="border-b border-gray-300 w-24 inline-block print:border-black"></span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { 
                        size: A4; 
                        margin: 0 !important; /* Removes browser headers and footers */
                    }
                    html, body {
                        background: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    /* Reset ALL ancestors to allow full page printing, but leave internal layout intact! */
                    html, body, #__next, div:not(.print-container):not(.print-container *) {
                        height: auto !important;
                        min-height: 0 !important;
                        max-height: none !important;
                        overflow: visible !important;
                        position: static !important;
                    }
                    /* Prevent text and containers from being sliced in half */
                    h1, h2, h3, h4, h5, p, li, .break-inside-avoid {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    .break-inside-avoid {
                        display: inline-block !important;
                        width: 100% !important;
                    }
                    body * { visibility: hidden; }
                    .print-container, .print-container * { visibility: visible; }
                    .print-container {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 15mm 20mm !important; /* Add padding to simulate margins since @page margin is 0 */
                        box-sizing: border-box !important;
                    }
                    .print\\:hidden { display: none !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:border-none { border: none !important; }
                    .print\\:bg-white { background-color: white !important; }
                    .print\\:bg-transparent { background-color: transparent !important; }
                    .print\\:text-black { color: #000 !important; }
                    .print\\:border-black { border-color: #000 !important; }
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
                className={`bg-blue-50 border-b-2 border-blue-400 focus:outline-none focus:border-blue-600 px-1 py-0.5 w-full text-center text-gray-900 transition-colors ${className}`} 
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
                className={`w-full bg-blue-50/50 border border-blue-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-800 resize-y transition-all ${className}`} 
            />
        );
    }
    return <span className={className}>{value}</span>;
}

// Subcomponents for View
function Section({ number, title, icon, children }: { number: string, title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <section className="mb-10 print:mb-8 section-container">
            <h3 className="text-[16px] font-bold text-gray-900 mb-4 print:text-black print:text-[18px]">
                <span className="text-gray-400 print:hidden mr-2 align-middle">{icon}</span>
                <span className="align-middle">หมวดที่ {number}: {title}</span>
            </h3>
            <div className="pl-6 space-y-6 print:pl-4 print:space-y-4">
                {children}
            </div>
        </section>
    );
}

function SubSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="subsection-container">
            <h4 className="text-[14px] font-bold text-gray-700 mb-3 pb-2 print:text-black print:text-[16px]">
                <span className="border-b border-dashed border-gray-300 pb-1 print:border-solid print:border-gray-800">{title}</span>
            </h4>
            <ul className="space-y-3 print:space-y-2">
                {children}
            </ul>
        </div>
    );
}

function ListItem({ title, children }: { title?: string, children: React.ReactNode }) {
    return (
        <li className="relative pl-4 text-[14px] leading-relaxed text-gray-600 print:text-black break-inside-avoid print:text-[14px] print:pl-5">
            <span className="absolute left-0 top-0 text-blue-500 font-bold print:text-black">-</span>
            <div className="w-full">
                {title && <span className="font-bold text-gray-800 mr-2 print:text-black">{title}:</span>}
                {children}
            </div>
        </li>
    );
}

function EvaluationGroup({ title }: { title: string }) {
    return (
        <tr>
            <td colSpan={6} className="py-4 px-2 font-bold text-[14px] text-gray-800 bg-gray-50 border-y border-gray-300 print:bg-gray-100 print:border-gray-400 print:text-black mt-4">
                {title}
            </td>
        </tr>
    );
}

function EvaluationRow({ title, desc }: { title: string, desc: string }) {
    return (
        <tr className="border-b border-gray-100 print:border-gray-300 break-inside-avoid hover:bg-gray-50 transition-colors">
            <td className="py-3 px-2">
                <div className="font-bold text-[13px] text-gray-700 print:text-black">{title}</div>
                <div className="text-[12px] text-gray-500 mt-1 print:text-gray-700">{desc}</div>
            </td>
            {[5,4,3,2,1].map(num => (
                <td key={num} className="py-3 px-2 text-center align-middle">
                    <div className="w-4 h-4 rounded-full border border-gray-400 mx-auto bg-white print:border-gray-600 print:border-[1.5px]"></div>
                </td>
            ))}
        </tr>
    );
}
