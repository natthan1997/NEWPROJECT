'use client';
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { 
  Users, UserPlus, ShieldCheck, Search, 
  ChevronRight, Briefcase, MapPin, CheckCircle2,
  AlertCircle, Loader2, ArrowUpRight, X, Copy, CopyCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from "@/lib/I18nContext";

export default function AdminStaffPage() {
    const { locale } = useI18n();
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingCount, setPendingCount] = useState(0)

  // Staff Invitation States
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteRole, setInviteRole] = useState('staff')
  const [inviteBranch, setInviteBranch] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [generatingLink, setGeneratingLink] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerateInvite = async () => {
    setGeneratingLink(true)
    setGeneratedLink('')
    setCopied(false)
    try {
      const response = await fetch('/api/admin/staff/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: inviteRole,
          branchCode: inviteBranch || null,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'สร้างลิงก์คำเชิญล้มเหลว')
      }

      setGeneratedLink(result.inviteLink)
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการสร้างคำเชิญ')
    } finally {
      setGeneratingLink(false)
    }
  }

  useEffect(() => {
    fetchStaff()
    fetchPendingCount()
  }, [])

  const fetchStaff = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'staff')
      .order('display_name', { ascending: true })
    
    if (data) setStaff(data)
    setLoading(false)
  }

  const togglePosAccount = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_pos_account: !currentValue })
      .eq('id', id)
    
    if (!error) {
      setStaff(staff.map(s => s.id === id ? { ...s, is_pos_account: !currentValue } : s))
    } else {
      alert('Failed to update POS account status')
    }
  }

  const fetchPendingCount = async () => {
    const { count } = await supabase
      .from('staff_identity')
      .select('*', { count: 'exact', head: true })
      .is('verified_at', null)
    
    setPendingCount(count || 0)
  }

  const filteredStaff = staff.filter(s => 
    s.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.staff_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-4 sm:p-10 font-bold">
      <div className="max-w-6xl mx-auto">
        
        {/* 1. HEADER SECTION */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3A5A40]">Staff Management</div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-black">{locale === 'en' ? 'จัดการพนักงาน' : locale === 'zh' ? 'จัดการพนักงาน' : 'จัดการพนักงาน'}</h1>
            <p className="text-[12px] text-gray-400 font-bold">{locale === 'en' ? 'ดูแลข้อมูลพนักงาน ตรวจสอบการยืนยันตัวตน และสถานะการทำงาน' : locale === 'zh' ? 'ดูแลข้อมูลพนักงาน ตรวจสอบการยืนยันตัวตน และสถานะการทำงาน' : 'ดูแลข้อมูลพนักงาน ตรวจสอบการยืนยันตัวตน และสถานะการทำงาน'}</p>
          </div>

          <div className="flex flex-wrap gap-4">
             {/* 🔥 THE MAIN ENTRY TO VERIFICATION PAGE */}
             <Link 
                href="/dashboard/admin/staff/verification"
                className="relative group bg-white border border-amber-200 p-5 pr-16 hover:border-amber-500 transition-all shadow-sm"
             >
                <div className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-1">Pending Approval</div>
                <div className="text-[13px] font-black text-black">{locale === 'en' ? 'ตรวจสอบพนักงานใหม่' : locale === 'zh' ? 'ตรวจสอบพนักงานใหม่' : 'ตรวจสอบพนักงานใหม่'}</div>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 bg-amber-500 text-white flex items-center justify-center font-black">
                    {pendingCount}
                </div>
                {pendingCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                )}
             </Link>

             <button 
                onClick={() => { 
                    try {
                        console.log('Admin Dashboard "+ เพิ่มพนักงาน" button clicked');
                        setShowInviteModal(true); 
                        setGeneratedLink(''); 
                        setCopied(false); 
                        console.log('showInviteModal set to true successfully');
                    } catch (e: any) {
                        console.error('Error opening invite modal:', e);
                        alert('เกิดข้อผิดพลาดในการเปิดหน้าต่างเชิญ: ' + e.message);
                    }
                }}
                className="bg-black text-white px-8 py-5 flex items-center gap-3 hover:bg-[#333] transition-all active:scale-95"
             >
                <UserPlus size={18} />
                <span className="text-[11px] font-black uppercase tracking-widest">{locale === 'en' ? 'Add employees' : locale === 'zh' ? '添加员工' : 'เพิ่มพนักงาน'}</span>
             </button>
          </div>
        </header>
 
        {/* 2. STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="bg-white border border-gray-100 p-8 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-4">{locale === 'en' ? 'All employees' : locale === 'zh' ? '全体员工' : 'พนักงานทั้งหมด'}</div>
                <div className="text-4xl font-black">{staff.length}</div>
            </div>
            <div className="bg-white border border-gray-100 p-8 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-4">{locale === 'en' ? 'ยืนยันตัวตนแล้ว' : locale === 'zh' ? 'ยืนยันตัวตนแล้ว' : 'ยืนยันตัวตนแล้ว'}</div>
                <div className="text-4xl font-black text-green-600">{staff.filter(s => s.is_verified).length}</div>
            </div>
            <div className="bg-white border border-gray-100 p-8 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-4">{locale === 'en' ? 'รอยืนยันตัวตน' : locale === 'zh' ? 'รอยืนยันตัวตน' : 'รอยืนยันตัวตน'}</div>
                <div className="text-4xl font-black text-amber-500">{staff.filter(s => !s.is_verified).length}</div>
            </div>
        </div>
 
        {/* 3. SEARCH & LIST */}
        <div className="bg-white border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                        type="text" 
                        placeholder={locale === 'en' ? 'ค้นหาพนักงานด้วยชื่อ หรือ รหัส...' : locale === 'zh' ? 'ค้นหาพนักงานด้วยชื่อ หรือ รหัส...' : 'ค้นหาพนักงานด้วยชื่อ หรือ รหัส...'} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border-none py-4 pl-12 pr-4 text-sm font-bold focus:ring-1 focus:ring-black outline-none"
                    />
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div> Verified
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div> Unverified
                    </div>
                </div>
            </div>
 
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-gray-200" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">{locale === 'en' ? 'Loading data...' : locale === 'zh' ? '正在加载数据...' : 'กำลังโหลดข้อมูล...'}</p>
                </div>
            ) : filteredStaff.length === 0 ? (
                <div className="py-20 text-center">
                    <Users className="mx-auto text-gray-100 mb-4" size={64} />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">{locale === 'en' ? 'Employee information not found' : locale === 'zh' ? '未找到员工信息' : 'ไม่พบข้อมูลพนักงาน'}</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <th className="px-8 py-6">{locale === 'en' ? 'employee' : locale === 'zh' ? '员工' : 'พนักงาน'}</th>
                                <th className="px-8 py-6">{locale === 'en' ? 'ข้อมูลงาน' : locale === 'zh' ? 'ข้อมูลงาน' : 'ข้อมูลงาน'}</th>
                                <th className="px-8 py-6">POS Account</th>
                                <th className="px-8 py-6">{locale === 'en' ? 'การยืนยันตัวตน' : locale === 'zh' ? 'การยืนยันตัวตน' : 'การยืนยันตัวตน'}</th>
                                <th className="px-8 py-6">{locale === 'en' ? 'สาขา' : locale === 'zh' ? 'สาขา' : 'สาขา'}</th>
                                <th className="px-8 py-6">{locale === 'en' ? 'จัดการ' : locale === 'zh' ? 'จัดการ' : 'จัดการ'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredStaff.map((s) => (
                                <tr key={s.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-100 text-gray-400 flex items-center justify-center rounded-xl text-lg font-light overflow-hidden">
                                                {s.display_name?.slice(0,1).toUpperCase() || <Users size={20} />}
                                            </div>
                                            <div>
                                                <div className="text-[14px] font-black text-black group-hover:text-[#3A5A40] transition-colors">{s.display_name || 'พนักงาน'}</div>
                                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">{s.staff_code || 'No Staff ID'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[11px] font-black uppercase text-gray-600 flex items-center gap-2">
                                                <Briefcase size={12} className="text-gray-300" />
                                                {s.staff_level || s.staff_type || 'General Staff'}
                                            </span>
                                            <span className="text-[9px] text-gray-400 font-bold">{s.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <button
                                            onClick={() => togglePosAccount(s.id, !!s.is_pos_account)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${s.is_pos_account ? 'bg-[#3A5A40]' : 'bg-gray-200'}`}
                                        >
                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${s.is_pos_account ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                        {s.is_pos_account && <div className="text-[8px] font-black uppercase text-[#3A5A40] mt-1">POS ONLY</div>}
                                    </td>
                                    <td className="px-8 py-6">
                                        {s.is_verified ? (
                                            <div className="flex items-center gap-2 text-green-600">
                                                <CheckCircle2 size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-amber-500">
                                                <AlertCircle size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Unverified</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-gray-500 text-[11px] font-black uppercase">
                                            <MapPin size={12} className="text-gray-300" />
                                            {s.branch_code || 'Headquarter'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <Link 
                                            href={`/dashboard/admin/staff/${s.id}`}
                                            className="w-10 h-10 border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all bg-white shadow-sm"
                                        >
                                            <ArrowUpRight size={16} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>

      {/* Invite Staff Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[2rem] border border-black/5 shadow-2xl max-w-md w-full overflow-hidden flex flex-col font-bold"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-neutral-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                    <UserPlus size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-base text-gray-900 leading-snug">เชิญพนักงานใหม่เข้าร่วมร้าน</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Invite new staff via secure link</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowInviteModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black flex items-center justify-center transition-colors active:scale-95 border-none"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-5 text-left">
                {/* Position Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">ตำแหน่งงานพนักงาน (Staff Level)</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-neutral-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-black transition-all"
                  >
                    <option value="staff">พนักงานหน้าร้าน / แคชเชียร์ (Staff)</option>
                    <option value="manager">ผู้จัดการสาขา (Manager)</option>
                    <option value="admin">แอดมินร้านค้า / เจ้าของร่วม (Admin)</option>
                  </select>
                </div>

                {/* Branch Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">สาขาที่เข้าทำงาน (Branch Code - เลือกใส่หรือไม่ใส่ก็ได้)</label>
                  <input
                    type="text"
                    placeholder="เช่น Branch01, Headquarter หรือเว้นว่างไว้"
                    value={inviteBranch}
                    onChange={(e) => setInviteBranch(e.target.value)}
                    className="w-full bg-neutral-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black transition-all"
                  />
                </div>

                {/* Generate Button */}
                {!generatedLink && (
                  <button
                    onClick={handleGenerateInvite}
                    disabled={generatingLink}
                    className="w-full bg-black text-white hover:bg-neutral-800 disabled:opacity-50 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 border-none"
                  >
                    {generatingLink ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    สร้างลิงก์คำเชิญเข้าร่วมร้าน
                  </button>
                )}

                {/* Generated Invite Link */}
                {generatedLink && (
                  <div className="space-y-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 size={16} />
                      <span className="text-[10px] font-black uppercase tracking-wider">สร้างลิงก์คำเชิญสำเร็จแล้ว</span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      คัดลอกลิงก์คำเชิญด้านล่างส่งให้พนักงานผ่านแชต LINE / SMS ลิงก์นี้จะหมดอายุภายใน 7 วันและสมัครได้เพียงครั้งเดียว
                    </p>
                    
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        readOnly
                        value={generatedLink}
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-[11px] font-mono text-gray-600 focus:outline-none"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedLink);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 border-none shrink-0 ${copied ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-white hover:bg-black'}`}
                      >
                        {copied ? <CopyCheck size={14} /> : <Copy size={14} />}
                        {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-neutral-50/50 flex justify-end">
                <button 
                  onClick={() => setShowInviteModal(false)}
                  className="px-5 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-xl text-xs font-black transition-colors border-none active:scale-95"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}