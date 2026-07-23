'use client';
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  BookOpen, Star, TrendingUp, Users, Plus, 
  CheckCircle2, XCircle, FileText
} from 'lucide-react'
import { useI18n } from "@/lib/I18nContext";

export default function AdminDevelopmentPage() {
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = useState<'skills' | 'training' | 'evaluations'>('skills');
  const [skills, setSkills] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', description: '', level: 'Beginner', category: 'Barista' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [skillsRes, staffRes] = await Promise.all([
      supabase.from('pos_staff_skills').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, display_name, staff_code, role').eq('role', 'staff')
    ]);

    if (skillsRes.data) setSkills(skillsRes.data);
    if (staffRes.data) setStaff(staffRes.data);
    setLoading(false);
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('pos_staff_skills').insert([newSkill]).select().single();
    if (data) {
      setSkills([data, ...skills]);
      setShowAddSkill(false);
      setNewSkill({ name: '', description: '', level: 'Beginner', category: 'Barista' });
    } else {
      alert('Failed to add skill: ' + error?.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-4 sm:p-10 font-bold">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3A5A40]">Staff Development</div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-black">การพัฒนาพนักงาน & KPI</h1>
            <p className="text-[12px] text-gray-400 font-bold">จัดการคลังทักษะ มอบหมายการอบรม และประเมินผลการทำงาน</p>
          </div>
        </header>

        {/* TABS */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <button 
            onClick={() => setActiveTab('skills')}
            className={`px-6 py-4 flex items-center gap-3 text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'skills' ? 'bg-black text-white' : 'bg-white text-gray-400 border border-gray-200 hover:border-black'}`}
          >
            <BookOpen size={18} /> คลังทักษะ (Skills)
          </button>
          <button 
            onClick={() => setActiveTab('training')}
            className={`px-6 py-4 flex items-center gap-3 text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'training' ? 'bg-black text-white' : 'bg-white text-gray-400 border border-gray-200 hover:border-black'}`}
          >
            <Star size={18} /> ประวัติการฝึกอบรม
          </button>
          <button 
            onClick={() => setActiveTab('evaluations')}
            className={`px-6 py-4 flex items-center gap-3 text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'evaluations' ? 'bg-black text-white' : 'bg-white text-gray-400 border border-gray-200 hover:border-black'}`}
          >
            <TrendingUp size={18} /> ประเมินผล (KPI)
          </button>
        </div>

        {/* CONTENT */}
        {loading ? (
           <div className="p-20 text-center text-gray-400 text-sm font-black uppercase">Loading...</div>
        ) : (
          <div className="bg-white border border-gray-100 shadow-xl overflow-hidden min-h-[400px]">
            {activeTab === 'skills' && (
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-black">คลังทักษะ (Skill Library)</h2>
                  <button 
                    onClick={() => setShowAddSkill(!showAddSkill)}
                    className="bg-black text-white px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                  >
                    {showAddSkill ? 'ยกเลิก' : <><Plus size={14} /> เพิ่มทักษะใหม่</>}
                  </button>
                </div>

                {showAddSkill && (
                  <form onSubmit={handleAddSkill} className="mb-8 bg-gray-50 p-6 border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">ชื่อทักษะ (Name)</label>
                      <input type="text" required value={newSkill.name} onChange={e => setNewSkill({...newSkill, name: e.target.value})} className="w-full p-3 border border-gray-200 font-bold text-sm outline-none focus:border-black" placeholder="เช่น Basic Barista" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">หมวดหมู่ (Category)</label>
                      <input type="text" value={newSkill.category} onChange={e => setNewSkill({...newSkill, category: e.target.value})} className="w-full p-3 border border-gray-200 font-bold text-sm outline-none focus:border-black" placeholder="เช่น Barista, Service" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">รายละเอียด (Description)</label>
                      <textarea value={newSkill.description} onChange={e => setNewSkill({...newSkill, description: e.target.value})} className="w-full p-3 border border-gray-200 font-bold text-sm outline-none focus:border-black" rows={2} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">ระดับ (Level)</label>
                      <select value={newSkill.level} onChange={e => setNewSkill({...newSkill, level: e.target.value})} className="w-full p-3 border border-gray-200 font-bold text-sm outline-none focus:border-black">
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 mt-2">
                      <button type="submit" className="bg-[#3A5A40] text-white px-6 py-3 text-[11px] font-black uppercase tracking-widest hover:bg-black transition-colors">บันทึกข้อมูล</button>
                    </div>
                  </form>
                )}

                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <th className="py-4">ชื่อทักษะ / รายละเอียด</th>
                      <th className="py-4">หมวดหมู่</th>
                      <th className="py-4">ระดับ</th>
                      <th className="py-4 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {skills.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-400 text-sm">ยังไม่มีข้อมูลทักษะ</td></tr>}
                    {skills.map(skill => (
                      <tr key={skill.id} className="hover:bg-gray-50/50">
                        <td className="py-4">
                          <div className="font-black text-black text-sm">{skill.name}</div>
                          <div className="text-[11px] text-gray-400 mt-1">{skill.description || '-'}</div>
                        </td>
                        <td className="py-4 text-xs font-bold text-gray-600">{skill.category}</td>
                        <td className="py-4">
                          <span className="bg-gray-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest">{skill.level}</span>
                        </td>
                        <td className="py-4 text-right">
                          <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">แก้ไข</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'training' && (
              <div className="p-8">
                <div className="text-center text-gray-400 py-20">
                  <BookOpen className="mx-auto mb-4 opacity-20" size={64} />
                  <p className="text-sm font-black uppercase tracking-widest">ฟีเจอร์นี้อยู่ระหว่างการพัฒนา UI</p>
                  <p className="text-xs mt-2">คุณสามารถเพิ่มข้อมูลผ่านฐานข้อมูลได้โดยตรง (ตาราง pos_staff_training_logs)</p>
                </div>
              </div>
            )}

            {activeTab === 'evaluations' && (
              <div className="p-8">
                <div className="text-center text-gray-400 py-20">
                  <TrendingUp className="mx-auto mb-4 opacity-20" size={64} />
                  <p className="text-sm font-black uppercase tracking-widest">ฟีเจอร์นี้อยู่ระหว่างการพัฒนา UI</p>
                  <p className="text-xs mt-2">คุณสามารถเพิ่มข้อมูลผ่านฐานข้อมูลได้โดยตรง (ตาราง pos_staff_evaluations)</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
