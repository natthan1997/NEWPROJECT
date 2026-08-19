'use client';
import React, { useState, useEffect } from 'react'
import { 
  Menu as MenuIcon, X, ChevronRight, ArrowLeft, Search, 
  MapPin, Bell, Info, ShieldCheck, ShoppingBag, LogOut,
  Volume2, VolumeX
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import PointGenerator from './PointGenerator'
import POSOfflineSync from './POSOfflineSync'
import { useI18n } from "@/lib/I18nContext";

interface POSLayoutProps {
    children: React.ReactNode
    title: string
    subtitle?: string
    profile: any
    activeView: string
    allowedNav: any[]
    onSetView: (view: any) => void
    headerExtra?: React.ReactNode
    isDark?: boolean // For Kitchen view
    branchName?: string
    onBranchClick?: () => void
    hideHeader?: boolean
}

export default function POSLayout({ 
    children, title, subtitle, profile, activeView, 
    allowedNav, onSetView, headerExtra, isDark, branchName, onBranchClick, hideHeader 
}: POSLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const { locale } = useI18n();

    useEffect(() => {
        setIsMuted(localStorage.getItem('pos_mute_sounds') === 'true')
        
        const handleToggleSidebar = () => setIsSidebarOpen(true)
        window.addEventListener('toggle-pos-sidebar', handleToggleSidebar)
        return () => window.removeEventListener('toggle-pos-sidebar', handleToggleSidebar)
    }, [])

    const toggleMute = () => {
        const newMuted = !isMuted
        setIsMuted(newMuted)
        localStorage.setItem('pos_mute_sounds', String(newMuted))
    }

    // Determine the dashboard path based on role
    const getDashboardPath = () => {
        if (profile?.role === 'admin') return '/dashboard/admin'
        if (profile?.role === 'staff') return '/dashboard/staff'
        return '/dashboard'
    }

    const renderSidebarContent = () => (
        <>
            {/* Sidebar Header */}
            <header className={`p-6 sm:px-8 sm:py-8 border-b-0 space-y-4 sm:space-y-8 font-bold flex-shrink-0 pt-[calc(1.5rem+env(safe-area-inset-top))] sm:pt-[calc(2.5rem+env(safe-area-inset-top))]`}>
                <div className="flex justify-between items-center font-bold">
                    <div className="flex items-center gap-3">
                        <img src={isDark ? "/logo-white.png" : "/logo-red.png"} alt="RUSH UP Logo" className="h-10 w-auto object-contain shrink-0" />
                        <div className="text-left font-bold">
                            <h1 className={`text-[16px] font-black uppercase tracking-[0.1em] leading-none ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                RUSH <span className={`font-light ${isDark ? 'text-white/60' : 'text-[#C62229]'}`}>UP</span>
                            </h1>
                            <p className="text-[8px] uppercase tracking-widest text-zinc-400 mt-1 font-bold">POS System</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className={`p-2 hover:opacity-50 font-bold lg:hidden ${isDark ? 'text-white' : 'text-black'}`}><X size={20} /></button>
                </div>
            </header>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto px-6 py-2 space-y-8 no-scrollbar font-bold custom-scrollbar">
                {/* Operations Group */}
                {allowedNav.filter(item => item.group === 'operations').length > 0 && (
                    <div className="space-y-2">
                        <div className={`text-[10px] font-bold px-4 mb-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                            {locale === 'en' ? 'ใช้งานประจำวัน' : locale === 'zh' ? 'ใช้งานประจำวัน' : 'ใช้งานประจำวัน'}
                        </div>
                        {allowedNav.filter(item => item.group === 'operations').map((item, idx) => {
                            const isActive = activeView === item.id;
                            const Icon = item.icon;
                            return (
                                <button 
                                    key={item.id}
                                    onClick={() => { onSetView(item.id); setIsSidebarOpen(false); }}
                                    className={`w-full flex items-center gap-4 py-3.5 px-4 text-left transition-all duration-200 font-bold rounded-xl ${isActive ? (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600') : (isDark ? 'text-white/70 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-50')}`}
                                >
                                    {Icon && <Icon size={18} className={`flex-shrink-0 ${isActive ? '' : 'opacity-70'}`} />}
                                    <span className="text-[13px] font-bold">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Management Group */}
                {allowedNav.filter(item => item.group === 'management').length > 0 && (
                    <div className={`space-y-2 pt-4`}>
                        <div className={`text-[10px] font-bold px-4 mb-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                            {locale === 'en' ? 'จัดการระบบหลังบ้าน' : locale === 'zh' ? 'จัดการระบบหลังบ้าน' : 'จัดการระบบหลังบ้าน'}
                        </div>
                        {allowedNav.filter(item => item.group === 'management').map((item, idx) => {
                            const isActive = activeView === item.id;
                            const Icon = item.icon;
                            return (
                                <button 
                                    key={item.id}
                                    onClick={() => { onSetView(item.id); setIsSidebarOpen(false); }}
                                    className={`w-full flex items-center gap-4 py-3.5 px-4 text-left transition-all duration-200 font-bold rounded-xl ${isActive ? (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600') : (isDark ? 'text-white/70 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-50')}`}
                                >
                                    {Icon && <Icon size={18} className={`flex-shrink-0 ${isActive ? '' : 'opacity-70'}`} />}
                                    <span className="text-[13px] font-bold">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </nav>

            {/* Sidebar Footer */}
            <footer className={`p-6 flex-shrink-0`}>
                {!profile?.is_pos_account ? (
                    <Link 
                        href={getDashboardPath()}
                        className={`w-full py-4 rounded-xl text-[12px] font-black flex items-center justify-center gap-3 transition-all ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#0A0A0A] text-white hover:bg-black shadow-lg'}`}
                    >
                        <ArrowLeft size={16} /> {locale === 'en' ? 'กลับสู่ DASHBOARD' : locale === 'zh' ? 'กลับสู่ DASHBOARD' : 'กลับสู่ DASHBOARD'}
                    </Link>
                ) : (
                    <button 
                        onClick={async () => {
                            await supabase.auth.signOut()
                            window.location.href = '/login'
                        }}
                        className={`w-full py-4 rounded-xl text-[12px] font-black flex items-center justify-center gap-3 transition-all ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white shadow-lg'}`}
                    >
                        <LogOut size={16} /> {locale === 'en' ? 'ออกจากระบบ' : locale === 'zh' ? 'ออกจากระบบ' : 'ออกจากระบบ'}
                    </button>
                )}
            </footer>
        </>
    );

    // If activeView is 'settings', POSLayout just returns a wrapper.
    // The actual Settings sidebar will slide in from POSShopSettings.
    if (activeView === 'settings') {
        return (
            <div className="rushup-pos-scale h-screen h-[100dvh] flex overflow-hidden font-sans bg-[#F2F2F7] font-bold">
                <main className="flex-1 flex flex-col overflow-hidden">
                    {children}
                </main>
                <style jsx global>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 0; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
    
                    @media screen {
                        html, body {
                            overscroll-behavior-y: none;
                            scroll-behavior: smooth;
                            height: 100%;
                            overflow: hidden;
                        }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className={`print:block print:h-auto print:overflow-visible rushup-pos-scale h-screen h-[100dvh] flex overflow-hidden font-sans ${isDark ? 'bg-[#1A1A18] text-white' : 'bg-white text-[#1A1A18]'} selection:bg-sage-600/10 font-bold`}>
            
            {/* PERSISTENT SIDEBAR FOR LG SCREENS */}
            <AnimatePresence mode="wait">
                <motion.aside 
                    key="pos-sidebar"
                    initial={{ x: -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`print:hidden hidden xl:flex w-[280px] 2xl:w-[320px] h-full flex-col flex-shrink-0 font-bold border-r ${isDark ? 'bg-[#1A1A18] border-white/5' : 'bg-white border-[#E5E5DF]'}`}
                >
                    {renderSidebarContent()}
                </motion.aside>
            </AnimatePresence>

            {/* OFF-CANVAS SIDEBAR FOR MOBILE/TABLET PORTRAIT */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <div className="print:hidden fixed inset-0 z-[1000] xl:hidden flex font-bold">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/60' : 'bg-[#3a3a38]/40'}`} 
                            onClick={() => setIsSidebarOpen(false)}
                        />
                        <motion.aside 
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
                            className={`relative w-[320px] max-w-[85vw] h-full shadow-2xl flex flex-col font-bold ${isDark ? 'bg-[#1A1A18] border-r border-white/5' : 'bg-white'}`}
                        >
                            {renderSidebarContent()}
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT WRAPPER */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
                {/* 2. MAIN HEADER (Sticky) */}
                {!hideHeader && (
                <header className={`print:hidden h-[calc(60px+env(safe-area-inset-top))] sm:h-[calc(70px+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] border-b flex items-center justify-between px-3 sm:px-6 xl:px-10 sticky top-0 z-[50] flex-shrink-0 font-bold ${isDark ? 'bg-[#1A1A18] border-white/5' : 'bg-white border-[#F0F0E8]'}`}>
                    <div className="flex items-center gap-3 sm:gap-6 xl:gap-10 flex-1 font-bold min-w-[140px] sm:min-w-0 flex-shrink-0 z-10">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className={`xl:hidden w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center transition-all border font-bold flex-shrink-0 ${isDark ? 'bg-white/5 text-white border-white/10 hover:bg-white hover:text-black' : 'bg-white text-[#1A1A18] border-[#F0F0E8] hover:bg-[#1A1A18] hover:text-white shadow-sm active:scale-95'}`}
                        >
                            <MenuIcon size={18} />
                        </button>

                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 overflow-hidden">
                        <div className="flex flex-col font-bold min-w-0 overflow-hidden">
                            <span className={`text-[9px] sm:text-[10px] font-black tracking-widest uppercase leading-none mb-0.5 sm:mb-1 font-bold truncate ${isDark ? 'text-white/40' : 'text-[#818C83]'}`}>
                                {subtitle || 'RUSH UP POS'}
                            </span>
                            <h1 className={`text-[13px] sm:text-[18px] font-black tracking-tighter uppercase leading-none font-bold border-none truncate ${isDark ? 'text-white' : 'text-black'}`}>
                                {title}
                            </h1>
                        </div>

                    </div>
                </div>

                {/* HEADER SLOT FOR VIEW-SPECIFIC ACTIONS */}
                <div className="flex items-center gap-3 sm:gap-6 font-bold">
                    <button 
                        onClick={toggleMute}
                        className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center transition-all border font-bold flex-shrink-0 rounded-md ${isMuted ? (isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-100') : (isDark ? 'bg-white/5 text-white border-white/10 hover:bg-white hover:text-black' : 'bg-white text-[#1A1A18] border-[#F0F0E8] hover:bg-[#1A1A18] hover:text-white shadow-sm')}`}
                        title={isMuted ? 'เปิดเสียงแจ้งเตือน POS' : 'ปิดเสียงแจ้งเตือน POS'}
                    >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    {headerExtra}
                </div>
            </header>
            )}

            {/* 3. MAIN CONTENT CONTAINER */}
            <main className={`print:overflow-visible print:block flex-1 relative flex flex-col font-bold custom-scrollbar min-h-0 ${activeView === 'delivery' ? 'overflow-visible' : (activeView === 'terminal' || activeView === 'kitchen') ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                {children}
            </main>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 0; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }

                @media screen {
                    html, body {
                        overscroll-behavior-y: none;
                        scroll-behavior: smooth;
                        height: 100%;
                        overflow: hidden;
                    }
                }

                .rushup-pos-scale .text-xs { font-size: 0.875rem !important; line-height: 1.3rem !important; }
                .rushup-pos-scale .text-sm { font-size: 1rem !important; line-height: 1.45rem !important; }
                .rushup-pos-scale .text-base { font-size: 1.05rem !important; line-height: 1.55rem !important; }
                .rushup-pos-scale .text-\[7px\] { font-size: 0.55rem !important; }
                .rushup-pos-scale .text-\[8px\] { font-size: 0.65rem !important; }
                .rushup-pos-scale .text-\[9px\] { font-size: 0.72rem !important; }
                .rushup-pos-scale .text-\[10px\] { font-size: 0.8rem !important; }
                .rushup-pos-scale .text-\[11px\] { font-size: 0.88rem !important; }
                .rushup-pos-scale .text-\[12px\] { font-size: 0.95rem !important; }
                .rushup-pos-scale .text-\[13px\] { font-size: 1rem !important; }
                .rushup-pos-scale .text-\[14px\] { font-size: 1.06rem !important; }
                .rushup-pos-scale .text-\[15px\] { font-size: 1.12rem !important; }
            `}</style>
        </div>
    )
}
