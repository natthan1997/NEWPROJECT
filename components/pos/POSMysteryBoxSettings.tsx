'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, Save, Plus, Trash2, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface Prize {
    id: number;
    name: string;
    type: string;
    value: number;
    probability: number;
}

export default function POSMysteryBoxSettings({ onClose, shopId }: { onClose: () => void, shopId: string }) {
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, [shopId]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('pos_shop_settings')
                .select('mystery_box_config')
                .eq('id', shopId)
                .single();

            if (error) throw error;
            
            if (data?.mystery_box_config && Array.isArray(data.mystery_box_config)) {
                setPrizes(data.mystery_box_config);
            } else {
                // Default fallback
                setPrizes([
                    { id: 1, name: '500 คะแนน', type: 'points', value: 500, probability: 5 },
                    { id: 2, name: '100 คะแนน', type: 'points', value: 100, probability: 10 },
                    { id: 3, name: '50 คะแนน', type: 'points', value: 50, probability: 25 },
                    { id: 4, name: '20 คะแนน', type: 'points', value: 20, probability: 60 }
                ]);
            }
        } catch (err: any) {
            console.error('Error fetching mystery box config:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        
        // Validate probability sums to 100
        const totalProb = prizes.reduce((sum, p) => sum + Number(p.probability), 0);
        if (totalProb !== 100) {
            setError(`รวมโอกาสออกต้องได้ 100% (ปัจจุบัน ${totalProb}%)`);
            setSaving(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('pos_shop_settings')
                .update({ mystery_box_config: prizes })
                .eq('id', shopId);

            if (error) throw error;
            onClose();
        } catch (err: any) {
            console.error('Error saving mystery box config:', err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const addPrize = () => {
        const newId = prizes.length > 0 ? Math.max(...prizes.map(p => p.id)) + 1 : 1;
        setPrizes([...prizes, { id: newId, name: '', type: 'points', value: 0, probability: 0 }]);
    };

    const updatePrize = (id: number, field: keyof Prize, value: any) => {
        setPrizes(prizes.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const removePrize = (id: number) => {
        setPrizes(prizes.filter(p => p.id !== id));
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 overflow-hidden relative">
            <header className="p-6 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h2 className="text-[16px] font-bold text-gray-900">ตั้งค่ากล่องสุ่ม (Mystery Box)</h2>
                        <p className="text-[12px] text-gray-500">กำหนดของรางวัลและโอกาสสุ่มออก (รวมต้องได้ 100%)</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-start gap-3 text-[13px] font-medium">
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <div>{error}</div>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 text-[14px]">รายการของรางวัล</h3>
                                <button onClick={addPrize} className="flex items-center gap-1 text-[12px] font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                    <Plus size={14} /> เพิ่มรางวัล
                                </button>
                            </div>
                            
                            <div className="divide-y divide-gray-100">
                                {prizes.map((prize, idx) => (
                                    <div key={prize.id} className="p-4 flex gap-4 items-center">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                                            {idx + 1}
                                        </div>
                                        
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">ชื่อรางวัล (แสดงให้ลูกค้าเห็น)</label>
                                                <input 
                                                    type="text" 
                                                    value={prize.name} 
                                                    onChange={e => updatePrize(prize.id, 'name', e.target.value)}
                                                    placeholder="เช่น 100 คะแนน"
                                                    className="w-full h-10 border border-gray-200 rounded-xl px-3 text-[13px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">คะแนนที่จะแจก</label>
                                                <input 
                                                    type="number" 
                                                    value={prize.value} 
                                                    onChange={e => updatePrize(prize.id, 'value', Number(e.target.value))}
                                                    className="w-full h-10 border border-gray-200 rounded-xl px-3 text-[13px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">โอกาสสุ่มออก (%)</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        value={prize.probability} 
                                                        onChange={e => updatePrize(prize.id, 'probability', Number(e.target.value))}
                                                        className="w-full h-10 border border-gray-200 rounded-xl pl-3 pr-8 text-[13px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]">%</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button onClick={() => removePrize(prize.id)} className="w-10 h-10 shrink-0 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                
                                {prizes.length === 0 && (
                                    <div className="p-8 text-center text-gray-400 text-[13px]">
                                        ยังไม่มีรายการของรางวัล กดปุ่ม "เพิ่มรางวัล" ด้านบน
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[13px] font-bold">
                                <div>รวมโอกาสออก:</div>
                                <div className={`${prizes.reduce((sum, p) => sum + Number(p.probability), 0) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                                    {prizes.reduce((sum, p) => sum + Number(p.probability), 0)}%
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button 
                                onClick={handleSave} 
                                disabled={saving}
                                className="h-12 px-8 bg-[#1A1A18] text-white rounded-xl text-[14px] font-bold tracking-wide hover:bg-black transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                บันทึกการตั้งค่า
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
