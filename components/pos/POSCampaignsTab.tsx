import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, GripVertical } from 'lucide-react';
import { useI18n } from '@/lib/I18nContext';
import { supabase } from '@/lib/supabaseClient';

export default function POSCampaignsTab() {
    const { locale } = useI18n();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('/api/pos/campaigns');
            const { data, error } = await res.json();
            if (error) {
                console.error('API error:', error);
                setErrorMsg(error);
            } else if (data) {
                setCampaigns(data);
                setErrorMsg(null);
            }
        } catch (error: any) {
            console.error('Fetch campaigns exception:', error);
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        setIsSaving(true);
        try {
            const newCampaign = {
                title: 'แคมเปญใหม่',
                description: 'รายละเอียดแคมเปญ',
                icon: '🎉',
                type_tag: 'NEW',
                bg_gradient_from: 'from-[#1A1A18]',
                bg_gradient_to: 'to-gray-800',
                text_color: 'text-white',
                tag_color: 'text-white',
                is_active: true,
                sort_order: campaigns.length + 1
            };
            
            const res = await fetch('/api/pos/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCampaign)
            });
            const { data, error } = await res.json();
            if (error) throw new Error(error);
            if (data) {
                setCampaigns([...campaigns, data]);
                handleEdit(data);
            }
        } catch (error: any) {
            alert('Error adding campaign: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ยืนยันการลบแคมเปญนี้?')) return;
        try {
            const res = await fetch(`/api/pos/campaigns?id=${id}`, { method: 'DELETE' });
            const { error } = await res.json();
            if (error) throw new Error(error);
            setCampaigns(campaigns.filter(c => c.id !== id));
        } catch (error: any) {
            alert('Error deleting campaign: ' + error.message);
        }
    };

    const handleEdit = (campaign: any) => {
        setEditingId(campaign.id);
        setEditForm(campaign);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/pos/campaigns', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            const { error } = await res.json();
            if (error) throw new Error(error);
            setCampaigns(campaigns.map(c => c.id === editForm.id ? editForm : c));
            setEditingId(null);
        } catch (error: any) {
            alert('Error saving campaign: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500 font-bold">กำลังโหลดแคมเปญ...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-black mb-2">การ์ดแคมเปญหน้าแอป (Campaigns)</h3>
                        <p className="text-[12px] text-gray-500 font-bold">จัดการการ์ดกิจกรรมหรือแคมเปญที่จะแสดงในหน้าสมาชิกลูกค้า (LIFF)</p>
                    </div>
                    <button 
                        onClick={handleAdd}
                        disabled={isSaving}
                        className="bg-[#1A1A18] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-colors"
                    >
                        <Plus size={18} /> เพิ่มแคมเปญ
                    </button>
                </div>

                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl font-bold border border-red-100">
                        เกิดข้อผิดพลาดในการโหลดข้อมูล: {errorMsg}
                    </div>
                )}

                <div className="space-y-4">
                    {campaigns.map((campaign, idx) => (
                        <div key={campaign.id} className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
                            {editingId === campaign.id ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">หัวข้อ (Title)</label>
                                            <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 font-bold outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">รายละเอียด (Description)</label>
                                            <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 font-bold outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">แท็ก (Type Tag)</label>
                                            <input type="text" value={editForm.type_tag} onChange={e => setEditForm({...editForm, type_tag: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 font-bold outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">ไอคอน (Emoji/Text)</label>
                                            <input type="text" value={editForm.icon} onChange={e => setEditForm({...editForm, icon: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 font-bold outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">ลำดับ (Sort Order)</label>
                                            <input type="number" value={editForm.sort_order} onChange={e => setEditForm({...editForm, sort_order: parseInt(e.target.value)||0})} className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 font-bold outline-none" />
                                        </div>
                                        <div className="flex items-center gap-2 mt-6">
                                            <input type="checkbox" id={`active-${campaign.id}`} checked={editForm.is_active} onChange={e => setEditForm({...editForm, is_active: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black" />
                                            <label htmlFor={`active-${campaign.id}`} className="font-bold text-[14px]">เปิดใช้งาน</label>
                                        </div>
                                    </div>

                                    {/* Color Settings */}
                                    <div className="p-4 bg-white rounded-xl border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">สีพื้นหลัง 1 (Tailwind)</label>
                                            <input type="text" value={editForm.bg_gradient_from} onChange={e => setEditForm({...editForm, bg_gradient_from: e.target.value})} placeholder="from-[#1A1A18]" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-[12px] font-mono outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">สีพื้นหลัง 2 (Tailwind)</label>
                                            <input type="text" value={editForm.bg_gradient_to} onChange={e => setEditForm({...editForm, bg_gradient_to: e.target.value})} placeholder="to-gray-800" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-[12px] font-mono outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">สีตัวอักษร (Tailwind)</label>
                                            <input type="text" value={editForm.text_color} onChange={e => setEditForm({...editForm, text_color: e.target.value})} placeholder="text-white" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-[12px] font-mono outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">สีแท็ก (Tailwind)</label>
                                            <input type="text" value={editForm.tag_color} onChange={e => setEditForm({...editForm, tag_color: e.target.value})} placeholder="text-white" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-[12px] font-mono outline-none" />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                        <button onClick={() => setEditingId(null)} className="px-5 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">ยกเลิก</button>
                                        <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-colors"><Save size={16} /> บันทึก</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                                    <div className="flex items-center gap-5 w-full">
                                        <div className="text-gray-400 cursor-move hidden sm:block"><GripVertical size={20} /></div>
                                        <div className={`w-16 h-16 rounded-xl shrink-0 flex items-center justify-center text-3xl bg-gradient-to-br ${campaign.bg_gradient_from} ${campaign.bg_gradient_to} shadow-sm`}>
                                            {campaign.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-black text-gray-900 truncate">{campaign.title}</h4>
                                                {!campaign.is_active && <span className="bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">ปิดใช้งาน</span>}
                                            </div>
                                            <p className="text-[12px] text-gray-500 truncate">{campaign.description}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-[11px] font-bold text-gray-400 uppercase">Tag: {campaign.type_tag}</span>
                                                <span className="text-[11px] font-bold text-gray-400 uppercase">Order: {campaign.sort_order}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                                        <button onClick={() => handleEdit(campaign)} className="p-2 text-gray-400 hover:text-[#1A1A18] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"><Edit2 size={18} /></button>
                                        <button onClick={() => handleDelete(campaign.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {campaigns.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
                            <p className="text-gray-400 font-bold mb-4">ยังไม่มีแคมเปญในระบบ</p>
                            <button onClick={handleAdd} className="bg-white border border-gray-200 text-gray-600 px-5 py-2 rounded-xl font-bold inline-flex items-center gap-2 hover:border-[#1A1A18] hover:text-[#1A1A18] transition-colors"><Plus size={16} /> สร้างแคมเปญแรก</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
