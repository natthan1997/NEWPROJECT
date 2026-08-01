'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { ChevronLeftIcon, GiftIcon } from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';

interface HolidayLog {
  id: string;
  timestamp: string;
  holiday_pay_status: string;
}

export default function HolidayCompensationPage() {
  const { profile } = useAuth();
  const [holidayLogs, setHolidayLogs] = useState<HolidayLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchHolidayLogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('attendance_logs')
          .select('id, timestamp, holiday_pay_status')
          .eq('profile_id', profile.id)
          .eq('type', 'check_in')
          .in('holiday_pay_status', ['approved_pay', 'approved_dayoff'])
          .order('timestamp', { ascending: false });

        if (!error && data) {
          setHolidayLogs(data as HolidayLog[]);
        }
      } catch (err) {
        console.error('Error fetching holiday logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHolidayLogs();
  }, [profile?.id]);

  const activeProfile = profile; // Using just profile for now
  const salaryType = activeProfile?.salary_type || 'daily';
  const dailyWage = Number(activeProfile?.daily_wage || 0);
  const holidayPayRate = salaryType === 'monthly' ? (dailyWage / 30) : dailyWage;

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
          <h1 className="text-xl font-bold text-gray-900 leading-tight">ชดเชยนักขัตฤกษ์</h1>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
            ประวัติการมาทำงานในวันหยุดนักขัตฤกษ์
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-gray-200/60 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : holidayLogs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
            <GiftIcon className="w-12 h-12 mb-3 text-gray-200" />
            <p className="font-medium text-sm">ยังไม่มีประวัติการมาทำงานในวันหยุด</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {holidayLogs.map((log) => {
              const dateObj = new Date(log.timestamp);
              const formattedDate = dateObj.toLocaleDateString('th-TH', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });
              
              const isPay = log.holiday_pay_status === 'approved_pay';

              return (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#1A1A18] text-sm mb-1">{formattedDate}</div>
                    <div className="text-[11px] text-gray-500">
                      ทำงานในวันหยุดนักขัตฤกษ์
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    {isPay ? (
                      <>
                        <div className="text-sm font-bold text-emerald-600">+{holidayPayRate.toLocaleString()} ฿</div>
                        <div className="text-[10px] text-emerald-600/70 font-medium bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-100">รับเป็นเงินชดเชย</div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-bold text-purple-600">+1 วันหยุด</div>
                        <div className="text-[10px] text-purple-600/70 font-medium bg-purple-50 px-2 py-0.5 rounded-full mt-1 border border-purple-100">รับเป็นวันหยุดชดเชย</div>
                      </>
                    )}
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
