'use client';
import React, { useState, useEffect } from 'react'
import { 
  Users, Search, UserPlus, Phone, Mail, Award, History, 
  ChevronRight, ArrowLeft, Loader2, Save, X, Edit2, 
  TrendingUp, TrendingDown, Star, LayoutGrid, List,
  Coffee, Sparkles, CheckCircle2, ShieldCheck, UserCheck, Settings, Gift, Tag, QrCode, Download, ShieldAlert, Ticket,
  User, MoreVertical, Shield, BadgeCheck, Crown, Info, Calendar, Percent
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useI18n } from "@/lib/I18nContext";
import { QRCodeCanvas } from 'qrcode.react';
import { buildMemberSearchFilter, formatPhoneDisplay } from '@/lib/phoneUtils';
import CrmSettingsPage from '@/app/dashboard/admin/pos-settings/crm/page';

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
    const [showAddModal, setShowAddModal] = useState(false)
    const [newMemberData, setNewMemberData] = useState({
      fullName: '',
      phone: '',
      points: 4,
      reason: 'สะสมแต้มจากการสั่งซื้อ'
    })
    const [isCreatingMember, setIsCreatingMember] = useState(false)

    const handleCreateNewMember = async () => {
      if (!newMemberData.phone.trim() || newMemberData.phone.length < 9) {
        alert('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (อย่างน้อย 9 หลัก)');
        return;
      }
      
      let formattedPhone = newMemberData.phone.trim();
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+66' + formattedPhone.slice(1);
      } else if (!formattedPhone.startsWith('+66')) {
        formattedPhone = '+66' + formattedPhone;
      }

      setIsCreatingMember(true);
      try {
        const { data: existing } = await supabase
          .from('pos_members')
          .select('id, full_name, display_name, phone, points')
          .eq('phone', formattedPhone)
          .maybeSingle();

        if (existing) {
          alert(`เบอร์นี้มีในระบบแล้ว! (ชื่อ: ${existing.full_name || existing.display_name || 'ลูกค้า'}) คุณสามารถค้นหาและปรับคะแนนในรายการสมาชิกได้ทันที`);
          setSelectedMember(existing as any);
          setEditData(existing as any);
          setShowAddModal(false);
          return;
        }

        const pointsNum = Number(newMemberData.points) || 0;
        const nameStr = newMemberData.fullName.trim() || 'ลูกค้าเบอร์ ' + formattedPhone;

        const { data: createdMember, error: createErr } = await supabase
          .from('pos_members')
          .insert([{
            line_user_id: 'phone_' + formattedPhone.replace(/[^\d]/g, ''),
            display_name: nameStr,
            full_name: nameStr,
            phone: formattedPhone,
            points: pointsNum,
            total_accumulated_points: pointsNum,
            branch_id: shopSettings?.branch_id || null,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (createErr) throw createErr;

        if (createdMember && pointsNum > 0) {
          const staffName = profile?.full_name || profile?.display_name || 'พนักงาน';
          const historyObj: any = {
            member_id: createdMember.id,
            points: pointsNum,
            points_change: pointsNum,
            type: 'earn',
            description: `เพิ่มสมาชิกใหม่และให้แต้มโดย ${staffName}: ${newMemberData.reason} (+${pointsNum} แต้ม)`,
            branch_id: shopSettings?.branch_id || null,
            created_at: new Date().toISOString()
          };
          try {
            const { error: histErr } = await supabase.from('pos_points_history').insert(historyObj);
            if (histErr && histErr.message.includes('column "description" of relation "pos_points_history" does not exist')) {
              delete historyObj.description;
              await supabase.from('pos_points_history').insert(historyObj);
            }
          } catch (e) {
            console.warn('History insert warning:', e);
          }
        }

        alert(`สร้างสมาชิกใหม่สำเร็จ! ได้รับ ${pointsNum} แต้มเรียบร้อยแล้ว`);
        setShowAddModal(false);
        setNewMemberData({ fullName: '', phone: '', points: 4, reason: 'สะสมแต้มจากการสั่งซื้อ' });
        fetchMembers();
        if (createdMember) {
          handleSelectMember(createdMember as any);
        }
      } catch (err: any) {
        console.error('Error creating member:', err);
        alert('เกิดข้อผิดพลาดในการสร้างสมาชิก: ' + (err?.message || err));
      } finally {
        setIsCreatingMember(false);
      }
    };

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
                query = query.or(buildMemberSearchFilter(searchTerm))
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
        if (!confirm('ยืนยันการใช้คูปองนี้ใช่หรือไม่? คูปองจะถูกนำไปเป็นส่วนลดในบิลหน้าขายทันที')) return;
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('applyPOSCoupon', { detail: coupon }));
        }
        alert('นำคูปองไปประยุกต์ใช้สำเร็จ! ระบบนำท่านไปยังหน้าเลือกสินค้าเรียบร้อยแล้ว');
        if (onSetView) {
            onSetView('terminal');
        }
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
                    tier_level: editData.tier,
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
        if (desc.startsWith('Claimed via QR Code')) {
            if (desc.includes('Order #')) {
                const orderNum = desc.split('#')[1]?.replace(')', '') || '';
                return locale === 'en' ? `Claimed via QR Code (Order #${orderNum})` : locale === 'zh' ? `通过二维码领取 (订单 #${orderNum})` : `สแกนรับแต้มจาก QR Code (ออเดอร์ #${orderNum})`;
            }
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


    const totalDisplay = customers.length;
    const maleCount = customers.filter(c => c.gender === 'ชาย').length;
    const femaleCount = customers.filter(c => c.gender === 'หญิง').length;
    const unknownCount = totalDisplay - maleCount - femaleCount;
    
    const malePct = totalDisplay ? Math.round((maleCount / totalDisplay) * 100) : 0;
    const femalePct = totalDisplay ? Math.round((femaleCount / totalDisplay) * 100) : 0;
    const unknownPct = totalDisplay ? Math.round((unknownCount / totalDisplay) * 100) : 0;
    
    // SVG stroke-dasharray calculations
    const mDash = `${malePct} ${100 - malePct}`;
    const fDash = `${femalePct} ${100 - femalePct}`;
    const uDash = `${unknownPct} ${100 - unknownPct}`;
    
    const mOffset = 25; // start at top
    const fOffset = 25 - malePct;
    const uOffset = fOffset - femalePct;

    const sortedByDate = [...customers].sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
    });
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const currentMonth = today.getMonth();

    let newCustomers = sortedByDate.filter(c => c.created_at && new Date(c.created_at) >= today);
    if (newCustomers.length === 0 && sortedByDate.length > 0) {
        newCustomers = sortedByDate.slice(0, 2); 
    }
    const newCustomerIds = new Set(newCustomers.map(c => c.id));

    const birthdayCustomers = sortedByDate.filter(c => {
        if (!c.date_of_birth) return false;
        try {
            const parts = c.date_of_birth.split('-');
            if (parts.length >= 2) {
                const month = parseInt(parts[1], 10) - 1;
                return month === currentMonth;
            }
            return false;
        } catch {
            return false;
        }
    });
    const birthdayCustomerIds = new Set(birthdayCustomers.map(c => c.id));

    const otherCustomers = sortedByDate.filter(c => !newCustomerIds.has(c.id) && !birthdayCustomerIds.has(c.id));

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white font-noto">
            {!selectedMember ? (
                // Split View: Left Stats, Right List
                <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden animate-in fade-in duration-300 w-full bg-white">
                    
                    {/* LEFT SIDEBAR: Executive Clean Dashboard Stats */}
                    <div className="w-full md:w-[240px] lg:w-[280px] border-r border-gray-100 p-6 lg:p-8 flex flex-col gap-6 bg-white overflow-y-auto shrink-0 relative z-10 custom-scrollbar">
                        <div className="text-[11px] font-bold text-gray-400 tracking-[0.1em] uppercase">ภาพรวมสมาชิก</div>

                        {/* Member Total Metric */}
                        <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-5 flex flex-col gap-1 transition-all hover:border-gray-200">
                            <div className="text-[12px] font-medium text-gray-500">สมาชิกทั้งหมด</div>
                            <div className="text-4xl lg:text-5xl font-light text-black tracking-tight mt-0.5">
                                {memberStats.total.toLocaleString()}
                            </div>
                        </div>
                        
                        {/* Registration Status Breakdown - Colorized Green & Orange Cards */}
                        <div className="flex flex-col gap-2.5">
                            {/* Registered Card */}
                            <div className="flex items-center justify-between bg-emerald-50/60 border border-emerald-100/80 rounded-2xl px-4 py-3.5 transition-all hover:bg-emerald-50">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                                    <span className="text-[13px] font-medium text-emerald-950">ลงทะเบียนแล้ว</span>
                                </div>
                                <span className="text-xl font-bold text-emerald-600 leading-none">
                                    {memberStats.registered.toLocaleString()}
                                </span>
                            </div>

                            {/* Unregistered Card */}
                            <div className="flex items-center justify-between bg-amber-50/60 border border-amber-100/80 rounded-2xl px-4 py-3.5 transition-all hover:bg-amber-50">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></div>
                                    <span className="text-[13px] font-medium text-amber-950">ยังไม่ลงทะเบียน</span>
                                </div>
                                <span className="text-xl font-bold text-amber-600 leading-none">
                                    {memberStats.unregistered.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Gender Ratio Donut */}
                        <div className="bg-gray-50/50 border border-gray-100/80 rounded-2xl p-5 flex flex-col gap-4">
                            <div className="text-[11px] font-bold text-gray-400 tracking-[0.1em] uppercase">สัดส่วนเพศ</div>
                            <div className="flex flex-col items-center gap-5">
                                {/* SVG Donut */}
                                <div className="w-[100px] h-[100px] relative shrink-0">
                                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                        <circle r="15.91549430918954" cx="18" cy="18" fill="transparent" stroke="#F3F4F6" strokeWidth="3"></circle>
                                        {malePct > 0 && <circle r="15.91549430918954" cx="18" cy="18" fill="transparent" stroke="#111827" strokeWidth="3" strokeDasharray={mDash} strokeDashoffset={mOffset}></circle>}
                                        {femalePct > 0 && <circle r="15.91549430918954" cx="18" cy="18" fill="transparent" stroke="#9CA3AF" strokeWidth="3" strokeDasharray={fDash} strokeDashoffset={fOffset}></circle>}
                                        {unknownPct > 0 && <circle r="15.91549430918954" cx="18" cy="18" fill="transparent" stroke="#E5E7EB" strokeWidth="3" strokeDasharray={uDash} strokeDashoffset={uOffset}></circle>}
                                    </svg>
                                </div>
                                {/* Legend */}
                                <div className="flex flex-col gap-2.5 w-full">
                                    <div className="flex items-center justify-between text-[13px]">
                                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                                            <div className="w-2 h-2 rounded-full bg-gray-900"></div> ชาย
                                        </div>
                                        <span className="text-black font-semibold">{malePct}%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[13px]">
                                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                                            <div className="w-2 h-2 rounded-full bg-gray-400"></div> หญิง
                                        </div>
                                        <span className="text-black font-semibold">{femalePct}%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[13px]">
                                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                                            <div className="w-2 h-2 rounded-full bg-gray-200"></div> ไม่ระบุ
                                        </div>
                                        <span className="text-black font-semibold">{unknownPct}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Ultra Clean List */}
                    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
                        {/* Clean Search Bar */}
                        <div className="px-6 lg:px-10 pt-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
                            <div className="relative w-full max-w-lg">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="ค้นหาชื่อ หรือ เบอร์โทรศัพท์..."
                                    className="h-12 w-full bg-gray-50/50 border border-gray-200 rounded-full pl-12 pr-6 text-[14px] outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all text-black placeholder:text-gray-400"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="flex items-center justify-center w-12 h-12 text-white bg-[#1A1A18] hover:bg-black rounded-full transition-all shadow-sm active:scale-95 shrink-0"
                                    title="เพิ่มสมาชิกใหม่"
                                >
                                    <UserPlus size={20} />
                                </button>
                                <button onClick={() => setShowQR(true)} className="flex items-center justify-center w-12 h-12 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition-all" title="QR Code ร้าน">
                                    <QrCode size={20} />
                                </button>
                                <button onClick={() => setShowCrmSettings(true)} className="flex items-center justify-center w-12 h-12 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition-all" title="ตั้งค่า CRM">
                                    <Settings size={20} />
                                </button>
                            </div>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 lg:px-10 pb-12">
                            {loading && customers.length === 0 ? (
                                <div className="py-32 flex flex-col items-center justify-center opacity-40">
                                    <Loader2 className="animate-spin text-black mb-4" size={40} />
                                    <p className="text-sm font-medium text-gray-500">กำลังโหลดข้อมูล...</p>
                                </div>
                            ) : customers.length > 0 ? (
                                <div className="mt-4">
                                    {/* Minimalist Table Header */}
                                    <div className="flex items-center gap-3 lg:gap-4 px-2 py-3 border-b border-gray-100 text-[11px] font-semibold text-gray-400 tracking-wider">
                                        <div className="flex-1 min-w-0">ข้อมูลสมาชิก</div>
                                        <div className="w-[90px] shrink-0 hidden lg:block text-center">วันที่สมัคร</div>
                                        <div className="w-[60px] shrink-0 text-center">คะแนน</div>
                                        <div className="w-[100px] shrink-0 text-right">สถานะ</div>
                                    </div>

                                    <div className="flex flex-col">
                                        {/* Birthday Customers Section */}
                                        {birthdayCustomers.length > 0 && (
                                            <>
                                                <div className="px-2 pt-8 pb-2 text-[12px] font-bold text-amber-600 flex items-center gap-2">
                                                    🎂 เกิดเดือนนี้
                                                </div>
                                                {birthdayCustomers.map(member => (
                                                    <button 
                                                        key={member.id} 
                                                        onClick={() => handleSelectMember(member)} 
                                                        className="w-full flex items-center gap-3 lg:gap-4 py-4 px-2 hover:bg-amber-50/50 rounded-2xl transition-colors text-left group"
                                                    >
                                                        <div className="flex-1 flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-900 overflow-hidden shrink-0 font-medium border border-amber-200">
                                                                {member.avatar_url ? (
                                                                    <img loading="lazy" src={member.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    (member.display_name || member.full_name || 'M').slice(0, 1)
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                    <div className="text-[14px] lg:text-[15px] font-semibold text-black break-words leading-tight whitespace-normal">
                                                                        {member.full_name || member.display_name || 'สมาชิก'}
                                                                    </div>
                                                                    {member.title && (
                                                                        <span className="shrink-0 text-[9px] lg:text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{member.title}</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[12px] lg:text-[13px] text-gray-500 truncate mt-0.5">
                                                                    {member.phone ? member.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') : '-'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Date hidden on small and medium screens to give name more space */}
                                                        <div className="w-[90px] shrink-0 hidden lg:flex flex-col items-center justify-center text-[13px] text-gray-500">
                                                            {member.created_at ? (
                                                                <>
                                                                    <span>{new Date(member.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                                                                    <span className="text-[11px] text-gray-400">{new Date(member.created_at).getFullYear() + 543}</span>
                                                                </>
                                                            ) : '-'}
                                                        </div>
                                                        
                                                        <div className="w-[60px] shrink-0 text-center">
                                                            <span className="text-[14px] lg:text-[15px] font-medium text-black">{(member.points ?? 0).toLocaleString()}</span>
                                                        </div>
                                                        
                                                        <div className="w-[100px] shrink-0 flex justify-end">
                                                            {member.phone ? (
                                                                <span className="text-[11px] lg:text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 lg:px-3 py-1 rounded-full shrink-0">
                                                                    ลงทะเบียนแล้ว
                                                                </span>
                                                            ) : (
                                                                <span className="text-[11px] lg:text-[12px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 lg:px-3 py-1 rounded-full shrink-0">
                                                                    ยังไม่ลงทะเบียน
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                                <div className="my-2 border-b border-gray-100 mx-2"></div>
                                            </>
                                        )}

                                        {/* New Customers Section */}
                                        {newCustomers.length > 0 && (
                                            <>
                                                <div className="px-2 pt-8 pb-2 text-[12px] font-bold text-black flex items-center gap-2">
                                                    สมัครใหม่วันนี้
                                                </div>
                                                {newCustomers.map(member => (
                                                    <button 
                                                        key={member.id} 
                                                        onClick={() => handleSelectMember(member)} 
                                                        className="w-full flex items-center gap-3 lg:gap-4 py-4 px-2 hover:bg-gray-50 rounded-2xl transition-colors text-left group"
                                                    >
                                                        <div className="flex-1 flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 overflow-hidden shrink-0 font-medium border border-gray-200">
                                                                {member.avatar_url ? (
                                                                    <img loading="lazy" src={member.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    (member.display_name || member.full_name || 'M').slice(0, 1)
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                    <div className="text-[14px] lg:text-[15px] font-semibold text-black break-words leading-tight whitespace-normal">
                                                                        {member.full_name || member.display_name || 'สมาชิก'}
                                                                    </div>
                                                                    {member.title && (
                                                                        <span className="shrink-0 text-[9px] lg:text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{member.title}</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[12px] lg:text-[13px] text-gray-500 truncate mt-0.5">
                                                                    {member.phone ? member.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') : '-'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Date hidden on small and medium screens to give name more space */}
                                                        <div className="w-[90px] shrink-0 hidden lg:flex flex-col items-center justify-center text-[13px] text-gray-500">
                                                            {member.created_at ? (
                                                                <>
                                                                    <span>{new Date(member.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                                                                    <span className="text-[11px] text-gray-400">{new Date(member.created_at).getFullYear() + 543}</span>
                                                                </>
                                                            ) : '-'}
                                                        </div>
                                                        
                                                        <div className="w-[60px] shrink-0 text-center">
                                                            <span className="text-[14px] lg:text-[15px] font-medium text-black">{(member.points ?? 0).toLocaleString()}</span>
                                                        </div>
                                                        
                                                        <div className="w-[100px] shrink-0 flex justify-end">
                                                            {member.phone ? (
                                                                <span className="text-[11px] lg:text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 lg:px-3 py-1 rounded-full shrink-0">
                                                                    ลงทะเบียนแล้ว
                                                                </span>
                                                            ) : (
                                                                <span className="text-[11px] lg:text-[12px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 lg:px-3 py-1 rounded-full shrink-0">
                                                                    ยังไม่ลงทะเบียน
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                                <div className="my-2 border-b border-gray-100 mx-2"></div>
                                            </>
                                        )}

                                        {/* All Other Customers Section */}
                                        {otherCustomers.length > 0 && (
                                            <>
                                                <div className="px-2 pt-6 pb-2 text-[12px] font-medium text-gray-400">
                                                    สมาชิกทั้งหมด
                                                </div>
                                                {otherCustomers.map(member => (
                                                    <button 
                                                        key={member.id} 
                                                        onClick={() => handleSelectMember(member)} 
                                                        className="w-full flex items-center gap-3 lg:gap-4 py-4 px-2 hover:bg-gray-50 rounded-2xl transition-colors text-left group"
                                                    >
                                                        <div className="flex-1 flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 overflow-hidden shrink-0 font-medium border border-gray-200">
                                                                {member.avatar_url ? (
                                                                    <img loading="lazy" src={member.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    (member.display_name || member.full_name || 'M').slice(0, 1)
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                    <div className="text-[14px] lg:text-[15px] font-semibold text-black break-words leading-tight whitespace-normal">
                                                                        {member.full_name || member.display_name || 'สมาชิก'}
                                                                    </div>
                                                                    {member.title && (
                                                                        <span className="shrink-0 text-[9px] lg:text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{member.title}</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[12px] lg:text-[13px] text-gray-500 truncate mt-0.5">
                                                                    {member.phone ? member.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') : '-'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Date hidden on small and medium screens to give name more space */}
                                                        <div className="w-[90px] shrink-0 hidden lg:flex flex-col items-center justify-center text-[13px] text-gray-500">
                                                            {member.created_at ? (
                                                                <>
                                                                    <span>{new Date(member.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                                                                    <span className="text-[11px] text-gray-400">{new Date(member.created_at).getFullYear() + 543}</span>
                                                                </>
                                                            ) : '-'}
                                                        </div>
                                                        
                                                        <div className="w-[60px] shrink-0 text-center">
                                                            <span className="text-[14px] lg:text-[15px] font-medium text-black">{(member.points ?? 0).toLocaleString()}</span>
                                                        </div>
                                                        
                                                        <div className="w-[100px] shrink-0 flex justify-end">
                                                            {member.phone ? (
                                                                <span className="text-[11px] lg:text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 lg:px-3 py-1 rounded-full shrink-0">
                                                                    ลงทะเบียนแล้ว
                                                                </span>
                                                            ) : (
                                                                <span className="text-[11px] lg:text-[12px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 lg:px-3 py-1 rounded-full shrink-0">
                                                                    ยังไม่ลงทะเบียน
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-32 flex flex-col items-center justify-center opacity-30 text-center">
                                    <Users size={48} className="mb-4 text-black" />
                                    <h3 className="text-[15px] font-semibold text-black mb-1">ไม่พบรายชื่อสมาชิก</h3>
                                    <p className="text-[13px] text-gray-500">ลองค้นหาด้วยคำอื่น หรือเพิ่มสมาชิกใหม่</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // Full Width Profile View
                <div className="flex-1 flex flex-col h-full bg-white overflow-hidden animate-in slide-in-from-right-4 duration-300 relative z-20">
                    <header className="px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-30 flex items-center gap-6">
                        <button 
                            onClick={() => setSelectedMember(null)}
                            className="flex items-center justify-center w-10 h-10 rounded-full text-black hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-[16px] font-semibold text-black">{locale === 'en' ? 'Member Profile' : 'โปรไฟล์สมาชิก'}</h2>
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="max-w-4xl mx-auto w-full p-6 md:p-10 lg:p-12">
                            
                            {/* NEW COMPACT PROFILE HEADER */}
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gray-50 flex items-center justify-center text-3xl font-light text-gray-300 overflow-hidden shrink-0 border border-gray-200">
                                    {selectedMember.avatar_url ? (
                                        <img loading="lazy" src={selectedMember.avatar_url} alt={selectedMember.display_name || 'Member'} className="w-full h-full object-cover" />
                                    ) : (
                                        (selectedMember.display_name || selectedMember.full_name || 'M').slice(0, 1)
                                    )}
                                </div>
                                <div className="flex-1 text-center md:text-left space-y-3">
                                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                                        <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight break-words whitespace-normal leading-tight">
                                            {selectedMember.full_name ? `${selectedMember.full_name} ${selectedMember.display_name && selectedMember.display_name !== selectedMember.full_name ? `(${selectedMember.display_name})` : ''}` : (selectedMember.display_name || 'สมาชิก')}
                                        </h2>
                                        {getTierBadge(selectedMember.tier)}
                                        {selectedMember.title && <span className="shrink-0 px-2.5 py-0.5 bg-gray-100 text-black text-[10px] font-semibold rounded-full uppercase tracking-wider">{selectedMember.title}</span>}
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-[13px] text-gray-500">
                                         <div className="flex items-center gap-1.5"><Phone size={14} className="text-gray-400" /> {selectedMember.phone || 'ไม่ระบุเบอร์'}</div>
                                         <span className="text-gray-300 hidden md:inline">|</span>
                                         <div className="flex items-center gap-1.5"><Mail size={14} className="text-gray-400" /> {selectedMember.email || 'ไม่ระบุอีเมล'}</div>
                                         <span className="text-gray-300 hidden md:inline">|</span>
                                         <div className="flex items-center gap-1.5">
                                            <Calendar size={14} className="text-gray-400" /> {locale === 'en' ? 'Joined ' : 'เข้าร่วมปี '}{selectedMember.created_at ? new Date(selectedMember.created_at).getFullYear() + 543 : '2569'}
                                         </div>
                                    </div>
                                </div>
                            </div>

                            {/* COMPACT STATS GRID */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                                <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest block mb-2">{locale === 'en' ? 'Points' : 'คะแนนสะสม'}</span>
                                    <div className="text-2xl md:text-3xl font-semibold text-black">{(selectedMember.points ?? 0).toLocaleString()}</div>
                                </div>
                                <div onClick={() => alert("Gacha Feature Coming Soon!")} className="bg-gray-50/80 hover:bg-gray-100 cursor-pointer transition-colors p-5 rounded-2xl border border-gray-100">
                                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest block mb-2">{locale === 'en' ? 'Gacha' : 'ตั๋วสุ่มกาชา'}</span>
                                    <div className="text-2xl md:text-3xl font-semibold text-black">{(selectedMember.gacha_tickets ?? 0).toLocaleString()} <span className="text-sm font-normal text-gray-400 ml-0.5">ใบ</span></div>
                                </div>
                                <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest block mb-2">{locale === 'en' ? 'Tier' : 'ระดับชั้น'}</span>
                                    <div className="text-xl md:text-2xl font-semibold text-black capitalize">{selectedMember.tier || 'General'}</div>
                                </div>
                                <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest block mb-2">{locale === 'en' ? 'Status' : 'สถานะ'}</span>
                                    <div className="text-xl md:text-2xl font-semibold text-black">{selectedMember.phone ? (locale === 'en' ? 'Registered' : 'ลงทะเบียนแล้ว') : (locale === 'en' ? 'Guest' : 'ไม่ลงทะเบียน')}</div>
                                </div>
                            </div>
                            
                            {/* Tab Navigation Minimalist */}
                            <div className="flex gap-8 mb-8 border-b border-gray-100 overflow-x-auto no-scrollbar">
                                <button 
                                    onClick={() => setProfileTab('wallet')} 
                                    className={`pb-4 text-[13px] font-medium whitespace-nowrap transition-colors ${profileTab === 'wallet' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    คูปองของฉัน (Coupons)
                                </button>
                                <button 
                                    onClick={() => setProfileTab('history')} 
                                    className={`pb-4 text-[13px] font-medium whitespace-nowrap transition-colors ${profileTab === 'history' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    ประวัติคะแนน (History)
                                </button>
                                <button 
                                    onClick={() => {
                                        setProfileTab('edit')
                                        setEditData(selectedMember)
                                    }} 
                                    className={`pb-4 text-[13px] font-medium whitespace-nowrap transition-colors ${profileTab === 'edit' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    แก้ไขข้อมูล (Edit)
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="min-h-[300px]">
                                {profileTab === 'wallet' && (
                                    <div className="animate-in fade-in duration-300">
                                        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                            <h3 className="text-[16px] font-semibold text-black">{locale === 'en' ? 'Coupons' : 'คูปองของฉัน'} <span className="text-gray-400 text-[13px] font-normal ml-2">({memberCoupons.length})</span></h3>
                                            <div className="flex gap-4 bg-gray-50 p-1 rounded-full border border-gray-100">
                                                <button
                                                    onClick={() => setCouponTab('active')}
                                                    className={`text-[12px] px-4 py-1.5 rounded-full transition-colors ${couponTab === 'active' ? 'bg-white text-black font-semibold shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    {locale === 'en' ? 'Unused' : 'ยังไม่ได้ใช้'}
                                                </button>
                                                <button
                                                    onClick={() => setCouponTab('used')}
                                                    className={`text-[12px] px-4 py-1.5 rounded-full transition-colors ${couponTab === 'used' ? 'bg-white text-black font-semibold shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    {locale === 'en' ? 'Used' : 'ใช้งานแล้ว'}
                                                </button>
                                            </div>
                                        </header>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {memberCoupons.filter(c => c.status === couponTab).length === 0 ? (
                                                <div className="col-span-full py-16 flex flex-col items-center justify-center opacity-40">
                                                    <Ticket size={32} className="mb-4 text-gray-400" />
                                                    <p className="text-[13px] text-gray-500">{locale === 'en' ? 'No coupons in this category' : 'ไม่มีคูปองในหมวดหมู่นี้'}</p>
                                                </div>
                                            ) : (
                                                memberCoupons.filter(c => c.status === couponTab).map(coupon => (
                                                    <div key={coupon.id} className={`border border-gray-100 rounded-2xl p-5 flex items-center justify-between gap-4 ${coupon.status === 'active' ? 'bg-white hover:border-gray-300 transition-colors' : 'bg-gray-50 opacity-60'}`}>
                                                        <div className="flex gap-4 items-center">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${coupon.status === 'active' ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                                {coupon.discount_type === 'percent' ? <Percent size={20} /> : <Tag size={20} />}
                                                            </div>
                                                            <div className="flex flex-col justify-center">
                                                                <h4 className="text-[15px] font-semibold text-black mb-0.5">{coupon.coupon_name || 'คูปองปริศนา'}</h4>
                                                                <p className="text-[12px] text-gray-500">
                                                                    ส่วนลด: <span className="font-semibold text-black">{coupon.discount_value} {coupon.discount_type === 'percent' ? '%' : '฿'}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {coupon.status === 'active' && (
                                                            <button 
                                                                onClick={() => handleUseCoupon(coupon)} 
                                                                className="shrink-0 px-4 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-black text-[12px] font-semibold rounded-full transition-colors"
                                                            >
                                                                ใช้งาน
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {profileTab === 'history' && (
                                    <div className="animate-in fade-in duration-300">
                                        <div className="space-y-4">
                                            {pointsHistory.length === 0 ? (
                                                <div className="py-16 flex flex-col items-center justify-center opacity-40">
                                                    <History size={32} className="mb-4 text-gray-400" />
                                                    <p className="text-[13px] text-gray-500">ไม่มีประวัติแต้ม</p>
                                                </div>
                                            ) : (
                                                pointsHistory.map((history, idx) => (
                                                    <div key={idx} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-white">
                                                        <div>
                                                            <p className="text-[14px] font-medium text-black mb-1">{translateHistoryDescription(history.description, locale)}</p>
                                                            <p className="text-[12px] text-gray-400">
                                                                {new Date(history.created_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                                                            </p>
                                                        </div>
                                                        <div className={`text-lg font-semibold ${history.points_change > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                            {history.points_change > 0 ? '+' : ''}{history.points_change} 
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {profileTab === 'edit' && (
                                    <div className="space-y-8 animate-in fade-in duration-300 bg-gray-50/50 p-6 md:p-8 rounded-3xl border border-gray-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-medium text-gray-500 pl-1">{locale === 'en' ? 'Display Name' : 'ชื่อที่แสดงผล'}</label>
                                                <input 
                                                    className="w-full h-12 border border-gray-200 bg-white rounded-xl px-4 text-[14px] outline-none focus:border-black transition-colors text-black"
                                                    value={editData.display_name || ''}
                                                    onChange={e => setEditData({...editData, display_name: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-medium text-gray-500 pl-1">ฉายา / Title</label>
                                                <input 
                                                    className="w-full h-12 border border-gray-200 bg-white rounded-xl px-4 text-[14px] outline-none focus:border-black transition-colors text-black"
                                                    value={editData.title || ''}
                                                    placeholder="เช่น ผู้พิทักษ์ป่า"
                                                    onChange={e => setEditData({...editData, title: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-medium text-gray-500 pl-1">{locale === 'en' ? 'Full Name' : 'ชื่อจริง-นามสกุล'}</label>
                                                <input 
                                                    className="w-full h-12 border border-gray-200 bg-white rounded-xl px-4 text-[14px] outline-none focus:border-black transition-colors text-black"
                                                    value={editData.full_name || ''}
                                                    onChange={e => setEditData({...editData, full_name: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-medium text-gray-500 pl-1">{locale === 'en' ? 'Phone Number' : 'เบอร์โทรศัพท์ติดต่อ'}</label>
                                                <input 
                                                    className="w-full h-12 border border-gray-200 bg-white rounded-xl px-4 text-[14px] outline-none focus:border-black transition-colors text-black"
                                                    value={editData.phone || ''}
                                                    onChange={e => setEditData({...editData, phone: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-medium text-gray-500 pl-1">วันเกิด</label>
                                                <input 
                                                    type="date"
                                                    className="w-full h-12 border border-gray-200 bg-white rounded-xl px-4 text-[14px] outline-none focus:border-black transition-colors text-black"
                                                    value={editData.date_of_birth || ''}
                                                    onChange={e => setEditData({...editData, date_of_birth: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-medium text-gray-500 pl-1">เพศ</label>
                                                <select 
                                                    className="w-full h-12 border border-gray-200 bg-white rounded-xl px-4 text-[14px] outline-none focus:border-black transition-colors text-black"
                                                    value={editData.gender || ''}
                                                    onChange={e => setEditData({...editData, gender: e.target.value})}
                                                >
                                                    <option value="">ไม่ระบุ</option>
                                                    <option value="ชาย">ชาย</option>
                                                    <option value="หญิง">หญิง</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-medium text-gray-500 pl-1">{locale === 'en' ? 'Member Tier' : 'ระดับสิทธิ์สมาชิก'}</label>
                                                <select 
                                                    className="w-full h-12 border border-gray-200 bg-white rounded-xl px-4 text-[14px] outline-none focus:border-black transition-colors text-black"
                                                    value={editData.tier}
                                                    onChange={e => setEditData({...editData, tier: e.target.value})}
                                                >
                                                    <option value="bronze">Bronze</option>
                                                    <option value="silver">Silver</option>
                                                    <option value="gold">Gold</option>
                                                    <option value="platinum">Platinum</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-medium text-gray-500 pl-1">{locale === 'en' ? 'Points Balance' : 'คะแนนสะสมคงเหลือ'}</label>
                                                <input 
                                                    type="number"
                                                    className="w-full h-12 border border-gray-200 bg-white rounded-xl px-4 text-[14px] font-semibold outline-none focus:border-black transition-colors text-black"
                                                    value={editData.points ?? 0}
                                                    onChange={e => setEditData({...editData, points: parseInt(e.target.value) || 0})}
                                                />
                                            </div>
                                        </div>

                                        {(editData.points ?? 0) !== (selectedMember.points ?? 0) && (
                                            <div className="bg-white border border-gray-200 p-6 rounded-2xl animate-in fade-in duration-300 mt-6 shadow-sm">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                                    <label className="text-[13px] font-medium text-black">
                                                        เหตุผลในการปรับปรุงแต้ม <span className="text-red-500">*จำเป็น</span>
                                                    </label>
                                                    <span className="text-[12px] text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                                                        {(selectedMember.points ?? 0).toLocaleString()} ➔ {(editData.points ?? 0).toLocaleString()}
                                                    </span>
                                                </div>
                                                <input 
                                                    type="text"
                                                    placeholder="เช่น คืนแต้มให้ลูกค้าจากบิลตกหล่น"
                                                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-[14px] outline-none focus:border-black text-black"
                                                    value={pointsReason}
                                                    onChange={e => setPointsReason(e.target.value)}
                                                />
                                            </div>
                                        )}
                                        
                                        <div className="pt-4">
                                            <button 
                                                disabled={isSaving}
                                                onClick={handleSave}
                                                className="h-12 px-8 bg-black text-white text-[14px] font-semibold rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
                                            >
                                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <>{locale === 'en' ? 'Save Changes' : 'บันทึกข้อมูล'}</>}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Ultra Clean QR Code Modal */}
            {showQR && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl w-[90%] max-w-sm p-10 flex flex-col items-center relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowQR(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black transition-colors"><X size={20}/></button>
                        <h3 className="text-xl font-semibold text-black mb-2">QR Code สมัครสมาชิก</h3>
                        <p className="text-[13px] text-gray-500 text-center mb-8">สแกนเพื่อสมัครสมาชิกผ่าน LINE</p>
                        
                        <div className="mb-10">
                            <QRCodeCanvas
                                id="member-qr-canvas-manager"
                                value={`https://line.me/R/ti/p/@xylstudio?text=${encodeURIComponent('สมัครสมาชิก')}`}
                                size={220}
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"Q"}
                            />
                        </div>

                        <button 
                            onClick={handleDownloadQR}
                            className="w-full h-12 bg-black text-white rounded-full text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                        >
                            <Download size={18} /> บันทึกภาพ
                        </button>
                    </div>
                </div>
            )}

            {/* Add New Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 flex flex-col relative shadow-2xl animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
                        
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                <UserPlus size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-black">เพิ่มสมาชิกใหม่</h3>
                                <p className="text-xs text-gray-400">ลงทะเบียนสมาชิกด้วยเบอร์โทรศัพท์</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                                    เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    placeholder="เช่น 0812345678"
                                    value={newMemberData.phone}
                                    onChange={e => setNewMemberData({ ...newMemberData, phone: e.target.value })}
                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-semibold outline-none focus:bg-white focus:border-black transition-all text-black"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                                    ชื่อสมาชิก / ชื่อเล่น (ถ้ามี)
                                </label>
                                <input
                                    type="text"
                                    placeholder="เช่น คุณสมชาย"
                                    value={newMemberData.fullName}
                                    onChange={e => setNewMemberData({ ...newMemberData, fullName: e.target.value })}
                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-semibold outline-none focus:bg-white focus:border-black transition-all text-black"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                                    แต้มสะสมเริ่มต้น
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newMemberData.points}
                                    onChange={e => setNewMemberData({ ...newMemberData, points: Number(e.target.value) })}
                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-bold text-emerald-600 outline-none focus:bg-white focus:border-black transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                                    หมายเหตุ / เหตุผลการสะสมแต้ม
                                </label>
                                <input
                                    type="text"
                                    value={newMemberData.reason}
                                    onChange={e => setNewMemberData({ ...newMemberData, reason: e.target.value })}
                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-medium outline-none focus:bg-white focus:border-black transition-all text-black"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleCreateNewMember}
                                disabled={isCreatingMember}
                                className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white bg-black hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                            >
                                {isCreatingMember ? <Loader2 size={18} className="animate-spin" /> : 'บันทึกสมาชิก'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ultra Clean CRM Settings Modal */}
            {showCrmSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowCrmSettings(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black bg-gray-50 hover:bg-gray-100 rounded-full z-10 transition-colors"><X size={20}/></button>
                        <div className="flex-1 overflow-y-auto">
                            <CrmSettingsPage />
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap');
                .font-noto { font-family: 'Noto Sans Thai', sans-serif; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                body { font-family: 'Noto Sans Thai', sans-serif; }
            `}</style>
        </div>
    )
}
