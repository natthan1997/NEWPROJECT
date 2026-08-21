'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  ShieldCheck, AlertTriangle, CheckCircle, Loader2, 
  ArrowRight, Landmark, Briefcase, MapPin, LogIn, UserPlus 
} from 'lucide-react';

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    checkUser();
    if (token) {
      fetchInviteDetails();
    } else {
      setError('ไม่พบลิงก์คำเชิญเข้าร่วมร้าน หรือลิงก์ไม่ถูกต้อง');
      setLoading(false);
    }
  }, [token]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    if (user?.user_metadata) {
      setDisplayName(user.user_metadata.display_name || user.user_metadata.full_name || user.user_metadata.name || '');
    }
  };

  const fetchInviteDetails = async () => {
    try {
      setLoading(true);
      // Fetch details from the public table. Since SELECT policy is true, anyone can fetch this
      const { data, error: fetchErr } = await supabase
        .from('pos_staff_invites')
        .select('*, pos_merchants(name)')
        .eq('token', token)
        .maybeSingle();

      if (fetchErr || !data) {
        setError('ลิงก์คำเชิญไม่ถูกต้อง หรือไม่พบข้อมูลในระบบ');
        return;
      }

      if (data.accepted_at) {
        setError('คำเชิญนี้ถูกใช้งานเพื่อยืนยันบัญชีอื่นไปแล้ว');
        return;
      }

      if (new Date(data.expires_at).getTime() < Date.now()) {
        setError('ลิงก์คำเชิญหมดอายุแล้ว (ลิงก์มีอายุ 7 วันหลังจากสร้าง)');
        return;
      }

      setInvite(data);
    } catch (err: any) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!currentUser) {
      // If not logged in, redirect to login page with callback URL
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (!displayName.trim()) {
      return alert('กรุณากรอกชื่อจริงหรือชื่อเล่นของคุณ');
    }

    setAccepting(true);
    try {
      const response = await fetch('/api/admin/staff/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token,
          displayName: displayName.trim(),
          phone: phone.trim() || null
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'ยอมรับคำเชิญล้มเหลว');
      }

      setSuccess(true);
      setTimeout(() => {
        // Redirect to dashboard
        router.push('/dashboard');
      }, 3000);
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการรับสิทธิ์');
    } finally {
      setAccepting(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'แอดมินระบบร้านค้า (Admin)';
      case 'manager': return 'ผู้จัดการสาขา (Manager)';
      case 'staff':
      default:
        return 'พนักงานขายหน้าร้าน (Cashier/Staff)';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#0F0C20] via-[#15102A] to-[#1A103C] flex items-center justify-center p-6 text-white font-bold">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden p-8 text-center space-y-6">
        
        {/* App Logo/Branding */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-red-600/90 flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-red-600/30">
            R
          </div>
          <h2 className="text-xl font-black mt-3 tracking-wide text-white uppercase">RUSH UP POS</h2>
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mt-0.5">Staff Onboarding System</span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-red-500" />
            <p className="text-sm text-gray-400">กำลังตรวจสอบรหัสเชิญพนักงาน...</p>
          </div>
        ) : error ? (
          <div className="py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-black text-red-400">ไม่สามารถดำเนินการต่อได้</h3>
            <p className="text-sm text-gray-300 font-medium leading-relaxed px-4">{error}</p>
            <button 
              onClick={() => router.push('/login')}
              className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black transition-colors"
            >
              เข้าสู่ระบบทั่วไป
            </button>
          </div>
        ) : success ? (
          <div className="py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-black text-emerald-400">ยินดีต้อนรับเข้าร่วมทีม!</h3>
            <p className="text-sm text-gray-300 font-medium leading-relaxed">
              คุณได้เข้าร่วมเป็นทีมงานของร้าน {invite?.pos_merchants?.name || 'ร้านค้า'} เรียบร้อยแล้ว
            </p>
            <p className="text-[11px] text-gray-400 animate-pulse font-medium">
              กำลังนำคุณเข้าสู่ระบบบริหารจัดการร้านค้า...
            </p>
          </div>
        ) : (
          <div className="py-2 space-y-6">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
              <ShieldCheck size={32} />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-gray-100">คุณได้รับเชิญเข้าร่วมร้าน</h3>
              <p className="text-2xl font-black text-red-500 leading-snug mt-1">
                {invite?.pos_merchants?.name || 'ร้านค้าพาร์ทเนอร์'}
              </p>
            </div>

            {/* Invite Details */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left space-y-3 font-semibold text-xs text-gray-300">
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">ตำแหน่งงาน</span>
                  <span className="font-black text-gray-100 text-sm">{getRoleLabel(invite?.role)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">สาขาที่เข้าทำงาน</span>
                  <span className="font-black text-gray-100 text-sm">{invite?.branch_code || 'สำนักงานใหญ่ / ทุกสาขา'}</span>
                </div>
              </div>
            </div>

             {/* Accept Button / Redirect State */}
             <div className="space-y-3 pt-2">
               {currentUser ? (
                 <div className="space-y-4">
                   {/* Onboarding fields for the staff to fill in their own nickname and phone */}
                   <div className="space-y-3 pt-2 pb-2 text-left font-semibold text-xs">
                     <div className="space-y-1.5">
                       <label className="text-[10px] text-gray-400 block uppercase font-black tracking-wider">ชื่อจริง หรือ ชื่อเล่นของคุณ *</label>
                       <input
                         type="text"
                         value={displayName}
                         onChange={(e) => setDisplayName(e.target.value)}
                         placeholder="เช่น สมชาย (แสดงผลในระบบ POS)"
                         className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none text-white focus:border-red-500 transition-colors font-bold"
                       />
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-[10px] text-gray-400 block uppercase font-black tracking-wider">เบอร์โทรศัพท์ของคุณ (ถ้ามี)</label>
                       <input
                         type="text"
                         value={phone}
                         onChange={(e) => setPhone(e.target.value)}
                         placeholder="เช่น 0891234567"
                         className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none text-white focus:border-red-500 transition-colors font-bold"
                       />
                     </div>
                   </div>

                   <button
                     onClick={handleAcceptInvite}
                     disabled={accepting}
                     className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-red-600/20 border-none animate-bounce cursor-pointer"
                   >
                     {accepting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                     ยอมรับคำเชิญและเริ่มงาน
                   </button>
                 </div>
               ) : (
                 <div className="space-y-3">
                   <p className="text-xs text-gray-400 font-medium leading-relaxed">
                     กรุณาเข้าสู่ระบบหรือสร้างบัญชีใหม่เพื่อผูกประวัติพนักงานของคุณกับร้านนี้
                   </p>
                   <button
                     onClick={() => {
                       const currentPath = window.location.pathname + window.location.search;
                       router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
                     }}
                     className="w-full bg-white text-black hover:bg-gray-100 text-sm py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 active:scale-95 border-none cursor-pointer"
                   >
                     <LogIn className="w-4 h-4" />
                     เข้าสู่ระบบเพื่อยอมรับสิทธิ์
                   </button>
                 </div>
               )}

               <p className="text-[10px] text-gray-500 font-bold">
                 * ลิงก์คำเชิญนี้มีอายุจำกัดและสามารถรับสิทธิ์ได้เพียงครั้งเดียวเท่านั้น
               </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
