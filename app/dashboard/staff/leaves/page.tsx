'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';

interface StaffLeave {
  id: string;
  leave_date: string;
  leave_type: string;
  reason?: string;
  is_paid?: boolean;
}

export default function LeavesHistoryPage() {
  const { profile } = useAuth();
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [approvedHolidaysCount, setApprovedHolidaysCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const monthLabel = currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

  useEffect(() => {
    if (!profile?.id) return;

    const fetchLeaves = async () => {
      setLoading(true);
      try {
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

        const { data, error } = await supabase
          .from('staff_leaves')
          .select('*')
          .eq('profile_id', profile.id)
          .gte('leave_date', firstDay)
          .lte('leave_date', lastDay)
          .order('leave_date', { ascending: false });

        
        const currentYear = new Date().getFullYear();
        const { count } = await supabase
            .from('attendance_logs')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profile.id)
            .in('holiday_pay_status', ['approved_pay', 'approved_dayoff'])
            .gte('timestamp', `${currentYear}-01-01`)
            .lte('timestamp', `${currentYear}-12-31`);
        setApprovedHolidaysCount(count || 0);

        if (!error && data) {
          setLeaves(data);
        }
      } catch (err) {
        console.error('Error fetching leaves:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, [profile?.id, currentDate]);

  const leaveTypeLabel = (type: string) => {
    switch (type) {
      case 'sick': return '🤒 ลาป่วย';
      case 'personal': return '📝 ลากิจ';
      case 'vacation': return '🏖️ ลาพักร้อน';
      default: return '📋 ลางาน';
    }
  };

  const leaveTypeColor = (type: string) => {
    switch (type) {
      case 'sick': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'personal': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'vacation': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[800px] mx-auto min-h-screen pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link 
          href="/dashboard/staff" 
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">ประวัติการลาหยุด</h1>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
            รายละเอียดการใช้วันลา และวันหยุดต่างๆ
          </p>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white rounded-full p-1 border border-gray-200/60 shadow-xs mb-6 w-fit mx-auto">
        <button 
          onClick={prevMonth}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 active:scale-95 transition-all text-gray-500"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <span className="px-6 text-sm font-bold text-gray-900 min-w-[140px] text-center">
          {monthLabel}
        </span>
        <button 
          onClick={nextMonth}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 active:scale-95 transition-all text-gray-500"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      
      {/* Quota Usage Summary */}
      {!loading && profile && (
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
                { label: 'ลาป่วย', used: leaves.filter(l => l.leave_type === 'sick').length, quota: (profile as any)?.quota_sick_leave ?? 30, color: 'text-rose-600', bg: 'bg-rose-50' },
                { label: 'ลากิจ', used: leaves.filter(l => l.leave_type === 'personal').length, quota: (profile as any)?.quota_personal_leave ?? 3, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'ลาพักร้อน', used: leaves.filter(l => l.leave_type === 'vacation').length, quota: (profile as any)?.quota_annual_leave ?? 6, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'นักขัตฤกษ์', used: leaves.filter(l => l.leave_type === 'public_holiday').length, quota: (profile as any)?.accrued_holiday_days ?? 0, isDynamicQuota: true, color: 'text-pink-600', bg: 'bg-pink-50' },
            ].map(q => (
                <div key={q.label} className={`flex flex-col p-3 rounded-xl border ${q.quota === 0 ? 'bg-gray-50/50 border-gray-100 opacity-60 grayscale' : 'bg-gray-50 border-gray-100'}`}>
                    <span className="text-[10px] font-bold text-gray-500">
                        {q.label} {q.isDynamicQuota ? `(สะสมใช้ได้ ${q.quota} วัน)` : (q.quota === 0 ? <span className="text-gray-400">(ยังไม่ได้รับสิทธิ์)</span> : `(เหลือ ${q.quota - q.used} วัน)`)}
                    </span>
                    <div className="mt-1 flex items-end justify-between">
                        <span className={`text-xl font-black ${q.quota === 0 && !q.isDynamicQuota ? 'text-gray-400' : q.used >= q.quota && q.quota > 0 && !q.isDynamicQuota ? 'text-red-600' : 'text-gray-900'}`}>
                            {q.quota === 0 && !q.isDynamicQuota ? '-' : (q.isDynamicQuota ? q.quota : q.used)}
                        </span>
                        {!q.isDynamicQuota && q.quota > 0 && <span className="text-xs font-bold text-gray-400 mb-0.5">/ {q.quota}</span>}
                    </div>

                    {!q.isDynamicQuota && q.quota > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div className={`h-1.5 rounded-full ${q.used >= q.quota ? 'bg-red-500' : 'bg-gray-900'}`} style={{ width: `${Math.min(100, (q.used / q.quota) * 100)}%` }}></div>
                        </div>
                    )}
                </div>
            ))}
        </div>
      )}

      <div className="bg-white rounded-[24px] border border-gray-200/60 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
            <CalendarDaysIcon className="w-12 h-12 mb-3 text-gray-200" />
            <p className="font-medium text-sm">ยังไม่มีประวัติการลางาน</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {leaves.map((leave) => {
              const dateObj = new Date(leave.leave_date);
              const formattedDate = dateObj.toLocaleDateString('th-TH', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });

              return (
                <div key={leave.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#1A1A18] text-sm mb-1">{formattedDate}</div>
                    <div className="text-[11px] text-gray-500 truncate max-w-[200px] sm:max-w-[400px]">
                      {leave.reason || 'ไม่ได้ระบุเหตุผล'}
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${leaveTypeColor(leave.leave_type)}`}>
                    {leaveTypeLabel(leave.leave_type)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
