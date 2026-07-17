'use client';
import React, { useState, useEffect } from 'react'
import { 
  Users, Search, UserPlus, Phone, Mail, Award, History, 
  ChevronRight, ArrowLeft, Loader2, Save, X, Edit2, 
  TrendingUp, TrendingDown, Star, LayoutGrid, List,
  Coffee, Sparkles, CheckCircle2, ShieldCheck, UserCheck, Settings, Gift, Tag, QrCode, Download, ShieldAlert
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useI18n } from "@/lib/I18nContext";
import CrmSettingsPage from '@/app/dashboard/admin/pos-settings/crm/page';
import { QRCodeCanvas } from 'qrcode.react';

interface Customer {
    id: string
    display_name?: string
    full_name?: string
    avatar_url?: string
    phone: string
    email: string | null
    points: number
    tier: string
    total_spent: number
    created_at: string
    line_user_id: string | null
    title?: string
    date_of_birth?: string
    gender?: string
}

interface Coupon {
    id: string
    member_id: string
    coupon_type: string
    coupon_name: string
    status: 'active' | 'used' | 'expired'
    created_at: string
}

interface PointsHistory {
    id: string
    member_id: string
    points: number
    type: 'earn' | 'redeem'
    description: string
    created_at: string
}

interface POSMemberManagerProps {
    profile: any
    activeView: string
    allowedNav: any[]
    onSetView: (view: any) => void
    syncPulse: number
    setViewExtraHeader: (node: React.ReactNode) => void
    shopSettings?: any
}

