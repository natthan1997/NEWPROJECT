"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Trophy, Clock, Users, Gift, ChevronRight, Target, X } from 'lucide-react';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

interface KPIStats {
    salesProgress: number;
    salesTarget: number;
    salesReward: string;
    attendanceProgress: number;
    attendanceTarget: number;
    attendanceReward: string;
    memberProgress: number;
    memberTarget: number;
    memberReward: string;
}

export const StaffGamification = ({ profileId, branchCode }: { profileId: string, branchCode: string }) => {
    const cacheKey = `staff-gamification-${profileId}`;
    const [stats, setStats] = useState<KPIStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    // Initialize from cache on mount
    useEffect(() => {
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                setStats(JSON.parse(cached));
                setLoading(false); // Instantly stop loading if cache exists
            }
        } catch (e) {
            console.error('Error reading cache', e);
        }
    }, [cacheKey]);
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/staff/gamification-kpi', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profileId, branchCode })
                });
                const json = await res.json();
                if (json.success) {
                    setStats(json.data);
                    try {
                        localStorage.setItem(cacheKey, JSON.stringify(json.data));
                    } catch (e) {}
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (profileId && branchCode) {
            fetchStats();
        }
    }, [profileId, branchCode]);

    // GSAP removed for instant rendering

    if (loading) {
        return (
            <div className="w-full mb-6">
                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="h-5 w-32 bg-gray-200/60 rounded-full animate-pulse" />
                    <div className="h-6 w-20 bg-gray-200/60 rounded-full animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-[24px] p-4 h-[104px] shadow-[0_8px_32px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col justify-between">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                                <div className="space-y-2 flex-1 pt-1">
                                    <div className="h-3 w-1/2 bg-gray-100 rounded-full animate-pulse" />
                                    <div className="h-2 w-3/4 bg-gray-50 rounded-full animate-pulse" />
                                </div>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full animate-pulse mt-auto" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const formatCurrency = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    const getPercentage = (current: number, target: number) => Math.min(100, Math.max(0, (current / target) * 100));

    const salesPct = getPercentage(stats.salesProgress, stats.salesTarget);
    const memberPct = getPercentage(stats.memberProgress, stats.memberTarget);

    const attendanceLost = stats.attendanceProgress >= stats.attendanceTarget;
    const attendancePct = attendanceLost ? 100 : Math.max(0, 100 - ((stats.attendanceProgress / stats.attendanceTarget) * 100));

    const kpis = [
        {
            title: "ยอดขายสาขา",
            icon: <Trophy className="w-4 h-4 text-[#1D1D1F]" />,
            progress: `฿${formatCurrency(stats.salesProgress)}`,
            target: `฿${formatCurrency(stats.salesTarget)}`,
            pct: salesPct,
            reward: stats.salesReward || "โบนัสทีม 5,000.-",
            achieved: salesPct >= 100,
            lost: false
        },
        {
            title: `เบี้ยขยัน (สายได้ ${stats.attendanceTarget - 1} วัน)`,
            icon: <Clock className="w-4 h-4 text-[#1D1D1F]" />,
            progress: `สายแล้ว ${stats.attendanceProgress} วัน`,
            target: `ตัดสิทธิ์ถ้าสาย ${stats.attendanceTarget} วัน`,
            pct: attendancePct,
            reward: attendanceLost ? "ถูกตัดสิทธิ์เบี้ยขยัน" : (stats.attendanceReward || "เบี้ยขยัน 1,000.-"),
            achieved: !attendanceLost,
            lost: attendanceLost
        },
        {
            title: "หาสมาชิกร้าน",
            icon: <Users className="w-4 h-4 text-[#1D1D1F]" />,
            progress: `${stats.memberProgress} คน`,
            target: `${stats.memberTarget} คน`,
            pct: memberPct,
            reward: stats.memberReward || "โบนัสพิเศษ 2,000.-",
            achieved: memberPct >= 100,
            lost: false
        }
    ];

    return (
        <div className="w-full mb-6" ref={containerRef}>
            <div 
                className="flex items-center justify-between py-2 cursor-pointer group active:opacity-60 transition-opacity"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-gray-900 stroke-[1.5]" />
                    <h2 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider">สิทธิประโยชน์เดือนนี้</h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-gray-400">3 รายการ</span>
                    <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} strokeWidth={1.5} />
                </div>
            </div>

            {isExpanded && (
                <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                {kpis.map((kpi, index) => (
                    <div key={index} className={`bg-white rounded-[16px] p-4 relative overflow-hidden transition-all border ${kpi.lost ? 'border-red-100' : 'border-gray-100'}`}>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h3 className={`text-[12px] font-bold tracking-tight ${kpi.lost ? 'text-red-500' : 'text-gray-900'}`}>{kpi.title}</h3>
                                    <p className={`text-[10px] mt-0.5 flex items-center gap-1 font-medium ${kpi.lost ? 'text-red-400' : 'text-gray-500'}`}>
                                        {kpi.reward}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-[12px] font-bold ${kpi.lost ? 'text-red-500' : (kpi.achieved ? 'text-[#1D1D1F]' : 'text-gray-400')}`}>
                                    {kpi.pct.toFixed(0)}%
                                </span>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <div className="w-full h-1.5 bg-[#F5F5F7] rounded-full overflow-hidden mb-2">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${kpi.pct}%` }}
                                    transition={{ duration: 1.2, ease: "circOut", delay: index * 0.15 }}
                                    className={`h-full rounded-full ${kpi.lost ? 'bg-red-500' : 'bg-[#1D1D1F]'}`}
                                />
                            </div>
                            <div className={`flex justify-between text-[10px] font-medium tracking-wide ${kpi.lost ? 'text-red-400' : 'text-gray-400'}`}>
                                <span>{kpi.progress}</span>
                                <span>{kpi.target}</span>
                            </div>
                        </div>
                    </div>
                ))}
                </motion.div>
            )}
        </div>
    );
};
