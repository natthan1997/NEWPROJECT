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
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
            <div className="flex-1 flex overflow-hidden font-medium">
                 {/* Sidebar List - Hidden on mobile if a member is selected */}
                 <div className={`${selectedMember ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] lg:w-[420px] border-r border-gray-100 flex-col h-full bg-gray-50/30 shrink-0 transition-all`}>
                    <header className="p-6 border-b border-gray-100 bg-white space-y-4">
                         <div className="flex items-center justify-between">
                             <h2 className="text-lg font-semibold text-gray-900">{locale === 'en' ? 'Members' : locale === 'zh' ? 'รายชื่อสมาชิก' : 'รายชื่อสมาชิก'}</h2>
                             <div className="flex gap-2 items-center">
                                 <button onClick={() => setShowQR(true)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors" title="QR สมัครสมาชิก">
                                     <QrCode size={18} />
                                 </button>
                                 <button onClick={() => setShowCrmSettings(true)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors" title="ตั้งค่า CRM & Loyalty">
                                     <Settings size={18} />
                                 </button>
                             </div>
                        </div>
                        <div className="relative group">
                           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                           <input 
                               type="text"
                               placeholder={locale === 'en' ? 'ค้นหาชื่อหรือเบอร์โทร...' : 'ค้นหาชื่อหรือเบอร์โทร...'}
                               className="h-12 w-full bg-gray-100/50 border border-transparent rounded-xl pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all"
                               value={searchTerm}
                               onChange={e => setSearchTerm(e.target.value)}
                           />
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading && customers.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-30">
                                <Loader2 className="animate-spin" size={32} />
                            </div>
                        ) : customers.length > 0 ? (
                            customers.map(member => {
                                const isNew = (new Date().getTime() - new Date(member.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
                                return (
                                <button 
                                    key={member.id}
                                    onClick={() => handleSelectMember(member)}
                                    className={`w-full group flex items-center justify-between p-4 border-b border-gray-100/50 transition-all text-left ${selectedMember?.id === member.id ? 'bg-white shadow-[inset_4px_0_0_0_#111827]' : 'hover:bg-white'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all overflow-hidden border ${selectedMember?.id === member.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                            {member.avatar_url ? (
                                                <img loading="lazy" src={member.avatar_url} alt={member.display_name || 'Member'} className="w-full h-full object-cover" />
                                            ) : (
                                                (member.display_name || member.full_name || 'M').slice(0, 1)
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                {member.full_name ? `${member.full_name} ${member.display_name && member.display_name !== member.full_name ? `(${member.display_name})` : ''}` : (member.display_name || 'สมาชิก')} 
                                                {isNew && <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-md font-bold">NEW</span>}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 flex flex-col gap-0.5">
                                                <span className="flex items-center gap-1.5"><Phone size={10} /> {member.phone || 'ไม่ระบุเบอร์'}</span>
                                                <span className="text-[10px] text-gray-400">สมัครเมื่อ: {member.created_at ? new Date(member.created_at).toLocaleDateString('th-TH', {day: 'numeric', month: 'short', year: 'numeric'}) : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                        <div className="flex items-baseline justify-end gap-1">
                                            <span className="text-sm font-semibold text-gray-900">{(member.points ?? 0).toLocaleString()}</span>
                                            <span className="text-[10px] text-gray-500">PTS</span>
                                        </div>
                                        {member.phone ? (
                                            <div className="text-[10px] text-emerald-600 mt-1 flex items-center justify-end gap-1 font-medium"><ShieldCheck size={10} /> {locale === 'en' ? 'Registered' : 'ลงทะเบียนแล้ว'}</div>
                                        ) : (
                                            <div className="text-[10px] text-amber-500 mt-1 flex items-center justify-end gap-1 font-medium"><ShieldAlert size={10} /> {locale === 'en' ? 'Unregistered' : 'ยังไม่ลงทะเบียน'}</div>
                                        )}
                                    </div>
                                </button>
                            )})
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-40 p-12 text-center">
                                <Users size={48} className="mb-4 text-gray-300" />
                                <p className="text-sm font-medium text-gray-500">{locale === 'en' ? 'No members found' : 'ไม่พบสมาชิกในระบบ'}</p>
                            </div>
                        )}
                    </div>
                 </div>

                 {/* Main Content */}
                 <div className={`${selectedMember ? 'flex' : 'hidden md:flex'} flex-1 bg-white flex-col overflow-y-auto custom-scrollbar relative transition-all`}>
                    {selectedMember ? (
                        <div className="min-h-full flex flex-col">
                            {/* Mobile Navigation Header */}
                            <div className="md:hidden p-4 border-b border-gray-100 bg-white sticky top-0 z-30 flex items-center">
                                <button 
                                    onClick={() => setSelectedMember(null)}
                                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors bg-gray-50 px-4 py-2 rounded-full"
                                >
                                    <ArrowLeft size={16} /> {locale === 'en' ? 'Back' : 'กลับ'}
                                </button>
                            </div>

                            {/* Portfolio Header */}
                            <header className="px-6 pt-10 sm:px-12 sm:pt-14 border-b border-gray-100 bg-white shrink-0">
                                <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 w-full">
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 w-full lg:w-auto">
                                        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-50 rounded-full flex items-center justify-center text-3xl font-medium text-gray-400 overflow-hidden shrink-0 shadow-sm border border-gray-100">
                                            {selectedMember.avatar_url ? (
                                                <img loading="lazy" src={selectedMember.avatar_url} alt={selectedMember.display_name || 'Member'} className="w-full h-full object-cover" />
                                            ) : (
                                                (selectedMember.display_name || selectedMember.full_name || 'M').slice(0, 1)
                                            )}
                                        </div>
                                        <div className="space-y-4 text-center sm:text-left flex-1">
                                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 leading-none">
                                                    {selectedMember.full_name ? `${selectedMember.full_name} ${selectedMember.display_name && selectedMember.display_name !== selectedMember.full_name ? `(${selectedMember.display_name})` : ''}` : (selectedMember.display_name || 'สมาชิก')}
                                                </h2>
                                                {getTierBadge(selectedMember.tier)}
                                                {selectedMember.title && <span className="px-2.5 py-1 bg-sage-50 text-sage-700 text-[11px] font-medium rounded-md">👑 {selectedMember.title}</span>}
                                            </div>
                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 text-sm font-medium text-gray-500">
                                                 <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {selectedMember.phone || 'ไม่ระบุเบอร์'}</div>
                                                 <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {selectedMember.email || 'ไม่ระบุอีเมล'}</div>
                                                 <div className="flex items-center gap-2">
                                                    <Award size={14} className="text-gray-400" /> 
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
                                </div>
                                
                                {/* Tab Navigation */}
                                <div className="flex gap-8 mt-10 max-w-5xl mx-auto overflow-x-auto no-scrollbar w-full border-b border-transparent">
                                    <button 
                                        onClick={() => setProfileTab('wallet')} 
                                        className={`pb-4 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${profileTab === 'wallet' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <div className="flex items-center gap-2"><LayoutGrid size={16}/> Wallet & Assets</div>
                                    </button>
                                    <button 
                                        onClick={() => setProfileTab('history')} 
                                        className={`pb-4 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${profileTab === 'history' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <div className="flex items-center gap-2"><History size={16}/> Points History</div>
                                    </button>
                                    <button 
                                        onClick={() => setProfileTab('edit')} 
                                        className={`pb-4 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${profileTab === 'edit' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <div className="flex items-center gap-2"><Edit2 size={16}/> Edit Profile</div>
                                    </button>
                                </div>
                            </header>

                             <div className="flex-1 p-6 sm:p-12 max-w-5xl mx-auto w-full bg-gray-50/30">
                                  {profileTab === 'edit' && (
                                      <div className="bg-white border border-gray-100 p-8 sm:p-10 space-y-8 rounded-2xl shadow-sm">
                                         <header className="flex justify-between items-center text-left">
                                             <h3 className="text-lg font-semibold text-gray-900">{locale === 'en' ? 'Edit Personal Information' : 'แก้ไขข้อมูลส่วนตัว'}</h3>
                                         </header>
                                         <div className="space-y-6">
                                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                 <div className="space-y-2">
                                                     <label className="text-xs font-medium text-gray-500 ml-1">{locale === 'en' ? 'Display Name' : 'ชื่อที่สมาชิกใช้แสดงผล'}</label>
                                                     <input 
                                                         className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                                                         value={editData.display_name || ''}
                                                         onChange={e => setEditData({...editData, display_name: e.target.value})}
                                                     />
                                                 </div>
                                                 <div className="space-y-2">
                                                     <label className="text-xs font-medium text-gray-500 ml-1">ฉายา / Title</label>
                                                     <input 
                                                         className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all text-sage-600"
                                                         value={editData.title || ''}
                                                         placeholder="เช่น ผู้พิทักษ์ป่า"
                                                         onChange={e => setEditData({...editData, title: e.target.value})}
                                                     />
                                                 </div>
                                             </div>
                                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                 <div className="space-y-2">
                                                     <label className="text-xs font-medium text-gray-500 ml-1">{locale === 'en' ? 'Full Name / Nickname' : 'ชื่อจริง/ชื่อเล่น (Nickname)'}</label>
                                                     <input 
                                                         className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                                                         value={editData.full_name || ''}
                                                         onChange={e => setEditData({...editData, full_name: e.target.value})}
                                                     />
                                                 </div>
                                                 <div className="space-y-2">
                                                     <label className="text-xs font-medium text-gray-500 ml-1">{locale === 'en' ? 'Phone Number' : 'เบอร์โทรศัพท์ติดต่อ'}</label>
                                                     <input 
                                                         className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                                                         value={editData.phone || ''}
                                                         onChange={e => setEditData({...editData, phone: e.target.value})}
                                                     />
                                                 </div>
                                             </div>
                                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                 <div className="space-y-2">
                                                     <label className="text-xs font-medium text-gray-500 ml-1">วันเกิด</label>
                                                     <input 
                                                         type="date"
                                                         className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                                                         value={editData.date_of_birth || ''}
                                                         onChange={e => setEditData({...editData, date_of_birth: e.target.value})}
                                                     />
                                                 </div>
                                                 <div className="space-y-2">
                                                     <label className="text-xs font-medium text-gray-500 ml-1">เพศ</label>
                                                     <select 
                                                         className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all appearance-none"
                                                         value={editData.gender || ''}
                                                         onChange={e => setEditData({...editData, gender: e.target.value})}
                                                     >
                                                         <option value="">ไม่ระบุ</option>
                                                         <option value="ชาย">ชาย</option>
                                                         <option value="หญิง">หญิง</option>
                                                     </select>
                                                 </div>
                                             </div>
                                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                                                 <div className="space-y-2">
                                                     <label className="text-xs font-medium text-gray-500 ml-1">{locale === 'en' ? 'Member Tier' : 'ระดับสิทธิ์สมาชิก'}</label>
                                                     <select 
                                                         className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all appearance-none"
                                                         value={editData.tier}
                                                         onChange={e => setEditData({...editData, tier: e.target.value})}
                                                     >
                                                         <option value="bronze">Bronze Core</option>
                                                         <option value="silver">Silver Tier</option>
                                                         <option value="gold">Gold Elite</option>
                                                         <option value="platinum">Platinum Prime</option>
                                                     </select>
                                                 </div>
                                                 <div className="space-y-2">
                                                     <label className="text-xs font-medium text-gray-500 ml-1">{locale === 'en' ? 'Available Points' : 'คะแนนสะสมคงเหลือ'}</label>
                                                     <input 
                                                         type="number"
                                                         className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                                                         value={editData.points ?? 0}
                                                         onChange={e => setEditData({...editData, points: parseInt(e.target.value) || 0})}
                                                     />
                                                 </div>
                                             </div>

                                             {(editData.points ?? 0) !== (selectedMember.points ?? 0) && (
                                                 <div className="space-y-3 bg-amber-50 border border-amber-200 p-5 rounded-xl animate-in fade-in duration-300">
                                                     <div className="flex items-center justify-between flex-wrap gap-2">
                                                         <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                                                             <ShieldAlert size={16} />
                                                             ยืนยันการปรับปรุงแต้มสะสม
                                                         </h4>
                                                         <div className="flex items-center gap-2 text-sm font-medium">
                                                             <span className="text-gray-500 line-through">{(selectedMember.points ?? 0).toLocaleString()}</span>
                                                             <ArrowLeft size={14} className="text-amber-500 rotate-180" />
                                                             <span className="text-amber-700 font-bold">{(editData.points ?? 0).toLocaleString()}</span>
                                                         </div>
                                                     </div>
                                                     <input 
                                                         className="w-full h-10 bg-white border border-amber-300 rounded-lg px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-amber-300/60"
                                                         placeholder="* กรุณาระบุเหตุผล เช่น: ปรับปรุงแต้มตกหล่นจากออเดอร์..."
                                                         value={pointsReason}
                                                         onChange={e => setPointsReason(e.target.value)}
                                                     />
                                                 </div>
                                             )}
                                             
                                             <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                                 <button 
                                                     onClick={handleSave}
                                                     disabled={isSaving}
                                                     className="flex-1 h-12 bg-gray-900 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
                                                 >
                                                     {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                                     {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                                                 </button>
                                             </div>
                                         </div>
                                      </div>
                                  )}

                                  {profileTab === 'wallet' && (
                                     <div className="space-y-8 sm:space-y-12">
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                             <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm flex flex-col justify-between aspect-[2/1] relative overflow-hidden group">
                                                 <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
                                                 <div>
                                                     <p className="text-xs font-medium text-gray-500 mb-1">{locale === 'en' ? 'Current Points' : 'คะแนนสะสม'}</p>
                                                     <div className="flex items-baseline gap-2">
                                                         <h3 className="text-4xl font-semibold text-gray-900">{(selectedMember.points ?? 0).toLocaleString()}</h3>
                                                         <span className="text-sm font-medium text-gray-400">PTS</span>
                                                     </div>
                                                 </div>
                                                 <div className="flex items-center gap-3">
                                                    <button onClick={() => setProfileTab('history')} className="text-xs font-medium text-gray-900 bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">
                                                        ดูประวัติคะแนน
                                                    </button>
                                                 </div>
                                             </div>
                                             
                                             {/* Gacha Trigger */}
                                             <div onClick={() => alert("Gacha Feature Coming Soon!")} className="bg-emerald-50 border border-emerald-100 p-8 rounded-2xl shadow-sm flex flex-col justify-between aspect-[2/1] relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                                                 <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl -z-10 group-hover:bg-emerald-200/50 transition-colors duration-500"></div>
                                                 <div className="absolute -bottom-2 -right-2 text-emerald-200 opacity-50 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                                                     <Gift size={100} strokeWidth={1} />
                                                 </div>
                                                 <div className="relative z-10">
                                                     <p className="text-xs font-medium text-emerald-700 mb-1">XYL Gacha System</p>
                                                     <h3 className="text-2xl font-semibold text-emerald-900">สุ่มรางวัลและภารกิจ</h3>
                                                     <p className="text-xs font-medium text-emerald-600/70 mt-2 max-w-[200px]">แตะที่นี่เพื่อสุ่ม Gacha พิเศษสำหรับสมาชิกคนนี้</p>
                                                 </div>
                                                 <div className="relative z-10 mt-4 flex items-center text-sm font-semibold text-emerald-700 gap-1 group-hover:gap-2 transition-all">
                                                     หมุน Gacha เลย <ChevronRight size={16} />
                                                 </div>
                                             </div>
                                         </div>

                                         <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                    <Ticket size={20} className="text-gray-400" /> My Coupons
                                                </h3>
                                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                                    <button 
                                                        onClick={() => setCouponTab('active')}
                                                        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${couponTab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                    >
                                                        คูปองที่ใช้ได้
                                                    </button>
                                                    <button 
                                                        onClick={() => setCouponTab('used')}
                                                        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${couponTab === 'used' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                    >
                                                        ประวัติการใช้
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {memberCoupons.filter(c => c.status === couponTab).length > 0 ? (
                                                    memberCoupons.filter(c => c.status === couponTab).map(coupon => (
                                                        <div key={coupon.id} className={`p-5 rounded-2xl border ${couponTab === 'active' ? 'bg-white border-emerald-100 shadow-sm hover:border-emerald-200' : 'bg-gray-50 border-gray-200 opacity-60'} transition-all flex flex-col justify-between min-h-[120px] relative overflow-hidden`}>
                                                            {couponTab === 'active' && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>}
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${couponTab === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                                                                        {coupon.coupon_type}
                                                                    </span>
                                                                </div>
                                                                <h4 className="text-sm font-semibold text-gray-900">{coupon.coupon_name}</h4>
                                                                <p className="text-xs text-gray-500 mt-1">ได้รับเมื่อ: {new Date(coupon.created_at).toLocaleDateString('th-TH')}</p>
                                                            </div>
                                                            {couponTab === 'active' && (
                                                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                                                    <button 
                                                                        onClick={() => handleUseCoupon(coupon)}
                                                                        className="text-xs font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors"
                                                                    >
                                                                        นำไปใช้เป็นส่วนลด
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-span-1 sm:col-span-2 py-12 flex flex-col items-center justify-center text-gray-400 bg-white border border-gray-100 border-dashed rounded-2xl">
                                                        <Ticket size={32} className="mb-3 opacity-50" />
                                                        <p className="text-sm font-medium">ไม่มีคูปอง{couponTab === 'active' ? 'ที่สามารถใช้ได้' : 'ในประวัติ'}</p>
                                                    </div>
                                                )}
                                            </div>
                                         </div>
                                     </div>
                                  )}

                                  {profileTab === 'history' && (
                                      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                          <div className="p-6 border-b border-gray-100">
                                              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><History size={20} className="text-gray-400" /> Points History</h3>
                                          </div>
                                          <div className="divide-y divide-gray-50">
                                              {pointsHistory.length > 0 ? (
                                                  pointsHistory.map(history => (
                                                      <div key={history.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                                          <div className="flex items-center gap-4">
                                                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${history.type === 'earn' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                  {history.type === 'earn' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                              </div>
                                                              <div>
                                                                  <div className="text-sm font-medium text-gray-900">{translateHistoryDescription(history.description, locale)}</div>
                                                                  <div className="text-xs text-gray-500 mt-0.5">{new Date(history.created_at).toLocaleString('th-TH')}</div>
                                                              </div>
                                                          </div>
                                                          <div className={`text-sm font-semibold whitespace-nowrap ${history.type === 'earn' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                              {history.type === 'earn' ? '+' : '-'}{history.points}
                                                          </div>
                                                      </div>
                                                  ))
                                              ) : (
                                                  <div className="p-12 text-center text-sm font-medium text-gray-400">
                                                      ไม่มีประวัติคะแนนสะสม
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  )}
                             </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col bg-gray-50/50 p-6 sm:p-12 overflow-y-auto custom-scrollbar">
                            <div className="w-full max-w-4xl mx-auto space-y-8">
                                {/* Dashboard Header */}
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-2xl font-semibold text-gray-900">Members Dashboard</h3>
                                    <p className="text-sm font-medium text-gray-500">ภาพรวมข้อมูลสมาชิกในระบบของคุณ</p>
                                </div>

                                {/* KPI Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-6 text-gray-100 group-hover:scale-110 transition-transform"><Users size={64}/></div>
                                        <p className="text-xs font-medium text-gray-500 mb-4 relative z-10">Total Members</p>
                                        <h4 className="text-4xl font-semibold text-gray-900 relative z-10">{memberStats.total}</h4>
                                    </div>
                                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-6 text-emerald-100 group-hover:scale-110 transition-transform"><ShieldCheck size={64}/></div>
                                        <p className="text-xs font-medium text-emerald-700 mb-4 relative z-10">Registered</p>
                                        <h4 className="text-4xl font-semibold text-emerald-900 relative z-10">{memberStats.registered}</h4>
                                    </div>
                                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-6 text-amber-100 group-hover:scale-110 transition-transform"><ShieldAlert size={64}/></div>
                                        <p className="text-xs font-medium text-amber-700 mb-4 relative z-10">Unregistered</p>
                                        <h4 className="text-4xl font-semibold text-amber-900 relative z-10">{memberStats.unregistered}</h4>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Gender Demographics Chart */}
                                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-8 flex items-center gap-2"><LayoutGrid size={16} className="text-gray-400"/> สัดส่วนเพศ (Demographics)</h4>
                                        
                                        {(() => {
                                            const male = customers.filter(c => c.gender === 'ชาย').length;
                                            const female = customers.filter(c => c.gender === 'หญิง').length;
                                            const unknown = customers.length - male - female;
                                            const total = customers.length || 1;
                                            
                                            const malePct = Math.round((male / total) * 100);
                                            const femalePct = Math.round((female / total) * 100);
                                            const unknownPct = 100 - malePct - femalePct;

                                            return (
                                                <div className="flex flex-col sm:flex-row items-center gap-10 mt-auto mb-auto">
                                                    <div 
                                                        className="w-40 h-40 rounded-full relative shadow-inner shrink-0"
                                                        style={{
                                                            background: `conic-gradient(
                                                                #475569 0% ${malePct}%, 
                                                                #E11D48 ${malePct}% ${malePct + femalePct}%, 
                                                                #F3F4F6 ${malePct + femalePct}% 100%
                                                            )`
                                                        }}
                                                    >
                                                        <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center flex-col shadow-sm">
                                                            <Users size={24} className="text-gray-300" />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col w-full gap-4">
                                                        <div className="flex items-center justify-between text-sm font-medium">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-3 h-3 rounded-full bg-[#475569]"></div>
                                                                <span className="text-gray-700">ชาย (Male)</span>
                                                            </div>
                                                            <span className="text-gray-900 font-semibold">{malePct}%</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-sm font-medium">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-3 h-3 rounded-full bg-[#E11D48]"></div>
                                                                <span className="text-gray-700">หญิง (Female)</span>
                                                            </div>
                                                            <span className="text-gray-900 font-semibold">{femalePct}%</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-sm font-medium">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                                                                <span className="text-gray-500">ไม่ระบุ</span>
                                                            </div>
                                                            <span className="text-gray-500 font-semibold">{unknownPct}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Recent Signups */}
                                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2"><Award size={16} className="text-gray-400"/> สมาชิกสมัครใหม่ล่าสุด (New Signups)</h4>
                                        <div className="flex flex-col gap-2">
                                            {customers.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).map(member => (
                                                <button 
                                                    key={member.id}
                                                    onClick={() => handleSelectMember(member)}
                                                    className="flex items-center gap-4 text-left group hover:bg-gray-50 p-3 rounded-xl transition-colors border border-transparent hover:border-gray-100"
                                                >
                                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-500 overflow-hidden border border-gray-200 shrink-0">
                                                        {member.avatar_url ? (
                                                            <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            (member.display_name || member.full_name || 'M').slice(0,1)
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                                                            {member.display_name || member.full_name || 'สมาชิก'}
                                                        </div>
                                                        <div className="text-xs font-medium text-gray-500 mt-0.5">
                                                            สมัครเมื่อ: {new Date(member.created_at).toLocaleDateString('th-TH')}
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                                </button>
                                            ))}
                                            {customers.length === 0 && (
                                                <div className="text-sm font-medium text-gray-400 text-center py-8">ไม่มีข้อมูล</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                 </div>

            </div>

            {/* QR Code Modal */}
            {showQR && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-xl w-[90%] max-w-sm p-8 flex flex-col items-center relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full transition-colors"><X size={16}/></button>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Code สมัครสมาชิก</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">ให้ลูกค้าสแกนเพื่อสมัครสมาชิกด้วยตัวเองผ่าน LINE</p>
                        
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
                            <QRCodeCanvas
                                id="member-qr-canvas-manager"
                                value={`https://line.me/R/ti/p/@xylstudio?text=${encodeURIComponent('สมัครสมาชิก')}`}
                                size={200}
                                bgColor={"#ffffff"}
                                fgColor={"#111827"}
                                level={"Q"}
                            />
                        </div>

                        <button 
                            onClick={handleDownloadQR}
                            className="w-full h-12 bg-gray-900 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                        >
                            <Download size={16} /> บันทึกภาพ QR Code
                        </button>
                    </div>
                </div>
            )}

            {/* CRM Settings Modal */}
            {showCrmSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowCrmSettings(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full z-10 transition-colors"><X size={18}/></button>
                        <div className="flex-1 overflow-y-auto">
                            <CrmSettingsPage />
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap');
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                body { font-family: 'Noto Sans Thai', 'Outfit', sans-serif; }
            `}</style>
     </div>
    )
}