export default function POSMemberManager({ 
    profile, activeView, allowedNav, onSetView, syncPulse, setViewExtraHeader, shopSettings
}: POSMemberManagerProps) {
    const { locale } = useI18n();
    const [loading, setLoading] = useState(true)
    const [customers, setCustomers] = useState<Customer[]>([])
    const [selectedMember, setSelectedMember] = useState<Customer | null>(null)
    const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([])
    const [activeCoupons, setActiveCoupons] = useState<Coupon[]>([])
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editData, setEditData] = useState<Partial<Customer>>({})
    const [searchTerm, setSearchTerm] = useState('')
    const [showCrmSettings, setShowCrmSettings] = useState(false)
    const [showQR, setShowQR] = useState(false)

    useEffect(() => {
        fetchMembers()
        
        const channel = supabase.channel('pos_members_manager_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_members' }, () => {
                fetchMembers()
                if (selectedMember) {
                    fetchPointsHistory(selectedMember.id)
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_points_history' }, () => {
                if (selectedMember) {
                    fetchPointsHistory(selectedMember.id)
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_member_coupons' }, () => {
                if (selectedMember) {
                    fetchCoupons(selectedMember.id)
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [syncPulse, shopSettings?.branch_id, shopSettings?.shared_member_branch_id, selectedMember?.id])

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            fetchMembers()
        }, 300)
        return () => clearTimeout(delaySearch)
    }, [searchTerm])

    useEffect(() => {
        setViewExtraHeader(null);
        return () => setViewExtraHeader(null);
    }, [setViewExtraHeader]);

    const handleDownloadQR = () => {
        const canvas = document.getElementById('member-qr-canvas-manager') as HTMLCanvasElement;
        if (canvas) {
            const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            let downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = "member-register-qr.png";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    }

    const fetchMembers = async () => {
        setLoading(true)
        try {
            const branchId = shopSettings?.shared_member_branch_id || shopSettings?.branch_id
            let query = supabase.from('pos_members').select('*', { count: 'exact' })
            
            if (branchId) {
                query = query.or(`branch_id.eq.${branchId},branch_id.is.null`)
            } else {
                query = query.is('branch_id', null)
            }

            if (searchTerm) {
                query = query.or(`display_name.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
            } else {
                query = query.order('points', { ascending: false }).limit(20)
            }

            const { data, error } = await query
            if (error) throw error
            if (data) setCustomers(data)
        } catch (err: any) {
            console.error("Fetch Members Error:", err)
        } finally {
            setLoading(false)
        }
    }

    const fetchCoupons = async (memberId: string) => {
        const { data } = await supabase
            .from('pos_member_coupons')
            .select('*')
            .eq('member_id', memberId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
        
        if (data) setActiveCoupons(data)
        else setActiveCoupons([])
    }

    const handleUseCoupon = async (coupon: any) => {
        if (!confirm('ยืนยันการใช้คูปองนี้ใช่หรือไม่? คูปองจะถูกนำไปเป็นส่วนลดในบิลหน้าขายทันที (กดยืนยันแล้วให้กลับไปหน้าขาย)')) return;
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('applyPOSCoupon', { detail: coupon }));
        }
        alert('นำคูปองไปประยุกต์ใช้เป็นส่วนลดสำเร็จ! กรุณากลับไปที่หน้า "Terminal" เพื่อดูส่วนลดในบิลปัจจุบัน');
    }

    const fetchHistory = async (memberId: string) => {
        const { data } = await supabase
            .from('pos_points_history')
            .select('*')
            .eq('member_id', memberId)
            .order('created_at', { ascending: false })
            .limit(10)
        
        if (data) setPointsHistory(data)
        else setPointsHistory([])
    }

    const handleSelectMember = (member: Customer) => {
        setSelectedMember(member)
        setEditData(member)
        setPointsHistory([])
        setActiveCoupons([])
        fetchHistory(member.id)
        fetchCoupons(member.id)
    }

    const handleSave = async () => {
        if (!selectedMember) return
        setIsSaving(true)
        const { error } = await supabase
            .from('pos_members')
            .update({
                display_name: editData.display_name || editData.full_name,
                full_name: editData.full_name,
                phone: editData.phone,
                email: editData.email,
                points: editData.points,
                tier: editData.tier,
                title: editData.title,
                date_of_birth: editData.date_of_birth,
                gender: editData.gender
            })
            .eq('id', selectedMember.id)
        
        if (!error) {
            fetchMembers()
            setIsEditing(false)
            setSelectedMember({...selectedMember, ...editData} as Customer)
        } else {
            alert('Error updating member: ' + error.message)
        }
        setIsSaving(false)
    }

    const translateHistoryDescription = (desc: string | undefined | null, locale: string) => {
        if (!desc) return locale === 'en' ? 'General Transaction' : locale === 'zh' ? '一般交易' : 'รายการทั่วไป';
        if (desc.includes('Earned from POS Order #')) {
            const orderNum = desc.split('#')[1] || '';
            return locale === 'en' ? `Earned from Order #${orderNum}` : locale === 'zh' ? `从订单获得积分 #${orderNum}` : `ได้รับจากออเดอร์ #${orderNum}`;
        }
        if (desc.includes('Redeemed') && desc.includes('pts for POS Order #')) {
            const match = desc.match(/Redeemed (\d+) pts for POS Order #(.+)/);
            if (match) {
                return locale === 'en' ? `Redeemed ${match[1]} pts for Order #${match[2]}` : locale === 'zh' ? `兑换 ${match[1]} 积分于订单 #${match[2]}` : `ใช้ ${match[1]} แต้มกับออเดอร์ #${match[2]}`;
            }
        }
        if (desc === 'Claimed via QR Code') {
            return locale === 'en' ? 'Claimed via QR Code' : locale === 'zh' ? '通过二维码领取' : 'สแกนรับแต้มจาก QR Code';
        }
        return desc;
    }

    const getTierBadge = (tier: string | undefined | null) => {
        const safeTier = (tier || 'general').toLowerCase();
        const colors: any = {
            general: 'bg-gray-100 text-gray-500',
            bronze: 'bg-amber-100 text-amber-700',
            silver: 'bg-slate-100 text-slate-700',
            gold: 'bg-yellow-100 text-yellow-700',
            platinum: 'bg-sage-100 text-sage-700'
        }
        const thaiTier: any = {
            general: 'ทั่วไป',
            bronze: 'BRONZE',
            silver: 'SILVER',
            gold: 'GOLD',
            platinum: 'PLATINUM'
        }
        return (
            <span className={`px-3 py-1 rounded-none text-[8px] font-black uppercase tracking-[0.2em] ${colors[safeTier] || 'bg-gray-100 text-gray-500'}`}>
                {thaiTier[safeTier] || safeTier}
            </span>
        )
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
            <div className="flex-1 flex overflow-hidden font-bold">
                 {/* Sidebar List - Hidden on mobile if a member is selected */}
                 <div className={`${selectedMember ? 'hidden sm:flex' : 'flex'} w-full sm:w-[380px] lg:w-[420px] border-r border-[#F0F0E8] flex-col h-full bg-[#FAFAF9] font-bold shrink-0 transition-all`}>
                    <header className="p-6 border-b border-[#F0F0E8] bg-white space-y-4">
                        <div className="flex items-center justify-between">
                             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A18]">{locale === 'en' ? 'รายชื่อสมาชิก' : locale === 'zh' ? 'รายชื่อสมาชิก' : 'รายชื่อสมาชิก'}</h2>
                             <div className="flex gap-2 items-center">
                                 <span className="text-[8px] font-black text-sage-600 bg-sage-50 px-2 py-1 uppercase tracking-widest">{customers.length} {locale === 'en' ? ' ท่าน' : locale === 'zh' ? ' ท่าน' : ' ท่าน'}</span>
                                 <button onClick={() => setShowQR(true)} className="p-1 text-gray-400 hover:text-[#1A1A18] transition-colors" title="QR สมัครสมาชิก">
                                     <QrCode size={14} />
                                 </button>
                                 <button onClick={() => setShowCrmSettings(true)} className="p-1 text-gray-400 hover:text-[#1A1A18] transition-colors" title="ตั้งค่า CRM & Loyalty">
                                     <Settings size={14} />
                                 </button>
                             </div>
                        </div>
                        <div className="relative group">
                           <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#1A1A18]" />
                           <input 
                               type="text"
                               placeholder={locale === 'en' ? 'ค้นหาชื่อหรือเบอร์โทร...' : locale === 'zh' ? 'ค้นหาชื่อหรือเบอร์โทร...' : 'ค้นหาชื่อหรือเบอร์โทร...'}
                               className="h-10 w-full bg-[#FAFAF9] border border-[#F0F0E8] pl-10 pr-4 text-[11px] font-bold outline-none focus:border-[#1A1A18] transition-all"
                               value={searchTerm}
                               onChange={e => setSearchTerm(e.target.value)}
                           />
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto custom-scrollbar font-bold">
                        {loading && customers.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 font-bold">
                                <Loader2 className="animate-spin" size={32} />
                            </div>
                        ) : customers.length > 0 ? (
                            customers.map(member => (
                                <button 
                                    key={member.id}
                                    onClick={() => handleSelectMember(member)}
                                    className={`w-full group flex items-center justify-between p-5 border-b border-[#F0F0E8]/50 transition-all text-left font-bold ${selectedMember?.id === member.id ? 'bg-white shadow-[inset_4px_0_0_0_#4A5D4A]' : 'hover:bg-white/60'}`}
                                >
                                    <div className="flex items-center gap-4 font-bold">
                                        <div className={`w-10 h-10 rounded-none flex items-center justify-center text-xs font-black transition-all overflow-hidden ${selectedMember?.id === member.id ? 'bg-[#1A1A18] text-white' : 'bg-white border border-[#F0F0E8] text-gray-400'}`}>
                                            {member.avatar_url ? (
                                                <img loading="lazy"  src={member.avatar_url} alt={member.display_name || 'Member'} className="w-full h-full object-cover" />
                                            ) : (
                                                (member.display_name || member.full_name || 'M').slice(0, 1)
                                            )}
                                        </div>
                                        <div className="font-bold">
                                            <div className="text-[11px] font-black uppercase tracking-tight text-[#1A1A18]">{member.full_name ? `${member.full_name} ${member.display_name && member.display_name !== member.full_name ? `(${member.display_name})` : ''}` : (member.display_name || 'สมาชิก')} {member.title && <span className="text-[9px] text-sage-600 bg-sage-50 px-1 py-0.5 ml-1">👑 {member.title}</span>}</div>
                                            <div className="text-[8px] text-[#8C8A81] font-black uppercase tracking-widest mt-0.5 flex items-center gap-1.5 opacity-60">
                                                <Phone size={8} /> {member.phone || 'ไม่ระบุเบอร์'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right font-bold">
                                        <div className="text-[12px] font-black text-[#1A1A18] tracking-tighter">{(member.points ?? 0).toLocaleString()} <span className="text-[7px] text-gray-300">{locale === 'en' ? 'คะแนน' : locale === 'zh' ? 'คะแนน' : 'คะแนน'}</span></div>
                                        {member.phone ? (
                                            <div className="text-[7px] text-emerald-500 font-black uppercase tracking-widest mt-1 flex items-center justify-end gap-1"><ShieldCheck size={7} /> {locale === 'en' ? 'Registered' : locale === 'zh' ? 'ลงทะเบียนแล้ว' : 'ลงทะเบียนแล้ว'}</div>
                                        ) : (
                                            <div className="text-[7px] text-amber-500 font-black uppercase tracking-widest mt-1 flex items-center justify-end gap-1"><ShieldAlert size={7} /> {locale === 'en' ? 'Unregistered' : locale === 'zh' ? 'ยังไม่ลงทะเบียน' : 'ยังไม่ลงทะเบียน'}</div>
                                        )}
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 font-bold p-12 text-center">
                                <ShieldCheck size={32} className="mb-4 text-gray-300" />
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8C8A81]">{locale === 'en' ? 'ไม่พบสมาชิกในระบบ' : locale === 'zh' ? 'ไม่พบสมาชิกในระบบ' : 'ไม่พบสมาชิกในระบบ'}</p>
                            </div>
                        )}
                    </div>
                 </div>

                 {/* Main Content - Hidden on mobile if no member is selected */}
                 <div className={`${selectedMember ? 'flex' : 'hidden sm:flex'} flex-1 bg-white flex-col overflow-y-auto custom-scrollbar font-bold relative transition-all`}>
                    {selectedMember ? (
                        <div className="min-h-full flex flex-col font-bold">
                            {/* Mobile Navigation Header */}
                            <div className="sm:hidden p-4 border-b border-[#F0F0E8] bg-white sticky top-0 z-30 flex items-center">
                                <button 
                                    onClick={() => setSelectedMember(null)}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500"
                                >
                                    <ArrowLeft size={16} /> {locale === 'en' ? ' กลับไปหน้ารายชื่อ                                 ' : locale === 'zh' ? ' กลับไปหน้ารายชื่อ                                 ' : ' กลับไปหน้ารายชื่อ                                 '}</button>
                            </div>

                            {/* Portfolio Header */}
                            <header className="p-8 sm:p-12 border-b border-[#F0F0E8] bg-[#FAFAF9] sm:sticky top-0 z-20">
                                <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 font-bold">
                                    <div className="flex flex-col sm:flex-row items-center gap-8 font-bold w-full lg:w-auto">
                                        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white border-2 border-white shadow-2xl flex items-center justify-center text-3xl font-black overflow-hidden shrink-0">
                                            {selectedMember.avatar_url ? (
                                                <img loading="lazy"  src={selectedMember.avatar_url} alt={selectedMember.display_name || 'Member'} className="w-full h-full object-cover" />
                                            ) : (
                                                (selectedMember.display_name || selectedMember.full_name || 'M').slice(0, 1)
                                            )}
                                        </div>
                                        <div className="space-y-3 font-bold text-center sm:text-left">
                                            <div className="flex flex-col sm:flex-row items-center gap-4 font-bold">
                                                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-[#1A1A18] leading-none">{selectedMember.full_name ? `${selectedMember.full_name} ${selectedMember.display_name && selectedMember.display_name !== selectedMember.full_name ? `(${selectedMember.display_name})` : ''}` : (selectedMember.display_name || 'สมาชิก')}</h2>
                                                {getTierBadge(selectedMember.tier)}
                                                {selectedMember.title && <span className="px-3 py-1 bg-sage-50 text-sage-600 text-[10px] font-black tracking-widest uppercase border border-sage-200">👑 {selectedMember.title}</span>}
                                            </div>
                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 font-bold">
                                                 <div className="flex items-center gap-2 text-[9px] font-black uppercase text-[#8C8A81] tracking-widest"><Phone size={12} className="text-sage-400" /> {selectedMember.phone || 'ไม่ระบุเบอร์'}</div>
                                                 <div className="flex items-center gap-2 text-[9px] font-black uppercase text-[#8C8A81] tracking-widest"><Mail size={12} className="text-sage-400" /> {selectedMember.email || 'ไม่ระบุอีเมล'}</div>
                                                 <div className="flex items-center gap-2 text-[9px] font-black uppercase text-[#8C8A81] tracking-widest">
                                                    <Award size={12} className="text-sage-400" /> 
                                                    {locale === 'en' ? '                                                      เข้าร่วมเมื่อปี ' : locale === 'zh' ? '                                                      เข้าร่วมเมื่อปี ' : '                                                      เข้าร่วมเมื่อปี '}{selectedMember.created_at ? new Date(selectedMember.created_at).getFullYear() : '2026'}
                                                 </div>
                                                 <div className="flex items-center gap-2 text-[9px] font-black uppercase text-[#8C8A81] tracking-widest">
                                                    🎂 วันเกิด: {selectedMember.date_of_birth ? new Date(selectedMember.date_of_birth).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : 'ไม่ระบุ'}
                                                 </div>
                                                 {selectedMember.gender && (
                                                     <div className="flex items-center gap-2 text-[9px] font-black uppercase text-[#8C8A81] tracking-widest">
                                                        👤 เพศ: {selectedMember.gender}
                                                     </div>
                                                 )}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setIsEditing(!isEditing)}
                                        className={`w-full lg:w-auto h-12 px-8 text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${isEditing ? 'bg-[#1A1A18] text-white' : 'bg-white border border-[#F0F0E8] hover:border-[#1A1A18]'}`}
                                    >
                                        {isEditing ? 'ยกเลิกการแก้ไข' : 'แก้ไขข้อมูลสมาชิก'}
                                    </button>
                                </div>
                            </header>

                            <div className="flex-1 p-6 sm:p-12 max-w-5xl mx-auto w-full font-bold">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 sm:gap-12 font-bold">
                                     {isEditing ? (
                                         <div className="bg-[#FAFAF9] border border-[#F0F0E8] p-6 sm:p-10 space-y-8 font-bold">
                                            <header className="flex justify-between items-center font-bold text-center">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18] font-bold">{locale === 'en' ? 'แก้ไขข้อมูลส่วนตัว' : locale === 'zh' ? 'แก้ไขข้อมูลส่วนตัว' : 'แก้ไขข้อมูลส่วนตัว'}</h3>
                                            </header>
                                            <div className="space-y-6 font-bold">
                                                <div className="space-y-2 font-bold">
                                                    <label className="text-[8px] font-black uppercase text-[#8C8A81] tracking-widest ml-1 font-bold">{locale === 'en' ? 'ชื่อที่สมาชิกใช้แสดงผล' : locale === 'zh' ? 'ชื่อที่สมาชิกใช้แสดงผล' : 'ชื่อที่สมาชิกใช้แสดงผล'}</label>
                                                    <input 
                                                        className="w-full h-14 bg-white border border-[#F0F0E8] px-6 text-sm font-bold uppercase outline-none focus:ring-1 focus:ring-[#1A1A18]"
                                                        value={editData.display_name || ''}
                                                        onChange={e => setEditData({...editData, display_name: e.target.value})}
                                                    />
                                                </div>
                                                <div className="space-y-2 font-bold">
                                                    <label className="text-[8px] font-black uppercase text-[#8C8A81] tracking-widest ml-1 font-bold">ฉายา / Title</label>
                                                    <input 
                                                        className="w-full h-14 bg-white border border-[#F0F0E8] px-6 text-sm font-bold uppercase outline-none focus:ring-1 focus:ring-[#1A1A18] text-sage-600"
                                                        value={editData.title || ''}
                                                        placeholder="เช่น ผู้พิทักษ์ป่า"
                                                        onChange={e => setEditData({...editData, title: e.target.value})}
                                                    />
                                                </div>
                                                <div className="space-y-2 font-bold">
                                                    <label className="text-[8px] font-black uppercase text-[#8C8A81] tracking-widest ml-1 font-bold">{locale === 'en' ? 'ชื่อเรียก/ชื่อเล่น (Nickname)' : locale === 'zh' ? 'ชื่อเรียก/ชื่อเล่น (Nickname)' : 'ชื่อเรียก/ชื่อเล่น (Nickname)'}</label>
                                                    <input 
                                                        className="w-full h-14 bg-white border border-[#F0F0E8] px-6 text-sm font-bold uppercase outline-none focus:ring-1 focus:ring-[#1A1A18]"
                                                        value={editData.full_name || ''}
                                                        onChange={e => setEditData({...editData, full_name: e.target.value})}
                                                    />
                                                </div>
                                                <div className="space-y-2 font-bold">
                                                    <label className="text-[8px] font-black uppercase text-[#8C8A81] tracking-widest ml-1 font-bold">{locale === 'en' ? 'เบอร์โทรศัพท์ติดต่อ' : locale === 'zh' ? 'เบอร์โทรศัพท์ติดต่อ' : 'เบอร์โทรศัพท์ติดต่อ'}</label>
                                                    <input 
                                                        className="w-full h-14 bg-white border border-[#F0F0E8] px-6 text-sm font-bold outline-none focus:ring-1 focus:ring-[#1A1A18]"
                                                        value={editData.phone || ''}
                                                        onChange={e => setEditData({...editData, phone: e.target.value})}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-bold">
                                                    <div className="space-y-2 font-bold">
                                                        <label className="text-[8px] font-black uppercase text-[#8C8A81] tracking-widest ml-1 font-bold">วันเกิด</label>
                                                        <input 
                                                            type="date"
                                                            className="w-full h-14 bg-white border border-[#F0F0E8] px-6 text-sm font-bold outline-none focus:ring-1 focus:ring-[#1A1A18]"
                                                            value={editData.date_of_birth || ''}
                                                            onChange={e => setEditData({...editData, date_of_birth: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className="space-y-2 font-bold">
                                                        <label className="text-[8px] font-black uppercase text-[#8C8A81] tracking-widest ml-1 font-bold">เพศ</label>
                                                        <select 
                                                            className="w-full h-14 bg-white border border-[#F0F0E8] px-6 text-sm font-bold outline-none focus:ring-1 focus:ring-[#1A1A18] appearance-none"
                                                            value={editData.gender || ''}
                                                            onChange={e => setEditData({...editData, gender: e.target.value})}
                                                        >
                                                            <option value="">ไม่ระบุ</option>
                                                            <option value="ชาย">ชาย</option>
                                                            <option value="หญิง">หญิง</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-bold">
                                                    <div className="space-y-2 font-bold">
                                                        <label className="text-[8px] font-black uppercase text-[#8C8A81] tracking-widest ml-1 font-bold">{locale === 'en' ? 'ระดับสิทธิ์สมาชิก' : locale === 'zh' ? 'ระดับสิทธิ์สมาชิก' : 'ระดับสิทธิ์สมาชิก'}</label>
                                                        <select 
                                                            className="w-full h-14 bg-white border border-[#F0F0E8] px-6 text-xs font-black uppercase outline-none focus:ring-1 focus:ring-[#1A1A18] appearance-none"
                                                            value={editData.tier}
                                                            onChange={e => setEditData({...editData, tier: e.target.value})}
                                                        >
                                                            <option value="bronze">Bronze Core</option>
                                                            <option value="silver">Silver Tier</option>
                                                            <option value="gold">Gold Elite</option>
                                                            <option value="platinum">Platinum Prime</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2 font-bold">
                                                        <label className="text-[8px] font-black uppercase text-[#8C8A81] tracking-widest ml-1 font-bold">{locale === 'en' ? 'คะแนนสะสมคงเหลือ' : locale === 'zh' ? 'คะแนนสะสมคงเหลือ' : 'คะแนนสะสมคงเหลือ'}</label>
                                                        <input 
                                                            type="number"
                                                            className="w-full h-14 bg-white border border-[#F0F0E8] px-6 text-sm font-bold outline-none focus:ring-1 focus:ring-[#1A1A18]"
                                                            value={editData.points}
                                                            onChange={e => setEditData({...editData, points: parseInt(e.target.value) || 0})}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                disabled={isSaving}
                                                onClick={handleSave}
                                                className="w-full h-16 bg-[#1A1A18] text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 font-bold"
                                            >
                                                {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={16} /> {locale === 'en' ? ' ยืนยันการเปลี่ยนแปลงข้อมูล' : locale === 'zh' ? ' ยืนยันการเปลี่ยนแปลงข้อมูล' : ' ยืนยันการเปลี่ยนแปลงข้อมูล'}</>}
                                            </button>
                                         </div>
                                     ) : (
                                         <div className="space-y-10">
                                            {/* Loyalty Module */}
                                            <div className="bg-white border border-[#F0F0E8] p-6 sm:p-10 space-y-10 font-bold relative overflow-hidden shadow-sm">
                                                <div className="absolute top-0 right-0 p-10 opacity-[0.02] rotate-12 select-none pointer-events-none">
                                                    <Star size={200} fill="black" />
                                                </div>

                                                <header className="flex justify-between items-center font-bold relative z-10">
                                                    <div className="space-y-1">
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A18] font-bold leading-none">{locale === 'en' ? 'บัตรสะสมคะแนนดิจิทัล' : locale === 'zh' ? 'บัตรสะสมคะแนนดิจิทัล' : 'บัตรสะสมคะแนนดิจิทัล'}</h3>
                                                        <p className="text-[7px] text-sage-500 font-black uppercase tracking-widest">{locale === 'en' ? 'ระดับสมาชิก: ' : locale === 'zh' ? 'ระดับสมาชิก: ' : 'ระดับสมาชิก: '}{selectedMember.tier?.toUpperCase() || 'ทั่วไป'}</p>
                                                    </div>
                                                </header>

                                                <div className="grid grid-cols-5 gap-3 sm:gap-4 relative z-10">
                                                    {[...Array(10)].map((_, i) => {
                                                        const pts = selectedMember.points ?? 0;
                                                        const stampCount = Math.floor(pts / 100);
                                                        const isFull = i < stampCount;
                                                        const isCurrent = i === stampCount;
                                                        const progress = isCurrent ? (pts % 100) : 0;

                                                        return (
                                                            <div 
                                                                key={i} 
                                                                className={`aspect-square border flex flex-col items-center justify-center relative transition-all duration-700 ${isFull ? 'bg-[#1A1A18] border-[#1A1A18] text-white shadow-xl' : 'bg-gray-50 border-gray-100 text-gray-200'}`}
                                                            >
                                                                {isFull ? (
                                                                    <UserCheck size={20} className="animate-in zoom-in duration-500" />
                                                                ) : (
                                                                    <div className="relative">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-20" />
                                                                        {isCurrent && progress > 0 && (
                                                                            <div 
                                                                                className="absolute bottom-0 left-0 right-0 bg-sage-500 transition-all duration-700 shadow-[0_0_10px_rgba(74,93,74,0.3)]" 
                                                                                                        style={{ height: `${progress}%`, opacity: 0.8 }}
                                                                                                    />
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                <div className="flex flex-wrap items-center justify-between font-bold gap-6 pt-8 border-t border-gray-100 relative z-10">
                                                    <div className="space-y-1 font-bold">
                                                        <div className="text-[8px] font-black uppercase text-gray-300 font-bold leading-none tracking-widest">{locale === 'en' ? 'คะแนนสะสมคงเหลือ (X-PULSE)' : locale === 'zh' ? 'คะแนนสะสมคงเหลือ (X-PULSE)' : 'คะแนนสะสมคงเหลือ (X-PULSE)'}</div>
                                                        <div className="text-3xl font-black text-[#1A1A18] font-bold tabular-nums">{(selectedMember.points ?? 0).toLocaleString()} <span className="text-[10px] text-gray-300 ml-1">{locale === 'en' ? 'คะแนน' : locale === 'zh' ? 'คะแนน' : 'คะแนน'}</span></div>
                                                    </div>
                                                    <div className="text-right font-bold">
                                                        <div className="text-[8px] font-black uppercase text-gray-300 font-bold leading-none tracking-widest mb-1.5">{locale === 'en' ? 'เป้าหมายรางวัลถัดไป' : locale === 'zh' ? 'เป้าหมายรางวัลถัดไป' : 'เป้าหมายรางวัลถัดไป'}</div>
                                                        <div className="text-lg font-black text-sage-600 font-bold tabular-nums">{(Math.floor((selectedMember.points ?? 0) / 100) + 1) * 100} {locale === 'en' ? ' คะแนน' : locale === 'zh' ? ' คะแนน' : ' คะแนน'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                         </div>
                                     )}


                                     {/* Active Coupons View */}
                                     {activeCoupons.length > 0 && !isEditing && (
                                         <div className="bg-sage-50/50 border border-sage-200 flex flex-col font-bold shadow-sm lg:col-span-2">
                                            <header className="p-6 border-b border-sage-200 flex justify-between items-center font-bold bg-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-sage-100 text-sage-600 flex items-center justify-center">
                                                        <Gift size={16} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] font-bold text-sage-800">คูปองที่สามารถใช้งานได้</h3>
                                                        <p className="text-[8px] text-sage-500 uppercase tracking-widest">{activeCoupons.length} สิทธิ์ที่ยังไม่ได้ใช้</p>
                                                    </div>
                                                </div>
                                            </header>
                                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {activeCoupons.map(coupon => (
                                                    <div key={coupon.id} className="bg-white border border-sage-200 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-sage-50 flex items-center justify-center text-sage-600">
                                                                <Tag size={18} />
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-black text-sage-800">{coupon.coupon_name}</div>
                                                                <div className="text-[9px] text-sage-400 font-black uppercase tracking-widest mt-1">ได้รับเมื่อ: {new Date(coupon.created_at).toLocaleDateString('th-TH')}</div>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleUseCoupon(coupon)}
                                                            className="px-4 py-2 bg-sage-600 text-white text-[9px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all hover:bg-sage-700"
                                                        >
                                                            ใช้งานสิทธิ์
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                         </div>
                                     )}

                                     {/* Ledger History View */}
                                     <div className="bg-white border border-[#F0F0E8] flex flex-col h-full font-bold shadow-sm">
                                        <header className="p-8 border-b border-[#F0F0E8] flex justify-between items-center font-bold bg-[#FAFAF9]">
                                            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] font-bold text-[#1A1A18]">{locale === 'en' ? 'ประวัติการรับ/ใช้คะแนน' : locale === 'zh' ? 'ประวัติการรับ/ใช้คะแนน' : 'ประวัติการรับ/ใช้คะแนน'}</h3>
                                            <History size={14} className="text-[#1A1A18] opacity-20" />
                                        </header>
                                        <div className="flex-1 divide-y divide-[#F0F0E8]/50 font-bold">
                                            {pointsHistory.map(log => (
                                                <div key={log.id} className="p-6 flex items-center justify-between font-bold hover:bg-gray-50/50 transition-all">
                                                    <div className="flex items-center gap-5 font-bold">
                                                        <div className={`w-8 h-8 flex items-center justify-center font-bold ${log.type === 'earn' ? 'bg-sage-50 text-sage-600' : 'bg-red-50 text-red-600'}`}>
                                                            {log.type === 'earn' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                        </div>
                                                        <div className="font-bold">
                                                            <div className="text-[10px] font-black uppercase tracking-tight text-[#1A1A18] leading-tight">{translateHistoryDescription(log.description, locale as string)}</div>
                                                            <div className="text-[7px] font-black text-gray-300 uppercase mt-0.5 tracking-[0.2em]">
                                                                {log.created_at ? new Date(log.created_at).toLocaleDateString('th-TH') : 'ไม่ระบุวัน'} • {log.type === 'earn' ? 'ได้รับเพิ่ม' : 'แลกใช้คะแนน'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`text-[12px] font-black font-bold tabular-nums ${log.type === 'earn' ? 'text-sage-600' : 'text-red-500'}`}>
                                                        {log.type === 'earn' ? '+' : '-'}{Math.abs(log.points)}
                                                    </div>
                                                </div>
                                            ))}
                                            {pointsHistory.length === 0 && (
                                                <div className="py-20 flex flex-col items-center justify-center text-[#8C8A81] opacity-30 font-bold">
                                                    <History size={24} className="mb-4" />
                                                    <p className="text-[8px] font-black uppercase tracking-widest">{locale === 'en' ? 'ไม่พบประวัติการใช้งาน' : locale === 'zh' ? 'ไม่พบประวัติการใช้งาน' : 'ไม่พบประวัติการใช้งาน'}</p>
                                                </div>
                                            )}
                                        </div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center font-bold bg-[#FAFAF9]/50 p-6 text-center">
                            <div className="relative mb-10">
                                <Users size={100} className="text-[#1A1A18] opacity-5 animate-pulse" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ShieldCheck size={35} className="text-[#1A1A18] opacity-10" />
                                </div>
                            </div>
                            <h3 className="font-serif-luxury text-4xl sm:text-5xl font-light tracking-tighter italic text-[#1A1A18] opacity-40 leading-none">{locale === 'en' ? 'เลือกข้อมูลสมาชิก' : locale === 'zh' ? 'เลือกข้อมูลสมาชิก' : 'เลือกข้อมูลสมาชิก'}</h3>
                            <p className="text-[9px] font-black tracking-[0.6em] uppercase mt-4 text-[#8C8A81] opacity-60">{locale === 'en' ? 'ระบบจัดการสมาชิก XYL Node' : locale === 'zh' ? 'ระบบจัดการสมาชิก XYL Node' : 'ระบบจัดการสมาชิก XYL Node'}</p>
                            
                            <div className="mt-12 flex flex-col items-center">
                                <Search size={20} className="text-gray-200 mb-4" />
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-300">{locale === 'en' ? 'กรุณาเลือกรายชื่อสมาชิกทางด้านซ้ายเพื่อดูประวัติและแก้ไขข้อมูล' : locale === 'zh' ? 'กรุณาเลือกรายชื่อสมาชิกทางด้านซ้ายเพื่อดูประวัติและแก้ไขข้อมูล' : 'กรุณาเลือกรายชื่อสมาชิกทางด้านซ้ายเพื่อดูประวัติและแก้ไขข้อมูล'}</p>
                            </div>
                        </div>
                    )}
                 </div>
            </div>

            
            {/* CRM Settings Modal */}
            {showCrmSettings && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
                    <div className="bg-white w-full max-w-7xl h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-sm font-bold text-gray-900">การตั้งค่า CRM & Loyalty</h2>
                            <button onClick={() => setShowCrmSettings(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors shadow-sm">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <CrmSettingsPage />
                        </div>
                    </div>
                </div>
            )}
            {showQR && (
                <div className="absolute inset-0 z-[150] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200 font-bold">
                    <button 
                        onClick={() => setShowQR(false)} 
                        className="absolute top-6 right-6 p-4 bg-gray-50 rounded-none hover:bg-gray-100 transition-all text-gray-400 hover:text-black"
                    >
                        <X size={20} />
                    </button>
                    
                    <div className="bg-white p-8 border border-gray-100 shadow-2xl rounded-2xl flex flex-col items-center gap-6">
                        <h4 className="text-xl font-black uppercase tracking-widest text-center">
                            {locale === 'en' ? 'Scan to Register' : locale === 'zh' ? '扫码注册' : 'แสกนเพื่อสมัครสมาชิก'}
                        </h4>
                        <div className="p-4 bg-gray-50 rounded-xl relative group">
                            <QRCodeCanvas
                                id="member-qr-canvas-manager"
                                value={`https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID || '2009322178-2dtfXAvi'}/liff/member`}
                                size={240}
                                level="H"
                                includeMargin={true}
                            />
                            <button
                                onClick={handleDownloadQR}
                                className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                            >
                                <Download size={14} /> Download
                            </button>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center max-w-[240px] mt-2">
                            {locale === 'en' ? 'Customers can scan this QR code with their LINE app to register as a member.' : locale === 'zh' ? '客户可以使用 LINE 应用扫描此二维码注册成为会员。' : 'ลูกค้าสามารถใช้แอปพลิเคชัน LINE แสกน QR Code นี้เพื่อสมัครสมาชิกได้ทันที'}
                        </p>
                    </div>
                </div>
            )}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Outfit:wght@200;300;400;500;900&family=Noto+Sans+Thai:wght@100;300;500;700;900&display=swap');
                .font-serif-luxury { font-family: 'Cormorant Garamond', serif; }
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
                body { font-family: 'Noto Sans Thai', 'Outfit', sans-serif; }
            `}</style>
     </div>
    )
}
