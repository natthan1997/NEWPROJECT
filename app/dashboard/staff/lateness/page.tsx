'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { ChevronLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';

interface LateLog {
  id: string;
  timestamp: string;
  late_minutes: number;
  shift_start: string;
}

export default function LatenessHistoryPage() {
  const { profile } = useAuth();
  const [lateLogs, setLateLogs] = useState<LateLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchLateLogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('attendance_logs')
          .select('id, timestamp, profiles(shift_start)')
          .eq('profile_id', profile.id)
          .eq('type', 'check_in')
          .order('timestamp', { ascending: false });

        if (!error && data) {
          // Process and filter late logs
          const processedLogs: LateLog[] = [];
          
          for (const log of data) {
            const shiftStart = (log.profiles as any)?.shift_start || "08:30";
            const [sHour, sMin] = shiftStart.split(':').map(Number);
            const checkInDate = new Date(log.timestamp);
            const checkInMins = checkInDate.getHours() * 60 + checkInDate.getMinutes();
            const targetMins = (sHour || 8) * 60 + (sMin || 30);
            const gracePeriod = 10;
            
            if (checkInMins > targetMins + gracePeriod) {
              processedLogs.push({
                id: log.id,
                timestamp: log.timestamp,
                shift_start: shiftStart,
                late_minutes: checkInMins - targetMins
              });
            }
          }
          
          setLateLogs(processedLogs);
        }
      } catch (err) {
        console.error('Error fetching lateness logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLateLogs();
  }, [profile?.id]);

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
          <h1 className="text-xl font-bold text-gray-900 leading-tight">ประวัติมาสาย</h1>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
            รายการวันที่คุณลงเวลาเข้างานล่าช้ากว่ากำหนด
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-gray-200/60 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : lateLogs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
            <div className="w-12 h-12 mb-3 bg-gray-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎉</span>
            </div>
            <p className="font-medium text-sm text-gray-900">ยอดเยี่ยมมาก!</p>
            <p className="text-[11px] text-gray-500 mt-1">คุณไม่มีประวัติการมาสายเลย</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {lateLogs.map((log) => {
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

              return (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                      <ExclamationTriangleIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[#1A1A18] text-sm mb-0.5">{formattedDate}</div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-2">
                        <span>เวลาเข้างาน: {log.shift_start} น.</span>
                        <span className="text-gray-300">|</span>
                        <span>ลงเวลาจริง: {formattedTime} น.</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="text-sm font-bold text-amber-600">มาสาย</div>
                    <div className="text-[10px] text-amber-600/70 font-medium">{log.late_minutes} นาที</div>
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
