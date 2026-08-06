'use client';
import React, { useState, useEffect } from 'react'
import { 
  Users, Search, UserPlus, Phone, Mail, Award, History, 
  ChevronRight, ArrowLeft, Loader2, Save, X, Edit2, 
  TrendingUp, TrendingDown, Star, LayoutGrid, List,
  Coffee, Sparkles, CheckCircle2, ShieldCheck, UserCheck, Settings, Gift, Tag, QrCode, Download, ShieldAlert, Ticket
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
    const [memberStats, setMemberStats] = useState({ total: 0, registered: 0, unregistered: 0 })
    const [selectedMember, setSelectedMember] = useState<Customer | null>(null)
    const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([])
    const [memberCoupons, setMemberCoupons] = useState<Coupon[]>([])
    const [couponTab, setCouponTab] = useState<'active' | 'used'>('active')
    const [profileTab, setProfileTab] = useState<'wallet' | 'history' | 'edit'>('wallet')
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editData, setEditData] = useState<Partial<Customer>>({})
    const [searchTerm, setSearchTerm] = useState('')
    const [showCrmSettings, setShowCrmSettings] = useState(false)
    const [showQR, setShowQR] = useState(false)
    const [pointsReason, setPointsReason] = useState<string>('')

    useEffect(() => {
        fetchMembers()
        fetchMemberStats()
        
        const channel = supabase.channel('pos_members_manager_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_members' }, () => {
                fetchMembers()
                fetchMemberStats()
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
                query = query.order('points', { ascending: false }).limit(100)
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

    const fetchMemberStats = async () => {
        const branchId = shopSettings?.shared_member_branch_id || shopSettings?.branch_id
        
        let totalQuery = supabase.from('pos_members').select('*', { count: 'exact', head: true })
        if (branchId) totalQuery = totalQuery.or(`branch_id.eq.${branchId},branch_id.is.null`)
        else totalQuery = totalQuery.is('branch_id', null)
        const { count: total } = await totalQuery
        
        let unregQuery = supabase.from('pos_members').select('*', { count: 'exact', head: true }).is('phone', null)
        if (branchId) unregQuery = unregQuery.or(`branch_id.eq.${branchId},branch_id.is.null`)
        else unregQuery = unregQuery.is('branch_id', null)
        const { count: unregistered } = await unregQuery
        
        setMemberStats({
            total: total || 0,
            registered: (total || 0) - (unregistered || 0),
            unregistered: unregistered || 0
        })
    }

    const fetchCoupons = async (memberId: string) => {
        const { data } = await supabase
            .from('pos_member_coupons')
            .select('*')
            .eq('member_id', memberId)
            .in('status', ['active', 'used'])
            .order('created_at', { ascending: false })
        
        if (data) setMemberCoupons(data)
        else setMemberCoupons([])
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
        setProfileTab('wallet')
        setPointsReason('')
        setPointsHistory([])
        setMemberCoupons([])
        fetchHistory(member.id)
        fetchCoupons(member.id)
    }

    const handleSave = async () => {
        if (!selectedMember) return
        const originalPoints = selectedMember.points ?? 0
        const newPoints = editData.points ?? 0
        const isPointsChanged = originalPoints !== newPoints

        if (isPointsChanged && !pointsReason.trim()) {
            alert('กรุณาระบุเหตุผลในการปรับปรุงแต้มสะสมสมาชิก')
            return
        }

        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('pos_members')
                .update({
                    display_name: editData.display_name || editData.full_name,
                    full_name: editData.full_name,
                    phone: editData.phone,
                    email: editData.email,
                    points: newPoints,
                    tier: editData.tier,
                    title: editData.title,
                    date_of_birth: editData.date_of_birth,
                    gender: editData.gender,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedMember.id)
            
            if (error) throw error

            if (isPointsChanged) {
                const pointsDiff = newPoints - originalPoints
                const changeType = pointsDiff > 0 ? 'earn' : 'redeem'
                const staffName = profile?.full_name || profile?.display_name || 'พนักงาน'
                const reasonText = pointsReason.trim()
                const desc = `ปรับปรุงแต้มโดย ${staffName}: ${reasonText} (${pointsDiff > 0 ? '+' : ''}${pointsDiff} แต้ม)`

                const historyObj = {
                    member_id: selectedMember.id,
                    points: Math.abs(pointsDiff),
                    points_change: pointsDiff,
                    type: changeType,
                    description: desc,
                    branch_id: shopSettings?.branch_id || null,
                    created_at: new Date().toISOString()
                }

                const { error: histError } = await supabase
                    .from('pos_points_history')
                    .insert(historyObj)

                if (histError && histError.message.includes('column "description" of relation "pos_points_history" does not exist')) {
                    delete historyObj.description
                    await supabase.from('pos_points_history').insert(historyObj)
                }
            }

            fetchMembers()
            setIsEditing(false)
            setPointsReason('')
            const updatedMember = { ...selectedMember, ...editData, points: newPoints }
            setSelectedMember(updatedMember)
            fetchHistory(selectedMember.id)
            alert('บันทึกข้อมูลสมาชิกสำเร็จ')
        } catch (err) {
            console.error('Update member error:', err)
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูลสมาชิก: ' + err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const translateHistoryDescription = (desc, locale) => {
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

    const getTierBadge = (tier) => {
        const safeTier = (tier || 'general').toLowerCase();
        const colors = {
            general: 'bg-gray-100 text-gray-600',
            bronze: 'bg-amber-100 text-amber-700',
            silver: 'bg-slate-100 text-slate-700',
            gold: 'bg-yellow-100 text-yellow-700',
            platinum: 'bg-indigo-100 text-indigo-700'
        }
        const thaiTier = {
            general: 'ทั่วไป',
            bronze: 'BRONZE',
            silver: 'SILVER',
            gold: 'GOLD',
            platinum: 'PLATINUM'
        }
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${colors[safeTier] || 'bg-gray-100 text-gray-500'}`}>
                {thaiTier[safeTier] || safeTier}
            </span>
        )
    }


    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50/30">
            {!selectedMember ? (
                // Full Width Member List
                <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
                    <header className="px-6 py-8 border-b border-gray-200 bg-white shadow-sm z-10">
                        <div className="max-w-7xl mx-auto w-full">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                 <div>
                                     <h2 className="text-2xl font-bold text-gray-900">{locale === 'en' ? 'Members Management' : 'จัดการสมาชิก'}</h2>
                                     <p className="text-sm text-gray-500 mt-1">{locale === 'en' ? 'Manage your store members and loyalty' : 'จัดการข้อมูลสมาชิกร้านค้าและระบบสมาชิก'}</p>
                                 </div>
                                 <div className="flex flex-wrap gap-3 items-center">
                                     <button onClick={() => setShowQR(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm">
                                         <QrCode size={18} /> QR รับสมัคร
                                     </button>
                                     <button onClick={() => setShowCrmSettings(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-black rounded-xl transition-all shadow-sm">
                                         <Settings size={18} /> ตั้งค่า CRM
                                     </button>
                                 </div>
                            </div>

                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex flex-wrap gap-4">
                                    <div className="bg-gray-50 border border-gray-200 px-5 py-3 rounded-2xl flex items-center gap-4 min-w-[140px]">
                                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500"><Users size={18}/></div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-semibold mb-0.5">ทั้งหมด</div>
                                            <div className="text-xl font-bold text-gray-900 leading-none">{memberStats.total}</div>
                                        </div>
                                    </div>
                                    <div className="bg-emerald-50 border border-emerald-100 px-5 py-3 rounded-2xl flex items-center gap-4 min-w-[140px]">
                                        <div className="w-10 h-10 rounded-full bg-white border border-emerald-100 flex items-center justify-center text-emerald-600"><ShieldCheck size={18}/></div>
                                        <div>
                                            <div className="text-xs text-emerald-600 font-semibold mb-0.5">ลงทะเบียนแล้ว</div>
                                            <div className="text-xl font-bold text-emerald-700 leading-none">{memberStats.registered}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="relative group w-full lg:w-[480px]">
                                   <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                                   <input 
                                       type="text"
                                       placeholder={locale === 'en' ? 'ค้นหาชื่อหรือเบอร์โทร...' : 'ค้นหาชื่อหรือเบอร์โทร...'}
                                       className="h-14 w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 text-sm font-medium outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all shadow-sm"
                                       value={searchTerm}
                                       onChange={e => setSearchTerm(e.target.value)}
                                   />
                                </div>
                            </div>
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                        <div className="max-w-7xl mx-auto w-full">
                            {loading && customers.length === 0 ? (
                                <div className="h-[400px] flex flex-col items-center justify-center opacity-40">
                                    <Loader2 className="animate-spin text-gray-500 mb-4" size={40} />
                                    <p className="text-sm font-medium text-gray-500">กำลังโหลดข้อมูล...</p>
                                </div>
                            ) : customers.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {customers.map(member => {
                                        const isNew = (new Date().getTime() - new Date(member.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
                                        return (
                                        <button
                                            key={member.id}
                                            onClick={() => handleSelectMember(member)}
                                            className="bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-lg hover:-translate-y-1 hover:border-gray-300 transition-all text-left flex flex-col gap-6 group"
                                        >
                                            <div className="flex items-start gap-4 w-full">
                                                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold bg-gray-50 border border-gray-100 text-gray-400 shrink-0 overflow-hidden shadow-sm">
                                                    {member.avatar_url ? (
                                                        <img loading="lazy" src={member.avatar_url} alt={member.display_name || 'Member'} className="w-full h-full object-cover" />
                                                    ) : (
                                                        (member.display_name || member.full_name || 'M').slice(0, 1)
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 pt-1">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <h3 className="text-base font-bold text-gray-900 truncate pr-2 leading-tight">
                                                            {member.full_name || member.display_name || 'สมาชิก'}
                                                        </h3>
                                                        {getTierBadge(member.tier)}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-1.5 truncate">
                                                        <Phone size={14}/> {member.phone || 'ไม่ระบุ'}
                                                    </div>
                                                    {isNew && <span className="inline-block mt-2 bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide">NEW MEMBER</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-5 border-t border-gray-100 mt-auto">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Points</span>
                                                    <span className="text-xl font-black text-gray-900 leading-none">{(member.points ?? 0).toLocaleString()}</span>
                                                </div>
                                                {member.phone ? (
                                                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1.5"><ShieldCheck size={14}/> Registered</span>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1.5"><ShieldAlert size={14}/> Unregistered</span>
                                                )}
                                            </div>
                                        </button>
                                    )})}
                                </div>
                            ) : (
                                <div className="h-[400px] flex flex-col items-center justify-center opacity-50 text-center">
                                    <Users size={64} className="mb-6 text-gray-300" />
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{locale === 'en' ? 'No members found' : 'ไม่พบรายชื่อสมาชิก'}</h3>
                                    <p className="text-sm font-medium text-gray-500">ลองค้นหาด้วยคำอื่น หรือกด QR รับสมัครเพื่อเพิ่มสมาชิกใหม่</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // Full Width Profile View
                <div className="flex-1 flex flex-col h-full bg-white overflow-hidden animate-in slide-in-from-right-4 duration-300 relative z-20">
                    <header className="px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-30 flex items-center gap-6 shadow-sm">
                        <button 
                            onClick={() => setSelectedMember(null)}
                            className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{locale === 'en' ? 'Member Profile' : 'โปรไฟล์สมาชิก'}</h2>
                            <p className="text-[11px] text-gray-500 font-medium">ID: {selectedMember.id.split('-')[0]}</p>
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="max-w-5xl mx-auto w-full p-6 md:p-10">
                            {/* Profile Header */}
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10 mb-10">
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-50 flex items-center justify-center text-4xl font-bold text-gray-400 overflow-hidden shrink-0 shadow-md border-4 border-white ring-1 ring-gray-100">
                                    {selectedMember.avatar_url ? (
                                        <img loading="lazy" src={selectedMember.avatar_url} alt={selectedMember.display_name || 'Member'} className="w-full h-full object-cover" />
                                    ) : (
                                        (selectedMember.display_name || selectedMember.full_name || 'M').slice(0, 1)
                                    )}
                                </div>
                                <div className="flex-1 text-center md:text-left space-y-4">
                                    <div className="flex flex-col md:flex-row items-center gap-4">
                                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-none">
                                            {selectedMember.full_name ? `${selectedMember.full_name} ${selectedMember.display_name && selectedMember.display_name !== selectedMember.full_name ? `(${selectedMember.display_name})` : ''}` : (selectedMember.display_name || 'สมาชิก')}
                                        </h2>
                                        {getTierBadge(selectedMember.tier)}
                                        {selectedMember.title && <span className="px-3 py-1 bg-sage-50 text-sage-700 text-xs font-semibold rounded-lg border border-sage-100">👑 {selectedMember.title}</span>}
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm font-medium text-gray-600 bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 inline-flex">
                                         <div className="flex items-center gap-2"><Phone size={16} className="text-gray-400" /> {selectedMember.phone || 'ไม่ระบุเบอร์'}</div>
                                         <div className="flex items-center gap-2"><Mail size={16} className="text-gray-400" /> {selectedMember.email || 'ไม่ระบุอีเมล'}</div>
                                         <div className="flex items-center gap-2">
                                            <Award size={16} className="text-gray-400" /> 
                                            {locale === 'en' ? 'Joined ' : 'เข้าร่วมปี '}{selectedMember.created_at ? new Date(selectedMember.created_at).getFullYear() : '2026'}
                                         </div>
                                         {selectedMember.gender && (
                                             <div className="flex items-center gap-2">
                                                👤 {selectedMember.gender}
                                             </div>
                                         )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Tab Navigation */}
                            <div className="flex gap-2 mb-8 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100 overflow-x-auto no-scrollbar">
                                <button 
                                    onClick={() => setProfileTab('wallet')} 
                                    className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold rounded-xl transition-all ${profileTab === 'wallet' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
                                >
                                    <LayoutGrid size={18}/> Wallet & Assets
                                </button>
                                <button 
                                    onClick={() => setProfileTab('history')} 
                                    className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold rounded-xl transition-all ${profileTab === 'history' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
                                >
                                    <History size={18}/> Points History
                                </button>
                                <button 
                                    onClick={() => {
                                        setProfileTab('edit')
                                        setEditData(selectedMember)
                                    }} 
                                    className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold rounded-xl transition-all ${profileTab === 'edit' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
                                >
                                    <Edit2 size={18}/> Edit Profile
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="min-h-[400px]">
                                {profileTab === 'wallet' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between aspect-[2/1] relative overflow-hidden group hover:shadow-2xl transition-all">
                                                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform"><Award size={80} /></div>
                                                <div className="relative z-10">
                                                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2 block">{locale === 'en' ? 'Available Points' : 'คะแนนสะสมคงเหลือ'}</span>
                                                    <div className="text-5xl font-black mb-1">{(selectedMember.points ?? 0).toLocaleString()}</div>
                                                    <span className="text-sm font-medium text-gray-400">PTS</span>
                                                </div>
                                            </div>
                                            
                                            <div onClick={() => alert("Gacha Feature Coming Soon!")} className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl shadow-sm flex flex-col justify-between aspect-[2/1] relative overflow-hidden group cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all">
                                                <div className="absolute top-0 right-0 p-6 opacity-40 group-hover:scale-110 transition-transform"><Ticket size={80} className="text-emerald-200" /></div>
                                                <div className="relative z-10">
                                                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 mb-2 block">{locale === 'en' ? 'Gacha Tickets' : 'ตั๋วสุ่มกาชา'}</span>
                                                    <div className="text-5xl font-black text-emerald-700 mb-1">{(selectedMember.gacha_tickets ?? 0).toLocaleString()}</div>
                                                    <span className="text-sm font-medium text-emerald-600">Tickets</span>
                                                </div>
                                                <div className="absolute bottom-6 right-6 text-emerald-700 font-bold text-sm bg-white/60 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                                                    สุ่มกาชา <ChevronRight size={14} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                                            <header className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-sage-100 text-sage-600 flex items-center justify-center rounded-xl shadow-inner">
                                                        <Gift size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-gray-900">{locale === 'en' ? 'Coupons' : 'คูปองของฉัน'}</h3>
                                                        <p className="text-xs font-medium text-gray-500">{memberCoupons.length} {locale === 'en' ? 'Total Coupons' : 'รายการทั้งหมด'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 bg-gray-200/50 p-1 rounded-xl">
                                                   <button
                                                      onClick={() => setCouponTab('active')}
                                                      className={`px-4 py-2 text-xs font-bold transition-all rounded-lg ${couponTab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                   >
                                                      {locale === 'en' ? 'Unused' : 'ยังไม่ได้ใช้'} ({memberCoupons.filter(c => c.status === 'active').length})
                                                   </button>
                                                   <button
                                                      onClick={() => setCouponTab('used')}
                                                      className={`px-4 py-2 text-xs font-bold transition-all rounded-lg ${couponTab === 'used' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                   >
                                                      {locale === 'en' ? 'Used' : 'ใช้งานแล้ว'} ({memberCoupons.filter(c => c.status === 'used').length})
                                                   </button>
                                                </div>
                                            </header>
                                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {memberCoupons.filter(c => c.status === couponTab).length === 0 ? (
                                                    <div className="col-span-full py-12 flex flex-col items-center justify-center opacity-40">
                                                        <Ticket size={48} className="mb-4 text-gray-400" />
                                                        <p className="text-sm font-medium text-gray-500">{locale === 'en' ? 'No coupons in this category' : 'ไม่มีคูปองในหมวดหมู่นี้'}</p>
                                                    </div>
                                                ) : (
                                                    memberCoupons.filter(c => c.status === couponTab).map(coupon => (
                                                        <div key={coupon.id} className={`border rounded-2xl p-5 flex gap-4 ${coupon.status === 'active' ? 'border-sage-200 bg-sage-50/30 hover:border-sage-300' : 'border-gray-200 bg-gray-50 opacity-70'} transition-all`}>
                                                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${coupon.status === 'active' ? 'bg-sage-100 text-sage-600' : 'bg-gray-200 text-gray-500'}`}>
                                                                <Tag size={24} />
                                                            </div>
                                                            <div className="flex-1 flex flex-col justify-center">
                                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                                    <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{coupon.reward_name}</h4>
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${coupon.status === 'active' ? 'bg-sage-100 text-sage-700' : 'bg-gray-200 text-gray-600'}`}>
                                                                        {coupon.status === 'active' ? 'พร้อมใช้งาน' : 'ใช้แล้ว'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs font-medium text-gray-500 mt-1">Code: {coupon.code}</p>
                                                                {coupon.used_at && (
                                                                    <p className="text-[10px] font-medium text-gray-400 mt-2">
                                                                        ใช้เมื่อ: {new Date(coupon.used_at).toLocaleDateString('th-TH')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {profileTab === 'history' && (
                                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div className="p-6 md:p-8 space-y-6">
                                            {pointsHistory.length === 0 ? (
                                                <div className="py-12 flex flex-col items-center justify-center opacity-40">
                                                    <History size={48} className="mb-4 text-gray-400" />
                                                    <p className="text-sm font-medium text-gray-500">ไม่มีประวัติแต้ม</p>
                                                </div>
                                            ) : (
                                                <div className="relative border-l-2 border-gray-100 ml-4 space-y-8">
                                                    {pointsHistory.map((history, idx) => (
                                                        <div key={idx} className="relative pl-8 group">
                                                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125 ${history.points_change > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-900 leading-tight mb-1">{translateHistoryDescription(history.description, locale)}</p>
                                                                    <p className="text-xs font-medium text-gray-500 flex items-center gap-2">
                                                                        {new Date(history.created_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                                                                    </p>
                                                                </div>
                                                                <div className={`flex items-center gap-1 font-black text-lg ${history.points_change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                    {history.points_change > 0 ? '+' : ''}{history.points_change} 
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pt-1">PTS</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {profileTab === 'edit' && (
                                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600 ml-1">{locale === 'en' ? 'Display Name' : 'ชื่อที่แสดงผล'}</label>
                                                <input 
                                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-all"
                                                    value={editData.display_name || ''}
                                                    onChange={e => setEditData({...editData, display_name: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600 ml-1">ฉายา / Title</label>
                                                <input 
                                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-all text-sage-700"
                                                    value={editData.title || ''}
                                                    placeholder="เช่น ผู้พิทักษ์ป่า"
                                                    onChange={e => setEditData({...editData, title: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600 ml-1">{locale === 'en' ? 'Full Name' : 'ชื่อจริง-นามสกุล'}</label>
                                                <input 
                                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-all"
                                                    value={editData.full_name || ''}
                                                    onChange={e => setEditData({...editData, full_name: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600 ml-1">{locale === 'en' ? 'Phone Number' : 'เบอร์โทรศัพท์ติดต่อ'}</label>
                                                <input 
                                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-all"
                                                    value={editData.phone || ''}
                                                    onChange={e => setEditData({...editData, phone: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600 ml-1">วันเกิด</label>
                                                <input 
                                                    type="date"
                                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-all"
                                                    value={editData.date_of_birth || ''}
                                                    onChange={e => setEditData({...editData, date_of_birth: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600 ml-1">เพศ</label>
                                                <select 
                                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-all"
                                                    value={editData.gender || ''}
                                                    onChange={e => setEditData({...editData, gender: e.target.value})}
                                                >
                                                    <option value="">ไม่ระบุ</option>
                                                    <option value="ชาย">ชาย</option>
                                                    <option value="หญิง">หญิง</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600 ml-1">{locale === 'en' ? 'Member Tier' : 'ระดับสิทธิ์สมาชิก'}</label>
                                                <select 
                                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-all"
                                                    value={editData.tier}
                                                    onChange={e => setEditData({...editData, tier: e.target.value})}
                                                >
                                                    <option value="bronze">Bronze</option>
                                                    <option value="silver">Silver</option>
                                                    <option value="gold">Gold</option>
                                                    <option value="platinum">Platinum</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600 ml-1">{locale === 'en' ? 'Points Balance' : 'คะแนนสะสมคงเหลือ'}</label>
                                                <input 
                                                    type="number"
                                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-all"
                                                    value={editData.points ?? 0}
                                                    onChange={e => setEditData({...editData, points: parseInt(e.target.value) || 0})}
                                                />
                                            </div>
                                        </div>

                                        {(editData.points ?? 0) !== (selectedMember.points ?? 0) && (
                                            <div className="bg-amber-50/80 border border-amber-200 p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-300">
                                                <div className="flex items-center justify-between gap-4 mb-4">
                                                    <label className="text-xs font-bold text-amber-900 flex items-center gap-2">
                                                        <ShieldAlert size={16} className="text-amber-600" />
                                                        เหตุผลในการปรับปรุงแต้ม <span className="text-red-500 font-bold">*จำเป็น</span>
                                                    </label>
                                                    <span className="text-xs font-bold text-amber-700 bg-amber-100/50 px-3 py-1 rounded-lg">
                                                        แต้มเดิม: {(selectedMember.points ?? 0).toLocaleString()} ➔ ใหม่: {(editData.points ?? 0).toLocaleString()}
                                                    </span>
                                                </div>
                                                <input 
                                                    type="text"
                                                    placeholder="เช่น คืนแต้มให้ลูกค้าจากบิลตกหล่น, ปรับแก้แต้มผิดพลาด ฯลฯ"
                                                    className="w-full h-12 bg-white border border-amber-300 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-amber-950 placeholder:text-amber-400/80 shadow-sm"
                                                    value={pointsReason}
                                                    onChange={e => setPointsReason(e.target.value)}
                                                />
                                                <div className="text-xs font-semibold text-amber-800 flex items-center justify-between gap-4 mt-3 pl-1">
                                                    <span>จะบันทึกประวัติการปรับปรุงแต้มนี้ลงในประวัติของสมาชิก</span>
                                                    <span className={(editData.points ?? 0) >= (selectedMember.points ?? 0) ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                                                        ผลต่าง: {(editData.points ?? 0) - (selectedMember.points ?? 0) > 0 ? '+' : ''}{(editData.points ?? 0) - (selectedMember.points ?? 0)} แต้ม
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="pt-4 flex justify-end">
                                            <button 
                                                disabled={isSaving}
                                                onClick={handleSave}
                                                className="h-12 px-8 bg-gray-900 text-white text-sm font-bold rounded-xl shadow-md hover:bg-black hover:shadow-lg transition-all flex items-center justify-center gap-3 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> {locale === 'en' ? 'Save Changes' : 'บันทึกการเปลี่ยนแปลง'}</>}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* QR Code Modal */}
            {showQR && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-[90%] max-w-sm p-8 flex flex-col items-center relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full transition-colors hover:bg-gray-100"><X size={18}/></button>
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-900"><QrCode size={24}/></div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">QR Code สมัครสมาชิก</h3>
                        <p className="text-sm font-medium text-gray-500 text-center mb-8">ให้ลูกค้าสแกนเพื่อสมัครสมาชิกด้วยตัวเองผ่าน LINE</p>
                        
                        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-8">
                            <QRCodeCanvas
                                id="member-qr-canvas-manager"
                                value={`https://line.me/R/ti/p/@xylstudio?text=${encodeURIComponent('สมัครสมาชิก')}`}
                                size={220}
                                bgColor={"#ffffff"}
                                fgColor={"#111827"}
                                level={"Q"}
                            />
                        </div>

                        <button 
                            onClick={handleDownloadQR}
                            className="w-full h-14 bg-gray-900 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-md hover:shadow-lg"
                        >
                            <Download size={18} /> บันทึกภาพ QR Code
                        </button>
                    </div>
                </div>
            )}

            {/* CRM Settings Modal */}
            {showCrmSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-300">
                        <button onClick={() => setShowCrmSettings(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full z-10 transition-colors shadow-sm"><X size={18}/></button>
                        <div className="flex-1 overflow-y-auto">
                            <CrmSettingsPage />
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Thai:wght@300;400;500;600;700;800&display=swap');
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                body { font-family: 'Noto Sans Thai', 'Outfit', sans-serif; }
            `}</style>
        </div>
    )
}
