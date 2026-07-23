'use client';
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  Award, Star, TrendingUp, ChevronRight
} from 'lucide-react'
import { useI18n } from "@/lib/I18nContext";

export default function StaffDevelopmentPage() {
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = useState<'training' | 'evaluations'>('evaluations');
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyData();
  }, []);

  const fetchMyData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const userId = userData.user.id;
      
      const [evalRes, trainRes] = await Promise.all([
        supabase.from('pos_staff_evaluations').select('*, profiles!evaluator_id(display_name)').eq('staff_id', userId).order('period_year', { ascending: false }).order('period_month', { ascending: false }),
        supabase.from('pos_staff_training_logs').select('*, pos_staff_skills(name, level, category)').eq('staff_id', userId).order('created_at', { ascending: false })
      ]);

      if (evalRes.data) setEvaluations(evalRes.data);
      if (trainRes.data) setTrainings(trainRes.data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-4 sm:p-10 font-bold">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3A5A40]">My Career</div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-black">ผลการประเมินและทักษะ</h1>
            <p className="text-[12px] text-gray-400 font-bold">ดูผลคะแนนการทำงานของคุณ และประวัติการฝึกอบรม</p>
          </div>
        </header>

        {/* TABS */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <button 
            onClick={() => setActiveTab('evaluations')}
            className={`px-6 py-4 flex items-center gap-3 text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'evaluations' ? 'bg-black text-white' : 'bg-white text-gray-400 border border-gray-200 hover:border-black'}`}
          >
            <TrendingUp size={18} /> ผลการประเมิน (KPI)
          </button>
          <button 
            onClick={() => setActiveTab('training')}
            className={`px-6 py-4 flex items-center gap-3 text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'training' ? 'bg-black text-white' : 'bg-white text-gray-400 border border-gray-200 hover:border-black'}`}
          >
            <Award size={18} /> ประวัติการฝึกอบรม
          </button>
        </div>

        {/* CONTENT */}
        {loading ? (
           <div className="p-20 text-center text-gray-400 text-sm font-black uppercase">Loading...</div>
        ) : (
          <div className="bg-white border border-gray-100 shadow-xl overflow-hidden min-h-[400px]">
            {activeTab === 'evaluations' && (
              <div className="p-8">
                <h2 className="text-xl font-black mb-8">ประเมินผลรายเดือน (Monthly Evaluations)</h2>
                {evaluations.length === 0 ? (
                  <div className="text-center text-gray-400 py-10">
                    <Star className="mx-auto mb-4 opacity-20" size={48} />
                    <p className="text-sm font-black uppercase tracking-widest">ยังไม่มีข้อมูลการประเมินผล</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {evaluations.map(ev => (
                      <div key={ev.id} className="border border-gray-100 p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between hover:border-black transition-colors">
                        <div>
                          <div className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">
                            เดือน {ev.period_month} / {ev.period_year}
                          </div>
                          <div className="text-2xl font-black text-[#3A5A40]">คะแนนรวม: {ev.overall_score}/10</div>
                          <div className="text-xs text-gray-500 mt-2 line-clamp-2">{ev.feedback || 'ไม่มีข้อเสนอแนะ'}</div>
                          <div className="text-[10px] mt-4 font-bold text-gray-400 uppercase">ประเมินโดย: {ev.profiles?.display_name || 'ผู้จัดการ'}</div>
                        </div>
                        <div className="flex gap-4">
                          <div className="bg-gray-50 p-4 text-center min-w-[80px]">
                            <div className="text-xl font-black">{ev.sales_performance_score || '-'}</div>
                            <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-1">ยอดขาย</div>
                          </div>
                          <div className="bg-gray-50 p-4 text-center min-w-[80px]">
                            <div className="text-xl font-black">{ev.customer_rating_score || '-'}</div>
                            <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-1">รีวิวลูกค้า</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'training' && (
              <div className="p-8">
                <h2 className="text-xl font-black mb-8">ทักษะที่ผ่านการอบรม (My Skills)</h2>
                {trainings.length === 0 ? (
                  <div className="text-center text-gray-400 py-10">
                    <Award className="mx-auto mb-4 opacity-20" size={48} />
                    <p className="text-sm font-black uppercase tracking-widest">ยังไม่มีประวัติการฝึกอบรม</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trainings.map(t => (
                      <div key={t.id} className="border border-gray-100 p-5 flex items-start gap-4 hover:border-black transition-colors">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${t.status === 'completed' ? 'bg-[#3A5A40] text-white' : 'bg-amber-100 text-amber-600'}`}>
                          <Award size={20} />
                        </div>
                        <div>
                          <div className="font-black text-black">{t.pos_staff_skills?.name || 'Unknown Skill'}</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1 mb-2">
                            {t.pos_staff_skills?.category} • {t.pos_staff_skills?.level}
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 ${t.status === 'completed' ? 'bg-green-100 text-green-700' : t.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
