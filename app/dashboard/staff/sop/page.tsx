'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import SOPStaticContent from '@/components/pos/SOPStaticContent';
import { supabase } from '@/lib/supabaseClient';

export default function StaffSOPPage() {
    const [shopSettings, setShopSettings] = useState<any>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Get current user session
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                // Get user profile to find branch_code
                const { data: profile } = await supabase
                    .from('users')
                    .select('branch_code')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (profile?.branch_code) {
                    const { data: branch } = await supabase
                        .from('branches')
                        .select('id')
                        .eq('branch_code', profile.branch_code)
                        .maybeSingle();

                    if (branch) {
                        const { data: settings } = await supabase
                            .from('pos_shop_settings')
                            .select('opening_hours')
                            .eq('branch_id', branch.id)
                            .maybeSingle();
                        
                        if (settings) {
                            setShopSettings(settings);
                        }
                    }
                } else {
                    // Fallback to first settings if no branch specific
                    const { data: settings } = await supabase
                        .from('pos_shop_settings')
                        .select('opening_hours')
                        .limit(1)
                        .maybeSingle();
                    if (settings) {
                        setShopSettings(settings);
                    }
                }
            } catch (err) {
                console.error("Error fetching SOP:", err);
            }
        };
        fetchSettings();
    }, []);

    return (
        <div className="min-h-screen bg-[#F5F5F0] text-[#4A2C11] font-sans pb-16">
            
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E5E5DF] px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/staff" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ChevronLeft size={24} className="text-[#4A2C11]" />
                    </Link>
                    <div>
                        <h1 className="text-[18px] font-black text-[#4A2C11] leading-tight">คู่มือพนักงาน (SOP)</h1>
                        <p className="text-[11px] font-medium text-gray-500">มาตรฐานการบริการและกฎระเบียบภายใน</p>
                    </div>
                </div>
                <BookOpen size={24} className="text-[#965A27] opacity-20 absolute right-6" />
            </div>

            <div className="mt-6 px-4">
                <SOPStaticContent shopSettings={shopSettings} isAdmin={false} />
            </div>
        </div>
    );
}
