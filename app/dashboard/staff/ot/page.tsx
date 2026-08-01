'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { ChevronLeftIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';

interface OTLog {
  id: string;
  timestamp: string;
  ot_approved_minutes: number;
}

export default function OTHistoryPage() {
  const { profile } = useAuth();
  const [otLogs, setOtLogs] = useState<OTLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchOTLogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('attendance_logs')
          .select('id, timestamp, ot_approved_minutes')
          .eq('profile_id', profile.id)
          .eq('type', 'check_out')
          .eq('ot_status', 'approved')
          .order('timestamp', { ascending: false });

        if (!error && data) {
          setOtLogs(data as OTLog[]);
        }
      } catch (err) {
        console.error('Error fetching OT logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOTLogs();
  }, [profile?.id]);

  const otRate = Number(profile?.overtime_rate_per_hour || 0);

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
          <h1 className="text-xl font-bold text-gray-900 leading-tight">ประวัติล่วงเวลา (OT)</h1>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
            รายการวันที่ได้รับการอนุมัติค่าล่วงเวลาแล้ว
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-gray-200/60 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : otLogs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
            <ClockIcon className="w-12 h-12 mb-3 text-gray-200" />
            <p className="font-medium text-sm">ยังไม่มีประวัติการทำ OT ที่อนุมัติแล้ว</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {otLogs.map((log) => {
              const dateObj = new Date(log.timestamp);
              const formattedDate = dateObj.toLocaleDateString('th-TH', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });
              const formattedTime = dateObj.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
              });

              const hours = (log.ot_approved_minutes || 0) / 60;
              const pay = hours * otRate;

              return (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#1A1A18] text-sm mb-1">{formattedDate}</div>
                    <div className="text-[11px] text-gray-500">
                      ลงเวลาออก: {formattedTime} น.
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="text-sm font-bold text-emerald-600">+{pay.toLocaleString()} ฿</div>
                    <div className="text-[10px] text-gray-400 font-medium">{hours.toFixed(1)} ชั่วโมง</div>
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
